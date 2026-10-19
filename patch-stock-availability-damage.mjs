import { readFile, writeFile } from 'node:fs/promises';

const file='public/index.html';
let html=await readFile(file,'utf8');

const oldFilter = "const arr=db.products.filter(p=>(!q||[p.code,p.name,p.category,p.color,p.size].join(' ').toLowerCase().includes(q))&&(stockFilter==='Todos'||(stockFilter==='Baixo'?p.stock<=3:p.stock>3)));";
const newFilter = "const arr=db.products.filter(p=>(stockFilter==='Disponíveis'?Number(p.stock)>0:stockFilter==='Negativos'?Number(p.stock)<0:true)&&(!q||[p.code,p.name,p.category,p.color,p.size].join(' ').toLowerCase().includes(q)));";
if(!html.includes(newFilter)){
  if(!html.includes(oldFilter))throw new Error('Filtro original de estoque não encontrado.');
  html=html.replace(oldFilter,newFilter);
}
const oldOptions = '<select id="stockFilter" class="input" style="max-width:190px"><option>Todos</option><option>Baixo</option><option>Disponível</option></select>';
const newOptions = '<select id="stockFilter" class="input" style="max-width:190px"><option>Disponíveis</option><option>Todos</option><option>Negativos</option></select>';
if(!html.includes(newOptions)){if(!html.includes(oldOptions))throw new Error('Opções do filtro de estoque não encontradas.');html=html.replace(oldOptions,newOptions);}
const oldSku = "metric('SKUs',db.products.length,'Produtos cadastrados')";
const newSku = "metric('SKUs disponíveis',db.products.filter(p=>Number(p.stock)>0).length,'Produtos com saldo positivo')";
if(!html.includes(newSku)){
  if(!html.includes(oldSku))throw new Error('Indicador de SKUs cadastrados não encontrado.');
  html=html.replace(oldSku,newSku);
}

const oldLow = "metric('Estoque baixo',db.products.filter(p=>p.stock<=3).length,'Atenção necessária')";
const newLow = "metric('Estoque baixo',db.products.filter(p=>Number(p.stock)>0&&Number(p.stock)<=3).length,'Saldo entre 1 e 3 peças')";
if(!html.includes(newLow)){
  if(!html.includes(oldLow))throw new Error('Indicador de estoque baixo não encontrado.');
  html=html.replace(oldLow,newLow);
}
const oldSeed = "const seed={version:10,clients:[],products:[],sales:[],expenses:[],entries:[],quotes:[]};";
const newSeed = "const seed={version:10,clients:[],products:[],sales:[],expenses:[],entries:[],quotes:[],damages:[]};";
if(!html.includes(newSeed)){
  if(!html.includes(oldSeed))throw new Error('Seed da aplicação não encontrado.');
  html=html.replace(oldSeed,newSeed);
}

const css = String.raw`
/* ELEGANCE_MOVE_STOCK_DAMAGE_V1 */
.em-damage-button{margin-left:8px!important;border-color:#d7b7af!important;color:#815147!important;background:#fff!important}
.em-damage-button:hover{background:#fbf1ee!important;border-color:#bd9186!important}
.em-damage-history{margin-top:16px;overflow:hidden}
.em-damage-history .panel-head{display:flex;align-items:flex-start;justify-content:space-between;gap:12px}
.em-damage-history .table{min-width:720px}
#emDamageForm .status-box{border:1px solid #eadbd6;background:#fcf7f5;border-radius:12px;padding:13px}
#emDamageForm .form-actions{display:flex;justify-content:flex-end;gap:8px;flex-wrap:wrap}
#emDamageForm .form-actions .btn{min-width:110px}
.em-damage-button:focus-visible,#emDamageForm input:focus-visible,#emDamageForm select:focus-visible,#emDamageForm textarea:focus-visible{outline:2px solid #bb8e81;outline-offset:2px}
@media(max-width:760px){.em-damage-button{margin-left:0!important;margin-top:8px!important}.em-damage-history .panel-head{padding:13px!important}#emDamageForm .form-actions{flex-direction:column-reverse}#emDamageForm .form-actions .btn{width:100%}}
`;

