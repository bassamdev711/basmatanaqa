'use client'

import { useState, useTransition } from 'react'
import { saveAnnouncementBar, toggleAnnouncementBar } from './actions'
import { Bell, BellOff, Eye } from 'lucide-react'
import { useToast } from '@/components/ToastProvider'

interface AnnouncementBarPageClientProps {
  initial: {
    message: string
    linkText: string
    linkUrl: string
    bgColor: string
    textColor: string
    isActive: boolean
  }
}

export default function AnnouncementBarClient({ initial }: AnnouncementBarPageClientProps) {
  const [isPending, startTransition] = useTransition()
  const { showToast } = useToast()
  const [preview, setPreview] = useState({
    message: initial.message,
    linkText: initial.linkText,
    bgColor: initial.bgColor,
    textColor: initial.textColor,
  })

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    
    startTransition(async () => {
      try {
        await saveAnnouncementBar(formData)
        showToast('success', 'تم حفظ الإعدادات بنجاح')
      } catch {
        showToast('error', 'حدث خطأ أثناء الحفظ')
      }
    })
  }

  const handleToggle = () => {
    startTransition(async () => {
      try {
        await toggleAnnouncementBar(!initial.isActive)
        showToast('success', !initial.isActive ? 'تم تفعيل الشريط بنجاح' : 'تم تعطيل الشريط')
      } catch {
        showToast('error', 'حدث خطأ')
      }
    })
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-gray-900">شريط الإعلانات</h2>
          <p className="text-gray-500 text-sm mt-1">يظهر أعلى كل صفحة في الموقع</p>
        </div>
        <div className={`flex items-center gap-2 text-sm font-bold px-3 py-1.5 rounded-full ${initial.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
          {initial.isActive ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
          {initial.isActive ? 'مفعَّل' : 'معطَّل'}
        </div>
      </div>

      {/* Live Preview */}
      <div className="rounded-xl overflow-hidden border border-gray-200 shadow-sm">
        <div className="bg-gray-100 border-b border-gray-200 px-4 py-2 flex items-center gap-2">
          <Eye className="w-4 h-4 text-gray-400" />
          <span className="text-xs text-gray-500 font-medium">معاينة مباشرة</span>
        </div>
        <div
          style={{ backgroundColor: preview.bgColor, color: preview.textColor }}
          className="py-2.5 px-4 text-center text-sm font-medium flex items-center justify-center gap-3 transition-colors duration-300"
        >
          <span>{preview.message || 'اكتب رسالتك هنا...'}</span>
          {preview.linkText && (
            <span className="underline font-bold text-xs cursor-pointer opacity-80 hover:opacity-100">
              {preview.linkText}
            </span>
          )}
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm space-y-4">
          <h3 className="font-bold text-gray-900 border-b pb-3">محتوى الشريط</h3>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              نص الإعلان <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="message"
              required
              defaultValue={initial.message}
              onChange={(e) => setPreview(p => ({ ...p, message: e.target.value }))}
              placeholder="مثال: خصم 20% على جميع المنتجات! استخدم الكود: SUMMER20"
              className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:outline-none focus:border-emerald bg-white"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">نص الرابط (اختياري)</label>
              <input
                type="text"
                name="linkText"
                defaultValue={initial.linkText}
                onChange={(e) => setPreview(p => ({ ...p, linkText: e.target.value }))}
                placeholder="مثال: تسوق الآن"
                className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:outline-none focus:border-emerald bg-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">الرابط (اختياري)</label>
              <input
                type="url"
                name="linkUrl"
                defaultValue={initial.linkUrl}
                placeholder="https://..."
                dir="ltr"
                className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:outline-none focus:border-emerald bg-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">لون الخلفية</label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  name="bgColor"
                  defaultValue={initial.bgColor}
                  onChange={(e) => setPreview(p => ({ ...p, bgColor: e.target.value }))}
                  className="w-12 h-10 border border-gray-300 rounded-lg cursor-pointer bg-white p-1"
                />
                <input
                  type="text"
                  value={preview.bgColor}
                  onChange={(e) => setPreview(p => ({ ...p, bgColor: e.target.value }))}
                  dir="ltr"
                  className="flex-1 border border-gray-300 rounded-lg p-2.5 text-sm font-mono focus:outline-none focus:border-emerald bg-white"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">لون النص</label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  name="textColor"
                  defaultValue={initial.textColor}
                  onChange={(e) => setPreview(p => ({ ...p, textColor: e.target.value }))}
                  className="w-12 h-10 border border-gray-300 rounded-lg cursor-pointer bg-white p-1"
                />
                <input
                  type="text"
                  value={preview.textColor}
                  onChange={(e) => setPreview(p => ({ ...p, textColor: e.target.value }))}
                  dir="ltr"
                  className="flex-1 border border-gray-300 rounded-lg p-2.5 text-sm font-mono focus:outline-none focus:border-emerald bg-white"
                />
              </div>
            </div>
          </div>

          <label className="flex items-center gap-3 cursor-pointer pt-2 border-t border-gray-100">
            <input type="checkbox" name="isActive" defaultChecked={initial.isActive} className="w-4 h-4 rounded accent-emerald" />
            <span className="text-sm font-medium text-gray-700">تفعيل الشريط (يظهر على الموقع)</span>
          </label>
        </div>

        {/* Color Presets */}
        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
          <p className="text-xs font-bold text-gray-500 mb-3">ألوان جاهزة</p>
          <div className="flex flex-wrap gap-2">
            {[
              { bg: '#1a544a', text: '#ffffff', label: 'لون العلامة' },
              { bg: '#c9a756', text: '#1a1a1a', label: 'ذهبي' },
              { bg: '#0f302a', text: '#ffffff', label: 'أخضر داكن' },
              { bg: '#dc2626', text: '#ffffff', label: 'أحمر' },
              { bg: '#1e40af', text: '#ffffff', label: 'أزرق' },
              { bg: '#000000', text: '#ffffff', label: 'أسود' },
            ].map((preset) => (
              <button
                key={preset.bg}
                type="button"
                onClick={() => setPreview(p => ({ ...p, bgColor: preset.bg, textColor: preset.text }))}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border border-gray-200 hover:border-gray-400 transition-colors"
                style={{ backgroundColor: preset.bg, color: preset.text }}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={handleToggle}
            disabled={isPending}
            className={`px-5 py-2.5 border rounded-lg text-sm font-bold transition-colors disabled:opacity-60 ${initial.isActive ? 'border-red-300 text-red-600 hover:bg-red-50' : 'border-emerald text-brand hover:bg-emerald/5'}`}
          >
            {initial.isActive ? 'تعطيل الشريط' : 'تفعيل الشريط'}
          </button>
          <button
            type="submit"
            disabled={isPending}
            className="px-5 py-2.5 bg-emerald text-white text-sm font-bold rounded-lg hover:bg-deep-green transition-colors disabled:opacity-60"
          >
            {isPending ? 'جارٍ الحفظ...' : 'حفظ الإعدادات'}
          </button>
        </div>
      </form>
    </div>
  )
}
