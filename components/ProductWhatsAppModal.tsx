"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import WhatsAppIcon from "./icons/WhatsAppIcon";
import { getProductWhatsAppLink } from "@/lib/whatsapp-order";

export interface WhatsAppProductData {
  name: string;
  price: number;
  currency: string;
  imageUrl?: string | null;
  size?: string | null;
  quantity?: number;
  slug: string;
  shortCode?: string | null;
  imageIndex?: number | null;
  categoryName?: string | null;
  subCategoryName?: string | null;
}

interface ProductWhatsAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: WhatsAppProductData | null;
}

export default function ProductWhatsAppModal({
  isOpen,
  onClose,
  product,
}: ProductWhatsAppModalProps) {
  const [notes, setNotes] = useState("");

  // Reset notes when modal opens with a new product
  useEffect(() => {
    if (isOpen) {
      setNotes("");
    }
  }, [isOpen, product?.slug]);

  if (!isOpen || !product) return null;

  const handleProceed = () => {
    const url = getProductWhatsAppLink({
      name: product.name,
      price: product.price,
      currency: product.currency,
      quantity: product.quantity || 1,
      size: product.size,
      slug: product.slug,
      shortCode: product.shortCode,
      imageIndex: product.imageIndex,
      categoryName: product.categoryName,
      subCategoryName: product.subCategoryName,
      notes: notes.trim() || null,
    });

    window.open(url, "_blank");
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[150] flex items-end sm:items-center justify-center p-0 sm:p-4" dir="rtl">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm"
        />

        {/* Modal Dialog */}
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 40, scale: 0.96 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="relative w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl z-10 overflow-hidden border border-black/5 max-h-[90vh] flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-black/5 bg-surface/50">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full bg-[#25D366]/15 flex items-center justify-center text-[#25D366]">
                <WhatsAppIcon size={20} />
              </div>
              <div>
                <h3 className="font-bold text-base text-foreground">الطلب عبر واتساب</h3>
                <p className="text-[11px] text-foreground/50">تأكيد سريع ومباشر مع خدمة العملاء</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-black/5 hover:bg-black/10 flex items-center justify-center text-foreground/60 transition-colors"
              aria-label="إغلاق"
            >
              <X size={18} />
            </button>
          </div>

          {/* Body */}
          <div className="p-4 sm:p-5 space-y-4 overflow-y-auto">
            {/* Product Summary Card */}
            <div className="flex items-center gap-3 p-3 bg-surface rounded-xl border border-black/5">
              {product.imageUrl && (
                <div className="relative w-14 h-14 rounded-lg overflow-hidden shrink-0 bg-white border border-black/5">
                  <Image
                    src={product.imageUrl}
                    alt={product.name}
                    fill
                    sizes="56px"
                    className="object-cover"
                  />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-xs sm:text-sm text-foreground truncate">
                  {product.name}
                </h4>
                <div className="flex items-center gap-2 mt-1 text-xs text-foreground/70 flex-wrap">
                  <span className="font-black text-brand">
                    {Number(product.price * (product.quantity || 1)).toLocaleString("ar-SA")}{" "}
                    {product.currency}
                  </span>
                  {product.size && (
                    <span className="bg-white px-2 py-0.5 rounded border border-black/10 text-[11px] font-semibold">
                      المقاس: {product.size}
                    </span>
                  )}
                  {product.quantity && product.quantity > 1 && (
                    <span className="text-[11px] text-foreground/50">
                      (الكمية: {product.quantity})
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Note Input Field */}
            <div className="space-y-1.5">
              <label htmlFor="wa-notes" className="block text-xs sm:text-sm font-bold text-foreground">
                أدرج أي تفاصيل إضافية تريدها
              </label>
              <textarea
                id="wa-notes"
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="مثال: أريد لون كذا، استفسار عن مواصفات معينة، أو أي تفاصيل خاصة بالطلب..."
                className="w-full bg-surface-alt border border-black/10 rounded-xl p-3 text-sm outline-none focus:border-[#25D366] focus:ring-1 focus:ring-[#25D366] transition-all resize-none leading-relaxed"
                autoFocus
              />
            </div>
          </div>

          {/* Footer Action */}
          <div className="p-4 pt-2 border-t border-black/5 bg-white">
            <button
              onClick={handleProceed}
              className="w-full py-3.5 bg-[#25D366] hover:bg-[#1EBE5D] text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-[#25D366]/25 transition-all text-sm active:scale-[0.98]"
            >
              <WhatsAppIcon size={18} />
              <span>المواصلة إلى واتساب</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
