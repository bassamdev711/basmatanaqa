import prisma from '@/lib/prisma'
import AnnouncementBarClient from './AnnouncementBarClient'

export const metadata = { title: 'شريط الإعلانات | لوحة التحكم' }

type AnnouncementBar = {
  message: string
  linkText: string | null
  linkUrl: string | null
  bgColor: string
  textColor: string
  isActive: boolean
}

export default async function AnnouncementBarPage() {
  let bar: AnnouncementBar | null = null
  try {
    bar = await prisma.announcementBar.findUnique({ where: { id: 'singleton' } })
  } catch {
    // DB offline
  }

  const initial = {
    message: bar?.message ?? 'مرحباً بكم في متجرنا',
    linkText: bar?.linkText ?? '',
    linkUrl: bar?.linkUrl ?? '',
    bgColor: bar?.bgColor ?? '#1a544a',
    textColor: bar?.textColor ?? '#ffffff',
    isActive: bar?.isActive ?? false,
  }

  return <AnnouncementBarClient initial={initial} />
}
