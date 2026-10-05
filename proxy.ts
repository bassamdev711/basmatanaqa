import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { jwtVerify } from 'jose'

const ADMIN_COOKIE_NAME = 'admin_token'
const ADMIN_JWT_ISSUER = 'tif-admin'
const ADMIN_JWT_AUDIENCE = 'tif-admin'
const MIN_JWT_SECRET_LENGTH = 32

export default async function proxy(request: NextRequest) {
  if (!request.nextUrl.pathname.startsWith('/admin')) {
    return NextResponse.next()
  }

  const token = request.cookies.get(ADMIN_COOKIE_NAME)?.value
  const secretValue = process.env.JWT_SECRET

  if (!token || !secretValue || secretValue.length < MIN_JWT_SECRET_LENGTH) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  try {
    const { payload } = await jwtVerify(
      token,
      new TextEncoder().encode(secretValue),
      {
        algorithms: ['HS256'],
        issuer: ADMIN_JWT_ISSUER,
        audience: ADMIN_JWT_AUDIENCE,
      },
    )

    if (payload.role !== 'admin' || payload.sub !== 'admin') {
      throw new Error('Invalid admin claims')
    }

    return NextResponse.next()
  } catch {
    const response = NextResponse.redirect(new URL('/login', request.url))
    response.cookies.delete(ADMIN_COOKIE_NAME)
    return response
  }
}

export const config = {
  matcher: ['/admin/:path*'],
}
