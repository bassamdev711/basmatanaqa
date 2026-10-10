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
    maxPointsPerOrder: number | null
  }
}

export default function LoyaltySettingsClient({ settings }: LoyaltySettingsProps) {
  const { toast } = (window as any).toast || { toast: { success: () => {}, error: () => {} } }

  const [isEnabled, setIsEnabled] = useState(settings.isEnabled)
  const [redeemEnabled, setRedeemEnabled] = useState(settings.redeemEnabled)
  
  // To allow users to specify "Amount gives Points", e.g. 1000 Riyals gives 100 points
  const [earnAmount, setEarnAmount] = useState(1000)
  // pointsPerUnit is how much Riyal for 1 point.
  const [earnPoints, setEarnPoints] = useState(1000 / (settings.pointsPerUnit || 10))

  // To allow users to specify "Points gives Amount", e.g. 100 points gives 50 Riyals
  const [redeemPoints, setRedeemPoints] = useState(100)
  // pointsValue is how much Riyal for 1 point.
  const [redeemAmount, setRedeemAmount] = useState(100 * (settings.pointsValue || 0.5))

  const [maxPointsPerOrder, setMaxPointsPerOrder] = useState(settings.maxPointsPerOrder)

  async function handleSubmit(formData: FormData) {
    // Calculate DB values
    const pointsPerUnit = earnAmount / (earnPoints || 1)
    const pointsValue = redeemAmount / (redeemPoints || 1)

    formData.set('isEnabled', isEnabled ? 'on' : 'off')
    formData.set('redeemEnabled', redeemEnabled ? 'on' : 'off')
    formData.set('pointsPerUnit', pointsPerUnit.toString())
    formData.set('pointsValue', pointsValue.toString())
    formData.set('expiryEnabled', 'off')
    formData.set('pointsExpiryDays', '365')
    formData.set('minimumOrderAmount', '0')
    if (maxPointsPerOrder) {
      formData.set('maxPointsPerOrder', maxPointsPerOrder.toString())
    } else {
      formData.set('maxPointsPerOrder', '0')
    }

    const res = await updateLoyaltySettings(formData)
    if (res.success) {
      toast.success('تم حفظ إعدادات الولاء بنجاح', { position: 'bottom-left' })
    } else {
      toast.error(res.error || 'حدث خطأ', { position: 'bottom-left' })
    }
  }

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
            التحكم الكامل في سياسة المكافآت واستبدال النقاط.
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
          
          {/* System Toggles */}
          <div className="bg-white p-6 rounded-xl border border-black/5 shadow-sm space-y-6">
            <h2 className="text-lg font-bold text-foreground mb-4 border-b pb-2">التفعيل والإيقاف</h2>
            
            <label className="flex items-center gap-4 cursor-pointer">
              <div className="relative">
                <input type="checkbox" checked={isEnabled} onChange={(e) => setIsEnabled(e.target.checked)} className="sr-only peer" />
                <div className="w-11 h-6 bg-black/20 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-[-100%] after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand"></div>
              </div>
              <div>
                <div className="font-bold text-foreground">تفعيل نظام الولاء (اكتساب النقاط)</div>
                <div className="text-sm text-foreground/60">يسمح للعملاء بجمع النقاط عند إتمام الشراء.</div>
              </div>
            </label>

            <label className="flex items-center gap-4 cursor-pointer">
              <div className="relative">
                <input type="checkbox" checked={redeemEnabled} onChange={(e) => setRedeemEnabled(e.target.checked)} className="sr-only peer" />
                <div className="w-11 h-6 bg-black/20 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-[-100%] after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand"></div>
              </div>
              <div>
                <div className="font-bold text-foreground">تفعيل استبدال النقاط</div>
                <div className="text-sm text-foreground/60">يسمح للعملاء باستخدام النقاط كخصم مالي في طلباتهم.</div>
              </div>
            </label>
          </div>

          {/* Rates */}
          <div className="bg-white p-6 rounded-xl border border-black/5 shadow-sm space-y-6">
            <h2 className="text-lg font-bold text-foreground mb-4 border-b pb-2">سياسة الاكتساب والاستبدال</h2>
            
            <div className={`space-y-4 transition-opacity ${!isEnabled ? 'opacity-50 pointer-events-none' : ''}`}>
              <h3 className="font-bold text-brand">معدل اكتساب النقاط</h3>
              <div className="flex flex-wrap items-center gap-3 bg-brand/5 p-4 rounded-lg border border-brand/20">
                <span className="font-bold text-foreground text-sm md:text-base">كل</span>
                <input 
                  type="number" 
                  min="1" 
                  value={earnAmount} 
                  onChange={(e) => setEarnAmount(Number(e.target.value))}
                  className="w-20 md:w-24 bg-white border border-black/10 rounded-md p-1.5 md:p-2 text-center focus:border-brand outline-none font-bold"
                />
                <span className="font-bold text-foreground text-sm md:text-base">ريال تدفعها العميلة، تكتسب</span>
                <input 
                  type="number" 
                  min="1" 
                  value={earnPoints} 
                  onChange={(e) => setEarnPoints(Number(e.target.value))}
                  className="w-20 md:w-24 bg-white border border-black/10 rounded-md p-1.5 md:p-2 text-center focus:border-brand outline-none font-bold text-brand"
                />
                <span className="font-bold text-foreground text-sm md:text-base">نقطة.</span>
              </div>
            </div>

            <div className={`space-y-4 transition-opacity ${!redeemEnabled ? 'opacity-50 pointer-events-none' : ''}`}>
              <h3 className="font-bold text-brand">قيمة استبدال النقاط</h3>
              <div className="flex flex-wrap items-center gap-3 bg-brand/5 p-4 rounded-lg border border-brand/20">
                <span className="font-bold text-foreground text-sm md:text-base">كل</span>
                <input 
                  type="number" 
                  min="1" 
                  value={redeemPoints} 
                  onChange={(e) => setRedeemPoints(Number(e.target.value))}
                  className="w-20 md:w-24 bg-white border border-black/10 rounded-md p-1.5 md:p-2 text-center focus:border-brand outline-none font-bold text-brand"
                />
                <span className="font-bold text-foreground text-sm md:text-base">نقطة، تعطي خصماً بقيمة</span>
                <input 
                  type="number" 
                  min="0.1" 
                  step="0.1"
                  value={redeemAmount} 
                  onChange={(e) => setRedeemAmount(Number(e.target.value))}
                  className="w-20 md:w-24 bg-white border border-black/10 rounded-md p-1.5 md:p-2 text-center focus:border-brand outline-none font-bold"
                />
                <span className="font-bold text-foreground text-sm md:text-base">ريال يمني.</span>
              </div>
            </div>

            <div className={`space-y-4 transition-opacity ${!redeemEnabled ? 'opacity-50 pointer-events-none' : ''}`}>
              <h3 className="font-bold text-brand">الحد الأقصى لاستخدام النقاط في الطلب الواحد</h3>
              <div className="bg-brand/5 p-4 rounded-lg border border-brand/20">
                <div className="flex items-center gap-3">
                  <input 
                    type="number" 
                    min="0" 
                    value={maxPointsPerOrder || ''} 
                    onChange={(e) => setMaxPointsPerOrder(Number(e.target.value) || null)}
                    placeholder="بدون حد أقصى"
                    className="w-32 bg-white border border-black/10 rounded-md p-1.5 md:p-2 text-center focus:border-brand outline-none font-bold"
                  />
                  <span className="font-bold text-foreground text-sm md:text-base">نقطة كحد أقصى.</span>
                </div>
                <p className="text-xs text-foreground/60 mt-2">اترك الحقل فارغاً أو ضع 0 للسماح باستخدام أي عدد من النقاط.</p>
              </div>
            </div>
          </div>
          
        </div>

        {/* Right Col (Bonus) */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-xl border border-black/5 shadow-sm space-y-4">
            <h2 className="text-base font-bold text-foreground border-b pb-2">مكافأة التسجيل</h2>
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
