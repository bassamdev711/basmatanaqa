'use client';

import React, { useState, useEffect, useTransition } from 'react';
import Image from 'next/image';
import {
  Link2,
  X,
  Search,
  CheckSquare,
  Square,
  Loader2,
  AlertCircle,
  Check,
  ChevronDown,
} from 'lucide-react';
import { getCompletelyUnassignedProducts, bulkAssignProductsToCollection } from './actions';
import { useToast } from '@/components/ToastProvider';

type ProductItem = {
  id: string;
  name: string;
  price: number;
  imageUrl: string | null;
  stock: number;
};

interface CollectionBulkAssignModalProps {
  collection: {
    id: string;
    name: string;
  };
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function CollectionBulkAssignModal({
  collection,
  isOpen,
  onClose,
  onSuccess,
}: CollectionBulkAssignModalProps) {
  const { showToast } = useToast();
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [totalCount, setTotalCount] = useState(0);

  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isAssigning, startAssignTransition] = useTransition();

  // Load initial products when modal opens or search changes
  useEffect(() => {
    if (!isOpen) {
      setProducts([]);
      setSelectedIds(new Set());
      setSearch('');
      setPage(1);
      return;
    }

    const timer = setTimeout(() => {
      fetchProducts(1, search, false);
    }, 250);

    return () => clearTimeout(timer);
  }, [isOpen, search]);

