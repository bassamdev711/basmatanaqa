'use client'

import React, { useState } from 'react'
import { Save, Layout, Type, BarChart, Image as ImageIcon } from 'lucide-react'
import { updateHomepageSettings } from '@/app/actions/homepage'
import { useToast } from '@/components/ToastProvider'

type HomepageSettings = {
  id: string
  heroTitle: string
  heroSubtitle: string
  heroDescription: string
  heroPrimaryButton: string
  heroSecondaryButton: string
  aboutTopTitle: string
  aboutMainTitle: string
  aboutQuote: string
  aboutDescription: string
  expTopTitle: string
  expMainTitle: string
  expBox1Title: string
  expBox1Desc: string
  expBox2Title: string
  expBox2Desc: string
  statsJson: string
  updatedAt: Date
}

type EditableHomepageField = Exclude<keyof HomepageSettings, 'id' | 'updatedAt'>
type HomepageTab = 'HERO' | 'ABOUT' | 'EXP' | 'STATS'

export default function HomepageContentClient({ initialData }: { initialData: HomepageSettings | null }) {
  const [formData, setFormData] = useState<HomepageSettings>(initialData ?? {} as HomepageSettings)
  const [stats, setStats] = useState<{value: string, label: string}[]>(
    initialData?.statsJson ? JSON.parse(initialData.statsJson) : []
  )
  const [isSaving, setIsSaving] = useState(false)
  const [activeTab, setActiveTab] = useState<'HERO' | 'ABOUT' | 'EXP' | 'STATS'>('HERO')
  const { showToast } = useToast()

  const handleInputChange = (field: EditableHomepageField, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleStatChange = (index: number, field: 'value' | 'label', val: string) => {
    const newStats = [...stats]
    newStats[index] = { ...newStats[index], [field]: val }
    setStats(newStats)
  }

  const handleSave = async () => {
    setIsSaving(true)
    const finalData = {
      ...formData,
      statsJson: JSON.stringify(stats)
    }

    const res = await updateHomepageSettings(finalData)
    
    if (res.success) {
      showToast('success', 'تم حفظ التعديلات بنجاح. ستظهر فوراً في المتجر.')
    } else {
      showToast('error', res.error || 'حدث خطأ أثناء الحفظ')
    }
    
    setIsSaving(false)
  }

  return (
    <div className="max-w-5xl">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-black text-deep-green mb-2 flex items-center gap-3">
            <Layout className="w-8 h-8 text-brand" />
            محتوى الصفحة الرئيسية
          </h1>
          <p className="text-deep-green/60 font-bold">التحكم الكامل بجميع النصوص الثابتة في الصفحة الرئيسية لمتجرك.</p>
        </div>
        
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="bg-deep-green text-ivory px-6 py-3 rounded-lg font-bold hover:bg-emerald transition-colors flex items-center gap-2 disabled:opacity-50"
        >
          <Save size={20} />
          {isSaving ? 'جاري الحفظ...' : 'حفظ التعديلات'}
        </button>
      </div>

      <div className="flex gap-2 mb-6 border-b border-black/10 pb-4 overflow-x-auto">
        {[
          { id: 'HERO', label: 'قسم الاستقبال (Hero)', icon: Type },
          { id: 'ABOUT', label: 'قسم من نحن (About)', icon: ImageIcon },
          { id: 'EXP', label: 'قسم خبرتنا (Experience)', icon: Layout },
          { id: 'STATS', label: 'قسم الإحصائيات (Stats)', icon: BarChart },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as HomepageTab)}
            className={`px-4 py-2 rounded-lg font-bold text-sm whitespace-nowrap transition-colors flex items-center gap-2 ${activeTab === tab.id ? 'bg-emerald text-white shadow-md' : 'bg-white text-deep-green/60 hover:bg-black/5'}`}
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-black/5 p-6 md:p-8">
        
        {activeTab === 'HERO' && (
          <div className="space-y-6">
            <h2 className="text-xl font-black text-deep-green mb-6 border-b pb-2">شاشة الاستقبال الرئيسية</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block font-bold text-deep-green mb-2">العنوان الرئيسي المكتوب بخط عريض</label>
                <input 
                  type="text" 
                  value={formData.heroTitle || ''} 
                  onChange={(e) => handleInputChange('heroTitle', e.target.value)}
                  className="w-full bg-[#f8f9fa] border border-black/10 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald/20"
                />
                <p className="text-xs text-black/40 mt-1">يُستخدم اسم المتجر من إعدادات الهوية عند ترك الحقل فارغًا.</p>
              </div>
              <div>
                <label className="block font-bold text-deep-green mb-2">العنوان الفرعي أسفل العنوان الرئيسي</label>
                <input 
                  type="text" 
                  value={formData.heroSubtitle || ''} 
                  onChange={(e) => handleInputChange('heroSubtitle', e.target.value)}
                  className="w-full bg-[#f8f9fa] border border-black/10 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald/20"
                />
                <p className="text-xs text-black/40 mt-1">الافتراضي: &quot;حضورٌ لا يُنسى.&quot;</p>
              </div>
            </div>
            
            <div>
              <label className="block font-bold text-deep-green mb-2">النص الوصفي</label>
              <textarea 
                value={formData.heroDescription || ''} 
                onChange={(e) => handleInputChange('heroDescription', e.target.value)}
                rows={3}
                className="w-full bg-[#f8f9fa] border border-black/10 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald/20 resize-none"
              ></textarea>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
              <div>
                <label className="block font-bold text-deep-green mb-2">نص الزر الأساسي (الذهاب للمنتجات)</label>
                <input 
                  type="text" 
                  value={formData.heroPrimaryButton || ''} 
                  onChange={(e) => handleInputChange('heroPrimaryButton', e.target.value)}
                  className="w-full bg-[#f8f9fa] border border-black/10 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald/20"
                />
              </div>
              <div>
                <label className="block font-bold text-deep-green mb-2">نص الزر الثانوي (القصة أو نبذة المتجر)</label>
                <input 
                  type="text" 
                  value={formData.heroSecondaryButton || ''} 
                  onChange={(e) => handleInputChange('heroSecondaryButton', e.target.value)}
                  className="w-full bg-[#f8f9fa] border border-black/10 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald/20"
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'ABOUT' && (
          <div className="space-y-6">
            <h2 className="text-xl font-black text-deep-green mb-6 border-b pb-2">قسم من نحن والفلسفة</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block font-bold text-deep-green mb-2">العنوان الصغير العلوي</label>
                <input 
                  type="text" 
                  value={formData.aboutTopTitle || ''} 
                  onChange={(e) => handleInputChange('aboutTopTitle', e.target.value)}
                  className="w-full bg-[#f8f9fa] border border-black/10 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald/20"
                />
              </div>
              <div>
                <label className="block font-bold text-deep-green mb-2">العنوان الرئيسي</label>
                <input 
                  type="text" 
                  value={formData.aboutMainTitle || ''} 
                  onChange={(e) => handleInputChange('aboutMainTitle', e.target.value)}
                  className="w-full bg-[#f8f9fa] border border-black/10 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald/20"
                />
              </div>
            </div>
            
            <div>
              <label className="block font-bold text-deep-green mb-2">الاقتباس (الخط الكبير)</label>
              <textarea 
                value={formData.aboutQuote || ''} 
                onChange={(e) => handleInputChange('aboutQuote', e.target.value)}
                rows={2}
                className="w-full bg-[#f8f9fa] border border-black/10 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald/20 resize-none"
              ></textarea>
            </div>

            <div>
              <label className="block font-bold text-deep-green mb-2">الوصف التفصيلي</label>
              <textarea 
                value={formData.aboutDescription || ''} 
                onChange={(e) => handleInputChange('aboutDescription', e.target.value)}
                rows={3}
                className="w-full bg-[#f8f9fa] border border-black/10 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald/20 resize-none"
              ></textarea>
            </div>
          </div>
        )}

        {activeTab === 'EXP' && (
          <div className="space-y-6">
            <h2 className="text-xl font-black text-deep-green mb-6 border-b pb-2">قسم تجربة المتجر</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block font-bold text-deep-green mb-2">العنوان الصغير العلوي (إنجليزي/عربي)</label>
                <input 
                  type="text" 
                  value={formData.expTopTitle || ''} 
                  onChange={(e) => handleInputChange('expTopTitle', e.target.value)}
                  className="w-full bg-[#f8f9fa] border border-black/10 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald/20"
                />
              </div>
              <div>
                <label className="block font-bold text-deep-green mb-2">العنوان الرئيسي</label>
                <input 
                  type="text" 
                  value={formData.expMainTitle || ''} 
                  onChange={(e) => handleInputChange('expMainTitle', e.target.value)}
                  className="w-full bg-[#f8f9fa] border border-black/10 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald/20"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
              <div className="bg-[#F9F7F2] p-4 rounded-lg border border-gold/20">
                <h4 className="font-bold text-brand mb-4">المربع الأول</h4>
                <div className="space-y-4">
                  <div>
                    <label className="block font-bold text-deep-green mb-1 text-sm">العنوان</label>
                    <input 
                      type="text" 
                      value={formData.expBox1Title || ''} 
                      onChange={(e) => handleInputChange('expBox1Title', e.target.value)}
                      className="w-full bg-white border border-black/10 rounded px-3 py-2 text-sm focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-deep-green mb-1 text-sm">الوصف</label>
                    <textarea 
                      value={formData.expBox1Desc || ''} 
                      onChange={(e) => handleInputChange('expBox1Desc', e.target.value)}
                      rows={4}
                      className="w-full bg-white border border-black/10 rounded px-3 py-2 text-sm focus:outline-none resize-none"
                    ></textarea>
                  </div>
                </div>
              </div>

              <div className="bg-[#F9F7F2] p-4 rounded-lg border border-gold/20">
                <h4 className="font-bold text-brand mb-4">المربع الثاني</h4>
                <div className="space-y-4">
                  <div>
                    <label className="block font-bold text-deep-green mb-1 text-sm">العنوان</label>
                    <input 
                      type="text" 
                      value={formData.expBox2Title || ''} 
                      onChange={(e) => handleInputChange('expBox2Title', e.target.value)}
                      className="w-full bg-white border border-black/10 rounded px-3 py-2 text-sm focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-deep-green mb-1 text-sm">الوصف</label>
                    <textarea 
                      value={formData.expBox2Desc || ''} 
                      onChange={(e) => handleInputChange('expBox2Desc', e.target.value)}
                      rows={4}
                      className="w-full bg-white border border-black/10 rounded px-3 py-2 text-sm focus:outline-none resize-none"
                    ></textarea>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'STATS' && (
          <div className="space-y-6">
            <h2 className="text-xl font-black text-deep-green mb-6 border-b pb-2">قسم الإحصائيات (الأرقام)</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {stats.map((stat, index) => (
                <div key={index} className="bg-[#f8f9fa] p-4 rounded-lg border border-black/10">
                  <h4 className="font-bold text-brand mb-4 text-center">الإحصائية {index + 1}</h4>
                  <div className="space-y-4">
                    <div>
                      <label className="block font-bold text-deep-green mb-1 text-sm text-center">الرقم (Value)</label>
                      <input 
                        type="text" 
                        value={stat.value} 
                        onChange={(e) => handleStatChange(index, 'value', e.target.value)}
                        className="w-full bg-white border border-black/10 rounded px-3 py-2 text-center text-xl font-black text-gold focus:outline-none"
                        dir="ltr"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-deep-green mb-1 text-sm text-center">النص (Label)</label>
                      <input 
                        type="text" 
                        value={stat.label} 
                        onChange={(e) => handleStatChange(index, 'label', e.target.value)}
                        className="w-full bg-white border border-black/10 rounded px-3 py-2 text-center text-sm font-bold focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-sm text-black/50 text-center mt-4">قم بتغيير الأرقام والنصوص المرفقة لتتحدث عن إنجازات المتجر.</p>
          </div>
        )}

      </div>
    </div>
  )
}
