'use client';

import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { prepareImageForUpload } from '@/lib/compress';
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
  mainImageFile?: File | null;
  mainImageFileUrl?: string; // either blob: URL or uploaded https:// URL
  extraImageFiles?: File[];
  extraImageFileUrls?: string[];
  sku?: string | null;
  hasSizes?: boolean;
  availableSizes?: string[];
  seoSearchPhrases?: string[];
  seoScore?: number | null;
  isActive?: boolean;

  // Upload progress cache: images already uploaded are never re-uploaded on retry
  uploadedMainUrl?: string;
  uploadedExtraUrls?: (string | null)[];

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

const UPLOAD_TIMEOUT_MS = 90_000;

/** خطأ لا فائدة من إعادة المحاولة فيه (صورة تالفة، صيغة غير مدعومة، حصة التخزين...) */
class PermanentUploadError extends Error {}

/** يحول مصدر الصورة (ملف أو رابط blob محلي) إلى ملف جاهز ومضغوط وسليم للرفع */
async function resolveAndPrepare(source: File | string): Promise<File> {
  let file: File;
  if (source instanceof File) {
    file = source;
  } else {
    try {
      const response = await fetch(source);
      const blob = await response.blob();
      file = new File([blob], `product-photo-${Date.now()}.jpg`, { type: blob.type || 'image/jpeg' });
    } catch {
      throw new PermanentUploadError('تعذر قراءة ملف الصورة من الذاكرة المؤقتة، يرجى إعادة اختيارها');
    }
  }

  try {
    return await prepareImageForUpload(file);
  } catch {
    return file;
  }
}

/** يرفع ملفاً جاهزاً مع إعادة المحاولة عند أخطاء الشبكة/الخادم فقط */
async function uploadPreparedFile(file: File, maxRetries = 3): Promise<string> {
  let lastError: any = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), UPLOAD_TIMEOUT_MS);
    try {
      const formData = new FormData();
      formData.append('file', file, file.name || 'photo.webp');

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
        credentials: 'include',
        signal: controller.signal,
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({} as any));
        const msg = errJson.error || `خطأ في خادم الرفع (${res.status})`;
        // أخطاء 4xx (عدا المهلة/الضغط) لن تُحل بإعادة المحاولة
        if (res.status >= 400 && res.status < 500 && res.status !== 408 && res.status !== 429) {
          throw new PermanentUploadError(msg);
        }
        throw new Error(msg);
      }

      const data = await res.json();
      if (!data?.url || typeof data.url !== 'string' || !data.url.startsWith('https://')) {
        throw new Error('لم يرجع خادم التخزين رابط صورة صالح');
      }
      return data.url;
    } catch (err: any) {
      if (err instanceof PermanentUploadError) throw err;
      lastError = err?.name === 'AbortError' ? new Error('انتهت مهلة رفع الصورة (اتصال بطيء)') : err;
      console.warn(`[Queue Upload] Attempt ${attempt} failed:`, err);
      if (attempt < maxRetries) {
        await new Promise((r) => setTimeout(r, attempt * 1500));
      }
    } finally {
      clearTimeout(timer);
    }
  }

  throw lastError || new Error('فشل رفع الصورة بعد عدة محاولات');
}

/** يرفع صورة واحدة: إن كانت مرفوعة مسبقاً (https) تُعاد كما هي */
async function uploadImage(source: File | string): Promise<string> {
  if (typeof source === 'string' && source.startsWith('https://')) return source;
  const prepared = await resolveAndPrepare(source);
  return uploadPreparedFile(prepared, 3);
}

