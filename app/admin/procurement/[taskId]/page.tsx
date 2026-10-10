import React from 'react'
import prisma from '@/lib/prisma'
import Link from 'next/link'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import { verifyAdmin } from '@/lib/auth'
import { ArrowRight, MessageCircle } from 'lucide-react'
import PurchaseTaskItemsClient from './PurchaseTaskItemsClient'

export const dynamic = 'force-dynamic'

export default async function PurchaseTaskDetail({ params }: { params: Promise<{ taskId: string }> }) {
  await verifyAdmin()
  const { taskId } = await params

  const task = await prisma.purchaseTask.findUnique({
    where: { id: taskId },
    include: {
      supplier: true,
      order: true,
      items: {
        include: {
          orderItem: {
            include: {
              product: true,
              variant: true
            }
          }
        }
      }
    }
  })

  if (!task) notFound()

  // Generate WhatsApp Message
  const buildWhatsAppMessage = () => {
    let msg = `مرحباً، أود تجهيز المنتجات التالية:\n\n`
    task.items.forEach((item, index) => {
      const orderItem = item.orderItem
      msg += `${index + 1}. اسم المنتج: ${orderItem.product?.name || 'غير معروف'}\n`
      msg += `الكمية: ${orderItem.quantity}\n`
      if (orderItem.selectedSize) {
        msg += `المقاس/الخيار: ${orderItem.selectedSize}\n`
      }
      if (orderItem.product?.slug) {
        msg += `الرابط: https://basmatanaqa.com/products/${orderItem.product.slug}\n`
      }
      msg += `\n`
    })
    msg += `يرجى تأكيد توفر المنتجات والأسعار وتكلفة الشحن، وإبلاغي في حال عدم توفر أي منتج.\nشكراً لكم.`
    return encodeURIComponent(msg)
  }

  const whatsappUrl = task.supplier?.whatsapp 
    ? `https://wa.me/${task.supplier.whatsapp.replace(/\D/g, '')}?text=${buildWhatsAppMessage()}` 
    : null

  return (
    <div className="p-8 max-w-4xl mx-auto" dir="rtl">
      <div className="mb-6">
        <Link href="/admin/procurement" className="inline-flex items-center text-gray-500 hover:text-brand font-bold gap-2 text-sm">
          <ArrowRight size={16} />
          العودة لقائمة المشتريات
        </Link>
      </div>

      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">مهمة مشتريات: {task.taskNumber}</h1>
          <p className="text-gray-500">
            الطلب الأصلي: <Link href={`/admin/orders/${task.orderId}`} className="text-brand hover:underline font-bold">#{task.order.orderNumber || task.orderId.slice(-6)}</Link>
          </p>
        </div>
        <div className="bg-gray-100 px-4 py-2 rounded-full font-bold text-sm">
          الحالة: {task.status}
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6 mb-8">
        <h2 className="text-xl font-bold text-gray-900 mb-6 border-b border-gray-100 pb-4">بيانات المورد</h2>
        {task.supplier ? (
          <div className="space-y-3">
            <p><span className="font-bold text-gray-700">اسم المورد:</span> {task.supplier.name}</p>
            {task.supplier.phone && <p><span className="font-bold text-gray-700">الهاتف:</span> {task.supplier.phone}</p>}
            {whatsappUrl ? (
              <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="btn btn-primary inline-flex items-center gap-2 mt-2">
                <MessageCircle size={18} />
                التواصل عبر واتساب
              </a>
            ) : (
              <p className="text-red-500 text-sm mt-2">لا يوجد رقم واتساب مسجل لهذا المورد.</p>
            )}
          </div>
        ) : (
          <p className="text-yellow-600 font-bold">هذه المنتجات لم يُحدد لها مورد بعد.</p>
        )}
      </div>

      <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-6 border-b border-gray-100 pb-4">المنتجات المطلوب شراؤها</h2>
        <PurchaseTaskItemsClient items={task.items as any} />
      </div>
    </div>
  )
}
