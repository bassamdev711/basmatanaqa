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
        <div className="w-full max-w-[640px] bg-white shadow-sm p-12 text-center border border-black/5">
          <CheckCircle2 className="w-20 h-20 text-brand mx-auto mb-6" />
          <h1 className="text-4xl font-black text-foreground mb-4">تم استلام طلبك بنجاح!</h1>

          <div className="bg-surface-alt p-6 mb-8 mt-6">
            <p className="text-lg mb-2">رقم الطلب الخاص بك هو:</p>
            <p className="font-bold text-xl text-brand tracking-widest">{orderReference}</p>
          </div>

          <p className="text-foreground/70 mb-10 leading-relaxed text-lg">
            سنقوم بمراجعة طلبك وتجهيزه بأسرع وقت ممكن. يمكنك تتبع حالة طلبك في أي وقت من خلال صفحة تتبع الطلبات. شكرًا لثقتك بنا!
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href={trackingHref}
              className="btn btn-outline btn-lg"
            >
              تتبع طلبك الآن
            </Link>

            <Link
              href="/"
              className="btn btn-primary btn-lg"
            >
              العودة للرئيسية
            </Link>
          </div>
        </div>
      </div>

      <Footer />
    </main>
  )
}
