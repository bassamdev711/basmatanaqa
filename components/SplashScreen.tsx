'use client'

import { startTransition, useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'

interface SplashScreenProps {
  storeName?: string
  storeNameLatin?: string
}

export default function SplashScreen({
  storeName = 'بصمة أناقة',
  storeNameLatin = 'BASMAT ANAQAH',
}: SplashScreenProps) {
  const [showSplash, setShowSplash] = useState(false)

  useEffect(() => {
    const splashKey = `store_splash_seen:${storeNameLatin || storeName}`
    const hasSeenSplash = sessionStorage.getItem(splashKey)
    if (!hasSeenSplash) {
      startTransition(() => setShowSplash(true))
      sessionStorage.setItem(splashKey, 'true')
      const timer = setTimeout(() => setShowSplash(false), 1800)
      return () => clearTimeout(timer)
    }
  }, [storeName, storeNameLatin])

  return (
    <AnimatePresence>
      {showSplash && (
        <motion.div
          key="splash-screen"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6, ease: 'easeInOut' }}
          className="fixed inset-0 z-[99999] flex items-center justify-center overflow-hidden bg-brand"
          dir="rtl"
        >
          <div className="pointer-events-none absolute inset-0 opacity-20 [background-image:linear-gradient(90deg,transparent_49%,rgba(184,138,69,.5)_50%,transparent_51%)] [background-size:120px_100%]" />
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="relative z-10 flex w-[min(88vw,460px)] flex-col items-center text-center"
          >
            <span className="mb-8 text-[10px] font-bold tracking-[0.38em] text-accent">BASMAT ANAQAH</span>
            <div className="w-full border-y border-accent/35 py-8">
              <Image
                src="/basmat-anaqah-logo.png"
                alt={`شعار ${storeName}`}
                width={360}
                height={360}
                priority
                className="mx-auto h-56 w-56 object-contain sm:h-64 sm:w-64"
              />
            </div>
            <span className="mt-8 text-xl font-light tracking-[0.18em] text-surface">{storeName}</span>
            <span className="mt-3 text-xs text-surface/55">اختيارات تصنع حضورك</span>
          </motion.div>
          <button
            type="button"
            onClick={() => setShowSplash(false)}
            className="absolute bottom-8 z-10 border-b border-surface/30 pb-1 text-xs text-surface/70 transition-colors hover:border-accent hover:text-accent"
          >
            تخطي
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
