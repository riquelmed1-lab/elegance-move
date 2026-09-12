import { readFile, writeFile } from 'node:fs/promises';

const file='public/index.html';
let html=await readFile(file,'utf8');

const oldRows=String.raw`const lineRows=(record.lines||[]).map((l,i)=>{const p=db.products.find(x=>x.id===l.productId)||{};const code=p.code||'—',variation=[l.color,l.size].filter(Boolean).join(' · ')||'—';return '<tr><td>'+(i+1)+'</td><td><b>'+esc(code)+'</b></td><td><b>'+esc(l.product)+'</b></td><td>'+esc(variation)+'</td><td class="num">'+Number(l.qty||0)+'</td><td class="num">'+money.format(Number(l.unitPrice)||0)+'</td><td class="num"><b>'+money.format((Number(l.unitPrice)||0)*(Number(l.qty)||0))+'</b></td></tr>'}).join('');`;

const newRows=String.raw`const lineRows=(record.lines||[]).map((l,i)=>{const p=db.products.find(x=>x.id===l.productId)||{};const code=p.code||'—',variation=[l.color,l.size].filter(Boolean).join(' · ')||'—',photo=p.imageUrl?'<span class="doc-product-photo"><img src="'+esc(p.imageUrl)+'" alt="'+esc(l.product||p.name||'Produto')+'"></span>':'<span class="doc-product-photo doc-product-photo-empty" aria-hidden="true">◇</span>';return '<tr><td>'+(i+1)+'</td><td><b>'+esc(code)+'</b></td><td><div class="doc-product-desc">'+photo+'<div class="doc-product-copy"><b>'+esc(l.product)+'</b></div></div></td><td>'+esc(variation)+'</td><td class="num">'+Number(l.qty||0)+'</td><td class="num">'+money.format(Number(l.unitPrice)||0)+'</td><td class="num"><b>'+money.format((Number(l.unitPrice)||0)*(Number(l.qty)||0))+'</b></td></tr>'}).join('');`;

if(html.includes(oldRows)) html=html.replace(oldRows,newRows);
else if(!html.includes('class="doc-product-photo"')) throw new Error('Tabela do documento comercial não encontrada para incluir fotos.');

const cssNeedle='.items td{font-size:8.2px;font-weight:500;padding:10px 8px;border-bottom:1px solid #f0e1dc;vertical-align:middle}.num{text-align:right!important;white-space:nowrap}';
const cssReplacement='.items td{font-size:8.2px;font-weight:500;padding:10px 8px;border-bottom:1px solid #f0e1dc;vertical-align:middle}.doc-product-desc{display:flex;align-items:center;gap:8px;min-width:0}.doc-product-photo{width:38px;height:46px;flex:0 0 38px;border-radius:7px;overflow:hidden;background:#f7efec;border:1px solid #ead8d1;display:grid;place-items:center;color:#b78b7d;font-size:13px}.doc-product-photo img{width:100%;height:100%;object-fit:cover;display:block}.doc-product-photo-empty{font-size:11px}.doc-product-copy{min-width:0;line-height:1.25}.num{text-align:right!important;white-space:nowrap}';
if(html.includes(cssNeedle)) html=html.replace(cssNeedle,cssReplacement);
else if(!html.includes('.doc-product-desc{display:flex')) throw new Error('CSS da tabela comercial não encontrado.');

const compactNeedle='.compact .items th,.compact .items td{padding:6px}.compact .thankyou{display:none}';
const compactReplacement='.compact .items th,.compact .items td{padding:6px}.compact .doc-product-desc{gap:6px}.compact .doc-product-photo{width:30px;height:36px;flex-basis:30px}.compact .thankyou{display:none}';
if(html.includes(compactNeedle)) html=html.replace(compactNeedle,compactReplacement);
else if(!html.includes('.compact .doc-product-photo{width:30px')) throw new Error('CSS compacto do documento não encontrado.');

const thermalNeedle='body[data-print-mode="thermal"] .items th,body[data-print-mode="thermal"] .items td{font-size:6.5px;padding:2mm 1mm;background:#fff;border-color:#222}';
const thermalReplacement='body[data-print-mode="thermal"] .items th,body[data-print-mode="thermal"] .items td{font-size:6.5px;padding:2mm 1mm;background:#fff;border-color:#222}body[data-print-mode="thermal"] .doc-product-photo{display:none}body[data-print-mode="thermal"] .doc-product-desc{display:block}';
if(html.includes(thermalNeedle)) html=html.replace(thermalNeedle,thermalReplacement);
else if(!html.includes('body[data-print-mode="thermal"] .doc-product-photo{display:none}')) throw new Error('CSS térmico do documento não encontrado.');

for(const marker of ['class="doc-product-photo"','.doc-product-desc{display:flex','.compact .doc-product-photo{width:30px','body[data-print-mode="thermal"] .doc-product-photo{display:none}']){
  if(!html.includes(marker)) throw new Error('Patch de foto no pedido incompleto: '+marker);
}

await writeFile(file,html,'utf8');
console.log('COMMERCIAL_PRODUCT_IMAGES_PATCH_OK',{bytes:Buffer.byteLength(html),a4:true,thermalHidden:true});
