'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { RefreshCw, AlertCircle } from 'lucide-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center p-6 text-center bg-surface">
      <div className="bg-white p-10 rounded-2xl max-w-lg w-full shadow-lg border border-accent/20 relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-brand via-accent to-brand"></div>
        
        <div className="w-20 h-20 bg-brand/5 rounded-full flex items-center justify-center mx-auto mb-6 border border-brand/10">
          <AlertCircle className="w-10 h-10 text-brand" />
        </div>
        
        <h2 className="text-3xl font-black text-brand mb-4 tracking-tight">
          عذراً، ضغط شديد حالياً
        </h2>
        
        <p className="text-foreground/70 mb-8 leading-relaxed text-lg">
          نواجه حالياً إقبالاً كبيراً على المتجر أو نقوم بصيانة لحظية لتقديم تجربة أفضل. نعتذر عن هذا الإزعاج المؤقت.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={() => reset()}
            className="flex-1 flex items-center justify-center gap-2 bg-brand text-surface py-4 px-6 rounded-xl font-bold hover:bg-brand/90 transition-all hover-glow shadow-md"
          >
            <RefreshCw className="w-5 h-5" />
            تحديث الصفحة
          </button>
          
          <Link
            href="/"
            className="flex-1 flex items-center justify-center bg-transparent text-brand border-2 border-brand py-4 px-6 rounded-xl font-bold hover:bg-brand/5 transition-colors"
          >
            العودة للرئيسية
          </Link>
        </div>
      </div>
    </div>
  );
}
