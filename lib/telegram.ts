// lib/telegram.ts

export type TelegramOrderItem = {
  name: string
  quantity: number
  size?: string | null
  price?: number
  slug?: string | null
}

export type TelegramOrderNotificationData = {
  orderNumber: string
  orderId: string
  customerName: string
  customerPhone: string
  governorate?: string
  city: string
  address?: string
  totalAmount: number
  currency: string
  paymentMethod: string
  items?: TelegramOrderItem[]
  storeBaseUrl?: string
}

function escapeHtml(text: string): string {
  if (!text) return ''
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

/**
 * ينسق رقم هاتف العميل لفتح رابط محادثة واتساب مباشر (wa.me)
 * يدعم الأرقام اليمنية والسعودية والدولية
 */
function formatCustomerWhatsAppPhone(rawPhone: string): string {
  let cleaned = (rawPhone || '').replace(/\D/g, '')
  if (cleaned.startsWith('00')) {
    cleaned = cleaned.slice(2)
  }
  // اليمن: يبدأ بـ 7 وطوله 9 أرقام أو يبدأ بـ 07 وطوله 10
  if (cleaned.length === 9 && cleaned.startsWith('7')) {
    return '967' + cleaned
  }
  if (cleaned.length === 10 && cleaned.startsWith('07')) {
    return '967' + cleaned.slice(1)
  }
  // السعودية: يبدأ بـ 05 وطوله 10 أو يبدأ بـ 5 وطوله 9
  if (cleaned.length === 10 && cleaned.startsWith('05')) {
    return '966' + cleaned.slice(1)
  }
  if (cleaned.length === 9 && cleaned.startsWith('5')) {
    return '966' + cleaned
  }
  return cleaned
}

/**
 * دالة إرسال رسالة عامة عبر بوت تيليجرام
 * تدعم المتغيرات التي قمت بضبطها في Vercel:
 * tiligram_bot: رمز البوت
 * id_tiligram: معرّف المحادثة (Chat ID)
 */
export async function sendTelegramMessage(text: string): Promise<{ success: boolean; error?: string }> {
  const botToken = (
    process.env.tiligram_bot ||
    process.env.TELEGRAM_BOT_TOKEN ||
    process.env.telegram_bot ||
    ''
  ).trim()

  const chatId = (
    process.env.id_tiligram ||
    process.env.TELEGRAM_CHAT_ID ||
    process.env.telegram_chat_id ||
    ''
  ).trim()

  if (!botToken || !chatId) {
    const missing = []
    if (!botToken) missing.push('tiligram_bot')
    if (!chatId) missing.push('id_tiligram')
    console.warn(`[Telegram] Missing environment variables: ${missing.join(', ')}`)
    return { success: false, error: `المتغيرات غير مكتملة: ${missing.join(', ')}` }
  }

  try {
    const url = `https://api.telegram.org/bot${botToken}/sendMessage`
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: text,
        parse_mode: 'HTML',
        disable_web_page_preview: false,
      }),
      cache: 'no-store',
    })

    const data = await res.json().catch(() => ({}))

    if (!res.ok || !data.ok) {
      console.error('[Telegram] API Error:', data)
      return { 
        success: false, 
        error: data.description || `HTTP ${res.status}: خطأ أثناء الإرسال لتليجرام` 
      }
    }

    return { success: true }
  } catch (error) {
    console.error('[Telegram] Network/Execution Error:', error)
    return { success: false, error: 'تعذر الاتصال بخوادم تيليجرام' }
  }
}

/**
 * إرسال إشعار تفصيلي غني عند إنشاء طلب جديد:
 * - تفاصيل الطلب والمبلغ والعنوان
 * - تفاصيل كل منتج مع رابطه المباشر
 * - رابط مباشر لنقر وتفتح محادثة واتساب فورية مع العميل
 * - رابط تفاصيل الطلب في لوحة الإدارة
 */
export async function sendTelegramNewOrder(data: TelegramOrderNotificationData): Promise<boolean> {
  const baseUrl = (
    data.storeBaseUrl ||
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXTAUTH_URL ||
    'https://shahrazadstore.online'
  ).replace(/\/$/, '')

  const adminOrderUrl = `${baseUrl}/admin/orders/${data.orderId}`

  const paymentLabels: Record<string, string> = {
    cod: 'الدفع عند الاستلام',
    bank_transfer: 'تحويل بنكي',
    wallets: 'محافظ إلكترونية',
    customer_service: 'خدمة العملاء',
  }

  const paymentText = paymentLabels[data.paymentMethod] || data.paymentMethod || 'غير محدد'

  // رابط واتساب مباشر لمحادثة العميل بضغطة زر
  const formattedPhone = formatCustomerWhatsAppPhone(data.customerPhone)
  const waPreText = encodeURIComponent(`مرحباً ${data.customerName}، معك متجر بصمة أناقة بخصوص طلبك رقم #${data.orderNumber} 🛍️`)
  const customerWhatsAppLink = `https://wa.me/${formattedPhone}?text=${waPreText}`

  // قائمة المنتجات مع المقاس والكمية ورابط كل منتج
  let itemsSection = ''
  if (data.items && data.items.length > 0) {
    itemsSection = '\n📦 <b>المنتجات المطلوبة:</b>\n' + data.items.map((it, idx) => {
      const sizeStr = it.size ? ` (مقاس: ${it.size})` : ''
      const productUrl = it.slug ? `${baseUrl}/products/${it.slug}` : null
      const productLinkTag = productUrl 
        ? ` <a href="${productUrl}">[رابط المنتج 🔗]</a>`
        : ''
      return `   ${idx + 1}. <b>${escapeHtml(it.name)}</b>${sizeStr} × ${it.quantity}${productLinkTag}`
    }).join('\n')
  }

  const locationText = [data.governorate, data.city, data.address]
    .filter(Boolean)
    .join(' - ')

  const message = `🛍️ <b>طلب جديد في المتجر!</b>
━━━━━━━━━━━━━━━━━━
🔢 <b>رقم الطلب:</b> <code>#${data.orderNumber}</code>
👤 <b>العميل:</b> ${escapeHtml(data.customerName)}
📞 <b>الهاتف:</b> <code>${escapeHtml(data.customerPhone)}</code>
💬 <b>مراسلة واتساب:</b> <a href="${customerWhatsAppLink}">اضغط هنا لفتح محادثة العميل مباشرة 📲</a>
📍 <b>العنوان:</b> ${escapeHtml(locationText || 'غير محدد')}
💳 <b>طريقة الدفع:</b> ${escapeHtml(paymentText)}
💰 <b>الإجمالي النهائي:</b> <b>${Number(data.totalAmount).toLocaleString('ar-SA')} ${data.currency}</b>
${itemsSection}
━━━━━━━━━━━━━━━━━━
🔗 <a href="${adminOrderUrl}">اضغط هنا لفتح تفاصيل الطلب في لوحة الإدارة</a>`

  const result = await sendTelegramMessage(message)
  return result.success
}
