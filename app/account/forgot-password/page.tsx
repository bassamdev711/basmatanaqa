'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowRight, KeyRound, CheckCircle2 } from 'lucide-react'
import { PhoneInput } from '@/components/PhoneInput'

export default function ForgotPasswordPage() {
  const [phone, setPhone] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    
    if (phone.length !== 9 || !phone.startsWith('7')) {
      setError('رقم الهاتف يجب أن يتكون من 9 أرقام ويبدأ بـ 7')
      return
    }

    setLoading(true)

    try {
      const res = await fetch('/api/auth/reset-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: `+967${phone}` }),
      })

      const data = await res.json()

      if (res.ok) {
        setSuccess(true)
      } else {
        setError(data.error || 'حدث خطأ. يرجى المحاولة مرة أخرى.')
      }
    } catch (err) {
      setError('حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-surface flex flex-col justify-center items-center p-4 font-sans text-foreground" dir="rtl">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-accent/10 p-8 text-center">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center border border-green-200">
              <CheckCircle2 className="w-8 h-8 text-green-500" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-4">تم تقديم طلبك بنجاح</h1>
          <p className="text-foreground/70 leading-relaxed mb-8">
            سيتم التواصل معك على هذا الرقم في أقرب وقت. سيقوم فريقنا بالتحقق من ملكية الرقم ثم إرسال رابط تغيير كلمة المرور عبر واتساب.
          </p>
          <Link href="/" className="btn btn-primary w-full btn-lg !bg-accent !text-foreground hover:!bg-accent/90">
            العودة للرئيسية
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-surface flex flex-col justify-center items-center p-4 font-sans text-foreground" dir="rtl">
      
      <Link href="/account/login" className="btn btn-ghost gap-2 absolute top-6 right-6 md:top-8 md:right-8 text-foreground/60 hover:text-brand">
        <ArrowRight size={20} />
        العودة لتسجيل الدخول
      </Link>

      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-accent/10 p-8">
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-surface rounded-full flex items-center justify-center border border-accent/20">
            <KeyRound className="w-8 h-8 text-brand" />
          </div>
        </div>

        <h1 className="text-3xl font-bold text-center text-foreground mb-2">نسيت كلمة المرور؟</h1>
        <p className="text-center text-foreground/60 mb-8 text-sm">
          أدخل رقم هاتفك وسنقوم بمساعدتك في استعادة حسابك.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-foreground mb-1">
              رقم الهاتف
            </label>
            <PhoneInput 
              value={phone}
              onChange={setPhone}
              required
            />
          </div>

          {error && (
            <div className="p-3 mt-2 bg-red-50 text-red-600 text-sm font-semibold rounded-lg border border-red-100 text-center">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary w-full btn-lg mt-4 !bg-accent !text-foreground hover:!bg-accent/90"
          >
            {loading ? 'جاري الإرسال...' : 'إرسال طلب استعادة'}
          </button>
        </form>
      </div>
    </div>
  )
}
