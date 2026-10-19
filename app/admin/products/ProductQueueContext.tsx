'use client';

import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { createProductAsync } from './actions';
import { compressImageClientSide } from '@/lib/compress';
import { toast } from 'react-hot-toast';

export type QueueProductItem = {
  id: string; // client temporary ID
  name: string;
  slug?: string;
  price: number;
  stock?: number;
  compareAtPrice?: number | null;
  costPrice?: number | null;
  collectionId?: string | null;
  subCategoryId?: string | null;
  subCategoryIds?: string[];
  supplierId?: string | null;
  description?: string | null;
  // Raw images to upload or already uploaded URLs
  mainImageFileUrl?: string; // either blob: URL or uploaded https:// URL
  extraImageFileUrls?: string[];
  sku?: string | null;
  hasSizes?: boolean;
  availableSizes?: string[];
  seoSearchPhrases?: string[];
  seoScore?: number | null;
  isActive?: boolean;

  // Queue Status
  status: 'pending' | 'processing' | 'success' | 'error';
  errorMessage?: string;
  retryCount: number;
  createdAt: number;
};

interface ProductQueueContextType {
  queue: QueueProductItem[];
  addToQueue: (product: Omit<QueueProductItem, 'id' | 'status' | 'retryCount' | 'createdAt'>) => string;
  retryItem: (id: string) => void;
  removeItem: (id: string) => void;
  clearCompleted: () => void;
  isProcessing: boolean;
}

const ProductQueueContext = createContext<ProductQueueContextType | null>(null);

// Upload helper with retries and detailed logging
async function uploadWithRetry(fileUrl: string, maxRetries = 3): Promise<string> {
  // If already uploaded (https://), return as is
  if (fileUrl.startsWith('https://')) return fileUrl;

  let lastError: any = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // Fetch blob from local object URL
      const response = await fetch(fileUrl);
      if (!response.ok) {
        throw new Error('تعذر قراءة ملف الصورة من الذاكرة المحلية (قد تكون الجلسة انتهت)');
      }
      const blob = await response.blob();
      const file = new File([blob], `product-photo-${Date.now()}.webp`, { type: blob.type || 'image/webp' });

      // Compress client side
      let compressedFile = file;
      try {
        compressedFile = await compressImageClientSide(file);
      } catch (cErr) {
        console.warn('Client compression fallback to original file:', cErr);
      }

      const formData = new FormData();
      formData.append('file', compressedFile);

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || `خطأ في خادم الرفع (${res.status})`);
      }

      const data = await res.json();
      if (!data.url) throw new Error('لم يرجع خادم التخزين رابط الصورة');

      return data.url;
    } catch (err: any) {
      lastError = err;
      console.warn(`[Queue Upload] Attempt ${attempt} failed:`, err);
      if (attempt < maxRetries) {
        await new Promise((r) => setTimeout(r, attempt * 1000));
      }
    }
  }

  throw lastError || new Error('فشل رفع الصورة بعد عدة محاولات');
}

