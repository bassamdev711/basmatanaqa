import React from 'react'
import prisma from '@/lib/prisma'
import { getPaymentSettings } from './actions'
import PaymentSettingsClient from './PaymentSettingsClient'

export const dynamic = 'force-dynamic'

export default async function PaymentSettingsPage() {
  const settings = await getPaymentSettings()
  
  const bankAccounts = await prisma.bankAccount.findMany({
    orderBy: { createdAt: 'desc' }
  })
  
  const wallets = await prisma.digitalWallet.findMany({
    orderBy: { createdAt: 'desc' }
  })

  // Convert Decimal to numbers for client components
  const serializedSettings = {
    ...settings,
    codFee: Number(settings.codFee)
  }

  return (
    <PaymentSettingsClient 
      initialSettings={serializedSettings}
      initialBankAccounts={bankAccounts}
      initialWallets={wallets}
    />
  )
}
