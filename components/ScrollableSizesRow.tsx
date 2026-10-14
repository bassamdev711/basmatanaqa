'use client'

import React, { useRef, useState, useEffect, useCallback } from 'react'
import { ChevronRight, ChevronLeft } from 'lucide-react'

export interface SizeOption {
  id: string
  label: string
  isSelected: boolean
  onClick: () => void
}

interface ScrollableSizesRowProps {
  title?: string
  options: SizeOption[]
}

export default function ScrollableSizesRow({
  title = 'اختر المقاس:',
  options,
}: ScrollableSizesRowProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [hasOverflow, setHasOverflow] = useState(false)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  
  const isDraggingRef = useRef(false)
  const startXRef = useRef(0)
  const scrollLeftRef = useRef(0)
  const resumeTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Check if content overflows and update scroll indicators
  const checkOverflowAndScroll = useCallback(() => {
    const el = containerRef.current
    if (!el) return
    const overflow = el.scrollWidth > el.clientWidth + 4
    setHasOverflow(overflow)

    if (!overflow) {
      setCanScrollLeft(false)
      setCanScrollRight(false)
      return
    }

    const maxScroll = el.scrollWidth - el.clientWidth
    const current = Math.abs(el.scrollLeft)
    setCanScrollRight(current > 8)
    setCanScrollLeft(current < maxScroll - 8)
  }, [])

  useEffect(() => {
    checkOverflowAndScroll()
    const handleResize = () => checkOverflowAndScroll()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [checkOverflowAndScroll, options])

  // Gentle automatic movement (auto-scroll preview)
  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    let animationFrameId: number
    let direction = -1 // Scroll left in RTL
    let lastTime = performance.now()
    const speed = 0.035 // Very slow and gentle pixels/ms

    const step = (time: number) => {
      const delta = time - lastTime
      lastTime = time

      if (!isPaused && el && !isDraggingRef.current) {
        const maxScroll = el.scrollWidth - el.clientWidth
        if (maxScroll > 10) {
          el.scrollBy({ left: direction * (speed * delta), behavior: 'auto' })

          const current = Math.abs(el.scrollLeft)
          if (current >= maxScroll - 4) {
            direction = 1 // Reverse slowly back towards start
          } else if (current <= 4) {
            direction = -1 // Forward
          }
          checkOverflowAndScroll()
        }
      }

      animationFrameId = requestAnimationFrame(step)
    }

    animationFrameId = requestAnimationFrame(step)
    return () => cancelAnimationFrame(animationFrameId)
  }, [isPaused, checkOverflowAndScroll])

  const pauseAutoScroll = useCallback((duration = 3000) => {
    setIsPaused(true)
    if (resumeTimeoutRef.current) clearTimeout(resumeTimeoutRef.current)
    resumeTimeoutRef.current = setTimeout(() => {
      setIsPaused(false)
    }, duration)
  }, [])

  // Manual scroll with navigation buttons
  const scrollByAmount = (amount: number) => {
    pauseAutoScroll(4000)
    const el = containerRef.current
    if (!el) return
    el.scrollBy({ left: amount, behavior: 'smooth' })
    setTimeout(checkOverflowAndScroll, 350)
  }

  // Desktop Mouse Drag-to-Scroll support
  const handleMouseDown = (e: React.MouseEvent) => {
    const el = containerRef.current
    if (!el) return
    isDraggingRef.current = true
    pauseAutoScroll(5000)
    startXRef.current = e.pageX - el.offsetLeft
    scrollLeftRef.current = el.scrollLeft
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingRef.current) return
    e.preventDefault()
    const el = containerRef.current
    if (!el) return
    const x = e.pageX - el.offsetLeft
    const walk = (x - startXRef.current) * 1.5
    el.scrollLeft = scrollLeftRef.current - walk
    checkOverflowAndScroll()
  }

  const handleMouseUp = () => {
    isDraggingRef.current = false
  }

  if (!options || options.length === 0) return null

  return (
    <div className="mb-8">
      {/* Title & Scroll Hint */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
          <span>{title}</span>
          <span className="text-xs font-normal text-foreground/50">
            ({options.length} مقاس متاح)
          </span>
        </h3>
        {hasOverflow && (
          <span className="text-[11px] font-bold text-accent bg-accent/10 px-2.5 py-1 rounded-full animate-pulse flex items-center gap-1 select-none">
            اسحب للتمرير ↔
          </span>
        )}
      </div>

      {/* Row Wrapper with Controls */}
      <div
        className="relative group/sizes"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        onTouchStart={() => pauseAutoScroll(5000)}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      >
        {/* Navigation Arrow (Scroll Forward in RTL - Left side) */}
        {hasOverflow && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              scrollByAmount(-180)
            }}
            aria-label="تمرير المقاسات"
            className="hidden md:flex absolute -left-3 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-white shadow-md border border-black/10 items-center justify-center text-foreground hover:bg-black hover:text-white transition-all opacity-0 group-hover/sizes:opacity-100 cursor-pointer"
          >
            <ChevronLeft size={18} />
          </button>
        )}

        {/* Navigation Arrow (Scroll Backward in RTL - Right side) */}
        {hasOverflow && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              scrollByAmount(180)
            }}
            aria-label="تمرير المقاسات"
            className="hidden md:flex absolute -right-3 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-white shadow-md border border-black/10 items-center justify-center text-foreground hover:bg-black hover:text-white transition-all opacity-0 group-hover/sizes:opacity-100 cursor-pointer"
          >
            <ChevronRight size={18} />
          </button>
        )}

        {/* Edge Fade Shadows */}
        {hasOverflow && canScrollLeft && (
          <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-surface to-transparent z-10" />
        )}
        {hasOverflow && canScrollRight && (
          <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-surface to-transparent z-10" />
        )}

        {/* Single Row Container (No wrap + smooth scroll) */}
        <div
          ref={containerRef}
          onScroll={checkOverflowAndScroll}
          className="flex flex-nowrap items-center gap-2.5 overflow-x-auto py-2 px-1 scrollbar-none select-none active:cursor-grabbing"
          style={{
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            WebkitOverflowScrolling: 'touch',
          }}
        >
          {options.map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => {
                pauseAutoScroll(4000)
                option.onClick()
              }}
              className={`shrink-0 whitespace-nowrap px-6 py-2.5 border rounded-full text-sm font-bold transition-all duration-200 cursor-pointer ${
                option.isSelected
                  ? 'bg-brand text-surface border-brand shadow-md scale-[1.03] ring-2 ring-brand/20'
                  : 'bg-white text-foreground border-black/10 hover:border-brand/50 hover:bg-black/[0.02]'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
