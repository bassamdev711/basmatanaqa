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
 * رابط طلب منتج واحد عبر واتساب
 */
export function getProductWhatsAppLink({
  name,
  size,
  price,
  currency,
  quantity = 1,
  slug,
  phone = STORE_WHATSAPP_NUMBER,
}: {
  name: string
  size?: string | null
  price: number
  currency: string
  quantity?: number
  slug: string
  phone?: string
}): string {
  const targetPhone = formatWhatsAppPhone(phone)
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://shahrazadstore.online'
  const productUrl = `${baseUrl}/products/${slug}`

  let message = `مرحباً، أود طلب هذا المنتج من متجركم:\n`
  message += `• المنتج: ${name}\n`
  if (size && size.trim()) {
    message += `• المقاس: ${size.trim()}\n`
  }
  message += `• السعر: ${Number(price).toLocaleString('ar-SA')} ${currency}\n`
  message += `• الكمية: ${quantity}\n`
  message += `• رابط المنتج: ${productUrl}\n`
  message += `أرجو تأكيد توفره.`

  return `https://wa.me/${targetPhone}?text=${encodeURIComponent(message)}`
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
  address: string
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
  message += `• العنوان: ${city} - ${address}\n`
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
