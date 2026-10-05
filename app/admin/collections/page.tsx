import React from 'react'
import { getCollections } from './actions'
import CollectionsClient from './CollectionsClient'

export const dynamic = 'force-dynamic'

export default async function CollectionsPage() {
  const collections = await getCollections()

  return (
    <CollectionsClient initialCollections={collections} />
  )
}
