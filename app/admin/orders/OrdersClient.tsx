'use client'

import { useToast } from '@/components/ToastProvider'
import React, { useState } from 'react'
import {
  Download, ShoppingBag, Clock,
  PackageOpen, Truck, Search,
  Eye,
} from 'lucide-react'
import { format } from 'date-fns'
import Link from 'next/link'


type OrderRow = {
  id: string
  orderNumber: string | null
  customerName: string
  customerPhone: string
  status: string
  paymentStatus: string
  totalAmount: number
  createdAt: string | Date
}

type OrderStats = {
  total: number
  pendingPayment: number
  processing: number
  shipped: number
}

const STATUS_LABEL: Record<string, string> = {
  NEW: 'جديد',
  PROCESSING: 'قيد التجهيز',
  SHIPPED: 'مشحون',
  COMPLETED: 'مكتمل',
  CANCELLED: 'ملغى',
}

const PAYMENT_STATUS_LABEL: Record<string, string> = {
  PAID: 'مؤكد',
  AWAITING_CONFIRMATION: 'بانتظار التأكيد',
  PENDING: 'معلق',
  FAILED: 'فشل',
}


function PaymentBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    PAID: 'bg-brand/10 text-brand-700',
    AWAITING_CONFIRMATION: 'bg-amber-100 text-amber-700',
    PENDING: 'bg-gray-100 text-gray-600',
    FAILED: 'bg-red-100 text-red-700',
  }
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${colors[status] ?? 'bg-gray-100 text-gray-600'}`}>
      {PAYMENT_STATUS_LABEL[status] ?? status}
    </span>
  )
}

function OrderBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    NEW: 'bg-blue-100 text-blue-700',
    PROCESSING: 'bg-indigo-100 text-indigo-700',
    SHIPPED: 'bg-teal-100 text-teal-700',
    COMPLETED: 'bg-brand/10 text-brand-700',
    CANCELLED: 'bg-red-100 text-red-700',
  }
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${colors[status] ?? 'bg-gray-100 text-gray-600'}`}>
      {STATUS_LABEL[status] ?? status}
    </span>
  )
}




