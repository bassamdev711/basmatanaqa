'use client'

import React, { createContext, startTransition, useContext, useState, ReactNode, useEffect } from 'react'

export interface CheckoutData {
  fullName: string
  phone: string
  governorate: string
  city: string
  address: string
  paymentMethod: string
  shippingFee: number
}

interface CheckoutContextType {
  checkoutData: CheckoutData
  setCheckoutData: (data: CheckoutData) => void
}

const defaultData: CheckoutData = {
  fullName: '',
  phone: '',
  governorate: '',
  city: '',
  address: '',
  paymentMethod: 'bank_transfer',
  shippingFee: 0,
}

const PAYMENT_METHODS = new Set(['cod', 'bank_transfer', 'wallets'])

function sanitizeCheckoutData(value: unknown): CheckoutData {
  if (!value || typeof value !== 'object') return defaultData
  const data = value as Partial<CheckoutData>
  return {
    fullName: typeof data.fullName === 'string' ? data.fullName.slice(0, 120) : '',
    phone: typeof data.phone === 'string' ? data.phone.slice(0, 32) : '',
    governorate: typeof data.governorate === 'string' ? data.governorate.slice(0, 100) : '',
    city: typeof data.city === 'string' ? data.city.slice(0, 100) : '',
    address: typeof data.address === 'string' ? data.address.slice(0, 500) : '',
    paymentMethod: typeof data.paymentMethod === 'string' && PAYMENT_METHODS.has(data.paymentMethod)
      ? data.paymentMethod
      : defaultData.paymentMethod,
    shippingFee: typeof data.shippingFee === 'number' && Number.isFinite(data.shippingFee) && data.shippingFee >= 0
      ? data.shippingFee
      : 0,
  }
}

const CheckoutContext = createContext<CheckoutContextType | undefined>(undefined)

export function CheckoutProvider({ children }: { children: ReactNode }) {
  const [checkoutData, setCheckoutDataState] = useState<CheckoutData>(defaultData)

  useEffect(() => {
    try {
      const stored = localStorage.getItem('tif_checkout')
      if (stored) {
        const parsed = JSON.parse(stored)
        const safeData = sanitizeCheckoutData(parsed)
        startTransition(() => {
          setCheckoutDataState(safeData)
        })
        localStorage.setItem('tif_checkout', JSON.stringify(safeData))
      }
    } catch {
      console.error('Failed to load checkout data')
      localStorage.removeItem('tif_checkout')
      startTransition(() => {
        setCheckoutDataState(defaultData)
      })
    }
  }, [])

  const setCheckoutData = (data: CheckoutData) => {
    const safeData = sanitizeCheckoutData(data)
    setCheckoutDataState(safeData)
    localStorage.setItem('tif_checkout', JSON.stringify(safeData))
  }

  return (
    <CheckoutContext.Provider value={{ checkoutData, setCheckoutData }}>
      {children}
    </CheckoutContext.Provider>
  )
}

export function useCheckout() {
  const context = useContext(CheckoutContext)
  if (context === undefined) {
    throw new Error('useCheckout must be used within a CheckoutProvider')
  }
  return context
}
