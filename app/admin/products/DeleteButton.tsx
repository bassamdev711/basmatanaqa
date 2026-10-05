'use client'

import { useToast } from '@/components/ToastProvider'
import { useConfirm } from '@/components/ConfirmProvider'

import { useState } from 'react'
import { Trash2 } from 'lucide-react'
import { deleteProduct } from './actions'

export default function DeleteButton({
  id }: { id: string }) {
  const { showToast } = useToast()
  const { confirm } = useConfirm()
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    if (await confirm({ message: 'هل أنت متأكد من حذف هذا المنتج؟', danger: true })) {
      setIsDeleting(true)
      try {
        await deleteProduct(id)
      } catch (error) {
        console.error(error)
        showToast('error', 'حدث خطأ أثناء الحذف')
        setIsDeleting(false)
      }
    }
  }

  return (
    <button
      onClick={handleDelete}
      disabled={isDeleting}
      className="text-red-600 hover:text-red-900 disabled:opacity-50"
      title="حذف المنتج"
    >
      <Trash2 className="w-4 h-4" />
    </button>
  )
}
