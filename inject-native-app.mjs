import { readFile, writeFile } from 'node:fs/promises';

const indexPath='public/index.html';
const css=await readFile('public/native-app.css','utf8');
const js=await readFile('public/native-app.js','utf8');
let html=await readFile(indexPath,'utf8');

if(!css.includes('ELEGANCE_MOVE_NATIVE_APP_V1')) throw new Error('Native app CSS marker missing');
if(!js.includes('ELEGANCE_MOVE_NATIVE_APP_RUNTIME_V1')) throw new Error('Native app JS marker missing');

html=html
  .replace(/<style id="elegance-native-app">[\s\S]*?<\/style>\s*/g,'')
  .replace(/<script id="elegance-native-app-runtime">[\s\S]*?<\/script>\s*/g,'');

const bodyOpen=html.indexOf('<body');
if(bodyOpen<0) throw new Error('index.html sem <body>');
const headClose=html.lastIndexOf('</head>',bodyOpen);
if(headClose<0) throw new Error('index.html sem </head> real');
html=html.slice(0,headClose)+`<style id="elegance-native-app">${css}</style>`+html.slice(headClose);

const bodyClose=html.lastIndexOf('</body>');
if(bodyClose<0) throw new Error('index.html sem </body>');
html=html.slice(0,bodyClose)+`<script id="elegance-native-app-runtime">${js}</script>`+html.slice(bodyClose);

if((html.match(/id="elegance-native-app"/g)||[]).length!==1) throw new Error('Native app CSS duplicado');
if((html.match(/id="elegance-native-app-runtime"/g)||[]).length!==1) throw new Error('Native app JS duplicado');

await writeFile(indexPath,html,'utf8');
console.log('NATIVE_APP_INLINE_OK',{cssBytes:Buffer.byteLength(css),jsBytes:Buffer.byteLength(js)});
