'use client';

import { useEffect } from 'react';

export default function ShortRedirectClient({ targetUrl }: { targetUrl: string }) {
  useEffect(() => {
    window.location.replace(targetUrl);
  }, [targetUrl]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface text-foreground font-sans p-6 text-center" dir="rtl">
      <div className="flex flex-col items-center gap-4 bg-white p-8 rounded-2xl shadow-sm border border-black/5 max-w-sm w-full">
        <div className="w-10 h-10 border-4 border-brand border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-bold text-gray-700">جاري نقلك إلى صفحة المنتج...</p>
        <a 
          href={targetUrl} 
          className="text-xs text-brand font-bold underline mt-2 hover:opacity-80"
        >
          اضغط هنا إذا لم يتم نقلك تلقائياً
        </a>
      </div>
    </div>
  );
}
