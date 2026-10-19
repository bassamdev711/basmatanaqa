'use client';

import React, { useState, useTransition } from 'react';
import { Layers, Check, X, Loader2, AlertCircle } from 'lucide-react';
import { quickUpdateProductSubCategory } from './actions';

type SubCategoryItem = {
  id: string;
  name: string;
  collectionId: string;
};

interface SubCategoryAssignButtonProps {
  productId: string;
  productName: string;
  collection: { id: string; name: string } | null | undefined;
  currentSubCategory: { id: string; name: string } | null | undefined;
  availableSubCategories: SubCategoryItem[];
}

export default function SubCategoryAssignButton({
  productId,
  productName,
  collection,
  currentSubCategory,
  availableSubCategories,
}: SubCategoryAssignButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedSubId, setSelectedSubId] = useState<string>(currentSubCategory?.id || '');
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Filter subcategories that belong to the product's main collection
  const relevantSubCategories = collection
    ? availableSubCategories.filter((sub) => sub.collectionId === collection.id)
    : [];

  const handleOpen = () => {
    setSelectedSubId(currentSubCategory?.id || '');
    setError(null);
    setSuccessMsg(null);
    setIsOpen(true);
  };

  const handleClose = () => {
    if (isPending) return;
    setIsOpen(false);
  };

  const handleConfirm = () => {
    setError(null);
    setSuccessMsg(null);

    startTransition(async () => {
      try {
        const res = await quickUpdateProductSubCategory(
          productId,
          selectedSubId ? selectedSubId : null
        );
        if (res.success) {
          setSuccessMsg('تم التحديث بنجاح!');
          setTimeout(() => {
            setIsOpen(false);
          }, 800);
        } else {
          setError(res.error || 'حدث خطأ أثناء التحديث');
        }
      } catch (err: any) {
        setError(err.message || 'حدث خطأ غير متوقع');
      }
    });
  };

  return (
    <>
      {/* Table Cell Button */}
      <button
        type="button"
        onClick={handleOpen}
        className={`group inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium border transition-all text-right max-w-[170px] ${
          currentSubCategory
            ? 'bg-amber-50 text-amber-900 border-amber-200 hover:bg-amber-100 hover:border-amber-300'
            : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-300'
        }`}
        title="تحديد المجموعة الفرعية"
      >
        <Layers className={`w-3.5 h-3.5 shrink-0 ${currentSubCategory ? 'text-amber-600' : 'text-gray-400 group-hover:text-indigo-600'}`} />
        <span className="truncate">
          {currentSubCategory ? currentSubCategory.name : 'ربط بمجموعة فرعية'}
        </span>
      </button>

      {/* Modal / Popup */}
      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-150"
          onClick={handleClose}
        >
          <div
            className="bg-white rounded-xl shadow-2xl border border-gray-200 w-full max-w-md overflow-hidden text-right"
            dir="rtl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-gray-50/70">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-900">ربط المجموعة الفرعية</h3>
                  <p className="text-xs text-gray-500 line-clamp-1">{productName}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleClose}
                disabled={isPending}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-md hover:bg-gray-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="p-5 space-y-4">
              {/* Product Collection Info */}
              <div className="bg-gray-50 rounded-lg p-3 text-xs flex items-center justify-between border border-gray-100">
                <span className="text-gray-500">المجموعة الرئيسية:</span>
                <span className="font-bold text-gray-800">
                  {collection ? collection.name : 'غير محددة'}
                </span>
              </div>

              {!collection ? (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>
                    هذا المنتج غير مرتبط بمجموعة رئيسية حتى الآن. يرجى ربطه بمجموعة رئيسية أولاً ليتم تحديد مجموعاته الفرعية.
                  </span>
                </div>
              ) : relevantSubCategories.length === 0 ? (
                <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-600 text-center">
                  لا توجد مجموعات فرعية مضافة للمجموعة الرئيسية &quot;{collection.name}&quot;.
                </div>
              ) : (
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-gray-700">
                    اختر المجموعة الفرعية:
                  </label>
                  <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                    {/* Option: No SubCategory */}
                    <label
                      className={`flex items-center justify-between p-2.5 rounded-lg border cursor-pointer text-xs transition-colors ${
                        selectedSubId === ''
                          ? 'border-indigo-600 bg-indigo-50/50 text-indigo-900 font-bold'
                          : 'border-gray-200 hover:bg-gray-50 text-gray-700'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="subCategory"
                          value=""
                          checked={selectedSubId === ''}
                          onChange={() => setSelectedSubId('')}
                          className="text-indigo-600 focus:ring-indigo-500"
                        />
                        <span>بدون مجموعة فرعية (إلغاء الربط)</span>
                      </div>
                      {selectedSubId === '' && <Check className="w-4 h-4 text-indigo-600" />}
                    </label>

                    {/* SubCategories list */}
                    {relevantSubCategories.map((sub) => {
                      const isSelected = selectedSubId === sub.id;
                      return (
                        <label
                          key={sub.id}
                          className={`flex items-center justify-between p-2.5 rounded-lg border cursor-pointer text-xs transition-colors ${
                            isSelected
                              ? 'border-indigo-600 bg-indigo-50/50 text-indigo-900 font-bold'
                              : 'border-gray-200 hover:bg-gray-50 text-gray-700'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <input
                              type="radio"
                              name="subCategory"
                              value={sub.id}
                              checked={isSelected}
                              onChange={() => setSelectedSubId(sub.id)}
                              className="text-indigo-600 focus:ring-indigo-500"
                            />
                            <span>{sub.name}</span>
                          </div>
                          {isSelected && <Check className="w-4 h-4 text-indigo-600" />}
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Status alerts */}
              {error && (
                <div className="p-2.5 bg-red-50 border border-red-200 rounded-lg text-xs text-red-600 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {successMsg && (
                <div className="p-2.5 bg-green-50 border border-green-200 rounded-lg text-xs text-green-700 flex items-center gap-2">
                  <Check className="w-4 h-4 shrink-0" />
                  <span>{successMsg}</span>
                </div>
              )}
            </div>

            {/* Footer Buttons */}
            <div className="px-5 py-3.5 bg-gray-50/70 border-t border-gray-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={handleClose}
                disabled={isPending}
                className="px-3.5 py-2 text-xs font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                disabled={isPending || !collection}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg shadow-sm disabled:opacity-50 transition-colors"
              >
                {isPending ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>جاري التأكيد...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>تأكيد الربط فورا</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
