import { getMainCategories } from './actions'
import Link from 'next/link'
import { Plus } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function CategoriesPage() {
  const categories = await getMainCategories()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">إدارة التصنيفات والمجموعات</h1>
        <Link href="/admin/categories/new" className="btn btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> إضافة مجموعة رئيسية
        </Link>
      </div>

      <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
        {categories.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            لا توجد مجموعات رئيسية حالياً. ابدأ بإنشاء واحدة.
          </div>
        ) : (
          <ul className="divide-y divide-gray-200">
            {categories.map((category) => (
              <li key={category.id} className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-gray-900">{category.name}</h3>
                  <div className="flex gap-2">
                    <Link href={`/admin/categories/${category.id}/sub/new`} className="btn btn-sm btn-secondary">
                      + مجموعة فرعية
                    </Link>
                  </div>
                </div>
                {category.subCategories.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {category.subCategories.map((sub) => (
                      <div key={sub.id} className="bg-gray-50 border rounded p-3 text-sm flex justify-between items-center">
                        <span className="font-medium text-gray-700">{sub.name}</span>
                        {/* Could add edit/delete here later */}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">لا توجد مجموعات فرعية</p>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
