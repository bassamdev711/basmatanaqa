'use client'

import React, { startTransition, useCallback, useEffect, useState } from 'react'
import { Trash2, Download, Search } from 'lucide-react'
import { getSubscribers, deleteSubscriber } from '@/app/actions/newsletter'
import { useToast } from '@/components/ToastProvider'
import { useConfirm } from '@/components/ConfirmProvider'

type NewsletterSubscriber = {
  id: string
  email: string
  isActive: boolean
  createdAt: Date | string
}

export default function NewsletterAdminPage() {
  const [subscribers, setSubscribers] = useState<NewsletterSubscriber[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const { showToast } = useToast()
  const { confirm } = useConfirm()

  const fetchData = useCallback(async () => {
    setLoading(true)
    const result = await getSubscribers()
    if (result.success && result.data) {
      setSubscribers(result.data)
    } else {
      showToast('error', result.error || 'حدث خطأ أثناء جلب المشتركين')
    }
    setLoading(false)
  }, [showToast])

  useEffect(() => {
    startTransition(() => {
      void fetchData()
    })
  }, [fetchData])

  const handleDelete = async (id: string) => {
    if (!(await confirm({ message: 'هل أنت متأكد من حذف هذا المشترك؟', danger: true }))) return
    
    const result = await deleteSubscriber(id)
    if (result.success) {
      showToast('success', 'تم الحذف بنجاح')
      setSubscribers(prev => prev.filter(s => s.id !== id))
    } else {
      showToast('error', result.error || 'حدث خطأ أثناء الحذف')
    }
  }

  const handleExport = () => {
    if (subscribers.length === 0) {
      showToast('error', 'لا يوجد مشتركين لتصديرهم')
      return
    }

    const csvContent = "data:text/csv;charset=utf-8," 
      + "Email,Date Subscribed,Status\n"
      + subscribers.map(s => `${s.email},${new Date(s.createdAt).toISOString()},${s.isActive ? 'Active' : 'Inactive'}`).join("\n");
      
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute("download", `subscribers_${new Date().toISOString().split('T')[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const filteredSubscribers = subscribers.filter(s => 
    s.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-black text-deep-green mb-2">النشرة البريدية</h1>
          <p className="text-deep-green/70">إدارة المشتركين في النشرة البريدية (Newsletter).</p>
        </div>
        <button 
          onClick={handleExport}
          className="bg-emerald text-ivory px-6 py-3 font-bold hover:bg-emerald/90 transition-colors flex items-center gap-2"
        >
          <Download size={18} />
          <span>تصدير CSV</span>
        </button>
      </div>

      <div className="bg-white border border-black/5 p-6 mb-8">
        <div className="relative max-w-md">
          <input 
            type="text" 
            placeholder="البحث بالبريد الإلكتروني..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#F9F7F2] border border-black/5 text-deep-green pl-10 pr-4 py-3 focus:outline-none focus:border-emerald/30 transition-colors"
          />
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-deep-green/40" size={18} />
        </div>
      </div>

      <div className="bg-white border border-black/5 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-deep-green/50 font-bold">جاري التحميل...</div>
        ) : filteredSubscribers.length === 0 ? (
          <div className="p-12 text-center text-deep-green/50 font-bold">
            {searchTerm ? 'لم يتم العثور على نتائج' : 'لا يوجد مشتركين حتى الآن.'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right" dir="rtl">
              <thead className="bg-[#F9F7F2] text-deep-green">
                <tr>
                  <th className="px-6 py-4 font-bold">البريد الإلكتروني</th>
                  <th className="px-6 py-4 font-bold">تاريخ الاشتراك</th>
                  <th className="px-6 py-4 font-bold">الحالة</th>
                  <th className="px-6 py-4 font-bold w-24">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5">
                {filteredSubscribers.map((subscriber) => (
                  <tr key={subscriber.id} className="hover:bg-[#F9F7F2]/50 transition-colors">
                    <td className="px-6 py-4" dir="ltr" style={{ textAlign: 'right' }}>
                      <span className="font-bold text-deep-green">{subscriber.email}</span>
                    </td>
                    <td className="px-6 py-4 text-deep-green/70">
                      {new Intl.DateTimeFormat('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' }).format(new Date(subscriber.createdAt))}
                    </td>
                    <td className="px-6 py-4">
                      {subscriber.isActive ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald/10 text-brand">
                          نشط
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          غير نشط
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <button 
                        onClick={() => handleDelete(subscriber.id)}
                        className="text-red-500 hover:text-red-700 transition-colors p-2 bg-red-50 hover:bg-red-100 rounded-md"
                        title="حذف المشترك"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
