'use client'

import React, { useState } from 'react'
import Image from 'next/image'
import { useSearchParams } from 'next/navigation'
import { trackOrderByOrderId, trackOrdersByPhone } from './actions'
import { Package, Truck, CheckCircle2, Search, Clock, ShieldCheck, XCircle, AlertCircle, Phone, ArrowRight } from 'lucide-react'
import { useCurrency } from '@/components/CurrencyProvider'

type TrackingMethod = 'PHONE' | 'ORDER_ID'

type TrackedOrder = {
  id: string
  orderNumber: string | null
  status: string
  paymentStatus: string
  paymentMethod: string
  totalAmount: number
  shippingFee: number
  createdAt: string | Date
  items: Array<{
    id: string
    productName: string
    imageUrl: string | null
    quantity: number
    price: number
  }>
}

export default function TrackOrderClient() {
  const currency = useCurrency()
  const searchParams = useSearchParams()
  const trackingToken = searchParams.get('token') || ''

  const [method, setMethod] = useState<TrackingMethod>(trackingToken ? 'ORDER_ID' : 'PHONE')
  const [orderId, setOrderId] = useState(() => searchParams.get('orderId') || '')
  const [phone, setPhone] = useState('')
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  
  const [order, setOrder] = useState<TrackedOrder | null>(null)
  const [ordersList, setOrdersList] = useState<TrackedOrder[]>([])
  const [viewState, setViewState] = useState<'FORM' | 'LIST' | 'DETAIL'>('FORM')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setOrder(null)
    setOrdersList([])
    
    if (method === 'ORDER_ID') {
      const res = await trackOrderByOrderId(orderId, trackingToken)
      if (res.success && res.order) {
        setOrder(res.order)
        setViewState('DETAIL')
      } else {
        setError(res.error || 'حدث خطأ غير متوقع')
      }
    } else {
      const res = await trackOrdersByPhone(phone, orderId)
      if (res.success && res.orders) {
        const firstOrder = res.orders[0]
        if (res.orders.length === 1 && firstOrder) {
          // If only 1 order, go straight to detail
          setOrder(firstOrder)
          setViewState('DETAIL')
        } else {
          // Show list of orders
          setOrdersList(res.orders)
          setViewState('LIST')
        }
      } else {
        setError(res.error || 'حدث خطأ غير متوقع')
      }
    }
    
    setLoading(false)
  }

  const handleSelectOrder = (selectedOrder: TrackedOrder) => {
    setOrder(selectedOrder)
    setViewState('DETAIL')
  }

  const handleBack = () => {
    if (method === 'PHONE' && ordersList.length > 1) {
      setViewState('LIST')
    } else {
      setViewState('FORM')
    }
    setOrder(null)
  }

  const handleBackToForm = () => {
    setViewState('FORM')
    setOrder(null)
    setOrdersList([])
  }

  // Helper to determine active step in the progress bar
  const getStatusStep = (status: string) => {
    switch(status) {
      case 'NEW': return 1;
      case 'PROCESSING': return 2;
      case 'SHIPPED': return 3;
      case 'COMPLETED': return 4;
      case 'CANCELLED': return -1;
      default: return 0;
    }
  }

  const getStatusText = (status: string) => {
    switch(status) {
      case 'NEW': return 'استلمنا الطلب';
      case 'PROCESSING': return 'قيد التجهيز';
      case 'SHIPPED': return 'تم الشحن';
      case 'COMPLETED': return 'مكتمل';
      case 'CANCELLED': return 'ملغى';
      default: return 'غير معروف';
    }
  }

  return (
    <div className="flex-grow pt-20 pb-16 md:pt-32 md:pb-24 px-4 md:px-6 max-w-5xl mx-auto w-full">
      <h1 className="text-2xl md:text-5xl font-black text-foreground mb-3 md:mb-4 text-center">تتبع الطلب</h1>
      <p className="text-center text-sm md:text-base text-foreground/60 mb-6 md:mb-12 max-w-xl mx-auto">
        اختر طريقة التتبع التي تفضلها لمعرفة حالة طلبك بكل سهولة.
      </p>

      {/* TABS */}
      {viewState === 'FORM' && (
        <div className="bg-white p-4 md:p-10 shadow-sm border border-black/5 mb-6 md:mb-12">
          
          <div className="flex justify-center mb-5 md:mb-8 border-b border-black/10 gap-2">
            <button 
              type="button"
              onClick={() => { setMethod('PHONE'); setError(''); }}
              className={`pb-3 md:pb-4 px-4 md:px-6 font-bold text-base md:text-lg transition-colors border-b-2 flex items-center gap-1.5 md:gap-2 ${method === 'PHONE' ? 'border-accent text-foreground' : 'border-transparent text-gray-600 hover:text-foreground'}`}
            >
              <Phone size={17} className="md:w-5 md:h-5" /> بالهاتف ورقم الطلب
            </button>
            <button 
              type="button"
              onClick={() => { setMethod('ORDER_ID'); setError(''); }}
              className={`pb-3 md:pb-4 px-4 md:px-6 font-bold text-base md:text-lg transition-colors border-b-2 flex items-center gap-1.5 md:gap-2 ${method === 'ORDER_ID' ? 'border-accent text-foreground' : 'border-transparent text-gray-600 hover:text-foreground'}`}
            >
              <Search size={17} className="md:w-5 md:h-5" /> برقم الطلب
            </button>
          </div>

          <form onSubmit={handleSubmit} className="max-w-2xl mx-auto flex flex-col gap-6">
            
            {method === 'PHONE' ? (
              <div className="flex flex-col animate-in fade-in slide-in-from-bottom-2 duration-300">
                <label className="text-sm font-bold text-foreground mb-2">رقم الجوال</label>
                <div className="relative">
                  <Phone className="absolute right-4 top-1/2 -translate-y-1/2 text-foreground/40 w-5 h-5" />
                  <input 
                    type="tel" 
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="رقم الجوال المستخدم في الطلب"
                    dir="ltr"
                    required
                    className="w-full bg-surface/50 border border-black/10 rounded-none py-3 md:py-4 pr-11 pl-4 focus:outline-none focus:border-accent transition-colors text-right text-base md:text-lg"
                  />
                </div>
                    <p className="text-xs text-gray-500 mt-2">أدخل رقم الهاتف ورقم الطلب معًا للتحقق من ملكية الطلب.</p>
                <div className="flex flex-col mt-4">
                  <label className="text-sm font-bold text-foreground mb-2">رقم الطلب</label>
                  <div className="relative">
                    <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-foreground/40 w-5 h-5" />
                    <input
                      type="text"
                      value={orderId}
                      onChange={(e) => setOrderId(e.target.value)}
                      placeholder="أدخل رقم الطلب"
                      required
                      className="w-full bg-surface/50 border border-black/10 rounded-none py-3 md:py-4 pr-11 pl-4 focus:outline-none focus:border-accent transition-colors text-right text-base md:text-lg"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col animate-in fade-in slide-in-from-bottom-2 duration-300">
                <label className="text-sm font-bold text-foreground mb-2">رقم الطلب</label>
                <div className="relative">
                  <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-foreground/40 w-5 h-5" />
                  <input 
                    type="text" 
                    value={orderId}
                    onChange={(e) => setOrderId(e.target.value)}
                    placeholder="أدخل رقم الطلب (مثال: STORE-2026-ABC123)"
                    required
                    className="w-full bg-surface/50 border border-black/10 rounded-none py-3 md:py-4 pr-11 pl-4 focus:outline-none focus:border-accent transition-colors text-right text-base md:text-lg"
                  />
                </div>
              </div>
            )}

            <button 
              type="submit"
              disabled={loading}
              className="btn btn-primary w-full btn-lg !bg-accent !text-foreground hover:!bg-accent/90 border border-black/10 disabled:opacity-50 disabled:cursor-not-allowed md:h-16 h-14 md:text-lg"
            >
              {loading ? 'جاري البحث...' : 'تتبع الآن'}
            </button>
          </form>

          {error && (
            <div className="mt-6 max-w-2xl mx-auto bg-red-50 text-red-600 p-4 border border-red-100 font-bold flex items-center gap-3 text-sm">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>
      )}

      {/* LIST OF ORDERS (For Phone Method) */}
      {viewState === 'LIST' && ordersList.length > 0 && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold text-foreground">الطلبات المرتبطة برقم هاتفك</h2>
            <button onClick={handleBackToForm} className="btn btn-outline btn-sm gap-2 text-sm">
               بحث جديد <ArrowRight size={16} />
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {ordersList.map((ord) => (
              <div 
                key={ord.id} 
                onClick={() => handleSelectOrder(ord)}
                className="bg-white p-6 border border-black/10 shadow-sm hover:border-accent hover:shadow-md transition-all cursor-pointer group flex flex-col"
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">رقم الطلب</p>
                    <p className="font-mono font-bold text-lg text-brand group-hover:text-accent transition-colors">{ord.orderNumber || ord.id}</p>
                  </div>
                  <div className={`px-3 py-1 text-xs font-bold rounded-full ${getStatusStep(ord.status) === -1 ? 'bg-red-100 text-red-700' : getStatusStep(ord.status) === 4 ? 'bg-brand/10 text-brand' : 'bg-blue-50 text-blue-600'}`}>
                    {getStatusText(ord.status)}
                  </div>
                </div>
                
                <div className="mt-auto flex justify-between items-end border-t border-black/5 pt-4">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">تاريخ الطلب</p>
                    <p className="text-sm font-medium text-foreground">{new Date(ord.createdAt).toLocaleDateString('ar-SA')}</p>
                  </div>
                  <div className="text-left">
                    <p className="text-xs text-gray-500 mb-1">الإجمالي</p>
                    <p className="text-sm font-bold text-foreground">{ord.totalAmount.toLocaleString('ar-SA')} {currency}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SINGLE ORDER DETAILS */}
      {viewState === 'DETAIL' && order && (
        <div className="bg-white shadow-sm border border-black/5 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
          
          {/* Header Info */}
          <div className="bg-surface-alt p-6 md:p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-black/5 relative">
            <button 
              onClick={handleBack} 
              className="btn btn-outline btn-sm absolute top-6 left-6 gap-2 text-sm bg-white shadow-sm"
            >
              رجوع <ArrowRight size={16} />
            </button>
            
            <div className="mt-6 md:mt-0">
              <p className="text-sm text-foreground/60 mb-1">رقم الطلب</p>
              <h2 className="text-2xl font-black text-brand font-mono tracking-widest">{order.orderNumber || order.id}</h2>
            </div>
            
            <div className="flex flex-wrap gap-6 text-sm">
              <div>
                <p className="text-foreground/60 mb-1">تاريخ الطلب</p>
                <p className="font-bold text-foreground">{new Date(order.createdAt).toLocaleDateString('ar-SA')}</p>
              </div>
              <div>
                <p className="text-foreground/60 mb-1">الإجمالي</p>
                <p className="font-bold text-brand">{order.totalAmount.toLocaleString('ar-SA')} {currency}</p>
              </div>
              <div>
                <p className="text-foreground/60 mb-1">حالة الدفع</p>
                <p className="font-bold text-foreground flex items-center gap-1.5">
                  {order.paymentStatus === 'PAID' ? <><ShieldCheck size={16} className="text-brand" /> مدفوع</> : 
                   order.paymentStatus === 'AWAITING_CONFIRMATION' ? <><Clock size={16} className="text-yellow-600" /> بانتظار التأكيد</> : 
                   order.paymentStatus === 'FAILED' ? <><XCircle size={16} className="text-red-500" /> فشل الدفع</> : 
                   <><Clock size={16} className="text-gray-500" /> معلق</>}
                </p>
              </div>
            </div>
          </div>

          <div className="p-6 md:p-10">
            {/* Progress Bar Area */}
            {getStatusStep(order.status) === -1 ? (
              <div className="bg-red-50 p-8 text-center mb-12 border border-red-100">
                <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-red-700 mb-2">الطلب ملغى</h3>
                <p className="text-red-600/80">نأسف، تم إلغاء هذا الطلب. يرجى التواصل مع خدمة العملاء إذا كنت تعتقد أن هذا خطأ.</p>
              </div>
            ) : (
              <div className="mb-8 md:mb-16 relative mt-4">
                <h3 className="text-sm md:text-lg font-bold text-foreground mb-6 md:mb-10 text-center">حالة الشحن</h3>
                
                {/* Progress Bar Container */}
                <div className="relative max-w-3xl mx-auto">
                  {/* Background Line */}
                  <div className="absolute top-1/2 left-0 w-full h-1 bg-gray-200 -translate-y-1/2 z-0"></div>
                  
                  {/* Active Line */}
                  <div 
                    className="absolute top-1/2 right-0 h-1 bg-brand -translate-y-1/2 z-0 transition-all duration-1000 ease-out"
                    style={{ width: `${((getStatusStep(order.status) - 1) / 3) * 100}%` }}
                  ></div>

                  {/* Steps */}
                  <div className="relative z-10 flex justify-between items-center w-full">
                    {/* Step 1: NEW */}
                    <div className="flex flex-col items-center">
                      <div className={`w-9 h-9 md:w-12 md:h-12 rounded-full flex items-center justify-center border-4 transition-colors duration-500 ${getStatusStep(order.status) >= 1 ? 'bg-brand border-brand text-surface' : 'bg-white border-gray-200 text-gray-400'}`}>
                        <Package size={16} className="md:w-5 md:h-5" />
                      </div>
                      <span className={`mt-2 text-[10px] md:text-sm font-bold ${getStatusStep(order.status) >= 1 ? 'text-brand' : 'text-gray-400'}`}>استلمنا الطلب</span>
                    </div>

                    {/* Step 2: PROCESSING */}
                    <div className="flex flex-col items-center">
                      <div className={`w-9 h-9 md:w-12 md:h-12 rounded-full flex items-center justify-center border-4 transition-colors duration-500 delay-100 ${getStatusStep(order.status) >= 2 ? 'bg-brand border-brand text-surface' : 'bg-white border-gray-200 text-gray-400'}`}>
                        <Clock size={16} className="md:w-5 md:h-5" />
                      </div>
                      <span className={`mt-2 text-[10px] md:text-sm font-bold ${getStatusStep(order.status) >= 2 ? 'text-brand' : 'text-gray-400'}`}>قيد التجهيز</span>
                    </div>

                    {/* Step 3: SHIPPED */}
                    <div className="flex flex-col items-center">
                      <div className={`w-9 h-9 md:w-12 md:h-12 rounded-full flex items-center justify-center border-4 transition-colors duration-500 delay-200 ${getStatusStep(order.status) >= 3 ? 'bg-brand border-brand text-surface' : 'bg-white border-gray-200 text-gray-400'}`}>
                        <Truck size={16} className="md:w-5 md:h-5" />
                      </div>
                      <span className={`mt-2 text-[10px] md:text-sm font-bold ${getStatusStep(order.status) >= 3 ? 'text-brand' : 'text-gray-400'}`}>تم الشحن</span>
                    </div>

                    {/* Step 4: COMPLETED */}
                    <div className="flex flex-col items-center">
                      <div className={`w-9 h-9 md:w-12 md:h-12 rounded-full flex items-center justify-center border-4 transition-colors duration-500 delay-300 ${getStatusStep(order.status) >= 4 ? 'bg-brand border-brand text-surface' : 'bg-white border-gray-200 text-gray-400'}`}>
                        <CheckCircle2 size={16} className="md:w-5 md:h-5" />
                      </div>
                      <span className={`mt-2 text-[10px] md:text-sm font-bold ${getStatusStep(order.status) >= 4 ? 'text-brand' : 'text-gray-400'}`}>مكتمل</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Order Items */}
            <div className="border-t border-black/5 pt-10">
              <h3 className="text-lg font-bold text-foreground mb-6">المنتجات المطلوبة</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {order.items.map((item) => (
                  <div key={item.id} className="flex items-center gap-4 border border-black/5 p-4 hover:border-accent/30 transition-colors bg-surface-alt/50">
                    <div className="w-20 h-20 bg-white shrink-0 border border-black/5 flex items-center justify-center p-2 relative">
                      {item.imageUrl ? (
                        <Image src={item.imageUrl} alt={item.productName} fill className="object-contain mix-blend-multiply" />
                      ) : (
                        <span className="text-accent text-xs">متجرنا</span>
                      )}
                    </div>
                    <div>
                      <h4 className="font-bold text-foreground text-sm line-clamp-2">{item.productName}</h4>
                      <div className="text-foreground/60 text-xs mt-1">الكمية: {item.quantity}</div>
                      <div className="text-brand text-sm font-bold mt-1">{(item.price).toLocaleString('ar-SA')} {currency}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  )
}
