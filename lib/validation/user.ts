import { z } from 'zod'

export const phoneSchema = z.string().trim().regex(/^\+9677[0-9]{8}$/, 'رقم الهاتف يجب أن يتكون من 9 أرقام ويبدأ بـ 7 (مع المفتاح +967)')
export const emailSchema = z.string().trim().toLowerCase().email().max(254).nullable().optional()
export const passwordSchema = z.string()
  .min(8, 'كلمة المرور يجب أن تكون 8 أحرف على الأقل')
  .max(128)
  .refine(
    (password) => /[a-zA-Z]/.test(password) && /\d/.test(password),
    { message: 'كلمة المرور يجب أن تحتوي على أحرف وأرقام معاً لحماية حسابك' }
  )

export const registerSchema = z.object({
  name: z.string().trim().min(2).max(120),
  phone: phoneSchema,
  email: emailSchema,
  password: passwordSchema,
})

export const loginSchema = z.object({
  identifier: z.string().min(3).max(254),
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
