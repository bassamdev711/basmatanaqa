import React from 'react'
import TestimonialsClient from './TestimonialsClient'
import prisma from '@/lib/prisma'

export default async function ProductReviews({ productId }: { productId: string }) {
  const reviews = await prisma.review.findMany({
    where: { 
      status: 'APPROVED',
      productId: productId 
    },
    orderBy: { createdAt: 'desc' },
    take: 20 // Max 20 reviews on product page for now
  })

  // Format dates for client
  const serializedReviews = reviews.map(r => ({
    id: r.id,
    name: r.name,
    city: r.city,
    content: r.content,
    rating: r.rating
  }))

  return (
    <TestimonialsClient 
      reviews={serializedReviews} 
      title="مراجعات المنتج"
      subtitle="ماذا يقول عملاؤنا عن هذا المنتج؟"
      productId={productId}
    />
  )
}
