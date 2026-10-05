'use client'

import { useToast } from '@/components/ToastProvider'
import { useConfirm } from '@/components/ConfirmProvider'

import React, { useState } from 'react'
import { Plus, Trash2, Save, Landmark, Wallet, Truck } from 'lucide-react'
import { updatePaymentSettings, addBankAccount, deleteBankAccount, addDigitalWallet, deleteDigitalWallet } from './actions'

type PaymentSettings = {
  bankTransferEnabled: boolean
  bankTransferInstructions: string | null
  walletsEnabled: boolean
  walletsInstructions: string | null
  codEnabled: boolean
  codFee: number | string
  codInstructions: string | null
  currency: string
}

type BankAccount = {
  id: string
  bankName: string
  accountName: string
  accountNumber: string
}

type DigitalWallet = {
  id: string
  walletName: string
  accountNumber: string
}

type PaymentSettingsClientProps = {
  initialSettings: PaymentSettings
  initialBankAccounts: BankAccount[]
  initialWallets: DigitalWallet[]
}

export default function PaymentSettingsClient({
  initialSettings,
  initialBankAccounts,
  initialWallets
}: PaymentSettingsClientProps) {
  const { showToast } = useToast()
  const { confirm } = useConfirm()
  const [settings, setSettings] = useState<PaymentSettings>(initialSettings)
  const [bankAccounts] = useState<BankAccount[]>(initialBankAccounts)
  const [wallets] = useState<DigitalWallet[]>(initialWallets)
  
  const [isSaving, setIsSaving] = useState(false)
  
  const [newBank, setNewBank] = useState({ bankName: '', accountName: '', accountNumber: '' })
  const [showAddBank, setShowAddBank] = useState(false)
  
  const [newWallet, setNewWallet] = useState({ walletName: '', accountNumber: '' })
  const [showAddWallet, setShowAddWallet] = useState(false)

  const handleSaveSettings = async () => {
    setIsSaving(true)
    await updatePaymentSettings({
      bankTransferEnabled: settings.bankTransferEnabled,
      bankTransferInstructions: settings.bankTransferInstructions,
      walletsEnabled: settings.walletsEnabled,
      walletsInstructions: settings.walletsInstructions,
      codEnabled: settings.codEnabled,
      codFee: Number(settings.codFee),
      codInstructions: settings.codInstructions,
      currency: settings.currency || 'ر.س',
    })
    setIsSaving(false)
    showToast('success', 'تم حفظ الإعدادات بنجاح!')
  }

  const handleAddBank = async () => {
    if (!newBank.bankName || !newBank.accountNumber) return
    const res = await addBankAccount(newBank)
    if (res.success) {
      window.location.reload()
    }
  }

  const handleDeleteBank = async (id: string) => {
    if(await confirm({ message: 'هل أنت متأكد من حذف الحساب البنكي؟', danger: true })) {
      const res = await deleteBankAccount(id)
      if(res.success) window.location.reload()
    }
  }

  const handleAddWallet = async () => {
    if (!newWallet.walletName || !newWallet.accountNumber) return
    const res = await addDigitalWallet(newWallet)
    if (res.success) {
      window.location.reload()
    }
  }

  const handleDeleteWallet = async (id: string) => {
    if(await confirm({ message: 'هل أنت متأكد من حذف المحفظة؟', danger: true })) {
      const res = await deleteDigitalWallet(id)
      if(res.success) window.location.reload()
    }
  }

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8" dir="rtl">
      {/* Page Header */}
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">إعدادات الدفع</h1>
          <p className="text-gray-500">قم بإدارة طرق الدفع المتاحة لعملائك.</p>
        </div>
        <button 
          onClick={handleSaveSettings}
          disabled={isSaving}
          className="bg-emerald-800 text-white font-bold px-6 py-2.5 rounded-lg hover:bg-emerald-900 transition-colors shadow-sm flex items-center gap-2 disabled:opacity-50"
        >
          <Save size={16} />
          {isSaving ? 'جاري الحفظ...' : 'حفظ التغييرات'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Main Column */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Bank Transfer */}
          <section className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
            <div className="p-6 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-brand/10 flex items-center justify-center text-brand-800">
                  <Landmark size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">حوالة بنكية</h3>
                  <p className="text-sm text-gray-500">الدفع عبر التحويل البنكي المباشر.</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="sr-only peer"
                  checked={settings.bankTransferEnabled}
                  onChange={(e) => setSettings({...settings, bankTransferEnabled: e.target.checked})}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-800"></div>
              </label>
            </div>

            <div className={`p-6 space-y-6 transition-all ${!settings.bankTransferEnabled ? 'opacity-50 pointer-events-none' : ''}`}>
              {/* Bank Accounts List */}
              {bankAccounts.map((bank) => (
                <div key={bank.id} className="p-5 rounded-lg border border-gray-200 bg-gray-50 relative group">
                  <div className="absolute left-4 top-4 flex gap-2">
                    <button onClick={() => handleDeleteBank(bank.id)} className="w-8 h-8 rounded bg-white hover:bg-red-100 text-red-600 flex items-center justify-center transition-colors border border-gray-200 shadow-sm" title="حذف">
                      <Trash2 size={16} />
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">اسم البنك</label>
                      <input readOnly value={bank.bankName} className="w-full px-4 py-2 rounded-lg border border-gray-200 bg-white text-sm" />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">اسم الحساب</label>
                      <input readOnly value={bank.accountName} className="w-full px-4 py-2 rounded-lg border border-gray-200 bg-white text-sm" />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-bold text-gray-700 mb-2">رقم الحساب / IBAN</label>
                      <input readOnly value={bank.accountNumber} dir="ltr" className="w-full px-4 py-2 rounded-lg border border-gray-200 bg-white text-sm text-left font-mono" />
                    </div>
                  </div>
                </div>
              ))}

              {showAddBank ? (
                <div className="p-5 rounded-lg border border-emerald-300 bg-brand/5">
                  <h4 className="font-bold text-brand-800 mb-4">إضافة حساب جديد</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <input placeholder="اسم البنك" value={newBank.bankName} onChange={e => setNewBank({...newBank, bankName: e.target.value})} className="px-4 py-2 rounded-lg border border-gray-300" />
                    <input placeholder="اسم الحساب" value={newBank.accountName} onChange={e => setNewBank({...newBank, accountName: e.target.value})} className="px-4 py-2 rounded-lg border border-gray-300" />
                    <input placeholder="رقم الحساب / IBAN" dir="ltr" value={newBank.accountNumber} onChange={e => setNewBank({...newBank, accountNumber: e.target.value})} className="md:col-span-2 px-4 py-2 rounded-lg border border-gray-300 text-left" />
                  </div>
                  <div className="flex gap-2">
                    <button onClick={handleAddBank} className="btn btn-primary">حفظ الحساب</button>
                    <button onClick={() => setShowAddBank(false)} className="bg-gray-200 text-gray-800 px-4 py-2 rounded-md font-bold hover:bg-gray-300 text-sm">إلغاء</button>
                  </div>
                </div>
              ) : (
                <button onClick={() => setShowAddBank(true)} className="w-full py-3 border border-dashed border-emerald-600 rounded-lg text-brand font-bold hover:bg-brand/5 transition-colors flex items-center justify-center gap-2">
                  <Plus size={16} /> إضافة حساب بنكي جديد
                </button>
              )}

              <div className="pt-4 border-t border-gray-200">
                <label className="block text-sm font-bold text-gray-700 mb-2">تعليمات الدفع (تظهر للعميل)</label>
                <textarea 
                  value={settings.bankTransferInstructions || ''} 
                  onChange={e => setSettings({...settings, bankTransferInstructions: e.target.value})}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 bg-white text-sm focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 resize-none" 
                  rows={3} 
                />
              </div>
            </div>
          </section>

          {/* Digital Wallets */}
          <section className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
            <div className="p-6 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-brand/10 flex items-center justify-center text-brand-800">
                  <Wallet size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">المحافظ الإلكترونية</h3>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="sr-only peer"
                  checked={settings.walletsEnabled}
                  onChange={(e) => setSettings({...settings, walletsEnabled: e.target.checked})}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-800"></div>
              </label>
            </div>
            
            <div className={`p-6 space-y-4 transition-all ${!settings.walletsEnabled ? 'opacity-50 pointer-events-none' : ''}`}>
              <table className="w-full text-right border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="py-3 px-4 text-sm font-bold text-gray-500">اسم المحفظة</th>
                    <th className="py-3 px-4 text-sm font-bold text-gray-500">رقم الحساب / الجوال</th>
                    <th className="py-3 px-4 text-sm font-bold text-gray-500 w-24">إجراء</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {wallets.map((wallet) => (
                    <tr key={wallet.id} className="hover:bg-gray-50">
                      <td className="py-3 px-4 text-sm font-bold text-gray-900">{wallet.walletName}</td>
                      <td className="py-3 px-4 text-sm font-mono" dir="ltr">{wallet.accountNumber}</td>
                      <td className="py-3 px-4">
                        <button onClick={() => handleDeleteWallet(wallet.id)} className="text-red-500 hover:text-red-700">
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {showAddWallet ? (
                <div className="p-4 border border-emerald-300 bg-brand/5 rounded-lg flex gap-4 flex-wrap">
                  <input placeholder="اسم المحفظة" value={newWallet.walletName} onChange={e => setNewWallet({...newWallet, walletName: e.target.value})} className="px-3 py-2 rounded-md border border-gray-300 flex-grow" />
                  <input placeholder="الرقم" dir="ltr" value={newWallet.accountNumber} onChange={e => setNewWallet({...newWallet, accountNumber: e.target.value})} className="px-3 py-2 rounded-md border border-gray-300 text-left" />
                  <button onClick={handleAddWallet} className="btn btn-primary">إضافة</button>
                  <button onClick={() => setShowAddWallet(false)} className="bg-gray-300 px-4 rounded-md font-bold">إلغاء</button>
                </div>
              ) : (
                <button onClick={() => setShowAddWallet(true)} className="px-4 py-2 border border-emerald-600 rounded-lg text-brand font-bold hover:bg-brand/5 text-sm flex items-center gap-2">
                  <Plus size={16} /> إضافة محفظة
                </button>
              )}

              <div className="pt-4 border-t border-gray-200 mt-4">
                <label className="block text-sm font-bold text-gray-700 mb-2">تعليمات الدفع للمحافظ</label>
                <textarea 
                  value={settings.walletsInstructions || ''}
                  onChange={e => setSettings({...settings, walletsInstructions: e.target.value})}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 bg-white text-sm focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 resize-none" 
                  rows={2} 
                />
              </div>
            </div>
          </section>
        </div>

        {/* Sidebar Column */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Currency Settings */}
          <section className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-brand/10 flex items-center justify-center text-brand-800">
                    <span className="font-bold text-xl">د.ك</span>
                  </div>
                  <h3 className="text-lg font-bold text-gray-900">إعدادات العملة</h3>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">رمز العملة (مثال: ر.س, $, ر.ي)</label>
                <div className="relative mb-2">
                  <input 
                    type="text" 
                    value={settings.currency || ''} 
                    onChange={e => setSettings({...settings, currency: e.target.value})}
                    placeholder="ر.س"
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 bg-white text-right focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600" 
                  />
                </div>
                <p className="text-xs text-gray-500">
                  سيتم عرض هذا الرمز بجانب جميع الأسعار في المتجر (دون تغيير قيمة السعر الفعلية).
                </p>
              </div>
            </div>
          </section>

          {/* COD */}
          <section className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-brand/10 flex items-center justify-center text-brand-800">
                    <Truck size={20} />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900">الدفع عند الاستلام</h3>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="sr-only peer"
                    checked={settings.codEnabled}
                    onChange={(e) => setSettings({...settings, codEnabled: e.target.checked})}
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-800"></div>
                </label>
              </div>

              <div className={`transition-all ${!settings.codEnabled ? 'opacity-50 pointer-events-none' : ''}`}>
                <label className="block text-sm font-bold text-gray-700 mb-2">رسوم إضافية (اختياري)</label>
                <div className="relative mb-4">
                  <input 
                    type="number" 
                    value={settings.codFee} 
                    onChange={e => setSettings({...settings, codFee: e.target.value})}
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 bg-white text-left font-mono pl-12" 
                    dir="ltr"
                  />
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold">{settings.currency || 'SAR'}</span>
                </div>
                <label className="block text-sm font-bold text-gray-700 mb-2">تعليمات</label>
                <textarea 
                  value={settings.codInstructions || ''}
                  onChange={e => setSettings({...settings, codInstructions: e.target.value})}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 bg-white text-sm resize-none focus:outline-none focus:border-emerald-600" 
                  rows={3} 
                />
              </div>
            </div>
          </section>
        </div>

      </div>
    </div>
  )
}