export function ProductQueueProvider({ children }: { children: React.ReactNode }) {
  const [queue, setQueue] = useState<QueueProductItem[]>([]);
  const queueRef = useRef<QueueProductItem[]>([]);
  const isProcessingRef = useRef(false);

  // Keep queueRef always in sync with state
  useEffect(() => {
    queueRef.current = queue;
  }, [queue]);

  // Main Queue Processor Loop - runs independently via interval
  useEffect(() => {
    const processNext = async () => {
      if (isProcessingRef.current) return;

      // Find first pending item from the ref
      const currentList = queueRef.current;
      const nextItem = currentList.find((q) => q.status === 'pending');
      if (!nextItem) return;

      isProcessingRef.current = true;

      // Mark item as processing
      setQueue((prev) =>
        prev.map((item) => (item.id === nextItem.id ? { ...item, status: 'processing', errorMessage: undefined } : item))
      );

      try {
        // 1. Upload Main Image
        let uploadedMainUrl: string | null = null;
        if (nextItem.mainImageFileUrl) {
          uploadedMainUrl = await uploadWithRetry(nextItem.mainImageFileUrl, 3);
        }

        // 2. Upload Extra Images
        let uploadedExtraUrls: string[] = [];
        if (nextItem.extraImageFileUrls && nextItem.extraImageFileUrls.length > 0) {
          for (const extraUrl of nextItem.extraImageFileUrls) {
            const url = await uploadWithRetry(extraUrl, 3);
            uploadedExtraUrls.push(url);
          }
        }

        // 3. Save Product to Database via Server Action
        const res = await createProductAsync({
          name: nextItem.name,
          slug: nextItem.slug,
          price: nextItem.price,
          stock: nextItem.stock,
          compareAtPrice: nextItem.compareAtPrice,
          costPrice: nextItem.costPrice,
          collectionId: nextItem.collectionId,
          subCategoryId: nextItem.subCategoryId,
          subCategoryIds: nextItem.subCategoryIds,
          supplierId: nextItem.supplierId,
          description: nextItem.description,
          imageUrl: uploadedMainUrl,
          images: uploadedExtraUrls,
          sku: nextItem.sku,
          hasSizes: nextItem.hasSizes,
          availableSizes: nextItem.availableSizes,
          seoSearchPhrases: nextItem.seoSearchPhrases,
          seoScore: nextItem.seoScore,
          isActive: nextItem.isActive ?? true,
        });

        if (res.success) {
          setQueue((prev) =>
            prev.map((item) =>
              item.id === nextItem.id
                ? {
                    ...item,
                    status: 'success',
                    mainImageFileUrl: uploadedMainUrl || item.mainImageFileUrl,
                    extraImageFileUrls: uploadedExtraUrls,
                  }
                : item
            )
          );
          toast.success(`✅ تم حفظ "${nextItem.name}" بنجاح!`, { duration: 4000 });
        } else {
          throw new Error(res.error || 'فشل حفظ المنتج في قاعدة البيانات');
        }
      } catch (err: any) {
        console.error('Queue processing error:', err);
        const errMsg = err.message || 'حدث خطأ غير متوقع أثناء المعالجة';
        setQueue((prev) =>
          prev.map((item) =>
            item.id === nextItem.id
              ? {
                  ...item,
                  status: 'error',
                  errorMessage: errMsg,
                  retryCount: item.retryCount + 1,
                }
              : item
          )
        );
        toast.error(`تعذر حفظ "${nextItem.name}": ${errMsg}`, { duration: 5000 });
      } finally {
        isProcessingRef.current = false;
      }
    };

    const interval = setInterval(processNext, 800);
    return () => clearInterval(interval);
  }, []);

  const addToQueue = (
    product: Omit<QueueProductItem, 'id' | 'status' | 'retryCount' | 'createdAt'>
  ): string => {
    const id = `item_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const newItem: QueueProductItem = {
      ...product,
      id,
      status: 'pending',
      retryCount: 0,
      createdAt: Date.now(),
    };

    setQueue((prev) => [...prev, newItem]);
    return id;
  };

  const retryItem = (id: string) => {
    setQueue((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, status: 'pending', errorMessage: undefined } : item
      )
    );
  };

  const removeItem = (id: string) => {
    setQueue((prev) => prev.filter((item) => item.id !== id));
  };

  const clearCompleted = () => {
    setQueue((prev) => prev.filter((item) => item.status !== 'success'));
  };

  return (
    <ProductQueueContext.Provider
      value={{
        queue,
        addToQueue,
        retryItem,
        removeItem,
        clearCompleted,
        isProcessing: isProcessingRef.current,
      }}
    >
      {children}
    </ProductQueueContext.Provider>
  );
}

export function useProductQueue() {
  const ctx = useContext(ProductQueueContext);
  if (!ctx) {
    throw new Error('useProductQueue must be used within ProductQueueProvider');
  }
  return ctx;
}
