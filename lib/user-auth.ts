import crypto from 'node:crypto'
import bcrypt from 'bcryptjs'
import { cookies, headers } from 'next/headers'
import prisma from '@/lib/prisma'

export const USER_SESSION_COOKIE = 'basmat_user_session'
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 30
const BCRYPT_ROUNDS = 12

export function normalizePhone(value: unknown): string {
  if (typeof value !== 'string') return ''
  let cleaned = value.trim().replace(/[\s().-]/g, '')
  if (cleaned.length === 9 && cleaned.startsWith('7')) {
    cleaned = '+967' + cleaned
  }
  return cleaned
}

export function normalizeEmail(value: unknown): string | null {
  if (typeof value !== 'string' || !value.trim()) return null
  return value.trim().toLowerCase()
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_ROUNDS)
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex')
}

function createRawToken(): string {
  return crypto.randomBytes(32).toString('base64url')
}

function getClientIp(value: string | null): string | null {
  const ip = value?.split(',').map((part) => part.trim()).filter(Boolean).at(-1)
  return ip ? ip.slice(0, 64) : null
}

export async function createUserSession(userId: string): Promise<string> {
  const token = createRawToken()
  const now = new Date()
  const expiresAt = new Date(now.getTime() + SESSION_TTL_MS)
  const requestHeaders = await headers()

  await prisma.userSession.create({
    data: {
      userId,
      tokenHash: hashToken(token),
      expiresAt,
      ipAddress: getClientIp(requestHeaders.get('x-forwarded-for')),
      userAgent: requestHeaders.get('user-agent')?.slice(0, 1000),
    },
  })

  const cookieStore = await cookies()
  cookieStore.set(USER_SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    expires: expiresAt,
  })
  return token
}

export async function getCurrentUser() {
  const cookieStore = await cookies()
  const token = cookieStore.get(USER_SESSION_COOKIE)?.value
  if (!token) return null

  const session = await prisma.userSession.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { user: true },
  })
  if (!session || session.revokedAt || session.expiresAt <= new Date()) return null

  await prisma.userSession.update({
    where: { id: session.id },
    data: { lastUsedAt: new Date() },
  })
  return session.user
}

export async function revokeCurrentUserSession(): Promise<void> {
  const cookieStore = await cookies()
  const token = cookieStore.get(USER_SESSION_COOKIE)?.value
  if (token) {
    await prisma.userSession.updateMany({
      where: { tokenHash: hashToken(token), revokedAt: null },
      data: { revokedAt: new Date() },
    })
  }
  cookieStore.delete(USER_SESSION_COOKIE)
}

export async function revokeAllUserSessions(userId: string): Promise<void> {
  await prisma.userSession.updateMany({
    where: { userId, revokedAt: null },
    data: { revokedAt: new Date() },
  })
}

export async function requireCurrentUser() {
  const user = await getCurrentUser()
  if (!user) throw new Error('UNAUTHORIZED')
  return user
}

export function hashOneTimeToken(token: string): string {
  return hashToken(token)
}

export function createOneTimeToken(): string {
  return createRawToken()
}

export const USER_SESSION_TTL_MS = SESSION_TTL_MS
