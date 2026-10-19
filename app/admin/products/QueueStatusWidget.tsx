'use client';

import React, { useState } from 'react';
import { useProductQueue } from './ProductQueueContext';
import {
  Layers,
  ChevronUp,
  ChevronDown,
  CheckCircle2,
  AlertCircle,
  Loader2,
  RefreshCw,
  Trash2,
  Check,
} from 'lucide-react';

export default function QueueStatusWidget() {
  const { queue, retryItem, removeItem, clearCompleted } = useProductQueue();
  const [isExpanded, setIsExpanded] = useState(false);

  if (queue.length === 0) return null;

  const pendingCount = queue.filter((i) => i.status === 'pending' || i.status === 'processing').length;
  const successCount = queue.filter((i) => i.status === 'success').length;
  const errorCount = queue.filter((i) => i.status === 'error').length;
  const isWorking = pendingCount > 0;

  return (
    <div
      className="fixed bottom-4 left-4 z-50 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden font-sans transition-all text-right"
      dir="rtl"
    >
      {/* Header bar */}
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        className="px-4 py-3 bg-gray-900 text-white flex items-center justify-between cursor-pointer select-none"
      >
        <div className="flex items-center gap-2.5">
          {isWorking ? (
            <Loader2 className="w-5 h-5 animate-spin text-emerald-400" />
          ) : errorCount > 0 ? (
            <AlertCircle className="w-5 h-5 text-red-400" />
          ) : (
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          )}
          <div>
            <div className="text-xs font-bold flex items-center gap-2">
              <span>طابور المعالجة في الخلفية</span>
              <span className="bg-white/20 px-2 py-0.5 rounded-full text-[10px]">
                {queue.length}
              </span>
            </div>
            <p className="text-[11px] text-gray-300 mt-0.5">
              {isWorking
                ? `جاري حفظ ${pendingCount} منتج في الخلفية...`
                : errorCount > 0
                ? `${errorCount} منتجات واجهت خطأ`
                : 'اكتملت جميع المنتجات بنجاح!'}
            </p>
          </div>
        </div>

        <button
          type="button"
          className="text-gray-400 hover:text-white p-1 rounded-lg transition-colors"
        >
          {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
        </button>
      </div>

      {/* Expanded list view */}
      {isExpanded && (
        <div className="p-3 bg-gray-50 max-h-72 overflow-y-auto space-y-2 border-t border-gray-100">
          <div className="flex items-center justify-between text-[11px] text-gray-500 pb-1 border-b border-gray-200">
            <span>المنتجات في الطابور:</span>
            {successCount > 0 && (
              <button
                type="button"
                onClick={clearCompleted}
                className="text-emerald-700 hover:underline font-bold"
              >
                مسح المكتملة ({successCount})
              </button>
            )}
          </div>

          {queue.map((item) => (
            <div
              key={item.id}
              className={`p-2.5 rounded-xl border text-xs flex items-center justify-between gap-2 transition-colors ${
                item.status === 'processing'
                  ? 'bg-blue-50/60 border-blue-200'
                  : item.status === 'success'
                  ? 'bg-emerald-50/50 border-emerald-200'
                  : item.status === 'error'
                  ? 'bg-red-50/60 border-red-200'
                  : 'bg-white border-gray-200'
              }`}
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  {item.status === 'processing' && (
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600 shrink-0" />
                  )}
                  {item.status === 'success' && (
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  )}
                  {item.status === 'error' && (
                    <AlertCircle className="w-3.5 h-3.5 text-red-600 shrink-0" />
                  )}
                  {item.status === 'pending' && (
                    <Layers className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                  )}
                  <span className="font-bold text-gray-900 truncate block">{item.name}</span>
                </div>
                <div className="flex items-center gap-2 text-[10px] text-gray-500 mt-0.5">
                  <span>{item.price} ر.س</span>
                  {item.status === 'processing' && (
                    <span className="text-blue-700 font-bold">• جاري الحفظ والرفع...</span>
                  )}
                  {item.status === 'success' && (
                    <span className="text-emerald-700 font-bold">• تم الحفظ</span>
                  )}
                  {item.status === 'pending' && <span>• في انتظار الدور</span>}
                  {item.status === 'error' && (
                    <span className="text-red-600 font-bold truncate">
                      • {item.errorMessage || 'فشل الحفظ'}
                    </span>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1 shrink-0">
                {item.status === 'error' && (
                  <button
                    type="button"
                    onClick={() => retryItem(item.id)}
                    className="p-1 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                    title="إعادة المحاولة"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => removeItem(item.id)}
                  className="p-1 text-gray-400 hover:text-red-600 hover:bg-gray-100 rounded-lg transition-colors"
                  title="حذف من الطابور"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
