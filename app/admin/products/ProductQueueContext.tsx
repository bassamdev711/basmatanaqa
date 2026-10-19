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

const STORAGE_KEY = 'basmatanaqa_product_upload_queue';

// Helper to upload with retry and network tolerance
async function uploadWithRetry(fileUrl: string, maxRetries = 3): Promise<string> {
  // If already uploaded (https://), return as is
  if (fileUrl.startsWith('https://')) return fileUrl;

  let lastError: any = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // Fetch blob from local object URL
      const response = await fetch(fileUrl);
      const blob = await response.blob();
      const file = new File([blob], `product-photo-${Date.now()}.webp`, { type: blob.type || 'image/webp' });

      // Compress client side
      const compressed = await compressImageClientSide(file);

      const formData = new FormData();
      formData.append('file', compressed);

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || `Upload failed with status ${res.status}`);
      }

      const data = await res.json();
      if (!data.url) throw new Error('No URL returned from upload API');

      return data.url;
    } catch (err) {
      lastError = err;
      console.warn(`[Queue Upload] Attempt ${attempt} failed:`, err);
      // Wait before retry (1s, 2s, 3s)
      if (attempt < maxRetries) {
        await new Promise((r) => setTimeout(r, attempt * 1000));
      }
    }
  }

  throw lastError || new Error('فشل رفع الصورة بعد عدة محاولات');
}

export function ProductQueueProvider({ children }: { children: React.ReactNode }) {
  const [queue, setQueue] = useState<QueueProductItem[]>([]);
  const isProcessingRef = useRef(false);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          // Reset any 'processing' items back to 'pending'
          const normalized = parsed.map((item) => ({
            ...item,
            status: item.status === 'processing' ? 'pending' : item.status,
          }));
          setQueue(normalized);
        }
      }
    } catch (err) {
      console.error('Failed to parse product queue from storage:', err);
    }
  }, []);

  // Save to localStorage whenever queue changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
    } catch (err) {
      console.error('Failed to save product queue to storage:', err);
    }
  }, [queue]);

  // Main Queue Processor Loop
  useEffect(() => {
    const processNext = async () => {
      if (isProcessingRef.current) return;

      // Find first pending item
      const nextItem = queue.find((q) => q.status === 'pending');
      if (!nextItem) return;

      isProcessingRef.current = true;

      // Mark as processing
      setQueue((prev) =>
        prev.map((item) => (item.id === nextItem.id ? { ...item, status: 'processing' } : item))
      );

      try {
        // 1. Upload Main Image if needed
        let uploadedMainUrl: string | null = null;
        if (nextItem.mainImageFileUrl) {
          uploadedMainUrl = await uploadWithRetry(nextItem.mainImageFileUrl, 3);
        }

        // 2. Upload Extra Images if needed
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
          supplierId: nextItem.supplierId,
          description: nextItem.description,
          imageUrl: uploadedMainUrl,
          images: uploadedExtraUrls,
          sku: nextItem.sku,
          hasSizes: nextItem.hasSizes,
          availableSizes: nextItem.availableSizes,
          seoSearchPhrases: nextItem.seoSearchPhrases,
          seoScore: nextItem.seoScore,
          isActive: nextItem.isActive,
        });

        if (res.success) {
          setQueue((prev) =>
            prev.map((item) =>
              item.id === nextItem.id
                ? {
                    ...item,
                    status: 'success',
                    mainImageFileUrl: uploadedMainUrl || item.mainImageFileUrl,
                  }
                : item
            )
          );
          toast.success(`تم حفظ "${nextItem.name}" بنجاح في الخلفية!`, { duration: 4000 });
        } else {
          throw new Error(res.error || 'فشل حفظ المنتج في قاعدة البيانات');
        }
      } catch (err: any) {
        console.error('Queue processing error:', err);
        setQueue((prev) =>
          prev.map((item) =>
            item.id === nextItem.id
              ? {
                  ...item,
                  status: 'error',
                  errorMessage: err.message || 'حدث خطأ غير متوقع أثناء المعالجة',
                  retryCount: item.retryCount + 1,
                }
              : item
          )
        );
        toast.error(`تعذر حفظ "${nextItem.name}": ${err.message || 'خطأ في الاتصال'}`, { duration: 5000 });
      } finally {
        isProcessingRef.current = false;
      }
    };

    const interval = setInterval(processNext, 1000);
    return () => clearInterval(interval);
  }, [queue]);

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
