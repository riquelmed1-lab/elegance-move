import { readFile, writeFile } from 'node:fs/promises';

const indexPath='public/index.html';
const cssPath='public/premium-theme.css';
const fidelityPath='public/premium-fidelity.css';
const hotfixCssPath='public/premium-hotfix.css';
const cleanupCssPath='public/premium-cleanup.css';
const jsPath='public/premium-theme.js';
const hotfixJsPath='public/premium-hotfix.js';
const cleanupJsPath='public/premium-cleanup.js';
const artPath='public/premium-fashion.svg';

let html=await readFile(indexPath,'utf8');
const [css,fidelity,hotfixCss,cleanupCss,js,hotfixJs,cleanupJs,art]=await Promise.all([
  readFile(cssPath,'utf8'),readFile(fidelityPath,'utf8'),readFile(hotfixCssPath,'utf8'),readFile(cleanupCssPath,'utf8'),
  readFile(jsPath,'utf8'),readFile(hotfixJsPath,'utf8'),readFile(cleanupJsPath,'utf8'),readFile(artPath,'utf8')
]);
for(const marker of ['premium-brand-card','premium-kpi-secondary','.premium-dashboard']) if(!css.includes(marker)) throw new Error(`premium-theme.css inválido: ${marker}`);
for(const marker of ['premium-side-story','premium-donut','premium-sparkline']) if(!fidelity.includes(marker)) throw new Error(`premium-fidelity.css inválido: ${marker}`);
for(const marker of ['Hard SVG isolation','premium-dashboard .dash-layout']) if(!hotfixCss.includes(marker)) throw new Error(`premium-hotfix.css inválido: ${marker}`);
for(const marker of ['ELEGANCE_MOVE_CLEANUP_V1','premium-financial-duplicate']) if(!cleanupCss.includes(marker)) throw new Error(`premium-cleanup.css inválido: ${marker}`);
for(const marker of ['organizeDashboard','decorateMetrics','premium-brand-card','enhanceCategoryCard']) if(!js.includes(marker)) throw new Error(`premium-theme.js inválido: ${marker}`);
for(const marker of ['dashboardContent','sanitizeMetricSvg','organizeMetrics']) if(!hotfixJs.includes(marker)) throw new Error(`premium-hotfix.js inválido: ${marker}`);
for(const marker of ['cleanSecondary','premium-financial-duplicate','Supabase online']) if(!cleanupJs.includes(marker)) throw new Error(`premium-cleanup.js inválido: ${marker}`);
if(!art.includes('<svg')||!art.includes('linearGradient')) throw new Error('premium-fashion.svg inválido');

html=html
  .replace(/<link[^>]+href=["']\/premium-theme\.css["'][^>]*>/g,'')
  .replace(/<link[^>]+href=["']\/premium-fidelity\.css["'][^>]*>/g,'')
  .replace(/<link[^>]+href=["']\/premium-hotfix\.css["'][^>]*>/g,'')
  .replace(/<link[^>]+href=["']\/premium-cleanup\.css["'][^>]*>/g,'')
  .replace(/<script[^>]+src=["']\/premium-theme\.js["'][^>]*><\/script>/g,'')
  .replace(/<script[^>]+src=["']\/premium-hotfix\.js["'][^>]*><\/script>/g,'')
  .replace(/<script[^>]+src=["']\/premium-cleanup\.js["'][^>]*><\/script>/g,'')
  .replace(/<style id="elegance-premium-critical">[\s\S]*?<\/style>/g,'')
  .replace(/<script id="elegance-premium-runtime">[\s\S]*?<\/script>/g,'');

const safeJs=(js+'\n'+hotfixJs+'\n'+cleanupJs).replace(/<\/script/gi,'<\\/script');
const styleTag=`<style id="elegance-premium-critical">\n${css}\n${fidelity}\n${hotfixCss}\n${cleanupCss}\n</style>`;
const scriptTag=`<script id="elegance-premium-runtime">\n${safeJs}\n</script>`;

// The application contains literal </head> text inside the JavaScript string used
// to generate printable documents. Never inject by using the final </head> token.
// Resolve the real document head only in the markup that appears before <body>.
const bodyOpen=html.indexOf('<body');
if(bodyOpen<0) throw new Error('index.html sem <body>');
const headClose=html.lastIndexOf('</head>',bodyOpen);
if(headClose<0) throw new Error('index.html sem </head> real');
html=html.slice(0,headClose)+styleTag+html.slice(headClose);

const bodyClose=html.lastIndexOf('</body>');
if(bodyClose<0) throw new Error('index.html sem </body>');
html=html.slice(0,bodyClose)+scriptTag+html.slice(bodyClose);

await writeFile(indexPath,html,'utf8');
console.log('PREMIUM_THEME_INLINE_OK',{cssBytes:Buffer.byteLength(css+fidelity+hotfixCss+cleanupCss),jsBytes:Buffer.byteLength(js+hotfixJs+cleanupJs),artBytes:Buffer.byteLength(art),indexBytes:Buffer.byteLength(html),realHead:true,cleanup:true});
