import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { gunzipSync } from 'node:zlib';
import { createHash } from 'node:crypto';

const chunkNames = [
  'frontend/chunks/000.b64',
  'frontend/chunks/001.b64',
  'frontend/chunks/002.b64',
  'frontend/chunks/003.b64',
  'frontend/chunks/004.b64',
  'frontend/chunks/005.b64',
  'frontend/chunks/006.b64',
  'frontend/chunks/007a.b64',
  'frontend/chunks/007b.b64',
  'frontend/chunks/008.b64'
];

const parts = [];
for (const file of chunkNames) parts.push((await readFile(file, 'utf8')).trim());
const encoded = parts.join('');
const sha = (value) => createHash('sha256').update(value).digest('hex');

const encodedHash = sha(encoded);
if (encodedHash !== '534e1f18d52003493250ff890c7530586234c5c812df01d2fa3d9baf8b8032fc') {
  throw new Error(`Frontend base64 corrompido: ${encodedHash}`);
}

const html = gunzipSync(Buffer.from(encoded, 'base64')).toString('utf8');
const htmlHash = sha(html);
if (htmlHash !== 'f14fe9195294d9ceee80fd2da1a4675ff6886ad294184019a553b0d26aaf2690') {
  throw new Error(`Frontend HTML corrompido: ${htmlHash}`);
}

for (const marker of ['<!doctype html', 'src="/auth.js"', '/api/state', 'em-cloud-cache-v1', 'window.showApp=showApp', 'auth-pending']) {
  if (!html.toLowerCase().includes(marker.toLowerCase())) throw new Error(`Frontend inválido: marcador ausente ${marker}`);
}

const authJs = await readFile('public/auth.js', 'utf8');
if (!authJs.includes('/api/auth') || !authJs.includes("action:'login'") || !authJs.includes("action:'setup'")) {
  throw new Error('auth.js inválido ou incompleto');
}

for (const file of [
  'netlify/functions/auth.mts',
  'netlify/functions/_auth.mts',
  'netlify/functions/state.mts',
  'netlify/database/migrations/001_initial_schema/migration.sql',
  'netlify/database/migrations/002_auth/migration.sql'
]) {
  const contents = await readFile(file, 'utf8');
  if (!contents.trim()) throw new Error(`Arquivo obrigatório vazio: ${file}`);
}

