import { readFile, access } from 'node:fs/promises';

const requiredFiles=['public/index.html','public/premium-theme.css','public/premium-fidelity.css','public/premium-hotfix.css','public/premium-cleanup.css','public/premium-theme.js','public/premium-hotfix.js','public/premium-cleanup.js','public/premium-fashion.svg','public/auth.js','public/password-recovery.js','public/users-ui.js'];
for(const file of requiredFiles) await access(file);

const [html,baseCss,fidelity,hotfixCss,cleanupCss,js,hotfixJs,cleanupJs,svg,authJs,passwordJs,usersJs]=await Promise.all([
  readFile('public/index.html','utf8'),readFile('public/premium-theme.css','utf8'),readFile('public/premium-fidelity.css','utf8'),readFile('public/premium-hotfix.css','utf8'),readFile('public/premium-cleanup.css','utf8'),readFile('public/premium-theme.js','utf8'),readFile('public/premium-hotfix.js','utf8'),readFile('public/premium-cleanup.js','utf8'),readFile('public/premium-fashion.svg','utf8'),readFile('public/auth.js','utf8'),readFile('public/password-recovery.js','utf8'),readFile('public/users-ui.js','utf8')
]);

const htmlMarkers=['id="elegance-premium-critical"','id="elegance-premium-runtime"','/auth.js','/password-recovery.js','/users-ui.js','Faturamento do mês','Lucro líquido do mês','Hard SVG isolation','sanitizeMetricSvg','ELEGANCE_MOVE_CLEANUP_V1','premium-financial-duplicate'];
for(const marker of htmlMarkers) if(!html.includes(marker)) throw new Error(`Build incompleto: ${marker}`);

const bodyOpen=html.indexOf('<body');
const styleIndex=html.indexOf('id="elegance-premium-critical"');
const runtimeIndex=html.indexOf('id="elegance-premium-runtime"');
if(bodyOpen<0||styleIndex<0||styleIndex>bodyOpen) throw new Error('CSS premium foi injetado fora do <head> real');
if(runtimeIndex<bodyOpen) throw new Error('Runtime premium foi injetado antes do <body>');

const cssAll=baseCss+fidelity+hotfixCss+cleanupCss;
const cssMarkers=['.premium-side-story','.premium-brand-card','.premium-sparkline','.premium-donut','Hard SVG isolation','ELEGANCE_MOVE_CLEANUP_V1','premium-financial-duplicate','grid-template-columns:repeat(4,minmax(0,1fr))','@media(max-width:1024px)','@media(max-width:760px)','@media(max-width:480px)'];
for(const marker of cssMarkers) if(!cssAll.includes(marker)) throw new Error(`CSS premium incompleto: ${marker}`);

const jsAll=js+'\n'+hotfixJs+'\n'+cleanupJs;
const jsMarkers=['MutationObserver','organizeDashboard','enhanceCategoryCard','enhanceTopClients','enhanceProducts','requestAnimationFrame','dashboardContent','sanitizeMetricSvg','organizeMetrics','cleanSecondary','Supabase online'];
for(const marker of jsMarkers) if(!jsAll.includes(marker)) throw new Error(`JS premium incompleto: ${marker}`);
new Function(js);new Function(hotfixJs);new Function(cleanupJs);new Function(authJs);new Function(passwordJs);new Function(usersJs);

// Compile the actual main application script. This catches corruption caused by
// injecting markup into JavaScript strings used by printable documents.
const mainMarker="<script>\n(function(){\n'use strict';";
const mainOpen=html.indexOf(mainMarker);
if(mainOpen<0) throw new Error('Script principal do aplicativo não encontrado');
const codeStart=mainOpen+'<script>\n'.length;
const codeEnd=html.indexOf('</script>',codeStart);
if(codeEnd<0) throw new Error('Fim do script principal não encontrado');
const mainCode=html.slice(codeStart,codeEnd);
for(const marker of ['function render()','function dashboard()','window.showApp=showApp','window.__EM_TEST__']) if(!mainCode.includes(marker)) throw new Error(`Script principal incompleto: ${marker}`);
new Function(mainCode);

if(!svg.startsWith('<svg')||!svg.includes('viewBox="0 0 520 520"')) throw new Error('Ilustração premium inválida');
if((html.match(/id="elegance-premium-critical"/g)||[]).length!==1) throw new Error('CSS premium inline duplicado');
if((html.match(/id="elegance-premium-runtime"/g)||[]).length!==1) throw new Error('JS premium inline duplicado');
if(html.includes('href="/premium-theme.css"')||html.includes('href="/premium-fidelity.css"')||html.includes('href="/premium-cleanup.css"')||html.includes('src="/premium-theme.js"')||html.includes('src="/premium-cleanup.js"')) throw new Error('Build ainda depende de assets premium externos');

console.log('PREMIUM_BUILD_VERIFIED',{htmlBytes:Buffer.byteLength(html),cssBytes:Buffer.byteLength(cssAll),jsBytes:Buffer.byteLength(jsAll),mainScriptBytes:Buffer.byteLength(mainCode),svgBytes:Buffer.byteLength(svg),placement:'safe',cleanup:true});
