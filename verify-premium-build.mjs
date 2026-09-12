import { readFile, access } from 'node:fs/promises';

const requiredFiles=['public/index.html','public/premium-theme.css','public/premium-fidelity.css','public/premium-theme.js','public/premium-fashion.svg','public/auth.js','public/password-recovery.js','public/users-ui.js'];
for(const file of requiredFiles) await access(file);

const [html,baseCss,fidelity,js,svg]=await Promise.all([
  readFile('public/index.html','utf8'),
  readFile('public/premium-theme.css','utf8'),
  readFile('public/premium-fidelity.css','utf8'),
  readFile('public/premium-theme.js','utf8'),
  readFile('public/premium-fashion.svg','utf8')
]);

const htmlMarkers=['/premium-theme.css','/premium-fidelity.css','/premium-theme.js','/auth.js','/password-recovery.js','/users-ui.js','Faturamento do mês','Lucro líquido do mês'];
for(const marker of htmlMarkers) if(!html.includes(marker)) throw new Error(`Build incompleto: ${marker}`);

const cssMarkers=['.premium-side-story','.premium-brand-card','.premium-sparkline','.premium-donut','@media(max-width:1024px)','@media(max-width:760px)','@media(max-width:480px)'];
for(const marker of cssMarkers) if(!(baseCss+fidelity).includes(marker)) throw new Error(`CSS premium incompleto: ${marker}`);

const jsMarkers=['MutationObserver','organizeDashboard','enhanceCategoryCard','enhanceTopClients','enhanceProducts','requestAnimationFrame'];
for(const marker of jsMarkers) if(!js.includes(marker)) throw new Error(`JS premium incompleto: ${marker}`);
new Function(js);

if(!svg.startsWith('<svg')||!svg.includes('viewBox="0 0 520 520"')) throw new Error('Ilustração premium inválida');
if((html.match(/premium-theme\.js/g)||[]).length!==1) throw new Error('premium-theme.js duplicado no HTML');
if((html.match(/premium-fidelity\.css/g)||[]).length!==1) throw new Error('premium-fidelity.css duplicado no HTML');

console.log('PREMIUM_BUILD_VERIFIED',{htmlBytes:Buffer.byteLength(html),baseCssBytes:Buffer.byteLength(baseCss),fidelityBytes:Buffer.byteLength(fidelity),jsBytes:Buffer.byteLength(js),svgBytes:Buffer.byteLength(svg)});
