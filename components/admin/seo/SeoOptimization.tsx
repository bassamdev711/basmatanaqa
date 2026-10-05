'use client';

import { useEffect, useMemo, useState } from 'react';
import { Search, CheckCircle, AlertTriangle } from 'lucide-react';
import { calculateSeoScore, SeoEvaluationData, SeoScoreResult } from '@/lib/seo/score';

interface SeoOptimizationProps {
  title: string;
  description: string;
  hasImage: boolean;
  categoryName?: string;
  initialPhrases?: string[];
  onPhrasesChange: (phrases: string[]) => void;
  entityType?: 'product' | 'category' | 'page' | 'store';
}

export default function SeoOptimization({
  title,
  description,
  hasImage,
  categoryName,
  initialPhrases = [],
  onPhrasesChange,
  entityType = 'product',
}: SeoOptimizationProps) {
  const [phrases, setPhrases] = useState<string[]>(initialPhrases);
  const [inputValue, setInputValue] = useState('');
  const scoreResult = useMemo<SeoScoreResult>(() => {
    const data: SeoEvaluationData = {
      title,
      description,
      hasImage,
      categoryName,
      searchPhrases: phrases,
    };
    return calculateSeoScore(data);
  }, [title, description, hasImage, categoryName, phrases]);

  const getTitleText = () => {
    switch (entityType) {
      case 'store': return 'تحسين ظهور المتجر';
      case 'category': return 'تحسين فرصة ظهور التصنيف';
      case 'page': return 'تحسين فرصة ظهور الصفحة';
      case 'product':
      default:
        return 'تحسين فرصة ظهور المنتج';
    }
  };

  const getQuestionText = () => {
    switch (entityType) {
      case 'store': return 'ما العبارات التي تتوقع أن يبحث بها العملاء عن متجرك؟';
      case 'page': return 'ما العبارات التي قد يستخدمها العميل للبحث عنها؟';
      case 'category':
      case 'product':
      default:
        return 'كيف يمكن أن يبحث العميل عن هذا؟';
    }
  };

  useEffect(() => {
    onPhrasesChange(phrases);
  }, [onPhrasesChange, phrases]);

  const handleAddPhrase = () => {
    if (inputValue.trim() && !phrases.includes(inputValue.trim())) {
      setPhrases([...phrases, inputValue.trim()]);
      setInputValue('');
    }
  };

  const handleRemovePhrase = (phraseToRemove: string) => {
    setPhrases(phrases.filter((p) => p !== phraseToRemove));
  };

  const getScoreColor = (grade: string) => {
    if (grade === 'ممتاز') return 'text-green-600';
    if (grade === 'جيد جداً' || grade === 'جيد') return 'text-blue-600';
    if (grade === 'مقبول') return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBgColor = (grade: string) => {
    if (grade === 'ممتاز') return 'bg-green-100';
    if (grade === 'جيد جداً' || grade === 'جيد') return 'bg-blue-100';
    if (grade === 'مقبول') return 'bg-yellow-100';
    return 'bg-red-100';
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 mt-6" dir="rtl">
      <h2 className="text-xl font-bold mb-6 text-gray-800 flex items-center gap-2">
        <Search className="w-5 h-5 text-gray-700" /> {getTitleText()}
      </h2>

      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {getQuestionText()}
        </label>
        <div className="flex gap-2 mb-3">
          <input
            type="text"
            className="flex-1 p-3 border border-gray-300 rounded-md shadow-sm focus:ring-[#1a544a] focus:border-[#1a544a]"
            placeholder="مثال: منتج مميز للاستخدام اليومي"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddPhrase())}
          />
          <button
            type="button"
            onClick={handleAddPhrase}
            className="px-4 py-2 bg-[#1a544a] text-white rounded-md hover:bg-[#133e36] transition-colors"
          >
            إضافة عبارة
          </button>
          
          <button
            type="button"
            onClick={() => {
              const stopWords = ['في', 'من', 'على', 'إلى', 'عن', 'مع', 'هذا', 'هذه', 'الذي', 'التي', 'و', 'أو', 'ثم'];
              const text = `${title} ${description}`.replace(/[^\w\s\u0600-\u06FF]/g, ' ');
              const words = text.split(/\s+/).filter(w => w.length > 2 && !stopWords.includes(w));
              
              const newPhrases = new Set(phrases);
              if (title && title.length > 2) newPhrases.add(title);
              if (categoryName && title) newPhrases.add(`${categoryName} ${title}`);
              
              // Add a couple of top words as phrases
              const uniqueWords = Array.from(new Set(words)).slice(0, 5);
              uniqueWords.forEach(w => newPhrases.add(w));
              
              setPhrases(Array.from(newPhrases));
            }}
            title="استخراج الكلمات بذكاء من الاسم والوصف"
            className="px-4 py-2 bg-yellow-50 text-yellow-700 border border-yellow-200 rounded-md hover:bg-yellow-100 transition-colors flex items-center gap-1"
          >
            استخراج ذكي
          </button>
        </div>
        
        {phrases.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3">
            {phrases.map((phrase, idx) => (
              <span
                key={idx}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm bg-gray-100 text-gray-800 border border-gray-200"
              >
                {phrase}
                <button
                  type="button"
                  onClick={() => handleRemovePhrase(phrase)}
                  className="text-gray-500 hover:text-red-600 transition-colors"
                >
                  &times;
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {scoreResult && (
        <div className={`p-5 rounded-lg border ${getScoreBgColor(scoreResult.grade)} border-opacity-50`}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-800 text-lg">النتيجة</h3>
            <div className={`text-xl font-black ${getScoreColor(scoreResult.grade)}`}>
              {scoreResult.score} / 100 &mdash; {scoreResult.grade}
            </div>
          </div>
          
          <ul className="space-y-2">
            {scoreResult.checks.map((check, idx) => (
              <li key={idx} className="flex items-center gap-2 text-sm">
                {check.passed ? (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-red-500" />
                )}
                <span className={check.passed ? 'text-gray-700' : 'text-gray-900 font-medium'}>
                  {check.message}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
      
      <p className="text-xs text-gray-500 mt-4">
        ملاحظة: هذه التحسينات تساعد محركات البحث على فهم متجرك بشكل أفضل، لكنها لا تضمن ترتيباً أو ظهوراً محدداً في نتائج البحث.
      </p>
    </div>
  );
}
