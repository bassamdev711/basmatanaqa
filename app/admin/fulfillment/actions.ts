'use server'

import prisma from '@/lib/prisma'
import { verifyAdmin } from '@/lib/auth'

export async function markOrderReadyForShipping(orderId: string) {
  try {
    await verifyAdmin()

    await prisma.order.update({
      where: { id: orderId },
      data: { status: 'READY_FOR_SHIPPING' }
    })

    return { success: true }
  } catch (error: any) {
    console.error('Error marking order ready:', error)
    return { success: false, error: error.message || 'حدث خطأ أثناء تحديث حالة الطلب' }
  }
}
