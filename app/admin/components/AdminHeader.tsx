import React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import prisma from '@/lib/prisma'
import SetupRedirect from './SetupRedirect'
import { Settings } from 'lucide-react'

export default async function AdminHeader() {
  const profile = await prisma.adminProfile.upsert({
    where: { id: 'singleton' },
    update: {},
    create: {
      id: 'singleton',
      isSetupComplete: false
    }
  })

  const bgStyle = profile.themeBackground 
    ? (profile.themeBackground.startsWith('http') || profile.themeBackground.startsWith('/'))
      ? { backgroundImage: `url(${profile.themeBackground})`, backgroundSize: 'cover', backgroundPosition: 'center' }
      : { backgroundColor: profile.themeBackground }
    : { background: 'linear-gradient(135deg, #171512 0%, #2a2218 50%, #C9A45C22 100%)' }

  return (
    <div className="w-full relative mb-8 rounded-b-3xl overflow-hidden shadow-lg border-b border-black/10">
      <SetupRedirect isSetupComplete={profile.isSetupComplete} />
      
      {/* الغلاف (Cover) */}
      <div className="h-40 md:h-56 w-full" style={bgStyle} />
      
      {/* قسم البروفايل */}
      <div className="bg-white px-6 py-4 md:px-10 md:py-6 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex flex-col md:flex-row items-center gap-6 -mt-16 md:-mt-20 relative z-10 w-full md:w-auto">
          
          <Link href="/admin/profile" className="group relative block rounded-full p-1 bg-white shadow-md">
            <div className="w-24 h-24 md:w-32 md:h-32 rounded-full overflow-hidden border-4 border-white bg-ivory flex items-center justify-center relative">
              {profile.avatarUrl ? (
                <Image src={profile.avatarUrl} alt={profile.name} fill className="object-cover" />
              ) : (
                <span className="text-4xl text-brand font-bold">{profile.name.charAt(0)}</span>
              )}
              {/* Overlay on hover */}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Settings className="text-white w-8 h-8" />
              </div>
            </div>
          </Link>
          
          <div className="text-center md:text-right mt-2 md:mt-10">
            <h1 className="text-2xl md:text-3xl font-black text-deep-green mb-1">{profile.name}</h1>
            <p className="text-brand font-bold text-sm">الإدارة العامة</p>
          </div>
        </div>
        
        {/* زر الإعدادات السريع */}
        {profile.isSetupComplete && (
          <Link 
            href="/admin/profile" 
            className="flex items-center gap-2 bg-ivory hover:bg-gold hover:text-deep-green text-brand px-5 py-2.5 rounded-full font-bold transition-colors border border-black/5 shadow-sm text-sm"
          >
            <Settings size={18} /> إعدادات الحساب
          </Link>
        )}
      </div>
    </div>
  )
}
