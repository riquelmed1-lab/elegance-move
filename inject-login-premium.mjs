import { readFile, writeFile } from 'node:fs/promises';

const indexPath='public/index.html';
const css=await readFile('public/login-premium.css','utf8');
const js=await readFile('public/login-premium.js','utf8');
let html=await readFile(indexPath,'utf8');

if(!css.includes('ELEGANCE_MOVE_LOGIN_PREMIUM_V1')) throw new Error('Login premium CSS marker missing');
if(!js.includes('ELEGANCE_MOVE_LOGIN_PREMIUM_RUNTIME_V1')) throw new Error('Login premium JS marker missing');

html=html
  .replace(/<style id="elegance-login-premium">[\s\S]*?<\/style>\s*/g,'')
  .replace(/<script id="elegance-login-premium-runtime">[\s\S]*?<\/script>\s*/g,'');

const bodyOpen=html.indexOf('<body');
if(bodyOpen<0) throw new Error('index.html sem <body>');
const headClose=html.lastIndexOf('</head>',bodyOpen);
if(headClose<0) throw new Error('index.html sem </head> real');
html=html.slice(0,headClose)+`<style id="elegance-login-premium">${css}</style>`+html.slice(headClose);

const bodyClose=html.lastIndexOf('</body>');
if(bodyClose<0) throw new Error('index.html sem </body>');
html=html.slice(0,bodyClose)+`<script id="elegance-login-premium-runtime">${js}</script>`+html.slice(bodyClose);

if((html.match(/id="elegance-login-premium"/g)||[]).length!==1) throw new Error('Login premium CSS duplicado');
if((html.match(/id="elegance-login-premium-runtime"/g)||[]).length!==1) throw new Error('Login premium JS duplicado');

await writeFile(indexPath,html,'utf8');
console.log('LOGIN_PREMIUM_INLINE_OK',{cssBytes:Buffer.byteLength(css),jsBytes:Buffer.byteLength(js)});
