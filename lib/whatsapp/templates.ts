export function normalizePhoneNumber(phone: string): string {
  // Remove spaces, dashes, parentheses
  let cleaned = phone.replace(/[\s\-\(\)]/g, '')

  // Remove leading +
  if (cleaned.startsWith('+')) {
    cleaned = cleaned.substring(1)
  }

  // If the number starts with 0 (e.g. 05X in KSA, or 07X in Yemen)
  // this is a bit tricky without knowing the exact country.
  // Assuming Saudi Arabia (966) or Yemen (967) is the primary target.
  // If the admin needs a specific country code, we can prepend it if it's missing.
  // As a safe fallback, if it's 9 digits and starts with 5, assume Saudi: 9665...
  if (cleaned.length === 10 && cleaned.startsWith('05')) {
    return '966' + cleaned.substring(1)
  }
  
  if (cleaned.length === 9 && cleaned.startsWith('7')) {
    return '967' + cleaned
  }

  // If it starts with 00
  if (cleaned.startsWith('00')) {
    return cleaned.substring(2)
  }

  return cleaned
}

export function getOrderConfirmedMessage(customerName: string, orderNumber: string) {
  return `مرحباً ${customerName} 👋\n\nتم تأكيد طلبك رقم #${orderNumber} بنجاح.\n\nسيتم تجهيز طلبك وإرساله حسب بيانات التوصيل.\nشكراً لتسوقك معنا!`
}

export function getOrderShippedMessage(customerName: string, orderNumber: string) {
  return `مرحباً ${customerName} 🚚\n\nتم تجهيز طلبك رقم #${orderNumber} وخرج للتوصيل!\n\nسيتم التواصل معك من قبل المندوب عند الوصول.`
}

export function getOrderCompletedMessage(customerName: string, orderNumber: string) {
  return `مرحباً ${customerName} ✅\n\nتم إكمال وتسليم طلبك رقم #${orderNumber} بنجاح.\n\nنتمنى أن تنال منتجاتنا إعجابك، ونسعد دائماً بخدمتك!`
}

export function getWhatsAppLink(phone: string, text: string) {
  const normalizedPhone = normalizePhoneNumber(phone)
  return `https://wa.me/${normalizedPhone}?text=${encodeURIComponent(text)}`
}
