import { mkdir, writeFile } from 'node:fs/promises';

const SOURCE = 'https://6aa44187940d50bd7c2623fa--elegance-move.netlify.app';

const res = await fetch(SOURCE, { headers: { 'user-agent': 'elegance-move-build' } });
if (!res.ok) throw new Error(`Falha ao buscar frontend base: ${res.status}`);
let html = await res.text();

const replaceIfPresent = (from, to) => {
  if (html.includes(from)) html = html.replace(from, to);
};

// Storage/schema upgrade: safe to run repeatedly.
replaceIfPresent("const KEY='em-store-db-v9', SESSION='em-store-session-v1';", "const KEY='em-cloud-cache-v1', SESSION='em-store-session-v1';");
replaceIfPresent('const seed={version:9,clients:[],products:[],sales:[],expenses:[],entries:[],quotes:[]};', 'const seed={version:10,clients:[],products:[],sales:[],expenses:[],entries:[],quotes:[]};');
html = html.replaceAll('x.version=9;', 'x.version=10;');

replaceIfPresent(
  '<div class="side-status"><b>Base local ativa</b><p>Persistência no navegador. Banco online: preparado para integração na publicação.</p></div>',
  '<div id="cloudStatusText" class="side-status"><b>Banco online</b><p>Sincronizando dados com a nuvem...</p></div>'
);

const oldSave = "function save(){try{LS.setItem(KEY,JSON.stringify(db));return true}catch(e){return false}}";
const cloudLayer = `let cloudRevision=null,cloudReady=false,cloudSaveChain=Promise.resolve();
function persistLocal(){try{LS.setItem(KEY,JSON.stringify(db));return true}catch(e){return false}}
function setCloudStatus(label,state){const el=document.getElementById('cloudStatusText');if(el)el.innerHTML='<b>'+label+'</b><p>'+state+'</p>'}
async function hydrateCloud(){setCloudStatus('Banco online','Sincronizando dados com a nuvem...');try{const localSnapshot=clone(db);const r=await fetch('/api/state',{cache:'no-store'});if(r.status===401){setCloudStatus('Acesso expirado','Entre novamente para continuar.');return false}if(!r.ok)throw new Error('HTTP '+r.status);const remote=await r.json();if(!remote||!Array.isArray(remote.clients)||!Array.isArray(remote.products)||!Array.isArray(remote.sales))throw new Error('Resposta inválida');cloudRevision=Number(remote.revision||0);const localHasData=[localSnapshot.clients,localSnapshot.products,localSnapshot.sales,localSnapshot.expenses,localSnapshot.entries,localSnapshot.quotes].some(a=>Array.isArray(a)&&a.length);const remoteHasData=[remote.clients,remote.products,remote.sales,remote.expenses,remote.entries,remote.quotes].some(a=>Array.isArray(a)&&a.length);if(!remoteHasData&&localHasData&&cloudRevision===0){db=localSnapshot;cloudReady=true;await queueCloudSave();render();setCloudStatus('Banco online ativo','Dados locais iniciais enviados para a nuvem.');return true}db={...clone(seed),...remote,version:10,clients:remote.clients||[],products:remote.products||[],sales:remote.sales||[],expenses:remote.expenses||[],entries:remote.entries||[],quotes:remote.quotes||[]};cloudReady=true;persistLocal();render();setCloudStatus('Banco online ativo','Dados sincronizados entre dispositivos.');return true}catch(e){cloudReady=false;setCloudStatus('Modo contingência','Sem conexão com o banco. Usando cache deste navegador.');return false}}
function queueCloudSave(){cloudSaveChain=cloudSaveChain.then(async()=>{const snapshot=clone(db),expectedRevision=cloudRevision;setCloudStatus('Banco online','Salvando alterações...');const r=await fetch('/api/state',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({state:snapshot,expectedRevision})});if(r.status===401){setCloudStatus('Acesso expirado','Entre novamente para continuar.');return}if(r.status===409){await hydrateCloud();toast('Os dados foram alterados em outro dispositivo. Recarreguei a versão mais recente.','err');return}if(!r.ok)throw new Error('HTTP '+r.status);const result=await r.json();cloudRevision=Number(result.revision||cloudRevision||0);cloudReady=true;setCloudStatus('Banco online ativo','Alterações salvas na nuvem.')} ).catch(()=>{cloudReady=false;setCloudStatus('Modo contingência','Falha ao salvar online. Os dados continuam no cache local.');});return cloudSaveChain}
function save(){persistLocal();queueCloudSave();return true}`;

if (html.includes(oldSave)) html = html.replace(oldSave, cloudLayer);

const localShowApp = "function showApp(){document.getElementById('login').classList.add('hidden');document.getElementById('app').classList.remove('hidden');render()}";
const cloudShowApp = "async function showApp(){document.getElementById('login').classList.add('hidden');document.getElementById('app').classList.remove('hidden');render();await hydrateCloud()}";
if (html.includes(localShowApp)) html = html.replace(localShowApp, cloudShowApp);

html = html.replace('>Banco local<', '>Banco online<');
html = html.replace('>Pronto para nuvem<', '>Dados na nuvem<');
html = html.replace('>Aguardando integração<', '>Sincronização ativa<');
replaceIfPresent("try{if(SS.getItem(SESSION)==='demo')showApp()}catch(e){};", "try{SS.removeItem(SESSION)}catch(e){};");

// Auth shell: also idempotent.
if (!html.includes('class="auth-pending"') && html.includes('<body>')) {
  html = html.replace('<body>', '<body class="auth-pending">');
}
if (!html.includes('body.auth-pending #app')) {
  html = html.replace('</head>', '<style>body.auth-pending #app{display:none!important}body.auth-pending #login{display:grid!important}</style></head>');
}
if (!html.includes('src="/auth.js"')) {
  html = html.replace('</body>', '<script src="/auth.js"></script></body>');
}

await mkdir('public', { recursive: true });
await writeFile('public/index.html', html, 'utf8');
console.log('Elegance Move cloud/auth frontend generated:', html.length, 'bytes');
