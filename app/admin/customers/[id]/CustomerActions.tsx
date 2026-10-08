'use client'

import React, { useState } from 'react'
import { KeyRound, MessageCircle, Copy, CheckCircle2 } from 'lucide-react'

export default function CustomerActions({ customerId, customerPhone }: { customerId: string, customerPhone: string }) {
  const [resetLink, setResetLink] = useState('')
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [whatsappPhone, setWhatsappPhone] = useState(customerPhone.replace('+967', ''))

  const generateResetLink = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/customers/${customerId}/reset-link`, {
        method: 'POST',
      })
      const data = await res.json()
      if (res.ok) {
        setResetLink(data.resetLink)
      } else {
        alert(data.error || 'حدث خطأ')
      }
    } catch (err) {
      alert('تعذر إنشاء الرابط')
    } finally {
      setLoading(false)
    }
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(resetLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const openWhatsapp = () => {
    let cleanPhone = whatsappPhone.replace(/\D/g, '')
    if (cleanPhone.length === 9 && cleanPhone.startsWith('7')) {
      cleanPhone = `967${cleanPhone}`
    } else if (cleanPhone.startsWith('00')) {
      cleanPhone = cleanPhone.slice(2)
    } else if (cleanPhone.startsWith('+')) {
      cleanPhone = cleanPhone.slice(1)
    }
    window.open(`https://wa.me/${cleanPhone}`, '_blank')
  }

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mt-6">
      <h2 className="text-lg font-bold text-gray-900 border-b pb-3 mb-4 flex items-center gap-2">
        إجراءات العميل
      </h2>
      
      <div className="space-y-6">
        {/* WhatsApp Action */}
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">مراسلة واتساب</label>
          <div className="flex items-center gap-2">
            <input 
              type="text" 
              value={whatsappPhone}
              onChange={(e) => setWhatsappPhone(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-green-500"
              placeholder="رقم الهاتف..."
              dir="ltr"
            />
            <button 
              onClick={openWhatsapp}
              className="flex items-center gap-2 bg-green-500 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-green-600 transition-colors"
            >
              <MessageCircle className="w-4 h-4" />
              مراسلة
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-1">تعديل الرقم هنا لا يغيره في قاعدة البيانات.</p>
        </div>

        {/* Reset Link Action */}
        <div className="border-t pt-4">
          <label className="block text-sm font-bold text-gray-700 mb-2">استعادة كلمة المرور</label>
          {!resetLink ? (
            <button
              onClick={generateResetLink}
              disabled={loading}
              className="flex items-center justify-center w-full gap-2 bg-gray-100 text-gray-800 px-4 py-2 rounded-lg text-sm font-bold hover:bg-gray-200 transition-colors disabled:opacity-50"
            >
              <KeyRound className="w-4 h-4" />
              {loading ? 'جاري الإنشاء...' : 'إنشاء رابط استعادة'}
            </button>
          ) : (
            <div className="bg-green-50 border border-green-200 p-3 rounded-lg flex items-center justify-between gap-3">
              <input 
                type="text" 
                readOnly 
                value={resetLink} 
                className="flex-1 bg-transparent border-none outline-none text-sm text-green-900 font-mono"
                dir="ltr"
              />
              <button 
                onClick={handleCopy}
                className="text-green-700 hover:text-green-900 p-1"
                title="نسخ الرابط"
              >
                {copied ? <CheckCircle2 className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
              </button>
            </div>
          )}
          <p className="text-xs text-gray-500 mt-2 leading-relaxed">
            الرابط صالح لمرة واحدة ولمدة 24 ساعة. انسخ الرابط وأرسله للعميل بعد التحقق من هويته عبر واتساب.
          </p>
        </div>
      </div>
    </div>
  )
}
