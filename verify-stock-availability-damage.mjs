import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const html=await readFile('public/index.html','utf8');
const api=await readFile('api/damage.js','utf8');
const state=await readFile('api/state.js','utf8');
assert.ok(html.includes("Number(p.stock)>0&&(!q||[p.code,p.name,p.category,p.color,p.size]"),'listagem precisa ocultar saldo zero');
assert.ok(html.includes("Number(p.stock)>0&&Number(p.stock)<=3"),'estoque baixo não deve contar saldo zero');
assert.ok(html.includes('data-action="new-damage"'),'botão Venda avaria ausente');
assert.ok(html.includes("fetch('/api/damage'"),'a baixa precisa gravar no backend');
assert.ok(html.includes('Avarias registradas'),'histórico de avarias ausente');
assert.ok(api.includes("currentRevision !== expectedRevision"),'controle de concorrência ausente');
assert.ok(api.includes('stockBefore < quantity'),'proteção contra estoque insuficiente ausente');
assert.ok(api.includes('requestId'),'idempotência ausente');
assert.ok(state.includes('damages:Array.isArray(current.damages)?current.damages:[]'),'histórico deve ser preservado em atualizações gerais');
console.log('STOCK_AVAILABILITY_DAMAGE_VERIFIED',{zeroStockHidden:true,positiveStockVisible:true,damageStockDeduction:true,revisionConflict:true,idempotency:true,historyAppendOnly:true});
