import { readFile, access } from 'node:fs/promises';

const requiredFiles=['public/index.html','public/premium-theme.css','public/premium-fidelity.css','public/premium-hotfix.css','public/premium-cleanup.css','public/product-images.css','public/mobile-app.css','public/mobile-polish.css','public/premium-theme.js','public/premium-hotfix.js','public/premium-cleanup.js','public/mobile-app.js','public/premium-fashion.svg','public/auth.js','public/password-recovery.js','public/users-ui.js','public/manifest.webmanifest','public/elegance-move-rose-gold-v10.png','public/pwa-icon-192.png','public/pwa-icon-512.png','public/pwa-icon-maskable-512.png','public/apple-touch-icon.png','public/pwa-runtime.js','public/sw.js','api/product-image.js'];
for(const file of requiredFiles) await access(file);

const [html,baseCss,fidelity,hotfixCss,cleanupCss,productImagesCss,mobileCss,mobilePolish,js,hotfixJs,cleanupJs,mobileJs,svg,authJs,passwordJs,usersJs,manifest,sourceIcon,icon192,icon512,maskable512,pwaRuntime,serviceWorker,productImageApi]=await Promise.all([
  readFile('public/index.html','utf8'),readFile('public/premium-theme.css','utf8'),readFile('public/premium-fidelity.css','utf8'),readFile('public/premium-hotfix.css','utf8'),readFile('public/premium-cleanup.css','utf8'),readFile('public/product-images.css','utf8'),readFile('public/mobile-app.css','utf8'),readFile('public/mobile-polish.css','utf8'),readFile('public/premium-theme.js','utf8'),readFile('public/premium-hotfix.js','utf8'),readFile('public/premium-cleanup.js','utf8'),readFile('public/mobile-app.js','utf8'),readFile('public/premium-fashion.svg','utf8'),readFile('public/auth.js','utf8'),readFile('public/password-recovery.js','utf8'),readFile('public/users-ui.js','utf8'),readFile('public/manifest.webmanifest','utf8'),readFile('public/elegance-move-rose-gold-v10.png'),readFile('public/pwa-icon-192.png'),readFile('public/pwa-icon-512.png'),readFile('public/pwa-icon-maskable-512.png'),readFile('public/pwa-runtime.js','utf8'),readFile('public/sw.js','utf8'),readFile('api/product-image.js','utf8')
]);

const htmlMarkers=['id="elegance-premium-critical"','id="elegance-premium-runtime"','id="elegance-mobile-app"','id="elegance-mobile-app-runtime"','/auth.js','/password-recovery.js','/users-ui.js','Faturamento do mês','Lucro líquido do mês','Hard SVG isolation','sanitizeMetricSvg','ELEGANCE_MOVE_CLEANUP_V1','ELEGANCE_MOVE_MOBILE_FIX_V2','ELEGANCE_MOVE_PRODUCT_IMAGES_V1','ELEGANCE_MOVE_MOBILE_APP_V1','ELEGANCE_MOVE_MOBILE_POLISH_V1','premium-financial-duplicate','id="productPhotoInput"','product-photo-stock','product-photo-sale','manifest.webmanifest?v=10','id="elegance-pwa-launch"','id="emPwaSplash"','/pwa-runtime.js','elegance-move-rose-gold-v10.png','pwa-icon-192.png'];
for(const marker of htmlMarkers) if(!html.includes(marker)) throw new Error(`Build incompleto: ${marker}`);

const bodyOpen=html.indexOf('<body');
const styleIndex=html.indexOf('id="elegance-premium-critical"');
const mobileStyleIndex=html.indexOf('id="elegance-mobile-app"');
const runtimeIndex=html.indexOf('id="elegance-premium-runtime"');
const mobileRuntimeIndex=html.indexOf('id="elegance-mobile-app-runtime"');
if(bodyOpen<0||styleIndex<0||styleIndex>bodyOpen||mobileStyleIndex<0||mobileStyleIndex>bodyOpen) throw new Error('CSS foi injetado fora do <head> real');
if(runtimeIndex<bodyOpen||mobileRuntimeIndex<bodyOpen) throw new Error('Runtime foi injetado antes do <body>');

