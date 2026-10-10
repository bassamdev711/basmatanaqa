'use client'

import React, { useState } from 'react'
import { CheckCircle2, Truck, CheckCircle, Send, X } from 'lucide-react'
import { getWhatsAppLink } from '@/lib/whatsapp/templates'

interface WhatsAppActionsClientProps {
  customerPhone: string;
  confirmedMessage: string;
  shippedMessage: string;
  completedMessage: string;
}

export default function WhatsAppActionsClient({ 
  customerPhone, 
  confirmedMessage, 
  shippedMessage, 
  completedMessage 
}: WhatsAppActionsClientProps) {
  const [activeMessage, setActiveMessage] = useState<string | null>(null)
  const [messageText, setMessageText] = useState('')

  const handleSelectTemplate = (template: string) => {
    setMessageText(template)
    setActiveMessage(template)
  }

  const handleSend = () => {
    if (!messageText.trim()) return
    const url = getWhatsAppLink(customerPhone, messageText)
    window.open(url, '_blank', 'noopener,noreferrer')
    setActiveMessage(null) // close after sending
  }

  return (
    <div className="pt-4 border-t border-gray-100 flex flex-col gap-2 mt-4 relative">
      <span className="font-bold text-gray-900 mb-1 block">التواصل مع العميل:</span>
      
      {!activeMessage ? (
        <div className="relative">
          <button 
            onClick={() => setActiveMessage('MENU')} 
            className="w-full flex items-center justify-center gap-2 bg-[#25D366] text-white py-3 rounded-md hover:bg-[#128C7E] transition-colors font-bold text-sm shadow-sm"
          >
            <Send size={18} /> تواصل عبر واتساب
          </button>
        </div>
      ) : activeMessage === 'MENU' ? (
        <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-2 flex flex-col gap-1 animate-in fade-in slide-in-from-top-2 duration-200 z-10 relative">
          <div className="flex justify-between items-center mb-2 px-2 pt-1 border-b border-gray-100 pb-2">
            <span className="text-xs font-bold text-gray-500">اختر نوع الرسالة:</span>
            <button onClick={() => setActiveMessage(null)} className="text-gray-400 hover:text-gray-600">
              <X size={16} />
            </button>
          </div>
          
          <button 
            onClick={() => handleSelectTemplate(confirmedMessage)} 
            className="flex items-center gap-2 text-right w-full px-3 py-2 text-sm font-bold text-gray-700 hover:bg-brand/10 hover:text-brand-700 rounded-md transition-colors"
          >
            <CheckCircle2 size={16} className="text-brand" /> إرسال رسالة: تم تأكيد طلبك
          </button>
          
          <button 
            onClick={() => handleSelectTemplate(shippedMessage)} 
            className="flex items-center gap-2 text-right w-full px-3 py-2 text-sm font-bold text-gray-700 hover:bg-blue-50 hover:text-blue-700 rounded-md transition-colors"
          >
            <Truck size={16} className="text-blue-500" /> إرسال رسالة: تم إرسال طلبك
          </button>

          <button 
            onClick={() => handleSelectTemplate('')} // Open empty chat
            className="flex items-center gap-2 text-right w-full px-3 py-2 text-sm font-bold text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
          >
            <Send size={16} className="text-gray-500" /> فتح دردشة جديدة (رسالة مخصصة)
          </button>
        </div>
      ) : (
        <div className="bg-gray-50 border border-emerald-100 rounded-lg p-3 flex flex-col gap-3 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-brand-800">تعديل رسالة الواتساب:</span>
            <button 
              onClick={() => setActiveMessage('MENU')}
              className="p-1 hover:bg-gray-200 rounded text-gray-500 transition-colors"
            >
              <X size={14} />
            </button>
          </div>
          <textarea 
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            className="w-full h-32 p-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-sans"
            dir="rtl"
          />
          <div className="flex gap-2">
            <button 
              onClick={handleSend}
              className="flex-1 flex items-center justify-center gap-2 bg-[#25D366] text-white py-2 rounded-md hover:bg-[#128C7E] transition-colors font-bold text-xs"
            >
              <Send size={14} /> إرسال الآن
            </button>
            <button 
              onClick={() => setActiveMessage('MENU')}
              className="flex-1 flex items-center justify-center gap-2 bg-gray-200 text-gray-700 py-2 rounded-md hover:bg-gray-300 transition-colors font-bold text-xs"
            >
              رجوع
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
