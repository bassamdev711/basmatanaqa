'use client'

import React, { createContext, useContext, useState, ReactNode } from 'react'

interface ConfirmOptions {
  title?: string
  message: string
  confirmText?: string
  cancelText?: string
  danger?: boolean
}

interface ConfirmContextType {
  confirm: (options: ConfirmOptions | string) => Promise<boolean>
}

const ConfirmContext = createContext<ConfirmContextType | null>(null)

export function useConfirm() {
  const ctx = useContext(ConfirmContext)
  if (!ctx) throw new Error('useConfirm must be used within ConfirmProvider')
  return ctx
}

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [modal, setModal] = useState<(ConfirmOptions & { resolve: (val: boolean) => void }) | null>(null)

  const confirm = (options: ConfirmOptions | string): Promise<boolean> => {
    return new Promise((resolve) => {
      const opts = typeof options === 'string' ? { message: options } : options
      setModal({ ...opts, resolve })
    })
  }

  const handleConfirm = () => {
    if (modal) {
      modal.resolve(true)
      setModal(null)
    }
  }

  const handleCancel = () => {
    if (modal) {
      modal.resolve(false)
      setModal(null)
    }
  }

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      {modal && (
        <div className="fixed inset-0 z-[99999] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 transition-opacity" onClick={handleCancel}>
          <div dir="rtl" className="bg-white rounded-2xl p-6 shadow-2xl w-full max-w-sm transition-transform transform scale-100 animate-in fade-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
            <h3 className="text-xl font-black text-gray-900 mb-2">{modal.title || 'تأكيد الإجراء'}</h3>
            <p className="text-gray-600 text-sm mb-6 leading-relaxed">{modal.message}</p>
            <div className="flex gap-3">
              <button 
                onClick={handleCancel}
                className="flex-1 px-4 py-3 rounded-xl font-bold text-sm bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
              >
                {modal.cancelText || 'إلغاء'}
              </button>
              <button 
                onClick={handleConfirm}
                className={`flex-1 px-4 py-3 rounded-xl font-bold text-sm transition-colors text-white shadow-sm ${modal.danger ? 'bg-red-600 hover:bg-red-700 shadow-red-600/20' : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20'}`}
              >
                {modal.confirmText || 'تأكيد'}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  )
}
