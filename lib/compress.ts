import imageCompression from 'browser-image-compression';

async function compressViaCanvas(file: File, maxDim = 1280, quality = 0.8): Promise<File> {
  return new Promise((resolve) => {
    // If running in an environment without document/window or if file is invalid
    if (typeof window === 'undefined' || typeof document === 'undefined' || !file || file.size === 0) {
      return resolve(file);
    }

    const img = document.createElement('img');
    const url = URL.createObjectURL(file);

    const cleanup = () => {
      try {
        URL.revokeObjectURL(url);
      } catch {}
    };

    img.onload = () => {
      cleanup();
      let width = img.naturalWidth || img.width;
      let height = img.naturalHeight || img.height;

      if (!width || !height) {
        return resolve(file);
      }

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
      if (!ctx) {
        return resolve(file);
      }

      try {
        ctx.drawImage(img, 0, 0, width, height);

        // Try webp first, fallback to jpeg if browser doesn't support webp encoding
        canvas.toBlob(
          (blob) => {
            if (!blob || blob.size === 0) {
              // Try jpeg if webp failed or produced 0-byte blob
              canvas.toBlob(
                (jpegBlob) => {
                  if (!jpegBlob || jpegBlob.size === 0) {
                    return resolve(file);
                  }
                  const finalFile = new File([jpegBlob], file.name.replace(/\.[^/.]+$/, '.jpg'), {
                    type: 'image/jpeg',
                  });
                  resolve(finalFile);
                },
                'image/jpeg',
                quality
              );
              return;
            }

            const targetExt = blob.type === 'image/webp' ? '.webp' : '.jpg';
            const finalFile = new File([blob], file.name.replace(/\.[^/.]+$/, targetExt), {
              type: blob.type || 'image/webp',
            });
            resolve(finalFile);
          },
          'image/webp',
          quality
        );
      } catch (drawErr) {
        console.warn('Canvas drawImage failed, using original file:', drawErr);
        resolve(file);
      }
    };

    img.onerror = () => {
      cleanup();
      // If image failed to load in <img> (e.g. HEIC or raw unsupported format), preserve original file
      resolve(file);
    };

    img.src = url;
  });
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
  if (!file || file.size === 0 || !file.type.startsWith('image/')) {
    return file;
  }

  // إذا كانت الصورة مضغوطة مسبقاً وبحجم ملائم (< 500KB) لا نضغطها مجدداً حتى لا تتشوه الجودة
  if (file.type === 'image/webp' && file.size < 500 * 1024) {
    return file;
  }

  const defaultOptions = {
    maxSizeMB: options.maxSizeMB || 0.4, // أقصى حجم 400 كيلوبايت
    maxWidthOrHeight: options.maxWidthOrHeight || 1280, // أقصى عرض 1280
    useWebWorker: true,
    fileType: 'image/webp', // تحويل إلى webp لأفضل ضغط
  };

  try {
    const compressedBlob = await imageCompression(file, defaultOptions);
    if (!compressedBlob || compressedBlob.size === 0) {
      throw new Error('Empty compressed blob returned');
    }

    const fileExt = compressedBlob.type === 'image/jpeg' ? '.jpg' : compressedBlob.type === 'image/png' ? '.png' : '.webp';
    return new File([compressedBlob], file.name.replace(/\.[^/.]+$/, fileExt), {
      type: compressedBlob.type,
    });
  } catch (error) {
    console.warn('browser-image-compression فشل، جاري المحاولة عبر canvas:', error);
    try {
      const canvasFile = await compressViaCanvas(file, defaultOptions.maxWidthOrHeight, 0.8);
      if (canvasFile && canvasFile.size > 0) {
        return canvasFile;
      }
      return file;
    } catch (fallbackError) {
      console.error('فشل ضغط الصورة نهائياً، استخدام الملف الأصلي:', fallbackError);
      return file;
    }
  }
}
