'use client'

import { useState } from 'react'
import { changeCustomerPassword, toggleCustomerStatus, hardDeleteCustomer } from '../actions'
import { Lock, UserX, UserCheck, Loader2, Eye, EyeOff, AlertTriangle, Trash2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface CustomerSettingsProps {
  userId: string
  isActive: boolean
}

export default function CustomerSettings({ userId, isActive }: CustomerSettingsProps) {
  const router = useRouter()
  
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isSubmittingPassword, setIsSubmittingPassword] = useState(false)
  const [passwordError, setPasswordError] = useState('')
  const [passwordSuccess, setPasswordSuccess] = useState('')

  const [isTogglingStatus, setIsTogglingStatus] = useState(false)
  const [statusError, setStatusError] = useState('')
  const [reason, setReason] = useState('')
  const [showReasonInput, setShowReasonInput] = useState(false)

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleteWord, setDeleteWord] = useState('')
  const [expectedWord, setExpectedWord] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)

  const generateWord = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
    let w = ''
    for (let i = 0; i < 5; i++) w += chars.charAt(Math.floor(Math.random() * chars.length))
    setExpectedWord(w)
  }

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setPasswordError('')
    setPasswordSuccess('')

    if (password.length < 6) {
      setPasswordError('كلمة المرور يجب أن تكون 6 أحرف على الأقل')
      return
    }

    if (password !== confirmPassword) {
      setPasswordError('كلمات المرور غير متطابقة')
      return
    }

    setIsSubmittingPassword(true)
    try {
      const result = await changeCustomerPassword(userId, password)
      if (result.success) {
        setPasswordSuccess('تم تغيير كلمة المرور بنجاح')
        setPassword('')
        setConfirmPassword('')
        setTimeout(() => setIsChangingPassword(false), 2000)
      } else {
        setPasswordError(result.error || 'حدث خطأ غير معروف')
      }
    } catch (err) {
      setPasswordError('حدث خطأ أثناء الاتصال بالخادم')
    } finally {
      setIsSubmittingPassword(false)
    }
  }

  const handleToggleStatus = async () => {
    if (isActive && !showReasonInput) {
      setShowReasonInput(true)
      return
    }
    
    if (isActive && showReasonInput && !reason.trim()) {
      setStatusError('يجب إدخال سبب التقييد')
      return
    }

    if (!confirm(isActive ? 'هل أنت متأكد من تعطيل حساب هذا العميل؟ لن يتمكن من تسجيل الدخول.' : 'هل أنت متأكد من تفعيل حساب هذا العميل؟ سيتمكن من تسجيل الدخول مجدداً.')) {
      return
    }

    setIsTogglingStatus(true)
    setStatusError('')
    try {
      const result = await toggleCustomerStatus(userId, reason)
      if (!result.success) {
        setStatusError(result.error || 'حدث خطأ غير معروف')
      } else {
        setShowReasonInput(false)
        setReason('')
      }
    } catch (err) {
      setStatusError('حدث خطأ أثناء الاتصال بالخادم')
    } finally {
      setIsTogglingStatus(false)
    }
  }

  const handleDeleteAccount = async () => {
    if (deleteWord !== expectedWord) return alert('الكلمة غير متطابقة')
    setIsDeleting(true)
    try {
      const res = await hardDeleteCustomer(userId)
      if (res.success) {
        router.push('/admin/customers')
      } else {
        alert(res.error || 'حدث خطأ')
        setIsDeleting(false)
      }
    } catch (err) {
      alert('خطأ في الاتصال بالخادم')
      setIsDeleting(false)
    }
  }

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
      <h2 className="text-lg font-bold text-gray-900 border-b pb-3 mb-4 flex items-center gap-2">
        <Lock className="w-5 h-5 text-gray-400" />
        إدارة الحساب
      </h2>

      <div className="space-y-4">
        {/* Toggle Status */}
        <div className="flex flex-col gap-2">
          {statusError && <p className="text-sm text-red-500">{statusError}</p>}
          
          {showReasonInput && isActive && (
            <div className="mb-2 bg-gray-50 p-3 rounded-lg border border-gray-200">
              <label className="block text-sm font-medium text-gray-700 mb-1">سبب التقييد (سيظهر للعميل)</label>
              <textarea 
                value={reason} 
                onChange={e => setReason(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 outline-none resize-none text-sm"
                rows={2}
                placeholder="مثال: مخالفة سياسات المتجر، حساب مكرر..."
              />
              <div className="flex justify-end mt-2">
                <button 
                  onClick={() => { setShowReasonInput(false); setReason(''); setStatusError(''); }} 
                  className="text-xs text-gray-500 hover:underline"
                >
                  إلغاء التعطيل
                </button>
              </div>
            </div>
          )}

          <button
            onClick={handleToggleStatus}
            disabled={isTogglingStatus}
            className={`flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-lg font-medium transition-colors ${
              isActive 
                ? 'bg-red-50 text-red-700 hover:bg-red-100 border border-red-200'
                : 'bg-green-50 text-green-700 hover:bg-green-100 border border-green-200'
            } disabled:opacity-50`}
          >
            {isTogglingStatus ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : isActive ? (
              <UserX className="w-4 h-4" />
            ) : (
              <UserCheck className="w-4 h-4" />
            )}
            {isActive ? (showReasonInput ? 'تأكيد التعطيل' : 'تعطيل الحساب') : 'تفعيل الحساب'}
          </button>
          <p className="text-xs text-gray-500 text-center">
            {isActive ? 'العميل معطل لن يتمكن من الطلب' : 'العميل سيعود لتسجيل الدخول والطلب بشكل طبيعي'}
          </p>
        </div>

        <hr className="border-gray-100 my-4" />

        {/* Change Password */}
        {!isChangingPassword ? (
          <button
            onClick={() => setIsChangingPassword(true)}
            className="flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-lg font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 border border-gray-200 transition-colors"
          >
            <Lock className="w-4 h-4" />
            تغيير كلمة المرور
          </button>
        ) : (
          <form onSubmit={handlePasswordSubmit} className="space-y-3 bg-gray-50 p-4 rounded-lg border border-gray-100">
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-1">كلمة المرور الجديدة</label>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald focus:border-emerald outline-none transition-all"
                placeholder="******"
                minLength={6}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute left-3 top-9 text-gray-400 hover:text-gray-600 focus:outline-none"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-1">تأكيد كلمة المرور</label>
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-3 py-2 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald focus:border-emerald outline-none transition-all"
                placeholder="******"
                minLength={6}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute left-3 top-9 text-gray-400 hover:text-gray-600 focus:outline-none"
              >
                {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>

            {passwordError && <p className="text-sm text-red-500">{passwordError}</p>}
            {passwordSuccess && <p className="text-sm text-green-600 font-medium">{passwordSuccess}</p>}

            <div className="flex gap-2 pt-2">
              <button
                type="submit"
                disabled={isSubmittingPassword}
                className="flex-1 bg-emerald text-white py-2 rounded-lg font-medium hover:bg-emerald/90 transition-colors disabled:opacity-50 flex justify-center items-center gap-2"
              >
                {isSubmittingPassword && <Loader2 className="w-4 h-4 animate-spin" />}
                حفظ
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsChangingPassword(false)
                  setPassword('')
                  setConfirmPassword('')
                  setPasswordError('')
                  setPasswordSuccess('')
                }}
                disabled={isSubmittingPassword}
                className="flex-1 bg-white text-gray-700 border border-gray-300 py-2 rounded-lg font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                إلغاء
              </button>
            </div>
          </form>
        )}

        <hr className="border-gray-100 my-4" />
        
        {/* Hard Delete Account */}
        <div className="flex flex-col gap-2 border border-red-100 bg-red-50/50 p-4 rounded-xl">
          <h3 className="text-red-800 font-bold flex items-center gap-2 text-sm"><AlertTriangle className="w-4 h-4"/> منطقة الخطر</h3>
          <p className="text-xs text-red-600 mb-2 leading-relaxed">حذف العميل نهائياً سيؤدي لمسح معلوماته ورصيد نقاطه وسجلاته ولن يمكن التراجع عن هذا الإجراء.</p>
          
          {!showDeleteConfirm ? (
             <button
               onClick={() => { setShowDeleteConfirm(true); generateWord(); }}
               className="flex items-center justify-center gap-2 w-full py-2 px-4 rounded-lg font-medium text-red-700 bg-white border border-red-200 hover:bg-red-50 transition-colors"
             >
               <Trash2 className="w-4 h-4" />
               حذف الحساب نهائياً
             </button>
          ) : (
            <div className="space-y-3 bg-white p-3 rounded-lg border border-red-200 mt-2">
              <p className="text-sm text-gray-700 text-center">لتأكيد الحذف، يرجى كتابة الكلمة التالية:</p>
              <div className="text-center">
                <span className="font-mono font-bold text-red-600 text-lg tracking-widest bg-red-50 px-3 py-1.5 rounded">{expectedWord}</span>
              </div>
              <input 
                type="text" 
                dir="ltr"
                value={deleteWord}
                onChange={e => setDeleteWord(e.target.value.toUpperCase())}
                className="w-full px-3 py-2 border border-red-300 rounded-lg text-center font-mono tracking-widest focus:ring-2 focus:ring-red-500 outline-none uppercase"
                placeholder="أدخل الكلمة هنا"
              />
              <div className="flex gap-2">
                <button
                  onClick={handleDeleteAccount}
                  disabled={isDeleting || deleteWord !== expectedWord}
                  className="flex-1 bg-red-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-red-700 transition-colors disabled:opacity-50 flex justify-center items-center gap-2"
                >
                  {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  تأكيد الحذف
                </button>
                <button
                  onClick={() => { setShowDeleteConfirm(false); setDeleteWord(''); }}
                  disabled={isDeleting}
                  className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors disabled:opacity-50"
                >
                  إلغاء
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

