'use client'

import { createContext, useContext, useState, useCallback, ReactNode, useRef } from 'react'

interface CartAnimationContextType {
  flyToCart: (buttonEl: HTMLElement) => void
  cartIconRef: React.RefObject<HTMLDivElement | null>
  mobileCartIconRef: React.RefObject<HTMLDivElement | null>
  triggerBounce: boolean
  onBounceComplete: () => void
}

const CartAnimationContext = createContext<CartAnimationContextType | null>(null)

export function useCartAnimation() {
  const ctx = useContext(CartAnimationContext)
  if (!ctx) throw new Error('useCartAnimation must be used within CartAnimationProvider')
  return ctx
}

export function CartAnimationProvider({ children }: { children: ReactNode }) {
  const [triggerBounce, setTriggerBounce] = useState(false)
  const cartIconRef = useRef<HTMLDivElement | null>(null)
  const mobileCartIconRef = useRef<HTMLDivElement | null>(null)

  const flyToCart = useCallback((buttonEl: HTMLElement) => {
    // Determine the right target: mobile bottom nav on mobile screens, or desktop navbar
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768 && !!mobileCartIconRef.current
    const targetEl = isMobile ? mobileCartIconRef.current : (cartIconRef.current || mobileCartIconRef.current)
    if (!targetEl) return

    const btnRect = buttonEl.getBoundingClientRect()
    const cartRect = targetEl.getBoundingClientRect()

    const startX = btnRect.left + btnRect.width / 2
    const startY = btnRect.top + btnRect.height / 2
    const endX = cartRect.left + cartRect.width / 2
    const endY = cartRect.top + cartRect.height / 2

    // Create the flying element
    const el = document.createElement('div')
    el.style.cssText = `
      position: fixed;
      left: ${startX - 12}px;
      top: ${startY - 12}px;
      width: 24px;
      height: 24px;
      border-radius: 50%;
      background: radial-gradient(circle at 30% 30%, #F5C842, #D4A017);
      box-shadow: 0 0 16px 6px rgba(245,200,66,0.7), 0 0 32px 12px rgba(245,200,66,0.3);
      pointer-events: none;
      z-index: 9999;
      transition: none;
    `
    document.body.appendChild(el)

    // Calculate distance and trajectory
    const dx = endX - startX
    const dy = endY - startY
    const dist = Math.sqrt(dx * dx + dy * dy)
    const duration = Math.min(650, Math.max(400, dist * 0.7))

    // Parabolic arc:
    // If target is below start (e.g. mobile bottom nav), curve gently toward it
    // If target is above start (desktop top nav), arc upwards
    const midX = startX + dx * 0.5
    const midY = dy > 0
      ? startY + dy * 0.45 + Math.min(30, dist * 0.08)
      : startY + dy * 0.5 - Math.min(110, dist * 0.25)

    el.animate([
      { transform: 'translate(0,0) scale(1)', opacity: 1 },
      { transform: `translate(${midX - startX}px, ${midY - startY}px) scale(0.9)`, opacity: 1, offset: 0.45 },
      { transform: `translate(${dx}px, ${dy}px) scale(0.3)`, opacity: 0 },
    ], {
      duration,
      easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
      fill: 'forwards',
    }).onfinish = () => {
      el.remove()
      setTriggerBounce(true)
    }

  }, [])

  const onBounceComplete = useCallback(() => {
    setTriggerBounce(false)
  }, [])

  return (
    <CartAnimationContext.Provider value={{ flyToCart, cartIconRef, mobileCartIconRef, triggerBounce, onBounceComplete }}>
      {children}
    </CartAnimationContext.Provider>
  )
}
