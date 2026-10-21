// One-off: bump every px font-size in the workspace stylesheets (they were 8–12px for most text).
// small sizes gain 3px (min 12px); sizes above 20px grow ~12%. Run once: node scripts/scale-type.mjs
import fs from 'node:fs';
import path from 'node:path';
const dir = 'src/workspace';
const skip = new Set(['auth.css']);
const scale = n => (n <= 20 ? Math.max(12, n + 3) : Math.round(n * 1.12));
let total = 0;
for (const file of fs.readdirSync(dir).filter(f => f.endsWith('.css') && !skip.has(f))) {
  const p = path.join(dir, file);
  const before = fs.readFileSync(p, 'utf8');
  let count = 0;
  const after = before.replace(/font-size:(\s*)(\d+(?:\.\d+)?)px/g, (_m, space, num) => { count++; return `font-size:${space}${scale(Number(num))}px`; });
  if (count) fs.writeFileSync(p, after);
  total += count;
  console.log(file.padEnd(18), count);
}
console.log('total', total);
