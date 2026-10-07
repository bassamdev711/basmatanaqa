import Link from 'next/link'
import { createSubCategory } from '../../../actions'
import { redirect, notFound } from 'next/navigation'
import prisma from '@/lib/prisma'

export default async function NewSubCategoryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: mainCategoryId } = await params
  const mainCategory = await prisma.mainCategory.findUnique({ where: { id: mainCategoryId } })

  if (!mainCategory) {
    notFound()
  }

  async function action(formData: FormData) {
    'use server'
    const name = formData.get('name') as string
    const description = formData.get('description') as string
    
    await createSubCategory({ name, mainCategoryId, description })
    redirect('/admin/categories')
  }

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">إضافة مجموعة فرعية تحت: {mainCategory.name}</h2>
        <Link href="/admin/categories" className="text-sm text-gray-500 hover:text-gray-900">العودة</Link>
      </div>

      <form action={action} className="bg-white shadow-sm rounded-lg border border-gray-200 p-6 space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">اسم المجموعة الفرعية *</label>
          <input 
            type="text" 
            name="name" 
            required 
            placeholder="مثال: أطفال، كبار، رياضي..."
            className="w-full rounded-md border-gray-300 border p-3 text-sm text-gray-900 bg-white focus:border-black focus:outline-none focus:ring-1 focus:ring-black" 
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">وصف (اختياري)</label>
          <textarea 
            name="description" 
            rows={3} 
            className="w-full rounded-md border-gray-300 border p-3 text-sm text-gray-900 bg-white focus:border-black focus:outline-none focus:ring-1 focus:ring-black" 
          />
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <Link href="/admin/categories" className="btn btn-outline">إلغاء</Link>
          <button type="submit" className="btn btn-primary">حفظ المجموعة الفرعية</button>
        </div>
      </form>
    </div>
  )
}
