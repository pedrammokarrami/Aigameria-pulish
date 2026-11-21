import { readFileSync } from 'node:fs';
const html = readFileSync('C:/Users/ELI/AppData/Local/Temp/yt.html', 'utf-8');
const marker = 'var ytInitialData = ';
const start = html.indexOf(marker);
const end = html.indexOf(';</script>', start);
const data = JSON.parse(html.slice(start + marker.length, end));
// find first lockupViewModel
let found: any = null;
function walk(node: any): void {
  if (found || !node || typeof node !== 'object') return;
  if (node.lockupViewModel) { found = node.lockupViewModel; return; }
  if (Array.isArray(node)) { for (const x of node) walk(x); return; }
  for (const k of Object.keys(node)) walk((node as any)[k]);
}
walk(data);
console.log(JSON.stringify(found, null, 1).slice(0, 3500));
