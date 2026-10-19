import imageCompression from 'browser-image-compression';

async function compressViaCanvas(file: File, maxDim = 1280, quality = 0.8): Promise<File> {
  return new Promise((resolve, reject) => {
    const img = document.createElement('img');
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      let width = img.naturalWidth || img.width;
      let height = img.naturalHeight || img.height;

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
      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (!blob) return resolve(file);
          const finalFile = new File([blob], file.name.replace(/\.[^/.]+$/, '.webp'), {
            type: 'image/webp',
          });
          resolve(finalFile);
        },
        'image/webp',
        quality
      );
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
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
  // إذا لم يكن الملف صورة، نعيده كما هو (مثل PDF)
  if (!file.type.startsWith('image/')) {
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
    const fileExt = compressedBlob.type === 'image/jpeg' ? '.jpg' : compressedBlob.type === 'image/png' ? '.png' : '.webp';
    return new File([compressedBlob], file.name.replace(/\.[^/.]+$/, fileExt), {
      type: compressedBlob.type,
    });
  } catch (error) {
    console.warn('browser-image-compression فشل، جاري المحاولة عبر canvas:', error);
    try {
      return await compressViaCanvas(file, defaultOptions.maxWidthOrHeight, 0.8);
    } catch (fallbackError) {
      console.error('فشل ضغط الصورة نهائياً:', fallbackError);
      return file;
    }
  }
}
