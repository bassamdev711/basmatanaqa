# دليل إعداد مشروع طيف (TIF Store)

> وثيقة تقنية كاملة تشرح كيفية إعداد المشروع من الصفر، مع توثيق الأخطاء الشائعة وحلولها.

---

## 📦 المتطلبات

- Node.js 18+
- حساب [Vercel](https://vercel.com) (Hobby أو Pro)
- قاعدة بيانات [Neon](https://neon.tech) (PostgreSQL Serverless)
- حساب [Vercel Blob](https://vercel.com/docs/storage/vercel-blob) لتخزين الصور

---

## ⚙️ متغيرات البيئة المطلوبة

### 1. ملف `.env` (للتطوير المحلي فقط - لا يُرفع لـ GitHub)

```env
# قاعدة البيانات (Neon PostgreSQL)
DATABASE_URL="postgresql://USER:PASSWORD@HOST-pooler.neon.tech/neondb?sslmode=require"
DIRECT_URL="postgresql://USER:PASSWORD@HOST.neon.tech/neondb?sslmode=require"

# مصادقة لوحة الإدارة
ADMIN_PASSWORD="your-admin-password"
JWT_SECRET="your-secret-key-min-32-chars"

# تخزين الصور (Vercel Blob)
BLOB_READ_WRITE_TOKEN="vercel_blob_rw_..."

# ربط إحصائيات Vercel (مهم - راجع التعليمات أدناه)
TIF_API_TOKEN=""
TIF_PROJECT_ID=""
```

### 2. متغيرات Vercel (Production) - تُضاف يدوياً في لوحة Vercel

نفس المتغيرات أعلاه، بالإضافة إلى ضمان وجود `TIF_API_TOKEN` و `TIF_PROJECT_ID`.

---

## 🔑 إعداد ربط إحصائيات Vercel (TIF_API_TOKEN)

> ⚠️ **تحذير مهم جداً للمطورين:**
> يجب استخدام البادئة `TIF_` وليس `VERCEL_` لأن Vercel يحجب تلقائياً
> أي متغير يبدأ بـ `VERCEL_` داخل الـ Serverless Functions لأسباب أمنية.
> استخدام `VERCEL_API_TOKEN` لن يعمل أبداً من داخل كود Next.js.

### الخطوات الصحيحة:

#### الخطوة 1: إنشاء API Token
1. اذهب إلى: https://vercel.com/account/tokens
2. اضغط **Create**
3. أدخل اسماً (مثل: `tif-analytics`)
4. انسخ الرمز الظاهر (لن يظهر مرة أخرى)

#### الخطوة 2: الحصول على Project ID
شغّل هذا الأمر في PowerShell (استبدل TOKEN برمزك):
```powershell
$headers = @{ "Authorization" = "Bearer YOUR_TOKEN" }
$res = Invoke-RestMethod -Uri "https://api.vercel.com/v9/projects" -Headers $headers
$res.projects | Select-Object id, name
```
سيظهر لك ID المشروع بصيغة: `prj_xxxxxxxxxxxxxx`

#### الخطوة 3: إضافة المتغيرات لـ Vercel عبر API
```powershell
$token = "YOUR_TOKEN"
$projectId = "prj_YOUR_PROJECT_ID"
$teamId = "team_YOUR_TEAM_ID"  # يظهر في الخطوة 2 كـ accountId
$headers = @{ "Authorization" = "Bearer $token"; "Content-Type" = "application/json" }

$vars = @(
  @{ key = "TIF_API_TOKEN"; value = $token; type = "encrypted"; target = @("production","preview") },
  @{ key = "TIF_PROJECT_ID"; value = $projectId; type = "plain"; target = @("production","preview") }
)
$body = $vars | ConvertTo-Json -Depth 5
Invoke-RestMethod -Uri "https://api.vercel.com/v10/projects/$projectId/env?teamId=$teamId" -Method POST -Headers $headers -Body $body
```

#### الخطوة 4: Redeploy
بعد إضافة المتغيرات، يجب إعادة بناء المشروع:
```bash
git commit --allow-empty -m "Trigger redeploy" && git push
```

---

## 🗄️ قاعدة البيانات (Prisma + Neon)

### تطبيق تغييرات الـ Schema محلياً
```bash
npx prisma db push
npx prisma generate
```

### ملاحظة مهمة
أمر البناء في `package.json` يتضمن `prisma db push` تلقائياً:
```json
"build": "prisma db push --accept-data-loss && prisma generate && next build"
```
هذا يضمن تطبيق تغييرات قاعدة البيانات تلقائياً مع كل deployment على Vercel.

> ⚠️ `--accept-data-loss` آمن فقط عند إضافة أعمدة جديدة. لا تستخدمه عند حذف أعمدة تحتوي بيانات.

---

## 🚀 تشغيل المشروع محلياً

```bash
npm install
npx prisma generate
npm run dev
```

---

## 📁 هيكل المشروع الرئيسي

```
tif/
├── app/
│   ├── admin/
│   │   ├── analytics/      # إحصائيات الموقع والاستهلاك
│   │   ├── branding/       # الهوية البصرية (OG Image, Favicon, QR)
│   │   ├── orders/         # إدارة الطلبات
│   │   ├── products/       # إدارة المنتجات
│   │   └── ...
│   ├── track/              # تتبع الطلبات (برقم الهاتف أو رقم الطلب)
│   └── checkout/           # عملية الشراء
├── components/             # مكونات مشتركة
├── lib/                    # مساعدات (prisma, auth...)
├── prisma/
│   └── schema.prisma       # نموذج قاعدة البيانات
└── public/                 # ملفات ثابتة
```

---

## 🛠️ الأخطاء الشائعة وحلولها

| الخطأ | السبب | الحل |
|-------|-------|------|
| `DIRECT_URL not found` | المتغير غير موجود في Vercel | أضف `DIRECT_URL` في Environment Variables |
| `StoreSettings.ogImageUrl does not exist` | Schema لم يُطبَّق على DB | `prisma db push` سيُشغَّل تلقائياً عند البناء |
| `غير متصل بـ Vercel API` | استخدام `VERCEL_` كبادئة | استخدم `TIF_API_TOKEN` و `TIF_PROJECT_ID` بدلاً منها |
| `Project not found` في Vercel API | Project ID خاطئ | احصل على ID الصحيح عبر `GET /v9/projects` |

---

## 📞 التواصل
هذا المشروع مبني بـ Next.js 16 + Prisma + Neon + Vercel Blob.
