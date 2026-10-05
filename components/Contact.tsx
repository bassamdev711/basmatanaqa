import prisma from '@/lib/prisma'
import ContactClient from './ContactClient'

export default async function Contact() {
  let settings: Awaited<ReturnType<typeof prisma.contactSettings.findUnique>> = null
  try {
    settings = await prisma.contactSettings.findUnique({
      where: { id: 'singleton' },
    })
  } catch {
    // Render contact fallbacks when the database is unavailable during build or runtime.
  }

  return <ContactClient contactData={settings} />
}
