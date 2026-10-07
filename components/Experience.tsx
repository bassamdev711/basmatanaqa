"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import Image from "next/image";

type ExperienceData = {
  expTopTitle?: string | null
  expMainTitle?: string | null
  expBox1Title?: string | null
  expBox1Desc?: string | null
  expBox2Title?: string | null
  expBox2Desc?: string | null
}

export default function Experience({
  data = {},
  brandName = 'بصمة أناقة',
}: {
  data?: ExperienceData
  brandName?: string
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"],
  });

  const y1 = useTransform(scrollYProgress, [0, 1], [0, -100]);
  const y2 = useTransform(scrollYProgress, [0, 1], [0, 100]);

  return (
    <section id="experience" className="relative py-32 bg-white overflow-hidden" ref={containerRef}>
      <div className="max-w-7xl mx-auto px-6 lg:px-12 relative z-10" dir="rtl">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-24"
        >
          <span className="text-accent tracking-[0.4em] uppercase text-xs font-bold mb-4 block">
            {data.expTopTitle || "منهجنا في الاختيار"}
          </span>
          <h2 className="text-4xl md:text-5xl font-black text-foreground mb-6">{data.expMainTitle || `تجربة ${brandName}`}</h2>
          <div className="w-12 h-[2px] bg-brand mx-auto" />
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 lg:gap-24 items-center">
          <motion.div style={{ y: y1 }} className="space-y-12">
            <div className="bg-surface p-8 md:p-12 border-r-2 border-brand shadow-sm">
              <h3 className="text-2xl text-foreground mb-4 font-black">{data.expBox1Title || "اختيار واضح"}</h3>
              <p className="text-foreground/70 leading-relaxed font-light text-lg">
                {data.expBox1Desc || "نقدم معلومات واضحة عن كل منتج، ونرتب التجربة بحيث تصل إلى الاختيار المناسب بأقل قدر من الحيرة."}
              </p>
            </div>
            
            <div className="bg-surface p-8 md:p-12 border-l-2 border-accent shadow-sm md:mr-12">
              <h3 className="text-2xl text-foreground mb-4 font-black">{data.expBox2Title || "تفاصيل محسوبة"}</h3>
              <p className="text-foreground/70 leading-relaxed font-light text-lg">
                {data.expBox2Desc || "نهتم بالتغليف، الدفع، المتابعة وخدمة العملاء حتى تكون كل خطوة متسقة مع وعد العلامة التجارية."}
              </p>
            </div>
          </motion.div>

          <motion.div style={{ y: y2 }} className="relative h-[600px] w-full hidden md:block">
            <div className="absolute inset-0 border border-accent/30 translate-x-4 translate-y-4"></div>
            <div className="absolute inset-0 overflow-hidden shadow-2xl bg-surface p-4">
              <div className="relative w-full h-full">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(184,138,69,.22),transparent_55%),linear-gradient(145deg,var(--brand-color),#2c2822)]" />
                <div className="absolute inset-10 flex flex-col items-center justify-center rounded-2xl border border-accent/35 bg-brand/40 text-center">
                  <Image
                    src="/basmat-anaqah-logo.webp"
                    alt={`شعار ${brandName}`}
                    width={220}
                    height={220}
                    className="mb-6 h-36 w-36 object-contain"
                  />
                  <span className="text-xs font-bold tracking-[0.3em] text-accent">BASMAT ANAQAH</span>
                  <span className="mt-3 text-sm text-surface/70">تفاصيل تصنع الفرق</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
