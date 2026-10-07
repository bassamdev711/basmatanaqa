'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Lock, Phone, ArrowRight, UserCircle2, Mail, User } from 'lucide-react'

export default function CustomerRegisterPage() {
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('+967')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    
    if (password.length < 10) {
      setError('كلمة المرور يجب أن تكون 10 أحرف على الأقل')
      return
    }

    if (phone.length !== 13) {
      setError('رقم الهاتف يجب أن يتكون من 9 أرقام بعد الرمز +967')
      return
    }

    setLoading(true)

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          name, 
          phone, 
          email: email.trim() ? email : undefined, 
          password 
        }),
      })

      const data = await res.json()

      if (res.ok) {
        router.push('/account')
        router.refresh()
      } else {
        setError(data.error || 'حدث خطأ أثناء إنشاء الحساب')
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

      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-accent/10 p-8 my-10">
        
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-surface rounded-full flex items-center justify-center border border-accent/20">
            <UserCircle2 className="w-8 h-8 text-brand" />
          </div>
        </div>

        <h1 className="text-3xl font-bold text-center text-foreground mb-2">إنشاء حساب</h1>
        <p className="text-center text-foreground/60 mb-8 text-sm">
          انضم إلينا في بصمة أناقة واستمتع بتجربة تسوق فريدة
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-foreground mb-1">
              الاسم الكامل
            </label>
            <div className="relative">
              <User className="absolute right-4 top-1/2 -translate-y-1/2 text-foreground/40 w-5 h-5" />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full pl-4 pr-12 py-3 bg-surface/50 border border-foreground/10 rounded-xl focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent text-foreground transition-all"
                placeholder="الاسم الثلاثي"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-foreground mb-1">
              رقم الهاتف
            </label>
            <div className="relative">
              <Phone className="absolute right-4 top-1/2 -translate-y-1/2 text-foreground/40 w-5 h-5" />
              <input
                type="tel"
                dir="ltr"
                value={phone}
                onChange={(e) => {
                  let val = e.target.value;
                  if (!val.startsWith('+967')) {
                    val = '+967';
                  }
                  const digits = val.slice(4).replace(/\D/g, '').slice(0, 9);
                  setPhone('+967' + digits);
                }}
                className="w-full pl-4 pr-12 py-3 bg-surface/50 border border-foreground/10 rounded-xl focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent text-foreground transition-all text-left"
                placeholder="+967XXXXXXXXX"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-foreground mb-1">
              البريد الإلكتروني <span className="text-foreground/40 text-xs font-normal">(اختياري)</span>
            </label>
            <div className="relative">
              <Mail className="absolute right-4 top-1/2 -translate-y-1/2 text-foreground/40 w-5 h-5" />
              <input
                type="email"
                dir="ltr"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-4 pr-12 py-3 bg-surface/50 border border-foreground/10 rounded-xl focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent text-foreground transition-all text-right"
                placeholder="email@example.com"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-foreground mb-1">
              كلمة المرور
            </label>
            <div className="relative">
              <Lock className="absolute right-4 top-1/2 -translate-y-1/2 text-foreground/40 w-5 h-5" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-4 pr-12 py-3 bg-surface/50 border border-foreground/10 rounded-xl focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent text-foreground transition-all"
                placeholder="10 أحرف على الأقل"
                required
              />
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
            className="btn btn-primary w-full btn-lg mt-4"
          >
            {loading ? 'جاري الإنشاء...' : 'إنشاء حساب'}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-foreground/5 text-center">
          <p className="text-sm text-foreground/60">
            لديك حساب مسبقاً؟{' '}
            <Link href="/account/login" className="font-bold text-brand hover:text-accent smooth-transition">
              تسجيل الدخول
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
