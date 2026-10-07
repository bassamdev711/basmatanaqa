'use client'

import { useToast } from '@/components/ToastProvider'
import { useConfirm } from '@/components/ConfirmProvider'
import React, { useState } from 'react'
import { Plus, Edit2, X, Trash2, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { createSubCategory, updateSubCategory, deleteSubCategory } from '../actions'

type SubCategory = {
  id: string
  name: string
  slug: string
  description: string | null
  isActive: boolean
}

type Collection = {
  id: string
  name: string
  subCategories: SubCategory[]
}

export default function SubCategoriesClient({ collection }: { collection: Collection }) {
  const { showToast } = useToast()
  const { confirm } = useConfirm()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    isActive: true
  })

  const handleOpenModal = () => {
    setEditingId(null)
    setFormData({ name: '', slug: '', description: '', isActive: true })
    setIsModalOpen(true)
  }

  const handleEdit = (sub: SubCategory) => {
    setEditingId(sub.id)
    setFormData({
      name: sub.name || '',
      slug: sub.slug || '',
      description: sub.description || '',
      isActive: sub.isActive
    })
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setFormData({ name: '', slug: '', description: '', isActive: true })
    setEditingId(null)
  }

  const handleSubmit = async () => {
    if (!formData.name || !formData.slug) return showToast('success', 'يرجى تعبئة الحقول المطلوبة (الاسم، الرابط الدائم)')
    setIsSubmitting(true)

    const payload = {
      ...formData,
      collectionId: collection.id
    }

    let res;
    if (editingId) {
      res = await updateSubCategory(editingId, payload)
    } else {
      res = await createSubCategory(payload)
    }

    if (res.success) {
      window.location.reload()
    } else {
      showToast('error', res.error || 'حدث خطأ')
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (id: string, name: string) => {
    if (!(await confirm({ message: `هل أنت متأكد من رغبتك في حذف المجموعة الفرعية "${name}"؟`, danger: true }))) return;

    const res = await deleteSubCategory(id, collection.id);
    if (res.success) {
      showToast('success', 'تم الحذف بنجاح');
      window.location.reload();
    } else {
      showToast('error', res.error || 'حدث خطأ');
    }
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex justify-between items-center">
        <div>
          <Link href="/admin/collections" className="text-sm text-gray-500 hover:text-gray-900 flex items-center gap-2 mb-2">
            <ArrowRight size={16} /> العودة للمجموعات
          </Link>
          <h2 className="text-3xl font-bold text-gray-900">المجموعات الفرعية: {collection.name}</h2>
        </div>
        <button
          onClick={handleOpenModal}
          className="bg-emerald-800 text-white px-6 py-2.5 rounded-lg font-bold hover:bg-emerald-900 transition-colors flex items-center gap-2"
        >
          <Plus size={18} />
          إنشاء فرع جديد
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {collection.subCategories.length > 0 ? (
          <table className="w-full text-right">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-sm font-bold text-gray-900">الاسم</th>
                <th className="px-6 py-4 text-sm font-bold text-gray-900">الرابط</th>
                <th className="px-6 py-4 text-sm font-bold text-gray-900">الحالة</th>
                <th className="px-6 py-4 text-sm font-bold text-gray-900">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {collection.subCategories.map(sub => (
                <tr key={sub.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <span className="font-bold text-gray-900">{sub.name}</span>
                  </td>
                  <td className="px-6 py-4 text-gray-500 font-mono text-sm">{sub.slug}</td>
                  <td className="px-6 py-4">
                    {sub.isActive ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-green-100 text-green-800">
                        نشط
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-gray-100 text-gray-800">
                        مسودة
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <button onClick={() => handleEdit(sub)} className="text-blue-600 hover:text-blue-800" title="تعديل">
                        <Edit2 size={18} />
                      </button>
                      <button onClick={() => handleDelete(sub.id, sub.name)} className="text-red-600 hover:text-red-800" title="حذف">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="p-12 text-center text-gray-500">
            لا توجد مجموعات فرعية مضافة في هذه المجموعة.
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={handleCloseModal}></div>
          <div className="relative bg-white w-full max-w-lg rounded-xl shadow-2xl flex flex-col">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50 rounded-t-xl">
              <h3 className="text-xl font-bold text-gray-900">{editingId ? 'تعديل الفرع' : 'إنشاء فرع جديد'}</h3>
              <button onClick={handleCloseModal} className="text-gray-400 hover:text-gray-600">
                <X size={24} />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="text-sm font-bold text-gray-700 block mb-1">الاسم</label>
                <input
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                />
              </div>
              <div>
                <label className="text-sm font-bold text-gray-700 block mb-1">الرابط الدائم (Slug)</label>
                <input
                  value={formData.slug}
                  onChange={e => setFormData({...formData, slug: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                  dir="ltr"
                />
              </div>
              <div>
                <label className="text-sm font-bold text-gray-700 block mb-1">الوصف</label>
                <textarea
                  value={formData.description}
                  onChange={e => setFormData({...formData, description: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                  rows={3}
                />
              </div>
              <label className="flex items-center gap-2 cursor-pointer pt-2">
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={e => setFormData({...formData, isActive: e.target.checked})}
                  className="w-5 h-5 rounded border-gray-300 text-brand focus:ring-emerald-600"
                />
                <span className="font-bold text-gray-700">تفعيل الفرع</span>
              </label>
            </div>
            
            <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3 rounded-b-xl">
              <button onClick={handleCloseModal} className="px-4 py-2 rounded-lg font-bold border border-gray-300 text-gray-700">
                إلغاء
              </button>
              <button onClick={handleSubmit} disabled={isSubmitting} className="px-4 py-2 rounded-lg font-bold bg-emerald-800 text-white">
                {isSubmitting ? 'جاري الحفظ...' : 'حفظ'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
