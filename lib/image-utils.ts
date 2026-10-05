/**
 * image-utils.ts
 * مساعد مركزي لتحديد sizes الصحيحة لصور Next.js
 * يضمن أن المتصفح يختار الحجم المناسب للجهاز ولا يُحمِّل أكثر مما يحتاج
 */

export type ImageUsage =
  | 'thumbnail'    // صور صغيرة — 80px
  | 'card-mobile'  // بطاقات المنتج في الجوال — ~85vw
  | 'card'         // بطاقات المنتج في الشبكة — 2-4 أعمدة
  | 'card-hero'    // بطاقات كبيرة في الصفحة الرئيسية — 3 أعمدة
  | 'detail'       // صفحة تفاصيل المنتج — نصف الشاشة أو أكثر
  | 'hero'         // صورة رئيسية تملأ الشاشة
  | 'related'      // منتجات مرتبطة — 2-4 أعمدة

/**
 * يُعيد قيمة sizes المناسبة لنوع استخدام الصورة
 * كلما كانت القيمة أدق، كلما اختار المتصفح حجماً أصغر وأنسب
 */
export function getImageSizes(usage: ImageUsage): string {
  switch (usage) {
    case 'thumbnail':
      return '80px'

    case 'card-mobile':
      // شريط أفقي على الجوال — البطاقة تأخذ 85% من عرض الشاشة
      return '(max-width: 768px) 85vw, 400px'

    case 'card':
      // شبكة: 2 أعمدة جوال، 3 أعمدة تابلت، 4 أعمدة ديسكتوب
      return '(max-width: 640px) 48vw, (max-width: 1024px) 33vw, 25vw'

    case 'card-hero':
      // شبكة 3 أعمدة في الصفحة الرئيسية
      return '(max-width: 768px) 85vw, (max-width: 1280px) 33vw, 400px'

    case 'detail':
      // صفحة المنتج — نصف الشاشة على الديسكتوب، كامل العرض على الجوال
      return '(max-width: 768px) 100vw, 50vw'

    case 'hero':
      return '100vw'

    case 'related':
      // منتجات مرتبطة — 2 أعمدة جوال، 4 ديسكتوب
      return '(max-width: 640px) 48vw, (max-width: 1024px) 25vw, 20vw'
  }
}
