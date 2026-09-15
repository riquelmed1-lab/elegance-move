import { readFile, writeFile } from 'node:fs/promises';

const indexPath='public/index.html';
let html=await readFile(indexPath,'utf8');

const headTags=`
<link rel="manifest" href="/manifest.webmanifest">
<meta name="theme-color" content="#8f5d50">
<meta name="application-name" content="Elegance Move">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="default">
<meta name="apple-mobile-web-app-title" content="Elegance Move">
<link rel="icon" href="/pwa-icon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="/pwa-icon.svg">
`;

html=html
  .replace(/<link rel="manifest"[^>]*>\s*/g,'')
  .replace(/<meta name="theme-color"[^>]*>\s*/g,'')
  .replace(/<meta name="application-name"[^>]*>\s*/g,'')
  .replace(/<meta name="apple-mobile-web-app-capable"[^>]*>\s*/g,'')
  .replace(/<meta name="apple-mobile-web-app-status-bar-style"[^>]*>\s*/g,'')
  .replace(/<meta name="apple-mobile-web-app-title"[^>]*>\s*/g,'')
  .replace(/<link rel="icon" href="\/pwa-icon\.svg"[^>]*>\s*/g,'')
  .replace(/<link rel="apple-touch-icon"[^>]*>\s*/g,'')
  .replace(/<script src="\/pwa-runtime\.js"><\/script>\s*/g,'');

const headClose=html.lastIndexOf('</head>');
if(headClose<0) throw new Error('index.html sem </head>');
html=html.slice(0,headClose)+headTags+html.slice(headClose);

const bodyClose=html.lastIndexOf('</body>');
if(bodyClose<0) throw new Error('index.html sem </body>');
html=html.slice(0,bodyClose)+'<script src="/pwa-runtime.js"></script>'+html.slice(bodyClose);

for(const marker of ['manifest.webmanifest','apple-mobile-web-app-capable','pwa-runtime.js','theme-color']){
  if(!html.includes(marker)) throw new Error(`PWA incompleto: ${marker}`);
}
await writeFile(indexPath,html,'utf8');
console.log('PWA_PATCH_OK',{indexBytes:Buffer.byteLength(html)});
