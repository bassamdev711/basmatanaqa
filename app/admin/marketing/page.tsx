import Link from 'next/link'
import prisma from '@/lib/prisma'
import { Tag, Megaphone, Bell, Plus, TrendingUp, BarChart3, Mail } from 'lucide-react'

export const metadata = { title: 'التسويق | لوحة التحكم' }

export default async function MarketingPage() {
  // إحصائيات سريعة
  let couponsCount = 0
  let activeCoupons = 0
  let campaignsCount = 0
  let activeCampaigns = 0
  let announcementActive = false
  let newsletterCount = 0

  try {
    ;[couponsCount, activeCoupons, campaignsCount, activeCampaigns, newsletterCount] = await Promise.all([
      prisma.coupon.count(),
      prisma.coupon.count({ where: { isActive: true } }),
      prisma.campaign.count(),
      prisma.campaign.count({ where: { isActive: true, endDate: { gte: new Date() } } }),
      prisma.newsletterSubscriber.count(),
    ])
    const bar = await prisma.announcementBar.findUnique({ where: { id: 'singleton' } })
    announcementActive = bar?.isActive ?? false
  } catch {
    // DB offline — نعرض الصفحة بدون إحصائيات
  }

  const sections = [
    {
      href: '/admin/marketing/coupons',
      icon: Tag,
      title: 'كوبونات الخصم',
      description: 'أنشئ كوبونات بنسبة مئوية أو مبلغ ثابت وتحكم في صلاحيتها',
      stat: `${activeCoupons} / ${couponsCount}`,
      statLabel: 'كوبون نشط',
      color: 'from-emerald/10 to-emerald/5',
      iconColor: 'text-brand',
      badge: activeCoupons > 0 ? 'نشط' : null,
    },
    {
      href: '/admin/marketing/campaigns',
      icon: Megaphone,
      title: 'الحملات التسويقية',
      description: 'أطلق حملات ترويجية مع بانر وكوبون مرتبط وحدد مدتها الزمنية',
      stat: `${activeCampaigns} / ${campaignsCount}`,
      statLabel: 'حملة نشطة',
      color: 'from-gold/10 to-gold/5',
      iconColor: 'text-gold',
      badge: activeCampaigns > 0 ? 'نشط' : null,
    },
    {
      href: '/admin/marketing/announcement',
      icon: Bell,
      title: 'شريط الإعلانات',
      description: 'شريط ملوّن أعلى الموقع لعرض عروضك وأكوادك بنقرة واحدة',
      stat: announcementActive ? 'مفعَّل' : 'معطَّل',
      statLabel: 'الحالة',
      color: 'from-deep-green/10 to-deep-green/5',
      iconColor: 'text-deep-green',
      badge: announcementActive ? 'يعمل الآن' : null,
    },
    {
      href: '/admin/marketing/newsletter',
      icon: Mail,
      title: 'النشرة البريدية',
      description: 'إدارة وتصدير إيميلات المشتركين في القائمة البريدية',
      stat: `${newsletterCount}`,
      statLabel: 'مشترك',
      color: 'from-emerald/10 to-emerald/5',
      iconColor: 'text-brand',
      badge: null,
    },
  ]

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black text-gray-900">التسويق</h2>
          <p className="text-gray-500 text-sm mt-1">تحكم في الخصومات والحملات والإعلانات</p>
        </div>
        <div className="flex items-center gap-3">
          <TrendingUp className="w-8 h-8 text-brand" />
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'إجمالي الكوبونات', value: couponsCount, icon: Tag },
          { label: 'الحملات النشطة', value: activeCampaigns, icon: Megaphone },
          { label: 'شريط الإعلانات', value: announcementActive ? 'مفعَّل' : 'معطَّل', icon: Bell },
        ].map((s) => (
          <div key={s.label} className="bg-white border border-gray-200 rounded-lg p-5 flex items-center gap-4 shadow-sm">
            <div className="w-10 h-10 bg-emerald/10 rounded-lg flex items-center justify-center">
              <s.icon className="w-5 h-5 text-brand" />
            </div>
            <div>
              <p className="text-2xl font-black text-gray-900">{s.value}</p>
              <p className="text-xs text-gray-500">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Section Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {sections.map((sec) => (
          <div key={sec.href} className={`bg-gradient-to-br ${sec.color} border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow`}>
            <div className="flex items-start justify-between mb-4">
              <div className={`w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm`}>
                <sec.icon className={`w-6 h-6 ${sec.iconColor}`} />
              </div>
              {sec.badge && (
                <span className="bg-emerald text-white text-[10px] font-bold px-2 py-1 rounded-full">
                  {sec.badge}
                </span>
              )}
            </div>
            <h3 className="text-lg font-black text-gray-900 mb-2">{sec.title}</h3>
            <p className="text-gray-500 text-sm leading-relaxed mb-4">{sec.description}</p>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-black text-gray-900">{sec.stat}</p>
                <p className="text-xs text-gray-400">{sec.statLabel}</p>
              </div>
              <Link
                href={sec.href}
                className="flex items-center gap-2 bg-white text-deep-green text-sm font-bold px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors border border-gray-200"
              >
                <Plus className="w-4 h-4" />
                إدارة
              </Link>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Tips */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <BarChart3 className="w-5 h-5 text-brand" />
          <h3 className="font-bold text-gray-900">نصائح للتسويق الفعّال</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
          <div className="flex items-start gap-2">
            <span className="text-brand font-black mt-0.5">01</span>
            <p>استخدم كوبونات محدودة الوقت لخلق إلحاحية الشراء</p>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-gold font-black mt-0.5">02</span>
            <p>اربط كل حملة بكوبون خاص لتتبع فعاليتها</p>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-deep-green font-black mt-0.5">03</span>
            <p>شريط الإعلانات يُقرأ من كل زائر — ضع أهم عروضك فيه</p>
          </div>
        </div>
      </div>
    </div>
  )
}
