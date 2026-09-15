import { readFile, writeFile } from 'node:fs/promises';

const indexPath='public/index.html';
let html=await readFile(indexPath,'utf8');

const headTags=`
<link rel="manifest" href="/manifest.webmanifest">
<meta name="theme-color" content="#8f5d50">
<meta name="application-name" content="Elegance Move">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="apple-mobile-web-app-title" content="Elegance Move">
<link rel="icon" href="/pwa-icon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="/pwa-icon.svg">
<style id="elegance-pwa-launch">
#emPwaSplash{display:none}
@media (display-mode:standalone){
  #emPwaSplash{position:fixed;inset:0;z-index:2147483646;display:flex;align-items:center;justify-content:center;background:linear-gradient(160deg,#fffaf8 0%,#f7ece7 55%,#ecd3cb 100%);transition:opacity .42s ease,visibility .42s ease}
  #emPwaSplash.em-hide{opacity:0;visibility:hidden;pointer-events:none}
  #emPwaSplash .em-splash-inner{display:flex;flex-direction:column;align-items:center;text-align:center;transform:translateY(-2vh)}
  #emPwaSplash .em-splash-icon{width:118px;height:118px;border-radius:31px;box-shadow:0 24px 55px rgba(103,67,57,.18);animation:emSplashIn .62s cubic-bezier(.2,.8,.2,1) both}
  #emPwaSplash .em-splash-name{margin-top:22px;color:#5e4038;font:800 25px/1.05 Manrope,system-ui,-apple-system,sans-serif;letter-spacing:-.045em}
  #emPwaSplash .em-splash-tag{margin-top:8px;color:#9b7b72;font:650 9px/1.35 Manrope,system-ui,-apple-system,sans-serif;letter-spacing:.13em;text-transform:uppercase}
  #emPwaSplash .em-splash-loader{width:72px;height:3px;margin-top:28px;border-radius:999px;background:rgba(143,93,80,.12);overflow:hidden}
  #emPwaSplash .em-splash-loader:after{content:"";display:block;width:38%;height:100%;border-radius:inherit;background:#8f5d50;animation:emSplashLoad 1.15s ease-in-out infinite}
  @keyframes emSplashIn{from{opacity:0;transform:scale(.86)}to{opacity:1;transform:scale(1)}}
  @keyframes emSplashLoad{0%{transform:translateX(-130%)}100%{transform:translateX(360%)}}
}
</style>
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
  .replace(/<style id="elegance-pwa-launch">[\s\S]*?<\/style>\s*/g,'')
  .replace(/<script src="\/pwa-runtime\.js"><\/script>\s*/g,'')
  .replace(/<div id="emPwaSplash"[\s\S]*?<\/div>\s*<\/div>\s*/g,'');

const headClose=html.lastIndexOf('</head>');
if(headClose<0) throw new Error('index.html sem </head>');
html=html.slice(0,headClose)+headTags+html.slice(headClose);

const bodyOpen=html.indexOf('<body');
if(bodyOpen<0) throw new Error('index.html sem <body>');
const bodyStart=html.indexOf('>',bodyOpen)+1;
const splash=`<div id="emPwaSplash" aria-hidden="true"><div class="em-splash-inner"><img class="em-splash-icon" src="/pwa-icon.svg" alt=""><div class="em-splash-name">Elegance Move</div><div class="em-splash-tag">Gestão inteligente da sua loja</div><div class="em-splash-loader"></div></div></div>`;
html=html.slice(0,bodyStart)+splash+html.slice(bodyStart);

const bodyClose=html.lastIndexOf('</body>');
if(bodyClose<0) throw new Error('index.html sem </body>');
html=html.slice(0,bodyClose)+'<script src="/pwa-runtime.js"></script>'+html.slice(bodyClose);

for(const marker of ['manifest.webmanifest','apple-mobile-web-app-capable','pwa-runtime.js','theme-color','emPwaSplash','elegance-pwa-launch']){
  if(!html.includes(marker)) throw new Error(`PWA incompleto: ${marker}`);
}
await writeFile(indexPath,html,'utf8');
console.log('PWA_PATCH_OK',{indexBytes:Buffer.byteLength(html),splash:true});
