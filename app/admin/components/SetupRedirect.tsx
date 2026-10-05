'use client'

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'

export default function SetupRedirect({ isSetupComplete }: { isSetupComplete: boolean }) {
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (!isSetupComplete && pathname !== '/admin/setup') {
      router.push('/admin/setup')
    } else if (isSetupComplete && pathname === '/admin/setup') {
      router.push('/admin')
    }
  }, [isSetupComplete, pathname, router])

  return null
}
