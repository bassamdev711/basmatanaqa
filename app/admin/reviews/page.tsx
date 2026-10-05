import React from 'react'
import { Metadata } from 'next'
import ReviewsClient from './ReviewsClient'
import prisma from '@/lib/prisma'

export const metadata: Metadata = {
  title: 'إدارة المراجعات | لوحة التحكم',
}

export const dynamic = 'force-dynamic'

export default async function AdminReviewsPage() {
  const reviews = await prisma.review.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      product: {
        select: {
          name: true,
          imageUrl: true
        }
      }
    }
  })

  // Format dates and decimals for client
  const serializedReviews = reviews.map(r => ({
    ...r,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
    product: r.product ? {
      name: r.product.name,
      imageUrl: r.product.imageUrl
    } : null
  }))

  return (
    <>
      <ReviewsClient initialReviews={serializedReviews} />
    </>
  )
}
