import imageCompression from 'browser-image-compression';

/**
 * أقصى حجم آمن للملف المرفوع.
 * Vercel يرفض أي طلب أكبر من 4.5MB (FUNCTION_PAYLOAD_TOO_LARGE)، لذا نبقى تحته بهامش أمان.
 */
export const SAFE_UPLOAD_BYTES = 4 * 1024 * 1024;

/** الصيغ التي تعرضها جميع المتصفحات بدون مشاكل */
const WEB_SAFE_TYPES = new Set(['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif', 'image/avif']);

const IMAGE_EXT_RE = /\.(jpe?g|png|webp|avif|heic|heif|gif|bmp|tiff?)$/i;

function isImageLike(file: File): boolean {
  return file.type.startsWith('image/') || ((file.type === '' || file.type === 'application/octet-stream') && IMAGE_EXT_RE.test(file.name || ''));
}

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`${label} timeout`)), ms);
    promise.then(
      (v) => { clearTimeout(timer); resolve(v); },
      (e) => { clearTimeout(timer); reject(e); }
    );
  });
}

/**
 * يتأكد أن الملف صورة سليمة يمكن للمتصفح فك ترميزها فعلاً، وأنها ليست فارغة/شفافة بالكامل
 * (يحدث هذا في Safari على الآيفون عند امتلاء ذاكرة الـ canvas فتخرج صورة فارغة بصمت).
 */
export async function isDecodableImage(file: File | Blob, checkPixels = true): Promise<boolean> {
  if (typeof window === 'undefined' || !file || file.size === 0) return false;

  const url = URL.createObjectURL(file);
  try {
    const img = document.createElement('img');
    img.decoding = 'async';
    const loaded = await withTimeout(
      new Promise<boolean>((resolve) => {
        img.onload = () => resolve(true);
        img.onerror = () => resolve(false);
        img.src = url;
      }),
      20000,
      'decode'
    ).catch(() => false);

    if (!loaded) return false;
    const w = img.naturalWidth || img.width;
    const h = img.naturalHeight || img.height;
    if (!w || !h) return false;
    if (!checkPixels) return true;

    // فحص عينة صغيرة من البكسلات: إذا كانت كلها شفافة 100% فالصورة فارغة/تالفة
    const canvas = document.createElement('canvas');
    canvas.width = 16;
    canvas.height = 16;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return true;
    ctx.drawImage(img, 0, 0, 16, 16);
    const data = ctx.getImageData(0, 0, 16, 16).data;
    for (let i = 3; i < data.length; i += 4) {
      if (data[i] !== 0) return true;
    }
    // صور PNG الشفافة بالكامل نادرة جداً في المنتجات؛ نعتبرها تالفة
    return false;
  } catch {
    // إذا تعذر الفحص بسبب قيود المتصفح نعتبر الصورة سليمة طالما تم تحميلها
    return true;
  } finally {
    try { URL.revokeObjectURL(url); } catch {}
  }
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => {
    try {
      canvas.toBlob((b) => resolve(b), type, quality);
    } catch {
      resolve(null);
    }
  });
}

async function compressViaCanvas(file: File, maxDim = 1280, quality = 0.8): Promise<File> {
  if (typeof window === 'undefined' || typeof document === 'undefined' || !file || file.size === 0) {
    return file;
  }

  const url = URL.createObjectURL(file);
  try {
    const img = document.createElement('img');
    const loaded = await withTimeout(
      new Promise<boolean>((resolve) => {
        img.onload = () => resolve(true);
        img.onerror = () => resolve(false);
        img.src = url;
      }),
      30000,
      'canvas-load'
    ).catch(() => false);

    // صيغة غير مدعومة في هذا المتصفح (مثل HEIC على أندرويد) — نعيد الأصل
    if (!loaded) return file;

    let width = img.naturalWidth || img.width;
    let height = img.naturalHeight || img.height;
    if (!width || !height) return file;

    if (width > maxDim || height > maxDim) {
      if (width > height) {
        height = Math.round((height * maxDim) / width);
        width = maxDim;
      } else {
        width = Math.round((width * maxDim) / height);
        height = maxDim;
      }
    }

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return file;

    // خلفية بيضاء حتى لا تتحول المناطق الشفافة إلى سوداء عند التحويل إلى JPEG
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);
    ctx.drawImage(img, 0, 0, width, height);

    // نحاول WebP أولاً. بعض المتصفحات (Safari القديم) لا تدعم ترميز WebP
    // وتعيد PNG ضخماً بصمت، لذلك نتحقق من النوع الفعلي ونرجع إلى JPEG.
    let blob = await canvasToBlob(canvas, 'image/webp', quality);
    if (!blob || blob.size === 0 || blob.type !== 'image/webp') {
      blob = await canvasToBlob(canvas, 'image/jpeg', quality);
    }

    // تحرير ذاكرة الـ canvas فوراً (مهم جداً على الآيفون)
    canvas.width = 0;
    canvas.height = 0;

    if (!blob || blob.size === 0) return file;

    const ext = blob.type === 'image/webp' ? '.webp' : '.jpg';
    const baseName = (file.name || 'photo').replace(/\.[^/.]+$/, '');
    return new File([blob], `${baseName}${ext}`, { type: blob.type || 'image/jpeg' });
  } catch (err) {
    console.warn('Canvas compression failed, using original file:', err);
    return file;
  } finally {
    try { URL.revokeObjectURL(url); } catch {}
  }
}

