import { readFile } from 'node:fs/promises';

const [packageText,manifestText,swText,icon192,icon512,iconMaskable,productCss,mobileCss,legibilityCss,mobileJs,nativeJs,salesJs,clientsJs,cleanupJs,passwordJs,productImageApi,productImagePatch] = await Promise.all([
  readFile('package.json','utf8'),
  readFile('public/manifest.webmanifest','utf8'),
  readFile('public/sw.js','utf8'),
  readFile('public/pwa-icon-192.png'),
  readFile('public/pwa-icon-512.png'),
  readFile('public/pwa-icon-maskable-512.png'),
  readFile('public/product-images.css','utf8'),
  readFile('public/mobile-app.css','utf8'),
  readFile('public/mobile-legibility.css','utf8'),
  readFile('public/mobile-app.js','utf8'),
  readFile('public/native-app.js','utf8'),
  readFile('public/sales-mobile.js','utf8'),
  readFile('public/clients-mobile.js','utf8'),
  readFile('public/premium-cleanup.js','utf8'),
  readFile('public/password-recovery.js','utf8'),
  readFile('api/product-image.js','utf8'),
  readFile('patch-product-images.mjs','utf8')
]);

const pkg=JSON.parse(packageText);
const manifest=JSON.parse(manifestText);

function pngDimensions(buffer,label){
  if(buffer.length<24||buffer[0]!==0x89||buffer[1]!==0x50||buffer[2]!==0x4e||buffer[3]!==0x47) throw new Error(`${label} não é PNG válido`);
  return {width:buffer.readUInt32BE(16),height:buffer.readUInt32BE(20)};
}

if(pkg.engines?.node!=='24.x') throw new Error('Runtime Node deve permanecer fixado em 24.x');
const allDeps={...(pkg.dependencies||{}),...(pkg.devDependencies||{})};
for(const [name,version] of Object.entries(allDeps)){
  if(String(version).trim().toLowerCase()==='latest') throw new Error(`Dependência não reprodutível: ${name}@latest`);
}

if(manifest.id!=='/') throw new Error('PWA precisa manter id estável em /');
if(manifest.start_url!=='/') throw new Error('PWA precisa iniciar em /');
if(manifest.scope!=='/') throw new Error('PWA precisa manter scope /');
if(manifest.display!=='standalone') throw new Error('PWA precisa permanecer standalone');
if(manifest.orientation==='portrait-primary') throw new Error('PWA não deve bloquear uso em landscape/tablet');
const icons=Array.isArray(manifest.icons)?manifest.icons:[];
const icon192Manifest=icons.find(icon=>icon.src==='/pwa-icon-192.png'&&icon.sizes==='192x192'&&String(icon.purpose||'').includes('any'));
const icon512Manifest=icons.find(icon=>icon.src==='/pwa-icon-512.png'&&icon.sizes==='512x512'&&String(icon.purpose||'').includes('any'));
const iconMaskableManifest=icons.find(icon=>icon.src==='/pwa-icon-maskable-512.png'&&icon.sizes==='512x512'&&String(icon.purpose||'').includes('maskable'));
if(!icon192Manifest||!icon512Manifest||!iconMaskableManifest) throw new Error('Manifesto PWA precisa declarar ícones 192, 512 e maskable 512');
const d192=pngDimensions(icon192,'pwa-icon-192.png'),d512=pngDimensions(icon512,'pwa-icon-512.png'),dMask=pngDimensions(iconMaskable,'pwa-icon-maskable-512.png');
if(d192.width!==192||d192.height!==192) throw new Error(`pwa-icon-192.png deve ser 192x192, encontrado ${d192.width}x${d192.height}`);
if(d512.width!==512||d512.height!==512) throw new Error(`pwa-icon-512.png deve ser 512x512, encontrado ${d512.width}x${d512.height}`);
if(dMask.width!==512||dMask.height!==512) throw new Error(`pwa-icon-maskable-512.png deve ser 512x512, encontrado ${dMask.width}x${dMask.height}`);
for(const marker of ['elegance-move-pwa-v10','manifest.webmanifest?v=10','pwa-icon-192.png','pwa-icon-512.png','pwa-icon-maskable-512.png']){
  if(!swText.includes(marker)) throw new Error(`Service worker PWA v10 incompleto: ${marker}`);
}

for(const marker of [
  '@media(max-width:480px)',
  '.product-stock-cell{min-width:0;width:100%;max-width:100%}',
  '.product-stock-copy{min-width:0;overflow-wrap:anywhere}',
  'PDV PRODUCT SHOWCASE V1',
  ':has(> .product-row > .sale-product-info)',
  '@media(max-width:519px)'
]){
  if(!productCss.includes(marker)) throw new Error(`Proteção/experiência de produto ausente: ${marker}`);
}

for(const marker of ['#emMobileDock','.modal,.modal.wide','.table tbody']){
  if(!mobileCss.includes(marker)) throw new Error(`Base mobile incompleta: ${marker}`);
}

for(const marker of ['ELEGANCE_MOVE_MOBILE_LEGIBILITY_V1','font-size:9.5px','font-size:10px','body[data-active-page="clientes"] table.table td:before']){
  if(!legibilityCss.includes(marker)) throw new Error(`Legibilidade mobile incompleta: ${marker}`);
}

for(const marker of ['products/${safeProductId(productId)}/main.jpg','previousManagedPath','removePath(session,previousPath)']){
  if(!productImageApi.includes(marker)) throw new Error(`Storage de produto não estabilizado: ${marker}`);
}
for(const marker of ['function uploadProductPhoto(productId,file)','previousUrl','deleteProductPhoto(productId,p.imageUrl)']){
  if(!productImagePatch.includes(marker)) throw new Error(`Fluxo de foto do produto incompleto: ${marker}`);
}

const observerFiles={
  'mobile-app.js':mobileJs,
  'native-app.js':nativeJs,
  'sales-mobile.js':salesJs,
  'clients-mobile.js':clientsJs,
  'premium-cleanup.js':cleanupJs,
  'password-recovery.js':passwordJs
};
const observerCount=Object.values(observerFiles).reduce((sum,code)=>sum+(code.match(/new MutationObserver/g)||[]).length,0);
if(observerCount>8) throw new Error(`Excesso de MutationObservers globais/camadas: ${observerCount}`);

console.log('PROJECT_INTEGRITY_VERIFIED',{
  node:pkg.engines.node,
  stablePwaId:manifest.id,
  orientation:manifest.orientation||'any',
  pwaIcons:{icon192:d192,icon512:d512,maskable512:dMask},
  serviceWorker:'v10',
  dependencies:Object.keys(allDeps).length,
  observerCount,
  mobileOverflowGuard:true,
  mobileLegibility:true,
  pdvShowcase:true,
  stableProductStorage:true
});
