import { readFile, writeFile } from 'node:fs/promises';

const indexPath='public/index.html';
const css=await readFile('public/client-detail-force.css','utf8');
const js=await readFile('public/client-detail-force.js','utf8');
let html=await readFile(indexPath,'utf8');

if(!css.includes('ELEGANCE_MOVE_CLIENT_DETAIL_FORCE_V1')) throw new Error('Client detail force CSS marker missing');
if(!js.includes('ELEGANCE_MOVE_CLIENT_DETAIL_FORCE_RUNTIME_V1')) throw new Error('Client detail force JS marker missing');

html=html
  .replace(/<style id="elegance-client-detail-force">[\s\S]*?<\/style>\s*/g,'')
  .replace(/<script id="elegance-client-detail-force-runtime">[\s\S]*?<\/script>\s*/g,'');

const bodyOpen=html.indexOf('<body');
if(bodyOpen<0) throw new Error('index.html sem <body>');
const headClose=html.lastIndexOf('</head>',bodyOpen);
if(headClose<0) throw new Error('index.html sem </head> real');
html=html.slice(0,headClose)+`<style id="elegance-client-detail-force">${css}</style>`+html.slice(headClose);

const bodyClose=html.lastIndexOf('</body>');
if(bodyClose<0) throw new Error('index.html sem </body>');
const safeJs=js.replace(/<\/script/gi,'<\\/script');
html=html.slice(0,bodyClose)+`<script id="elegance-client-detail-force-runtime">${safeJs}</script>`+html.slice(bodyClose);

await writeFile(indexPath,html,'utf8');
console.log('CLIENT_DETAIL_FORCE_INLINE_OK',{cssBytes:Buffer.byteLength(css),jsBytes:Buffer.byteLength(js)});