const responsiveCss = String.raw`
/* === RESPONSIVE SYSTEM V2 === */
html,body{max-width:100%;overflow-x:hidden}
.main,.content,#content,.card,.table-card,.chart-panel{min-width:0}
img,svg{max-width:100%}
.table-wrap{width:100%;max-width:100%;overflow-x:auto;overscroll-behavior-x:contain;-webkit-overflow-scrolling:touch;scrollbar-width:thin}
.table-wrap::-webkit-scrollbar{height:7px}.table-wrap::-webkit-scrollbar-thumb{background:#d9c9c4;border-radius:99px}
.sidebar-scrim{display:none}

@media (max-width:1280px){
  .app{grid-template-columns:204px minmax(0,1fr)}
  .sidebar{width:204px;padding-inline:12px}
  .content{padding:16px 14px 68px}
  .dashboard-lower{grid-template-columns:repeat(3,minmax(0,1fr))}
  .dash-layout{grid-template-columns:minmax(310px,.7fr) minmax(0,1.3fr)}
  .story-mini{gap:8px}
}

@media (max-width:1024px){
  .app{display:block}
  .main{grid-column:auto;width:100%}
  .sidebar{width:min(300px,84vw);transform:translateX(-105%);transition:transform .22s ease;box-shadow:18px 0 48px rgba(39,20,16,.22);z-index:70;overflow-y:auto;padding-bottom:calc(22px + env(safe-area-inset-bottom))}
  .sidebar.open{transform:translateX(0)}
  .sidebar-scrim{position:fixed;inset:0;background:rgba(18,12,10,.38);backdrop-filter:blur(2px);z-index:65}
  body.nav-open .sidebar-scrim{display:block}
  .mobile-menu{display:grid;width:38px;height:38px;place-items:center;border:1px solid var(--line);border-radius:10px;background:#fff;color:var(--dark2);font-size:17px}
  .mobile-nav{display:none}
  .topbar{height:64px;padding:0 14px;gap:10px}
  .top-left{gap:10px;flex:1}
  .top-search{display:flex;width:min(420px,48vw)}
  .content{padding:16px 14px 88px}
  .page-head{gap:10px;margin-bottom:12px}
  .page-head h1{font-size:23px}
  .story-mini{grid-template-columns:1fr}
  .grid4{grid-template-columns:repeat(2,minmax(0,1fr))}
  .dash-layout{grid-template-columns:1fr}
  .dashboard-lower{grid-template-columns:repeat(2,minmax(0,1fr))}
  .dashboard-grid,.system-grid{grid-template-columns:1fr}
  .pdv{grid-template-columns:1fr}
  .order{position:relative;top:0}
  .modal.wide{width:min(880px,calc(100vw - 24px))}
  .chart-panel{min-height:210px}
}

@media (max-width:840px){.top-search{display:none}}

@media (max-width:760px){
  .topbar{height:60px;padding:0 10px}
  .top-search{display:none}
  .top-actions{margin-left:auto}
  .top-actions>.btn{display:inline-flex;min-width:0;padding:9px 11px}
  .userbox{padding-left:0}.userbox-text{display:none}
  .content{padding:14px 10px calc(92px + env(safe-area-inset-bottom))}
  .page-head{align-items:flex-start;flex-direction:column}
  .page-head>.btn{width:100%}
  .page-head h1{font-size:22px;margin-top:2px}
  .page-head p{max-width:none;font-size:10px;line-height:1.55}
  .story-banner{padding:12px;gap:10px}.story-banner b{font-size:12px}.story-banner p{font-size:9px}
  .grid4,.kpi-grid{grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}
  .metric{padding:12px;min-height:92px}.metric strong{font-size:19px}
  .chart-head{flex-direction:column;gap:10px}.chart-actions{width:100%;justify-content:space-between;gap:8px;flex-wrap:wrap}.chart-total{text-align:left}
  .range-switch{width:100%;display:grid;grid-template-columns:repeat(4,minmax(0,1fr));overflow:visible}.range-switch button{padding:8px 4px;white-space:nowrap}
  .dashboard-lower{grid-template-columns:1fr}
  .toolbar{gap:7px}.search{min-width:100%;flex-basis:100%}.toolbar>.btn{flex:1}
  .table-card{border-radius:12px}.table{min-width:680px}.table th{padding:10px 11px}.table td{padding:11px}
  .mobile-nav{display:grid;position:fixed;left:8px;right:8px;bottom:max(8px,env(safe-area-inset-bottom));z-index:60;grid-template-columns:repeat(4,minmax(0,1fr));gap:3px;background:rgba(255,255,255,.96);backdrop-filter:blur(14px);border:1px solid var(--line);padding:5px;border-radius:14px;box-shadow:0 14px 38px rgba(25,30,45,.16)}
  .mobile-nav button{min-width:0;border:0;background:transparent;color:#7f7471;border-radius:9px;padding:7px 2px;font-size:7px;display:grid;place-items:center;gap:3px;white-space:nowrap}.mobile-nav button span:first-child{font-size:13px}.mobile-nav button.active{background:var(--dark2);color:#fff}
  .modal-back{padding:8px;align-items:end}
  .modal,.modal.wide{width:100%;max-width:none;max-height:calc(100dvh - 8px);border-radius:18px 18px 0 0}
  .modal-head{padding:13px 14px}.modal-head h2{font-size:18px}.modal-body{padding:14px}
  .form-grid{grid-template-columns:1fr}.span2,.form-actions{grid-column:auto}.form-actions{flex-direction:column-reverse}.form-actions .btn{width:100%}
  .product-row{align-items:flex-start;flex-direction:column}.product-row>div{max-width:100%}.qty{width:100%;justify-content:flex-end}
  .price-grid{grid-template-columns:1fr}
  .status-box{padding:12px}
  .toast{left:10px;right:10px;top:10px;max-width:none}
  input,select,textarea{font-size:16px!important}
}

@media (max-width:480px){
  .top-actions>.btn{display:inline-flex;font-size:0;width:38px;height:38px;padding:0;border-radius:10px}.top-actions>.btn::after{content:'＋';font-size:18px;font-weight:800}
  .avatar{width:32px;height:32px}
  .content{padding-inline:8px}
  .grid4,.kpi-grid{grid-template-columns:1fr}
  .metric{min-height:auto}
  .card-pad{padding:13px}
  .page-head h1{font-size:21px}
  .story-step{width:30px;height:30px}
  .line-chart{height:158px}
  .panel-head{align-items:flex-start;flex-wrap:wrap}
  .table{min-width:620px}
  .actions{gap:4px}.iconbtn{width:32px;height:32px}
  .order{padding:14px;border-radius:10px}.order-total strong{font-size:22px}
  .mobile-nav{left:6px;right:6px;padding:4px}.mobile-nav button{font-size:6.5px}
}

@media (hover:none) and (pointer:coarse){
  .btn,.iconbtn,.nav button,.mobile-nav button,.range-switch button{touch-action:manipulation}
  .btn:hover,.iconbtn:hover,.nav button:hover{transform:none}
}
`;

const responsiveRuntime = String.raw`
<script id="responsive-runtime">
(function(){
  const sidebar=document.getElementById('sidebar');
  const btn=document.getElementById('menuBtn');
  if(!sidebar||!btn)return;
  let scrim=document.querySelector('.sidebar-scrim');
  if(!scrim){scrim=document.createElement('div');scrim.className='sidebar-scrim';document.body.appendChild(scrim);}
  const setOpen=(open)=>{
    sidebar.classList.toggle('open',open);
    document.body.classList.toggle('nav-open',open);
    btn.setAttribute('aria-expanded',String(open));
  };
  btn.onclick=()=>setOpen(!sidebar.classList.contains('open'));
  scrim.onclick=()=>setOpen(false);
  document.addEventListener('click',(e)=>{if(e.target.closest('#desktopNav [data-page]')&&innerWidth<=1024)setOpen(false);});
  document.addEventListener('keydown',(e)=>{if(e.key==='Escape')setOpen(false);});
  addEventListener('resize',()=>{if(innerWidth>1024)setOpen(false);},{passive:true});
})();
</script>`;

let output = html;
if (!output.includes('id="responsive-v2"')) {
  output = output.replace('</head>', `<style id="responsive-v2">${responsiveCss}</style></head>`);
}
if (!output.includes('id="responsive-runtime"')) {
  const bodyClose = output.lastIndexOf('</body>');
  if (bodyClose < 0) throw new Error('Frontend inválido: fechamento </body> ausente');
  output = output.slice(0, bodyClose) + responsiveRuntime + output.slice(bodyClose);
}

for (const marker of ['id="responsive-v2"','id="responsive-runtime"','sidebar-scrim','max-width:1024px','max-width:760px']) {
  if (!output.includes(marker)) throw new Error(`Responsividade incompleta: marcador ausente ${marker}`);
}

await mkdir('public', { recursive: true });
await writeFile('public/index.html', output, 'utf8');
console.log('BUILD_OK', { baseHtmlBytes: Buffer.byteLength(html), outputBytes: Buffer.byteLength(output), htmlHash, encodedHash, chunks: chunkNames.length, responsive: true });
