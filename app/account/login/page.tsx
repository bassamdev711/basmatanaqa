'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Lock, Phone, ArrowRight, UserCircle2, Mail, Eye, EyeOff } from 'lucide-react'

export default function CustomerLoginPage() {
  const [loginType, setLoginType] = useState<'PHONE' | 'EMAIL'>('PHONE')
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, password }),
      })

      const data = await res.json()

      if (res.ok) {
        router.push('/account')
        router.refresh()
      } else {
        setError(data.error || 'حدث خطأ أثناء تسجيل الدخول')
        setLoading(false)
      }
    } catch (err) {
      setError('حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-surface flex flex-col justify-center items-center p-4 font-sans text-foreground" dir="rtl">
      
      <Link href="/" className="btn btn-ghost gap-2 absolute top-6 right-6 md:top-8 md:right-8 text-foreground/60 hover:text-brand">
        <ArrowRight size={20} />
        العودة للمتجر
      </Link>

      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-accent/10 p-8">
        
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-surface rounded-full flex items-center justify-center border border-accent/20">
            <UserCircle2 className="w-8 h-8 text-brand" />
          </div>
        </div>

        <h1 className="text-3xl font-bold text-center text-foreground mb-2">تسجيل الدخول</h1>
        <p className="text-center text-foreground/60 mb-8 text-sm">
          مرحباً بك مجدداً في شهرزاد
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-sm font-semibold text-foreground">
                {loginType === 'PHONE' ? 'رقم الهاتف' : 'البريد الإلكتروني'}
              </label>
              <button 
                type="button" 
                onClick={() => { setLoginType(loginType === 'PHONE' ? 'EMAIL' : 'PHONE'); setIdentifier(''); }}
                className="text-xs font-bold text-brand hover:text-accent transition-colors"
              >
                {loginType === 'PHONE' ? 'استخدام البريد الإلكتروني' : 'استخدام رقم الهاتف'}
              </button>
            </div>

            {loginType === 'PHONE' ? (
              <div className="relative flex items-center bg-surface/50 border border-foreground/10 rounded-xl focus-within:border-accent focus-within:ring-1 focus-within:ring-accent transition-all overflow-hidden" dir="ltr">
                <span className="pl-4 pr-3 font-bold text-foreground/70 select-none border-r border-foreground/10 py-3 flex items-center justify-center bg-black/5">+967</span>
                <input
                  type="tel"
                  value={identifier.replace('+967', '')}
                  onChange={(e) => {
                    let digits = e.target.value.replace(/\D/g, '');
                    digits = digits.replace(/^[^7]+/, '');
                    setIdentifier('+967' + digits.slice(0, 9));
                  }}
                  className="w-full pl-3 pr-12 py-3 bg-transparent outline-none text-foreground"
                  placeholder="7XXXXXXXX"
                  minLength={9}
                  maxLength={9}
                  required
                />
                <Phone className="absolute right-4 top-1/2 -translate-y-1/2 text-foreground/40 w-5 h-5" />
              </div>
            ) : (
              <div className="relative">
                <Mail className="absolute right-4 top-1/2 -translate-y-1/2 text-foreground/40 w-5 h-5" />
                <input
                  type="email"
                  dir="ltr"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="w-full pl-4 pr-12 py-3 bg-surface/50 border border-foreground/10 rounded-xl focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent text-foreground transition-all text-left"
                  placeholder="email@example.com"
                  required
                />
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-foreground mb-2">
              كلمة المرور
            </label>
            <div className="relative">
              <Lock className="absolute right-4 top-1/2 -translate-y-1/2 text-foreground/40 w-5 h-5" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-12 pr-12 py-3 bg-surface/50 border border-foreground/10 rounded-xl focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent text-foreground transition-all"
                placeholder="أدخل كلمة المرور"
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
            {/* <div className="mt-2 text-left">
              <Link href="/account/forgot-password" className="text-xs text-brand hover:text-accent smooth-transition">
                نسيت كلمة المرور؟
              </Link>
            </div> */}
          </div>

          {error && (
            <div className="p-3 bg-red-50 text-red-600 text-sm font-semibold rounded-lg border border-red-100 text-center">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary w-full btn-lg mt-2"
          >
            {loading ? 'جاري التحقق...' : 'تسجيل الدخول'}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-foreground/5 text-center">
          <p className="text-sm text-foreground/60">
            ليس لديك حساب؟{' '}
            <Link href="/account/register" className="font-bold text-brand hover:text-accent smooth-transition">
              إنشاء حساب جديد
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
