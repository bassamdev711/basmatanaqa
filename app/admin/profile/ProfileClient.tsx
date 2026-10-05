'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import ImageUpload from '../products/ImageUpload'
import { updateAdminProfile } from './actions'
import { CheckCircle2, User, Lock, AlertCircle, Image as ImageIcon } from 'lucide-react'

type ProfileProps = {
  initialName: string
  initialAvatar: string | null
  initialTheme: string | null
}

export default function ProfileClient({ initialName, initialAvatar, initialTheme }: ProfileProps) {
  const router = useRouter()
  
  const [name, setName] = useState(initialName)
  const [avatarUrl, setAvatarUrl] = useState(initialAvatar || '')
  const [themeBackground, setThemeBackground] = useState(initialTheme || '')
  
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    
    if (newPassword) {
      if (!currentPassword) {
        setError('يجب إدخال كلمة المرور الحالية')
        return
      }
      if (newPassword !== confirmPassword) {
        setError('كلمة المرور الجديدة غير متطابقة')
        return
      }
      if (newPassword.length < 6) {
        setError('كلمة المرور يجب أن لا تقل عن 6 أحرف')
        return
      }
    }

    setLoading(true)
    const formData = new FormData()
    formData.append('name', name)
    formData.append('avatarUrl', avatarUrl)
    formData.append('themeBackground', themeBackground)
    if (newPassword && currentPassword) {
      formData.append('currentPassword', currentPassword)
      formData.append('newPassword', newPassword)
    }

    const res = await updateAdminProfile(formData)
    if (res.success) {
      setSuccess('تم حفظ التعديلات بنجاح')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      router.refresh()
    } else {
      setError(res.error || 'حدث خطأ غير متوقع')
    }
    setLoading(false)
  }

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-3xl font-black text-deep-green mb-8">إعدادات حساب المدير</h1>
      
      <form onSubmit={handleSubmit} className="space-y-8">
        
        <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-black/5">
          <h2 className="text-xl font-bold text-deep-green mb-6 border-b border-black/5 pb-4">المعلومات الشخصية</h2>
          
          <div className="flex flex-col md:flex-row gap-8 items-start">
            <div className="flex flex-col items-center shrink-0">
              <label className="block text-sm font-bold text-deep-green mb-4">صورة الملف الشخصي</label>
              <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-ivory shadow-inner bg-gray-50 mb-4 relative">
                {avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-300">
                    <User size={48} />
                  </div>
                )}
              </div>
              <div className="w-40">
                <ImageUpload 
                  mainImage={avatarUrl}
                  onMainImageChange={(url) => setAvatarUrl(url)} 
                  singleOnly={true}
                />
              </div>
            </div>

            <div className="flex-1 w-full space-y-6">
              <div>
                <label className="block text-sm font-bold text-deep-green mb-2">اسم المدير أو اللقب</label>
                <div className="relative">
                  <User className="absolute right-4 top-1/2 -translate-y-1/2 text-deep-green/40 w-5 h-5" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-4 pr-12 py-3 bg-ivory/30 border border-black/10 rounded-xl focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold text-deep-green transition-all"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-deep-green mb-2">خلفية لوحة التحكم (Cover)</label>
                <div className="relative">
                  <ImageIcon className="absolute right-4 top-1/2 -translate-y-1/2 text-deep-green/40 w-5 h-5" />
                  <input
                    type="text"
                    value={themeBackground}
                    onChange={(e) => setThemeBackground(e.target.value)}
                    className="w-full pl-4 pr-12 py-3 bg-ivory/30 border border-black/10 rounded-xl focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold text-deep-green transition-all ltr"
                    placeholder="رابط صورة (https://...) أو لون (#1A544A)"
                    dir="ltr"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-2">تظهر هذه الخلفية أعلى جميع صفحات لوحة التحكم.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-black/5">
          <h2 className="text-xl font-bold text-deep-green mb-6 border-b border-black/5 pb-4">تغيير كلمة المرور</h2>
          
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-deep-green mb-2">كلمة المرور الحالية</label>
              <div className="relative">
                <Lock className="absolute right-4 top-1/2 -translate-y-1/2 text-deep-green/40 w-5 h-5" />
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full pl-4 pr-12 py-3 bg-ivory/30 border border-black/10 rounded-xl focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold text-deep-green transition-all"
                  placeholder="مطلوبة فقط إذا أردت تغيير كلمة المرور"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold text-deep-green mb-2">كلمة المرور الجديدة</label>
                <div className="relative">
                  <Lock className="absolute right-4 top-1/2 -translate-y-1/2 text-deep-green/40 w-5 h-5" />
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full pl-4 pr-12 py-3 bg-ivory/30 border border-black/10 rounded-xl focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold text-deep-green transition-all"
                    placeholder="لا تقل عن 6 أحرف"
                    disabled={!currentPassword}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-deep-green mb-2">تأكيد كلمة المرور الجديدة</label>
                <div className="relative">
                  <Lock className="absolute right-4 top-1/2 -translate-y-1/2 text-deep-green/40 w-5 h-5" />
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full pl-4 pr-12 py-3 bg-ivory/30 border border-black/10 rounded-xl focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold text-deep-green transition-all"
                    placeholder="أعد إدخال الكلمة الجديدة"
                    disabled={!currentPassword}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div className="p-4 bg-red-50 text-red-700 text-sm font-bold rounded-xl border border-red-100 flex items-center gap-3">
            <AlertCircle size={20} />
            {error}
          </div>
        )}

        {success && (
          <div className="p-4 bg-emerald/10 text-brand text-sm font-bold rounded-xl border border-emerald/20 flex items-center gap-3">
            <CheckCircle2 size={20} />
            {success}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-deep-green text-white font-bold text-lg py-4 rounded-xl border border-transparent hover:bg-emerald transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed shadow-[0px_4px_10px_rgba(26,84,74,0.3)] active:scale-95"
        >
          {loading ? 'جاري حفظ الإعدادات...' : <><CheckCircle2 size={24} /> حفظ الإعدادات</>}
        </button>
      </form>
    </div>
  )
}
