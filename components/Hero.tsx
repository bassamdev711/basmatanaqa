"use client";

import Image from "next/image";
import { motion } from "framer-motion";

type HeroData = {
  heroTitle?: string | null
  heroSubtitle?: string | null
  heroDescription?: string | null
  heroPrimaryButton?: string | null
  heroSecondaryButton?: string | null
}

const brandDefaults = {
  title: "بصمة أناقة",
  subtitle: "اختيارات تصنع حضورك.",
  description: "تشكيلة متنوعة من المنتجات المختارة بعناية، لتجد ما يناسب ذوقك في كل مناسبة.",
}

export default function Hero({ data = {}, brandName = 'بصمة أناقة' }: {
  data?: HeroData
  brandName?: string
  brandNameLatin?: string
}) {
  const scrollToProducts = () => document.getElementById("products")?.scrollIntoView({ behavior: "smooth" });
  const title = data.heroTitle || brandName || brandDefaults.title;
  const subtitle = data.heroSubtitle || brandDefaults.subtitle;
  const description = data.heroDescription || brandDefaults.description;

  return (
    <section id="hero" className="relative w-full overflow-hidden bg-surface" dir="rtl">
      <div className="pointer-events-none absolute inset-0 opacity-40 [background-image:linear-gradient(to_left,rgba(184,138,69,.08)_1px,transparent_1px),linear-gradient(to_bottom,rgba(184,138,69,.06)_1px,transparent_1px)] [background-size:72px_72px]" />
      <div className="pointer-events-none absolute bottom-0 left-0 h-1/2 w-1/2 bg-gradient-to-tr from-accent/10 to-transparent" />

      <div className="relative z-10 mx-auto grid min-h-[720px] max-w-7xl items-center gap-12 px-6 pb-16 pt-32 lg:grid-cols-[1.05fr_.95fr] lg:px-12 lg:pt-40">
        <motion.div initial={{ opacity: 0, x: 28 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8 }} className="order-2 text-center lg:order-1 lg:text-right">
          <span className="mb-6 inline-flex items-center gap-4 text-[11px] font-bold tracking-[0.32em] text-accent">
            <span className="h-px w-12 bg-accent" />
            BASMAT ANAQAH
          </span>
          <h1 className="mb-5 text-5xl font-black leading-[1.05] tracking-tight text-foreground sm:text-7xl lg:text-[6.2rem]">{title}</h1>
          <p className="mb-6 text-2xl font-light leading-snug text-brand sm:text-3xl">{subtitle}</p>
          <p className="mx-auto mb-10 max-w-xl whitespace-pre-line text-base leading-8 text-foreground/65 lg:mx-0">{description}</p>
          <div className="flex flex-wrap justify-center gap-3 lg:justify-start">
            <button onClick={scrollToProducts} className="btn btn-primary btn-lg">{data.heroPrimaryButton || "تسوّق أحدث التشكيلات"}</button>
            <a href="#about" className="btn btn-outline btn-lg">{data.heroSecondaryButton || "قصتنا"}</a>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, x: -24 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 1 }} className="order-1 flex justify-center lg:order-2">
          <div className="relative flex min-h-[410px] w-full max-w-[430px] items-center justify-center overflow-hidden bg-brand px-10 py-14 shadow-2xl sm:min-h-[540px]">
            <div className="absolute right-0 top-0 h-full w-1 bg-accent" />
            <div className="absolute inset-6 border border-accent/25" />
            <div className="absolute bottom-8 left-8 text-[10px] font-bold tracking-[0.3em] text-surface/40 [writing-mode:vertical-rl]">CURATED DETAILS</div>
            <div className="relative z-10 flex flex-col items-center text-center">
              <Image src="/logo.webp" alt="شعار بصمة أناقة" width={360} height={360} priority className="h-64 w-64 object-contain sm:h-80 sm:w-80" />
              <span className="mt-7 h-px w-20 bg-accent" />
              <span className="mt-4 text-sm tracking-[0.18em] text-surface/75">تفاصيل مختارة. حضور مختلف.</span>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
