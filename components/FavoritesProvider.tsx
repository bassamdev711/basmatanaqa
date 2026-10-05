'use client'

import React, { createContext, startTransition, useContext, useState, useEffect, ReactNode } from 'react'

export interface FavoriteItem {
  id: string
  name: string
  slug: string
  price: number
  compareAtPrice: number | null
  imageUrl: string
  engName?: string
}

interface FavoritesContextType {
  favorites: FavoriteItem[]
  toggleFavorite: (item: FavoriteItem) => void
  isFavorite: (id: string) => boolean
  favoritesCount: number
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined)

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const [favorites, setFavorites] = useState<FavoriteItem[]>([])
  const [isLoaded, setIsLoaded] = useState(false)

  // Load favorites from local storage on mount
  useEffect(() => {
    try {
      const storedFavorites = localStorage.getItem('tif_favorites')
      if (storedFavorites) {
        startTransition(() => {
          setFavorites(JSON.parse(storedFavorites))
        })
      }
    } catch (e) {
      console.error('Failed to load favorites', e)
    }
    startTransition(() => {
      setIsLoaded(true)
    })
  }, [])

  // Save to local storage whenever favorites change
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem('tif_favorites', JSON.stringify(favorites))
    }
  }, [favorites, isLoaded])

  const toggleFavorite = (item: FavoriteItem) => {
    setFavorites(prev => {
      const existing = prev.find(fav => fav.id === item.id)
      if (existing) {
        return prev.filter(fav => fav.id !== item.id)
      } else {
        return [...prev, item]
      }
    })
  }

  const isFavorite = (id: string) => {
    return favorites.some(fav => fav.id === id)
  }

  return (
    <FavoritesContext.Provider value={{
      favorites,
      toggleFavorite,
      isFavorite,
      favoritesCount: favorites.length
    }}>
      {children}
    </FavoritesContext.Provider>
  )
}

export function useFavorites() {
  const context = useContext(FavoritesContext)
  if (context === undefined) {
    throw new Error('useFavorites must be used within a FavoritesProvider')
  }
  return context
}
