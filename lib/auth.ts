import { cookies } from 'next/headers'
import { jwtVerify } from 'jose'

export const ADMIN_COOKIE_NAME = 'admin_token'
const ADMIN_JWT_ISSUER = 'tif-admin'
const ADMIN_JWT_AUDIENCE = 'tif-admin'
const MIN_JWT_SECRET_LENGTH = 32

export function getAdminJwtSecret(): Uint8Array {
  const value = process.env.JWT_SECRET
  if (!value || value.length < MIN_JWT_SECRET_LENGTH) {
    throw new Error(`CRITICAL: JWT_SECRET must be configured with at least ${MIN_JWT_SECRET_LENGTH} characters`)
  }
  return new TextEncoder().encode(value)
}

export async function verifyAdmin(requestToken?: string) {
  let token = requestToken
  if (!token) {
    const cookieStore = await cookies()
    token = cookieStore.get(ADMIN_COOKIE_NAME)?.value
  }

  if (!token) {
    throw new Error('Unauthorized: No admin token found')
  }

  try {
    const { payload } = await jwtVerify(token, getAdminJwtSecret(), {
      algorithms: ['HS256'],
      issuer: ADMIN_JWT_ISSUER,
      audience: ADMIN_JWT_AUDIENCE,
    })

    if (payload.role !== 'admin' || payload.sub !== 'admin') {
      throw new Error('Unauthorized: Invalid admin claims')
    }

    return true
  } catch {
    throw new Error('Unauthorized: Invalid or expired token')
  }
}

export const ADMIN_JWT_CONFIG = {
  issuer: ADMIN_JWT_ISSUER,
  audience: ADMIN_JWT_AUDIENCE,
}
