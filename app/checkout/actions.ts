'use server'

import prisma from '@/lib/prisma'
import { headers } from 'next/headers'
import crypto from 'crypto'
import { checkRateLimit } from '@/lib/rate-limit'
import { CheckoutData } from '@/components/CheckoutProvider'
import { CartItem } from '@/components/CartProvider'
import { validateCouponCode } from '@/app/admin/marketing/coupons/actions'
import { createAdminNotification } from '@/lib/admin-notifications'
import { createOrderUploadToken, verifyOrderUploadToken } from '@/lib/order-upload-token'
import { createOrderTrackingToken } from '@/lib/order-tracking-token'
import { requireCurrentUser, getCurrentUser } from '@/lib/user-auth'
import { createUserNotification } from '@/lib/notifications/service'

const PAYMENT_METHODS = new Set(['cod', 'bank_transfer', 'wallets', 'customer_service'])
const RECEIPT_PAYMENT_METHODS = new Set(['bank_transfer', 'wallets'])

function getClientIp(value: string | null): string {
  const forwarded = value?.split(',').map((part) => part.trim()).filter(Boolean)
  return (forwarded?.at(-1) || '127.0.0.1').slice(0, 64)
}

function normalizeText(value: unknown, maxLength: number): string {
  return typeof value === 'string' ? value.trim().slice(0, maxLength) : ''
}

function getOrderPrefix(value: string | null | undefined): string {
  const prefix = (value || '').toUpperCase().replace(/[^A-Z0-9]+/g, '').slice(0, 8)
  return prefix || 'STORE'
}

function isValidCheckoutData(data: CheckoutData): boolean {
  const fullName = normalizeText(data.fullName, 120)
  const phone = normalizeText(data.phone, 32)
  const area = normalizeText(data.city, 120)
  const address = normalizeText(data.address, 500)

  return (
    fullName.length >= 2 &&
    phone.length >= 7 &&
    /^[+\d\s().-]+$/.test(phone) &&
    area.length >= 2 &&
    address.length >= 5 &&
    PAYMENT_METHODS.has(data.paymentMethod)
  )
}

