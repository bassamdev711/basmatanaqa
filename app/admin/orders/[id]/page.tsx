import React from 'react'
import prisma from '@/lib/prisma'
import Link from 'next/link'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import { ArrowRight, MapPin, CreditCard, Receipt } from 'lucide-react'
import OrderActionsClient from './OrderActionsClient'
import { getCurrency } from '@/lib/currency'
import { getOrderConfirmedMessage, getOrderShippedMessage, getOrderCompletedMessage } from '@/lib/whatsapp/templates'
import WhatsAppActionsClient from './WhatsAppActionsClient'

export const dynamic = 'force-dynamic'

export default async function AdminOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const currency = await getCurrency()

  const { id } = await params
  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      items: {
        include: {
          product: true
        }
      }
    }
  })

  if (!order) {
    notFound()
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'PENDING': return 'قيد المراجعة'
      case 'AWAITING_PAYMENT': return 'بانتظار الدفع'
      case 'APPROVED': return 'معتمد'
      case 'SHIPPED': return 'تم الشحن'
      case 'COMPLETED': return 'مكتمل'
      case 'CANCELLED': return 'ملغي'
      default: return status
    }
  }

  return (
    <div className="p-8 max-w-5xl mx-auto" dir="rtl">
      <div className="mb-6">
        <Link href="/admin/orders" className="inline-flex items-center text-gray-500 hover:text-brand font-bold gap-2 text-sm">
          <ArrowRight size={16} />
          العودة للطلبات
        </Link>
      </div>

      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">طلب #{order.id.slice(-6).toUpperCase()}</h1>
          <p className="text-gray-500">تاريخ الطلب: {new Date(order.createdAt).toLocaleString('ar-SA')}</p>
        </div>
        <div className="bg-gray-100 text-gray-800 px-4 py-2 rounded-full font-bold text-sm">
          حالة الطلب: {getStatusLabel(order.status)}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Order Details */}
        <div className="md:col-span-2 space-y-8">
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6 border-b border-gray-100 pb-4">المنتجات</h2>
            <div className="space-y-4">
              {order.items.map(item => (
                <div key={item.id} className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-gray-50 border border-gray-100 rounded-md relative flex items-center justify-center">
                    {item.product?.imageUrl ? (
                      <Image src={item.product.imageUrl} alt={item.product.name || ''} fill className="object-contain p-2 mix-blend-multiply" />
                    ) : (
                      <span className="text-gray-300">متجرنا</span>
                    )}
                  </div>
                  <div className="flex-grow">
                    <h3 className="font-bold text-gray-900">{item.product?.name || 'منتج محذوف'}</h3>
                    <p className="text-sm text-gray-500">الكمية: {item.quantity}</p>
                  </div>
                  <div className="font-bold text-brand">
                    {(Number(item.price) * item.quantity).toLocaleString('ar-SA')} {currency}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-6 pt-4 border-t border-gray-100 flex justify-between items-center text-lg font-black text-gray-900">
              <span>الإجمالي</span>
              <span className="text-brand">{Number(order.totalAmount).toLocaleString('ar-SA')} {currency}</span>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6 border-b border-gray-100 pb-4">الإجراءات</h2>
            <OrderActionsClient orderId={order.id} currentStatus={order.status} />
          </div>
        </div>

        {/* Sidebar Info */}
        <div className="space-y-8">
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <MapPin size={20} className="text-brand" />
              تفاصيل العميل والشحن
            </h2>
            <div className="space-y-3 text-sm text-gray-600">
              <p><span className="font-bold text-gray-900">الاسم:</span> {order.customerName}</p>
              <p className="flex items-center gap-2">
                <span className="font-bold text-gray-900">الجوال:</span> 
                <a href={`tel:${order.customerPhone}`} className="text-brand hover:underline" dir="ltr">{order.customerPhone}</a>
              </p>
              <p><span className="font-bold text-gray-900">المحافظة:</span> {order.governorate}</p>
              <p><span className="font-bold text-gray-900">المدينة:</span> {order.city}</p>
              <p><span className="font-bold text-gray-900">العنوان:</span> {order.address}</p>
              
              <WhatsAppActionsClient 
                customerPhone={order.customerPhone}
                confirmedMessage={getOrderConfirmedMessage(order.customerName, order.orderNumber || order.id.slice(-6))}
                shippedMessage={getOrderShippedMessage(order.customerName, order.orderNumber || order.id.slice(-6))}
                completedMessage={getOrderCompletedMessage(order.customerName, order.orderNumber || order.id.slice(-6))}
              />
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <CreditCard size={20} className="text-brand" />
              تفاصيل الدفع
            </h2>
            <div className="space-y-3 text-sm text-gray-600">
              <p>
                <span className="font-bold text-gray-900">طريقة الدفع:</span> 
                {order.paymentMethod === 'bank_transfer' ? ' إيداع بنكي' : ' الدفع عند الاستلام'}
              </p>
              {order.transactionId && (
                <p><span className="font-bold text-gray-900">رقم العملية:</span> {order.transactionId}</p>
              )}
            </div>

            {order.paymentProofUrl ? (
              <div className="mt-6">
                <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <Receipt size={16} className="text-brand" />
                  إثبات الدفع
                </h3>
                <a href={`/api/admin/orders/${order.id}/payment-proof`} target="_blank" rel="noopener noreferrer" className="block relative h-40 w-full rounded-md overflow-hidden border border-gray-200 group">
                  <Image 
                    src={`/api/admin/orders/${order.id}/payment-proof`}
                    alt="إيصال الدفع"
                    fill 
                    className="object-cover group-hover:scale-105 transition-transform duration-300" 
                  />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-white font-bold text-sm bg-black/60 px-3 py-1 rounded-full">عرض الصورة بحجم كامل</span>
                  </div>
                </a>
              </div>
            ) : (order.paymentMethod === 'bank_transfer' || order.paymentMethod === 'wallets') ? (
              <div className="mt-6">
                <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <Receipt size={16} className="text-gray-400" />
                  إثبات الدفع
                </h3>
                <div className="w-full rounded-xl border-2 border-dashed border-gray-200 h-24 flex items-center justify-center text-gray-400 text-sm font-bold bg-gray-50">
                  لم يُرفق العميل إيصال دفع حتى الآن
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  )
}
