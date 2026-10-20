// lib/whatsapp-order.ts

export const STORE_WHATSAPP_NUMBER = '716761754'

/**
 * ينسق رقم الهاتف الدولي للواتساب (اليمن: 967)
 */
export function formatWhatsAppPhone(rawPhone: string = STORE_WHATSAPP_NUMBER): string {
  let cleaned = rawPhone.replace(/\D/g, '')
  if (cleaned.startsWith('00967')) {
    cleaned = cleaned.slice(2)
  } else if (cleaned.startsWith('0')) {
    cleaned = '967' + cleaned.slice(1)
  } else if (!cleaned.startsWith('967') && cleaned.length === 9) {
    cleaned = '967' + cleaned
  }
  return cleaned || '967716761754'
}

/**
 * رابط طلب منتج واحد عبر واتساب بتصميم وتنسيق أنيق مشابه لزر المشاركة
 */
export function getProductWhatsAppLink({
  name,
  size,
  price,
  currency,
  quantity = 1,
  slug,
  shortCode,
  imageIndex,
  categoryName,
  subCategoryName,
  phone = STORE_WHATSAPP_NUMBER,
}: {
  name: string
  size?: string | null
  price: number
  currency: string
  quantity?: number
  slug: string
  shortCode?: string | null
  imageIndex?: number | null
  categoryName?: string | null
  subCategoryName?: string | null
  phone?: string
}): string {
  const targetPhone = formatWhatsAppPhone(phone)
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://shahrazadstore.online'
  
  // نستخدم الرابط المختصر الذكي الذي يحتوي على المعاينة المباشرة للصورة (Open Graph)
  const code = shortCode || slug
  const queryParts: string[] = []
  if (imageIndex !== undefined && imageIndex !== null && imageIndex > 0) {
    queryParts.push(`img=${imageIndex}`)
  }
  if (size && size.trim()) {
    queryParts.push(`size=${encodeURIComponent(size.trim())}`)
  }
  const queryString = queryParts.length > 0 ? `?${queryParts.join('&')}` : ''
  const productPreviewUrl = `${baseUrl}/p/${encodeURIComponent(code)}${queryString}`

  const lines = [
    '✨ متجر شهرزاد ✨',
    'مرحباً، أود طلب هذا المنتج من متجركم:',
    '',
    `🛍️ المنتج: ${name}`,
  ]

  if (categoryName) {
    lines.push(`🏷️ القسم: ${categoryName}`)
  }
  if (subCategoryName) {
    lines.push(`📂 التصنيف: ${subCategoryName}`)
  }
  if (size && size.trim()) {
    lines.push(`📏 المقاس: ${size.trim()}`)
  }
  if (quantity && quantity > 1) {
    lines.push(`🔢 الكمية: ${quantity}`)
    lines.push(`💰 الإجمالي: ${Number(price * quantity).toLocaleString('ar-SA')} ${currency} (${Number(price).toLocaleString('ar-SA')} ${currency} للقطعة)`)
  } else {
    lines.push(`💰 السعر: ${Number(price).toLocaleString('ar-SA')} ${currency}`)
  }

  lines.push('')
  lines.push('🔗 رابط وتفاصيل المنتج والصورة:')
  lines.push(productPreviewUrl)
  lines.push('')
  lines.push('أرجو تأكيد توفره.')

  return `https://wa.me/${targetPhone}?text=${encodeURIComponent(lines.join('\n'))}`
}

/**
 * رابط طلب سلة المشتريات / صفحة إتمام الطلب بالكامل عبر واتساب
 */
export function getCheckoutWhatsAppLink({
  customerName,
  customerPhone,
  city,
  address,
  notes,
  items,
  total,
  currency,
  orderNumber,
  phone = STORE_WHATSAPP_NUMBER,
}: {
  customerName: string
  customerPhone: string
  city: string
  address?: string | null
  notes?: string | null
  items: Array<{
    name: string
    size?: string | null
    quantity: number
    price: number
    slug: string
  }>
  total: number
  currency: string
  orderNumber?: string | null
  phone?: string
}): string {
  const targetPhone = formatWhatsAppPhone(phone)
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://shahrazadstore.online'

  let message = `مرحباً، أود تأكيد الطلب التالي من متجركم:\n`
  if (orderNumber) {
    message += `• رقم الطلب: #${orderNumber}\n`
  }
  message += `• اسم العميل: ${customerName}\n`
  message += `• الهاتف: ${customerPhone}\n`
  message += `• منطقة التوصيل: ${city}${address && address.trim() && address.trim() !== city.trim() ? ` - ${address.trim()}` : ''}\n`
  if (notes && notes.trim()) {
    message += `• ملاحظات: ${notes.trim()}\n`
  }

  message += `\n📦 تفاصيل المنتجات (${items.length}):\n`
  items.forEach((item, index) => {
    const itemUrl = `${baseUrl}/products/${item.slug}`
    message += `\n${index + 1}. ${item.name}`
    if (item.size && item.size.trim()) {
      message += ` (المقاس: ${item.size.trim()})`
    }
    message += `\n   الكمية: ${item.quantity} | السعر: ${Number(item.price * item.quantity).toLocaleString('ar-SA')} ${currency}`
    message += `\n   رابط المنتج: ${itemUrl}\n`
  })

  message += `\n• الإجمالي النهائي: ${Number(total).toLocaleString('ar-SA')} ${currency}\n`
  message += `أرجو تأكيد توفره.`

  return `https://wa.me/${targetPhone}?text=${encodeURIComponent(message)}`
}