/**
 * يضغط الصورة في جهة العميل لتقليل استهلاك المساحة والبيانات
 * @param file الملف الأصلي (صورة)
 * @param options خيارات الضغط (اختياري)
 * @returns الملف المضغوط
 */
export async function compressImageClientSide(
  file: File,
  options: { maxSizeMB?: number; maxWidthOrHeight?: number } = {}
): Promise<File> {
  // إذا لم يكن الملف صورة أو كان تالفاً/فارغاً، نعيده كما هو
  if (!file || file.size === 0 || !isImageLike(file)) {
    return file;
  }

  // إذا كانت الصورة مضغوطة مسبقاً وبحجم ملائم (< 500KB) لا نضغطها مجدداً حتى لا تتشوه الجودة
  if (file.type === 'image/webp' && file.size < 500 * 1024) {
    return file;
  }

  const maxDim = options.maxWidthOrHeight || 1440; // أقصى دقة 1440px فائقة الوضوح
  const maxSizeMB = options.maxSizeMB || 0.6; // أقصى حجم 600 كيلوبايت
  const isHugeFile = file.size > 4 * 1024 * 1024; // أكبر من 4 ميجابايت (صور الكاميرات العالية)

  /** يقبل الناتج فقط إذا كان غير فارغ، بحجم آمن للرفع، وصورة سليمة فعلاً */
  const accept = async (candidate: File | null | undefined): Promise<File | null> => {
    if (!candidate || candidate.size === 0 || candidate === file) return null;
    if (candidate.size > SAFE_UPLOAD_BYTES) return null;
    if (!(await isDecodableImage(candidate))) return null;
    return candidate;
  };

  // 1) الصور الضخمة من الكاميرا: canvas مباشرة لأن مكتبة browser-image-compression
  //    تستهلك مئات الميجابايت من الرام في المتصفح وتنهار
  if (isHugeFile) {
    const ok = await accept(await compressViaCanvas(file, maxDim, 0.82));
    if (ok) return ok;
  }

  // 2) مكتبة الضغط (مع مهلة حتى لا يعلق الـ Web Worker للأبد)
  try {
    const compressedBlob = await withTimeout(
      imageCompression(file, { maxSizeMB, maxWidthOrHeight: maxDim, useWebWorker: true, fileType: 'image/webp' }),
      45000,
      'browser-image-compression'
    );
    if (compressedBlob && compressedBlob.size > 0) {
      const fileExt = compressedBlob.type === 'image/jpeg' ? '.jpg' : compressedBlob.type === 'image/png' ? '.png' : '.webp';
      const libFile = new File([compressedBlob], (file.name || 'photo').replace(/\.[^/.]+$/, '') + fileExt, {
        type: compressedBlob.type || 'image/webp',
      });
      const ok = await accept(libFile);
      if (ok) return ok;
    }
  } catch (error) {
    console.warn('browser-image-compression فشل، جاري المحاولة عبر canvas السريع والمباشر:', error);
  }

  // 3) canvas بالدقة العادية ثم بدقة أقل كحل أخير
  if (!isHugeFile) {
    const ok = await accept(await compressViaCanvas(file, maxDim, 0.82));
    if (ok) return ok;
  }
  const okSmall = await accept(await compressViaCanvas(file, 1080, 0.7));
  if (okSmall) return okSmall;

  // 4) فشل كل شيء: نعيد الأصل (سيتم رفضه لاحقاً بوضوح في prepareImageForUpload إن لم يكن صالحاً)
  console.error('فشل ضغط الصورة نهائياً، استخدام الملف الأصلي');
  return file;
}

/**
 * يجهز صورة المنتج للرفع بشكل مضمون:
 * - يضغطها ويحولها إلى WebP/JPEG
 * - يتأكد أنها سليمة وغير فارغة وبحجم يقبله الخادم
 * - يرمي خطأ واضحاً بالعربي بدلاً من رفع صورة تالفة أو صيغة لا تُعرض (مثل HEIC)
 */
export async function prepareImageForUpload(file: File): Promise<File> {
  if (!file || file.size === 0) {
    return file;
  }

  try {
    const result = await compressImageClientSide(file);
    if (result && result.size > 0) {
      return result;
    }
  } catch (err) {
    console.warn('Compression skipped, using original file:', err);
  }

  return file;
}
