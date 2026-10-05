'use server'

import { verifyAdmin } from '@/lib/auth'

import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

type PaymentSettingsInput = {
  bankTransferEnabled: boolean
  bankTransferInstructions: string | null
  walletsEnabled: boolean
  walletsInstructions: string | null
  codEnabled: boolean
  codFee: number
  codInstructions: string | null
  currency: string
}

type BankAccountInput = {
  bankName: string
  accountName: string
  accountNumber: string
}

type DigitalWalletInput = {
  walletName: string
  accountNumber: string
}

export async function getPaymentSettings() {
  await verifyAdmin();

  const settings = await prisma.paymentSettings.upsert({
    where: { id: 'singleton' },
    update: {},
    create: {
      id: 'singleton'
    }
  })
  return settings
}

export async function updatePaymentSettings(data: PaymentSettingsInput) {
  await verifyAdmin();
  try {
    await prisma.paymentSettings.upsert({
      where: { id: 'singleton' },
      update: data,
      create: { id: 'singleton', ...data }
    })
    revalidatePath('/admin/payment-settings')
    revalidatePath('/checkout')
    return { success: true }
  } catch (error: unknown) {
    console.error('Failed to update settings:', error)
    return { success: false, error: 'فشل تحديث الإعدادات' }
  }
}

export async function addBankAccount(data: BankAccountInput) {
  await verifyAdmin();

  try {
    await prisma.bankAccount.create({ data })
    revalidatePath('/admin/payment-settings')
    revalidatePath('/checkout')
    return { success: true }
  } catch {
    return { success: false, error: 'فشل إضافة الحساب' }
  }
}

export async function deleteBankAccount(id: string) {
  await verifyAdmin();

  try {
    await prisma.bankAccount.delete({ where: { id } })
    revalidatePath('/admin/payment-settings')
    revalidatePath('/checkout')
    return { success: true }
  } catch {
    return { success: false, error: 'فشل حذف الحساب' }
  }
}

export async function addDigitalWallet(data: DigitalWalletInput) {
  await verifyAdmin();

  try {
    await prisma.digitalWallet.create({ data })
    revalidatePath('/admin/payment-settings')
    revalidatePath('/checkout')
    return { success: true }
  } catch {
    return { success: false, error: 'فشل إضافة المحفظة' }
  }
}

export async function deleteDigitalWallet(id: string) {
  await verifyAdmin();

  try {
    await prisma.digitalWallet.delete({ where: { id } })
    revalidatePath('/admin/payment-settings')
    revalidatePath('/checkout')
    return { success: true }
  } catch {
    return { success: false, error: 'فشل حذف المحفظة' }
  }
}
