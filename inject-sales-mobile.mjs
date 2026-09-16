import { readFile, writeFile } from 'node:fs/promises';

const indexPath='public/index.html';
const css=await readFile('public/sales-mobile.css','utf8');
const js=await readFile('public/sales-mobile.js','utf8');
let html=await readFile(indexPath,'utf8');

if(!css.includes('ELEGANCE_MOVE_SALES_MOBILE_V1')) throw new Error('Sales mobile CSS marker missing');
if(!js.includes('ELEGANCE_MOVE_SALES_MOBILE_RUNTIME_V1')) throw new Error('Sales mobile JS marker missing');

html=html
  .replace(/<style id="elegance-sales-mobile">[\s\S]*?<\/style>\s*/g,'')
  .replace(/<script id="elegance-sales-mobile-runtime">[\s\S]*?<\/script>\s*/g,'');

const bodyOpen=html.indexOf('<body');
if(bodyOpen<0) throw new Error('index.html sem <body>');
const headClose=html.lastIndexOf('</head>',bodyOpen);
if(headClose<0) throw new Error('index.html sem </head> real');
html=html.slice(0,headClose)+`<style id="elegance-sales-mobile">${css}</style>`+html.slice(headClose);

const bodyClose=html.lastIndexOf('</body>');
if(bodyClose<0) throw new Error('index.html sem </body>');
const safeJs=js.replace(/<\/script/gi,'<\\/script');
html=html.slice(0,bodyClose)+`<script id="elegance-sales-mobile-runtime">${safeJs}</script>`+html.slice(bodyClose);

if((html.match(/id="elegance-sales-mobile"/g)||[]).length!==1) throw new Error('Sales mobile CSS duplicado');
if((html.match(/id="elegance-sales-mobile-runtime"/g)||[]).length!==1) throw new Error('Sales mobile JS duplicado');

await writeFile(indexPath,html,'utf8');
console.log('SALES_MOBILE_INLINE_OK',{cssBytes:Buffer.byteLength(css),jsBytes:Buffer.byteLength(js)});
