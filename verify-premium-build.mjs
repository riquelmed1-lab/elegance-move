import { readFile, access } from 'node:fs/promises';

const requiredFiles=['public/index.html','public/premium-theme.css','public/premium-fidelity.css','public/premium-hotfix.css','public/premium-theme.js','public/premium-hotfix.js','public/premium-fashion.svg','public/auth.js','public/password-recovery.js','public/users-ui.js'];
for(const file of requiredFiles) await access(file);

const [html,baseCss,fidelity,hotfixCss,js,hotfixJs,svg]=await Promise.all([
  readFile('public/index.html','utf8'),readFile('public/premium-theme.css','utf8'),readFile('public/premium-fidelity.css','utf8'),readFile('public/premium-hotfix.css','utf8'),readFile('public/premium-theme.js','utf8'),readFile('public/premium-hotfix.js','utf8'),readFile('public/premium-fashion.svg','utf8')
]);

const htmlMarkers=['id="elegance-premium-critical"','id="elegance-premium-runtime"','/auth.js','/password-recovery.js','/users-ui.js','Faturamento do mês','Lucro líquido do mês','Hard SVG isolation','sanitizeMetricSvg'];
for(const marker of htmlMarkers) if(!html.includes(marker)) throw new Error(`Build incompleto: ${marker}`);

const cssAll=baseCss+fidelity+hotfixCss;
const cssMarkers=['.premium-side-story','.premium-brand-card','.premium-sparkline','.premium-donut','Hard SVG isolation','@media(max-width:1024px)','@media(max-width:760px)','@media(max-width:480px)'];
for(const marker of cssMarkers) if(!cssAll.includes(marker)) throw new Error(`CSS premium incompleto: ${marker}`);

const jsAll=js+'\n'+hotfixJs;
const jsMarkers=['MutationObserver','organizeDashboard','enhanceCategoryCard','enhanceTopClients','enhanceProducts','requestAnimationFrame','dashboardContent','sanitizeMetricSvg','organizeMetrics'];
for(const marker of jsMarkers) if(!jsAll.includes(marker)) throw new Error(`JS premium incompleto: ${marker}`);
new Function(js);new Function(hotfixJs);

if(!svg.startsWith('<svg')||!svg.includes('viewBox="0 0 520 520"')) throw new Error('Ilustração premium inválida');
if((html.match(/id="elegance-premium-critical"/g)||[]).length!==1) throw new Error('CSS premium inline duplicado');
if((html.match(/id="elegance-premium-runtime"/g)||[]).length!==1) throw new Error('JS premium inline duplicado');
if(html.includes('href="/premium-theme.css"')||html.includes('href="/premium-fidelity.css"')||html.includes('src="/premium-theme.js"')) throw new Error('Build ainda depende de assets premium externos');

console.log('PREMIUM_BUILD_VERIFIED',{htmlBytes:Buffer.byteLength(html),cssBytes:Buffer.byteLength(cssAll),jsBytes:Buffer.byteLength(jsAll),svgBytes:Buffer.byteLength(svg)});
