'use client'

import { createContext, useContext, useState, useCallback, ReactNode } from 'react'

interface Toast {
  id: string
  type: 'success' | 'error' | 'info' | 'subtle'
  message: string
}

interface ToastContextType {
  showToast: (type: Toast['type'], message: string) => void
}

const ToastContext = createContext<ToastContextType | null>(null)

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}

let toastId = 0

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const showToast = useCallback((type: Toast['type'], message: string) => {
    const id = `toast-${toastId++}`
    setToasts(prev => [...prev, { id, type, message }])
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, 3500)
  }, [])

  const icons = {
    success: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12" />
      </svg>
    ),
    error: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
      </svg>
    ),
    info: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
    ),
    subtle: null,
  }

  const colors = {
    success: { bg: '#1A2E28', border: '#D4A017', icon: '#D4A017', text: '#F5ECD7' },
    error:   { bg: '#2E1A1A', border: '#C0392B', icon: '#E74C3C', text: '#F5ECD7' },
    info:    { bg: '#1A2530', border: '#5DA0B5', icon: '#7BB8CC', text: '#F5ECD7' },
    subtle:  { bg: 'rgba(0,0,0,0.6)', border: 'transparent', icon: 'transparent', text: '#FFFFFF' },
  }

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {/* Toast Container */}
      <div
        style={{
          position: 'fixed',
          top: '5rem',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 99999,
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          pointerEvents: 'none',
          alignItems: 'center',
        }}
      >
        {toasts.map(toast => {
          const c = colors[toast.type]
          return (
            <div
              key={toast.id}
              dir="rtl"
              style={{
                background: c.bg,
                border: toast.type === 'subtle' ? 'none' : `1px solid ${c.border}40`,
                borderRadius: toast.type === 'subtle' ? '20px' : '12px',
                padding: toast.type === 'subtle' ? '8px 16px' : '14px 18px',
                display: 'flex',
                alignItems: 'center',
                gap: toast.type === 'subtle' ? '0' : '12px',
                color: c.text,
                fontSize: toast.type === 'subtle' ? '12px' : '14px',
                fontWeight: toast.type === 'subtle' ? '400' : '500',
                boxShadow: toast.type === 'subtle' ? '0 4px 12px rgba(0,0,0,0.1)' : `0 8px 32px rgba(0,0,0,0.4), 0 0 0 1px ${c.border}20`,
                minWidth: toast.type === 'subtle' ? 'auto' : '260px',
                maxWidth: '360px',
                pointerEvents: 'auto',
                animation: 'tif-toast-in 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
              }}
            >
              {toast.type !== 'subtle' && <span style={{ color: c.icon, flexShrink: 0 }}>{icons[toast.type]}</span>}
              <span style={{ flex: 1, lineHeight: 1.5, textAlign: toast.type === 'subtle' ? 'center' : 'right' }}>{toast.message}</span>
            </div>
          )
        })}
      </div>
      <style>{`
        @keyframes tif-toast-in {
          from { opacity: 0; transform: translateY(-16px) scale(0.92); }
          to   { opacity: 1; transform: translateY(0)    scale(1);    }
        }
      `}</style>
    </ToastContext.Provider>
  )
}
