'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  Lock, 
  ArrowRight, 
  UserCircle2, 
  Mail, 
  User, 
  Eye, 
  EyeOff, 
  Award, 
  Gift, 
  Clock, 
  ShieldCheck 
} from 'lucide-react'
import { PhoneInput } from '@/components/PhoneInput'

export default function CustomerRegisterPage() {
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [agreeToTerms, setAgreeToTerms] = useState(false)
  
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    
    if (password.length < 8) {
      setError('كلمة المرور يجب أن تكون 8 أحرف على الأقل')
      return
    }

    if (phone.length !== 9 || !phone.startsWith('7')) {
      setError('رقم الهاتف يجب أن يتكون من 9 أرقام ويبدأ بـ 7')
      return
    }

    if (!agreeToTerms) {
      setError('يجب الموافقة على سياسة الخصوصية وشروط الاستخدام لإنشاء الحساب')
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
    } catch {
      setError('حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-surface flex flex-col justify-between items-center p-4 sm:p-6 md:p-8 font-sans text-foreground relative overflow-hidden" dir="rtl">
      {/* Decorative ambient background glows */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-accent/10 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-brand/5 rounded-full blur-3xl pointer-events-none -z-10" />

      {/* Top Header Bar */}
      <header className="w-full max-w-5xl flex items-center justify-between py-4 mb-4 sm:mb-8 z-10">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-10 h-10 rounded-2xl bg-brand/10 border border-brand/20 flex items-center justify-center text-accent group-hover:scale-105 transition-transform duration-300">
            <ShieldCheck className="w-5 h-5 text-accent" />
          </div>
          <div>
            <span className="font-black text-lg md:text-xl text-foreground tracking-tight block">شهرزاد</span>
            <span className="text-[10px] text-foreground/50 tracking-wider font-semibold block uppercase">بوابة حساب العميل</span>
          </div>
        </Link>

        <Link 
          href="/" 
          className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 border border-foreground/10 text-xs font-bold text-foreground/70 hover:text-brand hover:border-brand/30 transition-all duration-200 shadow-sm"
        >
          <ArrowRight size={16} />
          <span>العودة للمتجر</span>
        </Link>
      </header>

      {/* Main Card Container */}
      <main className="w-full max-w-md my-auto z-10">
        <div className="bg-white rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.06)] border border-foreground/8 overflow-hidden">
          {/* Top Brand Accent Gradient Bar */}
          <div className="h-1.5 w-full bg-gradient-to-r from-brand via-accent to-brand-deep" />

          {/* Navigation Tabs (Login / Register) */}
          <div className="grid grid-cols-2 p-2 bg-surface/60 border-b border-foreground/6">
            <Link
              href="/account/login"
              className="py-3 text-xs md:text-sm font-bold rounded-2xl text-foreground/60 hover:text-brand hover:bg-white/50 transition-all text-center"
            >
              تسجيل الدخول
            </Link>
            <button
              type="button"
              className="py-3 text-xs md:text-sm font-bold rounded-2xl bg-white text-brand shadow-sm border border-foreground/5 transition-all text-center"
            >
              إنشاء حساب جديد
            </button>
          </div>

          <div className="p-6 sm:p-8">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-brand/5 border border-brand/15 text-brand mb-3 shadow-inner">
                <UserCircle2 className="w-8 h-8 text-accent" />
              </div>
              <h1 className="text-2xl font-black text-foreground tracking-tight mb-1">انضم إلى شهرزاد</h1>
              <p className="text-xs text-foreground/60 leading-relaxed">
                أنشئ حسابك واستمتع بمكافآت حصرية وتجربة تسوق متكاملة
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-foreground mb-1.5">
                  الاسم الكامل
                </label>
                <div className="relative">
                  <User className="absolute right-3.5 top-1/2 -translate-y-1/2 text-foreground/40 w-4 h-4 pointer-events-none" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-4 pr-11 py-3 bg-surface/70 border border-foreground/10 rounded-2xl focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 text-foreground transition-all text-sm font-medium"
                    placeholder="الاسم الثلاثي"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-foreground mb-1.5">
                  رقم الهاتف (الواتساب)
                </label>
                <PhoneInput 
                  value={phone}
                  onChange={setPhone}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-foreground mb-1.5">
                  البريد الإلكتروني <span className="text-foreground/40 text-[11px] font-normal">(اختياري)</span>
                </label>
                <div className="relative">
                  <Mail className="absolute right-3.5 top-1/2 -translate-y-1/2 text-foreground/40 w-4 h-4 pointer-events-none" />
                  <input
                    type="email"
                    dir="ltr"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-4 pr-11 py-3 bg-surface/70 border border-foreground/10 rounded-2xl focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 text-foreground transition-all text-left text-sm font-medium"
                    placeholder="name@example.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-foreground mb-1.5">
                  كلمة المرور
                </label>
                <div className="relative">
                  <Lock className="absolute right-3.5 top-1/2 -translate-y-1/2 text-foreground/40 w-4 h-4 pointer-events-none" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-11 pr-11 py-3 bg-surface/70 border border-foreground/10 rounded-2xl focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 text-foreground transition-all text-sm font-medium"
                    placeholder="8 أحرف على الأقل"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-foreground/40 hover:text-foreground/70 focus:outline-none cursor-pointer"
                    aria-label={showPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="p-3 bg-red-50 text-red-700 text-xs font-bold rounded-2xl border border-red-200 text-center animate-fade-in">
                  {error}
                </div>
              )}

              <div className="flex items-start gap-2.5 pt-1">
                <input
                  type="checkbox"
                  id="terms"
                  checked={agreeToTerms}
                  onChange={(e) => setAgreeToTerms(e.target.checked)}
                  className="mt-0.5 shrink-0 w-4 h-4 accent-brand rounded cursor-pointer"
                />
                <label htmlFor="terms" className="text-xs text-foreground/75 leading-relaxed cursor-pointer select-none">
                  أوافق على{' '}
                  <Link href="/policies/privacy-policy" className="font-bold text-brand hover:underline" target="_blank">
                    سياسة الخصوصية
                  </Link>{' '}
                  و{' '}
                  <Link href="/policies/terms-of-service" className="font-bold text-brand hover:underline" target="_blank">
                    شروط الاستخدام
                  </Link>
                </label>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 px-4 bg-brand text-surface hover:bg-brand-hover active:scale-[0.99] rounded-2xl text-sm font-bold text-center flex items-center justify-center gap-2 shadow-md shadow-brand/15 transition-all duration-200 cursor-pointer disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-surface/30 border-t-surface rounded-full animate-spin" />
                    <span>جاري إنشاء الحساب...</span>
                  </>
                ) : (
                  <span>إنشاء الحساب الآن</span>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Benefits Strip */}
        <div className="mt-6 grid grid-cols-3 gap-2 px-2 text-center">
          <div className="p-2.5 rounded-2xl bg-white/60 border border-foreground/5">
            <Award className="w-4 h-4 text-accent mx-auto mb-1" />
            <span className="text-[10px] font-bold text-foreground/70 block">مكافآتي</span>
          </div>
          <div className="p-2.5 rounded-2xl bg-white/60 border border-foreground/5">
            <Clock className="w-4 h-4 text-accent mx-auto mb-1" />
            <span className="text-[10px] font-bold text-foreground/70 block">تتبع فوري</span>
          </div>
          <div className="p-2.5 rounded-2xl bg-white/60 border border-foreground/5">
            <ShieldCheck className="w-4 h-4 text-accent mx-auto mb-1" />
            <span className="text-[10px] font-bold text-foreground/70 block">خصوصية تامة</span>
          </div>
        </div>
      </main>

      {/* Footer copyright */}
      <footer className="w-full max-w-md text-center py-4 text-[11px] text-foreground/40 font-medium z-10">
        متجر شهرزاد © جميع الحقوق محفوظة
      </footer>
    </div>
  )
}
