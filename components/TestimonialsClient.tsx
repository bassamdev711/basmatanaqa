"use client";
import React, { startTransition, useState } from 'react'
import { motion } from "framer-motion";

import { Star, PenLine, ChevronRight, ChevronLeft } from "lucide-react";
import ReviewForm from "./ReviewForm";

type Review = {
  id: string
  name: string
  city: string | null
  content: string
  rating: number
}

export default function TestimonialsClient({ 
  reviews, 
  title = "آراء عملائنا", 
  subtitle = "تجربة لا تُنسى",
  productId 
}: { 
  reviews: Review[], 
  title?: string, 
  subtitle?: string,
  productId?: string
}) {
  const [showForm, setShowForm] = useState(false)
  const [currentIndex, setCurrentIndex] = useState(0)

  const [localReviews, setLocalReviews] = useState<Review[]>(reviews)

  React.useEffect(() => {
    try {
      const stored = localStorage.getItem('my_pending_reviews')
      if (stored) {
        const parsed = JSON.parse(stored) as Review[]
        const notApprovedYet = parsed.filter(pr => !reviews.some(sr => sr.id === pr.id))
        startTransition(() => {
          setLocalReviews([...notApprovedYet, ...reviews])
        })
        
        if (notApprovedYet.length !== parsed.length) {
            localStorage.setItem('my_pending_reviews', JSON.stringify(notApprovedYet))
        }
      } else {
        startTransition(() => {
          setLocalReviews(reviews)
        })
      }
    } catch {
      startTransition(() => {
        setLocalReviews(reviews)
      })
    }
  }, [reviews])

  const handleReviewAdded = (newReview: Review) => {
    setLocalReviews([newReview, ...localReviews])
    try {
      const stored = localStorage.getItem('my_pending_reviews')
      const parsed = stored ? JSON.parse(stored) : []
      parsed.push(newReview)
      localStorage.setItem('my_pending_reviews', JSON.stringify(parsed))
    } catch {}
    setShowForm(false)
  }

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 3 >= localReviews.length ? 0 : prev + 3))
  }

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 3 < 0 ? Math.max(0, localReviews.length - 3) : prev - 3))
  }

  const visibleReviews = localReviews.slice(currentIndex, currentIndex + 3)
  return (
    <section className="py-24 md:py-32 bg-surface-alt overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 lg:px-12 relative" dir="rtl">
        <div className="flex flex-col md:flex-row justify-between items-center mb-16 gap-6">
          <div className="text-center md:text-right">
            <span className="text-accent tracking-[0.3em] uppercase text-xs font-bold mb-4 block">
              {title}
            </span>
            <h2 className="text-2xl md:text-5xl font-black text-foreground mb-4">{subtitle}</h2>
            <div className="w-16 h-[2px] bg-brand md:ml-auto md:mr-0 mx-auto" />
          </div>
          
          <button 
            onClick={() => setShowForm(!showForm)}
            className="bg-brand text-white text-sm md:text-base font-bold py-2 md:py-3 px-4 md:px-8 rounded-none hover:bg-foreground transition-colors flex items-center gap-2"
          >
            <PenLine size={18} />
            {showForm ? 'إخفاء النموذج' : 'شاركنا مراجعتك'}
          </button>
        </div>

        {showForm && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mb-16"
          >
            <ReviewForm productId={productId} onSuccess={handleReviewAdded} />
          </motion.div>
        )}

        {localReviews.length === 0 ? (
          <div className="text-center py-6 md:py-12 text-foreground/60 bg-white border border-black/5">
            <p>كن أول من يشاركنا مراجعته!</p>
          </div>
        ) : (
          <div className="relative">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {visibleReviews.map((review, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: i * 0.2 }}
              className="bg-surface p-8 md:p-10 shadow-sm border border-black/5 flex flex-col justify-between"
            >
              <div>
                <div className="text-accent text-2xl mb-6">&quot;</div>
                <div className="flex text-accent mb-4">
                  {[...Array(5)].map((_, index) => (
                    <Star key={index} size={16} fill={index < review.rating ? "currentColor" : "none"} strokeWidth={1.5} />
                  ))}
                </div>
                <p className="text-foreground/80 font-light text-lg leading-relaxed mb-8">
                  {review.content}
                </p>
              </div>
              <div className="border-t border-black/5 pt-6 flex items-center gap-3">
                <div className="w-10 h-10 bg-brand/10 rounded-full flex items-center justify-center text-brand font-bold">
                  {review.name.charAt(0)}
                </div>
                <div>
                  <h4 className="text-foreground font-bold mb-1 flex items-center gap-1">
                    {review.name}
                    <span className="bg-brand text-white text-[10px] px-1.5 py-0.5 rounded-sm mr-1">مشتري موثوق</span>
                  </h4>
                  {review.city && <p className="text-brand text-sm">{review.city}</p>}
                </div>
              </div>
            </motion.div>
          ))}
            </div>

            {localReviews.length > 3 && (
              <div className="flex justify-center gap-4 mt-12">
                <button onClick={nextSlide} className="w-12 h-12 rounded-full border border-black/10 flex items-center justify-center text-foreground hover:bg-brand hover:text-white hover:border-brand transition-colors">
                  <ChevronRight size={24} />
                </button>
                <button onClick={prevSlide} className="w-12 h-12 rounded-full border border-black/10 flex items-center justify-center text-foreground hover:bg-brand hover:text-white hover:border-brand transition-colors">
                  <ChevronLeft size={24} />
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
