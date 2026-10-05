const fs = require('fs');
const files = [
  'app/admin/shipping-settings/actions.ts',
  'app/admin/products/actions.ts',
  'app/admin/payment-settings/actions.ts',
  'app/admin/orders/actions.ts',
  'app/admin/legal-pages/actions.ts',
  'app/admin/collections/actions.ts'
];

files.forEach(file => {
  if(!fs.existsSync(file)) return;
  let content = fs.readFileSync(file, 'utf8');
  if (!content.includes('verifyAdmin')) {
    content = content.replace(/(import .*?\n)+/m, match => match + 'import { verifyAdmin } from \'@/lib/auth\'\n');
    content = content.replace(/export async function (\w+)\((.*?)\) \{/g, 'export async function $1($2) {\n  await verifyAdmin();\n');
    fs.writeFileSync(file, content);
    console.log('Updated ' + file);
  }
});