const cssAll=baseCss+fidelity+hotfixCss+cleanupCss+productImagesCss+mobileCss+mobilePolish;
const cssMarkers=['.premium-side-story','.premium-brand-card','.premium-sparkline','.premium-donut','Hard SVG isolation','ELEGANCE_MOVE_CLEANUP_V1','ELEGANCE_MOVE_MOBILE_FIX_V2','ELEGANCE_MOVE_PRODUCT_IMAGES_V1','ELEGANCE_MOVE_MOBILE_APP_V1','ELEGANCE_MOVE_MOBILE_POLISH_V1','#emMobileDock','#emMobileMore','#logoutBtn','premium-lower-2 .list-row-main','premium-lower-3 .list-row','.product-photo-editor','.product-photo-stock','.product-photo-sale','premium-financial-duplicate','grid-template-columns:repeat(4,minmax(0,1fr))','@media(max-width:1024px)','@media(max-width:760px)','@media(max-width:480px)'];
for(const marker of cssMarkers) if(!cssAll.includes(marker)) throw new Error(`CSS premium incompleto: ${marker}`);

const jsAll=js+'\n'+hotfixJs+'\n'+cleanupJs+'\n'+mobileJs;
const jsMarkers=['MutationObserver','organizeDashboard','enhanceCategoryCard','enhanceTopClients','enhanceProducts','requestAnimationFrame','dashboardContent','sanitizeMetricSvg','organizeMetrics','cleanSecondary','Supabase online','emMobileDock','labelTables'];
for(const marker of jsMarkers) if(!jsAll.includes(marker)) throw new Error(`JS premium incompleto: ${marker}`);
new Function(js);new Function(hotfixJs);new Function(cleanupJs);new Function(mobileJs);new Function(authJs);new Function(passwordJs);new Function(usersJs);new Function(pwaRuntime);new Function(serviceWorker);

const manifestJson=JSON.parse(manifest);
if(manifestJson.display!=='standalone'||manifestJson.id!=='/'||manifestJson.start_url!=='/'||manifestJson.scope!=='/') throw new Error('Manifest PWA com identidade/escopo inválidos');
const manifestIcons=Array.isArray(manifestJson.icons)?manifestJson.icons:[];
for(const [src,sizes,purpose] of [['/pwa-icon-192.png','192x192','any'],['/pwa-icon-512.png','512x512','any'],['/pwa-icon-maskable-512.png','512x512','maskable']]){
  if(!manifestIcons.some(icon=>icon.src===src&&icon.sizes===sizes&&String(icon.purpose||'').includes(purpose))) throw new Error(`Manifest PWA incompleto: ${src} ${sizes} ${purpose}`);
}
const pngSize=(buffer,label)=>{
  if(buffer.length<24||buffer[0]!==0x89||buffer[1]!==0x50||buffer[2]!==0x4e||buffer[3]!==0x47) throw new Error(`${label} inválido`);
  return [buffer.readUInt32BE(16),buffer.readUInt32BE(20)];
};
const [sourceW,sourceH]=pngSize(sourceIcon,'Ícone base rose gold');
const [w192,h192]=pngSize(icon192,'Ícone PWA 192');
const [w512,h512]=pngSize(icon512,'Ícone PWA 512');
const [wm,hm]=pngSize(maskable512,'Ícone PWA maskable');
if(sourceW!==180||sourceH!==180) throw new Error(`Ícone base rose gold deve ser 180x180, got ${sourceW}x${sourceH}`);
if(w192!==192||h192!==192) throw new Error(`Ícone PWA 192 deve ser 192x192, got ${w192}x${h192}`);
if(w512!==512||h512!==512) throw new Error(`Ícone PWA 512 deve ser 512x512, got ${w512}x${h512}`);
if(wm!==512||hm!==512) throw new Error(`Ícone PWA maskable deve ser 512x512, got ${wm}x${hm}`);
for(const marker of ['handleSplash','__EM_PWA_OPEN_INSTALL__','beforeinstallprompt']) if(!pwaRuntime.includes(marker)) throw new Error(`Runtime PWA incompleto: ${marker}`);
for(const marker of ['/api/','APP_SHELL','elegance-move-pwa-v10','manifest.webmanifest?v=10','pwa-icon-maskable-512.png']) if(!serviceWorker.includes(marker)) throw new Error(`Service worker incompleto: ${marker}`);

