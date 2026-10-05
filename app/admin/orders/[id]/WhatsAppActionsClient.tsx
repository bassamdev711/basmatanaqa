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
    <div className="pt-4 border-t border-gray-100 flex flex-col gap-2 mt-4">
      <span className="font-bold text-gray-900 mb-1 block">مراسلة العميل (WhatsApp):</span>
      
      {!activeMessage ? (
        <>
          <button 
            onClick={() => handleSelectTemplate(confirmedMessage)} 
            className="flex items-center justify-center gap-2 bg-brand/5 text-brand-700 py-2 rounded-md hover:bg-brand/10 transition-colors font-bold text-xs"
          >
            <CheckCircle2 size={16} /> تأكيد الطلب
          </button>
          <button 
            onClick={() => handleSelectTemplate(shippedMessage)} 
            className="flex items-center justify-center gap-2 bg-blue-50 text-blue-700 py-2 rounded-md hover:bg-blue-100 transition-colors font-bold text-xs"
          >
            <Truck size={16} /> تم الشحن
          </button>
          <button 
            onClick={() => handleSelectTemplate(completedMessage)} 
            className="flex items-center justify-center gap-2 bg-gold/20 text-deep-green py-2 rounded-md hover:bg-gold/40 transition-colors font-bold text-xs"
          >
            <CheckCircle size={16} /> مكتمل
          </button>
        </>
      ) : (
        <div className="bg-gray-50 border border-emerald-100 rounded-lg p-3 flex flex-col gap-3 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-brand-800">تعديل رسالة الواتساب:</span>
            <button 
              onClick={() => setActiveMessage(null)}
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
              className="flex-1 flex items-center justify-center gap-2 bg-brand text-white py-2 rounded-md hover:bg-emerald-700 transition-colors font-bold text-xs"
            >
              <Send size={14} /> إرسال الآن
            </button>
            <button 
              onClick={() => setActiveMessage(null)}
              className="flex-1 flex items-center justify-center gap-2 bg-gray-200 text-gray-700 py-2 rounded-md hover:bg-gray-300 transition-colors font-bold text-xs"
            >
              إلغاء
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
