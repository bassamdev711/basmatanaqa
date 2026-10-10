'use server'

import prisma from '@/lib/prisma'
import { verifyAdmin } from '@/lib/auth'
import { revalidatePath } from 'next/cache'

// Generate purchase tasks for an order
export async function generatePurchaseTasks(orderId: string) {
  try {
    await verifyAdmin()
    
    // Create purchase tasks in a single transaction
    await prisma.$transaction(async (tx) => {
      // 1. Concurrent-safe check for existing tasks by locking the order or just atomic check
      const order = await tx.order.findUnique({
        where: { id: orderId },
        include: {
          items: {
            include: {
              product: true
            }
          }
        }
      })

      if (!order) throw new Error('ORDER_NOT_FOUND')
      if (order.procurementStatus !== 'PENDING') throw new Error('ALREADY_GENERATED')

      // Group items by supplier
      const itemsBySupplier: Record<string, typeof order.items> = {}
      const noSupplierItems: typeof order.items = []

      for (const item of order.items) {
        const supplierId = item.product?.supplierId
        if (supplierId) {
          if (!itemsBySupplier[supplierId]) itemsBySupplier[supplierId] = []
          itemsBySupplier[supplierId].push(item)
        } else {
          noSupplierItems.push(item)
        }
      }

      let taskCounter = 1

      for (const [supplierId, items] of Object.entries(itemsBySupplier)) {
        const estimatedCost = items.reduce((acc, item) => {
          return acc + (Number(item.product?.costPrice || 0) * item.quantity)
        }, 0)

        await tx.purchaseTask.create({
          data: {
            taskNumber: `PT-${order.orderNumber || order.id.slice(-6)}-${taskCounter++}`,
            orderId,
            supplierId,
            status: 'PENDING',
            estimatedCost,
            items: {
              create: items.map(item => ({
                orderItemId: item.id,
                status: 'PENDING'
              }))
            }
          }
        })
      }

      if (noSupplierItems.length > 0) {
        await tx.purchaseTask.create({
          data: {
            taskNumber: `PT-${order.orderNumber || order.id.slice(-6)}-${taskCounter++}`,
            orderId,
            supplierId: null,
            status: 'PENDING',
            notes: 'منتجات تحتاج إلى تحديد مورد',
            items: {
              create: noSupplierItems.map(item => ({
                orderItemId: item.id,
                status: 'PENDING'
              }))
            }
          }
        })
      }

      // 2. Update order procurement status atomically
      await tx.order.update({
        where: { id: orderId, procurementStatus: 'PENDING' },
        data: { procurementStatus: 'READY_FOR_PURCHASE' }
      })
    })

    revalidatePath(`/admin/orders/${orderId}`)
    revalidatePath('/admin/procurement')
    
    return { success: true }
  } catch (error) {
    if (error instanceof Error && error.message === 'ALREADY_GENERATED') {
      return { success: false, error: 'تم إصدار مهام المشتريات لهذا الطلب مسبقاً.' }
    }
    console.error('Error generating purchase tasks:', error)
    return { success: false, error: 'حدث خطأ أثناء إنشاء مهام المشتريات' }
  }
}

export async function updatePurchaseTaskStatus(taskId: string, status: string) {
  try {
    await verifyAdmin()
    await prisma.purchaseTask.update({
      where: { id: taskId },
      data: { status }
    })
    revalidatePath('/admin/procurement')
    return { success: true }
  } catch (error) {
    console.error('Error updating purchase task:', error)
    return { success: false, error: 'حدث خطأ أثناء تحديث المهمة' }
  }
}

export async function updatePurchaseTaskItemStatus(
  itemId: string, 
  status: string, 
  actualCost?: number
) {
  try {
    await verifyAdmin()
    
    await prisma.$transaction(async (tx) => {
      // 1. Update the item
      const updatedItem = await tx.purchaseTaskItem.update({
        where: { id: itemId },
        data: { 
          status,
          actualCost: actualCost !== undefined ? actualCost : undefined
        },
        include: {
          purchaseTask: {
            include: {
              items: true
            }
          }
        }
      })

      // 2. Auto-update the parent task status based on all its items
      const task = updatedItem.purchaseTask
      const allItems = task.items
      const allProcessed = allItems.every(i => i.status === 'PURCHASED' || i.status === 'UNAVAILABLE')
      
      if (allProcessed) {
        const hasUnavailable = allItems.some(i => i.status === 'UNAVAILABLE')
        const allUnavailable = allItems.every(i => i.status === 'UNAVAILABLE')
        
        let newTaskStatus = 'PURCHASED'
        if (allUnavailable) newTaskStatus = 'FAILED'
        else if (hasUnavailable) newTaskStatus = 'PARTIAL'

        if (task.status !== newTaskStatus) {
          await tx.purchaseTask.update({
            where: { id: task.id },
            data: { 
              status: newTaskStatus,
              purchasedAt: new Date()
            }
          })
        }
      } else {
        // If some are pending, ensure task is not marked as fully purchased
        if (task.status === 'PURCHASED' || task.status === 'PARTIAL' || task.status === 'FAILED') {
          await tx.purchaseTask.update({
            where: { id: task.id },
            data: { status: 'PENDING', purchasedAt: null }
          })
        }
      }
    })

    revalidatePath('/admin/procurement')
    return { success: true }
  } catch (error) {
    console.error('Error updating task item:', error)
    return { success: false, error: 'حدث خطأ أثناء تحديث القطعة' }
  }
}
