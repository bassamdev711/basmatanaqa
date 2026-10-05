'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import ImageUpload from '../products/ImageUpload'
import { setupAdminProfile } from '../profile/actions'
import { CheckCircle2, User, Lock, AlertCircle } from 'lucide-react'

export default function SetupClient({ storeName }: { storeName: string }) {
  const router = useRouter()
  
  const [name, setName] = useState('مدير المتجر')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    
    if (password !== confirmPassword) {
      setError('كلمة المرور غير متطابقة')
      return
    }
    if (password.length < 12 || !/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/\d/.test(password)) {
      setError('كلمة المرور يجب أن تتكون من 12 محرفًا على الأقل وتحتوي على حرف كبير وحرف صغير ورقم')
      return
    }

    setLoading(true)
    const formData = new FormData()
    formData.append('name', name)
    formData.append('avatarUrl', avatarUrl)
    formData.append('password', password)

    const res = await setupAdminProfile(formData)
    if (res.success) {
      router.push('/admin')
    } else {
      setError(res.error || 'حدث خطأ غير متوقع')
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto mt-10">
      <div className="bg-white p-8 md:p-12 shadow-xl border border-black/5 rounded-3xl relative overflow-hidden">
        
        {/* Decorative Top */}
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-gold to-emerald" />
        
        <div className="text-center mb-10">
          <h1 className="text-3xl font-black text-deep-green mb-3">أهلاً بك في لوحة تحكم {storeName}</h1>
          <p className="text-deep-green/60">لنقم بتهيئة حساب الإدارة الخاص بك كخطوة أخيرة.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          
          {/* Avatar Upload */}
          <div className="flex flex-col items-center">
            <label className="block text-sm font-bold text-deep-green mb-4">صورة الملف الشخصي (اختياري)</label>
            <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-ivory shadow-inner bg-gray-50 mb-2 relative">
              {avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-300">
                  <User size={48} />
                </div>
              )}
            </div>
            <div className="w-full max-w-xs">
              <ImageUpload 
                mainImage={avatarUrl}
                onMainImageChange={(url) => setAvatarUrl(url)} 
                singleOnly={true}
              />
            </div>
          </div>

          <div className="space-y-6 pt-4 border-t border-black/5">
            <div>
              <label className="block text-sm font-bold text-deep-green mb-2">اسم المدير أو اللقب</label>
              <div className="relative">
                <User className="absolute right-4 top-1/2 -translate-y-1/2 text-deep-green/40 w-5 h-5" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-4 pr-12 py-4 bg-ivory/30 border border-black/10 rounded-xl focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold text-deep-green transition-all font-bold"
                  placeholder="مثال: أحمد، مدير المتجر..."
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-deep-green mb-2">كلمة المرور الجديدة</label>
              <div className="relative">
                <Lock className="absolute right-4 top-1/2 -translate-y-1/2 text-deep-green/40 w-5 h-5" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-4 pr-12 py-4 bg-ivory/30 border border-black/10 rounded-xl focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold text-deep-green transition-all"
                  placeholder="أدخل كلمة مرور قوية"
                  required
                  minLength={12}
                />
              </div>
              <p className="text-xs text-gray-500 mt-2">ستستخدم هذه الكلمة لتسجيل الدخول لاحقاً بدلاً من الكلمة الافتراضية.</p>
            </div>

            <div>
              <label className="block text-sm font-bold text-deep-green mb-2">تأكيد كلمة المرور</label>
              <div className="relative">
                <Lock className="absolute right-4 top-1/2 -translate-y-1/2 text-deep-green/40 w-5 h-5" />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pl-4 pr-12 py-4 bg-ivory/30 border border-black/10 rounded-xl focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold text-deep-green transition-all"
                  placeholder="أعد إدخال كلمة المرور"
                  required
                  minLength={12}
                />
              </div>
            </div>
          </div>

          {error && (
            <div className="p-4 bg-red-50 text-red-700 text-sm font-bold rounded-xl border border-red-100 flex items-center gap-3">
              <AlertCircle size={20} />
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-emerald text-white font-bold text-lg py-4 rounded-xl border border-transparent hover:bg-emerald/90 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed shadow-[0px_4px_10px_rgba(26,84,74,0.3)] active:scale-95 mt-4"
          >
            {loading ? 'جاري حفظ الإعدادات...' : <><CheckCircle2 size={24} /> حفظ وبدء استخدام المتجر</>}
          </button>
        </form>

      </div>
    </div>
  )
}
