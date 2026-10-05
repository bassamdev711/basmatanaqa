import Image from 'next/image'
import Link from 'next/link'
import prisma from '@/lib/prisma'
import { Plus, Megaphone, Trash2, Calendar, Tag } from 'lucide-react'
import { deleteCampaign, toggleCampaign } from './actions'

export const metadata = { title: 'الحملات التسويقية | لوحة التحكم' }

type Campaign = {
  id: string
  title: string
  description: string | null
  imageUrl: string | null
  couponCode: string | null
  startDate: Date
  endDate: Date
  isActive: boolean
}

export default async function CampaignsPage() {
  let campaigns: Campaign[] = []
  try {
    campaigns = await prisma.campaign.findMany({ orderBy: { createdAt: 'desc' } })
  } catch {
    // DB offline
  }

  const now = new Date()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-gray-900">الحملات التسويقية</h2>
          <p className="text-gray-500 text-sm mt-1">{campaigns.length} حملة مسجَّلة</p>
        </div>
        <Link
          href="/admin/marketing/campaigns/new"
          className="flex items-center gap-2 bg-emerald text-white text-sm font-bold px-4 py-2 rounded-lg hover:bg-deep-green transition-colors"
        >
          <Plus className="w-4 h-4" />
          حملة جديدة
        </Link>
      </div>

      {/* Campaigns Grid */}
      {campaigns.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-xl p-16 text-center">
          <Megaphone className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 font-medium">لا توجد حملات بعد</p>
          <Link
            href="/admin/marketing/campaigns/new"
            className="inline-flex items-center gap-2 mt-4 text-brand font-bold text-sm hover:underline"
          >
            <Plus className="w-4 h-4" />
            أطلق أول حملة
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {campaigns.map((c) => {
            const isRunning = c.isActive && c.startDate <= now && c.endDate >= now
            const isEnded = c.endDate < now
            const isUpcoming = c.startDate > now

            let statusLabel = 'معطَّلة'
            let statusClass = 'bg-gray-100 text-gray-500'
            if (isRunning) { statusLabel = 'تعمل الآن'; statusClass = 'bg-green-100 text-green-700' }
            else if (isEnded) { statusLabel = 'انتهت'; statusClass = 'bg-red-100 text-red-600' }
            else if (isUpcoming && c.isActive) { statusLabel = 'قادمة'; statusClass = 'bg-blue-100 text-blue-700' }

            return (
              <div key={c.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                {/* Image */}
                {c.imageUrl && (
                  <div className="relative w-full h-32 overflow-hidden">
                    <Image src={c.imageUrl} alt={c.title} fill sizes="(max-width: 768px) 100vw, 50vw" className="object-cover" />
                  </div>
                )}
                <div className="p-5 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-black text-gray-900 text-lg">{c.title}</h3>
                    <span className={`text-[10px] font-bold px-2 py-1 rounded-full shrink-0 ${statusClass}`}>
                      {statusLabel}
                    </span>
                  </div>
                  {c.description && (
                    <p className="text-gray-500 text-sm">{c.description}</p>
                  )}
                  <div className="flex items-center gap-4 text-xs text-gray-400">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {new Date(c.startDate).toLocaleDateString('ar-SA')}
                    </span>
                    <span>←</span>
                    <span>{new Date(c.endDate).toLocaleDateString('ar-SA')}</span>
                  </div>
                  {c.couponCode && (
                    <div className="flex items-center gap-2 bg-gold/10 rounded-lg px-3 py-2">
                      <Tag className="w-3.5 h-3.5 text-gold" />
                      <span className="text-xs text-gray-600">كوبون الحملة:</span>
                      <span className="font-mono font-black text-deep-green text-sm">{c.couponCode}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-3 pt-2 border-t border-gray-100">
                    <Link href={`/admin/marketing/campaigns/${c.id}/edit`} className="text-xs text-brand font-bold hover:underline">
                      تعديل
                    </Link>
                    <form action={async () => {
                      'use server'
                      await toggleCampaign(c.id, !c.isActive)
                    }}>
                      <button type="submit" className="text-xs text-gray-500 font-bold hover:text-brand transition-colors">
                        {c.isActive ? 'تعطيل' : 'تفعيل'}
                      </button>
                    </form>
                    <form action={async () => {
                      'use server'
                      await deleteCampaign(c.id)
                    }} className="mr-auto">
                      <button type="submit" className="btn btn-ghost btn-icon text-gray-400 hover:text-red-500">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
