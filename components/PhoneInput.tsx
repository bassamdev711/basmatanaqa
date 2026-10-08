import React, { useState } from 'react'
import { Phone } from 'lucide-react'

interface PhoneInputProps {
  value: string
  onChange: (value: string) => void
  error?: string
  required?: boolean
  disabled?: boolean
}

export function PhoneInput({ value, onChange, error, required = false, disabled = false }: PhoneInputProps) {
  const [localError, setLocalError] = useState('')

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, '') // Remove non-numeric chars
    
    // Max 9 digits
    if (val.length > 9) {
      val = val.slice(0, 9)
    }

    if (val.length > 0 && val[0] !== '7') {
      setLocalError('رقم الهاتف يجب أن يبدأ بـ 7')
    } else {
      setLocalError('')
    }

    onChange(val)
  }

  const isInvalid = !!error || !!localError

  return (
    <div>
      <div className={`relative flex items-center bg-surface/50 border rounded-xl focus-within:ring-1 transition-all overflow-hidden ${isInvalid ? 'border-red-500 focus-within:border-red-500 focus-within:ring-red-500' : 'border-foreground/10 focus-within:border-accent focus-within:ring-accent'}`} dir="ltr">
        <span className="pl-4 pr-3 font-bold text-foreground/70 select-none border-r border-foreground/10 py-3 flex items-center justify-center bg-black/5">+967</span>
        <input
          type="tel"
          value={value}
          onChange={handleChange}
          className="w-full pl-3 pr-12 py-3 bg-transparent outline-none text-foreground"
          placeholder="7XXXXXXXX"
          required={required}
          disabled={disabled}
        />
        <Phone className={`absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 ${isInvalid ? 'text-red-500' : 'text-foreground/40'}`} />
      </div>
      {localError && <p className="text-red-500 text-xs mt-1 text-right">{localError}</p>}
      {error && !localError && <p className="text-red-500 text-xs mt-1 text-right">{error}</p>}
    </div>
  )
}
