import Link from "next/link";
import Image from "next/image";
import { Send, AtSign, MapPin, Phone, Mail } from "lucide-react";
import prisma from "@/lib/prisma";

const InstagramIcon = (props: React.SVGProps<SVGSVGElement> & { size?: number }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={props.size || 18} height={props.size || 18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg>
);

const FacebookIcon = (props: React.SVGProps<SVGSVGElement> & { size?: number }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={props.size || 18} height={props.size || 18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
);

const XIcon = (props: React.SVGProps<SVGSVGElement> & { size?: number }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={props.size || 18} height={props.size || 18} viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.258 5.63 5.906-5.63Zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

export default async function Footer({
  storeName = 'بصمة أناقة',
  storeNameLatin = 'BASMAT ANAQAH',
}: {
  storeName?: string
  storeNameLatin?: string
}) {
  const currentYear = new Date().getFullYear();
  
  let legalPages: Array<{ id: string; slug: string; title: string }> = []
  let settings: { showShippingInFooter: boolean; showReturnInFooter: boolean } | null = null
  let contactSettings: {
    phoneNumber: string | null
    showPhoneNumber: boolean
    emailAddress: string | null
    showEmailAddress: boolean
    address: string | null
    showAddress: boolean
    instagramUrl: string | null
    showInstagram: boolean
    facebookUrl: string | null
    showFacebook: boolean
    twitterUrl: string | null
    showTwitter: boolean
    telegramUrl: string | null
    showTelegram: boolean
    threadsUrl: string | null
    showThreads: boolean
  } | null = null

  try {
    const [dbLegalPages, dbSettings, dbContactSettings] = await Promise.all([
      prisma.legalPage.findMany({
        where: { isActive: true },
        orderBy: { createdAt: 'asc' },
        select: { id: true, slug: true, title: true },
      }),
      prisma.storeSettings.findUnique({ where: { id: 'singleton' } }),
      prisma.contactSettings.findUnique({ where: { id: 'singleton' } }),
    ])
    legalPages = dbLegalPages
    settings = dbSettings
    contactSettings = dbContactSettings
  } catch {
    // Render the configured fallbacks when the database is unavailable during build or runtime.
  }

  const phone = contactSettings?.phoneNumber || null;
  const showPhone = Boolean(phone && contactSettings?.showPhoneNumber !== false);
  const email = contactSettings?.emailAddress || null;
  const showEmail = Boolean(email && contactSettings?.showEmailAddress !== false);
  const address = contactSettings?.address || null;
  const showAddress = Boolean(address && contactSettings?.showAddress !== false);
  
  const instagram = contactSettings?.instagramUrl || null;
  const showInstagram = Boolean(instagram && contactSettings?.showInstagram !== false);
  const facebook = contactSettings?.facebookUrl || null;
  const showFacebook = Boolean(facebook && contactSettings?.showFacebook !== false);
  const twitter = contactSettings?.twitterUrl || null;
  const showTwitter = Boolean(twitter && contactSettings?.showTwitter !== false);
  const telegram = contactSettings?.telegramUrl || null;
  const showTelegram = Boolean(telegram && contactSettings?.showTelegram !== false);
  const threads = contactSettings?.threadsUrl || null;
  const showThreads = Boolean(threads && contactSettings?.showThreads !== false);
  return (
    <footer className="bg-brand border-t border-accent/10 text-surface/80 pt-12 pb-8 md:pt-20 md:pb-10" dir="rtl">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 md:gap-12 mb-12 md:mb-16">
          <div className="md:col-span-1">
            <Link href="/" className="mb-6 inline-flex items-center gap-3">
              <Image src="/basmat-anaqah-logo.webp" alt={`شعار ${storeName}`} width={58} height={58} className="h-12 w-12 object-contain" />
              <span className="flex flex-col gap-1 leading-none">
                <span className="text-xs font-bold tracking-[0.18em] text-accent">{storeNameLatin}</span>
                <span className="text-xl font-light tracking-[0.12em] text-surface">{storeName}</span>
              </span>
            </Link>
            <p className="text-sm leading-relaxed text-surface/80 mb-6">
              نختار منتجاتنا بعناية لنمنحك تجربة واضحة، موثوقة، وتترك أثرًا يستحق التذكر.
            </p>
            <div className="flex gap-4">
              {showInstagram && (
                <a
                  href={instagram || undefined}
                  target="_blank"
                  rel="noreferrer"
                  aria-label="حسابنا على انستقرام"
                  className="w-10 h-10 rounded-full border border-accent/30 flex items-center justify-center text-accent hover:bg-accent hover:text-brand transition-all duration-300"
                >
                  <InstagramIcon size={18} />
                </a>
              )}
              {showFacebook && (
                <a
                  href={facebook || undefined}
                  target="_blank"
                  rel="noreferrer"
                  aria-label="حسابنا على فيسبوك"
                  className="w-10 h-10 rounded-full border border-accent/30 flex items-center justify-center text-accent hover:bg-accent hover:text-brand transition-all duration-300"
                >
                  <FacebookIcon size={18} />
                </a>
              )}
              {showTwitter && (
                <a
                  href={twitter || undefined}
                  target="_blank"
                  rel="noreferrer"
                  aria-label="حسابنا على تويتر إكس"
                  className="w-10 h-10 rounded-full border border-accent/30 flex items-center justify-center text-accent hover:bg-accent hover:text-brand transition-all duration-300"
                >
                  <XIcon size={18} />
                </a>
              )}
              {showTelegram && (
                <a
                  href={telegram || undefined}
                  target="_blank"
                  rel="noreferrer"
                  aria-label="تواصل معنا عبر تيليجرام"
                  className="w-10 h-10 rounded-full border border-accent/30 flex items-center justify-center text-accent hover:bg-accent hover:text-brand transition-all duration-300"
                >
                  <Send size={18} />
                </a>
              )}
              {showThreads && (
                <a
                  href={threads || undefined}
                  target="_blank"
                  rel="noreferrer"
                  aria-label="حسابنا على ثريدز"
                  className="w-10 h-10 rounded-full border border-accent/30 flex items-center justify-center text-accent hover:bg-accent hover:text-brand transition-all duration-300"
                >
                  <AtSign size={18} />
                </a>
              )}
            </div>
          </div>

          <div>
            <h3 className="text-surface font-bold mb-6 tracking-wider text-base">استكشف</h3>
            <ul className="space-y-4">
              {['المجموعة', 'الأكثر مبيعًا', 'المنتجات الجديدة', 'التصنيفات'].map((item) => (
                <li key={item}>
                  <Link href="/products" className="text-sm text-surface/80 hover:text-accent transition-colors">
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-surface font-bold mb-6 tracking-wider text-base">خدمة العملاء</h3>
            <ul className="space-y-4">
              {legalPages.map((page) => (
                <li key={page.id}>
                  <Link href={`/pages/${page.slug}`} className="text-sm text-surface/80 hover:text-accent transition-colors">
                    {page.title}
                  </Link>
                </li>
              ))}
              {settings?.showShippingInFooter && (
                <li>
                  <Link href="/policies/shipping" className="text-sm text-surface/80 hover:text-accent transition-colors">
                    سياسة الشحن والتوصيل
                  </Link>
                </li>
              )}
              {settings?.showReturnInFooter && (
                <li>
                  <Link href="/policies/return" className="text-sm text-surface/80 hover:text-accent transition-colors">
                    سياسة الاسترجاع
                  </Link>
                </li>
              )}
              <li>
                <Link href="/track" className="text-sm text-surface/80 hover:text-accent transition-colors">
                  تتبع الطلب
                </Link>
              </li>
              <li>
                <Link href="/#contact" className="text-sm text-surface/80 hover:text-accent transition-colors">
                  تواصل معنا
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-surface font-bold mb-6 tracking-wider text-base">تواصل معنا</h3>
            <ul className="space-y-4 text-sm text-surface/80">
              {showAddress && (
                <li className="flex items-center gap-3">
                  <span className="text-accent"><MapPin size={16} /></span>
                  {address}
                </li>
              )}
              {showPhone && (
                <li className="flex items-center gap-3">
                  <span className="text-accent"><Phone size={16} /></span>
                  <a href={`tel:${phone}`} dir="ltr" className="hover:text-accent transition-colors">{phone}</a>
                </li>
              )}
              {showEmail && (
                <li className="flex items-center gap-3">
                  <span className="text-accent"><Mail size={16} /></span>
                  <a href={`mailto:${email}`} className="hover:text-accent transition-colors">{email}</a>
                </li>
              )}
            </ul>
          </div>
        </div>

        <div className="border-t border-accent/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-surface/60">
          <p>© {currentYear} {storeName}. جميع الحقوق محفوظة.</p>
          <div className="flex flex-wrap gap-4 md:gap-6 justify-center">
            {legalPages.map(page => (
              <Link key={page.id} href={`/pages/${page.slug}`} className="hover:text-accent transition-colors">
                {page.title}
              </Link>
            ))}
            {settings?.showShippingInFooter && (
              <Link href="/policies/shipping" className="hover:text-accent transition-colors">
                سياسة الشحن
              </Link>
            )}
            {settings?.showReturnInFooter && (
              <Link href="/policies/return" className="hover:text-accent transition-colors">
                سياسة الاسترجاع
              </Link>
            )}
          </div>
        </div>
      </div>
    </footer>
  );
}
