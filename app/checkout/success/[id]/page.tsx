import Link from 'next/link'
import { CheckCircle2 } from 'lucide-react'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import prisma from '@/lib/prisma'
import { notFound } from 'next/navigation'
import { verifyOrderTrackingToken } from '@/lib/order-tracking-token'

export default async function SuccessPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ token?: string | string[] }>
}) {
  const { id } = await params
  const query = await searchParams
  const token = Array.isArray(query.token) ? query.token[0] : query.token

  if (!token || !(await verifyOrderTrackingToken(token, id))) {
    notFound()
  }

  const order = await prisma.order.findUnique({
    where: { id },
    select: { id: true, orderNumber: true },
  })

  if (!order) {
    notFound()
  }

  const orderReference = order.orderNumber || order.id
  const trackingHref = `/track?orderId=${encodeURIComponent(orderReference)}&token=${encodeURIComponent(token)}`

  return (
    <main className="min-h-screen bg-surface text-foreground font-sans flex flex-col" dir="rtl">
      <Navbar />

      <div className="flex-grow pt-40 pb-24 px-6 max-w-7xl mx-auto w-full flex justify-center items-start">
        <div className="w-full max-w-[640px] bg-white shadow-sm p-6 md:p-12 text-center border border-black/5 rounded-2xl">
          <CheckCircle2 className="w-16 h-16 md:w-20 md:h-20 text-brand mx-auto mb-5" />
          <h1 className="text-2xl md:text-4xl font-black text-foreground mb-3">تم تسجيل طلبك بنجاح!</h1>

          <div className="bg-surface-alt p-5 mb-6 mt-4 rounded-xl border border-black/5">
            <p className="text-sm md:text-base mb-1 text-foreground/70">رقم الطلب الخاص بك هو:</p>
            <p className="font-bold text-2xl text-brand tracking-widest" dir="ltr">#{orderReference}</p>
          </div>

          <div className="bg-amber-50 border border-amber-200 text-amber-900 rounded-xl p-5 mb-8 text-right">
            <div className="flex items-start gap-3">
              <span className="text-xl shrink-0 mt-0.5">📞</span>
              <div>
                <p className="font-bold text-base md:text-lg mb-1 text-amber-950">
                  بمجرد إتمام الطلب سنتواصل معك لتأكيد توفره والدفع
                </p>
                <p className="text-xs md:text-sm text-amber-800 leading-relaxed">
                  تم استلام طلبك في نظامنا بنجاح. سيقوم فريق خدمة العملاء بالتواصل معك مباشرة عبر الهاتف أو واتساب لتأكيد توفر المنتجات والمقاسات المطلوبة في المخزن وترتيب طريقة الدفع والتوصيل المناسبة لك.
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href={trackingHref}
              className="btn btn-outline btn-lg font-bold"
            >
              تتبع حالة طلبك
            </Link>

            <Link
              href="/"
              className="btn btn-primary btn-lg font-bold"
            >
              متابعة التسوق
            </Link>
          </div>
        </div>
      </div>

      <Footer />
    </main>
  )
}
