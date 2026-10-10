'use server'

import { verifyAdmin } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function getLoyaltySettings() {
  await verifyAdmin()
  const settings = await prisma.loyaltySettings.upsert({
    where: { id: 'singleton' },
    update: {},
    create: {
      id: 'singleton',
    },
  })
  
  return {
    isEnabled: settings.isEnabled,
    pointsPerUnit: Number(settings.pointsPerUnit),
    minimumOrderAmount: Number(settings.minimumOrderAmount),
    redeemEnabled: settings.redeemEnabled,
    pointsValue: Number(settings.pointsValue),
    welcomeBonus: settings.welcomeBonus,
    expiryEnabled: settings.expiryEnabled,
    pointsExpiryDays: settings.pointsExpiryDays,
    maxPointsPerOrder: settings.maxPointsPerOrder,
  }
}

export async function updateLoyaltySettings(formData: FormData) {
  await verifyAdmin()
  
  try {
    const isEnabled = formData.get('isEnabled') === 'on'
    const redeemEnabled = formData.get('redeemEnabled') === 'on'
    const pointsPerUnit = Number(formData.get('pointsPerUnit')) || 100
    const pointsValue = Number(formData.get('pointsValue')) || 1
    const minimumOrderAmount = Number(formData.get('minimumOrderAmount')) || 0
    const welcomeBonus = Number(formData.get('welcomeBonus')) || 0
    const expiryEnabled = formData.get('expiryEnabled') === 'on'
    const pointsExpiryDays = Number(formData.get('pointsExpiryDays')) || 30
    
    let maxPointsPerOrder = null
    const maxPointsInput = formData.get('maxPointsPerOrder')
    if (maxPointsInput && Number(maxPointsInput) > 0) {
      maxPointsPerOrder = Number(maxPointsInput)
    }

    await prisma.loyaltySettings.update({
      where: { id: 'singleton' },
      data: {
        isEnabled,
        redeemEnabled,
        pointsPerUnit,
        pointsValue,
        minimumOrderAmount,
        welcomeBonus,
        expiryEnabled,
        pointsExpiryDays: expiryEnabled ? pointsExpiryDays : null,
        maxPointsPerOrder,
      }
    })

    revalidatePath('/admin/marketing/loyalty')
    return { success: true }
  } catch (error) {
    console.error('Failed to update loyalty settings:', error)
    return { success: false, error: 'حدث خطأ أثناء حفظ الإعدادات' }
  }
}
