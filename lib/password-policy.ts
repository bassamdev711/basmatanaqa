const COMMON_PASSWORDS = new Set([
  'password',
  'password123',
  'admin',
  'admin123',
  '12345678',
  '123456789',
  '1234567890',
  'qwerty',
  'qwerty123',
  'letmein',
  'welcome',
])

export const MIN_ADMIN_PASSWORD_LENGTH = 12

export function validateAdminPassword(password: string): string | null {
  if (password.length < MIN_ADMIN_PASSWORD_LENGTH) {
    return `يجب أن لا تقل كلمة المرور عن ${MIN_ADMIN_PASSWORD_LENGTH} حرفاً`
  }

  if (password.length > 256) {
    return 'كلمة المرور طويلة جداً'
  }

  const normalized = password.trim().toLowerCase()
  if (!normalized || COMMON_PASSWORDS.has(normalized)) {
    return 'يرجى اختيار كلمة مرور أقوى وغير شائعة'
  }

  const characterClasses = [
    /[a-z]/.test(password),
    /[A-Z]/.test(password),
    /\d/.test(password),
    /[^A-Za-z\d]/.test(password),
  ].filter(Boolean).length

  if (characterClasses < 3) {
    return 'يجب أن تحتوي كلمة المرور على ثلاثة أنواع على الأقل من الأحرف الكبيرة والصغيرة والأرقام والرموز'
  }

  return null
}
