import dynamic from 'next/dynamic'
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import About from "@/components/About";
import Footer from "@/components/Footer";

// Server Components can be directly imported if they are lightweight,
// but we want to stream them or lazy load client components.
import CollectionsSection from "@/components/CollectionsSection";
import ProductsServer from "@/components/ProductsServer";
import { getHomepageSettings } from "@/app/actions/homepage";
import prisma from "@/lib/prisma";
import CampaignBanner from "@/components/CampaignBanner";
import { getStoreConfig } from "@/lib/store-config";

// Dynamic Imports for components below the fold (Lazy Loading)
const Experience = dynamic(() => import("@/components/Experience"), { ssr: true })
const Testimonials = dynamic(() => import("@/components/Testimonials"), { ssr: true })
const Newsletter = dynamic(() => import("@/components/Newsletter"), { ssr: true })
const Contact = dynamic(() => import("@/components/Contact"), { ssr: true })
const Stats = dynamic(() => import("@/components/Stats"), { ssr: true })

export default async function Home() {
  const [store, { data: settings }] = await Promise.all([
    getStoreConfig(),
    getHomepageSettings(),
  ]);
  const safeSettings = {
    ...(settings || {}),
    heroTitle: 'شهرزاد',
    heroSubtitle: 'اختيارات تصنع حضورك.',
    heroDescription: 'تشكيلة متنوعة من المنتجات المختارة بعناية، لتجد ما يناسب ذوقك في كل مناسبة.',
    heroPrimaryButton: 'اكتشف التشكيلة',
    heroSecondaryButton: 'قصتنا',
  };

  let activeCampaign: Awaited<ReturnType<typeof prisma.campaign.findFirst>> = null
  try {
    activeCampaign = await prisma.campaign.findFirst({
      where: {
        isActive: true,
        startDate: { lte: new Date() },
        endDate: { gte: new Date() },
      },
      orderBy: { createdAt: 'desc' }
    })
  } catch {
    // Render the homepage without a campaign when the database is unavailable.
  }

  return (
    <main className="min-h-screen bg-surface text-foreground overflow-hidden font-sans">
      <Navbar storeName={store.name} storeNameLatin={store.nameLatin} />

      {/* 1. Store Identity */}
      <Hero data={safeSettings} brandName={store.name} brandNameLatin={store.nameLatin} />

      {/* Campaign Banner (if any) */}
      {activeCampaign && <CampaignBanner campaign={activeCampaign} />}

      {/* 2. Value Proposition */}
      <About data={safeSettings} brandName={store.name} />

      {/* 3. Categories (Collections) */}
      <CollectionsSection brandName={store.name} />

      {/* 4. Marketing collection: bestsellers */}
      <ProductsServer
        type="bestsellers"
        title="الأكثر مبيعًا"
        subtitle="اختيارات عملائنا المفضلة"
      />

      {/* 5. Marketing collection: offers */}
      <ProductsServer
        type="offers"
        title="عروضنا"
        subtitle="فرص مميزة لفترة محدودة"
      />

      {/* 6. Marketing collection: new arrivals / featured */}
      <ProductsServer
        type="featured"
        title="وصل حديثًا"
        subtitle={`ترشيحات فريق ${store.name}`}
      />

      {/* 7. Why trust us */}
      <Experience data={safeSettings} brandName={store.name} />

      {/* 8. Stats (Social Proof) */}
      <Stats data={safeSettings} />

      {/* 9. Testimonials */}
      <Testimonials />

      {/* 10. Call to action */}
      <Newsletter storeName={store.name} />
      <Contact />

      <Footer storeName={store.name} storeNameLatin={store.nameLatin} />
    </main>
  );
}
