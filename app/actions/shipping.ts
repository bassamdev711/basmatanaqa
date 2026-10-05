'use server'

import prisma from '@/lib/prisma'
import { verifyAdmin } from '@/lib/auth'
import { revalidatePath } from 'next/cache'

const MAX_SHIPPING_FEE = 1_000_000
/**
 * Delivery areas are fully managed by the admin; nothing is auto-seeded.
 * Kept as a no-op for backwards compatibility with existing callers.
 */
export async function ensureDefaultShippingCity() {
  return
}

function validateCityName(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const name = value.trim()
  return name.length >= 2 && name.length <= 120 ? name : null
}

function validateFee(value: unknown): number | null {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0 || value > MAX_SHIPPING_FEE) {
    return null
  }
  return Math.round(value * 100) / 100
}

export async function getShippingCities() {
  try {
    await verifyAdmin()
    await ensureDefaultShippingCity()
    const cities = await prisma.shippingCity.findMany({
      orderBy: { name: 'asc' },
    })
    return { success: true, data: cities }
  } catch (error) {
    console.error('Error fetching shipping cities:', error)
    return { success: false, error: 'غير مصرح أو حدث خطأ أثناء جلب مناطق التوصيل' }
  }
}

export async function addShippingCity(data: { name: string; shippingFee: number; isActive?: boolean }) {
  try {
    await verifyAdmin()
    const name = validateCityName(data?.name)
    const shippingFee = validateFee(data?.shippingFee)

    if (!name || shippingFee === null || (data.isActive !== undefined && typeof data.isActive !== 'boolean')) {
      return { success: false, error: 'بيانات المنطقة أو رسوم الشحن غير صالحة' }
    }

    const existing = await prisma.shippingCity.findUnique({ where: { name } })
    if (existing) {
      return { success: false, error: 'هذه المنطقة موجودة مسبقاً' }
    }

    const city = await prisma.shippingCity.create({
      data: { name, shippingFee, isActive: data.isActive ?? true },
    })

    revalidatePath('/admin/shipping-settings')
    revalidatePath('/checkout')
    return { success: true, data: city }
  } catch (error) {
    console.error('Error adding shipping city:', error)
    return { success: false, error: 'غير مصرح أو حدث خطأ أثناء إضافة المنطقة' }
  }
}

export async function updateShippingCity(id: string, data: { name?: string; shippingFee?: number; isActive?: boolean }) {
  try {
    await verifyAdmin()
    if (typeof id !== 'string' || id.length < 1 || id.length > 100) {
      return { success: false, error: 'معرف المنطقة غير صالح' }
    }

    const updateData: { name?: string; shippingFee?: number; isActive?: boolean } = {}
    if (data.name !== undefined) {
      const name = validateCityName(data.name)
      if (!name) return { success: false, error: 'اسم المنطقة غير صالح' }
      updateData.name = name
    }
    if (data.shippingFee !== undefined) {
      const shippingFee = validateFee(data.shippingFee)
      if (shippingFee === null) return { success: false, error: 'رسوم الشحن غير صالحة' }
      updateData.shippingFee = shippingFee
    }
    if (data.isActive !== undefined) {
      if (typeof data.isActive !== 'boolean') return { success: false, error: 'حالة المنطقة غير صالحة' }
      updateData.isActive = data.isActive
    }

    if (Object.keys(updateData).length === 0) {
      return { success: false, error: 'لا توجد بيانات لتحديثها' }
    }

    const city = await prisma.shippingCity.update({ where: { id }, data: updateData })
    revalidatePath('/admin/shipping-settings')
    revalidatePath('/checkout')
    return { success: true, data: city }
  } catch (error) {
    console.error('Error updating shipping city:', error)
    return { success: false, error: 'غير مصرح أو حدث خطأ أثناء تحديث المنطقة' }
  }
}

export async function deleteShippingCity(id: string) {
  try {
    await verifyAdmin()
    if (typeof id !== 'string' || id.length < 1 || id.length > 100) {
      return { success: false, error: 'معرف المنطقة غير صالح' }
    }

    await prisma.shippingCity.delete({ where: { id } })
    revalidatePath('/admin/shipping-settings')
    revalidatePath('/checkout')
    return { success: true }
  } catch (error) {
    console.error('Error deleting shipping city:', error)
    return { success: false, error: 'غير مصرح أو حدث خطأ أثناء حذف المنطقة' }
  }
}
