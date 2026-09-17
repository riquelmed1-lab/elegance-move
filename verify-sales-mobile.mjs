import { readFile } from 'node:fs/promises';

const [html,css,nativeCss,js]=await Promise.all([
  readFile('public/index.html','utf8'),
  readFile('public/sales-mobile.css','utf8'),
  readFile('public/sales-mobile-native-summary.css','utf8'),
  readFile('public/sales-mobile.js','utf8')
]);

for(const marker of ['ELEGANCE_MOVE_SALES_MOBILE_V1','ELEGANCE_MOVE_SALES_MOBILE_V2','ELEGANCE_MOVE_SALES_MOBILE_V4','em-sales-screen','em-sales-metrics','em-sales-primary','em-sales-metric-card','em-sales-context','em-sale-mobile-checkout','em-sale-checkout-finish','z-index:260','font-size:9.5px','font-size:8.5px']) if(!css.includes(marker)) throw new Error(`Sales mobile CSS incompleto: ${marker}`);
for(const marker of ['ELEGANCE_MOVE_SALES_NATIVE_SUMMARY_V1','ELEGANCE_MOVE_SALES_NATIVE_SUMMARY_V2','.em-sale-mobile-checkout{display:block','padding-bottom:calc(154px']) if(!nativeCss.includes(marker)) throw new Error(`Resumo compacto mobile incompleto: ${marker}`);
for(const forbidden of ['font-size:7.4px','font-size:7.5px','font-size:7.6px','font-size:8.1px','--em-native-sale-summary-h','.em-sale-mobile-checkout{display:none']) if(css.includes(forbidden)||nativeCss.includes(forbidden)) throw new Error(`Sales mobile contem regressao de layout: ${forbidden}`);
for(const marker of ['ELEGANCE_MOVE_SALES_MOBILE_RUNTIME_V1','ELEGANCE_MOVE_SALES_MOBILE_RUNTIME_V6','isSalesView','decorate','hideContext','metricCards','decorateSaleModal','activeSaleModal','nativeSaleSummary','nativeMetric','metricLabelMatch','extractMetricValue','data-em-sale-qty','data-em-sale-discount','data-em-sale-total','Finalizar venda','PDV online','Resumo financeiro',"primary.textContent='+ Nova venda'"]) if(!js.includes(marker)) throw new Error(`Sales mobile JS incompleto: ${marker}`);
for(const forbidden of ['saleQuantity(','saleDiscount(','saleTotal(','moneyFmt=new Intl.NumberFormat',"summary.classList.add('em-sale-native-summary')"]) if(js.includes(forbidden)) throw new Error(`Resumo mobile voltou a recalcular/mover o resumo nativo: ${forbidden}`);
for(const marker of ['id="elegance-sales-mobile"','id="elegance-sales-mobile-runtime"','ELEGANCE_MOVE_SALES_NATIVE_SUMMARY_V1']) if(!html.includes(marker)) throw new Error(`Sales mobile build incompleto: ${marker}`);
if((html.match(/id="elegance-sales-mobile"/g)||[]).length!==1) throw new Error('Sales mobile CSS duplicado');
if((html.match(/id="elegance-sales-mobile-runtime"/g)||[]).length!==1) throw new Error('Sales mobile JS duplicado');
new Function(js);
console.log('SALES_MOBILE_VERIFIED',{cssBytes:Buffer.byteLength(css)+Buffer.byteLength(nativeCss),jsBytes:Buffer.byteLength(js),version:7,legibilityFloor:true,compactCheckout:true,nativeValueMirror:true,noParallelCalculation:true,modalAboveDock:true});
