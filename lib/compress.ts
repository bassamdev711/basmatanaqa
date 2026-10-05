import imageCompression from 'browser-image-compression';

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
    maxSizeMB: options.maxSizeMB || 0.3, // أقصى حجم 300 كيلوبايت
    maxWidthOrHeight: options.maxWidthOrHeight || 1280, // أقصى عرض 1280
    useWebWorker: true,
    fileType: 'image/webp', // تحويل إلى webp لأفضل ضغط
  };

  try {
    const compressedBlob = await imageCompression(file, defaultOptions);
    // تحويل Blob إلى File
    return new File([compressedBlob], file.name.replace(/\.[^/.]+$/, '.webp'), {
      type: 'image/webp',
    });
  } catch (error) {
    console.error('فشل ضغط الصورة:', error);
    return file; // في حال الفشل، أرسل الملف الأصلي
  }
}
