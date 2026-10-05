import React from 'react'
import TestimonialsClient from './TestimonialsClient'
import prisma from '@/lib/prisma'

export default async function Testimonials() {
  let serializedReviews: Array<{
    id: string
    name: string
    city: string | null
    content: string
    rating: number
  }> = []

  try {
    const reviews = await prisma.review.findMany({
      where: {
        status: 'APPROVED',
        isGlobal: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    })

    serializedReviews = reviews.map((review) => ({
      id: review.id,
      name: review.name,
      city: review.city,
      content: review.content,
      rating: review.rating,
    }))
  } catch {
    // Render without testimonials when the database is unavailable during build or runtime.
  }

  return <TestimonialsClient reviews={serializedReviews} />
}
