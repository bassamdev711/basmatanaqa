// اختبار تطابق رقم الهاتف بين صفحة الإدخال وقاعدة البيانات
import { normalizePhone } from '../lib/user-auth'

// هذا ما يفعله حقل الهاتف في صفحة تسجيل الدخول:
// digits = e.target.value.replace(/\D/g, '')
// digits = digits.replace(/^[^7]+/, '')
// identifier = '+967' + digits.slice(0, 9)

// مثال: المستخدم يكتب 781234567 (9 أرقام تبدأ بـ7)
const userInputDigits = '781234567'
const identifierFromUI = '+967' + userInputDigits  // = +967781234567

console.log('== ما يرسله UI ==')
console.log('identifier:', identifierFromUI)

// هذا ما يفعله login route:
// normalizePhone(rawIdentifier) لأن isEmail = false
const normalizedFromLogin = normalizePhone(identifierFromUI)
console.log('\n== ما يعالجه Login Route ==')
console.log('normalizePhone("+967781234567"):', normalizedFromLogin)

// وهذا ما يفعله register route عند إنشاء الحساب:
const normalizedFromRegister = normalizePhone('781234567')
console.log('\n== ما يُحفظ في DB عند التسجيل (9 أرقام) ==')
console.log('normalizePhone("781234567"):', normalizedFromRegister)

// هل يتطابقان؟
console.log('\n== التطابق ==')
console.log('متطابق?', normalizedFromLogin === normalizedFromRegister)

// اختبار حالة مختلفة: ماذا لو كان الرقم محفوظ بطريقة مختلفة؟
console.log('\n== اختبار حالات مختلفة ==')
console.log('normalizePhone("+9677XXXXXXXX"):', normalizePhone('+967781234567'))
console.log('normalizePhone("07XXXXXXXX"):', normalizePhone('0781234567'))
console.log('normalizePhone("7XXXXXXXX"):', normalizePhone('781234567'))
