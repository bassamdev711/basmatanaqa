'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Lock, CheckCircle2, ShieldCheck, Eye, EyeOff } from 'lucide-react'
import { PhoneInput } from '@/components/PhoneInput'
import { use } from 'react'

export default function ResetPasswordPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params)
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    
    if (phone.length !== 9 || !phone.startsWith('7')) {
      setError('رقم الهاتف غير صحيح')
      return
    }

    if (password.length < 8) {
      setError('كلمة المرور يجب أن تكون 8 أحرف على الأقل')
      return
    }

    if (password !== confirmPassword) {
      setError('كلمات المرور غير متطابقة')
      return
    }

    setLoading(true)

    try {
      const res = await fetch('/api/auth/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          token,
          phone: `+967${phone}`,
          password 
        }),
      })

      const data = await res.json()

      if (res.ok) {
        setSuccess(true)
        setTimeout(() => {
          router.push('/account/login')
        }, 3000)
      } else {
        setError(data.error || 'حدث خطأ. ربما يكون الرابط منتهياً.')
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
          <h1 className="text-2xl font-bold text-foreground mb-4">تم تغيير كلمة المرور بنجاح</h1>
          <p className="text-foreground/70 leading-relaxed mb-8">
            يمكنك الآن تسجيل الدخول باستخدام كلمة المرور الجديدة. سيتم تحويلك تلقائياً.
          </p>
          <Link href="/account/login" className="btn btn-primary w-full btn-lg !bg-accent !text-foreground hover:!bg-accent/90">
            تسجيل الدخول
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-surface flex flex-col justify-center items-center p-4 font-sans text-foreground" dir="rtl">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-accent/10 p-8">
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-surface rounded-full flex items-center justify-center border border-accent/20">
            <ShieldCheck className="w-8 h-8 text-brand" />
          </div>
        </div>

        <h1 className="text-3xl font-bold text-center text-foreground mb-2">تغيير كلمة المرور</h1>
        <p className="text-center text-foreground/60 mb-8 text-sm">
          أدخل رقم هاتفك وكلمة المرور الجديدة لإتمام العملية.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-foreground mb-1">
              رقم الهاتف للتأكيد
            </label>
            <PhoneInput 
              value={phone}
              onChange={setPhone}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-foreground mb-1">
              كلمة المرور الجديدة
            </label>
            <div className="relative">
              <Lock className="absolute right-4 top-1/2 -translate-y-1/2 text-foreground/40 w-5 h-5" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-12 pr-12 py-3 bg-surface/50 border border-foreground/10 rounded-xl focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent text-foreground transition-all"
                placeholder="8 أحرف على الأقل"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-foreground/40 hover:text-foreground/70 focus:outline-none"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-foreground mb-1">
              تأكيد كلمة المرور
            </label>
            <div className="relative">
              <Lock className="absolute right-4 top-1/2 -translate-y-1/2 text-foreground/40 w-5 h-5" />
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full pl-12 pr-12 py-3 bg-surface/50 border border-foreground/10 rounded-xl focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent text-foreground transition-all"
                placeholder="أعد كتابة كلمة المرور"
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-foreground/40 hover:text-foreground/70 focus:outline-none"
              >
                {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
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
            {loading ? 'جاري الحفظ...' : 'حفظ كلمة المرور'}
          </button>
        </form>
      </div>
    </div>
  )
}
