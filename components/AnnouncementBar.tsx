import Link from 'next/link'
import prisma from '@/lib/prisma'

/**
 * شريط الإعلانات — Server Component
 * يُجلب من DB مرة واحدة ويُعرض أعلى الصفحة
 * لا يُرسَل إلى العميل إذا كان غير مفعَّل
 */
export default async function AnnouncementBar() {
  let bar: {
    message: string
    linkText: string | null
    linkUrl: string | null
    bgColor: string
    textColor: string
    isActive: boolean
  } | null = null

  try {
    bar = await prisma.announcementBar.findUnique({ where: { id: 'singleton' } })
  } catch {
    return null
  }

  if (!bar || !bar.isActive) return null

  return (
    <div
      id="announcement-bar"
      style={{ backgroundColor: bar.bgColor, color: bar.textColor }}
      className="sticky top-0 left-0 w-full py-2.5 overflow-hidden z-[60]"
    >
      <div className="flex whitespace-nowrap animate-marquee hover:[animation-play-state:paused]">
        <div className="flex items-center gap-3 px-4 min-w-full justify-center text-sm font-medium">
          <span>{bar.message}</span>
          {bar.linkText && bar.linkUrl && (
            <Link
              href={bar.linkUrl}
              className="underline font-black text-xs opacity-90 hover:opacity-100 transition-opacity"
            >
              {bar.linkText} ←
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}
