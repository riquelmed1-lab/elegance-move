import { readFile, writeFile } from 'node:fs/promises';

const indexPath='public/index.html';
const cssPath='public/premium-theme.css';
const jsPath='public/premium-theme.js';

let html=await readFile(indexPath,'utf8');
const css=await readFile(cssPath,'utf8');
const js=await readFile(jsPath,'utf8');
for(const marker of ['premium-brand-card','premium-kpi-secondary','.premium-dashboard']){
  if(!css.includes(marker)) throw new Error(`premium-theme.css inválido: ${marker}`);
}
for(const marker of ['organizeDashboard','decorateMetrics','premium-brand-card']){
  if(!js.includes(marker)) throw new Error(`premium-theme.js inválido: ${marker}`);
}
if(!html.includes('href="/premium-theme.css"')){
  const headClose=html.lastIndexOf('</head>');
  if(headClose<0) throw new Error('index.html sem </head>');
  html=html.slice(0,headClose)+'<link rel="stylesheet" href="/premium-theme.css">'+html.slice(headClose);
}
if(!html.includes('src="/premium-theme.js"')){
  const bodyClose=html.lastIndexOf('</body>');
  if(bodyClose<0) throw new Error('index.html sem </body>');
  html=html.slice(0,bodyClose)+'<script src="/premium-theme.js"></script>'+html.slice(bodyClose);
}
await writeFile(indexPath,html,'utf8');
console.log('PREMIUM_THEME_OK',{cssBytes:Buffer.byteLength(css),jsBytes:Buffer.byteLength(js),indexBytes:Buffer.byteLength(html)});
