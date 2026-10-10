import React from 'react'
import prisma from '@/lib/prisma'
import { verifyAdmin } from '@/lib/auth'
import Image from 'next/image'
import Link from 'next/link'
import FulfillmentClient from './FulfillmentClient'

export const dynamic = 'force-dynamic'

export default async function FulfillmentDashboard() {
  await verifyAdmin()

  // Fetch orders that are in processing state (waiting to be assembled)
  const orders = await prisma.order.findMany({
    where: { 
      status: 'PROCESSING' 
    },
    include: {
      items: {
        include: {
          product: true,
          purchaseTaskItem: {
            include: {
              purchaseTask: {
                include: {
                  supplier: true
                }
              }
            }
          }
        }
      }
    },
    orderBy: { createdAt: 'asc' }
  })

  return (
    <div className="p-8 max-w-7xl mx-auto" dir="rtl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">محطة التغليف والتجميع</h1>
        <p className="text-gray-500 text-sm">هذه الصفحة تعرض الطلبات التي تم الدفع لها وبانتظار تجميع قطعها من الموردين لوضعها في الصندوق وتجهيزها للشحن.</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {orders.map(order => (
          <div key={order.id} className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 flex flex-col">
            <div className="flex justify-between items-start mb-4 border-b border-gray-100 pb-4">
              <div>
                <Link href={`/admin/orders/${order.id}`} className="text-lg font-black text-gray-900 hover:text-brand transition-colors">
                  طلب #{order.orderNumber || order.id.slice(-6).toUpperCase()}
                </Link>
                <p className="text-xs text-gray-500 mt-1">
                  العميل: {order.customerName}
                </p>
              </div>
              <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-bold">
                قيد التجهيز
              </span>
            </div>

            <div className="flex-1 space-y-4 mb-6">
              <h3 className="text-sm font-bold text-gray-700">المنتجات المطلوب تجميعها:</h3>
              <div className="space-y-3">
                {order.items.map(item => {
                  const status = item.purchaseTaskItem?.status
                  
                  return (
                    <div key={item.id} className={`flex gap-3 items-center p-2 rounded-lg border ${
                      status === 'UNAVAILABLE' ? 'bg-red-50 border-red-100 opacity-60' : 
                      status === 'PENDING' ? 'bg-orange-50 border-orange-100' :
                      status === 'PURCHASED' ? 'bg-emerald-50 border-emerald-100' :
                      'bg-gray-50 border-gray-100'
                    }`}>
                      <div className="w-12 h-12 bg-white rounded flex items-center justify-center relative flex-shrink-0 border border-gray-100">
                        {item.product?.imageUrl ? (
                          <Image src={item.product.imageUrl} alt={item.product.name} fill className={`object-contain p-1 ${status === 'UNAVAILABLE' ? 'grayscale' : ''}`} />
                        ) : (
                          <span className="text-[10px] text-gray-400">لا صورة</span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-bold truncate ${status === 'UNAVAILABLE' ? 'text-red-700 line-through' : 'text-gray-900'}`} title={item.product?.name}>
                          {item.product?.name || 'منتج محذوف'}
                        </p>
                        <div className="flex justify-between text-xs mt-1">
                          <span className="text-gray-500 font-bold">الكمية: {item.quantity} {item.selectedSize ? `| مقاس: ${item.selectedSize}` : ''}</span>
                          <span className="text-brand font-bold bg-brand/10 px-2 rounded">
                            {item.purchaseTaskItem?.purchaseTask?.supplier?.name || 'متجرنا'}
                          </span>
                        </div>
                        {/* Status Badges */}
                        {status === 'UNAVAILABLE' && (
                          <span className="text-red-600 text-[10px] font-bold mt-1 block">❌ المورد أفاد بعدم توفر القطعة (تجاهل التغليف)</span>
                        )}
                        {status === 'PENDING' && (
                          <span className="text-orange-600 text-[10px] font-bold mt-1 block">⏳ لم يتم شراؤها من المورد بعد</span>
                        )}
                        {status === 'PURCHASED' && (
                          <span className="text-emerald-600 text-[10px] font-bold mt-1 block">✅ تم توفيرها وجاهزة للتغليف</span>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            <FulfillmentClient orderId={order.id} />
          </div>
        ))}

        {orders.length === 0 && (
          <div className="col-span-full py-16 text-center bg-gray-50 rounded-xl border border-dashed border-gray-300">
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm border border-gray-100">
              <span className="text-2xl">📦</span>
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-1">لا توجد طلبات للتغليف حالياً</h3>
            <p className="text-gray-500 text-sm">جميع الطلبات المدفوعة تم تغليفها أو شحنها.</p>
          </div>
        )}
      </div>
    </div>
  )
}