const runtime = "(function(){\n  if(window.__emStockDamageV1)return;\n  window.__emStockDamageV1=true;\n\n  var normalize=function(value){\n    return String(value||'').normalize('NFD').replace(/[\\u0300-\\u036f]/g,'').toLowerCase().trim();\n  };\n  var moneyText=function(value){\n    var n=Number(value||0);\n    return 'R$ '+n.toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2});\n  };\n  var salesView=function(){\n    var content=document.getElementById('content');\n    if(!content)return false;\n    var title=normalize(content.querySelector('.page-head h1,h1')?.textContent);\n    var active=document.querySelector('#desktopNav button.active[data-page]')?.dataset.page||'';\n    return active==='vendas'||title==='vendas';\n  };\n\n  function ensureDamageButton(){\n    var content=document.getElementById('content');\n    if(!content||!salesView())return;\n    var head=content.querySelector('.page-head');\n    if(!head||head.querySelector('[data-action=\"new-damage\"]'))return;\n    var primary=head.querySelector('[data-action=\"new-sale\"]')||\n      Array.from(head.querySelectorAll('button')).find(function(button){return normalize(button.textContent).includes('nova venda')});\n    if(!primary)return;\n    var button=document.createElement('button');\n    button.type='button';\n    button.className='btn btn-soft em-damage-button';\n    button.dataset.action='new-damage';\n    button.textContent='Venda avaria';\n    button.title='Registrar baixa de estoque por peça avariada, sem faturamento';\n    primary.insertAdjacentElement('afterend',button);\n  }\n\n  function renderDamageHistory(){\n    var content=document.getElementById('content');\n    if(!content||!salesView())return;\n    var tableCards=Array.from(content.querySelectorAll('.table-card')).filter(function(card){return !!card.querySelector('table')});\n    var anchor=tableCards[tableCards.length-1];\n    if(!anchor)return;\n    var history=content.querySelector('#emDamageHistory');\n    if(!history){\n      history=document.createElement('section');\n      history.id='emDamageHistory';\n      history.className='card table-card em-damage-history';\n      anchor.insertAdjacentElement('afterend',history);\n    }\n    var items=Array.isArray(db.damages)?db.damages.slice():[];\n    items.sort(function(a,b){return String(b.createdAt||'').localeCompare(String(a.createdAt||''))});\n    items=items.slice(0,8);\n    var signature=JSON.stringify(items.map(function(item){return [item.id,item.createdAt,item.quantity,item.stockAfter,item.reason,item.notes]}));\n    if(history.dataset.signature===signature)return;\n    history.dataset.signature=signature;\n    var rows=items.map(function(item){\n      var date=item.createdAt?new Date(item.createdAt).toLocaleString('pt-BR'):(typeof fmtDate==='function'?fmtDate(item.date):String(item.date||'—'));\n      var variant=[item.size,item.color].filter(Boolean).join(' · ');\n      var detail=[item.productCode,variant].filter(Boolean).join(' · ');\n      return '<tr><td>'+esc(date)+'</td><td><b>'+esc(item.productName||'Produto')+'</b><div class=\"muted\" style=\"font-size:10px\">'+esc(detail||'—')+'</div></td><td><b>'+esc(String(item.quantity||0))+'</b></td><td>'+esc(item.reason||'Avaria')+(item.notes?'<div class=\"muted\" style=\"font-size:10px\">'+esc(item.notes)+'</div>':'')+'</td><td>'+esc(String(item.stockBefore??'—'))+' → '+esc(String(item.stockAfter??'—'))+'</td><td>'+esc(item.createdByName||'Usuário')+'</td></tr>';\n    }).join('');\n    history.innerHTML='<div class=\"panel-head\" style=\"padding:16px 16px 10px\"><div><div class=\"eyebrow\">Controle de perdas</div><h2 style=\"font-size:17px;margin:4px 0\">Avarias registradas</h2><p class=\"muted\" style=\"font-size:11px;margin:0\">Baixas internas de estoque, sem geração de faturamento. Exibindo as 8 ocorrências mais recentes.</p></div></div><div class=\"table-wrap\"><table class=\"table\"><thead><tr><th>Data</th><th>Produto</th><th>Qtd.</th><th>Motivo</th><th>Estoque antes → depois</th><th>Responsável</th></tr></thead><tbody>'+ (rows||'') + (rows?'':'<tr><td colspan=\"6\" class=\"muted\">Nenhuma avaria registrada.</td></tr>') +'</tbody></table></div>';\n  }\n\n  function refreshUi(){\n    ensureDamageButton();\n    renderDamageHistory();\n  }\n  var scheduled=false;\n  function scheduleRefresh(){\n    if(scheduled)return;\n    scheduled=true;\n    requestAnimationFrame(function(){scheduled=false;try{refreshUi()}catch(error){console.warn('Stock damage UI',error)}});\n  }\n\n  function damageModal(){\n    var products=(Array.isArray(db.products)?db.products:[]).filter(function(product){return Number(product.stock)>0});\n    if(!products.length){toast('Não há produtos com saldo disponível para registrar uma avaria.','err');return;}\n    var options=products.map(function(product){\n      var label=[product.name,product.code||'',product.size||'',product.color||''].filter(Boolean).join(' · ');\n      return '<option value=\"'+esc(product.id)+'\">'+esc(label)+' — saldo '+esc(String(product.stock))+'</option>';\n    }).join('');\n    modal({\n      ey:'Vendas & Estoque',\n      title:'Registrar avaria',\n      wide:true,\n      body:'<p class=\"muted\" style=\"font-size:12px;line-height:1.6;margin:0 0 16px\">Use esta opção para peças danificadas. A quantidade será abatida do estoque e ficará registrada no histórico, sem gerar faturamento ou pagamento.</p>'+\n        '<form id=\"emDamageForm\" class=\"form-grid\">'+\n        '<label class=\"span2\"><span class=\"label\">Produto com avaria</span><select id=\"emDamageProduct\" name=\"productId\" class=\"input\" required>'+options+'</select></label>'+\n        '<label><span class=\"label\">Quantidade avariada</span><input id=\"emDamageQuantity\" name=\"quantity\" type=\"number\" class=\"input\" min=\"1\" step=\"1\" value=\"1\" required></label>'+\n        '<label><span class=\"label\">Motivo</span><select id=\"emDamageReason\" name=\"reason\" class=\"input\" required><option>Peça avariada</option><option>Defeito de fabricação</option><option>Dano no manuseio</option><option>Outra avaria</option></select></label>'+\n        '<label class=\"span2\"><span class=\"label\">Observações</span><textarea id=\"emDamageNotes\" name=\"notes\" class=\"input\" rows=\"3\" maxlength=\"1000\" placeholder=\"Descreva o defeito ou a ocorrência\"></textarea></label>'+\n        '<div class=\"span2 status-box\"><b>Baixa interna de estoque</b><p id=\"emDamageStockInfo\" class=\"muted\" style=\"font-size:11px;line-height:1.6;margin:6px 0 0\"></p></div>'+\n        '<div class=\"form-actions\"><button type=\"button\" id=\"emDamageCancel\" class=\"btn btn-soft\">Cancelar</button><button type=\"submit\" id=\"emDamageSubmit\" class=\"btn btn-dark\">Confirmar baixa</button></div>'+\n        '</form>'\n    });\n\n    var form=document.getElementById('emDamageForm');\n    var select=document.getElementById('emDamageProduct');\n    var quantity=document.getElementById('emDamageQuantity');\n    var reason=document.getElementById('emDamageReason');\n    var notes=document.getElementById('emDamageNotes');\n    var info=document.getElementById('emDamageStockInfo');\n    var submit=document.getElementById('emDamageSubmit');\n    document.getElementById('emDamageCancel').onclick=closeModal;\n\n    function selectedProduct(){return products.find(function(product){return String(product.id)===String(select.value)})}\n    function updateStockInfo(){\n      var product=selectedProduct();\n      if(!product){info.textContent='Selecione um produto.';return}\n      var stock=Number(product.stock)||0;\n      quantity.max=String(stock);\n      if(Number(quantity.value)>stock)quantity.value=String(stock);\n      info.textContent='Saldo atual: '+stock+' unidade(s). Após a baixa: '+Math.max(0,stock-(Number(quantity.value)||0))+' unidade(s).';\n    }\n    select.onchange=updateStockInfo;\n    quantity.oninput=updateStockInfo;\n    updateStockInfo();\n\n    form.addEventListener('submit',async function(event){\n      event.preventDefault();\n      var product=selectedProduct();\n      var qty=Number(quantity.value);\n      var why=String(reason.value||'').trim();\n      var observation=String(notes.value||'').trim();\n      if(!product){toast('Selecione um produto.','err');return}\n      if(!Number.isInteger(qty)||qty<1||qty>Number(product.stock)){toast('A quantidade precisa estar entre 1 e o saldo disponível.','err');return}\n      if(why==='Outra avaria'&&!observation){toast('Descreva a avaria nas observações.','err');notes.focus();return}\n      submit.disabled=true;\n      submit.textContent='Registrando...';\n      var requestId=(window.crypto&&window.crypto.randomUUID)?window.crypto.randomUUID():'dam-'+Date.now()+'-'+Math.random().toString(36).slice(2);\n      try{\n        var response=await fetch('/api/damage',{\n          method:'POST',\n          headers:{'Content-Type':'application/json'},\n          body:JSON.stringify({productId:String(product.id),quantity:qty,reason:why,notes:observation,expectedRevision:Number(cloudRevision||0),requestId:requestId})\n        });\n        var result=await response.json().catch(function(){return {}});\n        if(response.status===409){\n          await hydrateCloud();\n          closeModal();\n          toast(result.error||'O estoque mudou em outro dispositivo. Atualizei os dados; confira o saldo e tente novamente.','err');\n          return;\n        }\n        if(!response.ok)throw new Error(result.error||'Não foi possível registrar a avaria.');\n        var refreshed=await hydrateCloud();\n        closeModal();\n        toast(refreshed?'Avaria registrada e estoque atualizado.':'Avaria gravada. Atualize a tela para consultar o novo saldo.',refreshed?'ok':'err');\n      }catch(error){\n        submit.disabled=false;\n        submit.textContent='Confirmar baixa';\n        toast(error?.message||'Falha ao registrar a avaria.','err');\n      }\n    });\n  }\n\n  document.addEventListener('click',function(event){\n    var button=event.target.closest('[data-action=\"new-damage\"]');\n    if(button){event.preventDefault();damageModal()}\n  });\n  var content=document.getElementById('content');\n  if(content)new MutationObserver(scheduleRefresh).observe(content,{childList:true,subtree:true});\n  scheduleRefresh();\n})();";
html=html.replace(/<style id="em-stock-damage-style">[\s\S]*?<\/style>\s*/g,'');
html=html.replace(/<script id="em-stock-damage-runtime">[\s\S]*?<\/script>\s*/g,'');
const bodyOpen=html.indexOf('<body');
if(bodyOpen<0)throw new Error('index.html sem <body>');
const headClose=html.lastIndexOf('</head>',bodyOpen);
if(headClose<0)throw new Error('index.html sem fechamento do <head>');
html=html.slice(0,headClose)+'<style id="em-stock-damage-style">'+css+'</style>'+html.slice(headClose);
const bodyClose=html.lastIndexOf('</body>');
if(bodyClose<0)throw new Error('index.html sem fechamento do <body>');
// O runtime precisa compartilhar o escopo lexical do aplicativo (db, modal, closeModal,
// toast, cloudRevision e hydrateCloud). Um script separado não enxerga variáveis let/const.
const dbAnchor=html.indexOf('let db=load()');
if(dbAnchor<0)throw new Error('Escopo principal do aplicativo não encontrado.');
const appScriptClose=html.indexOf('</script>',dbAnchor);
if(appScriptClose<0||appScriptClose>bodyClose)throw new Error('Fechamento do script principal não encontrado.');
// O aplicativo principal é uma IIFE. Inserir antes de </script> coloca o runtime
// depois de `})();`, fora do escopo de db/modal/toast. Inserimos antes do fechamento
// da IIFE para que o listener do botão enxergue as funções e variáveis lexicais.
const appIifeClose=html.lastIndexOf('})();',appScriptClose);
if(appIifeClose<dbAnchor)throw new Error('Fechamento da IIFE principal não encontrado.');
const safeRuntime=runtime.replace(/<\/script/gi,'<\\/script');
html=html.slice(0,appIifeClose)+'\n/* ELEGANCE_MOVE_STOCK_DAMAGE_RUNTIME */\n'+safeRuntime+'\n'+html.slice(appIifeClose);

for(const marker of [
  "stockFilter==='Disponíveis'?Number(p.stock)>0:stockFilter==='Negativos'?Number(p.stock)<0:true",
  "Saldo entre 1 e 3 peças",
  "damages:[]",
  "ELEGANCE_MOVE_STOCK_DAMAGE_RUNTIME",
  "data-action=\"new-damage\"",
  "fetch('/api/damage'",
  "Avarias registradas"
]){
  if(!html.includes(marker))throw new Error('Patch de estoque/avaria incompleto: '+marker);
}
await writeFile(file,html,'utf8');
console.log('STOCK_AVAILABILITY_DAMAGE_PATCH_OK',{bytes:Buffer.byteLength(html),zeroStockHidden:true,positiveStockVisible:true,damageWriteOff:true,history:true});
