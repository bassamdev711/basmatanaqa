import Link from 'next/link';
import { Search } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center p-6 text-center bg-surface">
      <div className="max-w-md w-full flex flex-col items-center">
        <h1 className="text-8xl font-black text-brand/10 mb-4 select-none">404</h1>
        
        <h2 className="text-3xl font-bold text-brand mb-4">
          الصفحة غير موجودة
        </h2>
        
        <p className="text-foreground/70 mb-8 text-lg">
          عذراً، يبدو أن الصفحة أو المنتج الذي تبحث عنه غير موجود أو تم نقله. 
        </p>
        
        <div className="w-full flex flex-col sm:flex-row gap-4">
          <Link
            href="/"
            className="flex-1 flex items-center justify-center bg-brand text-surface py-4 px-6 rounded-xl font-bold hover:bg-brand/90 transition-all hover-glow shadow-md"
          >
            العودة للرئيسية
          </Link>
          
          <Link
            href="/search"
            className="flex-1 flex items-center justify-center gap-2 bg-transparent text-brand border-2 border-brand py-4 px-6 rounded-xl font-bold hover:bg-brand/5 transition-colors"
          >
            <Search className="w-5 h-5" />
            البحث في المتجر
          </Link>
        </div>
      </div>
    </div>
  );
}
