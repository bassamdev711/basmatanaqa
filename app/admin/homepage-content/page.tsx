import React from 'react'
import { Metadata } from 'next'
import HomepageContentClient from './HomepageContentClient'
import { getHomepageSettings } from '@/app/actions/homepage'

export const metadata: Metadata = {
  title: 'إدارة محتوى الرئيسية | لوحة التحكم',
}

export const dynamic = 'force-dynamic'

export default async function AdminHomepageContentPage() {
  const { data: settings } = await getHomepageSettings()

  return (
    <HomepageContentClient initialData={settings ?? null} />
  )
}
