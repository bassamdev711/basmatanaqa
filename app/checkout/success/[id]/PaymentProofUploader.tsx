'use client'

import React, { useState, useRef } from 'react'
import { UploadCloud, CheckCircle2, AlertCircle, Image as ImageIcon } from 'lucide-react'
import { compressImageClientSide } from '@/lib/compress'

export default function PaymentProofUploader({ orderId, uploadToken }: { orderId: string, uploadToken: string }) {
  const [file, setFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
      setError('')
    }
  }

  const handleUpload = async () => {
    if (!file) {
      setError('الرجاء اختيار صورة الإيصال أولاً.')
      return
    }

    setIsUploading(true)
    setError('')

    try {
      const compressedFile = await compressImageClientSide(file)
      const uploadFormData = new FormData()
      uploadFormData.append('file', compressedFile)
      uploadFormData.append('orderId', orderId)
      uploadFormData.append('uploadToken', uploadToken)

      const uploadRes = await fetch('/api/upload', {
        method: 'POST',
        body: uploadFormData,
      })

      if (!uploadRes.ok) {
        const errorData = await uploadRes.json()
        throw new Error(errorData.error || 'حدث خطأ أثناء رفع الصورة.')
      }

      setSuccess(true)
    } catch (err: any) {
      setError(err.message || 'فشل رفع الإيصال. يرجى المحاولة مرة أخرى.')
    } finally {
      setIsUploading(false)
    }
  }

  if (success) {
    return (
      <div className="bg-green-50 border border-green-200 text-green-800 p-6 rounded-lg text-center mt-8">
        <CheckCircle2 className="w-12 h-12 text-green-600 mx-auto mb-3" />
        <h3 className="text-lg font-bold mb-1">تم إرفاق الإيصال بنجاح!</h3>
        <p className="text-sm">شكراً لك، سيتم مراجعة طلبك في أقرب وقت.</p>
      </div>
    )
  }

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-lg p-6 mt-8 text-right">
      <div className="flex items-start gap-3 mb-4 text-amber-800">
        <AlertCircle className="w-6 h-6 shrink-0 mt-0.5 text-amber-600" />
        <div>
          <h3 className="font-bold text-lg mb-1">لم يتم إرفاق إيصال الدفع!</h3>
          <p className="text-sm">لقد تم إنشاء طلبك، ولكن حدثت مشكلة أثناء رفع صورة الإيصال. يرجى إعادة رفع الإيصال الآن ليتم تأكيد طلبك.</p>
        </div>
      </div>

      <div className="bg-white p-4 rounded-md border border-amber-100 mb-4">
        <div 
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-gray-300 hover:border-brand bg-gray-50 p-6 flex flex-col items-center justify-center cursor-pointer transition-all duration-300 rounded-md"
        >
          {file ? (
            <>
              <ImageIcon className="w-8 h-8 mb-2 text-brand" />
              <p className="text-sm font-bold text-gray-900 text-center">{file.name}</p>
            </>
          ) : (
            <>
              <UploadCloud className="w-8 h-8 mb-2 text-gray-400 group-hover:text-brand" />
              <p className="text-sm font-bold text-gray-700 text-center mb-1">
                اضغط لاختيار صورة الإيصال
              </p>
              <p className="text-xs text-gray-500">JPG, PNG، أقصى حجم 5MB</p>
            </>
          )}
        </div>
        <input 
          type="file" 
          accept="image/jpeg, image/png, image/webp" 
          className="hidden" 
          ref={fileInputRef}
          onChange={handleFileChange}
        />
        {error && (
          <p className="text-red-500 text-sm font-bold mt-3 text-center">{error}</p>
        )}
      </div>

      <button 
        onClick={handleUpload}
        disabled={isUploading || !file}
        className="btn w-full btn-primary font-bold disabled:opacity-50"
      >
        {isUploading ? 'جاري الرفع...' : 'تأكيد وإرفاق الإيصال'}
      </button>
    </div>
  )
}
