import prisma from '@/lib/prisma'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { notFound } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function ShippingPolicyPage() {
  const settings = await prisma.storeSettings.findUnique({ where: { id: 'singleton' } })
  
  if (!settings || !settings.showShippingInFooter || !settings.shippingPolicyContent) {
    notFound()
  }

  return (
    <main className="min-h-screen bg-surface text-foreground font-sans flex flex-col">
      <Navbar />
      
      <div className="flex-grow pt-32 pb-20 px-6" dir="rtl">
        <div className="max-w-3xl mx-auto bg-white p-8 md:p-12 rounded-2xl shadow-sm border border-black/5">
          <h1 className="text-3xl md:text-4xl font-black text-brand mb-8 pb-6 border-b border-black/5">
            سياسة الشحن والتوصيل
          </h1>
          
          <div className="prose prose-emerald prose-lg max-w-none prose-headings:font-bold prose-headings:text-foreground prose-p:text-foreground/80 prose-li:text-foreground/80">
            {settings.shippingPolicyContent.split('\n').map((paragraph, idx) => (
              paragraph.trim() ? <p key={idx}>{paragraph}</p> : <br key={idx} />
            ))}
          </div>
        </div>
      </div>

      <Footer />
    </main>
  )
}
