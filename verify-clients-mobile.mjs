import { readFile } from 'node:fs/promises';

const [html,css,js]=await Promise.all([
  readFile('public/index.html','utf8'),
  readFile('public/clients-mobile.css','utf8'),
  readFile('public/clients-mobile.js','utf8')
]);

for(const marker of ['ELEGANCE_MOVE_CLIENTS_MOBILE_V1','data-active-page="clientes"','em-clients-status']) if(!css.includes(marker)) throw new Error(`Clients mobile CSS incompleto: ${marker}`);
for(const marker of ['ELEGANCE_MOVE_CLIENTS_MOBILE_RUNTIME_V1','ELEGANCE_MOVE_CLIENTS_MOBILE_RUNTIME_V10','isClients','Cadastro organizado','+ Novo cliente','hideBrokenMetrics','findClientDetail']) if(!js.includes(marker)) throw new Error(`Clients mobile JS incompleto: ${marker}`);
for(const marker of ['id="elegance-clients-mobile"','id="elegance-clients-mobile-runtime"']) if(!html.includes(marker)) throw new Error(`Clients mobile build incompleto: ${marker}`);
if((html.match(/id="elegance-clients-mobile"/g)||[]).length!==1) throw new Error('Clients mobile CSS duplicado');
if((html.match(/id="elegance-clients-mobile-runtime"/g)||[]).length!==1) throw new Error('Clients mobile JS duplicado');
new Function(js);
console.log('CLIENTS_MOBILE_VERIFIED',{cssBytes:Buffer.byteLength(css),jsBytes:Buffer.byteLength(js),detailRuntime:'v10-hide-broken-metrics'});
