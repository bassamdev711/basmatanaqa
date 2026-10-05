import { Metadata } from 'next';

type PageType = 'product' | 'category' | 'page' | 'home';

interface SeoBaseData {
  title?: string;
  description?: string;
  url: string;
  image?: string;
  searchPhrases?: string[];
}

interface StoreSeoData {
  storeName: string;
  storeDescription: string;
  storeSearchPhrases: string[];
}

/**
 * Builds the title using the provided base title and the store name.
 * Avoids keyword stuffing by keeping it natural.
 */
function buildTitle(baseTitle: string | undefined, storeName: string): string {
  if (!baseTitle) return storeName;
  return `${baseTitle} | ${storeName}`;
}

/**
 * Builds a natural description incorporating search phrases if available, without stuffing.
 */
function buildDescription(
  baseDesc: string | undefined,
  phrases: string[] = [],
  storeDesc: string
): string {
  let desc = baseDesc || storeDesc;
  // If there are phrases and description is short, we can append a natural sentence
  if (phrases.length > 0 && desc.length < 120) {
    const topPhrases = phrases.slice(0, 2).join(' و ');
    if (topPhrases) {
      desc = `${desc} - اكتشف أفضل ${topPhrases}.`;
    }
  }
  
  // Truncate to recommended SEO length (~155-160 chars)
  return desc.length > 155 ? desc.substring(0, 155) + '...' : desc;
}

/**
 * Generates Next.js Metadata object based on page type, page data, and store data.
 * This is the central engine for handling Title, Description, Canonical, OpenGraph, and Twitter cards.
 */
export function generateStoreMetadata(
  type: PageType,
  pageData: SeoBaseData,
  storeData: StoreSeoData
): Metadata {
  const title = buildTitle(pageData.title, storeData.storeName);
  
  // Smart inheritance: if page has no phrases, fallback to store phrases (if it's a general page),
  // but for products it's better to just use description to avoid irrelevant store keywords on a specific product.
  const effectivePhrases = pageData.searchPhrases?.length 
    ? pageData.searchPhrases 
    : (type === 'home' ? storeData.storeSearchPhrases : []);

  const description = buildDescription(pageData.description, effectivePhrases, storeData.storeDescription);

  const metadata: Metadata = {
    title,
    description,
    keywords: effectivePhrases, // Not strictly used by Google anymore, but good for completeness and other engines
    alternates: {
      canonical: pageData.url, // Central canonical URL handling
    },
    openGraph: {
      title,
      description,
      url: pageData.url,
      siteName: storeData.storeName,
      images: pageData.image
        ? [
            {
              url: pageData.image,
              width: 1200,
              height: 630,
              alt: title,
            },
          ]
        : [],
      type: type === 'product' ? 'website' : 'website', // we can use 'product' type if needed later, simplified to website for now
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: pageData.image ? [pageData.image] : [],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
  };

  return metadata;
}

/**
 * Generates No-Index metadata for private pages like Admin, Cart, Checkout.
 */
export function generateNoIndexMetadata(title: string): Metadata {
  return {
    title,
    robots: {
      index: false,
      follow: false,
    },
  };
}
