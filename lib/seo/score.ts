export interface SeoEvaluationData {
  title?: string;
  description?: string;
  searchPhrases: string[];
  hasImage: boolean;
  categoryName?: string;
}

export interface SeoScoreResult {
  score: number;
  grade: 'ممتاز' | 'جيد جداً' | 'جيد' | 'مقبول' | 'يحتاج تحسين';
  checks: {
    passed: boolean;
    message: string;
  }[];
}

/**
 * Calculates the SEO Score for a product or page based on simple business logic,
 * completely avoiding technical jargon.
 */
export function calculateSeoScore(data: SeoEvaluationData): SeoScoreResult {
  const checks = [];
  let score = 0;

  // 1. Title Check
  if (data.title && data.title.trim().length > 0) {
    checks.push({ passed: true, message: 'اسم المنتج/الصفحة واضح' });
    score += 20;
  } else {
    checks.push({ passed: false, message: 'أضف اسماً واضحاً للمنتج/الصفحة' });
  }

  // 2. Description Check
  if (data.description && data.description.trim().length > 30) {
    checks.push({ passed: true, message: 'الوصف كافٍ ومناسب' });
    score += 20;
  } else {
    checks.push({ passed: false, message: 'أضف وصفاً أكثر تفصيلاً' });
  }

  // 3. Search Phrases Check
  if (data.searchPhrases && data.searchPhrases.length > 0) {
    checks.push({ passed: true, message: 'توجد عبارات بحث مرتبطة' });
    score += 20;
    
    // Bonus for having multiple but not too many phrases
    if (data.searchPhrases.length >= 2 && data.searchPhrases.length <= 5) {
      score += 10;
    } else if (data.searchPhrases.length > 5) {
      checks.push({ passed: false, message: 'عدد عبارات البحث كبير جداً، اكتفِ بـ 3-5 عبارات' });
    }
  } else {
    checks.push({ passed: false, message: 'أضف عبارات يبحث بها العملاء' });
  }

  // 4. Image Check
  if (data.hasImage) {
    checks.push({ passed: true, message: 'الصورة موجودة' });
    score += 20;
  } else {
    checks.push({ passed: false, message: 'أضف صورة للمشاركة والظهور' });
  }

  // 5. Category Check (if applicable)
  if (data.categoryName) {
    checks.push({ passed: true, message: 'التصنيف مناسب ومحدد' });
    score += 10;
  }

  // Determine grade based on score
  let grade: SeoScoreResult['grade'] = 'يحتاج تحسين';
  if (score >= 90) grade = 'ممتاز';
  else if (score >= 75) grade = 'جيد جداً';
  else if (score >= 60) grade = 'جيد';
  else if (score >= 40) grade = 'مقبول';

  return {
    score,
    grade,
    checks,
  };
}
