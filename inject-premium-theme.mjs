import { readFile, writeFile } from 'node:fs/promises';

const indexPath='public/index.html';
const cssPath='public/premium-theme.css';
const fidelityPath='public/premium-fidelity.css';
const hotfixCssPath='public/premium-hotfix.css';
const jsPath='public/premium-theme.js';
const hotfixJsPath='public/premium-hotfix.js';
const artPath='public/premium-fashion.svg';

let html=await readFile(indexPath,'utf8');
const [css,fidelity,hotfixCss,js,hotfixJs,art]=await Promise.all([
  readFile(cssPath,'utf8'),readFile(fidelityPath,'utf8'),readFile(hotfixCssPath,'utf8'),
  readFile(jsPath,'utf8'),readFile(hotfixJsPath,'utf8'),readFile(artPath,'utf8')
]);
for(const marker of ['premium-brand-card','premium-kpi-secondary','.premium-dashboard']) if(!css.includes(marker)) throw new Error(`premium-theme.css inválido: ${marker}`);
for(const marker of ['premium-side-story','premium-donut','premium-sparkline']) if(!fidelity.includes(marker)) throw new Error(`premium-fidelity.css inválido: ${marker}`);
for(const marker of ['Hard SVG isolation','premium-dashboard .dash-layout']) if(!hotfixCss.includes(marker)) throw new Error(`premium-hotfix.css inválido: ${marker}`);
for(const marker of ['organizeDashboard','decorateMetrics','premium-brand-card','enhanceCategoryCard']) if(!js.includes(marker)) throw new Error(`premium-theme.js inválido: ${marker}`);
for(const marker of ['dashboardContent','sanitizeMetricSvg','organizeMetrics']) if(!hotfixJs.includes(marker)) throw new Error(`premium-hotfix.js inválido: ${marker}`);
if(!art.includes('<svg')||!art.includes('linearGradient')) throw new Error('premium-fashion.svg inválido');

html=html
  .replace(/<link[^>]+href=["']\/premium-theme\.css["'][^>]*>/g,'')
  .replace(/<link[^>]+href=["']\/premium-fidelity\.css["'][^>]*>/g,'')
  .replace(/<link[^>]+href=["']\/premium-hotfix\.css["'][^>]*>/g,'')
  .replace(/<script[^>]+src=["']\/premium-theme\.js["'][^>]*><\/script>/g,'')
  .replace(/<script[^>]+src=["']\/premium-hotfix\.js["'][^>]*><\/script>/g,'')
  .replace(/<style id="elegance-premium-critical">[\s\S]*?<\/style>/g,'')
  .replace(/<script id="elegance-premium-runtime">[\s\S]*?<\/script>/g,'');

const safeJs=(js+'\n'+hotfixJs).replace(/<\/script/gi,'<\\/script');
const styleTag=`<style id="elegance-premium-critical">\n${css}\n${fidelity}\n${hotfixCss}\n</style>`;
const scriptTag=`<script id="elegance-premium-runtime">\n${safeJs}\n</script>`;

const headClose=html.lastIndexOf('</head>');
if(headClose<0) throw new Error('index.html sem </head>');
html=html.slice(0,headClose)+styleTag+html.slice(headClose);
const bodyClose=html.lastIndexOf('</body>');
if(bodyClose<0) throw new Error('index.html sem </body>');
html=html.slice(0,bodyClose)+scriptTag+html.slice(bodyClose);

await writeFile(indexPath,html,'utf8');
console.log('PREMIUM_THEME_INLINE_OK',{cssBytes:Buffer.byteLength(css+fidelity+hotfixCss),jsBytes:Buffer.byteLength(js+hotfixJs),artBytes:Buffer.byteLength(art),indexBytes:Buffer.byteLength(html)});
