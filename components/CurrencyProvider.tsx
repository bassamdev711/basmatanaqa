'use client'

import React, { createContext, useContext } from 'react'

const CurrencyContext = createContext<string>('ر.س')

export function CurrencyProvider({ children, currency }: { children: React.ReactNode, currency: string }) {
  return (
    <CurrencyContext.Provider value={currency}>
      {children}
    </CurrencyContext.Provider>
  )
}

export function useCurrency() {
  return useContext(CurrencyContext)
}
