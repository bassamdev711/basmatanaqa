'use client'

import React, { useState } from 'react'
import { Truck, CheckCircle2, AlertCircle, ShieldCheck, MapPin, Trash2, Plus, Pencil, Save, X } from 'lucide-react'
import { updateStoreSettings } from './actions'
import { addShippingCity, updateShippingCity, deleteShippingCity } from '@/app/actions/shipping'
import { useCurrency } from '@/components/CurrencyProvider'
import { useConfirm } from '@/components/ConfirmProvider'

type StoreSettings = {
  shippingFee: number
  freeShippingThreshold: number
  showShippingInFooter: boolean
  showReturnInFooter: boolean
  shippingPolicyContent: string
  returnPolicyContent: string
}

type ShippingCity = {
  id: string
  name: string
  shippingFee: number
  isActive: boolean
}

export default function ShippingSettingsClient({ initialSettings, initialCities = [] }: { initialSettings: StoreSettings, initialCities?: ShippingCity[] }) {
  const currency = useCurrency()
  const { confirm } = useConfirm()

  const [shippingFee, setShippingFee] = useState(initialSettings.shippingFee.toString())
  const [freeShippingThreshold, setFreeShippingThreshold] = useState(initialSettings.freeShippingThreshold.toString())
  
  const [showShippingInFooter, setShowShippingInFooter] = useState(initialSettings.showShippingInFooter)
  const [shippingPolicyContent, setShippingPolicyContent] = useState(initialSettings.shippingPolicyContent)
  
  const [showReturnInFooter, setShowReturnInFooter] = useState(initialSettings.showReturnInFooter)
  const [returnPolicyContent, setReturnPolicyContent] = useState(initialSettings.returnPolicyContent)

  const [cities, setCities] = useState<ShippingCity[]>(initialCities)
  const [newCityName, setNewCityName] = useState('')
  const [newCityFee, setNewCityFee] = useState('')
  const [isAddingCity, setIsAddingCity] = useState(false)
  const [cityError, setCityError] = useState('')
  const [editingCityId, setEditingCityId] = useState<string | null>(null)
  const [editCityName, setEditCityName] = useState('')
  const [editCityFee, setEditCityFee] = useState('')
  const [isSavingCity, setIsSavingCity] = useState(false)

  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    const fee = parseFloat(shippingFee)
    const threshold = parseFloat(freeShippingThreshold)

    if (isNaN(fee) || fee < 0) {
      setError('رسوم الشحن يجب أن تكون رقماً صحيحاً (صفر أو أكثر).')
      setLoading(false)
      return
    }

    if (isNaN(threshold) || threshold < 0) {
      setError('الحد الأدنى للشحن المجاني يجب أن يكون رقماً صحيحاً.')
      setLoading(false)
      return
    }

    const res = await updateStoreSettings({
      shippingFee: fee,
      freeShippingThreshold: threshold,
      showShippingInFooter,
      showReturnInFooter,
      shippingPolicyContent,
      returnPolicyContent
    })

    if (res.success) {
      setSuccess('تم حفظ إعدادات الشحن بنجاح!')
    } else {
      setError(res.error || 'حدث خطأ غير متوقع.')
    }
    setLoading(false)
  }

  const handleAddCity = async (e: React.FormEvent) => {
    e.preventDefault()
    setCityError('')
    setIsAddingCity(true)

    if (!newCityName.trim()) {
      setCityError('الرجاء إدخال اسم المدينة')
      setIsAddingCity(false)
      return
    }

    const fee = parseFloat(newCityFee)
    if (isNaN(fee) || fee < 0) {
      setCityError('الرجاء إدخال سعر صحيح')
      setIsAddingCity(false)
      return
    }

    const res = await addShippingCity({ name: newCityName, shippingFee: fee })
    if (res.success && res.data) {
      setCities([...cities, { id: res.data.id, name: res.data.name, shippingFee: Number(res.data.shippingFee), isActive: res.data.isActive }])
      setNewCityName('')
      setNewCityFee('')
      setSuccess('تم إضافة المدينة بنجاح')
      setTimeout(() => setSuccess(''), 3000)
    } else {
      setCityError(res.error || 'حدث خطأ')
    }
    setIsAddingCity(false)
  }

  const handleDeleteCity = async (id: string) => {
    if (!(await confirm({ message: 'هل أنت متأكد من حذف هذه المدينة؟', danger: true }))) return
    
    const res = await deleteShippingCity(id)
    if (res.success) {
      setCities(cities.filter(c => c.id !== id))
    } else {
      setCityError(res.error || 'حدث خطأ أثناء الحذف')
    }
  }

  const handleToggleCity = async (id: string, currentStatus: boolean) => {
    const res = await updateShippingCity(id, { isActive: !currentStatus })
    if (res.success) {
      setCities(cities.map(c => c.id === id ? { ...c, isActive: !currentStatus } : c))
    } else {
      setCityError(res.error || 'حدث خطأ أثناء تحديث حالة المدينة')
    }
  }

  const startEditingCity = (city: ShippingCity) => {
    setCityError('')
    setEditingCityId(city.id)
    setEditCityName(city.name)
    setEditCityFee(String(city.shippingFee))
  }

  const cancelEditingCity = () => {
    setEditingCityId(null)
    setEditCityName('')
    setEditCityFee('')
  }

  const handleSaveCity = async (id: string) => {
    const name = editCityName.trim()
    const fee = parseFloat(editCityFee)
    if (name.length < 2) {
      setCityError('الرجاء إدخال اسم مدينة صحيح')
      return
    }
    if (isNaN(fee) || fee < 0) {
      setCityError('الرجاء إدخال سعر صحيح')
      return
    }

    setIsSavingCity(true)
    setCityError('')
    const res = await updateShippingCity(id, { name, shippingFee: fee })
    if (res.success && res.data) {
      setCities(cities.map(city => city.id === id
        ? { ...city, name: res.data!.name, shippingFee: Number(res.data!.shippingFee) }
        : city
      ))
      setSuccess('تم تحديث المدينة بنجاح')
      cancelEditingCity()
      setTimeout(() => setSuccess(''), 3000)
    } else {
      setCityError(res.error || 'حدث خطأ أثناء تحديث المدينة')
    }
    setIsSavingCity(false)
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-black text-deep-green mb-2 flex items-center gap-3">
          <Truck className="w-8 h-8 text-gold" />
          إعدادات الشحن والسياسات
        </h1>
        <p className="text-deep-green/60">التحكم في تكاليف الشحن، وسياسات المتجر التي تظهر للعملاء.</p>
      </div>

      <div className="bg-white p-8 border border-black/5 shadow-sm rounded-md max-w-3xl">
        {success && (
          <div className="bg-emerald/10 text-brand p-4 rounded-md mb-6 border border-emerald/20 flex items-center gap-2 font-bold">
            <CheckCircle2 size={20} />
            {success}
          </div>
        )}
        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-md mb-6 border border-red-200 flex items-center gap-2 font-bold">
            <AlertCircle size={20} />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          
          <div className="bg-[#F9F7F2] p-6 rounded-md border border-black/5">
            <label className="block text-lg font-bold text-deep-green mb-2">رسوم الشحن الثابتة ({currency})</label>
            <p className="text-sm text-deep-green/60 mb-4">هذا المبلغ سيضاف تلقائياً لأي طلب جديد يقوم به العميل.</p>
            <div className="relative w-full md:w-1/2">
              <input 
                type="number"
                min="0"
                step="0.01"
                value={shippingFee}
                onChange={e => setShippingFee(e.target.value)}
                className="w-full px-4 py-3 bg-white border border-black/10 rounded-md focus:outline-none focus:border-gold pr-12 font-bold text-lg"
                required
              />
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-deep-green/40 font-bold">{currency}</span>
            </div>
          </div>

          <div className="bg-[#F9F7F2] p-6 rounded-md border border-black/5">
            <label className="block text-lg font-bold text-deep-green mb-2">الحد الأدنى للشحن المجاني ({currency})</label>
            <p className="text-sm text-deep-green/60 mb-4">إذا تجاوز إجمالي سلة المشتريات هذا المبلغ، سيكون الشحن مجانياً (سيتم إلغاء رسوم الشحن الثابتة). ضع القيمة 0 إذا كنت لا تريد تقديم شحن مجاني.</p>
            <div className="relative w-full md:w-1/2">
              <input 
                type="number"
                min="0"
                step="0.01"
                value={freeShippingThreshold}
                onChange={e => setFreeShippingThreshold(e.target.value)}
                className="w-full px-4 py-3 bg-white border border-black/10 rounded-md focus:outline-none focus:border-gold pr-12 font-bold text-lg"
                required
              />
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-deep-green/40 font-bold">{currency}</span>
            </div>
          </div>

          {/* Cities Management Section */}
          <div className="bg-white rounded-xl border border-black/5 p-6 mb-8 shadow-sm">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-black/5">
              <div className="w-10 h-10 rounded-full bg-emerald/10 flex items-center justify-center text-brand">
                <MapPin size={20} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-deep-green">المدن المدعومة وتكلفة الشحن</h2>
                <p className="text-sm text-deep-green/60 mt-1">أضف المدن التي توصل إليها لكي يختار العميل منها في صفحة الدفع، مع تحديد سعر خاص لكل مدينة.</p>
              </div>
            </div>

            <form onSubmit={handleAddCity} className="flex flex-col md:flex-row gap-4 items-end mb-6 bg-[#F9F7F2]/50 p-4 rounded-lg border border-black/5">
              <div className="flex-1 w-full">
                <label className="block text-sm font-bold text-deep-green mb-2">اسم المدينة</label>
                <input
                  type="text"
                  value={newCityName}
                  onChange={(e) => setNewCityName(e.target.value)}
                  className="w-full border border-black/10 rounded-lg px-4 py-2.5 focus:outline-none focus:border-emerald/50"
                  placeholder="اسم المدينة..."
                />
              </div>
              <div className="flex-1 w-full">
                <label className="block text-sm font-bold text-deep-green mb-2">تكلفة الشحن لهذه المدينة</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={newCityFee}
                  onChange={(e) => setNewCityFee(e.target.value)}
                  className="w-full border border-black/10 rounded-lg px-4 py-2.5 focus:outline-none focus:border-emerald/50"
                  placeholder="مثال: 30"
                />
              </div>
              <button 
                type="submit"
                disabled={isAddingCity}
                className="w-full md:w-auto bg-emerald text-white font-bold py-2.5 px-6 rounded-lg hover:bg-deep-green transition-colors disabled:opacity-70 flex items-center justify-center gap-2"
              >
                <Plus size={18} />
                {isAddingCity ? 'جاري الإضافة...' : 'إضافة مدينة'}
              </button>
            </form>

            {cityError && (
              <div className="mb-4 bg-red-50 text-red-600 p-4 rounded-lg flex items-center gap-2 text-sm border border-red-100">
                <AlertCircle size={18} />
                <span>{cityError}</span>
              </div>
            )}

            <div className="border border-black/5 rounded-lg overflow-hidden">
              <table className="w-full text-right">
                <thead className="bg-[#F9F7F2] text-deep-green/70 text-sm">
                  <tr>
                    <th className="py-3 px-4 font-bold">المدينة</th>
                    <th className="py-3 px-4 font-bold">تكلفة الشحن</th>
                    <th className="py-3 px-4 font-bold">الحالة</th>
                    <th className="py-3 px-4 font-bold">إجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/5">
                  {cities.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-deep-green/50">لا توجد مدن مضافة بعد. ستتم تهيئة محافظة إب تلقائياً كمدينة افتراضية، ويمكنك إضافة أو تعديل المدن من هنا.</td>
                    </tr>
                  ) : (
                    cities.map(city => (
                      <tr key={city.id} className="hover:bg-[#F9F7F2]/30 transition-colors">
                        {editingCityId === city.id ? (
                          <>
                            <td className="py-3 px-4">
                              <input
                                value={editCityName}
                                onChange={(e) => setEditCityName(e.target.value)}
                                className="w-full min-w-32 border border-black/10 rounded-lg px-3 py-2 focus:outline-none focus:border-emerald/50"
                                aria-label="اسم المدينة"
                              />
                            </td>
                            <td className="py-3 px-4">
                              <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={editCityFee}
                                onChange={(e) => setEditCityFee(e.target.value)}
                                className="w-28 border border-black/10 rounded-lg px-3 py-2 focus:outline-none focus:border-emerald/50"
                                aria-label="تكلفة الشحن"
                              />
                            </td>
                          </>
                        ) : (
                          <>
                            <td className="py-3 px-4 font-bold text-deep-green">{city.name}</td>
                            <td className="py-3 px-4 text-deep-green">{city.shippingFee} ريال</td>
                          </>
                        )}
                        <td className="py-3 px-4">
                          <button
                            type="button"
                            onClick={() => handleToggleCity(city.id, city.isActive)}
                            disabled={editingCityId === city.id}
                            aria-label={city.isActive ? `تعطيل ${city.name}` : `تفعيل ${city.name}`}
                            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors disabled:opacity-50 ${city.isActive ? 'bg-emerald' : 'bg-gray-300'}`}
                          >
                            <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${city.isActive ? '-translate-x-5' : '-translate-x-1'}`} />
                          </button>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            {editingCityId === city.id ? (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleSaveCity(city.id)}
                                  disabled={isSavingCity}
                                  className="text-emerald hover:text-deep-green transition-colors p-1 disabled:opacity-50"
                                  aria-label="حفظ تعديلات المدينة"
                                >
                                  <Save size={16} />
                                </button>
                                <button
                                  type="button"
                                  onClick={cancelEditingCity}
                                  disabled={isSavingCity}
                                  className="text-deep-green/60 hover:text-deep-green transition-colors p-1 disabled:opacity-50"
                                  aria-label="إلغاء تعديل المدينة"
                                >
                                  <X size={16} />
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  type="button"
                                  onClick={() => startEditingCity(city)}
                                  className="text-brand hover:text-deep-green transition-colors p-1"
                                  aria-label={`تعديل ${city.name}`}
                                >
                                  <Pencil size={16} />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteCity(city.id)}
                                  className="text-red-500 hover:text-red-700 transition-colors p-1"
                                  aria-label={`حذف ${city.name}`}
                                >
                                  <Trash2 size={16} />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <hr className="border-black/5" />

          {/* Shipping Policy */}
          <div className="bg-white p-6 rounded-md border border-black/10">
            <div className="flex items-center justify-between mb-4">
              <div>
                <label className="block text-lg font-bold text-deep-green flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-brand" />
                  سياسة الشحن والتوصيل
                </label>
                <p className="text-sm text-deep-green/60 mt-1">اكتب تفاصيل مدة التوصيل وشركات الشحن ليتمكن العميل من قراءتها.</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="sr-only peer" 
                  checked={showShippingInFooter}
                  onChange={(e) => setShowShippingInFooter(e.target.checked)}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald"></div>
                <span className="ml-3 text-sm font-bold text-deep-green">إظهار في الفوتر</span>
              </label>
            </div>
            {showShippingInFooter && (
              <textarea
                value={shippingPolicyContent}
                onChange={(e) => setShippingPolicyContent(e.target.value)}
                rows={6}
                placeholder="اكتب محتوى سياسة الشحن هنا..."
                className="w-full px-4 py-3 bg-[#F9F7F2] border border-black/10 rounded-md focus:outline-none focus:border-gold mt-2 resize-none leading-relaxed"
              ></textarea>
            )}
          </div>

          {/* Return Policy */}
          <div className="bg-white p-6 rounded-md border border-black/10">
            <div className="flex items-center justify-between mb-4">
              <div>
                <label className="block text-lg font-bold text-deep-green flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-brand" />
                  سياسة الاسترجاع والاستبدال
                </label>
                <p className="text-sm text-deep-green/60 mt-1">وضح شروط إرجاع المنتجات واسترداد الأموال بوضوح لبناء الثقة.</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="sr-only peer" 
                  checked={showReturnInFooter}
                  onChange={(e) => setShowReturnInFooter(e.target.checked)}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald"></div>
                <span className="ml-3 text-sm font-bold text-deep-green">إظهار في الفوتر</span>
              </label>
            </div>
            {showReturnInFooter && (
              <textarea
                value={returnPolicyContent}
                onChange={(e) => setReturnPolicyContent(e.target.value)}
                rows={6}
                placeholder="اكتب محتوى سياسة الاسترجاع هنا..."
                className="w-full px-4 py-3 bg-[#F9F7F2] border border-black/10 rounded-md focus:outline-none focus:border-gold mt-2 resize-none leading-relaxed"
              ></textarea>
            )}
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full md:w-auto bg-gold text-deep-green px-12 py-4 rounded-none font-bold hover:bg-[#c9a756] transition-colors disabled:opacity-50 text-lg"
          >
            {loading ? 'جاري الحفظ...' : 'حفظ الإعدادات'}
          </button>
        </form>
      </div>
    </div>
  )
}
