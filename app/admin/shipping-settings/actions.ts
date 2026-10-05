'use server'

import { verifyAdmin } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function getStoreSettings() {
  await verifyAdmin();

  let settings = await prisma.storeSettings.findUnique({ where: { id: 'singleton' } })
  if (!settings) {
    settings = await prisma.storeSettings.create({
      data: {
        id: 'singleton',
        shippingFee: 0,
        freeShippingThreshold: 0,
        showShippingInFooter: false,
        showReturnInFooter: false,
        shippingPolicyContent: '',
        returnPolicyContent: ''
      }
    })
  }
  return settings
}

export async function updateStoreSettings(data: { 
  shippingFee: number; 
  freeShippingThreshold: number;
  showShippingInFooter: boolean;
  showReturnInFooter: boolean;
  shippingPolicyContent: string;
  returnPolicyContent: string;
}) {
  await verifyAdmin();

  try {
    await prisma.storeSettings.upsert({
      where: { id: 'singleton' },
      update: {
        shippingFee: data.shippingFee,
        freeShippingThreshold: data.freeShippingThreshold,
        showShippingInFooter: data.showShippingInFooter,
        showReturnInFooter: data.showReturnInFooter,
        shippingPolicyContent: data.shippingPolicyContent,
        returnPolicyContent: data.returnPolicyContent
      },
      create: {
        id: 'singleton',
        shippingFee: data.shippingFee,
        freeShippingThreshold: data.freeShippingThreshold,
        showShippingInFooter: data.showShippingInFooter,
        showReturnInFooter: data.showReturnInFooter,
        shippingPolicyContent: data.shippingPolicyContent,
        returnPolicyContent: data.returnPolicyContent
      }
    })
    revalidatePath('/admin/shipping-settings')
    revalidatePath('/cart')
    revalidatePath('/checkout')
    // We should also revalidate the layout/footer where policies are shown
    revalidatePath('/', 'layout')
    return { success: true }
  } catch (e) {
    console.error(e)
    return { success: false, error: 'فشل في تحديث الإعدادات' }
  }
}
