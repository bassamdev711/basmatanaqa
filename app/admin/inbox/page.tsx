'use client'

import React, { startTransition, useCallback, useEffect, useState } from 'react'
import { Trash2, Mail, MailOpen, Search, Phone, Calendar } from 'lucide-react'
import { getContactMessages, markMessageAsRead, deleteMessage } from '@/app/actions/contact'
import { useToast } from '@/components/ToastProvider'
import { useConfirm } from '@/components/ConfirmProvider'

type ContactMessage = {
  id: string
  name: string
  phone: string
  email: string
  message: string
  isRead: boolean
  createdAt: Date | string
}

export default function InboxPage() {
  const [messages, setMessages] = useState<ContactMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedMessage, setSelectedMessage] = useState<ContactMessage | null>(null)
  const { showToast } = useToast()
  const { confirm } = useConfirm()

  const fetchData = useCallback(async () => {
    setLoading(true)
    const result = await getContactMessages()
    if (result.success && result.data) {
      setMessages(result.data)
    } else {
      showToast('error', result.error || 'حدث خطأ أثناء جلب الرسائل')
    }
    setLoading(false)
  }, [showToast])

  useEffect(() => {
    startTransition(() => {
      void fetchData()
    })
  }, [fetchData])

  const handleRead = async (msg: ContactMessage) => {
    setSelectedMessage(msg)
    if (!msg.isRead) {
      const result = await markMessageAsRead(msg.id)
      if (result.success) {
        setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, isRead: true } : m))
      }
    }
  }

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!(await confirm({ message: 'هل أنت متأكد من حذف هذه الرسالة؟', danger: true }))) return
    
    const result = await deleteMessage(id)
    if (result.success) {
      showToast('success', 'تم الحذف بنجاح')
      setMessages(prev => prev.filter(m => m.id !== id))
      if (selectedMessage?.id === id) {
        setSelectedMessage(null)
      }
    } else {
      showToast('error', result.error || 'حدث خطأ أثناء الحذف')
    }
  }

  const filteredMessages = messages.filter(m => 
    m.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    m.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.message.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const unreadCount = messages.filter(m => !m.isRead).length

  return (
    <div className="h-[calc(100vh-80px)] flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-black text-deep-green mb-2 flex items-center gap-3">
            صندوق الوارد
            {unreadCount > 0 && (
              <span className="bg-red-500 text-white text-sm px-3 py-1 rounded-full font-bold">
                {unreadCount} جديد
              </span>
            )}
          </h1>
          <p className="text-deep-green/70">اقرأ ورد على استفسارات عملائك.</p>
        </div>
      </div>

      <div className="flex-1 bg-white border border-black/5 rounded-xl overflow-hidden flex flex-col md:flex-row">
        
        {/* Messages List (Sidebar) */}
        <div className="w-full md:w-1/3 border-l border-black/5 flex flex-col h-full bg-[#F9F7F2]/30">
          <div className="p-4 border-b border-black/5">
            <div className="relative">
              <input 
                type="text" 
                placeholder="البحث في الرسائل..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-white border border-black/5 text-deep-green pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-emerald/30 transition-colors rounded-md"
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-deep-green/40" size={16} />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="p-8 text-center text-deep-green/50 font-bold text-sm">جاري التحميل...</div>
            ) : filteredMessages.length === 0 ? (
              <div className="p-8 text-center text-deep-green/50 font-bold text-sm">
                لا توجد رسائل.
              </div>
            ) : (
              <div className="divide-y divide-black/5">
                {filteredMessages.map((msg) => (
                  <div 
                    key={msg.id} 
                    onClick={() => handleRead(msg)}
                    className={`p-4 cursor-pointer transition-colors hover:bg-emerald/5 ${selectedMessage?.id === msg.id ? 'bg-emerald/10' : ''} ${!msg.isRead ? 'bg-white' : ''}`}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <h3 className={`font-bold text-sm truncate ${!msg.isRead ? 'text-deep-green' : 'text-deep-green/70'}`}>
                        {msg.name}
                      </h3>
                      {!msg.isRead && <span className="w-2 h-2 rounded-full bg-emerald shrink-0 mt-1.5" />}
                    </div>
                    <p className={`text-xs truncate mb-2 ${!msg.isRead ? 'text-deep-green/80 font-medium' : 'text-deep-green/50'}`}>
                      {msg.message}
                    </p>
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] text-deep-green/40" dir="ltr">
                        {new Intl.DateTimeFormat('ar-EG', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(msg.createdAt))}
                      </span>
                      <button 
                        onClick={(e) => handleDelete(msg.id, e)}
                        className="text-red-400 hover:text-red-600 transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Message Detail View */}
        <div className="w-full md:w-2/3 flex flex-col h-full bg-white">
          {selectedMessage ? (
            <>
              <div className="p-6 border-b border-black/5 bg-[#F9F7F2]/50">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-xl font-black text-deep-green mb-4">{selectedMessage.name}</h2>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-deep-green/70">
                        <Mail size={16} className="text-brand" />
                        <a href={`mailto:${selectedMessage.email}`} className="hover:text-brand transition-colors" dir="ltr">{selectedMessage.email}</a>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-deep-green/70">
                        <Phone size={16} className="text-brand" />
                        <a href={`tel:${selectedMessage.phone}`} className="hover:text-brand transition-colors" dir="ltr">{selectedMessage.phone}</a>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-deep-green/70 pt-1">
                        <Calendar size={16} className="text-brand" />
                        <span dir="ltr">
                          {new Intl.DateTimeFormat('ar-EG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(selectedMessage.createdAt))}
                        </span>
                      </div>
                    </div>
                  </div>
                  <button 
                    onClick={(e) => handleDelete(selectedMessage.id, e)}
                    className="flex items-center gap-2 text-red-500 hover:text-red-700 hover:bg-red-50 px-3 py-2 rounded-md transition-colors text-sm font-bold"
                  >
                    <Trash2 size={16} />
                    حذف الرسالة
                  </button>
                </div>
              </div>
              <div className="p-8 flex-1 overflow-y-auto">
                <div className="bg-[#F9F7F2] p-6 rounded-lg text-deep-green leading-relaxed whitespace-pre-wrap border border-black/5">
                  {selectedMessage.message}
                </div>
                
                <div className="mt-8 pt-8 border-t border-black/5">
                  <a 
                    href={`mailto:${selectedMessage.email}?subject=رد من المتجر&body=مرحباً ${selectedMessage.name}،%0D%0A%0D%0Aرداً على رسالتك:%0D%0A"${selectedMessage.message}"%0D%0A%0D%0A`}
                    className="inline-flex items-center gap-2 bg-emerald text-ivory font-bold px-6 py-3 rounded-md hover:bg-deep-green transition-colors"
                  >
                    <Mail size={18} />
                    الرد عبر البريد الإلكتروني
                  </a>
                  <p className="text-xs text-deep-green/40 mt-3">سيتم فتح تطبيق البريد الإلكتروني الافتراضي في جهازك للرد على العميل.</p>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-deep-green/30 h-full">
              <MailOpen size={64} strokeWidth={1} className="mb-4 text-brand/30" />
              <p className="font-bold text-lg">اختر رسالة لعرض محتواها</p>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
