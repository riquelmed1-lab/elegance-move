import { readFile } from 'node:fs/promises';
const html=await readFile('public/index.html','utf8');
const terms=[
  'function stockPage()',
  'function salesPage()',
  'function saleModal(',
  'function productModal(',
  'function saveSale(',
  'data-action="new-sale"',
  'data-action="new-product"',
  'stockFilter',
  'statusFilter',
  'db.products.filter'
];
console.log('INSPECT_HTML_BYTES',Buffer.byteLength(html));
for(const term of terms){
  let from=0,count=0;
  while(count<3){
    const i=html.indexOf(term,from);
    if(i<0)break;
    console.log('INSPECT_TERM',term,'INDEX',i,'SNIP',html.slice(Math.max(0,i-500),Math.min(html.length,i+2800)).replace(/\s+/g,' '));
    from=i+term.length;count++;
  }
}
