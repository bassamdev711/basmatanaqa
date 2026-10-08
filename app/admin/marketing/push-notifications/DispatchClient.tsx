'use client'

import React, { useState } from 'react'
import { Send, Users, User, Search, CheckCircle2 } from 'lucide-react'
import { dispatchNotification, searchCustomers } from './actions'

type Customer = { id: string; name: string; phone: string }

export default function DispatchClient() {
  const [target, setTarget] = useState<'ALL' | 'SPECIFIC'>('ALL')
  const [title, setTitle] = useState('')
  const [message, setMessage] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<Customer[]>([])
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const handleSearch = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setSearchQuery(val)
    if (val.length >= 2) {
      const res = await searchCustomers(val)
      setSearchResults(res)
    } else {
      setSearchResults([])
    }
  }

  const handleSelectCustomer = (c: Customer) => {
    setSelectedCustomer(c)
    setSearchQuery('')
    setSearchResults([])
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    
    if (target === 'SPECIFIC' && !selectedCustomer) {
      setError('الرجاء اختيار العميل أولاً')
      return
    }

    setLoading(true)
    const res = await dispatchNotification({
      target,
      targetUserId: selectedCustomer?.id,
      title,
      message
    })

    if (res.success) {
      setSuccess(true)
      setTitle('')
      setMessage('')
      setSelectedCustomer(null)
      setTimeout(() => setSuccess(false), 3000)
    } else {
      setError(res.error || 'حدث خطأ')
    }
    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      
      {/* Target Selection */}
      <div className="space-y-3">
        <label className="block text-sm font-bold text-gray-700">الفئة المستهدفة</label>
        <div className="grid grid-cols-2 gap-4">
          <button
            type="button"
            onClick={() => setTarget('ALL')}
            className={`flex items-center justify-center gap-2 p-4 rounded-xl border-2 transition-colors ${
              target === 'ALL' 
                ? 'border-emerald bg-emerald/5 text-emerald' 
                : 'border-gray-100 bg-white text-gray-500 hover:border-emerald/30'
            }`}
          >
            <Users className="w-5 h-5" />
            <span className="font-bold">جميع العملاء</span>
          </button>
          
          <button
            type="button"
            onClick={() => setTarget('SPECIFIC')}
            className={`flex items-center justify-center gap-2 p-4 rounded-xl border-2 transition-colors ${
              target === 'SPECIFIC' 
                ? 'border-emerald bg-emerald/5 text-emerald' 
                : 'border-gray-100 bg-white text-gray-500 hover:border-emerald/30'
            }`}
          >
            <User className="w-5 h-5" />
            <span className="font-bold">عميل محدد</span>
          </button>
        </div>
      </div>

      {/* Specific Customer Search */}
      {target === 'SPECIFIC' && (
        <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 space-y-3">
          <label className="block text-sm font-bold text-gray-700">البحث عن عميل</label>
          
          {selectedCustomer ? (
            <div className="flex items-center justify-between bg-white p-3 rounded-lg border border-emerald/30">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald/10 text-emerald rounded-full flex items-center justify-center font-bold">
                  {selectedCustomer.name.charAt(0)}
                </div>
                <div>
                  <div className="font-bold text-gray-900">{selectedCustomer.name}</div>
                  <div className="text-sm text-gray-500" dir="ltr">{selectedCustomer.phone}</div>
                </div>
              </div>
              <button 
                type="button" 
                onClick={() => setSelectedCustomer(null)}
                className="text-sm text-red-500 font-bold hover:underline"
              >
                تغيير
              </button>
            </div>
          ) : (
            <div className="relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                value={searchQuery}
                onChange={handleSearch}
                className="w-full pl-4 pr-10 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-emerald"
                placeholder="ابحث بالاسم أو رقم الهاتف..."
              />
              
              {searchResults.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-100 rounded-lg shadow-lg z-10 overflow-hidden">
                  {searchResults.map(c => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => handleSelectCustomer(c)}
                      className="w-full text-right p-3 hover:bg-gray-50 border-b border-gray-50 last:border-none flex items-center justify-between"
                    >
                      <span className="font-bold text-gray-900">{c.name}</span>
                      <span className="text-sm text-gray-500" dir="ltr">{c.phone}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Message Content */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">عنوان الإشعار</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full p-3 border border-gray-200 rounded-xl outline-none focus:border-emerald"
            placeholder="مثال: خصم خاص لك!"
            required
            maxLength={100}
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">نص الإشعار</label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="w-full p-3 border border-gray-200 rounded-xl outline-none focus:border-emerald min-h-[120px]"
            placeholder="اكتب رسالتك هنا..."
            required
            maxLength={500}
          />
          <p className="text-xs text-gray-500 mt-1 text-left">{message.length}/500</p>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm font-bold border border-red-100">
          {error}
        </div>
      )}

      {success && (
        <div className="p-4 bg-green-50 text-green-700 rounded-xl font-bold border border-green-200 flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5" />
          تم إرسال الإشعار بنجاح!
        </div>
      )}

      <button
        type="submit"
        disabled={loading || (target === 'SPECIFIC' && !selectedCustomer)}
        className="w-full flex items-center justify-center gap-2 bg-emerald text-white p-4 rounded-xl font-bold hover:bg-emerald/90 transition-colors disabled:opacity-50"
      >
        <Send className="w-5 h-5" />
        {loading ? 'جاري الإرسال...' : 'إرسال الإشعار'}
      </button>

    </form>
  )
}
