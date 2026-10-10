'use client'

import React, { useState, useEffect } from 'react'
import { Plus, Pencil, Trash2, Phone, Mail, MapPin, Package, ChevronRight, X, Save, Loader2, AlertTriangle, Search } from 'lucide-react'
import { getSuppliers, createSupplier, updateSupplier, deleteSupplier } from './actions'

type Supplier = {
  id: string
  name: string
  phone: string | null
  whatsapp: string | null
  email: string | null
  address: string | null
  notes: string | null
  isActive: boolean
  _count: { products: number }
}

const empty = { name: '', phone: '', whatsapp: '', email: '', address: '', notes: '', isActive: true }

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState(empty)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [searchQuery, setSearchQuery] = useState('')

  const filteredSuppliers = suppliers.filter(s => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (s.phone && s.phone.includes(searchQuery)) ||
    (s.whatsapp && s.whatsapp.includes(searchQuery))
  )

  const load = async () => {
    setLoading(true)
    const data = await getSuppliers()
    setSuppliers(data as Supplier[])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const openNew = () => { setEditId(null); setForm(empty); setError(''); setShowForm(true) }
  const openEdit = (s: Supplier) => {
    setEditId(s.id)
    setForm({ name: s.name, phone: s.phone ?? '', whatsapp: s.whatsapp ?? '', email: s.email ?? '', address: s.address ?? '', notes: s.notes ?? '', isActive: s.isActive })
    setError('')
    setShowForm(true)
  }

  const handleSave = async () => {
    if (!form.name.trim()) { setError('اسم المورد مطلوب'); return }
    setSaving(true); setError('')
    const data = { ...form, email: form.email || null, phone: form.phone || null, whatsapp: form.whatsapp || null, address: form.address || null, notes: form.notes || null }
    const res = editId ? await updateSupplier(editId, data) : await createSupplier(data)
    setSaving(false)
    if (res.success) { setShowForm(false); load() }
    else setError(res.error ?? 'حدث خطأ')
  }

  const handleDelete = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا المورد؟ سيتم فك ارتباطه بجميع منتجاته.')) return
    setDeletingId(id)
    await deleteSupplier(id)
    setDeletingId(null)
    load()
  }

  return (
    <div className="p-6 md:p-8 space-y-6" dir="rtl">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-foreground">الموردون</h1>
          <p className="text-sm text-foreground/50 mt-1">إدارة موردي البضاعة وربطهم بالمنتجات</p>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-grow md:w-64">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/40" />
            <input 
              type="text" 
              placeholder="بحث في الموردين..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-foreground/10 rounded-xl pr-10 pl-4 py-2 text-sm focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all"
            />
          </div>
          <button onClick={openNew} className="btn btn-primary gap-2 shrink-0">
            <Plus size={18} />
            <span className="hidden sm:inline">مورد جديد</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-brand" />
        </div>
      ) : suppliers.length === 0 ? (
        <div className="bg-white rounded-2xl border border-foreground/5 p-16 text-center">
          <Package className="w-16 h-16 text-foreground/20 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-foreground mb-2">لا يوجد موردون بعد</h3>
          <p className="text-foreground/50 mb-6">أضف مورديك الأول لربط المنتجات بهم وتفكيك الطلبات.</p>
          <button onClick={openNew} className="btn btn-primary gap-2"><Plus size={16} />إضافة مورد</button>
        </div>
      ) : filteredSuppliers.length === 0 ? (
        <div className="bg-white rounded-2xl border border-foreground/5 p-16 text-center">
          <Search className="w-16 h-16 text-foreground/20 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-foreground mb-2">لم يتم العثور على نتائج</h3>
          <p className="text-foreground/50 mb-6">لا يوجد مورد يطابق بحثك "{searchQuery}"</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredSuppliers.map(s => (
            <div key={s.id} className={`bg-white rounded-2xl border p-5 space-y-4 smooth-transition hover:border-brand/30 ${s.isActive ? 'border-foreground/5' : 'border-red-100 opacity-70'}`}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-lg text-foreground">{s.name}</h3>
                    {!s.isActive && <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-semibold">غير نشط</span>}
                  </div>
                  <span className="text-xs text-foreground/50 font-medium">{s._count.products} منتج مرتبط</span>
                </div>
                <div className="flex gap-1 shrink-0">
                  <button onClick={() => openEdit(s)} className="w-8 h-8 rounded-lg hover:bg-surface flex items-center justify-center text-foreground/50 hover:text-brand smooth-transition">
                    <Pencil size={14} />
                  </button>
                  <button onClick={() => handleDelete(s.id)} disabled={deletingId === s.id} className="w-8 h-8 rounded-lg hover:bg-red-50 flex items-center justify-center text-foreground/50 hover:text-red-600 smooth-transition">
                    {deletingId === s.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                  </button>
                </div>
              </div>
              <div className="space-y-2 text-sm text-foreground/70">
                {s.phone && (
                  <div className="flex items-center justify-between bg-surface/50 p-2 rounded-lg border border-foreground/5">
                    <div className="flex items-center gap-2">
                      <Phone size={14} className="text-brand" />
                      <span dir="ltr" className="font-semibold text-foreground">{s.phone}</span>
                    </div>
                    <a href={`tel:${s.phone}`} className="flex items-center gap-1 text-xs bg-brand/10 text-brand px-2.5 py-1.5 rounded hover:bg-brand/20 transition-colors font-bold">
                      <Phone size={12} /> اتصال
                    </a>
                  </div>
                )}
                {s.whatsapp && (
                  <div className="flex items-center justify-between bg-surface/50 p-2 rounded-lg border border-foreground/5">
                    <div className="flex items-center gap-2">
                      <span className="text-green-600 font-bold text-xs bg-green-100 px-1.5 py-0.5 rounded">WA</span>
                      <span dir="ltr" className="font-semibold text-foreground">{s.whatsapp}</span>
                    </div>
                    <a href={`https://wa.me/${s.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs bg-green-100 text-green-700 px-2.5 py-1.5 rounded hover:bg-green-200 transition-colors font-bold">
                      مراسلة
                    </a>
                  </div>
                )}
                {s.email && <div className="flex items-center gap-2 mt-3"><Mail size={13} className="text-brand" />{s.email}</div>}
                {s.address && <div className="flex items-center gap-2"><MapPin size={13} className="text-brand" />{s.address}</div>}
              </div>
              {s.notes && (
                <div className="bg-surface rounded-lg p-3 text-xs text-foreground/60">{s.notes}</div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Drawer */}
      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-end md:items-center justify-center p-4" dir="rtl">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white rounded-t-3xl border-b border-foreground/5 px-6 py-4 flex items-center justify-between">
              <h2 className="font-black text-xl">{editId ? 'تعديل المورد' : 'مورد جديد'}</h2>
              <button onClick={() => setShowForm(false)} className="w-9 h-9 rounded-full hover:bg-surface flex items-center justify-center smooth-transition"><X size={18} /></button>
            </div>
            <div className="p-6 space-y-4">
              {error && <div className="flex items-center gap-2 p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100"><AlertTriangle size={16}/>{error}</div>}
              
              <div>
                <label className="text-sm font-semibold text-foreground mb-1.5 block">اسم المورد <span className="text-red-500">*</span></label>
                <input value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))} className="w-full border border-foreground/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent" placeholder="اسم المورد أو الشركة" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-semibold text-foreground mb-1.5 block">رقم الهاتف</label>
                  <input dir="ltr" value={form.phone} onChange={e => setForm(f => ({...f, phone: e.target.value}))} className="w-full border border-foreground/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent" placeholder="05xxxxxxxx" />
                </div>
                <div>
                  <label className="text-sm font-semibold text-foreground mb-1.5 block">واتساب</label>
                  <input dir="ltr" value={form.whatsapp} onChange={e => setForm(f => ({...f, whatsapp: e.target.value}))} className="w-full border border-foreground/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent" placeholder="05xxxxxxxx" />
                </div>
              </div>
              <div>
                <label className="text-sm font-semibold text-foreground mb-1.5 block">البريد الإلكتروني</label>
                <input dir="ltr" value={form.email} onChange={e => setForm(f => ({...f, email: e.target.value}))} className="w-full border border-foreground/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent" placeholder="supplier@example.com" />
              </div>
              <div>
                <label className="text-sm font-semibold text-foreground mb-1.5 block">العنوان</label>
                <input value={form.address} onChange={e => setForm(f => ({...f, address: e.target.value}))} className="w-full border border-foreground/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent" placeholder="المدينة، الحي، الشارع..." />
              </div>
              <div>
                <label className="text-sm font-semibold text-foreground mb-1.5 block">ملاحظات</label>
                <textarea value={form.notes} onChange={e => setForm(f => ({...f, notes: e.target.value}))} rows={3} className="w-full border border-foreground/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent resize-none" placeholder="أي ملاحظات عن هذا المورد..." />
              </div>
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={form.isActive} onChange={e => setForm(f => ({...f, isActive: e.target.checked}))} className="w-4 h-4 accent-brand" />
                <span className="text-sm font-semibold">مورد نشط</span>
              </label>
            </div>
            <div className="sticky bottom-0 bg-white rounded-b-3xl border-t border-foreground/5 px-6 py-4 flex gap-3">
              <button onClick={handleSave} disabled={saving} className="btn btn-primary flex-1 gap-2">
                {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                {saving ? 'جاري الحفظ...' : 'حفظ'}
              </button>
              <button onClick={() => setShowForm(false)} className="btn btn-secondary">إلغاء</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
