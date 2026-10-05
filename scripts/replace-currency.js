const fs = require('fs')
const path = require('path')

const files = [
  "components/SearchModal.tsx",
  "components/ProductsClient.tsx",
  "components/CartProvider.tsx",
  "app/track/TrackOrderClient.tsx",
  "app/products/[slug]/ProductDetailClient.tsx",
  "app/checkout/CheckoutClient.tsx",
  "app/cart/CartClient.tsx",
  "app/admin/shipping-settings/ShippingSettingsClient.tsx",
  "app/admin/marketing/coupons/new/page.tsx",
]

for (const file of files) {
  const filePath = path.join(__dirname, '..', file)
  if (!fs.existsSync(filePath)) continue
  let content = fs.readFileSync(filePath, 'utf-8')

  if (content.includes('ر.س')) {
    // Add import if not exists
    if (!content.includes('useCurrency')) {
      const lastImportIndex = content.lastIndexOf('import ')
      const nextLineIndex = content.indexOf('\n', lastImportIndex) + 1
      content = content.slice(0, nextLineIndex) + "import { useCurrency } from '@/components/CurrencyProvider'\n" + content.slice(nextLineIndex)
    }

    // Add const currency = useCurrency() inside the component
    const funcMatch = content.match(/export (default )?function ([a-zA-Z0-9_]+)\s*\([^)]*\)\s*{/)
    if (funcMatch) {
      if (!content.includes('const currency = useCurrency()')) {
        const insertIndex = funcMatch.index + funcMatch[0].length
        content = content.slice(0, insertIndex) + "\n  const currency = useCurrency()\n" + content.slice(insertIndex)
      }
    }

    // Replace occurrences
    content = content.replace(/>([^<]*)ر\.س([^<]*)</g, ">$1{currency}$2<")
    content = content.replace(/\} ر\.س/g, "} {currency}")
    content = content.replace(/\(ر\.س\)/g, "({currency})")
    content = content.replace(/`([^`]*)} ر\.س`/g, "`$1} ${currency}`")

    fs.writeFileSync(filePath, content)
    console.log(`Updated ${file}`)
  }
}
