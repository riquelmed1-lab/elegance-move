import { readFile } from 'node:fs/promises';

const [html,css,js]=await Promise.all([
  readFile('public/index.html','utf8'),
  readFile('public/sales-mobile.css','utf8'),
  readFile('public/sales-mobile.js','utf8')
]);

for(const marker of ['ELEGANCE_MOVE_SALES_MOBILE_V1','ELEGANCE_MOVE_SALES_MOBILE_V2','em-sales-screen','em-sales-metrics','em-sales-primary','em-sales-metric-card','em-sales-context']) if(!css.includes(marker)) throw new Error(`Sales mobile CSS incompleto: ${marker}`);
for(const marker of ['ELEGANCE_MOVE_SALES_MOBILE_RUNTIME_V1','ELEGANCE_MOVE_SALES_MOBILE_RUNTIME_V2','isSalesView','decorate','hideContext','metricCards','PDV online','Resumo financeiro',"primary.textContent='+ Nova venda'"]) if(!js.includes(marker)) throw new Error(`Sales mobile JS incompleto: ${marker}`);
for(const marker of ['id="elegance-sales-mobile"','id="elegance-sales-mobile-runtime"']) if(!html.includes(marker)) throw new Error(`Sales mobile build incompleto: ${marker}`);
if((html.match(/id="elegance-sales-mobile"/g)||[]).length!==1) throw new Error('Sales mobile CSS duplicado');
if((html.match(/id="elegance-sales-mobile-runtime"/g)||[]).length!==1) throw new Error('Sales mobile JS duplicado');
new Function(js);
console.log('SALES_MOBILE_VERIFIED',{cssBytes:Buffer.byteLength(css),jsBytes:Buffer.byteLength(js),version:2});
