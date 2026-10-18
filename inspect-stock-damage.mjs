import { readFile } from 'node:fs/promises';
const html=await readFile('public/index.html','utf8');
const terms=[
  'function save(',
  'async function save(',
  'function syncCloud(',
  'async function syncCloud(',
  'fetch(\'/api/state\'',
  'fetch("/api/state"',
  'function stock(){',
  'function saleModal(',
  'function bindPage(',
  'function render(',
  'function toast(',
  'function modal(',
  'function closeModal('
];
console.log('INSPECT_HTML_BYTES',Buffer.byteLength(html));
for(const term of terms){
  const i=html.indexOf(term);
  console.log('INSPECT_TERM',term,'INDEX',i,'SNIP',i>=0?html.slice(Math.max(0,i-500),Math.min(html.length,i+5200)).replace(/\s+/g,' '):'NOT_FOUND');
}
