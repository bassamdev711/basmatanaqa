"use client";

import { motion } from "framer-motion";

type AboutData = {
  aboutTopTitle?: string | null
  aboutMainTitle?: string | null
  aboutQuote?: string | null
  aboutDescription?: string | null
}

export default function About({
  data = {},
  brandName = 'بصمة أناقة',
}: {
  data?: AboutData
  brandName?: string
}) {
  return (
    <section id="about" className="relative py-24 md:py-32 bg-surface overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        <div className="relative min-h-[500px] md:min-h-[600px] w-full overflow-hidden bg-brand shadow-2xl flex items-center justify-center">
          {/* Brand-led background: no legacy product imagery */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_35%,rgba(184,138,69,.28),transparent_35%),linear-gradient(135deg,var(--brand-color),#2c2822)]"></div>
          <div className="absolute inset-8 rounded-[3rem] border border-accent/15"></div>
          
          {/* Content Container */}
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 md:p-20 text-center z-10" dir="rtl">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 1 }}
              className="max-w-4xl"
            >
              <span className="text-accent text-xs uppercase tracking-[0.4em] font-bold mb-6 block">
                {data.aboutTopTitle || `هوية ${brandName}`}
              </span>
              
              <h2 className="text-4xl md:text-6xl font-black text-surface mb-8">
                {data.aboutMainTitle || "من نحن"}
              </h2>
              
              <div className="w-12 h-[1px] bg-accent mx-auto mb-10 opacity-70"></div>
              
              <p className="text-2xl md:text-4xl text-surface/90 font-light leading-tight mb-8">
                {data.aboutQuote || 'نؤمن أن المنتج الجيد يجمع بين الجودة، التفاصيل، وتجربة تبقى في الذاكرة.'}
              </p>
              
              <p className="text-surface/70 font-light text-base md:text-xl max-w-2xl mx-auto leading-relaxed md:leading-loose">
                {data.aboutDescription || 'نختار منتجاتنا بعناية ونبني كل تفصيل حول احتياجات العملاء، من اكتشاف المنتج إلى استلامه بثقة وسهولة.'}
              </p>
            </motion.div>
          </div>

          {/* Decorative Corner Accents */}
          <div className="absolute top-8 left-8 w-8 h-8 border-t border-l border-accent/40" />
          <div className="absolute bottom-8 right-8 w-8 h-8 border-b border-r border-accent/40" />
        </div>
      </div>
    </section>
  );
}
