// فحص الرقم الفعلي المحفوظ في قاعدة البيانات للعميل
import prisma from '@/lib/prisma'
import { verifyPassword } from '@/lib/user-auth'

async function main() {
  const userId = 'cmv2bflut0001b69yrzu0phof'
  const user = await prisma.user.findUnique({ where: { id: userId } })
  
  if (!user) {
    console.log('❌ المستخدم غير موجود!')
    return
  }
  
  console.log('== بيانات المستخدم ==')
  console.log('الاسم:', user.name)
  console.log('الهاتف المحفوظ في DB:', JSON.stringify(user.phone)) // JSON.stringify لعرض أي أحرف خفية
  console.log('الإيميل:', user.email)
  console.log('الحالة (isActive):', user.isActive)
  console.log('طول passwordHash:', user.passwordHash.length)
  console.log('passwordHash يبدأ بـ:', user.passwordHash.substring(0, 10))

  // هل الهاش من نوع bcrypt ($2b$) أم scrypt (salt:hash)؟
  const isBcrypt = user.passwordHash.startsWith('$2b$') || user.passwordHash.startsWith('$2a$')
  const isScrypt = user.passwordHash.includes(':') && !user.passwordHash.startsWith('$')
  console.log('\n== نوع التشفير المحفوظ ==')
  console.log('bcrypt?', isBcrypt)
  console.log('scrypt (old hash.ts)?', isScrypt)

  // اختبر كلمة مرور افتراضية
  const testPasswords = ['123456', '1234567', '12345678', 'password123']
  console.log('\n== اختبار كلمات مرور شائعة ==')
  for (const pw of testPasswords) {
    const valid = await verifyPassword(pw, user.passwordHash)
    if (valid) console.log('✅ تطابق مع:', pw)
  }
}

main().catch(console.error).finally(() => prisma.$disconnect())
