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
  activeSlug?: string | null;
  paramKey?: string;
  variant?: 'circles' | 'pills';
}

export default function CategoryFilterChips({ filters, activeSlug, paramKey = 'collection', variant = 'circles' }: CategoryFilterChipsProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);
  const startXRef = useRef(0);
  const scrollStartRef = useRef(0);
  const [isDragging, setIsDragging] = useState(false);

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
    <div className="w-full">
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
          className={`flex items-center gap-3 md:gap-4 ${variant === 'circles' ? 'py-4 md:py-6' : 'py-2.5 md:py-3'}`}
          style={{
            width: 'max-content',
            paddingRight: 'max(1rem, calc((100vw - 80rem) / 2 + 1rem))',
            paddingLeft:  'max(1rem, calc((100vw - 80rem) / 2 + 1rem))',
          }}
        >
          {filters.map((f) => {
            const hrefParams = new URLSearchParams(f.href.split('?')[1] || '');
            const isActive = (!activeSlug && !hrefParams.get(paramKey)) || 
                             (activeSlug === hrefParams.get(paramKey));

            return (
              <Link
                key={f.href}
                href={f.href}
                draggable={false}
                className={`group shrink-0 ${variant === 'circles' ? 'flex flex-col items-center gap-2' : ''}`}
                onClick={(e) => { if (isDragging) e.preventDefault(); }}
              >
                {variant === 'circles' ? (
                  <>
                    <div
                      className={`relative w-14 h-14 md:w-16 md:h-16 rounded-full flex items-center justify-center overflow-hidden border-[2px] transition-all duration-300 pointer-events-none ${
                        isActive
                          ? 'border-brand shadow-sm scale-105'
                          : 'border-transparent bg-black/5 group-hover:border-brand/30 group-hover:scale-105'
                      }`}
                    >
                      {f.imageUrl ? (
                        <Image
                          src={f.imageUrl}
                          alt={f.label}
                          fill
                          className="object-cover"
                          sizes="(max-width: 768px) 56px, 64px"
                          draggable={false}
                        />
                      ) : (
                        <LayoutGrid className={`w-5 h-5 md:w-6 md:h-6 transition-all ${
                          isActive ? 'text-brand' : 'text-foreground/40 group-hover:text-brand'
                        }`} />
                      )}
                    </div>
                    <span className={`text-[10px] md:text-xs font-bold transition-colors pointer-events-none text-center w-14 md:w-16 whitespace-normal ${
                      isActive ? 'text-brand' : 'text-foreground/70 group-hover:text-brand'
                    }`}>
                      {f.label}
                    </span>
                  </>
                ) : (
                  <div
                    className={`px-4 py-1.5 md:px-5 md:py-2 rounded-full text-xs md:text-sm font-semibold transition-all duration-300 border ${
                      isActive
                        ? 'bg-black text-white border-black'
                        : 'bg-white text-black border-black/10 hover:border-black'
                    }`}
                  >
                    {f.label}
                  </div>
                )}
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
