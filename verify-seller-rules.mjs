import assert from 'node:assert/strict';
import { secureSellerWrite } from './api/_seller_rules.js';

const current={
  clients:[{id:'c1',name:'Cliente Original',phone:'111',city:'Natal',birthday:'',source:'Loja',notes:'',status:'Ativo',totalSpent:100,lastPurchase:'2026-09-01'}],
  products:[{id:'p1',name:'Conjunto Move',size:'M',color:'Preto',category:'Conjunto',price:100,cost:50,stock:5}],
  sales:[{id:'s1',clientId:'c1',client:'Cliente Original',date:'2026-09-01',payment:'Pix',payments:[{id:'pay1',amount:100,method:'Pix',date:'2026-09-01',terms:''}],lines:[{productId:'p1',product:'Conjunto Move',size:'M',color:'Preto',category:'Conjunto',unitPrice:100,unitCost:50,qty:1}],subtotal:100,discountAmount:0,total:100,items:1}],
  quotes:[],expenses:[{id:'e1'}],entries:[{id:'en1'}],documentCounters:{quote:3}
};

const incoming={
  clients:[{...current.clients[0],name:'Cliente Atualizada'},{id:'c2',name:'Nova Cliente',phone:'222',city:'Parnamirim',birthday:'',source:'Instagram',notes:''}],
  products:[{...current.products[0],cost:0,stock:999}],
  sales:[
    {...current.sales[0],client:'Alteração indevida',date:'2030-01-01',total:1,lines:[{...current.sales[0].lines[0],unitCost:0,qty:99}]},
    {id:'s2',clientId:'c1',client:'texto não confiável',date:'2026-09-17',payment:'Pix',payments:[{id:'pay2',amount:500,method:'Pix',date:'2026-09-17',terms:''}],lines:[{productId:'p1',qty:2,unitPrice:1,unitCost:0}],discountAmount:10}
  ],
  quotes:[{id:'q4',quoteNo:4,clientId:'c2',client:'texto não confiável',date:'2026-09-17',lines:[{productId:'p1',qty:1,unitPrice:1,unitCost:0}],discountAmount:0}],
  documentCounters:{quote:1},expenses:[],entries:[]
};

const next=secureSellerWrite(incoming,current);
assert.equal(next.sales.length,2,'venda nova deve ser anexada');
assert.deepEqual(next.sales[0],current.sales[0],'venda histórica deve permanecer canônica e imutável');
assert.equal(next.sales[1].lines[0].unitPrice,100,'preço deve vir do cadastro do produto');
assert.equal(next.sales[1].lines[0].unitCost,50,'custo deve vir do servidor');
assert.equal(next.sales[1].total,190,'total deve ser recalculado no servidor');
assert.equal(next.sales[1].payments.reduce((sum,p)=>sum+p.amount,0),190,'pagamentos não podem superar o total da venda');
assert.equal(next.products[0].stock,3,'estoque deve baixar somente pela venda nova');
assert.equal(next.clients.find(c=>c.id==='c1').name,'Cliente Atualizada','vendedor pode editar cadastro de cliente');
assert.equal(next.clients.find(c=>c.id==='c1').totalSpent,290,'total gasto deve ser recalculado pelas vendas canônicas');
assert.equal(next.clients.find(c=>c.id==='c2').name,'Nova Cliente','vendedor pode cadastrar nova cliente');
assert.equal(next.quotes[0].lines[0].unitPrice,100,'orçamento deve usar preço canônico do produto');
assert.equal(next.quotes[0].client,'Nova Cliente','nome do cliente do orçamento deve ser canônico');
assert.equal(next.documentCounters.quote,4,'contador de orçamento nunca deve regredir');
assert.deepEqual(next.expenses,current.expenses,'vendedor não altera despesas');
assert.deepEqual(next.entries,current.entries,'vendedor não altera entradas');

const omission=secureSellerWrite({...incoming,clients:[incoming.clients[1]],sales:[incoming.sales[1]]},current);
assert.ok(omission.clients.some(c=>c.id==='c1'),'cliente existente omitido não pode ser apagado');
assert.ok(omission.sales.some(s=>s.id==='s1'),'venda existente omitida não pode ser apagada');

assert.throws(()=>secureSellerWrite({...incoming,sales:[{id:'s3',clientId:'c1',date:'2026-09-17',lines:[{productId:'p1',qty:6}],discountAmount:0}]},current),err=>err?.code==='INSUFFICIENT_STOCK','estoque negativo deve ser bloqueado');
assert.throws(()=>secureSellerWrite({...incoming,sales:[{id:'s4',clientId:'missing',date:'2026-09-17',lines:[{productId:'p1',qty:1}],discountAmount:0}]},current),err=>err?.code==='UNKNOWN_CLIENT','cliente desconhecido deve ser bloqueado');
assert.throws(()=>secureSellerWrite({...incoming,sales:[{id:'s5',clientId:'c1',date:'2026-09-17',lines:[{productId:'p1',qty:0}],discountAmount:0}]},current),err=>err?.code==='INVALID_QUANTITY','quantidade inválida deve ser bloqueada');

console.log('SELLER_RULES_VERIFIED',{historicalSalesImmutable:true,clientDeletionBlocked:true,canonicalPricing:true,paymentsCapped:true,stockProtected:true,quotesPreserved:true,counterMonotonic:true});
