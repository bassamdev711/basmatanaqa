const fs = require('fs')
const path = require('path')

const files = [
  "components/ProductsServer.tsx",
  "app/search/page.tsx",
  "app/products/[slug]/page.tsx",
  "app/products/page.tsx",
  "app/admin/orders/[id]/page.tsx",
  "app/admin/marketing/coupons/page.tsx",
  "app/admin/marketing/coupons/actions.ts"
]

for (const file of files) {
  const filePath = path.join(__dirname, '..', file)
  if (!fs.existsSync(filePath)) continue
  let content = fs.readFileSync(filePath, 'utf-8')

  if (content.includes('ر.س')) {
    // Add import if not exists
    if (!content.includes('getCurrency')) {
      const lastImportIndex = content.lastIndexOf('import ')
      const nextLineIndex = content.indexOf('\n', lastImportIndex) + 1
      content = content.slice(0, nextLineIndex) + "import { getCurrency } from '@/lib/currency'\n" + content.slice(nextLineIndex)
    }

    // Replace occurrences
    content = content.replace(/>([^<]*)ر\.س([^<]*)</g, ">$1{currency}$2<")
    content = content.replace(/\} ر\.س/g, "} ${currency}")
    content = content.replace(/\(ر\.س\)/g, "(${currency})")
    content = content.replace(/`([^`]*)} ر\.س`/g, "`$1} ${currency}`")
    content = content.replace(/'ر\.س'/g, "currency")

    // The trick here is that these are server components. We need to fetch currency manually inside the component.
    // I'll just print out the ones we updated so I can manually inject `const currency = await getCurrency()`
    fs.writeFileSync(filePath, content)
    console.log(`Updated ${file}`)
  }
}