export function ProductQueueProvider({ children }: { children: React.ReactNode }) {
  const [queue, setQueue] = useState<QueueProductItem[]>([]);
  const queueRef = useRef<QueueProductItem[]>([]);
  const isProcessingRef = useRef(false);

  // Keep queueRef always in sync with state
  useEffect(() => {
    queueRef.current = queue;
  }, [queue]);

  // تحذير قبل إغلاق/تحديث الصفحة إذا كانت هناك منتجات لم تُحفظ بعد
  useEffect(() => {
    const hasUnsaved = queue.some((q) => q.status === 'pending' || q.status === 'processing');
    if (!hasUnsaved) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [queue]);

  // Main Queue Processor Loop - runs independently via interval
  useEffect(() => {
    const patchItem = (id: string, patch: Partial<QueueProductItem>) => {
      setQueue((prev) => prev.map((item) => (item.id === id ? { ...item, ...patch } : item)));
      // تحديث المرجع فوراً حتى لا تضيع حالة التقدم قبل إعادة الرسم
      queueRef.current = queueRef.current.map((item) => (item.id === id ? { ...item, ...patch } : item));
    };

    const processNext = async () => {
      if (isProcessingRef.current) return;

      // Find first pending item from the ref
      const currentList = queueRef.current;
      const nextItem = currentList.find((q) => q.status === 'pending');
      if (!nextItem) return;

      isProcessingRef.current = true;

      // Mark item as processing
      patchItem(nextItem.id, { status: 'processing', errorMessage: undefined });

      try {
        // 1. Upload Main Image (skipped if already uploaded in a previous attempt)
        let uploadedMainUrl: string | null = nextItem.uploadedMainUrl || null;
        if (!uploadedMainUrl) {
          const mainSource = nextItem.mainImageFile || nextItem.mainImageFileUrl;
          if (mainSource) {
            try {
              uploadedMainUrl = await uploadImage(mainSource);
            } catch (err: any) {
              throw new Error(`الصورة الأساسية: ${err?.message || 'فشل الرفع'}`);
            }
            patchItem(nextItem.id, { uploadedMainUrl });
          }
        }

        // 2. Upload Extra Images — كل صورة يجب أن تُرفع بنجاح، ولا يُنشأ المنتج بصور ناقصة
        const extraSources: (File | string)[] =
          nextItem.extraImageFiles && nextItem.extraImageFiles.length > 0
            ? nextItem.extraImageFiles
            : nextItem.extraImageFileUrls || [];
        const uploadedExtras: (string | null)[] = extraSources.map((_, i) => nextItem.uploadedExtraUrls?.[i] || null);

        for (let i = 0; i < extraSources.length; i++) {
          if (uploadedExtras[i]) continue;
          try {
            uploadedExtras[i] = await uploadImage(extraSources[i]);
          } catch (err: any) {
            throw new Error(`الصورة الإضافية رقم ${i + 1}: ${err?.message || 'فشل الرفع'}`);
          }
          patchItem(nextItem.id, { uploadedExtraUrls: [...uploadedExtras] });
        }
        const uploadedExtraUrls = uploadedExtras.filter((u): u is string => !!u);

        // 3. Save Product to Database via API route (NOT a Server Action):
        // Server Actions with revalidatePath force a router refresh of the open page,
        // which interrupted the bulk upload form after the first product.
        const saveRes = await fetch('/api/admin/products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
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
          }),
        });
        const res: { success: boolean; error?: string } = await saveRes
          .json()
          .catch(() => ({ success: false, error: `خطأ في الخادم (${saveRes.status})` }));

        if (res.success) {
          // نحرر ملفات الصور من الذاكرة بعد النجاح (مهم عند رفع عشرات المنتجات من الهاتف)
          patchItem(nextItem.id, {
            status: 'success',
            mainImageFile: null,
            extraImageFiles: undefined,
            mainImageFileUrl: uploadedMainUrl || nextItem.mainImageFileUrl,
            extraImageFileUrls: uploadedExtraUrls,
          });
          toast.success(`تم حفظ "${nextItem.name}" بنجاح`, { duration: 4000 });
        } else {
          throw new Error(res.error || 'فشل حفظ المنتج في قاعدة البيانات');
        }
      } catch (err: any) {
        console.error('Queue processing error:', err);
        const errMsg = err.message || 'حدث خطأ غير متوقع أثناء المعالجة';
        const current = queueRef.current.find((q) => q.id === nextItem.id);
        patchItem(nextItem.id, {
          status: 'error',
          errorMessage: errMsg,
          retryCount: (current?.retryCount ?? nextItem.retryCount) + 1,
        });
        toast.error(`تعذر حفظ "${nextItem.name}": ${errMsg}`, { duration: 6000 });
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