const apiMarkers=['sessionUser','product-images','Image too large','x-upsert'];
for(const marker of apiMarkers) if(!productImageApi.includes(marker)) throw new Error(`API de foto incompleta: ${marker}`);

const mainMarker="<script>\n(function(){\n'use strict';";
const mainOpen=html.indexOf(mainMarker);
if(mainOpen<0) throw new Error('Script principal do aplicativo não encontrado');
const codeStart=mainOpen+'<script>\n'.length;
const codeEnd=html.indexOf('</script>',codeStart);
if(codeEnd<0) throw new Error('Fim do script principal não encontrado');
const mainCode=html.slice(codeStart,codeEnd);
for(const marker of ['function render()','function dashboard()','window.showApp=showApp','window.__EM_TEST__']) if(!mainCode.includes(marker)) throw new Error(`Script principal incompleto: ${marker}`);
for(const marker of ['function nextCommercialNumber(type)','function commercialDisplayNumber(record,type)',"numberLabel=isQuote?'Orçamento:':'Pedido:'",'orderNo:nextCommercialNumber','quoteNo:nextCommercialNumber','Térmica 80 mm','payment-status paid','(84) 99638-1431']) if(!mainCode.includes(marker)) throw new Error(`Documento comercial premium incompleto: ${marker}`);
for(const marker of ['function productPhotoMarkup(url,name,extraClass)','function compressProductPhoto(file)','function uploadProductPhoto(productId,file)','/api/product-image','imageUrl};','dashboard-product-photo']) if(!mainCode.includes(marker)) throw new Error(`Fotos de produto incompletas: ${marker}`);
new Function(mainCode);

if(!svg.startsWith('<svg')||!svg.includes('viewBox="0 0 520 520"')) throw new Error('Ilustração premium inválida');
if((html.match(/id="elegance-premium-critical"/g)||[]).length!==1) throw new Error('CSS premium inline duplicado');
if((html.match(/id="elegance-premium-runtime"/g)||[]).length!==1) throw new Error('JS premium inline duplicado');
if((html.match(/id="elegance-mobile-app"/g)||[]).length!==1||(html.match(/id="elegance-mobile-app-runtime"/g)||[]).length!==1) throw new Error('Camada mobile inline duplicada');
if((html.match(/id="emPwaSplash"/g)||[]).length!==1||(html.match(/id="elegance-pwa-launch"/g)||[]).length!==1) throw new Error('Splash PWA duplicado ou ausente');
if(html.includes('href="/premium-theme.css"')||html.includes('href="/premium-fidelity.css"')||html.includes('href="/premium-cleanup.css"')||html.includes('href="/product-images.css"')||html.includes('src="/premium-theme.js"')||html.includes('src="/premium-cleanup.js"')) throw new Error('Build ainda depende de assets premium externos');

console.log('PREMIUM_BUILD_VERIFIED',{htmlBytes:Buffer.byteLength(html),cssBytes:Buffer.byteLength(cssAll),jsBytes:Buffer.byteLength(jsAll),mainScriptBytes:Buffer.byteLength(mainCode),svgBytes:Buffer.byteLength(svg),placement:'safe',cleanup:true,mobileFix:true,mobileApp:true,mobilePolish:true,pwa:true,pwaSplash:true,pwaVersion:10,pwaIcons:{source:`${sourceW}x${sourceH}`,icon192:`${w192}x${h192}`,icon512:`${w512}x${h512}`,maskable:`${wm}x${hm}`},commercialDocument:true,printContact:true,productImages:true});
