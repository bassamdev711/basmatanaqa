export interface ProductSchemaData {
  name: string;
  description?: string;
  image?: string;
  sku?: string;
  brand?: string;
  price: string | number;
  currency: string;
  url: string;
  inStock: boolean;
  // We can add aggregateRating and reviews here later if the product has them.
}

export interface BreadcrumbItem {
  name: string;
  url: string;
}

export interface StoreSchemaData {
  storeName: string;
  url: string;
  logo?: string;
}

/**
 * Generates Structured Data (JSON-LD) for a Product.
 * Uses real product data without generating fake reviews.
 */
export function generateProductSchema(data: ProductSchemaData) {
  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: data.name,
    url: data.url,
    offers: {
      '@type': 'Offer',
      price: data.price.toString(),
      priceCurrency: data.currency,
      availability: data.inStock
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
      url: data.url,
    },
  };

  if (data.description) schema.description = data.description;
  if (data.image) schema.image = data.image;
  if (data.sku) schema.sku = data.sku;
  if (data.brand) {
    schema.brand = {
      '@type': 'Brand',
      name: data.brand,
    };
  }

  return schema;
}

/**
 * Generates Structured Data for Breadcrumbs.
 */
export function generateBreadcrumbSchema(items: BreadcrumbItem[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

/**
 * Generates Structured Data for the Organization/Store.
 */
export function generateOrganizationSchema(data: StoreSchemaData) {
  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: data.storeName,
    url: data.url,
  };
  if (data.logo) schema.logo = data.logo;
  return schema;
}

/**
 * Helper to render the JSON-LD script tag safely.
 */
export function renderJsonLd(schema: unknown) {
  return {
    __html: JSON.stringify(schema),
  };
}
