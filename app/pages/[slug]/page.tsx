import React from 'react'
import { notFound } from 'next/navigation'
import prisma from '@/lib/prisma'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { getStoreConfig } from '@/lib/store-config'

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const [page, store] = await Promise.all([
    prisma.legalPage.findUnique({ where: { slug } }),
    getStoreConfig(),
  ])
  
  if (!page || !page.isActive) {
    return { title: `الصفحة غير موجودة | ${store.name}` }
  }

  return { title: `${page.title} | ${store.name}` }
}

export default async function LegalPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const page = await prisma.legalPage.findUnique({
    where: { slug }
  })

  if (!page || !page.isActive) {
    notFound()
  }

  return (
    <main className="min-h-screen bg-surface text-foreground font-sans flex flex-col" dir="rtl">
      <Navbar />
      
      <div className="flex-grow pt-32 pb-24 px-6 max-w-4xl mx-auto w-full">
        <h1 className="text-4xl md:text-5xl font-black text-foreground mb-12 border-b border-black/10 pb-8">
          {page.title}
        </h1>
        
        <div className="prose prose-lg prose-green max-w-none prose-headings:font-black prose-headings:text-foreground prose-p:text-foreground/80 prose-a:text-accent hover:prose-a:text-accent whitespace-pre-wrap leading-relaxed">
          {page.content}
        </div>
      </div>

      <Footer />
    </main>
  )
}
