'use client'

import { useState } from 'react'
import { Save, Info, Star } from 'lucide-react'
import { updateLoyaltySettings } from './actions'
import toast from 'react-hot-toast'

type LoyaltySettingsProps = {
  settings: {
    isEnabled: boolean
    pointsPerUnit: number
    minimumOrderAmount: number
    redeemEnabled: boolean
    pointsValue: number
    welcomeBonus: number
    expiryEnabled: boolean
    pointsExpiryDays: number | null
  }
}

export default function LoyaltySettingsClient({ settings }: LoyaltySettingsProps) {
  const [isEnabled, setIsEnabled] = useState(settings.isEnabled)
  const [redeemEnabled, setRedeemEnabled] = useState(settings.redeemEnabled)
  const [expiryEnabled, setExpiryEnabled] = useState(settings.expiryEnabled)
  
  // States to calculate sample math visually for the user
  const [pointsPerUnit, setPointsPerUnit] = useState(settings.pointsPerUnit || 100)
  const [pointsValue, setPointsValue] = useState(settings.pointsValue || 1)
  const [exampleOrderValue, setExampleOrderValue] = useState(1000)

  const { toast } = (window as any).toast || { toast: { success: () => {}, error: () => {} } }

  async function handleSubmit(formData: FormData) {
    const res = await updateLoyaltySettings(formData)
    if (res.success) {
      toast.success('تم حفظ إعدادات الولاء بنجاح', { position: 'bottom-left' })
    } else {
      toast.error(res.error || 'حدث خطأ', { position: 'bottom-left' })
    }
  }

  const examplePoints = Math.floor(exampleOrderValue / (pointsPerUnit || 1))
  const exampleRedeemValue = examplePoints * (pointsValue || 1)

  return (
    <form action={handleSubmit} className="space-y-6" dir="rtl">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-foreground mb-1 flex items-center gap-2">
            <Star className="text-brand" />
            إعدادات نقاط الولاء
          </h1>
          <p className="text-sm text-foreground/60">
            تحكم في كيفية اكتساب العملاء للنقاط وكيفية استبدالها برصيد حقيقي في متجرك.
          </p>
        </div>
        <button 
          type="submit"
          className="bg-brand text-surface px-6 py-2 rounded-lg font-bold hover:bg-brand/90 transition-colors flex items-center gap-2"
        >
          <Save size={18} />
          حفظ التغييرات
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Left Col (Main Settings) */}
        <div className="md:col-span-2 space-y-6">
          
          <div className="bg-white p-6 rounded-xl border border-black/5 shadow-sm space-y-6">
            <h2 className="text-lg font-bold text-foreground mb-4 border-b pb-2">الإعدادات العامة</h2>
            
            <div className="flex items-center justify-between bg-surface/50 p-4 rounded-lg border border-black/5">
              <div>
                <h3 className="font-bold text-foreground">تفعيل نظام نقاط الولاء</h3>
                <p className="text-xs text-foreground/60 mt-1">عند التفعيل، سيبدأ العملاء باكتساب النقاط عند الشراء.</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  name="isEnabled" 
                  className="sr-only peer"
                  checked={isEnabled}
                  onChange={(e) => setIsEnabled(e.target.checked)}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand"></div>
              </label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-sm font-bold text-foreground mb-1">
                  كم ريال يدفع العميل ليحصل على نقطة واحدة؟
                </label>
                <div className="relative">
                  <input
                    type="number"
                    name="pointsPerUnit"
                    required
                    min="1"
                    step="0.01"
                    value={pointsPerUnit}
                    onChange={(e) => setPointsPerUnit(Number(e.target.value))}
                    className="w-full bg-surface border border-black/10 rounded-lg px-4 py-2.5 text-foreground focus:outline-none focus:border-brand"
                    dir="ltr"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-foreground/50 text-sm">ريال سعودي</span>
                </div>
                <p className="text-xs text-foreground/50 mt-1">مثال: 100 ريال = 1 نقطة</p>
              </div>

              <div>
                <label className="block text-sm font-bold text-foreground mb-1">
                  الحد الأدنى لقيمة الطلب للحصول على نقاط
                </label>
                <div className="relative">
                  <input
                    type="number"
                    name="minimumOrderAmount"
                    defaultValue={settings.minimumOrderAmount}
                    min="0"
                    step="0.01"
                    className="w-full bg-surface border border-black/10 rounded-lg px-4 py-2.5 text-foreground focus:outline-none focus:border-brand"
                    dir="ltr"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-foreground/50 text-sm">ريال سعودي</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl border border-black/5 shadow-sm space-y-6">
            <h2 className="text-lg font-bold text-foreground mb-4 border-b pb-2">الاستبدال والخصم (Redeem)</h2>
            
            <div className="flex items-center justify-between bg-surface/50 p-4 rounded-lg border border-black/5">
              <div>
                <h3 className="font-bold text-foreground">السماح باستبدال النقاط</h3>
                <p className="text-xs text-foreground/60 mt-1">إذا تم تفعيله، يمكن للعميل استخدام نقاطه لدفع قيمة المشتريات جزئياً أو كلياً.</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  name="redeemEnabled" 
                  className="sr-only peer"
                  checked={redeemEnabled}
                  onChange={(e) => setRedeemEnabled(e.target.checked)}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand"></div>
              </label>
            </div>

            {redeemEnabled && (
              <div className="pt-2">
                <label className="block text-sm font-bold text-foreground mb-1">
                  كم تساوي النقطة الواحدة بالريال؟
                </label>
                <div className="relative w-full md:w-1/2">
                  <input
                    type="number"
                    name="pointsValue"
                    required
                    min="0.01"
                    step="0.01"
                    value={pointsValue}
                    onChange={(e) => setPointsValue(Number(e.target.value))}
                    className="w-full bg-surface border border-black/10 rounded-lg px-4 py-2.5 text-foreground focus:outline-none focus:border-brand"
                    dir="ltr"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-foreground/50 text-sm">ريال سعودي</span>
                </div>
                <p className="text-xs text-foreground/50 mt-1">مثال: النقطة الواحدة = 5 ريالات.</p>
              </div>
            )}
          </div>
          
        </div>

        {/* Right Col (Calculator & Bonus) */}
        <div className="space-y-6">
          
          <div className="bg-brand/5 p-6 rounded-xl border border-brand/20 shadow-sm">
            <h2 className="text-base font-bold text-brand mb-4 flex items-center gap-2">
              <Info size={18} />
              حاسبة النقاط التوضيحية
            </h2>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-foreground/60 mb-1 block">إذا اشترى العميل بقيمة:</label>
                <input 
                  type="number"
                  value={exampleOrderValue}
                  onChange={(e) => setExampleOrderValue(Number(e.target.value))}
                  className="w-full bg-white border border-black/10 rounded-lg px-3 py-1.5 text-sm font-bold"
                />
              </div>
              
              <div className="bg-white p-3 rounded-lg border border-black/5 text-sm">
                <div className="flex justify-between mb-2">
                  <span className="text-foreground/70">سيحصل على:</span>
                  <span className="font-bold text-brand">{examplePoints} نقطة</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-black/5">
                  <span className="text-foreground/70">تساوي عند الاستبدال:</span>
                  <span className="font-bold text-brand">{exampleRedeemValue.toFixed(2)} ريال</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl border border-black/5 shadow-sm space-y-4">
            <h2 className="text-base font-bold text-foreground border-b pb-2">مكافأة التسجيل (Welcome Bonus)</h2>
            <div>
              <label className="block text-sm font-bold text-foreground mb-1">نقاط ترحيبية للمستخدم الجديد</label>
              <input
                type="number"
                name="welcomeBonus"
                defaultValue={settings.welcomeBonus}
                min="0"
                className="w-full bg-surface border border-black/10 rounded-lg px-4 py-2 text-foreground focus:outline-none focus:border-brand"
                dir="ltr"
              />
              <p className="text-[11px] text-foreground/50 mt-1">ضع 0 لتعطيل هذه الميزة.</p>
            </div>
          </div>

        </div>
      </div>
    </form>
  )
}
