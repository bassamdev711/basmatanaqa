'use client'

import { useToast } from '@/components/ToastProvider'
import { useConfirm } from '@/components/ConfirmProvider'
import React, { useState } from 'react'
import { Plus, Edit, Trash2, Link as LinkIcon, FileText } from 'lucide-react'
import { createLegalPage, updateLegalPage, deleteLegalPage } from './actions'

type LegalPage = {
  id: string
  title: string
  slug: string
  content: string
  isActive: boolean
}

export default function LegalPagesClient({
  initialPages }: { initialPages: LegalPage[] }) {
  const { showToast } = useToast()
  const { confirm } = useConfirm()
  const [pages, setPages] = useState<LegalPage[]>(initialPages)
  const [editingPage, setEditingPage] = useState<LegalPage | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  
  // Form state
  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [content, setContent] = useState('')
  const [isActive, setIsActive] = useState(true)
  const [error, setError] = useState('')

  const openNewForm = () => {
    setEditingPage(null)
    setTitle('')
    setSlug('')
    setContent('')
    setIsActive(true)
    setError('')
    setIsFormOpen(true)
  }

  const openEditForm = (page: LegalPage) => {
    setEditingPage(page)
    setTitle(page.title)
    setSlug(page.slug)
    setContent(page.content)
    setIsActive(page.isActive)
    setError('')
    setIsFormOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const data = { title, slug, content, isActive }
    
    let res
    if (editingPage) {
      res = await updateLegalPage(editingPage.id, data)
    } else {
      res = await createLegalPage(data)
    }

    if (res.success) {
      window.location.reload()
    } else {
      setError(res.error || 'حدث خطأ غير متوقع')
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (await confirm({ message: 'هل أنت متأكد من حذف هذه الصفحة؟', danger: true })) {
      const res = await deleteLegalPage(id)
      if (res.success) {
        setPages(pages.filter(p => p.id !== id))
      } else {
        showToast('error', 'حدث خطأ أثناء الحذف')
      }
    }
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-black text-deep-green mb-2">الصفحات القانونية</h1>
          <p className="text-deep-green/60">إدارة صفحات الشروط والأحكام وسياسة الخصوصية التي تظهر أسفل المتجر.</p>
        </div>
        {!isFormOpen && (
          <button 
            onClick={openNewForm}
            className="bg-gold text-deep-green px-6 py-3 rounded-none font-bold hover:bg-[#c9a756] transition-colors flex items-center gap-2"
          >
            <Plus size={20} />
            إضافة صفحة جديدة
          </button>
        )}
      </div>

      {isFormOpen ? (
        <div className="bg-white p-6 border border-black/5 shadow-sm rounded-md mb-8">
          <h2 className="text-xl font-bold mb-6 text-deep-green border-b border-black/5 pb-4">
            {editingPage ? 'تعديل الصفحة' : 'إنشاء صفحة جديدة'}
          </h2>
          
          {error && <div className="bg-red-50 text-red-600 p-4 rounded-md mb-6 border border-red-200">{error}</div>}
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold text-deep-green mb-2">عنوان الصفحة (يظهر في الفوتر)</label>
                <input 
                  type="text" 
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  className="w-full px-4 py-3 bg-[#F9F7F2] border border-black/10 rounded-md focus:outline-none focus:border-gold"
                  placeholder="مثال: سياسة الاسترجاع"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-deep-green mb-2">نهاية رابط الصفحة (باللغة الإنجليزية وبدون مسافات) *</label>
                <div className="flex rounded-md shadow-sm" dir="ltr">
                  <span className="inline-flex items-center rounded-l-md border border-r-0 border-black/10 px-3 text-gray-500 sm:text-sm bg-gray-50">
                    https://example-store.com/pages/
                  </span>
                  <input 
                    type="text" 
                    value={slug}
                    onChange={e => setSlug(e.target.value.toLowerCase().replace(/\s+/g, '-'))}
                    className="w-full min-w-0 flex-1 rounded-none rounded-r-md px-4 py-3 bg-[#F9F7F2] border border-black/10 focus:outline-none focus:border-gold text-left"
                    placeholder="refund-policy"
                    required
                  />
                </div>
                <p className="mt-1 text-xs text-gray-500 text-right">يُستخدم هذا الرابط لمشاركة الصفحة. يرجى استخدام حروف إنجليزية وشرطات (-) بدلاً من المسافات.</p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-deep-green mb-2">محتوى الصفحة</label>
              <textarea 
                value={content}
                onChange={e => setContent(e.target.value)}
                className="w-full px-4 py-3 bg-[#F9F7F2] border border-black/10 rounded-md focus:outline-none focus:border-gold min-h-[300px]"
                placeholder="اكتب تفاصيل الشروط والأحكام هنا... يمكن استخدام الأسطر والفقرات وسيتم تنسيقها تلقائياً."
                required
              />
            </div>

            <div className="flex items-center gap-3 bg-[#F9F7F2] p-4 rounded-md border border-black/5">
              <input 
                type="checkbox" 
                id="isActive"
                checked={isActive}
                onChange={e => setIsActive(e.target.checked)}
                className="w-5 h-5 accent-gold"
              />
              <label htmlFor="isActive" className="font-bold text-deep-green cursor-pointer">
                تفعيل الصفحة وعرضها للعملاء في المتجر
              </label>
            </div>

            <div className="flex gap-4 pt-4 border-t border-black/5">
              <button 
                type="submit" 
                disabled={loading}
                className="bg-emerald text-ivory px-8 py-3 rounded-none font-bold hover:bg-deep-green transition-colors disabled:opacity-50"
              >
                {loading ? 'جاري الحفظ...' : 'حفظ الصفحة'}
              </button>
              <button 
                type="button" 
                onClick={() => setIsFormOpen(false)}
                className="bg-gray-100 text-deep-green px-8 py-3 rounded-none font-bold hover:bg-gray-200 transition-colors"
              >
                إلغاء
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {pages.length === 0 ? (
            <div className="text-center py-16 bg-white border border-black/5 rounded-md">
              <FileText className="w-12 h-12 text-deep-green/20 mx-auto mb-4" />
              <p className="text-deep-green/60 font-medium">لم تقم بإضافة أي صفحات قانونية بعد.</p>
            </div>
          ) : (
            pages.map(page => (
              <div key={page.id} className="bg-white p-6 border border-black/5 shadow-sm flex items-center justify-between rounded-md hover:border-gold/30 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-[#F9F7F2] flex items-center justify-center rounded-md border border-black/5">
                    <FileText className="text-gold w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-black text-lg text-deep-green flex items-center gap-3">
                      {page.title}
                      {!page.isActive && (
                        <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded-sm font-bold">غير مفعلة</span>
                      )}
                    </h3>
                    <p className="text-sm text-deep-green/50 flex items-center gap-1 mt-1" dir="ltr">
                      <LinkIcon size={12} /> /pages/{page.slug}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => openEditForm(page)}
                    className="p-2 text-brand bg-emerald/10 hover:bg-emerald hover:text-white rounded-md transition-colors"
                    title="تعديل"
                  >
                    <Edit size={18} />
                  </button>
                  <button 
                    onClick={() => handleDelete(page.id)}
                    className="p-2 text-red-500 bg-red-50 hover:bg-red-500 hover:text-white rounded-md transition-colors"
                    title="حذف"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}
