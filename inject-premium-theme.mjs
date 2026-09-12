import { readFile, writeFile } from 'node:fs/promises';

const indexPath='public/index.html';
const cssPath='public/premium-theme.css';
const fidelityPath='public/premium-fidelity.css';
const jsPath='public/premium-theme.js';
const artPath='public/premium-fashion.svg';

let html=await readFile(indexPath,'utf8');
const css=await readFile(cssPath,'utf8');
const fidelity=await readFile(fidelityPath,'utf8');
const js=await readFile(jsPath,'utf8');
const art=await readFile(artPath,'utf8');
for(const marker of ['premium-brand-card','premium-kpi-secondary','.premium-dashboard']){
  if(!css.includes(marker)) throw new Error(`premium-theme.css inválido: ${marker}`);
}
for(const marker of ['premium-side-story','premium-donut','premium-sparkline']){
  if(!fidelity.includes(marker)) throw new Error(`premium-fidelity.css inválido: ${marker}`);
}
for(const marker of ['organizeDashboard','decorateMetrics','premium-brand-card','enhanceCategoryCard']){
  if(!js.includes(marker)) throw new Error(`premium-theme.js inválido: ${marker}`);
}
if(!art.includes('<svg')||!art.includes('linearGradient')) throw new Error('premium-fashion.svg inválido');
const headClose=html.lastIndexOf('</head>');
if(headClose<0) throw new Error('index.html sem </head>');
if(!html.includes('href="/premium-theme.css"')) html=html.slice(0,headClose)+'<link rel="stylesheet" href="/premium-theme.css">'+html.slice(headClose);
if(!html.includes('href="/premium-fidelity.css"')){
  const pos=html.lastIndexOf('</head>');
  html=html.slice(0,pos)+'<link rel="stylesheet" href="/premium-fidelity.css">'+html.slice(pos);
}
if(!html.includes('src="/premium-theme.js"')){
  const bodyClose=html.lastIndexOf('</body>');
  if(bodyClose<0) throw new Error('index.html sem </body>');
  html=html.slice(0,bodyClose)+'<script src="/premium-theme.js"></script>'+html.slice(bodyClose);
}
await writeFile(indexPath,html,'utf8');
console.log('PREMIUM_THEME_OK',{cssBytes:Buffer.byteLength(css),fidelityBytes:Buffer.byteLength(fidelity),jsBytes:Buffer.byteLength(js),artBytes:Buffer.byteLength(art),indexBytes:Buffer.byteLength(html)});