// ─── Main ────────────────────────────────────────────────────────────────────
export default function OrdersClient({ orders: initialOrders, stats }: { orders: OrderRow[]; stats: OrderStats }) {
  const { showToast } = useToast()
  const orders = initialOrders
  const [filterStatus, setFilterStatus] = useState('الكل')
  const [searchQuery, setSearchQuery] = useState('')

  const handleExportCSV = () => {
    if (orders.length === 0) { showToast('error', 'لا يوجد طلبات لتصديرها'); return }
    const headers = ['رقم الطلب', 'التاريخ', 'العميل', 'رقم الهاتف', 'حالة الطلب', 'حالة الدفع', 'الإجمالي']
    const csvContent = [headers.join(','), ...orders.map(o => [o.orderNumber || o.id, format(new Date(o.createdAt), 'yyyy-MM-dd HH:mm'), `"${o.customerName}"`, o.customerPhone, o.status, o.paymentStatus, o.totalAmount].join(','))].join('\n')
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = `orders_${format(new Date(), 'yyyy-MM-dd')}.csv`
    document.body.appendChild(a); a.click(); document.body.removeChild(a)
    showToast('success', 'تم تصدير الطلبات بنجاح')
  }


  const filtered = orders
    .filter(o => filterStatus === 'الكل' || (filterStatus === 'جديد' && o.status === 'NEW') || (filterStatus === 'قيد التجهيز' && o.status === 'PROCESSING') || (filterStatus === 'مشحون' && o.status === 'SHIPPED') || (filterStatus === 'مكتمل' && o.status === 'COMPLETED') || (filterStatus === 'ملغى' && o.status === 'CANCELLED'))
    .filter(o => searchQuery === '' || o.orderNumber?.toLowerCase().includes(searchQuery.toLowerCase()) || o.customerName.toLowerCase().includes(searchQuery.toLowerCase()) || o.customerPhone.includes(searchQuery))

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="flex flex-wrap justify-between items-end gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-1">إدارة الطلبات</h1>
          <p className="text-gray-500 text-sm">مراجعة وتحديث حالة الطلبات والدفعات.</p>
        </div>
        <button onClick={handleExportCSV} className="btn btn-outline gap-2">
          <Download size={16} /> تصدير CSV
        </button>
      </header>

      {/* Stats */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-5">
        {[
          { label: 'إجمالي الطلبات', value: stats.total, Icon: ShoppingBag, color: 'text-gray-400' },
          { label: 'بانتظار التأكيد', value: stats.pendingPayment, Icon: Clock, color: 'text-amber-500', urgent: true },
          { label: 'قيد التجهيز', value: stats.processing, Icon: PackageOpen, color: 'text-indigo-500' },
          { label: 'تم الشحن', value: stats.shipped, Icon: Truck, color: 'text-teal-500' },
        ].map(({ label, value, Icon, color, urgent }) => (
          <div key={label} className={`bg-white border rounded-xl p-4 shadow-sm flex flex-col gap-2 ${urgent && value > 0 ? 'border-amber-200' : 'border-gray-200'}`}>
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-gray-500">{label}</span>
              <Icon size={18} className={color} />
            </div>
            <span className="text-2xl md:text-3xl font-black text-gray-900">{value}</span>
          </div>
        ))}
      </section>

      {/* Table/Cards */}
      <section className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
        {/* Filters */}
        <div className="p-3 md:p-4 border-b border-gray-100 bg-gray-50 flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input type="text" placeholder="البحث باسم العميل، الهاتف..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full bg-white border border-gray-200 rounded-lg py-2 pr-9 pl-3 text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all" />
          </div>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="bg-white border border-gray-200 rounded-lg py-2 px-3 text-sm font-bold text-gray-600 focus:outline-none focus:border-emerald-500 cursor-pointer">
            {['الكل', 'جديد', 'قيد التجهيز', 'مشحون', 'مكتمل', 'ملغى'].map(s => <option key={s} value={s}>{s === 'الكل' ? 'حالة الطلب: الكل' : s}</option>)}
          </select>
        </div>

        {/* Desktop Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-right border-collapse">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {['رقم الطلب', 'العميل', 'التاريخ', 'الإجمالي', 'حالة الدفع', 'حالة الطلب', 'عرض'].map(h => (
                  <th key={h} className="py-3 px-4 text-xs font-bold text-gray-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="text-sm text-gray-700 divide-y divide-gray-100">
              {filtered.map(order => (
                <React.Fragment key={order.id}>
                  <tr className="transition-colors hover:bg-gray-50">
                    <td className="py-3 px-4 font-mono font-bold text-brand-800 text-xs">{order.orderNumber || `…${order.id.slice(-6)}`}</td>
                    <td className="py-3 px-4"><p className="font-bold text-gray-900">{order.customerName}</p><p className="text-xs text-gray-400">{order.customerPhone}</p></td>
                    <td className="py-3 px-4 text-xs text-gray-500">{new Date(order.createdAt).toLocaleDateString('ar-YE')}</td>
                    <td className="py-3 px-4 font-bold">{Number(order.totalAmount).toFixed(2)} ر.ي</td>
                    <td className="py-3 px-4"><PaymentBadge status={order.paymentStatus} /></td>
                    <td className="py-3 px-4"><OrderBadge status={order.status} /></td>
                    <td className="py-3 px-4">
                      <Link href={`/admin/orders/${order.id}`} className="btn btn-primary btn-sm gap-1.5">
                        <Eye size={13} /> عرض
                      </Link>
                    </td>
                  </tr>
                </React.Fragment>
              ))}
              {filtered.length === 0 && <tr><td colSpan={7} className="py-16 text-center text-gray-400 font-bold">لا توجد طلبات</td></tr>}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="md:hidden divide-y divide-gray-100">
          {filtered.map(order => (
            <Link key={order.id} href={`/admin/orders/${order.id}`} className="block border-b border-gray-100 p-4 transition-colors hover:bg-gray-50 active:bg-gray-100">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs font-bold text-brand-700">{order.orderNumber ? `#${order.orderNumber}` : `…${order.id.slice(-6)}`}</span>
                      <OrderBadge status={order.status} />
                      {order.paymentStatus === 'AWAITING_CONFIRMATION' && <span className="inline-block w-2 h-2 rounded-full bg-amber-400 animate-pulse" />}
                    </div>
                    <p className="font-bold text-gray-900 mt-1">{order.customerName}</p>
                    <p className="text-xs text-gray-400">{order.customerPhone}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-black text-gray-900">{Number(order.totalAmount).toFixed(2)} ر.ي</p>
                    <p className="text-xs text-gray-400 mt-1">{new Date(order.createdAt).toLocaleDateString('ar-YE')}</p>
                  </div>
                </div>
            </Link>
          ))}
          {filtered.length === 0 && <div className="py-16 text-center text-gray-400 font-bold">لا توجد طلبات</div>}
        </div>
      </section>


    </div>
  )
}
