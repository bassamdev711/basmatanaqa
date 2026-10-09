'use server'

import prisma from '@/lib/prisma'
import { verifyAdmin } from '@/lib/auth'
import { revalidatePath } from 'next/cache'

export async function updateCustomerServiceData(orderId: string, agreedAmount: number, paidAmount: number) {
  try {
    await verifyAdmin()

    if (agreedAmount < 0 || paidAmount < 0) {
      return { success: false, error: 'المبالغ لا يمكن أن تكون سالبة' }
    }
    if (paidAmount > agreedAmount && agreedAmount > 0) {
      return { success: false, error: 'المبلغ المدفوع لا يمكن أن يتجاوز المبلغ المتفق عليه' }
    }

    const order = await prisma.order.findUnique({ where: { id: orderId } })
    if (!order) return { success: false, error: 'الطلب غير موجود' }

    let paymentStatus = order.paymentStatus
    // If paid amount equals or exceeds agreed amount (and agreed amount > 0), set to PAID
    if (agreedAmount > 0 && paidAmount >= agreedAmount) {
      paymentStatus = 'PAID'
    } else if (paymentStatus === 'PAID' && paidAmount < agreedAmount) {
      // Revert if someone mistakenly set it back
      paymentStatus = 'PENDING'
    }

    await prisma.order.update({
      where: { id: orderId },
      data: {
        agreedAmount,
        paidAmount,
        paymentStatus
      }
    })

    revalidatePath('/admin/customer-service')
    revalidatePath(`/admin/orders/${orderId}`)
    
    return { success: true }
  } catch (error) {
    console.error('Failed to update customer service data:', error)
    return { success: false, error: 'حدث خطأ أثناء حفظ التعديلات' }
  }
}
