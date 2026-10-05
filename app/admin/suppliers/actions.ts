'use server'

import prisma from '@/lib/prisma'
import { verifyAdmin } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const supplierSchema = z.object({
  name: z.string().trim().min(2).max(120),
  phone: z.string().trim().max(30).optional().nullable(),
  whatsapp: z.string().trim().max(30).optional().nullable(),
  email: z.string().trim().email().max(254).optional().nullable().or(z.literal('')),
  address: z.string().trim().max(300).optional().nullable(),
  notes: z.string().trim().max(1000).optional().nullable(),
  isActive: z.boolean().default(true),
})

export async function getSuppliers() {
  await verifyAdmin()
  return prisma.supplier.findMany({
    orderBy: { createdAt: 'desc' },
    include: { _count: { select: { products: true } } },
  })
}

export async function getSupplier(id: string) {
  await verifyAdmin()
  return prisma.supplier.findUnique({
    where: { id },
    include: {
      products: {
        select: { id: true, name: true, imageUrl: true, price: true, costPrice: true, isActive: true },
        orderBy: { name: 'asc' },
      },
      _count: { select: { products: true } },
    },
  })
}

export async function createSupplier(data: unknown) {
  await verifyAdmin()
  const parsed = supplierSchema.safeParse(data)
  if (!parsed.success) return { success: false, error: 'بيانات المورد غير صالحة' }
  const supplier = await prisma.supplier.create({ data: parsed.data })
  revalidatePath('/admin/suppliers')
  return { success: true, supplier }
}

export async function updateSupplier(id: string, data: unknown) {
  await verifyAdmin()
  const parsed = supplierSchema.safeParse(data)
  if (!parsed.success) return { success: false, error: 'بيانات المورد غير صالحة' }
  const supplier = await prisma.supplier.update({ where: { id }, data: parsed.data })
  revalidatePath('/admin/suppliers')
  return { success: true, supplier }
}

export async function deleteSupplier(id: string) {
  await verifyAdmin()
  // فك ارتباط المنتجات قبل الحذف
  await prisma.product.updateMany({ where: { supplierId: id }, data: { supplierId: null } })
  await prisma.supplier.delete({ where: { id } })
  revalidatePath('/admin/suppliers')
  return { success: true }
}

export async function assignSupplierToProduct(productId: string, supplierId: string | null) {
  await verifyAdmin()
  await prisma.product.update({ where: { id: productId }, data: { supplierId } })
  revalidatePath('/admin/products')
  revalidatePath('/admin/suppliers')
  return { success: true }
}

// تفكيك الطلب حسب الموردين
export async function getOrderBySupplier(orderId: string) {
  await verifyAdmin()
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      items: {
        include: {
          product: {
            include: { supplier: true },
          },
          variant: true,
        },
      },
    },
  })
  if (!order) return null

  // تجميع عناصر الطلب حسب المورد
  const supplierMap = new Map<string, {
    supplier: { id: string; name: string; phone?: string | null; whatsapp?: string | null } | null
    items: typeof order.items
    subtotal: number
  }>()

  for (const item of order.items) {
    const supplier = item.product?.supplier ?? null
    const key = supplier?.id ?? '__no_supplier__'
    if (!supplierMap.has(key)) {
      supplierMap.set(key, {
        supplier: supplier ? { id: supplier.id, name: supplier.name, phone: supplier.phone, whatsapp: supplier.whatsapp } : null,
        items: [],
        subtotal: 0,
      })
    }
    const entry = supplierMap.get(key)!
    entry.items.push(item)
    entry.subtotal += Number(item.price) * item.quantity
  }

  return {
    order: {
      ...order,
      totalAmount: Number(order.totalAmount),
      shippingFee: Number(order.shippingFee),
    },
    bySupplier: Array.from(supplierMap.values()).map(s => ({
      ...s,
      items: s.items.map(i => ({
        ...i,
        price: Number(i.price),
      })),
    })),
  }
}
