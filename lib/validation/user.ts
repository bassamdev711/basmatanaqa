import { z } from 'zod'

export const phoneSchema = z.string().trim().regex(/^(?:\+967)?7[0-9]{8}$/, 'رقم الهاتف يجب أن يبدأ بـ 7 ويتكون من 9 أرقام')
export const emailSchema = z.string().trim().toLowerCase().email().max(254).nullable().optional()
export const passwordSchema = z.string()
  .min(8, 'كلمة المرور يجب أن تكون 8 أحرف على الأقل')
  .max(128)
  .refine(
    (password) => /[a-zA-Z]/.test(password) && /\d/.test(password),
    { message: 'كلمة المرور يجب أن تحتوي على أحرف وأرقام معاً لحماية حسابك' }
  )

export const nameSchema = z.string().trim().min(2, 'الاسم يجب أن يكون حرفين على الأقل').max(120, 'الاسم طويل جداً').regex(/^[\p{L}\s]+$/u, 'الاسم يجب أن يحتوي على أحرف ومسافات فقط')

export const registerSchema = z.object({
  name: nameSchema,
  phone: phoneSchema,
  email: emailSchema,
  password: passwordSchema,
})

export const loginSchema = z.object({
  identifier: z.string().min(3).max(254),
  password: z.string().min(1).max(128),
})

export const profileSchema = z.object({
  name: nameSchema.optional(),
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
