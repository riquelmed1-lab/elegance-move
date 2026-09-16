import { readFile, writeFile } from 'node:fs/promises';

const indexPath='public/index.html';
const css=await readFile('public/clients-mobile.css','utf8');
const js=await readFile('public/clients-mobile.js','utf8');
let html=await readFile(indexPath,'utf8');

if(!css.includes('ELEGANCE_MOVE_CLIENTS_MOBILE_V1')) throw new Error('Clients mobile CSS marker missing');
if(!js.includes('ELEGANCE_MOVE_CLIENTS_MOBILE_RUNTIME_V1')) throw new Error('Clients mobile JS marker missing');

html=html
  .replace(/<style id="elegance-clients-mobile">[\s\S]*?<\/style>\s*/g,'')
  .replace(/<script id="elegance-clients-mobile-runtime">[\s\S]*?<\/script>\s*/g,'');

const bodyOpen=html.indexOf('<body');
if(bodyOpen<0) throw new Error('index.html sem <body>');
const headClose=html.lastIndexOf('</head>',bodyOpen);
if(headClose<0) throw new Error('index.html sem </head> real');
html=html.slice(0,headClose)+`<style id="elegance-clients-mobile">${css}</style>`+html.slice(headClose);

const bodyClose=html.lastIndexOf('</body>');
if(bodyClose<0) throw new Error('index.html sem </body>');
const safeJs=js.replace(/<\/script/gi,'<\\/script');
html=html.slice(0,bodyClose)+`<script id="elegance-clients-mobile-runtime">${safeJs}</script>`+html.slice(bodyClose);

if((html.match(/id="elegance-clients-mobile"/g)||[]).length!==1) throw new Error('Clients mobile CSS duplicado');
if((html.match(/id="elegance-clients-mobile-runtime"/g)||[]).length!==1) throw new Error('Clients mobile JS duplicado');

await writeFile(indexPath,html,'utf8');
console.log('CLIENTS_MOBILE_INLINE_OK',{cssBytes:Buffer.byteLength(css),jsBytes:Buffer.byteLength(js)});
