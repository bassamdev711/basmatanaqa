'use client'

import { useToast } from '@/components/ToastProvider'
import { useConfirm } from '@/components/ConfirmProvider'
import React, { useState } from 'react'
import { Plus, Package, Edit2, X, Trash2 } from 'lucide-react'
import { createCollection, deleteCollection, updateCollection } from './actions'
import ImageUpload from '../products/ImageUpload'

type Collection = {
  id: string
  name: string
  slug: string
  description: string | null
  imageUrl: string | null
  isActive: boolean
  _count?: { products: number }
}

type CollectionInput = {
  name: string
  slug: string
  description: string
  imageUrl: string | null
  isActive: boolean
}

export default function CollectionsClient({
  initialCollections }: { initialCollections: Collection[] }) {
  const { showToast } = useToast()
  const { confirm } = useConfirm()
  const [collections] = useState(initialCollections)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    imageUrl: '',
    isActive: true
  })

  const handleOpenModal = () => {
    setEditingId(null)
    setFormData({ name: '', slug: '', description: '', imageUrl: '', isActive: true })
    setIsModalOpen(true)
  }

  const handleEdit = (col: Collection) => {
    setEditingId(col.id)
    setFormData({
      name: col.name || '',
      slug: col.slug || '',
      description: col.description || '',
      imageUrl: col.imageUrl || '',
      isActive: col.isActive
    })
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setFormData({ name: '', slug: '', description: '', imageUrl: '', isActive: true })
    setEditingId(null)
  }

  const handleSubmit = async () => {
    if(!formData.name || !formData.slug) return showToast('success', 'يرجى تعبئة الحقول المطلوبة (الاسم، الرابط الدائم)')
    setIsSubmitting(true)

    const payload = {
      ...formData,
      imageUrl: formData.imageUrl || null
    }

    let res;
    if (editingId) {
      res = await updateCollection(editingId, payload)
    } else {
      res = await createCollection(payload as CollectionInput)
    }

    if(res.success) {
      window.location.reload()
    } else {
      alert(res.error)
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (id: string, name: string) => {
    if (!(await confirm({ message: `هل أنت متأكد من رغبتك في حذف التصنيف "${name}"؟`, danger: true }))) return;

    const res = await deleteCollection(id);
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
        <h2 className="text-3xl font-bold text-gray-900">التصنيفات</h2>
        <button
          onClick={handleOpenModal}
          className="bg-emerald-800 text-white px-6 py-2.5 rounded-lg font-bold hover:bg-emerald-900 transition-colors flex items-center gap-2"
        >
          <Plus size={18} />
          إنشاء تصنيف جديد
        </button>
      </div>

      {/* Collections Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {collections.map(col => (
          <div key={col.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-lg transition-shadow group relative flex flex-col h-full">
            <div className="h-48 relative overflow-hidden bg-gray-100 flex items-center justify-center">
              {col.imageUrl ? (
                <div
                  className="w-full h-full bg-cover bg-center group-hover:scale-105 transition-transform duration-500"
                  style={{ backgroundImage: `url('${col.imageUrl}')` }}
                />
              ) : (
                <Package size={48} className="text-gray-300" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>

              {col.isActive ? (
                <span className="absolute top-4 right-4 bg-green-500/20 text-green-400 px-3 py-1 rounded font-bold text-xs border border-green-500/30">نشط</span>
              ) : (
                <span className="absolute top-4 right-4 bg-yellow-500/20 text-yellow-400 px-3 py-1 rounded font-bold text-xs border border-yellow-500/30">مسودة</span>
              )}
            </div>

            <div className="p-6 flex-1 flex flex-col gap-3">
              <h3 className="text-xl font-bold text-gray-900">{col.name}</h3>
              <p className="text-sm text-gray-500 line-clamp-2 leading-relaxed">
                {col.description || 'لا يوجد وصف.'}
              </p>

              <div className="mt-auto pt-4 flex items-center justify-between border-t border-gray-100">
                <span className="text-gray-500 text-sm font-bold flex items-center gap-2">
                  <Package size={16} /> {col._count?.products ?? 0} منتج
                </span>
                <div className="flex items-center gap-3">
                  <button onClick={() => handleEdit(col)} className="text-brand hover:text-brand-800 transition-colors" title="تعديل">
                    <Edit2 size={18} />
                  </button>
                  <button onClick={() => handleDelete(col.id, col.name)} className="text-red-500 hover:text-red-700 transition-colors" title="حذف">
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}

        {collections.length === 0 && (
          <div className="col-span-full py-12 text-center text-gray-500">
            لا توجد تصنيفات حاليًا. ابدأ بإنشاء تصنيف جديد.
          </div>
        )}
      </div>

      {/* Create Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={handleCloseModal}></div>
          <div className="relative bg-white w-full max-w-2xl rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">

            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="text-xl font-bold text-gray-900">{editingId ? 'تعديل التصنيف' : 'إنشاء تصنيف جديد'}</h3>
              <button onClick={handleCloseModal} className="btn btn-ghost btn-icon text-gray-400">
                <X size={24} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 flex flex-col gap-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-bold text-gray-700">اسم التصنيف</label>
                  <input
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                    placeholder="مثال: ملابس"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-bold text-gray-700">نهاية رابط التصنيف (باللغة الإنجليزية وبدون مسافات) *</label>
                  <div className="flex rounded-lg shadow-sm" dir="ltr">
                    <span className="inline-flex items-center rounded-l-lg border border-r-0 border-gray-300 px-3 text-gray-500 sm:text-sm bg-gray-50">
                      https://example-store.com/collections/
                    </span>
                    <input
                      value={formData.slug}
                      onChange={e => setFormData({...formData, slug: e.target.value})}
                      className="w-full min-w-0 flex-1 rounded-none rounded-r-lg border-gray-300 border px-4 py-2 text-left focus:outline-none focus:border-emerald-600"
                      placeholder="oriental-collection"
                    />
                  </div>
                  <p className="mt-1 text-xs text-gray-500 text-right">يُستخدم هذا الرابط لمشاركة التصنيف. يرجى استخدام حروف إنجليزية وشرطات (-) بدلاً من المسافات.</p>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-bold text-gray-700">الوصف</label>
                <textarea
                  value={formData.description}
                  onChange={e => setFormData({...formData, description: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg resize-none focus:outline-none focus:border-emerald-600"
                  placeholder="اكتب وصفاً مختصراً..."
                  rows={3}
                />
              </div>

              <div className="flex flex-col gap-2">
                <h4 className="text-sm font-bold text-gray-700">صورة الغلاف (اختياري)</h4>
                <ImageUpload
                  mainImage={formData.imageUrl}
                  onMainImageChange={(url) => setFormData({...formData, imageUrl: url})}
                  singleOnly={true}
                />
              </div>

              <div className="flex items-center gap-3 mt-2">
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={e => setFormData({...formData, isActive: e.target.checked})}
                  className="w-5 h-5 rounded border-gray-300 text-brand focus:ring-emerald-600"
                  id="colActive"
                />
                <label className="font-bold text-gray-700 cursor-pointer" htmlFor="colActive">تفعيل المجموعة فوراً</label>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
              <button
                onClick={handleCloseModal}
                className="px-6 py-2 rounded-lg font-bold border border-gray-300 text-gray-700 hover:bg-gray-100 transition-colors"
              >
                إلغاء
              </button>
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="px-6 py-2 rounded-lg font-bold bg-emerald-800 text-white hover:bg-emerald-900 transition-colors disabled:opacity-50"
              >
                {isSubmitting ? 'جاري الحفظ...' : 'حفظ التصنيف'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
