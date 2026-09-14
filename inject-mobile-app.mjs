import { readFile, writeFile } from 'node:fs/promises';

const indexPath='public/index.html';
const cssPath='public/mobile-app.css';
const jsPath='public/mobile-app.js';
let html=await readFile(indexPath,'utf8');
const [css,js]=await Promise.all([readFile(cssPath,'utf8'),readFile(jsPath,'utf8')]);
for(const marker of ['ELEGANCE_MOVE_MOBILE_APP_V1','#emMobileDock','#emMobileMore']) if(!css.includes(marker)) throw new Error(`mobile-app.css inválido: ${marker}`);
for(const marker of ['emMobileDock','labelTables','MutationObserver']) if(!js.includes(marker)) throw new Error(`mobile-app.js inválido: ${marker}`);
html=html.replace(/<style id="elegance-mobile-app">[\s\S]*?<\/style>/g,'').replace(/<script id="elegance-mobile-app-runtime">[\s\S]*?<\/script>/g,'');
const bodyOpen=html.indexOf('<body');if(bodyOpen<0) throw new Error('index.html sem <body>');
const headClose=html.lastIndexOf('</head>',bodyOpen);if(headClose<0) throw new Error('index.html sem </head> real');
html=html.slice(0,headClose)+`<style id="elegance-mobile-app">\n${css}\n</style>`+html.slice(headClose);
const bodyClose=html.lastIndexOf('</body>');if(bodyClose<0) throw new Error('index.html sem </body>');
const safeJs=js.replace(/<\/script/gi,'<\\/script');
html=html.slice(0,bodyClose)+`<script id="elegance-mobile-app-runtime">\n${safeJs}\n</script>`+html.slice(bodyClose);
await writeFile(indexPath,html,'utf8');
console.log('MOBILE_APP_INLINE_OK',{cssBytes:Buffer.byteLength(css),jsBytes:Buffer.byteLength(js),indexBytes:Buffer.byteLength(html)});
