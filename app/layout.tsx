import type { Metadata } from "next";
import { Tajawal } from "next/font/google";
import "./globals.css";

import prisma from "@/lib/prisma";
import { getSiteUrl, getStoreConfig } from "@/lib/store-config";

const tajawal = Tajawal({
  subsets: ["arabic"],
  weight: ["200", "300", "400", "500", "700"],
  variable: "--font-tajawal",
});

export async function generateMetadata(): Promise<Metadata> {
  const store = await getStoreConfig()
  const title = store.nameLatin && store.name !== store.nameLatin
    ? `${store.name} | ${store.nameLatin}`
    : store.name
  // The social crawlers need a public absolute URL, not a local/relative path.
  // Prefer the deployment URL from Vercel over any stale database value.
  const siteUrl = getSiteUrl(process.env.NEXT_PUBLIC_SITE_URL || store.storeUrl)
  const shareImage = new URL('/share.webp', siteUrl).toString()
  const twitterImage = new URL('/share.webp', siteUrl).toString()
  const keywords = [
    'شهرزاد',
    'متجر شهرزاد',
    'متجر إلكتروني متنوع',
    'ملابس وأزياء',
    'أحذية وحقائب',
    'إكسسوارات وعطور',
    'الجمال والعناية',
  ]

  return {
    metadataBase: new URL('https://shahrazadstore.com'),
    title: {
      default: `شهرزاد | التسوق أونلاين في اليمن`,
      template: `%s | شهرزاد`,
    },
    description: 'اكتشف عالم شهرزاد وتسوّق عبر الإنترنت في اليمن. تصفّح المنتجات والفئات المتاحة واستمتع بتجربة تسوق سهلة عبر موقعنا الإلكتروني.',
    keywords,
    alternates: { canonical: 'https://shahrazadstore.com/' },
    authors: [{ name: 'شهرزاد' }],
    creator: 'شهرزاد',
    publisher: 'شهرزاد',
    openGraph: {
      title: 'شهرزاد | Shahrazad',
      description: 'اكتشف عالم شهرزاد وتسوّق عبر الإنترنت في اليمن. تصفّح المنتجات والفئات المتاحة واستمتع بتجربة تسوق سهلة عبر موقعنا الإلكتروني.',
      url: 'https://shahrazadstore.com/',
      siteName: 'شهرزاد | Shahrazad',
      type: 'website',
      images: [{ 
        url: 'https://shahrazadstore.com/share.jpg', 
        width: 1200, 
        height: 630, 
        alt: 'شهرزاد',
        type: 'image/jpeg'
      }],
    },
    twitter: {
      card: 'summary_large_image',
      title: 'شهرزاد | Shahrazad',
      description: 'اكتشف عالم شهرزاد وتسوّق عبر الإنترنت في اليمن. تصفّح المنتجات والفئات المتاحة واستمتع بتجربة تسوق سهلة عبر موقعنا الإلكتروني.',
      images: ['https://shahrazadstore.com/share.jpg'],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-image-preview': 'large',
        'max-snippet': -1,
        'max-video-preview': -1,
      },
    },
    icons: {
      icon: '/logo.webp',
      shortcut: '/logo.webp',
      apple: '/logo.webp',
    },
  }
}

import { CartProvider } from "@/components/CartProvider";
import { CheckoutProvider } from "@/components/CheckoutProvider";
import { CartAnimationProvider } from "@/components/CartAnimationProvider";
import { ToastProvider } from "@/components/ToastProvider";
import { ConfirmProvider } from "@/components/ConfirmProvider";
import { CurrencyProvider } from "@/components/CurrencyProvider";
import { FavoritesProvider } from "@/components/FavoritesProvider";
import AnnouncementBar from "@/components/AnnouncementBar";
import VisitorTracker from "@/components/VisitorTracker";
import SplashScreen from "@/components/SplashScreen";
import MobileBottomNav from "@/components/MobileBottomNav";

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const store = await getStoreConfig()
  const siteUrl = getSiteUrl(process.env.NEXT_PUBLIC_SITE_URL || store.storeUrl)
  const organizationSchema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'شهرزاد',
    alternateName: 'Shahrazad',
    url: 'https://shahrazadstore.com',
    logo: 'https://shahrazadstore.com/logo.webp',
  }
  const websiteSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'شهرزاد',
    alternateName: 'Shahrazad',
    url: 'https://shahrazadstore.com',
    potentialAction: {
      '@type': 'SearchAction',
      target: `https://shahrazadstore.com/search?q={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  }
  const jsonLd = (value: unknown) => JSON.stringify(value).replace(/</g, '\\u003c')
  let currency = "ر.س"
  try {
    const paymentSettings = await prisma.paymentSettings.findUnique({
      where: { id: 'singleton' },
      select: { currency: true }
    })
    if (paymentSettings?.currency) {
      currency = paymentSettings.currency
    }
  } catch {}

  return (
    <html lang="ar" dir="rtl" className={`${tajawal.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-sans bg-surface text-foreground overflow-x-hidden pb-16 md:pb-0">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(organizationSchema) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(websiteSchema) }} />
        <SplashScreen storeName={store.name} storeNameLatin={store.nameLatin} />
        <VisitorTracker />
        <CurrencyProvider currency={currency}>
          <ToastProvider>
            <ConfirmProvider>
              <CartAnimationProvider>
                <CheckoutProvider>
                  <CartProvider>
                    <FavoritesProvider>
                      <AnnouncementBar />
                      {children}
                      <MobileBottomNav />

                    </FavoritesProvider>
                  </CartProvider>
                </CheckoutProvider>
              </CartAnimationProvider>
            </ConfirmProvider>
          </ToastProvider>
        </CurrencyProvider>
      </body>
    </html>
  );
}
