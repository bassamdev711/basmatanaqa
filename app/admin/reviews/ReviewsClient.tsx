'use client'

import React, { useState } from 'react'
import { CheckCircle2, XCircle, Trash2, Star, MessageSquare } from 'lucide-react'
import { updateReviewStatus, deleteReview } from '@/app/actions/reviews'
import { useToast } from '@/components/ToastProvider'
import { useConfirm } from '@/components/ConfirmProvider'
import Image from 'next/image'

type Review = {
  id: string
  name: string
  city: string | null
  content: string
  rating: number
  status: string
  isGlobal: boolean
  productId: string | null
  createdAt: string
  product: {
    name: string
    imageUrl: string | null
  } | null
}

export default function ReviewsClient({ initialReviews }: { initialReviews: Review[] }) {
  const [reviews, setReviews] = useState<Review[]>(initialReviews)
  const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('ALL')
  const { showToast } = useToast()
  const { confirm } = useConfirm()

  const handleStatusChange = async (id: string, newStatus: 'APPROVED' | 'REJECTED') => {
    const res = await updateReviewStatus(id, newStatus)
    if (res.success) {
      setReviews(reviews.map(r => r.id === id ? { ...r, status: newStatus } : r))
      showToast('success', newStatus === 'APPROVED' ? 'تمت الموافقة على المراجعة' : 'تم إخفاء المراجعة')
    } else {
      showToast('error', res.error || 'حدث خطأ')
    }
  }

  const handleDelete = async (id: string) => {
    if (!(await confirm({ message: 'هل أنت متأكد من حذف هذه المراجعة نهائياً؟', danger: true }))) return

    const res = await deleteReview(id)
    if (res.success) {
      setReviews(reviews.filter(r => r.id !== id))
      showToast('success', 'تم حذف المراجعة بنجاح')
    } else {
      showToast('error', res.error || 'حدث خطأ')
    }
  }

  const filteredReviews = filter === 'ALL' ? reviews : reviews.filter(r => r.status === filter)

  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-black text-deep-green mb-2 flex items-center gap-3">
            <MessageSquare className="w-8 h-8 text-brand" />
            المراجعات
          </h1>
          <p className="text-deep-green/60 font-bold">إدارة مراجعات العملاء وآرائهم حول المنتجات والمتجر.</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        <button 
          onClick={() => setFilter('ALL')}
          className={`px-4 py-2 rounded-lg font-bold text-sm whitespace-nowrap transition-colors ${filter === 'ALL' ? 'bg-deep-green text-ivory' : 'bg-white border border-black/10 text-deep-green/70 hover:bg-black/5'}`}
        >
          الكل ({reviews.length})
        </button>
        <button 
          onClick={() => setFilter('PENDING')}
          className={`px-4 py-2 rounded-lg font-bold text-sm whitespace-nowrap transition-colors ${filter === 'PENDING' ? 'bg-orange-500 text-white' : 'bg-white border border-black/10 text-orange-600 hover:bg-orange-50'}`}
        >
          بانتظار الموافقة ({reviews.filter(r => r.status === 'PENDING').length})
        </button>
        <button 
          onClick={() => setFilter('APPROVED')}
          className={`px-4 py-2 rounded-lg font-bold text-sm whitespace-nowrap transition-colors ${filter === 'APPROVED' ? 'bg-emerald text-white' : 'bg-white border border-black/10 text-brand hover:bg-emerald/5'}`}
        >
          الموافق عليها ({reviews.filter(r => r.status === 'APPROVED').length})
        </button>
        <button 
          onClick={() => setFilter('REJECTED')}
          className={`px-4 py-2 rounded-lg font-bold text-sm whitespace-nowrap transition-colors ${filter === 'REJECTED' ? 'bg-red-500 text-white' : 'bg-white border border-black/10 text-red-500 hover:bg-red-50'}`}
        >
          المخفية ({reviews.filter(r => r.status === 'REJECTED').length})
        </button>
      </div>

      {/* Reviews List */}
      <div className="space-y-4">
        {filteredReviews.length === 0 ? (
          <div className="bg-white p-12 text-center rounded-xl border border-black/5 shadow-sm">
            <MessageSquare className="w-12 h-12 text-deep-green/20 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-deep-green mb-2">لا توجد مراجعات</h3>
            <p className="text-deep-green/60">لم يتم العثور على أي مراجعات تطابق الفلتر الحالي.</p>
          </div>
        ) : (
          filteredReviews.map(review => (
            <div key={review.id} className="bg-white p-6 rounded-xl border border-black/5 shadow-sm hover:shadow-md transition-shadow relative">
              {/* Status Badge */}
              <div className="absolute top-6 left-6 flex items-center gap-2">
                {review.status === 'PENDING' && <span className="bg-orange-100 text-orange-700 text-xs font-bold px-3 py-1 rounded-full">مسودة</span>}
                {review.status === 'APPROVED' && <span className="bg-emerald/10 text-brand text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1"><CheckCircle2 size={12}/> معتمدة</span>}
                {review.status === 'REJECTED' && <span className="bg-red-100 text-red-700 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1"><XCircle size={12}/> مخفية</span>}
              </div>

              <div className="flex flex-col md:flex-row gap-6">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-lg font-bold text-deep-green">{review.name}</h3>
                    {review.city && <span className="text-sm text-deep-green/50">- {review.city}</span>}
                  </div>
                  
                  <div className="flex text-gold mb-3">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} size={16} fill={i < review.rating ? "currentColor" : "none"} strokeWidth={1.5} />
                    ))}
                  </div>

                  <p className="text-deep-green/80 leading-relaxed mb-4">{review.content}</p>
                  
                  <div className="flex items-center gap-2 text-sm text-deep-green/50 font-bold">
                    <span>تاريخ الإضافة:</span>
                    <span dir="ltr">{new Date(review.createdAt).toLocaleDateString('en-GB')}</span>
                  </div>
                </div>

                <div className="flex flex-col justify-between items-end min-w-[200px] border-t md:border-t-0 md:border-r border-black/5 pt-4 md:pt-0 md:pr-6">
                  {/* Context (Global vs Product) */}
                  <div className="w-full mb-6">
                    <p className="text-xs font-bold text-deep-green/50 mb-2 uppercase">موقع المراجعة</p>
                    {review.isGlobal ? (
                      <div className="bg-[#F9F7F2] text-deep-green px-3 py-2 rounded text-sm font-bold flex items-center justify-center">
                        التقييم العام (الرئيسية)
                      </div>
                    ) : (
                      <div className="flex items-center gap-3 bg-[#F9F7F2] p-2 rounded">
                        {review.product?.imageUrl && (
                          <div className="relative w-10 h-10 rounded overflow-hidden flex-shrink-0 border border-black/5">
                            <Image src={review.product.imageUrl} alt={review.product.name} fill className="object-cover" />
                          </div>
                        )}
                        <span className="text-sm font-bold text-deep-green line-clamp-2">{review.product?.name}</span>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 w-full">
                    {review.status !== 'APPROVED' && (
                      <button 
                        onClick={() => handleStatusChange(review.id, 'APPROVED')}
                        className="flex-1 bg-emerald text-white font-bold py-2 rounded-md hover:bg-deep-green transition-colors text-sm flex justify-center items-center gap-1"
                      >
                        <CheckCircle2 size={16} /> قبول
                      </button>
                    )}
                    
                    {review.status !== 'REJECTED' && (
                      <button 
                        onClick={() => handleStatusChange(review.id, 'REJECTED')}
                        className="flex-1 bg-orange-50 text-orange-600 font-bold py-2 rounded-md hover:bg-orange-100 border border-orange-200 transition-colors text-sm flex justify-center items-center gap-1"
                      >
                        <XCircle size={16} /> إخفاء
                      </button>
                    )}

                    <button 
                      onClick={() => handleDelete(review.id)}
                      className="bg-red-50 text-red-600 p-2 rounded-md hover:bg-red-100 border border-red-200 transition-colors flex-shrink-0"
                      title="حذف نهائي"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
