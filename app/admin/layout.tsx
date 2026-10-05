import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { jwtVerify } from 'jose'
import AdminSidebar from './components/AdminSidebar'
import SetupRedirect from './components/SetupRedirect'
import prisma from '@/lib/prisma'
import { getStoreConfig } from '@/lib/store-config'

async function requireAdmin() {
  const cookieStore = await cookies()
  const token = cookieStore.get('admin_token')?.value

  if (!token) {
    redirect('/login')
  }

  const JWT_SECRET = process.env.JWT_SECRET
  if (!JWT_SECRET) {
    redirect('/login')
  }

  try {
    const secret = new TextEncoder().encode(JWT_SECRET)
    await jwtVerify(token, secret)
  } catch {
    redirect('/login')
  }
}

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  await requireAdmin()

  const [profile, store] = await Promise.all([
    prisma.adminProfile.upsert({
    where: { id: 'singleton' },
    update: {},
    create: {
      id: 'singleton',
      isSetupComplete: false
    }
    }),
    getStoreConfig(),
  ])

  return (
    <AdminSidebar profile={profile} store={store}>
      <SetupRedirect isSetupComplete={profile.isSetupComplete} />
      <div className="max-w-6xl mx-auto md:px-10 mt-8">
        <div className="px-4 md:px-0">
          {children}
        </div>
      </div>
    </AdminSidebar>
  )
}
