import { readFile } from 'node:fs/promises';

const [packageText,manifestText,productCss,mobileCss,mobileJs,nativeJs,salesJs,clientsJs,cleanupJs,passwordJs,productImageApi,productImagePatch] = await Promise.all([
  readFile('package.json','utf8'),
  readFile('public/manifest.webmanifest','utf8'),
  readFile('public/product-images.css','utf8'),
  readFile('public/mobile-app.css','utf8'),
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
  dependencies:Object.keys(allDeps).length,
  observerCount,
  mobileOverflowGuard:true,
  pdvShowcase:true,
  stableProductStorage:true
});
