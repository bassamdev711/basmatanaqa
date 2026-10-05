'use server'

import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { getCurrency } from '@/lib/currency'
import { verifyAdmin } from '@/lib/auth'

const COUPON_CODE_PATTERN = /^[A-Z0-9_-]{3,64}$/
const COUPON_TYPES = new Set(['PERCENTAGE', 'FIXED'])

function parseCouponForm(formData: FormData) {
  const code = typeof formData.get('code') === 'string' ? String(formData.get('code')).trim().toUpperCase() : ''
  const descriptionValue = formData.get('description')
  const description = typeof descriptionValue === 'string' ? descriptionValue.trim().slice(0, 500) : null
  const type = typeof formData.get('type') === 'string' ? String(formData.get('type')) : ''
  const value = Number(formData.get('value'))
  const minOrderRaw = formData.get('minOrderAmount')
  const maxUsesRaw = formData.get('maxUses')
  const expiresRaw = formData.get('expiresAt')
  const minOrderAmount = minOrderRaw === null || minOrderRaw === '' ? null : Number(minOrderRaw)
  const maxUses = maxUsesRaw === null || maxUsesRaw === '' ? null : Number(maxUsesRaw)
  const expiresAt = expiresRaw === null || expiresRaw === '' ? null : new Date(String(expiresRaw))
  const isActive = formData.get('isActive') === 'on'

  if (!COUPON_CODE_PATTERN.test(code)) return { error: 'رمز الكوبون يجب أن يحتوي على 3 إلى 64 حرفًا أو رقمًا.' }
  if (!COUPON_TYPES.has(type)) return { error: 'نوع الكوبون غير صالح.' }
  if (!Number.isFinite(value) || value <= 0 || (type === 'PERCENTAGE' && value > 100)) {
    return { error: 'قيمة الخصم غير صالحة.' }
  }
  if (minOrderAmount !== null && (!Number.isFinite(minOrderAmount) || minOrderAmount < 0)) {
    return { error: 'الحد الأدنى للطلب غير صالح.' }
  }
  if (maxUses !== null && (!Number.isInteger(maxUses) || maxUses <= 0)) {
    return { error: 'الحد الأقصى للاستخدام يجب أن يكون عددًا صحيحًا موجبًا.' }
  }
  if (expiresAt !== null && Number.isNaN(expiresAt.getTime())) {
    return { error: 'تاريخ انتهاء الكوبون غير صالح.' }
  }

  return {
    data: {
      code,
      description: description || undefined,
      type,
      value,
      minOrderAmount: minOrderAmount ?? undefined,
      maxUses: maxUses ?? undefined,
      expiresAt: expiresAt ?? undefined,
      isActive,
    },
  }
}

export async function createCoupon(formData: FormData) {
  await verifyAdmin()
  const parsed = parseCouponForm(formData)
  if ('error' in parsed) return parsed

  await prisma.coupon.create({ data: parsed.data })
  revalidatePath('/admin/marketing/coupons')
  redirect('/admin/marketing/coupons')
}

export async function updateCoupon(formData: FormData) {
  await verifyAdmin()
  const id = typeof formData.get('id') === 'string' ? String(formData.get('id')).trim() : ''
  if (!id || id.length > 128) return { error: 'معرّف الكوبون غير صالح.' }

  const parsed = parseCouponForm(formData)
  if ('error' in parsed) return parsed

  await prisma.coupon.update({ where: { id }, data: parsed.data })
  revalidatePath('/admin/marketing/coupons')
  redirect('/admin/marketing/coupons')
}

export async function deleteCoupon(id: string) {
  await verifyAdmin()
  if (typeof id !== 'string' || !id.trim() || id.length > 128) return { success: false, error: 'معرّف الكوبون غير صالح.' }
  await prisma.coupon.delete({ where: { id: id.trim() } })
  revalidatePath('/admin/marketing/coupons')
  return { success: true }
}

export async function toggleCoupon(id: string, isActive: boolean) {
  await verifyAdmin()
  if (typeof id !== 'string' || !id.trim() || typeof isActive !== 'boolean') return { success: false, error: 'بيانات غير صالحة.' }
  await prisma.coupon.update({ where: { id: id.trim() }, data: { isActive } })
  revalidatePath('/admin/marketing/coupons')
  return { success: true }
}

export async function validateCouponCode(code: string, orderTotal: number) {
  const normalizedCode = typeof code === 'string' ? code.trim().toUpperCase() : ''
  if (!COUPON_CODE_PATTERN.test(normalizedCode) || !Number.isFinite(orderTotal) || orderTotal < 0) {
    return { valid: false, error: 'بيانات الكوبون غير صالحة' }
  }

  const currency = await getCurrency()
  const coupon = await prisma.coupon.findUnique({ where: { code: normalizedCode } })

  if (!coupon) return { valid: false, error: 'الكوبون غير موجود' }
  if (!coupon.isActive) return { valid: false, error: 'هذا الكوبون غير مفعّل' }
  if (coupon.expiresAt && coupon.expiresAt < new Date()) return { valid: false, error: 'انتهت صلاحية هذا الكوبون' }
  if (coupon.maxUses !== null && coupon.usedCount >= coupon.maxUses) return { valid: false, error: 'تم استنفاد الحد الأقصى لاستخدام هذا الكوبون' }
  if (coupon.minOrderAmount !== null && orderTotal < Number(coupon.minOrderAmount)) {
    return { valid: false, error: `الحد الأدنى للطلب لاستخدام هذا الكوبون هو ${Number(coupon.minOrderAmount).toLocaleString('ar-SA')} ${currency}` }
  }

  const discountAmount = coupon.type === 'PERCENTAGE'
    ? Math.min(orderTotal, (orderTotal * Number(coupon.value)) / 100)
    : Math.min(Number(coupon.value), orderTotal)

  return {
    valid: true,
    coupon: {
      id: coupon.id,
      code: coupon.code,
      type: coupon.type,
      value: Number(coupon.value),
      discountAmount: Math.round(discountAmount * 100) / 100,
      minOrderAmount: coupon.minOrderAmount ? Number(coupon.minOrderAmount) : null,
    },
  }
}
