'use client';

import { useEffect } from 'react';
import { RefreshCw, AlertOctagon } from 'lucide-react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Global Error:', error);
  }, [error]);

  return (
    <html lang="ar" dir="rtl">
      <body className="min-h-screen flex flex-col bg-[#F5F1E8] font-sans m-0 p-0 overflow-hidden text-[#202522]">
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center h-screen w-full">
          <div className="bg-white p-10 rounded-2xl max-w-lg w-full shadow-2xl border border-[#C8A45D]/30 relative overflow-hidden">
            {/* Decorative elements */}
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-[#123C35] via-[#C8A45D] to-[#123C35]"></div>
            
            <div className="w-24 h-24 bg-[#123C35]/5 rounded-full flex items-center justify-center mx-auto mb-8 border border-[#123C35]/10">
              <AlertOctagon className="w-12 h-12 text-[#123C35]" />
            </div>
            
            <h2 className="text-3xl font-black text-[#123C35] mb-4 tracking-tight">
              خطأ جذري غير متوقع
            </h2>
            
            <p className="text-[#202522]/70 mb-8 leading-relaxed text-lg">
              نواجه حالياً مشكلة تقنية خارجة عن إرادتنا. فريقنا يعمل على استعادة النظام بأسرع وقت ممكن. يرجى محاولة تحديث الصفحة.
            </p>
            
            <button
              onClick={() => reset()}
              className="w-full flex items-center justify-center gap-3 bg-[#123C35] text-[#F5F1E8] py-4 px-6 rounded-xl font-bold hover:bg-[#123C35]/90 transition-all shadow-md"
            >
              <RefreshCw className="w-5 h-5" />
              تحديث الصفحة وإعادة المحاولة
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
