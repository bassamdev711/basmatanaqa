export function normalizeArabicSearch(text: string): string {
  if (!text) return '';
  return text
    // Normalize Alef
    .replace(/[أإآا]/g, 'ا')
    // Normalize Ta-marbuta / Ha
    .replace(/[ةه]/g, 'ه')
    // Normalize Ya / Alef Maksura
    .replace(/[يى]/g, 'ي')
    // Normalize Hamza
    .replace(/[ؤئ]/g, 'ء')
    // Remove diacritics (tashkeel)
    .replace(/[\u064B-\u065F\u0670]/g, '')
    // Remove tatweel
    .replace(/ـ/g, '')
    .toLowerCase()
    .trim();
}

/**
 * Generates an array of simple variations for a given query to improve search
 * resilience without needing a complex full-text search engine.
 */
export function getArabicSearchVariations(query: string): string[] {
  if (!query || query.trim().length === 0) return [];
  
  const variations = new Set<string>();
  const trimmed = query.trim();
  variations.add(trimmed);
  variations.add(trimmed.toLowerCase());
  
  const normalized = normalizeArabicSearch(trimmed);
  if (normalized) {
    variations.add(normalized);
  }
  
  // If the word has Alef, add variations with Hamza
  if (/[اأإآ]/.test(trimmed)) {
    variations.add(trimmed.replace(/[اأإآ]/g, 'ا'));
    variations.add(trimmed.replace(/[اأإآ]/g, 'أ'));
  }
  
  // If the word has Ta-marbuta, add variation with Ha
  if (/[ةه]/.test(trimmed)) {
    variations.add(trimmed.replace(/[ةه]/g, 'ة'));
    variations.add(trimmed.replace(/[ةه]/g, 'ه'));
  }

  // Filter out empty or very short strings if they are just noise
  return Array.from(variations).filter(v => v.length > 1 || v === query);
}
