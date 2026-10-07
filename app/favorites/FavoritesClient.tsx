"use client";

import React, { useSyncExternalStore } from 'react';
import { motion } from 'framer-motion';
import { Heart, ShoppingBag, ArrowRight } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useFavorites } from '@/components/FavoritesProvider';
import { useCart } from '@/components/CartProvider';
import { useCurrency } from '@/components/CurrencyProvider';
import { useToast } from '@/components/ToastProvider';
import ProductCard from '@/components/ProductCard';

const emptySubscribe = () => () => {}
const getClientHydrationSnapshot = () => true
const getServerHydrationSnapshot = () => false

export default function FavoritesClient() {
  const { favorites, toggleFavorite } = useFavorites();
  const { addToCart } = useCart();
  const { showToast } = useToast();
  const currency = useCurrency();
  const mounted = useSyncExternalStore(
    emptySubscribe,
    getClientHydrationSnapshot,
    getServerHydrationSnapshot,
  )

  if (!mounted) {
    return <div className="min-h-screen bg-surface-alt py-32"></div>;
  }

  return (
    <div className="min-h-screen bg-surface-alt pt-20 md:pt-32 pb-16 md:pb-24 px-3 md:px-4" dir="rtl">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8 md:mb-16"
        >
          <div className="flex items-center justify-center gap-2 md:gap-3 mb-3 md:mb-4 text-brand">
            <Heart size={24} className="md:w-8 md:h-8" fill="currentColor" />
          </div>
          <h1 className="text-2xl md:text-5xl font-black text-foreground mb-3 md:mb-6">
            المفضلة
          </h1>
          <p className="text-sm md:text-lg text-foreground/60">
            منتجاتك المفضلة التي اخترتها بانتظارك
          </p>
        </motion.div>

        {favorites.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20 bg-white rounded-3xl border border-black/5 shadow-sm max-w-2xl mx-auto"
          >
            <div className="w-24 h-24 bg-surface-alt rounded-full flex items-center justify-center mx-auto mb-6 text-brand/30">
              <Heart size={48} />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-4">قائمة المفضلة فارغة</h2>
            <p className="text-foreground/60 mb-8 max-w-md mx-auto">
              لم تقم بإضافة أي منتجات إلى المفضلة بعد. تصفح مجموعتنا واكتشف ما يناسب احتياجاتك.
            </p>
            <Link 
              href="/products"
              className="inline-flex items-center justify-center gap-2 bg-brand text-surface h-12 px-8 rounded-xl font-bold hover:bg-foreground transition-colors"
            >
              استكشف المجموعة
              <ArrowRight size={18} />
            </Link>
          </motion.div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-6">
            {favorites.map((product, index) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="h-full"
              >
                <ProductCard 
                  product={{
                    ...product,
                    imageUrl: product.imageUrl || '' // ensure string type
                  }} 
                  currency={currency} 
                />
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
