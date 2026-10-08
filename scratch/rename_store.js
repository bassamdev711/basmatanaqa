const fs = require('fs');
const path = require('path');

const directoriesToScan = ['app', 'components', 'lib'];
const replacements = [
  { search: /بصمة اناقة/g, replace: 'شهرزاد' },
  { search: /BASMAT ANAQAH/g, replace: 'SHAHRAZAD' },
  { search: /basmat anaqa/gi, replace: 'shahrazad' }
];

function processDirectory(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDirectory(fullPath);
    } else if (fullPath.endsWith('.ts') || fullPath.endsWith('.tsx') || fullPath.endsWith('.css') || fullPath.endsWith('.json') || fullPath.endsWith('.md')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let updated = false;
      
      for (const { search, replace } of replacements) {
        if (content.match(search)) {
          content = content.replace(search, replace);
          updated = true;
        }
      }
      
      if (updated) {
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log(`Updated: ${fullPath}`);
      }
    }
  }
}

for (const dir of directoriesToScan) {
  processDirectory(path.join(process.cwd(), dir));
}

// Update DB directly if possible. I'll use Prisma $queryRaw or a separate script for that if needed.
console.log('Secondary rebranding complete!');
