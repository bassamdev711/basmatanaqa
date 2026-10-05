'use server'

import { revokeCurrentUserSession } from '@/lib/user-auth'
import { redirect } from 'next/navigation'

export async function logoutCustomer() {
  await revokeCurrentUserSession()
  redirect('/account/login')
}
