'use client'

import React, { useState } from 'react'
import Image from 'next/image'
import { Plus, Edit2, Trash2, X, AlertCircle } from 'lucide-react'
import { createOffer, updateOffer, deleteOffer } from './actions'

type Offer = {
  id: string
  productId: string
  offerPrice: number
  originalPrice: number
  startDate: Date
  endDate: Date
  isActive: boolean
  showInHomepage: boolean
  imageUrl: string | null
  product: { id: string, name: string, imageUrl: string | null }
}

type Product = { id: string, name: string, price: number, imageUrl: string | null }

export default function OffersClient({ initialOffers, products }: { initialOffers: any[], products: Product[] }) {
  const [offers, setOffers] = useState<Offer[]>(initialOffers)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  
  const [formData, setFormData] = useState({
    productId: '',
    offerPrice: '',
    originalPrice: '',
    startDate: '',
    endDate: '',
    isActive: true,
    showInHomepage: true,
    imageUrl: ''
  })

  const resetForm = () => {
    setFormData({
      productId: '',
      offerPrice: '',
      originalPrice: '',
      startDate: new Date().toISOString().slice(0, 16),
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
      isActive: true,
      showInHomepage: true,
      imageUrl: ''
    })
    setEditingId(null)
  }

  const handleOpenModal = (offer?: Offer) => {
    if (offer) {
      setFormData({
        productId: offer.productId,
        offerPrice: offer.offerPrice.toString(),
        originalPrice: offer.originalPrice.toString(),
        startDate: new Date(offer.startDate).toISOString().slice(0, 16),
        endDate: new Date(offer.endDate).toISOString().slice(0, 16),
        isActive: offer.isActive,
        showInHomepage: offer.showInHomepage,
        imageUrl: offer.imageUrl || ''
      })
      setEditingId(offer.id)
    } else {
      resetForm()
    }
    setIsModalOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    const payload = {
      ...formData,
      offerPrice: Number(formData.offerPrice),
      originalPrice: Number(formData.originalPrice),
      imageUrl: formData.imageUrl || null
    }

    const res = editingId 
      ? await updateOffer(editingId, payload)
      : await createOffer(payload)
      
    if (res.success) {
      setIsModalOpen(false)
      window.location.reload()
    } else {
      alert(res.error)
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا العرض؟')) return
    const res = await deleteOffer(id)
    if (res.success) {
      setOffers(prev => prev.filter(o => o.id !== id))
    } else {
      alert(res.error)
    }
  }

  return (
    <div>
      <div className="flex justify-end mb-6">
        <button onClick={() => handleOpenModal()} className="bg-brand text-white px-4 py-2 rounded-md font-bold flex items-center gap-2 hover:bg-emerald-700 transition-colors">
          <Plus size={18} />
          إضافة عرض جديد
        </button>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
        <table className="w-full text-right">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="p-4 font-bold text-gray-700">المنتج</th>
              <th className="p-4 font-bold text-gray-700">سعر العرض</th>
              <th className="p-4 font-bold text-gray-700">السعر السابق</th>
              <th className="p-4 font-bold text-gray-700">تاريخ الانتهاء</th>
              <th className="p-4 font-bold text-gray-700">الحالة</th>
              <th className="p-4 font-bold text-gray-700">الرئيسية</th>
              <th className="p-4 font-bold text-gray-700">إجراءات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {offers.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-8 text-center text-gray-500 font-bold">لا توجد عروض حالياً</td>
              </tr>
            ) : offers.map(offer => {
              const isExpired = new Date(offer.endDate) < new Date()
              return (
                <tr key={offer.id} className="hover:bg-gray-50 transition-colors">
                  <td className="p-4 flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-100 rounded-md relative overflow-hidden flex items-center justify-center shrink-0">
                      {(offer.imageUrl || offer.product.imageUrl) ? (
                        <Image src={offer.imageUrl || offer.product.imageUrl || ''} alt={offer.product.name} fill className="object-cover mix-blend-multiply" />
                      ) : (
                        <span className="text-gray-300 text-xs">صورة</span>
                      )}
                    </div>
                    <span className="font-bold text-sm text-gray-900">{offer.product.name}</span>
                  </td>
                  <td className="p-4 font-bold text-brand">{offer.offerPrice}</td>
                  <td className="p-4 text-gray-500 line-through text-sm">{offer.originalPrice}</td>
                  <td className="p-4">
                    <div className="text-sm">
                      {new Date(offer.endDate).toLocaleDateString('ar-SA')}
                    </div>
                    {isExpired && <span className="text-xs text-red-500 font-bold bg-red-50 px-2 py-0.5 rounded-full mt-1 inline-block">منتهي</span>}
                  </td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${offer.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                      {offer.isActive ? 'مفعل' : 'متوقف'}
                    </span>
                  </td>
                  <td className="p-4">
                    {offer.showInHomepage ? <span className="text-green-600 font-bold">نعم</span> : <span className="text-gray-400">لا</span>}
                  </td>
                  <td className="p-4">
                    <div className="flex gap-2">
                      <button onClick={() => handleOpenModal(offer)} className="text-blue-500 hover:bg-blue-50 p-1.5 rounded-md transition-colors"><Edit2 size={16} /></button>
                      <button onClick={() => handleDelete(offer.id)} className="text-red-500 hover:bg-red-50 p-1.5 rounded-md transition-colors"><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-lg w-full max-w-2xl overflow-hidden shadow-xl max-h-[90vh] flex flex-col">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h2 className="text-lg font-bold text-gray-900">{editingId ? 'تعديل العرض' : 'إضافة عرض جديد'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-500 hover:text-gray-900 transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 flex-grow">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">المنتج <span className="text-red-500">*</span></label>
                <select 
                  required
                  value={formData.productId}
                  onChange={(e) => {
                    const pid = e.target.value
                    const p = products.find(x => x.id === pid)
                    setFormData(prev => ({ 
                      ...prev, 
                      productId: pid,
                      originalPrice: p && !prev.originalPrice ? p.price.toString() : prev.originalPrice 
                    }))
                  }}
                  className="w-full border border-gray-300 rounded-md p-2 focus:border-brand focus:ring-1 focus:ring-brand outline-none"
                >
                  <option value="" disabled>اختر منتجاً</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>{p.name} — ({p.price} رس)</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">سعر العرض <span className="text-red-500">*</span></label>
                  <input 
                    type="number" step="0.01" min="0" required
                    value={formData.offerPrice}
                    onChange={(e) => setFormData(prev => ({ ...prev, offerPrice: e.target.value }))}
                    className="w-full border border-gray-300 rounded-md p-2 focus:border-brand outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">السعر السابق <span className="text-red-500">*</span></label>
                  <input 
                    type="number" step="0.01" min="0" required
                    value={formData.originalPrice}
                    onChange={(e) => setFormData(prev => ({ ...prev, originalPrice: e.target.value }))}
                    className="w-full border border-gray-300 rounded-md p-2 focus:border-brand outline-none"
                  />
                </div>
              </div>

              {Number(formData.offerPrice) > 0 && Number(formData.originalPrice) > 0 && Number(formData.offerPrice) >= Number(formData.originalPrice) && (
                <div className="text-xs text-red-600 font-bold flex items-center gap-1 mt-1">
                  <AlertCircle size={14} />
                  سعر العرض يجب أن يكون أقل من السعر السابق لتوضيح الخصم!
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">بداية العرض <span className="text-red-500">*</span></label>
                  <input 
                    type="datetime-local" required
                    value={formData.startDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                    className="w-full border border-gray-300 rounded-md p-2 outline-none text-left" dir="ltr"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">نهاية العرض <span className="text-red-500">*</span></label>
                  <input 
                    type="datetime-local" required
                    value={formData.endDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                    className="w-full border border-gray-300 rounded-md p-2 outline-none text-left" dir="ltr"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">صورة خاصة بالعرض (اختياري)</label>
                <input 
                  type="url" placeholder="https://..."
                  value={formData.imageUrl}
                  onChange={(e) => setFormData(prev => ({ ...prev, imageUrl: e.target.value }))}
                  className="w-full border border-gray-300 rounded-md p-2 text-left outline-none" dir="ltr"
                />
                <p className="text-xs text-gray-500 mt-1">إذا تم تركها فارغة، ستُستخدم صورة المنتج الأصلية.</p>
              </div>

              <div className="flex gap-6 mt-4 p-4 bg-gray-50 rounded-md">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={formData.isActive}
                    onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                    className="w-4 h-4 accent-brand"
                  />
                  <span className="text-sm font-bold text-gray-800">تفعيل العرض حالياً</span>
                </label>
                
                <label className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={formData.showInHomepage}
                    onChange={(e) => setFormData(prev => ({ ...prev, showInHomepage: e.target.checked }))}
                    className="w-4 h-4 accent-brand"
                  />
                  <span className="text-sm font-bold text-gray-800">إظهار في الصفحة الرئيسية</span>
                </label>
              </div>

              <div className="flex gap-3 pt-4 border-t border-gray-100 mt-6">
                <button 
                  type="submit" 
                  disabled={isSubmitting || (Number(formData.offerPrice) >= Number(formData.originalPrice))}
                  className="flex-1 bg-brand text-white py-2 rounded-md font-bold hover:bg-emerald-700 transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? 'جاري الحفظ...' : 'حفظ العرض'}
                </button>
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="px-6 bg-gray-100 text-gray-700 py-2 rounded-md font-bold hover:bg-gray-200 transition-colors"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
