import React from 'react'
import { getOrderBySupplier } from '../../../suppliers/actions'
import { Package, Phone, MessageCircle, AlertCircle, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { notFound } from 'next/navigation'

export default async function OrderSupplierBreakdownPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const result = await getOrderBySupplier(id)
  if (!result) return notFound()
  
  const { order, bySupplier } = result

  return (
    <div className="p-6 md:p-8 space-y-6" dir="rtl">
      <div className="flex items-center gap-3">
        <Link href="/admin/orders" className="text-foreground/50 hover:text-brand smooth-transition">
          <ChevronRight size={20} />
        </Link>
        <div>
          <h1 className="text-2xl font-black text-foreground">
            تفكيك الطلب #{order.orderNumber || order.id.slice(-6)}
          </h1>
          <p className="text-sm text-foreground/50 mt-1">عرض عناصر الطلب مقسمة حسب المورد</p>
        </div>
      </div>

      {/* ملخص الطلب */}
      <div className="bg-white rounded-2xl border border-foreground/5 p-5 grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="text-center">
          <p className="text-xs text-foreground/50 mb-1">العميل</p>
          <p className="font-bold text-foreground">{order.customerName}</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-foreground/50 mb-1">الهاتف</p>
          <p className="font-bold text-foreground" dir="ltr">{order.customerPhone}</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-foreground/50 mb-1">عدد الموردين</p>
          <p className="font-bold text-brand text-xl">{bySupplier.length}</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-foreground/50 mb-1">إجمالي الطلب</p>
          <p className="font-black text-brand text-xl" dir="ltr">{order.totalAmount.toLocaleString()} ر.ي</p>
        </div>
      </div>

      {/* التفكيك حسب المورد */}
      <div className="space-y-4">
        {bySupplier.map((group, i) => (
          <div key={i} className={`bg-white rounded-2xl border overflow-hidden ${group.supplier ? 'border-brand/20' : 'border-orange-200'}`}>
            {/* رأس المورد */}
            <div className={`px-5 py-4 flex flex-col md:flex-row md:items-center justify-between gap-3 ${group.supplier ? 'bg-brand/5' : 'bg-orange-50'}`}>
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${group.supplier ? 'bg-brand text-surface' : 'bg-orange-200 text-orange-700'}`}>
                  <Package size={18} />
                </div>
                <div>
                  <h3 className="font-black text-lg text-foreground">
                    {group.supplier?.name ?? (
                      <span className="flex items-center gap-2 text-orange-600">
                        <AlertCircle size={16} />
                        منتجات بدون مورد
                      </span>
                    )}
                  </h3>
                  <span className="text-xs text-foreground/50">{group.items.length} عنصر</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {group.supplier?.phone && (
                  <a href={`tel:${group.supplier.phone}`} className="flex items-center gap-1.5 text-sm font-semibold text-brand hover:text-accent smooth-transition" dir="ltr">
                    <Phone size={14} />
                    {group.supplier.phone}
                  </a>
                )}
                {group.supplier?.whatsapp && (
                  <a href={`https://wa.me/${group.supplier.whatsapp.replace(/[^0-9]/g,'')}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-sm font-semibold text-green-600 hover:text-green-700 smooth-transition">
                    <MessageCircle size={14} />
                    واتساب
                  </a>
                )}
                <div className="mr-auto md:mr-0 text-left">
                  <p className="text-xs text-foreground/50">المجموع الفرعي</p>
                  <p className="font-black text-lg text-brand" dir="ltr">{group.subtotal.toLocaleString()} ر.ي</p>
                </div>
              </div>
            </div>

            {/* عناصر المورد */}
            <div className="divide-y divide-foreground/5">
              {group.items.map(item => (
                <div key={item.id} className="px-5 py-4 flex items-center gap-4">
                  {item.product?.imageUrl && (
                    <img src={item.product.imageUrl} alt={item.product.name ?? ''} className="w-14 h-14 object-cover rounded-xl border border-foreground/5 shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-foreground truncate">{item.product?.name ?? 'منتج محذوف'}</p>
                    {item.variant && <p className="text-xs text-foreground/50 mt-0.5">المقاس: {item.variant.size}</p>}
                    <p className="text-xs text-foreground/50 mt-0.5">الكمية: {item.quantity}</p>
                  </div>
                  <div className="text-left shrink-0">
                    <p className="font-black text-foreground" dir="ltr">{(item.price * item.quantity).toLocaleString()} ر.ي</p>
                    <p className="text-xs text-foreground/50" dir="ltr">{item.price.toLocaleString()} × {item.quantity}</p>
                    {item.product?.costPrice && (
                      <p className="text-xs text-green-600 font-semibold mt-0.5" dir="ltr">
                        التكلفة: {Number(item.product.costPrice).toLocaleString()} ر.ي
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