  const fetchProducts = async (pageToFetch: number, query: string, append: boolean) => {
    if (append) {
      setIsLoadingMore(true);
    } else {
      setIsLoading(true);
    }

    try {
      const res = await getCompletelyUnassignedProducts({
        page: pageToFetch,
        limit: 20,
        search: query,
      });

      if (append) {
        setProducts((prev) => [...prev, ...res.products]);
      } else {
        setProducts(res.products);
      }
      setHasMore(res.hasMore);
      setTotalCount(res.totalCount);
      setPage(pageToFetch);
    } catch (err) {
      console.error('Failed to load unassigned products:', err);
      showToast('error', 'فشل في تحميل المنتجات');
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  };

  const handleLoadMore = () => {
    if (isLoadingMore || !hasMore) return;
    fetchProducts(page + 1, search, true);
  };

  const toggleSelectOne = (id: string) => {
    const updated = new Set(selectedIds);
    if (updated.has(id)) {
      updated.delete(id);
    } else {
      updated.add(id);
    }
    setSelectedIds(updated);
  };

  const toggleSelectAllVisible = () => {
    const allVisibleSelected = products.length > 0 && products.every((p) => selectedIds.has(p.id));
    const updated = new Set(selectedIds);

    if (allVisibleSelected) {
      // Unselect visible
      products.forEach((p) => updated.delete(p.id));
    } else {
      // Select all visible
      products.forEach((p) => updated.add(p.id));
    }
    setSelectedIds(updated);
  };

  const handleConfirmAssign = () => {
    if (selectedIds.size === 0) {
      showToast('error', 'يرجى تحديد منتج واحد على الأقل للربط');
      return;
    }

    startAssignTransition(async () => {
      const res = await bulkAssignProductsToCollection({
        productIds: Array.from(selectedIds),
        collectionId: collection.id,
      });

      if (res.success) {
        showToast('success', `تم ربط ${res.count} منتج بالمجموعة الرئيسية "${collection.name}" بنجاح!`);
        onSuccess();
        onClose();
      } else {
        showToast('error', res.error || 'حدث خطأ أثناء ربط المنتجات');
      }
    });
  };

  if (!isOpen) return null;

  const allVisibleSelected = products.length > 0 && products.every((p) => selectedIds.has(p.id));

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[110] flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-2xl flex flex-col max-h-[92vh] overflow-hidden text-right"
        dir="rtl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-gray-50/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold">
              <Link2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-gray-900">ربط منتجات بالمجموعة الرئيسية</h3>
              </div>
              <p className="text-xs text-gray-500 mt-0.5">
                المجموعة المستهدفة: <span className="font-bold text-gray-800">{collection.name}</span>
                {totalCount > 0 && (
                  <span className="text-amber-600 font-semibold mr-1.5">
                    • ({totalCount} منتج غير مرتبط بأي مجموعة رئيسية)
                  </span>
                )}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isAssigning}
            className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toolbar: Search & Select All */}
        <div className="p-3.5 border-b border-gray-100 bg-white flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center justify-between">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="ابحث عن منتج بدون مجموعة..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pr-9 pl-4 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          {/* Quick Select Buttons */}
          <div className="flex items-center justify-between sm:justify-end gap-2">
            <button
              type="button"
              onClick={toggleSelectAllVisible}
              disabled={products.length === 0}
              className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-700 transition-colors disabled:opacity-50"
            >
              {allVisibleSelected ? (
                <>
                  <Square className="w-3.5 h-3.5 text-blue-600" />
                  <span>إلغاء تحديد المعروض</span>
                </>
              ) : (
                <>
                  <CheckSquare className="w-3.5 h-3.5 text-blue-600" />
                  <span>تحديد كل المعروض</span>
                </>
              )}
            </button>

            <span className="text-xs font-bold bg-gray-100 text-gray-800 px-2.5 py-1.5 rounded-lg">
              المحدد: <strong className="text-blue-700 font-black">{selectedIds.size}</strong>
            </span>
          </div>
        </div>

        {/* Products List Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2 divide-y divide-gray-50">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400 gap-2">
              <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
              <span className="text-xs">جاري تحميل المنتجات غير المصنفة...</span>
            </div>
          ) : products.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-14 text-center">
              <AlertCircle className="w-10 h-10 text-gray-300 mb-2" />
              <p className="text-sm font-bold text-gray-700">لا توجد منتجات بدون مجموعة رئيسية</p>
              <p className="text-xs text-gray-400 mt-1 max-w-sm">
                {search
                  ? 'لم يتم العثور على منتجات مطابقة لكلمة البحث.'
                  : 'جميع المنتجات المتوفرة في المتجر تم ربطها بمجموعات رئيسية بالفعل.'}
              </p>
            </div>
          ) : (
            <>
              {products.map((product) => {
                const isSelected = selectedIds.has(product.id);
                return (
                  <div
                    key={product.id}
                    onClick={() => toggleSelectOne(product.id)}
                    className={`flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50/40 shadow-sm'
                        : 'border-gray-100 hover:border-gray-300 hover:bg-gray-50/70'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {/* Checkbox */}
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => {}} // Handled by container
                        className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-gray-300 cursor-pointer pointer-events-none"
                      />

                      {/* Image */}
                      <div className="w-11 h-11 relative rounded-lg overflow-hidden bg-gray-100 shrink-0 border border-gray-200">
                        {product.imageUrl ? (
                          <Image
                            src={product.imageUrl}
                            alt={product.name}
                            fill
                            className="object-cover"
                            sizes="44px"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[10px] text-gray-400 font-bold">
                            بدون
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-gray-900 truncate">{product.name}</p>
                        <div className="flex items-center gap-2 mt-0.5 text-[11px] text-gray-500">
                          <span className="font-semibold text-blue-700" dir="ltr">
                            {product.price.toFixed(2)} ر.س
                          </span>
                          <span>•</span>
                          <span>المخزون: {product.stock}</span>
                        </div>
                      </div>
                    </div>

                    {/* Status Badge */}
                    <div className="shrink-0 mr-2">
                      {isSelected ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-md">
                          <Check className="w-3 h-3" /> محدد
                        </span>
                      ) : (
                        <span className="text-[11px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md font-medium">
                          غير مرتبط
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Show More Button */}
              {hasMore && (
                <div className="pt-3 pb-1 text-center">
                  <button
                    type="button"
                    onClick={handleLoadMore}
                    disabled={isLoadingMore}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold rounded-lg transition-colors disabled:opacity-50"
                  >
                    {isLoadingMore ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" />
                        <span>جاري تحميل 20 منتج إضافية...</span>
                      </>
                    ) : (
                      <>
                        <ChevronDown className="w-3.5 h-3.5" />
                        <span>إظهار المزيد (20 منتج إضافية)</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 bg-gray-50/80 border-t border-gray-100 flex items-center justify-between">
          <div className="text-xs text-gray-600">
            {selectedIds.size > 0 ? (
              <span>
                سيتم ضم <strong className="text-blue-700 font-bold">{selectedIds.size}</strong> منتج إلى
                المجموعة: <strong>&quot;{collection.name}&quot;</strong>
              </span>
            ) : (
              <span>حدد المنتجات التي تريد ضمها لهذه المجموعة</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isAssigning}
              className="px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
            >
              إلغاء
            </button>
            <button
              type="button"
              onClick={handleConfirmAssign}
              disabled={isAssigning || selectedIds.size === 0}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-sm disabled:opacity-50 transition-colors"
            >
              {isAssigning ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>جاري الربط...</span>
                </>
              ) : (
                <>
                  <Link2 className="w-4 h-4" />
                  <span>ضم المنتجات المحددة ({selectedIds.size})</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
