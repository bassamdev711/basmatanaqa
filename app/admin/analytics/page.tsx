'use client'

import { useEffect, useState, type ReactNode } from 'react'
import {
  Activity,
  AlertTriangle,
  BarChart,
  CheckCircle2,
  Database,
  Eye,
  Gauge,
  ImageIcon,
  Info,
  MessageCircle,
  Phone,
  Server,
  ShoppingBag,
  Users,
} from 'lucide-react'
import { getAnalyticsData } from './actions'

type ResourceKey = 'database' | 'blob' | 'bandwidth'
type ResourceData = {
  resource: ResourceKey
  usedBytes: number
  limitBytes: number
  source: string
  confidence: string
}
type AnalyticsData = {
  success: true
  visits: { today: number; todayViews: number; month: number; total: number }
  usage: {
    fallback?: boolean
    subscription: { planId: string; status: string; startedAt: Date | string; renewsAt: Date | string | null; graceUntil: Date | string | null; notes: string | null }
    plan: { id: string; name: string; slug: string; price: string; currencyCode: string }
    resources: ResourceData[]
    availablePlans: Array<{
      id: string
      name: string
      slug: string
      price: string
      currencyCode: string
      sortOrder: number
      isActive: boolean
      databaseLimitBytes: number
      blobLimitBytes: number
      bandwidthLimitBytes: number
    }>
  }
  contact: { phoneNumber: string | null; whatsappNumber: string | null }
}

