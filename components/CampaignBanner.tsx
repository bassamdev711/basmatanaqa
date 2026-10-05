'use client'

import { startTransition, useEffect, useState, useSyncExternalStore } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

const emptySubscribe = () => () => {}
const getClientHydrationSnapshot = () => true
const getServerHydrationSnapshot = () => false

type Campaign = {
  id: string
  title: string
  description: string | null
  imageUrl: string | null
  slug: string | null
  endDate: Date
  discountPercentage: number | null
}

export default function CampaignBanner({ campaign }: { campaign: Campaign }) {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 })
  const isMounted = useSyncExternalStore(
    emptySubscribe,
    getClientHydrationSnapshot,
    getServerHydrationSnapshot,
  )

  useEffect(() => {
    const calculateTimeLeft = () => {
      const difference = new Date(campaign.endDate).getTime() - new Date().getTime()
      
      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60)
        })
      }
    }

    startTransition(() => {
      calculateTimeLeft()
    })
    const timer = setInterval(calculateTimeLeft, 1000)
    return () => clearInterval(timer)
  }, [campaign.endDate])

  if (!isMounted) return null

  return (
    <div className="relative overflow-hidden bg-black text-white py-12 px-4 sm:px-6 lg:px-8 mt-16 mb-8 mx-4 sm:mx-8 lg:mx-16 rounded-3xl group">
      {/* Background Image with Overlay */}
      {campaign.imageUrl && (
        <>
          <Image
            src={campaign.imageUrl}
            alt={campaign.title}
            fill
            sizes="100vw"
            className="object-cover opacity-40 transition-transform duration-700 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-transparent" />
        </>
      )}

      <div className="relative max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8 z-10">
        <div className="text-center md:text-right flex-1 space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/20 text-accent border border-accent/30 text-sm font-medium mb-2">
            <span className="w-2 h-2 rounded-full bg-accent animate-pulse"></span>
            عرض خاص
          </div>
          <h2 className="text-3xl md:text-5xl font-black tracking-tight">{campaign.title}</h2>
          {campaign.description && (
            <p className="text-lg text-gray-300 max-w-2xl">{campaign.description}</p>
          )}
          
          {campaign.slug && (
            <div className="pt-4">
              <Link 
                href={`/campaigns/${campaign.slug}`}
                className="inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-white text-black font-bold rounded-full hover:bg-gray-100 transition-colors"
              >
                تسوّق عروض الحملة
                <ArrowLeft size={18} />
              </Link>
            </div>
          )}
        </div>

        {/* Countdown Timer */}
        <div className="flex items-center justify-center gap-2 sm:gap-3 md:gap-4 bg-black/40 backdrop-blur-md p-3 sm:p-4 md:p-6 rounded-2xl border border-white/10 shrink-0 w-full sm:w-auto overflow-hidden">
          <TimeUnit value={timeLeft.days} label="يوم" />
          <span className="text-lg sm:text-xl md:text-2xl font-black text-accent">:</span>
          <TimeUnit value={timeLeft.hours} label="ساعة" />
          <span className="text-lg sm:text-xl md:text-2xl font-black text-accent">:</span>
          <TimeUnit value={timeLeft.minutes} label="دقيقة" />
          <span className="text-lg sm:text-xl md:text-2xl font-black text-accent">:</span>
          <TimeUnit value={timeLeft.seconds} label="ثانية" />
        </div>
      </div>
    </div>
  )
}

function TimeUnit({ value, label }: { value: number, label: string }) {
  return (
    <div className="flex flex-col items-center min-w-[40px] sm:min-w-[50px] md:min-w-[60px]">
      <span className="text-xl sm:text-2xl md:text-3xl font-black tabular-nums tracking-tight">
        {value.toString().padStart(2, '0')}
      </span>
      <span className="text-[9px] sm:text-[10px] md:text-xs text-gray-400 font-medium mt-1 uppercase tracking-wider">{label}</span>
    </div>
  )
}
