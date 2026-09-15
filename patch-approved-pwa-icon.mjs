import { readFile, writeFile } from 'node:fs/promises';

const source=(await readFile('assets/elegance-app-icon.b64','utf8')).trim();
const png=Buffer.from(source,'base64');
if(png.length<10000) throw new Error('Approved Elegance icon is invalid');

await writeFile('public/pwa-icon.png',png);
await writeFile('public/pwa-icon-maskable.png',png);

let html=await readFile('public/index.html','utf8');
html=html.replaceAll('manifest.webmanifest?v=5','manifest.webmanifest?v=6');
html=html.replaceAll('pwa-icon.png?v=5','pwa-icon.png?v=6');
await writeFile('public/index.html',html,'utf8');

let manifest=await readFile('public/manifest.webmanifest','utf8');
manifest=manifest.replaceAll('pwa-icon.png?v=5','pwa-icon.png?v=6');
manifest=manifest.replaceAll('pwa-icon-maskable.png?v=5','pwa-icon-maskable.png?v=6');
await writeFile('public/manifest.webmanifest',manifest,'utf8');

let sw=await readFile('public/sw.js','utf8');
sw=sw.replace("const CACHE_NAME='elegance-move-pwa-v4';","const CACHE_NAME='elegance-move-pwa-v6';");
await writeFile('public/sw.js',sw,'utf8');

for(const marker of ['manifest.webmanifest?v=6','pwa-icon.png?v=6']){
  if(!html.includes(marker)) throw new Error(`Approved PWA icon patch incomplete: ${marker}`);
}
console.log('APPROVED_PWA_ICON_OK',{pngBytes:png.length,version:6});
