import { z } from 'zod'

export const phoneSchema = z.string().trim().min(7).max(32).regex(/^\+?[\d\s().-]+$/)
export const emailSchema = z.string().trim().toLowerCase().email().max(254).nullable().optional()
export const passwordSchema = z.string().min(10).max(128)

export const registerSchema = z.object({
  name: z.string().trim().min(2).max(120),
  phone: phoneSchema,
  email: emailSchema,
  password: passwordSchema,
})

export const loginSchema = z.object({
  phone: phoneSchema,
  password: z.string().min(1).max(128),
})

export const profileSchema = z.object({
  name: z.string().trim().min(2).max(120).optional(),
  email: emailSchema,
})

export const resetRequestSchema = z.object({
  phone: phoneSchema.optional(),
  email: z.string().trim().toLowerCase().email().max(254).optional(),
}).refine((data) => Boolean(data.phone || data.email), { message: 'phone_or_email_required' })

export const resetPasswordSchema = z.object({
  token: z.string().min(32).max(200),
  password: passwordSchema,
})
