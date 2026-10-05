import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    // CSP مصممة خصيصاً للتطبيق — لا تكسر أي وظيفة
    const cspDirectives = [
      "default-src 'self'",
      // Scripts: self + Next.js inline scripts (needed for hydration)
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      // Styles: self + Google Fonts + inline styles (Tailwind)
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      // Fonts: Google Fonts CDN
      "font-src 'self' https://fonts.gstatic.com data:",
      // Images: self + Vercel Blob + Google (avatars) + data URIs
      "img-src 'self' https://*.public.blob.vercel-storage.com https://lh3.googleusercontent.com https://images.unsplash.com data: blob:",
      // Connect: self + Vercel Blob
      "connect-src 'self' https://*.vercel-storage.com",
      // Media: self only
      "media-src 'self'",
      // Objects: none
      "object-src 'none'",
      // Frames: none (prevents clickjacking)
      "frame-src 'none'",
      // Frame ancestors: none (prevents embedding)
      "frame-ancestors 'none'",
      // Base URI: self only
      "base-uri 'self'",
      // Form action: self only
      "form-action 'self'",
      // Upgrade insecure requests in production
      "upgrade-insecure-requests",
    ].join('; ');

    return [
      {
        source: '/(.*)',
        headers: [
          // Prevent MIME type sniffing
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          // Prevent clickjacking (also covered by CSP frame-ancestors)
          { key: 'X-Frame-Options', value: 'DENY' },
          // Force HTTPS for 1 year
          { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains; preload' },
          // Referrer policy — only send origin on same-origin requests
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          // Disable unnecessary browser features
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=(), bluetooth=()' },
          // Prevent DNS prefetching to external resources
          { key: 'X-DNS-Prefetch-Control', value: 'off' },
          // Content Security Policy
          { key: 'Content-Security-Policy', value: cspDirectives },
        ],
      },
    ]
  },
  images: {
    // تحويل تلقائي إلى AVIF أولاً ثم WebP — يُقلّل حجم الصورة بنسبة 30-50%
    formats: ['image/avif', 'image/webp'],

    // أحجام الشاشات — يختار المتصفح الأنسب عبر srcset
    deviceSizes: [360, 480, 640, 750, 828, 1080, 1200, 1920],

    // أحجام الصور الثابتة (fill / fixed)
    imageSizes: [16, 32, 48, 64, 80, 96, 128, 256, 384],

    // Cache الصور لمدة أسبوع (604800 ثانية) — يمنع إعادة التحميل بلا داعٍ
    minimumCacheTTL: 604800,

    // مصادر الصور المسموح بها
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.public.blob.vercel-storage.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;

