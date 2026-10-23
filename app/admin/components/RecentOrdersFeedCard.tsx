'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Clock, ArrowLeft, ShoppingBag, User, Phone, MapPin, Zap } from 'lucide-react'

export type FeedOrderItem = {
  id: string
  orderNumber: string | null
  customerName: string
  customerPhone?: string | null
  city?: string | null
  totalAmount: number
  status: string
  createdAt: string
  items?: Array<{
    quantity: number
    selectedSize?: string | null
    productName?: string | null
  }>
}

export function formatTimeAgoArabic(dateString: string): string {
  const now = new Date()
  const past = new Date(dateString)
  const diffInSeconds = Math.max(0, Math.floor((now.getTime() - past.getTime()) / 1000))

  if (diffInSeconds < 60) return 'الآن (قبل لحظات)'

  const diffInMinutes = Math.floor(diffInSeconds / 60)
  if (diffInMinutes === 1) return 'قبل دقيقة'
  if (diffInMinutes === 2) return 'قبل دقيقتين'
  if (diffInMinutes >= 3 && diffInMinutes <= 10) return `قبل ${diffInMinutes} دقائق`
  if (diffInMinutes < 60) return `قبل ${diffInMinutes} دقيقة`

  const diffInHours = Math.floor(diffInMinutes / 60)
  if (diffInHours === 1) return 'قبل ساعة'
  if (diffInHours === 2) return 'قبل ساعتين'
  if (diffInHours >= 3 && diffInHours <= 10) return `قبل ${diffInHours} ساعات`
  if (diffInHours < 24) return `قبل ${diffInHours} ساعة`

  const diffInDays = Math.floor(diffInHours / 24)
  if (diffInDays === 1) return 'قبل يوم (أمس)'
  if (diffInDays === 2) return 'قبل يومين'
  if (diffInDays >= 3 && diffInDays <= 10) return `قبل ${diffInDays} أيام`
  if (diffInDays < 30) return `قبل ${diffInDays} يوماً`

  const diffInMonths = Math.floor(diffInDays / 30)
  if (diffInMonths === 1) return 'قبل شهر'
  if (diffInMonths === 2) return 'قبل شهرين'
  return `قبل ${diffInMonths} أشهر`
}

function getStatusBadge(status: string) {
  switch (status) {
    case 'NEW':
      return { label: 'طلب جديد', bg: 'bg-blue-50 text-blue-700 border-blue-200' }
    case 'PROCESSING':
      return { label: 'قيد التجهيز', bg: 'bg-amber-50 text-amber-700 border-amber-200' }
    case 'SHIPPED':
      return { label: 'تم الشحن', bg: 'bg-purple-50 text-purple-700 border-purple-200' }
    case 'COMPLETED':
      return { label: 'مكتمل', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200' }
    case 'CANCELLED':
      return { label: 'ملغى', bg: 'bg-rose-50 text-rose-700 border-rose-200' }
    default:
      return { label: status, bg: 'bg-gray-50 text-gray-700 border-gray-200' }
  }
}

export default function RecentOrdersFeedCard({
  orders,
  currency = 'ر.س',
}: {
  orders: FeedOrderItem[]
  currency?: string
}) {
  const [, setTick] = useState(0)

  // تحديث التوقيت النسبي تلقائياً كل 30 ثانية
  useEffect(() => {
    const timer = setInterval(() => {
      setTick((t) => t + 1)
    }, 30000)
    return () => clearInterval(timer)
  }, [])

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      {/* رأس البطاقة */}
      <div className="p-5 md:p-6 border-b border-gray-100 bg-gradient-to-l from-brand/5 via-transparent to-transparent flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand text-white flex items-center justify-center shadow-sm">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg md:text-xl font-bold text-gray-900 flex items-center gap-2">
              آخر 5 طلبات في المتجر
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" title="مباشر"></span>
            </h3>
            <p className="text-xs md:text-sm text-gray-500 mt-0.5">
              متابعة حية وفورية لأحدث طلبات العملاء مع التوقيت النسبي
            </p>
          </div>
        </div>

        <Link
          href="/admin/orders"
          className="inline-flex items-center gap-1.5 text-xs md:text-sm font-bold text-brand hover:text-brand/80 transition-colors bg-brand/10 hover:bg-brand/20 px-3.5 py-2 rounded-xl"
        >
          عرض جميع الطلبات
          <ArrowLeft className="w-4 h-4" />
        </Link>
      </div>

      {/* قائمة الطلبات الخمسة */}
      {orders.length === 0 ? (
        <div className="p-10 text-center text-gray-500">
          <ShoppingBag className="w-10 h-10 mx-auto text-gray-300 mb-2" />
          <p className="font-bold text-sm">لا توجد طلبات جديدة حتى الآن</p>
          <p className="text-xs text-gray-400 mt-1">ستظهر هنا تفاصيل أي طلب جديد فور إنشائه من العملاء</p>
        </div>
      ) : (
        <div className="divide-y divide-gray-100">
          {orders.map((order, idx) => {
            const timeAgo = formatTimeAgoArabic(order.createdAt)
            const badge = getStatusBadge(order.status)
            const orderNum = order.orderNumber || `#${order.id.slice(-6)}`

            return (
              <Link
                key={order.id}
                href={`/admin/orders/${order.id}`}
                className="group block p-4 md:p-5 hover:bg-gray-50/80 transition-all duration-200"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                  {/* معلومات العميل ورقم الطلب */}
                  <div className="flex items-start gap-3.5 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-gray-100 group-hover:bg-brand group-hover:text-white transition-colors flex items-center justify-center font-bold text-xs text-gray-600 shrink-0 mt-0.5">
                      {idx + 1}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-black text-gray-900 group-hover:text-brand transition-colors text-base">
                          {order.customerName}
                        </span>
                        <span className="text-xs font-mono font-semibold text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                          {orderNum}
                        </span>
                        <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold border ${badge.bg}`}>
                          {badge.label}
                        </span>
                      </div>

                      {/* معلومات الاتصال والمدينة والمنتجات */}
                      <div className="flex items-center gap-4 text-xs text-gray-500 mt-1.5 flex-wrap">
                        {order.customerPhone && (
                          <span className="flex items-center gap-1">
                            <Phone className="w-3 h-3 text-gray-400" />
                            <span dir="ltr">{order.customerPhone}</span>
                          </span>
                        )}
                        {order.city && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-gray-400" />
                            <span>{order.city}</span>
                          </span>
                        )}
                        {order.items && order.items.length > 0 && (
                          <span className="text-gray-600 truncate max-w-xs hidden sm:inline">
                            📦 {order.items.map((it) => it.productName || 'منتج').join('، ')}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* التوقيت النسبي والمبلغ */}
                  <div className="flex items-center justify-between md:justify-end gap-4 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-gray-100">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-amber-800 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200/60 shadow-2xs">
                      <Clock className="w-3.5 h-3.5 text-amber-600" />
                      <span>{timeAgo}</span>
                    </div>

                    <div className="text-left">
                      <span className="text-base font-black text-gray-900 block">
                        {Number(order.totalAmount).toLocaleString('ar-SA')}{' '}
                        <span className="text-xs font-normal text-gray-500">{currency}</span>
                      </span>
                    </div>

                    <ArrowLeft className="w-4 h-4 text-gray-300 group-hover:text-brand group-hover:-translate-x-1 transition-all hidden md:block" />
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
