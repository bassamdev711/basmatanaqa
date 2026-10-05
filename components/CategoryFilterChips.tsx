"use client";

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { LayoutGrid } from 'lucide-react';

interface FilterChip {
  label: string;
  href: string;
  imageUrl: string | null;
}

interface CategoryFilterChipsProps {
  filters: FilterChip[];
  activeCollection?: string | null;
}

export default function CategoryFilterChips({ filters, activeCollection }: CategoryFilterChipsProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  const scrollRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);
  const startXRef = useRef(0);
  const scrollStartRef = useRef(0);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY > 120 && currentScrollY > lastScrollY + 5) {
        setIsVisible(false);
      } else if (currentScrollY < lastScrollY - 5 || currentScrollY < 50) {
        setIsVisible(true);
      }
      setLastScrollY(currentScrollY);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  // Drag to scroll — works with both LTR and RTL scrollLeft
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!scrollRef.current) return;
    isDraggingRef.current = true;
    setIsDragging(true);
    startXRef.current = e.pageX;
    scrollStartRef.current = scrollRef.current.scrollLeft;
  };
  const handleMouseLeave = () => { isDraggingRef.current = false; setIsDragging(false); };
  const handleMouseUp   = () => { isDraggingRef.current = false; setIsDragging(false); };
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingRef.current || !scrollRef.current) return;
    e.preventDefault();
    const delta = e.pageX - startXRef.current;
    scrollRef.current.scrollLeft = scrollStartRef.current - delta;
  };

  return (
    <div
      className={`sticky z-40 transition-all duration-500 ease-in-out bg-surface/95 backdrop-blur-md shadow-[0_4px_20px_rgba(0,0,0,0.03)] border-b border-black/5 ${
        isVisible ? 'top-14 md:top-[68px]' : '-top-[200px]'
      }`}
    >
      {/*
        الحل الصحيح النهائي:
        - حاوية التمرير: dir="rtl" مباشرةً → scrollLeft=0 يعرض اليمين (الكل) على كل المتصفحات الحديثة
        - لا max-w wrapper خارج حاوية التمرير (كان السبب الجذري للمشكلة)
        - padding ديناميكي داخل المحتوى ليتوافق مع max-w-7xl
      */}
      <div
        ref={scrollRef}
        dir="rtl"
        className="w-full overflow-x-auto no-scrollbar cursor-grab active:cursor-grabbing"
        onMouseDown={handleMouseDown}
        onMouseLeave={handleMouseLeave}
        onMouseUp={handleMouseUp}
        onMouseMove={handleMouseMove}
      >
        <div
          className="flex items-start gap-5 md:gap-8 py-4 md:py-6"
          style={{
            width: 'max-content',
            paddingRight: 'max(1rem, calc((100vw - 80rem) / 2 + 1rem))',
            paddingLeft:  'max(1rem, calc((100vw - 80rem) / 2 + 1rem))',
          }}
        >
          {filters.map((f) => {
            const isActive = f.href === '/products'
              ? !activeCollection
              : activeCollection === new URLSearchParams(f.href.split('?')[1]).get('collection');

            return (
              <Link
                key={f.href}
                href={f.href}
                draggable={false}
                className="flex flex-col items-center gap-2 group shrink-0"
                onClick={(e) => { if (isDragging) e.preventDefault(); }}
              >
                <div
                  className={`relative w-16 h-16 md:w-20 md:h-20 rounded-full flex items-center justify-center overflow-hidden border-[3px] transition-all duration-300 pointer-events-none ${
                    isActive
                      ? 'border-brand shadow-[0_0_15px_rgba(32,37,34,0.1)] scale-105'
                      : 'border-transparent bg-black/5 group-hover:border-brand/30 group-hover:scale-105'
                  }`}
                >
                  {f.imageUrl ? (
                    <Image
                      src={f.imageUrl}
                      alt={f.label}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 64px, 96px"
                      draggable={false}
                    />
                  ) : (
                    <LayoutGrid className={`w-6 h-6 md:w-8 md:h-8 transition-all ${
                      isActive ? 'text-brand' : 'text-foreground/40 group-hover:text-brand'
                    }`} />
                  )}
                </div>
                <span className={`text-xs md:text-sm font-bold transition-colors pointer-events-none text-center w-16 md:w-20 whitespace-normal ${
                  isActive ? 'text-brand' : 'text-foreground/70 group-hover:text-brand'
                }`}>
                  {f.label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
