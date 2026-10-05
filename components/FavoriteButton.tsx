'use client'

import { Heart } from 'lucide-react'
import { useFavorites } from './FavoritesProvider'
import { useToast } from './ToastProvider'
import React from 'react'

interface FavoriteButtonProps {
  product: {
    id: string
    name: string
    slug: string
    price: number
    compareAtPrice: number | null
    imageUrl: string
    engName?: string
  }
  className?: string
  size?: number
}

export default function FavoriteButton({ product, className = '', size = 22 }: FavoriteButtonProps) {
  const { isFavorite, toggleFavorite } = useFavorites()
  const { showToast } = useToast()
  
  const isFav = isFavorite(product.id)
  
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    toggleFavorite({
      id: product.id,
      name: product.name,
      slug: product.slug,
      price: product.price,
      compareAtPrice: product.compareAtPrice,
      imageUrl: product.imageUrl,
      engName: product.engName
    })
    showToast('subtle', isFav ? 'تمت الازاله من المفضله' : 'تمت الاضافه الى المفضله')
  }

  return (
    <button 
      className={`absolute top-4 right-4 z-20 transition-all duration-300 drop-shadow-md hover:scale-110 active:scale-95 ${
        isFav ? 'text-red-500 opacity-100' : 'text-white hover:text-red-500 opacity-0 group-hover:opacity-100 md:opacity-0 md:group-hover:opacity-100 max-md:opacity-100'
      } ${className}`}
      onClick={handleClick}
      aria-label="إضافة للمفضلة"
    >
      <Heart 
        size={size} 
        fill={isFav ? "currentColor" : "#ffffff"} 
        stroke={isFav ? "currentColor" : "rgba(0,0,0,0.4)"}
        strokeWidth={1.5}
      />
    </button>
  )
}
