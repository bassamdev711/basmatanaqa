# تقرير بنية الحسابات والولاء — بصمة أناقة

## النطاق

تم تنفيذ Backend وقاعدة البيانات والبنية الأمنية فقط. لم تتم إضافة واجهات تسجيل أو حساب مرئية، ولم تتم إعادة تصميم المتجر.

## الملفات المنشأة

- `app/api/auth/register/route.ts` — إنشاء الحساب والهاتف الأساسي والبريد الاختياري.
- `app/api/auth/login/route.ts` — تسجيل الدخول عبر الهاتف وكلمة المرور.
- `app/api/auth/logout/route.ts` — إلغاء الجلسة الحالية.
- `app/api/auth/me/route.ts` — بيانات المستخدم الآمنة.
- `app/api/auth/forgot-password/route.ts` — إنشاء Reset Token أحادي الاستخدام دون إرسال خارجي.
- `app/api/auth/reset-password/route.ts` — تغيير كلمة المرور وإلغاء الجلسات القديمة.
- `app/api/account/profile/route.ts` — قراءة وتعديل الملف الشخصي.
- `app/api/account/password/route.ts` — تغيير كلمة المرور من حساب موثق.
- `app/api/account/orders/route.ts` — طلبات المستخدم فقط.
- `app/api/account/orders/[id]/route.ts` — تفاصيل الطلب مع تحقق الملكية Server-Side.
- `app/api/account/points/route.ts` — الرصيد وسجل نقاط المستخدم.
- `app/api/account/notifications/route.ts` — قراءة وتحديث التنبيهات.
- `app/api/account/sessions/route.ts` — إنهاء جميع الجلسات.
- `app/api/admin/users/route.ts` — إدارة المستخدمين مع بحث وPagination.
- `app/api/admin/users/[id]/route.ts` — تفاصيل المستخدم وتعطيل الحساب وإلغاء الجلسات.
- `app/api/admin/loyalty/route.ts` — إعدادات الولاء والتعديل اليدوي المدقق.
- `lib/user-auth.ts` — التجزئة والجلسات والتحقق من المستخدم.
- `lib/loyalty/service.ts` — خدمة النقاط المركزية والمعاملات الذرية.
- `lib/notifications/service.ts` — إنشاء التنبيهات الداخلية.
- `lib/validation/user.ts` — التحقق المركزي للمدخلات.
- `prisma/migrations/20261004230000_add_accounts_loyalty_notifications/migration.sql` — Migration النظام.
- `scripts/test-account-foundation.ts` — اختبار دخان للتجزئة والتحقق والتطبيع.

## الملفات المعدلة

- `prisma/schema.prisma` — نماذج User وUserSession وPasswordResetToken وLoyaltyAccount وLoyaltySettings وLoyaltyTransaction وNotification، وربط Order بالمستخدم.
- `app/checkout/actions.ts` — منع Guest Checkout واشتراط المستخدم الموثق، وإضافة تنبيه إنشاء الطلب.
- `app/admin/orders/actions.ts` — حالات مضبوطة، تنبيهات تغير الحالة، منح النقاط عند COMPLETED، وعكسها عند REFUNDED.
- `package.json` و`package-lock.json` — إضافة `bcryptjs` و`zod`.

## المخطط والعلاقات

```text
User 1 ──── * UserSession
User 1 ──── * Order
User 1 ──── 1 LoyaltyAccount
User 1 ──── * LoyaltyTransaction
User 1 ──── * Notification
Order 1 ──── * OrderItem
Order 1 ──── * LoyaltyTransaction
```

الهاتف `UNIQUE NOT NULL`، والبريد `UNIQUE NULLABLE`. لا تحفظ كلمات المرور الخام أو Tokens الخام.

## استراتيجية الجلسات

- Cookie باسم `basmat_user_session`.
- `HttpOnly`.
- `Secure` في Production.
- `SameSite=Lax`.
- صلاحية 30 يومًا.
- قاعدة البيانات تحفظ `tokenHash` فقط.
- دعم انتهاء الجلسة، الإلغاء، الخروج، الخروج من جميع الأجهزة، و`lastUsedAt`.

## الأمان

- `bcryptjs` بإعداد 12 rounds.
- Rate limiting لمسارات التسجيل والدخول واستعادة كلمة المرور.
- رسائل دخول عامة لا تكشف وجود الحساب.
- Zod للتحقق Server-Side.
- لا يوجد Session Token أو Password Hash في الردود.
- حماية ملكية الطلب على الخادم عبر `where: { id, userId }`.
- APIs الإدارة محمية بـ `verifyAdmin`.
- لا تستخدم الجلسات `localStorage`.
- Reset Token عشوائي، مخزن Hash، أحادي الاستخدام، قصير العمر، ولا يظهر في Logs.

## مسار الولاء

```text
Order → COMPLETED → awardOrderPoints() → LoyaltyTransaction
```

- الإعداد الافتراضي: كل 100 من العملة = نقطة.
- النظام يبدأ `isEnabled=false`.
- لا توجد نقاط عند إنشاء الطلب أو الحالات الوسيطة.
- الدفع المؤهل: `PAID`، أو `COD` بحالة `PENDING`.
- `referenceKey` فريد مثل `ORDER_REWARD:ORDER_ID`.
- الاسترجاع ينشئ حركة سالبة جديدة `ORDER_REFUND` ولا يعدل الحركة القديمة.
- التعديل اليدوي يمر من الخدمة المركزية ويتطلب السبب.

## APIs الرئيسية

| Method | Endpoint | Auth | الغرض |
|---|---|---|---|
| POST | `/api/auth/register` | لا | إنشاء حساب وجلسة وحساب ولاء |
| POST | `/api/auth/login` | لا | تسجيل الدخول |
| POST | `/api/auth/logout` | Cookie | إلغاء الجلسة |
| GET | `/api/auth/me` | Cookie | المستخدم الحالي |
| POST | `/api/auth/forgot-password` | لا | تجهيز Reset Token برسالة عامة |
| POST | `/api/auth/reset-password` | Token | تغيير كلمة المرور |
| GET/PATCH | `/api/account/profile` | User | الملف الشخصي |
| PATCH | `/api/account/password` | User | تغيير كلمة المرور |
| GET | `/api/account/orders` | User | طلبات المستخدم |
| GET | `/api/account/orders/:id` | User | تفاصيل طلبه فقط |
| GET | `/api/account/points` | User | الرصيد والسجل |
| GET/PATCH | `/api/account/notifications` | User | التنبيهات |
| DELETE | `/api/account/sessions` | User | إنهاء كل الجلسات |
| GET | `/api/admin/users` | Admin | بحث وإدارة المستخدمين |
| GET/PATCH | `/api/admin/users/:id` | Admin | تفاصيل وتعطيل المستخدم |
| GET/PATCH/POST | `/api/admin/loyalty` | Admin | إعداد الولاء وتعديل النقاط |

## الاختبارات

- `prisma validate`: ناجح.
- `npm run lint`: ناجح.
- `npm run build`: ناجح.
- اختبار الدخان للتجزئة والتحقق والتطبيع: ناجح.

## حدود المرحلة

- لم يتم تطبيق Migration على Neon لأن `DATABASE_URL` الإنتاجي غير متاح في بيئة التنفيذ الحالية.
- لم تتم إضافة SMS أو Email Provider، لذلك Reset Token يُنشأ ويُخزن بأمان لكن لا يتم إرساله خارجيًا.
- صفحات `/login` و`/register` و`/account` غير مفعلة أو معروضة؛ البنية الخلفية جاهزة لها.
