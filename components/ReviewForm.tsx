'use client'

import React, { useState } from 'react'
import { Star, Send } from 'lucide-react'
import { addReview } from '@/app/actions/reviews'
import { useToast } from '@/components/ToastProvider'

type Review = {
  id: string
  name: string
  city: string | null
  content: string
  rating: number
}

export default function ReviewForm({ productId, onSuccess }: { productId?: string, onSuccess?: (review: Review) => void }) {
  const [name, setName] = useState('')
  const [city, setCity] = useState('')
  const [content, setContent] = useState('')
  const [rating, setRating] = useState(5)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const { showToast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!name.trim() || !content.trim()) {
      showToast('error', 'الرجاء إدخال الاسم ونص المراجعة')
      return
    }

    setIsSubmitting(true)
    
    const res = await addReview({
      name,
      city,
      content,
      rating,
      productId
    })

    if (res.success) {
      showToast('success', 'تم إضافة مراجعتك بنجاح!')
      setName('')
      setCity('')
      setContent('')
      setRating(5)
      if (onSuccess && res.data) onSuccess(res.data)
    } else {
      showToast('error', res.error || 'حدث خطأ غير متوقع')
    }
    
    setIsSubmitting(false)
  }

  return (
    <div className="bg-white p-6 md:p-8 rounded-xl border border-black/5 shadow-sm max-w-2xl mx-auto my-12 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-1 h-full bg-brand"></div>
      
      <h3 className="text-2xl font-black text-foreground mb-2">شاركنا رأيك</h3>
      <p className="text-foreground/60 mb-8">يهمنا معرفة تجربتك {productId ? 'مع هذا المنتج' : 'مع متجرنا'}.</p>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Rating */}
        <div>
          <label className="block text-sm font-bold text-foreground mb-3">التقييم</label>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                className="focus:outline-none transition-transform hover:scale-110"
              >
                <Star 
                  size={28} 
                  fill={star <= rating ? "var(--color-accent)" : "none"} 
                  stroke={star <= rating ? "var(--color-accent)" : "#d1d5db"} 
                  strokeWidth={1.5} 
                />
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-bold text-foreground mb-2">الاسم</label>
            <input 
              type="text" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="اسمك الكريم"
              className="w-full bg-surface-alt border-none rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand/20 transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-foreground mb-2">المدينة <span className="text-xs text-foreground/40">(اختياري)</span></label>
            <input 
              type="text" 
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="مدينتك"
              className="w-full bg-surface-alt border-none rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand/20 transition-all"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-bold text-foreground mb-2">المراجعة</label>
          <textarea 
            value={content}
            onChange={(e) => setContent(e.target.value)}
            required
            placeholder="اكتب مراجعتك هنا..."
            rows={4}
            className="w-full bg-surface-alt border-none rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand/20 transition-all resize-none"
          ></textarea>
        </div>

        <button 
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-foreground text-surface font-bold py-4 rounded-lg hover:bg-brand transition-colors disabled:opacity-70 flex items-center justify-center gap-2"
        >
          {isSubmitting ? 'جاري الإرسال...' : (
            <>
              إرسال المراجعة
              <Send size={18} />
            </>
          )}
        </button>
      </form>
    </div>
  )
}
