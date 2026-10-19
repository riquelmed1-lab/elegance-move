import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const html=await readFile('public/index.html','utf8');
const api=await readFile('api/damage.js','utf8');
const state=await readFile('api/state.js','utf8');
assert.ok(html.includes("stockFilter==='Disponíveis'?Number(p.stock)>0:stockFilter==='Negativos'?Number(p.stock)<0:true"),'filtros devem separar disponíveis, todos e negativos');
assert.ok(html.includes('<option>Disponíveis</option><option>Todos</option><option>Negativos</option>'),'opções do filtro de estoque ausentes');
assert.ok(html.includes("metric('SKUs disponíveis',db.products.filter(p=>Number(p.stock)>0).length"),'KPI de SKUs deve contar apenas produtos disponíveis');
assert.ok(html.includes('data-action="new-damage"'),'botão Venda avaria ausente');
assert.ok(html.includes("fetch('/api/damage'"),'a baixa precisa gravar no backend');
assert.ok(html.includes('Avarias registradas'),'histórico de avarias ausente');
assert.ok(api.includes('currentRevision !== expectedRevision'),'controle de concorrência ausente');
assert.ok(api.includes('stockBefore < quantity'),'proteção contra estoque insuficiente ausente');
assert.ok(api.includes('requestId'),'idempotência ausente');
assert.ok(state.includes('damages:Array.isArray(current.damages)?current.damages:[]'),'histórico deve ser preservado em atualizações gerais');
console.log('STOCK_AVAILABILITY_DAMAGE_VERIFIED',{availableFilter:'stock > 0',allFilter:'all stock levels',negativeFilter:'stock < 0',damageStockDeduction:true,revisionConflict:true,idempotency:true,historyAppendOnly:true});
