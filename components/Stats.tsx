"use client";

import { motion } from "framer-motion";

type StatItem = {
  value: string
  label: string
}

type StatsData = {
  statsJson?: string | null
}

const defaultStats: StatItem[] = [
  { value: "01", label: "اختيار واضح" },
  { value: "02", label: "خدمة موثوقة" },
  { value: "03", label: "تجربة سهلة" },
  { value: "04", label: "دعم مستمر" },
]

export default function Stats({ data = {} }: { data?: StatsData }) {
  let stats = defaultStats

  if (data.statsJson) {
    try {
      const parsed: unknown = JSON.parse(data.statsJson)
      if (Array.isArray(parsed)) {
        const validStats = parsed.filter((stat): stat is StatItem => {
          if (!stat || typeof stat !== 'object') return false
          const candidate = stat as Record<string, unknown>
          return typeof candidate.value === 'string' && typeof candidate.label === 'string'
        })
        if (validStats.length > 0) stats = validStats
      }
    } catch {
      stats = defaultStats
    }
  }

  return (
    <section className="py-20 bg-brand text-surface border-y border-accent/10">
      <div className="max-w-7xl mx-auto px-6 lg:px-12" dir="rtl">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12 divide-x divide-x-reverse divide-surface/10">
          {stats.map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: (index * 0.1) + 0.1 }}
              className="text-center px-4"
            >
              <h4 className="text-4xl md:text-5xl font-black text-accent mb-3">{stat.value}</h4>
              <p className="text-sm md:text-base text-surface/80 font-medium">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
