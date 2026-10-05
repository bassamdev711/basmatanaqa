'use client'

import React from 'react'
import { LogOut } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { logout } from '@/app/login/actions'

export default function LogoutButton() {
  const router = useRouter()

  const handleLogout = async () => {
    await logout()
    router.push('/login')
  }

  return (
    <button 
      onClick={handleLogout}
      className="w-full flex items-center gap-2 text-xs font-medium text-red-300 hover:text-red-400 transition-colors mt-4"
    >
      <LogOut className="w-4 h-4" />
      تسجيل الخروج
    </button>
  )
}