const resourceMeta: Record<ResourceKey, { label: string; description: string; icon: ReactNode }> = {
  database: { label: 'قاعدة البيانات', description: 'حجم PostgreSQL المقاس فعليًا', icon: <Database size={22} /> },
  blob: { label: 'الصور والملفات', description: 'حجم Vercel Blob المسجل/المزامن', icon: <ImageIcon size={22} /> },
  bandwidth: { label: 'نقل البيانات', description: 'تقدير داخلي من مشاهدات الصفحات', icon: <Server size={22} /> },
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getAnalyticsData().then((result) => {
      if (result.success) {
        const analytics = result as AnalyticsData
        setData(analytics)
      }
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])


  if (loading) {
    return <div className="flex items-center justify-center min-h-[60vh]"><div className="w-8 h-8 border-4 border-brand border-t-transparent rounded-full animate-spin" /></div>
  }

  if (!data) return <div className="rounded-xl bg-red-50 text-red-700 p-5">فشل في جلب بيانات الاستخدام.</div>

  const unreadLimit = data.usage.resources.filter((resource) => getPercentage(resource) >= 70)
  const supportPhone = data.contact.phoneNumber || data.contact.whatsappNumber
  const currentPlan = data.usage.plan
  const currentSubscription = data.usage.subscription
  const isLegacyFallback = Boolean(data.usage.fallback)

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">الإحصائيات والاستهلاك</h1>
          <p className="text-gray-500 text-sm mt-1">متابعة أداء المتجر وحدود الخطة دون خلطها مع إحصائيات العملاء.</p>
        </div>
        <div className="rounded-full bg-brand/10 text-brand px-4 py-2 text-sm font-bold flex items-center gap-2 w-fit">
          <CheckCircle2 size={17} /> {data.usage.plan.name}
        </div>
      </header>

      {unreadLimit.length > 0 && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 flex items-start gap-3">
          <AlertTriangle className="text-amber-600 shrink-0 mt-0.5" size={21} />
          <div>
            <p className="font-bold text-amber-900">تحتاج بعض الموارد إلى متابعة</p>
            <p className="text-sm text-amber-800 mt-1">اقترب استهلاك {unreadLimit.map((resource) => resourceMeta[resource.resource].label).join('، ')} من الحصة. سيستمر المتجر بالعمل، وسيتم إيقاف الرفع الجديد فقط عند بلوغ حصة التخزين.</p>
          </div>
        </div>
      )}

      <section>
        <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2 mb-4"><Users className="w-5 h-5 text-brand" /> الزيارات والمشاهدات</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatCard title="زيارات اليوم" value={data.visits.today} icon={<Users />} color="blue" />
          <StatCard title="مشاهدات صفحات اليوم" value={data.visits.todayViews} icon={<Eye />} color="indigo" />
          <StatCard title="زيارات هذا الشهر" value={data.visits.month} icon={<BarChart />} color="emerald" />
          <StatCard title="إجمالي الزيارات" value={data.visits.total} icon={<Activity />} color="purple" />
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between gap-3 mb-4">
          <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2"><Gauge className="w-5 h-5 text-brand" /> حدود الخطة الحالية</h2>
          <span className="text-xs text-gray-500">تتجدد الخطة يدويًا من المالك</span>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {data.usage.resources.map((resource) => <ResourceCard key={resource.resource} resource={resource} />)}
        </div>
      </section>

      <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
        <div className="flex items-start gap-3">
          <Info className="text-brand shrink-0 mt-0.5" size={21} />
          <div>
            <h2 className="font-bold text-gray-900">كيف نقرأ الأرقام؟</h2>
            <p className="text-sm text-gray-600 mt-2 leading-7">قاعدة البيانات مقاسة من PostgreSQL، والملفات مقاسة من Vercel Blob عند توفر رمز التخزين أو من سجل الرفع المحلي. نقل البيانات تقديري حاليًا من مشاهدات الصفحات، لذلك لا يُعرض على أنه رقم رسمي من Vercel ولا يُستخدم وحده لإيقاف المتجر.</p>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
        <div className="flex items-start gap-3 mb-5">
          <ShoppingBag className="w-5 h-5 text-brand mt-0.5" />
          <div>
            <h2 className="text-lg font-semibold text-gray-800">خطتك الحالية</h2>
            <p className="text-sm text-gray-500 mt-1">تابع استهلاك متجرك واطلب الترقية عند الحاجة.</p>
          </div>
        </div>
        {isLegacyFallback && <div className="rounded-xl border border-blue-100 bg-blue-50 text-blue-800 p-4 text-sm leading-7 mb-5">يتم عرض القياسات الأساسية مؤقتًا. سيُحدّث النظام التفاصيل تلقائيًا عند تفعيل القياس التفصيلي، ولن يتوقف متجرك بسبب ذلك.</div>}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-xl bg-gray-50 p-4"><p className="text-xs text-gray-500">الخطة الحالية</p><p className="font-bold text-gray-900 mt-2">{currentPlan.name}</p></div>
          <div className="rounded-xl bg-gray-50 p-4"><p className="text-xs text-gray-500">حالة الخدمة</p><p className="font-bold text-gray-900 mt-2">{getSubscriptionStatusLabel(currentSubscription.status)}</p></div>
          {currentSubscription.renewsAt && <div className="rounded-xl bg-gray-50 p-4"><p className="text-xs text-gray-500">التجديد المتوقع</p><p className="font-bold text-gray-900 mt-2">{formatDate(currentSubscription.renewsAt)}</p></div>}
        </div>
        {currentSubscription.notes && !isLegacyFallback && <p className="text-sm text-gray-600 mt-5">{currentSubscription.notes}</p>}
        {supportPhone && <div className="mt-5 rounded-xl border border-brand/10 bg-brand/5 p-4"><p className="text-sm text-gray-700">لترقية الحصة أو تجديد الخطة، تواصل مع مالك المنصة مباشرة.</p><ContactButtons phone={supportPhone} /></div>}
      </section>

      <section>
        <div className="flex items-center gap-2 mb-4"><ShoppingBag className="w-5 h-5 text-brand" /><h2 className="text-lg font-semibold text-gray-800">الترقية والدعم</h2></div>
        {data.usage.availablePlans.length > 0 ? <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {data.usage.availablePlans.map((plan) => (
            <div key={plan.id} className={`rounded-2xl border p-6 ${plan.id === currentPlan.id ? 'border-brand bg-brand/5' : 'border-gray-100 bg-white'} shadow-sm`}>
              <div className="flex items-start justify-between gap-3"><div><h3 className="font-bold text-gray-900">{plan.name}</h3><p className="text-sm text-gray-500 mt-1">{plan.id === currentPlan.id ? 'خطتك الحالية' : 'متاحة للترقية'}</p></div>{plan.id === currentPlan.id && <CheckCircle2 className="text-brand" size={21} />}</div>
              <p className="text-2xl font-black text-gray-900 mt-5">{plan.price === '0' ? 'مجانية' : `${plan.price} ${plan.currencyCode}`}<span className="text-sm font-medium text-gray-500">{plan.price === '0' ? '' : ' / شهر'}</span></p>
              <p className="text-sm text-gray-600 mt-4">صور وملفات: <strong>{formatBytes(plan.blobLimitBytes)}</strong></p><p className="text-sm text-gray-600 mt-1">قاعدة البيانات: <strong>{formatBytes(plan.databaseLimitBytes)}</strong></p><p className="text-sm text-gray-600 mt-1">نقل البيانات: <strong>{formatBytes(plan.bandwidthLimitBytes)}</strong></p>
              {plan.id !== currentPlan.id && supportPhone && <ContactButtons phone={supportPhone} />}
            </div>
          ))}
        </div> : <div className="rounded-xl border border-gray-100 bg-gray-50 p-4 text-sm text-gray-600">لا توجد خطط إضافية معروضة حاليًا. إذا احتجت مساحة أكبر أو نقل بيانات إضافيًا، تواصل مع مالك المنصة.</div>}
        <div className="mt-5 rounded-xl bg-gray-50 border border-gray-100 p-4 text-sm text-gray-600">الترقية والتجديد يتمان بالتنسيق مع مالك المنصة. ستبقى واجهة المتجر وبياناتك متاحة، ويتم إيقاف الرفع الجديد فقط عند بلوغ حد التخزين حتى تتم معالجة الخطة.</div>
      </section>
    </div>
  )
}

