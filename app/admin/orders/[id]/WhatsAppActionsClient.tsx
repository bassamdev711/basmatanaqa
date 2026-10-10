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

  const handleSend = (text: string) => {
    const url = getWhatsAppLink(customerPhone, text)
    window.open(url, '_blank', 'noopener,noreferrer')
    setActiveMessage(null) // close menu after sending
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
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-2 flex flex-col gap-1 animate-in fade-in slide-in-from-top-2 duration-200 z-10 relative">
          <div className="flex justify-between items-center mb-2 px-2 pt-1 border-b border-gray-100 pb-2">
            <span className="text-xs font-bold text-gray-500">اختر نوع الرسالة:</span>
            <button onClick={() => setActiveMessage(null)} className="text-gray-400 hover:text-gray-600">
              <X size={16} />
            </button>
          </div>
          
          <button 
            onClick={() => handleSend(confirmedMessage)} 
            className="flex items-center gap-2 text-right w-full px-3 py-2 text-sm font-bold text-gray-700 hover:bg-brand/10 hover:text-brand-700 rounded-md transition-colors"
          >
            <CheckCircle2 size={16} className="text-brand" /> إرسال: تم تأكيد طلبك
          </button>
          
          <button 
            onClick={() => handleSend(shippedMessage)} 
            className="flex items-center gap-2 text-right w-full px-3 py-2 text-sm font-bold text-gray-700 hover:bg-blue-50 hover:text-blue-700 rounded-md transition-colors"
          >
            <Truck size={16} className="text-blue-500" /> إرسال: تم إرسال طلبك
          </button>

          <button 
            onClick={() => handleSend('')} // Open empty chat
            className="flex items-center gap-2 text-right w-full px-3 py-2 text-sm font-bold text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
          >
            <Send size={16} className="text-gray-500" /> فتح دردشة واتساب (بدون نص)
          </button>
        </div>
      )}
    </div>
  )
}
