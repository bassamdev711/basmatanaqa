const fs = require('fs')
const path = require('path')

const files = [
  "app/search/page.tsx",
  "app/products/[slug]/page.tsx",
  "app/products/page.tsx",
  "app/admin/orders/[id]/page.tsx",
  "app/admin/marketing/coupons/page.tsx"
]

for (const file of files) {
  const filePath = path.join(__dirname, '..', file)
  if (!fs.existsSync(filePath)) continue
  let content = fs.readFileSync(filePath, 'utf-8')

  const funcMatch = content.match(/export default async function ([a-zA-Z0-9_]+)\s*\([^)]*\)\s*{/)
  if (funcMatch) {
    if (!content.includes('const currency = await getCurrency()')) {
      const insertIndex = funcMatch.index + funcMatch[0].length
      content = content.slice(0, insertIndex) + "\n  const currency = await getCurrency()\n" + content.slice(insertIndex)
    }
  }

  // Also replace {currency} with ${currency} or leave as {currency} if it's in JSX
  // If it's inside text in JSX like <span>50 {currency}</span>, it should be <span>50 {currency}</span> which is valid JSX!
  // But wait, my previous script did: >$1{currency}$2< which IS valid JSX since `currency` is a JS variable.
  // Wait, no. If I just inject `const currency = await getCurrency()`, then in JSX `<p>{currency}</p>` will render correctly!
  // So I don't need to change {currency} to ${currency} unless it's inside backticks!
  // The previous script already handled backticks using `} ${currency}`

  fs.writeFileSync(filePath, content)
  console.log(`Updated ${file}`)
}