export async function createOrder(
  checkoutData: CheckoutData,
  cartItems: CartItem[],
  _clientCartTotal: number,
  couponCode?: string,
  _legacyPaymentProofUrl?: string,
  transactionId?: string,
  idempotencyKey?: string,
  pointsUsed?: number,
) {
  try {
    const authenticatedUser = await getCurrentUser()
    const headersList = await headers()
    const ip = getClientIp(headersList.get('x-forwarded-for'))
    const requestKey = typeof idempotencyKey === 'string' ? idempotencyKey.trim().slice(0, 128) : ''

    if (!requestKey || !/^[A-Za-z0-9_-]{20,128}$/.test(requestKey)) {
      return { success: false, error: 'تعذر التحقق من جلسة الطلب. يرجى تحديث الصفحة والمحاولة مرة أخرى.' }
    }

    const existingOrder = await prisma.order.findFirst({
      where: authenticatedUser
        ? { idempotencyKey: requestKey, userId: authenticatedUser.id }
        : { idempotencyKey: requestKey, userId: null },
      select: { id: true, paymentMethod: true },
    })
    if (existingOrder) {
      const paymentUploadToken = RECEIPT_PAYMENT_METHODS.has(existingOrder.paymentMethod)
        ? await createOrderUploadToken(existingOrder.id)
        : undefined
      const trackingToken = await createOrderTrackingToken(existingOrder.id)
      return { success: true, orderId: existingOrder.id, paymentUploadToken, trackingToken }
    }

    if (!checkRateLimit(`order_${ip}`, 3, 900000)) {
      return { success: false, error: 'لقد تجاوزت الحد المسموح به لإنشاء الطلبات. يرجى المحاولة بعد 15 دقيقة.' }
    }

    if (!checkoutData || !isValidCheckoutData(checkoutData)) {
      return { success: false, error: 'بيانات الشحن غير مكتملة أو غير صالحة.' }
    }

    if (!Array.isArray(cartItems) || cartItems.length === 0 || cartItems.length > 100) {
      return { success: false, error: 'السلة فارغة أو تحتوي على عدد غير صالح من العناصر.' }
    }

    if (cartItems.some((item) => (
      !item || typeof item !== 'object' || typeof item.id !== 'string' || item.id.trim().length === 0 ||
      !Number.isInteger(item.quantity) || item.quantity <= 0 || item.quantity > 1000
    ))) {
      return { success: false, error: 'كمية المنتجات غير صالحة.' }
    }

    const parsedItems = cartItems.map((item) => {
      const parts = item.id.split('-')
      // If item has a selectedSize, it's a dynamic size, not a variant.
      // The id format is: product.id-size. So variantId should be null.
      const isVariant = parts.length > 1 && !item.selectedSize
      return {
        originalId: item.id,
        productId: parts[0],
        variantId: isVariant ? parts.slice(1).join('-') : null,
        quantity: item.quantity,
        selectedSize: item.selectedSize || null,
      }
    })

    const productIds = Array.from(new Set(parsedItems.map((item) => item.productId)))
    const dbProducts = await prisma.product.findMany({
      where: { id: { in: productIds }, isActive: true },
      include: { 
        variants: true,
        offers: {
          where: {
            isActive: true,
            endDate: { gt: new Date() }
          },
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      },
    })

    if (dbProducts.length !== productIds.length) {
      return { success: false, error: 'بعض المنتجات في سلتك لم تعد متوفرة.' }
    }

    let calculatedCartTotal = 0
    const orderItemsData: { productId: string; variantId?: string | null; quantity: number; price: number; selectedSize?: string | null }[] = []

    for (const item of parsedItems) {
      const dbProduct = dbProducts.find((product) => product.id === item.productId)
      if (!dbProduct) return { success: false, error: 'منتج غير موجود.' }

      let stockToCheck = dbProduct.stock
      let itemPrice = Number(dbProduct.price)

      if (item.variantId) {
        const variant = dbProduct.variants.find((candidate) => candidate.id === item.variantId)
        if (!variant) return { success: false, error: `الخيار المحدد لمنتج "${dbProduct.name}" غير موجود.` }
        stockToCheck = variant.stock
        itemPrice = Number(variant.price)
      }

      // Apply Offer Price if valid (Overriding product and variant prices)
      if (dbProduct.offers && dbProduct.offers.length > 0) {
        itemPrice = Number(dbProduct.offers[0].offerPrice)
      }

      if (!Number.isFinite(itemPrice) || itemPrice < 0 || stockToCheck < item.quantity) {
        return { success: false, error: `الكمية المطلوبة من "${dbProduct.name}" غير متوفرة.` }
      }

      calculatedCartTotal += itemPrice * item.quantity
      orderItemsData.push({
        productId: item.productId,
        variantId: item.variantId,
        quantity: item.quantity,
        price: itemPrice,
        selectedSize: item.selectedSize,
      })
    }

    const storeSettings = await prisma.storeSettings.findUnique({ where: { id: 'singleton' } })
    const activeAreas = await prisma.shippingCity.findMany({ where: { isActive: true } })
    if (activeAreas.length === 0) {
      return { success: false, error: 'لا توجد مناطق توصيل متاحة حالياً.' }
    }
    const selectedArea = activeAreas.find((area) => area.name === normalizeText(checkoutData.city, 120))
    if (!selectedArea) return { success: false, error: 'منطقة التوصيل المحددة غير مدعومة.' }
    let shippingFee = Number(selectedArea.shippingFee)
    if (!Number.isFinite(shippingFee) || shippingFee < 0) {
      return { success: false, error: 'رسوم الشحن غير صالحة.' }
    }

    let discountAmount = 0
    let validatedCouponId: string | null = null
    if (couponCode) {
      const normalizedCoupon = normalizeText(couponCode, 64).toUpperCase()
      const couponResult = await validateCouponCode(normalizedCoupon, calculatedCartTotal)
      if (couponResult.valid && couponResult.coupon) {
        discountAmount = couponResult.coupon.discountAmount
        validatedCouponId = couponResult.coupon.id
      }
    }

    const discountedCartTotal = Math.max(0, calculatedCartTotal - discountAmount)
    const freeThreshold = storeSettings ? Number(storeSettings.freeShippingThreshold) : 0
    if (Number.isFinite(freeThreshold) && freeThreshold > 0 && discountedCartTotal >= freeThreshold) {
      shippingFee = 0
    }

    const paymentSettings = await prisma.paymentSettings.upsert({
      where: { id: 'singleton' },
      update: {},
      create: { id: 'singleton' },
    })
    if (checkoutData.paymentMethod === 'cod' && !paymentSettings.codEnabled) {
      return { success: false, error: 'طريقة الدفع المختارة غير متاحة حالياً.' }
    }
    if (checkoutData.paymentMethod === 'bank_transfer') {
      if (!paymentSettings.bankTransferEnabled) {
        return { success: false, error: 'التحويل البنكي غير متاح حالياً.' }
      }
      const bankAccountCount = await prisma.bankAccount.count({ where: { isActive: true } })
      if (bankAccountCount === 0) {
        return { success: false, error: 'لا توجد حسابات بنكية متاحة حالياً.' }
      }
    }
    if (checkoutData.paymentMethod === 'wallets') {
      if (!paymentSettings.walletsEnabled) {
        return { success: false, error: 'المحافظ الإلكترونية غير متاحة حالياً.' }
      }
      const walletCount = await prisma.digitalWallet.count({ where: { isActive: true } })
      if (walletCount === 0) {
        return { success: false, error: 'لا توجد محافظ إلكترونية متاحة حالياً.' }
      }
    }
    if (checkoutData.paymentMethod === 'cod') {
      const codFee = Number(paymentSettings.codFee)
      if (Number.isFinite(codFee) && codFee > 0) shippingFee += codFee
    }

    let pointsDiscountValue = 0
    let pointsToUse = 0
    if (pointsUsed && pointsUsed > 0) {
      if (!authenticatedUser) {
        return { success: false, error: 'يجب تسجيل الدخول لاستخدام نقاط الولاء.' }
      }
      
      const loyaltySettings = await prisma.loyaltySettings.findUnique({ where: { id: 'singleton' } })
      if (loyaltySettings?.isEnabled && loyaltySettings?.redeemEnabled) {
        const userAccount = await prisma.loyaltyAccount.findUnique({ where: { userId: authenticatedUser.id } })
        if (userAccount && userAccount.balance >= pointsUsed) {
          const pointVal = Number(loyaltySettings.pointsValue) || 1
          const requestedDiscount = pointsUsed * pointVal
          const preTotal = discountedCartTotal + shippingFee
          
          pointsDiscountValue = Math.min(requestedDiscount, preTotal)
          pointsToUse = pointsDiscountValue / pointVal // only use what's actually discounted
        } else {
          return { success: false, error: 'رصيد نقاط الولاء غير كافٍ.' }
        }
      } else {
        return { success: false, error: 'استخدام نقاط الولاء غير متاح حالياً.' }
      }
    }

    const finalTotal = discountedCartTotal + shippingFee - pointsDiscountValue
    const paymentStatus = checkoutData.paymentMethod === 'customer_service' ? 'AWAITING_CUSTOMER_SERVICE' : 'PENDING'
    const transaction = normalizeText(transactionId, 100) || null
    const year = new Date().getFullYear()
    const orderNumber = `${getOrderPrefix(storeSettings?.storeNameLatin || storeSettings?.storeName)}-${year}-${crypto.randomUUID().replaceAll('-', '').slice(0, 10).toUpperCase()}`

    const order = await prisma.$transaction(async (tx) => {
      const newOrder = await tx.order.create({
        data: {
          userId: authenticatedUser?.id || null,
          orderNumber,
          idempotencyKey: requestKey,
          customerName: normalizeText(checkoutData.fullName, 120),
          customerPhone: normalizeText(checkoutData.phone, 32),
          governorate: selectedArea.name,
          city: selectedArea.name,
          address: normalizeText(checkoutData.address, 500),
          paymentMethod: checkoutData.paymentMethod,
          shippingFee,
          totalAmount: finalTotal,
          pointsUsed: pointsToUse,
          pointsDiscount: pointsDiscountValue,
          paymentStatus,
          status: 'NEW',
          couponId: validatedCouponId,
          paymentProofUrl: null,
          transactionId: transaction,
          items: { create: orderItemsData },
        },
      })

      if (authenticatedUser) {
        await tx.user.updateMany({
          where: { id: authenticatedUser.id },
          data: {
            name: normalizeText(checkoutData.fullName, 120),
            phone: normalizeText(checkoutData.phone, 32)
          }
        })
      }

      if (pointsToUse > 0 && authenticatedUser) {
        const userAccount = await tx.loyaltyAccount.findUnique({ where: { userId: authenticatedUser.id } })
        if (userAccount) {
          const updateResult = await tx.loyaltyAccount.updateMany({
            where: {
              id: userAccount.id,
              balance: { gte: pointsToUse }
            },
            data: {
              balance: { decrement: pointsToUse },
              lifetimeRedeemed: { increment: pointsToUse }
            }
          })

          if (updateResult.count !== 1) {
            throw new Error('INSUFFICIENT_POINTS')
          }

          const newBalance = userAccount.balance - pointsToUse
          await tx.loyaltyTransaction.create({
            data: {
              userId: authenticatedUser.id,
              accountId: userAccount.id,
              type: 'REDEEM',
              points: pointsToUse,
              balanceAfter: newBalance,
              orderId: newOrder.id,
              description: `استخدام نقاط في الطلب #${newOrder.orderNumber}`,
              referenceKey: `REDEEM_${newOrder.id}_${Date.now()}`
            }
          })
        }
      }

      for (const item of orderItemsData) {
        const updateResult = item.variantId
          ? await tx.productVariant.updateMany({
              where: { id: item.variantId, stock: { gte: item.quantity } },
              data: { stock: { decrement: item.quantity } },
            })
          : await tx.product.updateMany({
              where: { id: item.productId, isActive: true, stock: { gte: item.quantity } },
              data: { stock: { decrement: item.quantity } },
            })

        if (updateResult.count !== 1) {
          throw new Error('STOCK_UNAVAILABLE')
        }
      }

      if (validatedCouponId) {
        const currentCoupon = await tx.coupon.findUnique({ where: { id: validatedCouponId } })
        if (!currentCoupon || !currentCoupon.isActive || (currentCoupon.expiresAt && currentCoupon.expiresAt <= new Date())) {
          throw new Error('COUPON_UNAVAILABLE')
        }

        const couponUpdate = currentCoupon.maxUses === null
          ? await tx.coupon.updateMany({
              where: { id: validatedCouponId, isActive: true },
              data: { usedCount: { increment: 1 } },
            })
          : await tx.coupon.updateMany({
              where: {
                id: validatedCouponId,
                isActive: true,
                usedCount: { lt: currentCoupon.maxUses },
              },
              data: { usedCount: { increment: 1 } },
            })

        if (couponUpdate.count !== 1) throw new Error('COUPON_UNAVAILABLE')
      }

      return newOrder
    })

    await createAdminNotification({
      type: 'order',
      title: 'طلب جديد',
      body: `طلب جديد رقم ${order.orderNumber} بقيمة ${finalTotal} ${paymentSettings?.currency || 'ر.س'}`,
      url: `/admin/orders/${order.id}`,
      dedupeKey: `order:${order.id}:created`,
    })
    if (authenticatedUser) {
      await createUserNotification({
        userId: authenticatedUser.id,
        type: 'ORDER_CREATED',
        title: 'تم استلام طلبك',
        message: `تم إنشاء طلبك رقم ${order.orderNumber}.`,
        dedupeKey: `ORDER_CREATED:${order.id}`,
      })
    }

    const paymentUploadToken = RECEIPT_PAYMENT_METHODS.has(checkoutData.paymentMethod)
      ? await createOrderUploadToken(order.id)
      : undefined
    const trackingToken = await createOrderTrackingToken(order.id)

    return { success: true, orderId: order.id, paymentUploadToken, trackingToken }
  } catch (error: unknown) {
    if (error instanceof Error) {
      if (error.message === 'UNAUTHORIZED') return { success: false, error: 'يجب تسجيل الدخول لإتمام الطلب.' }
      if (error.message === 'INSUFFICIENT_POINTS') return { success: false, error: 'رصيد نقاط الولاء غير كافٍ.' }
      if (error.message === 'STOCK_UNAVAILABLE') return { success: false, error: 'الكمية المطلوبة من بعض المنتجات لم تعد متوفرة.' }
      if (error.message === 'COUPON_UNAVAILABLE') return { success: false, error: 'الكوبون المستخدم لم يعد صالحاً أو تجاوز حد الاستخدام.' }
    }
    const errorCode = typeof error === 'object' && error !== null && 'code' in error
      ? (error as { code?: unknown }).code
      : undefined
    if (errorCode === 'P2002') {
      return { success: false, error: 'تم استلام الطلب مسبقاً. يرجى تحديث الصفحة.' }
    }
    console.error('Failed to create order:', error)
    return { success: false, error: 'حدث خطأ أثناء إنشاء الطلب.' }
  }
}

export async function updateOrderPaymentProof(
  orderId: string,
  paymentProofUrl: string,
  transactionId?: string,
  uploadToken?: string,
) {
  try {
    if (!orderId || !paymentProofUrl || !uploadToken || !(await verifyOrderUploadToken(uploadToken, orderId))) {
      return { success: false, error: 'غير مصرح بتحديث إثبات الدفع.' }
    }

    if (!checkRateLimit(`proof_${orderId}`, 5, 60 * 60 * 1000)) {
      return { success: false, error: 'تم تجاوز الحد المسموح لرفع الإيصالات لهذا الطلب.' }
    }

    const currentOrder = await prisma.order.findUnique({ where: { id: orderId } })
    if (!currentOrder) return { success: false, error: 'الطلب غير موجود.' }
    if (!RECEIPT_PAYMENT_METHODS.has(currentOrder.paymentMethod) || !['PENDING', 'FAILED', 'AWAITING_CONFIRMATION'].includes(currentOrder.paymentStatus)) {
      return { success: false, error: 'لا يمكن إرفاق إيصال لهذا الطلب في حالته الحالية.' }
    }

    await prisma.order.updateMany({
      where: { id: orderId, paymentStatus: { in: ['PENDING', 'FAILED', 'AWAITING_CONFIRMATION'] } },
      data: {
        paymentProofUrl,
        transactionId: normalizeText(transactionId, 100) || undefined,
        paymentStatus: 'AWAITING_CONFIRMATION',
      },
    })

    await createAdminNotification({
      type: 'order',
      title: 'إثبات دفع جديد',
      body: `تم رفع إثبات دفع للطلب رقم ${currentOrder.orderNumber}`,
      url: `/admin/orders/${currentOrder.id}`,
      dedupeKey: `order:${currentOrder.id}:payment-proof`,
    })

    return { success: true }
  } catch (error) {
    console.error('Failed to update order payment proof:', error)
    return { success: false, error: 'حدث خطأ أثناء حفظ إثبات الدفع.' }
  }
}

export async function getPaymentMethods() {
  const settings = await prisma.paymentSettings.upsert({
    where: { id: 'singleton' },
    update: {},
    create: { id: 'singleton' },
  })
  const storeSettings = await prisma.storeSettings.findUnique({ where: { id: 'singleton' } })
  const bankAccounts = await prisma.bankAccount.findMany({
    where: { isActive: true },
    orderBy: { createdAt: 'desc' },
  })
  const digitalWallets = await prisma.digitalWallet.findMany({
    where: { isActive: true },
    orderBy: { createdAt: 'desc' },
  })
  const shippingCities = await prisma.shippingCity.findMany({
    where: { isActive: true },
    orderBy: { name: 'asc' },
  })

  let loyaltyInfo = null
  let userInfo = null
  try {
    const { getCurrentUser } = await import('@/lib/user-auth')
    const user = await getCurrentUser()
    if (user) {
      userInfo = { name: user.name, phone: user.phone }
      const loyaltySettings = await prisma.loyaltySettings.findUnique({ where: { id: 'singleton' } })
      if (loyaltySettings?.isEnabled && loyaltySettings?.redeemEnabled) {
        const account = await prisma.loyaltyAccount.findUnique({ where: { userId: user.id } })
        loyaltyInfo = {
          balance: account?.balance || 0,
          pointsValue: Number(loyaltySettings.pointsValue) || 1,
        }
      }
    }
  } catch (e) {
    // ignore
  }

  return {
    settings: {
      bankTransferEnabled: settings.bankTransferEnabled,
      bankTransferInstructions: settings.bankTransferInstructions,
      walletsEnabled: settings.walletsEnabled,
      walletsInstructions: settings.walletsInstructions,
      codEnabled: settings.codEnabled,
      codFee: Number(settings.codFee),
      codInstructions: settings.codInstructions,
      currency: settings.currency,
      customerServiceEnabled: true,
    },
    storeSettings: {
      shippingFee: Number(storeSettings?.shippingFee || 0),
      freeShippingThreshold: Number(storeSettings?.freeShippingThreshold || 0),
    },
    shippingCities: shippingCities.map((city) => ({
      id: city.id,
      name: city.name,
      shippingFee: Number(city.shippingFee),
    })),
    bankAccounts: bankAccounts.map((account) => ({
      id: account.id,
      bankName: account.bankName,
      accountName: account.accountName,
      accountNumber: account.accountNumber,
      logoUrl: account.logoUrl,
      colorHex: account.colorHex,
    })),
    digitalWallets: digitalWallets.map((wallet) => ({
      id: wallet.id,
      walletName: wallet.walletName,
      accountNumber: wallet.accountNumber,
      logoUrl: wallet.logoUrl,
      colorHex: wallet.colorHex,
    })),
    loyaltyInfo,
    userInfo,
  }
}
