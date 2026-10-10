import React from 'react'
import prisma from '@/lib/prisma'
import Link from 'next/link'
import { verifyAdmin } from '@/lib/auth'
import { ArrowRight, MessageCircle, Store } from 'lucide-react'
import SupplierProcurementClient, { AggregatedItem, AggregatedOrder } from './SupplierProcurementClient'
import { notFound } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function SupplierProcurementPage({ params }: { params: Promise<{ supplierId: string }> }) {
  await verifyAdmin()
  const { supplierId } = await params

  const supplier = supplierId === 'unknown' ? null : await prisma.supplier.findUnique({ where: { id: supplierId } })
  if (supplierId !== 'unknown' && !supplier) notFound()

  // Fetch all pending/partial purchase tasks for this supplier
  const activeTasks = await prisma.purchaseTask.findMany({
    where: {
      supplierId: supplierId === 'unknown' ? null : supplierId,
      status: { in: ['PENDING', 'PARTIAL'] }
    },
    include: {
      items: {
        include: {
          orderItem: {
            include: { product: true }
          }
        }
      },
      order: true
    },
    orderBy: { createdAt: 'asc' }
  })

  // Aggregate items by Product ID + Variant ID + Size
  const aggregatedMap = new Map<string, AggregatedItem>()

  for (const task of activeTasks) {
    for (const item of task.items) {
      // Don't show items that are already PURCHASED or UNAVAILABLE in the main list unless we want to show history.
      // But the user said: "يجب أن يكون التجميع صحيحًا على مستوى الكمية المتبقية أيضًا، بحيث لا تظهر الكميات التي اكتمل شراؤها ضمن المطلوب الجديد."
      // So we will include it but calculate the math. If totalPending is 0, we can hide the whole row, or show it at the bottom.
      
      const pId = item.orderItem.productId || 'unknown'
      const vId = item.orderItem.variantId || 'null'
      const size = item.orderItem.selectedSize || 'null'
      const key = `${pId}-${vId}-${size}`

      if (!aggregatedMap.has(key)) {
        aggregatedMap.set(key, {
          key,
          productId: pId,
          variantId: item.orderItem.variantId,
          selectedSize: item.orderItem.selectedSize,
          productName: item.orderItem.product?.name || 'منتج محذوف',
          imageUrl: item.orderItem.product?.imageUrl || null,
          costPrice: Number(item.orderItem.product?.costPrice || 0),
          totalRequired: 0,
          totalPurchased: 0,
          totalPending: 0,
          orders: []
        })
      }

      const aggItem = aggregatedMap.get(key)!
      aggItem.totalRequired += item.orderItem.quantity
      
      if (item.status === 'PURCHASED') {
        aggItem.totalPurchased += item.orderItem.quantity
      } else if (item.status === 'PENDING') {
        aggItem.totalPending += item.orderItem.quantity
      }

      aggItem.orders.push({
        purchaseTaskItemId: item.id,
        orderId: task.orderId,
        orderNumber: task.order.orderNumber || task.orderId.slice(-6).toUpperCase(),
        quantity: item.orderItem.quantity,
        status: item.status,
        paymentStatus: task.order.paymentStatus,
        createdAt: task.createdAt
      })
    }
  }

  // Filter out products that have 0 pending (fully purchased) so they don't clutter the new list
  const aggregatedItems = Array.from(aggregatedMap.values())
    .filter(item => item.totalPending > 0)
    .sort((a, b) => b.totalRequired - a.totalRequired)

  // Generate WhatsApp Message
  const buildWhatsAppMessage = () => {
    let msg = `مرحباً، أود تجهيز المنتجات التالية:\n\n`
    aggregatedItems.forEach((item, index) => {
      msg += `${index + 1}. ${item.productName}\n`
      msg += `الكمية الإجمالية المطلوبة: ${item.totalPending}\n`
      if (item.selectedSize) {
        msg += `المقاس/الخيار: ${item.selectedSize}\n`
      }
      msg += `\n`
    })
    msg += `يرجى تأكيد توفر المنتجات والأسعار، وإبلاغي في حال عدم توفر أي منتج.\nشكراً لكم.`
    return encodeURIComponent(msg)
  }

  const whatsappUrl = supplier?.whatsapp 
    ? `https://wa.me/${supplier.whatsapp.replace(/\D/g, '')}?text=${buildWhatsAppMessage()}` 
    : null

  return (
    <div className="p-8 max-w-5xl mx-auto" dir="rtl">
      <div className="mb-6">
        <Link href="/admin/procurement" className="inline-flex items-center text-gray-500 hover:text-brand font-bold gap-2 text-sm">
          <ArrowRight size={16} />
          العودة لقائمة المشتريات الرئيسية
        </Link>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-brand/10 text-brand rounded-full flex items-center justify-center">
            <Store size={32} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{supplier?.name || 'مورد غير محدد'}</h1>
            {supplier?.phone && <p className="text-gray-500 text-sm mt-1">{supplier.phone}</p>}
          </div>
        </div>
        
        {whatsappUrl && (
          <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="btn btn-primary inline-flex items-center gap-2">
            <MessageCircle size={18} />
            إرسال الطلبية عبر واتساب
          </a>
        )}
      </div>

      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900 mb-2">قائمة التجميع</h2>
        <p className="text-gray-500 text-sm">هذه القائمة مجمعة بناءً على المنتجات المتطابقة. انقر على المنتج لرؤية الطلبات المرتبطة به وتسجيل شرائه جزئياً أو كلياً.</p>
      </div>

      <SupplierProcurementClient supplierId={supplierId} items={aggregatedItems} />
    </div>
  )
}