function ResourceCard({ resource }: { resource: ResourceData }) {
  const meta = resourceMeta[resource.resource]
  const percentage = getPercentage(resource)
  const isEstimated = resource.confidence === 'estimated'
  const level = percentage >= 100 ? 'exceeded' : percentage >= 95 ? 'critical' : percentage >= 85 ? 'warning' : percentage >= 70 ? 'info' : 'normal'
  const barColor = level === 'exceeded' || level === 'critical' ? 'bg-red-500' : level === 'warning' ? 'bg-amber-400' : level === 'info' ? 'bg-yellow-300' : resource.resource === 'bandwidth' ? 'bg-blue-500' : 'bg-brand'

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3"><div className="p-3 rounded-xl bg-brand/5 text-brand">{meta.icon}</div><div><h3 className="font-bold text-gray-800">{meta.label}</h3><p className="text-xs text-gray-500 mt-1">{meta.description}</p></div></div>
        {(level === 'critical' || level === 'exceeded') && <AlertTriangle size={20} className="text-red-500 shrink-0" />}
      </div>
      <div className="flex justify-between items-end mt-6 mb-2"><span className="text-2xl font-black text-gray-900">{formatBytes(resource.usedBytes)}</span><span className="text-sm text-gray-500">من {formatBytes(resource.limitBytes)}</span></div>
      <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden"><div className={`h-3 rounded-full transition-all duration-700 ${barColor}`} style={{ width: `${Math.min(percentage, 100)}%` }} /></div>
      <div className="flex justify-between gap-3 mt-3 text-xs"><span className={`font-bold ${level === 'normal' ? 'text-gray-500' : level === 'info' ? 'text-yellow-700' : 'text-red-600'}`}>{percentage.toFixed(1)}% مستهلك</span><span className="text-gray-400">{isEstimated ? 'تقديري' : resource.confidence === 'tracked' ? 'من سجل الرفع' : 'مقاس'}</span></div>
    </div>
  )
}

function ContactButtons({ phone }: { phone: string }) {
  const digits = phone.replace(/[^\d]/g, '')
  return <div className="flex flex-wrap gap-2 mt-5"><a href={`tel:${phone}`} className="inline-flex items-center gap-2 rounded-lg bg-brand text-white px-3 py-2 text-sm font-bold"><Phone size={15} /> اتصال</a>{digits && <a href={`https://wa.me/${digits}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 text-white px-3 py-2 text-sm font-bold"><MessageCircle size={15} /> واتساب</a>}</div>
}

function getPercentage(resource: ResourceData) {
  if (resource.limitBytes <= 0) return 0
  return (resource.usedBytes / resource.limitBytes) * 100
}

function getSubscriptionStatusLabel(status: string) {
  if (status === 'GRACE') return 'فترة سماح'
  if (status === 'SUSPENDED') return 'الرفع موقوف مؤقتًا'
  if (status === 'CANCELLED') return 'منتهية'
  return 'فعالة'
}

function formatDate(value: Date | string | null) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return new Intl.DateTimeFormat('ar', { dateStyle: 'medium', timeStyle: 'short' }).format(date)
}

function formatBytes(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.max(0, Math.round(bytes / 1024))} KB`
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`
}

function StatCard({ title, value, icon, color }: { title: string; value: number; icon: ReactNode; color: string }) {
  const colorMap: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-600 border-blue-100',
    indigo: 'bg-indigo-50 text-indigo-600 border-indigo-100',
    emerald: 'bg-brand/5 text-brand border-emerald-100',
    purple: 'bg-purple-50 text-purple-600 border-purple-100',
  }
  return <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow"><div className={`p-3 rounded-lg border ${colorMap[color] || colorMap.blue}`}>{icon}</div><div><p className="text-sm text-gray-500 font-medium">{title}</p><p className="text-2xl font-bold text-gray-900 mt-0.5">{value}</p></div></div>
}
