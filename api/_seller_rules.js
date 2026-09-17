const asNumber=v=>Number(v??0)||0;
const idOf=value=>String(value??'').trim();
const CLIENT_EDITABLE_FIELDS=['name','phone','city','birthday','source','notes','status'];
const money=value=>Math.round(asNumber(value)*100)/100;

function fail(code,extra={}){
  throw Object.assign(new Error(code),{code,...extra});
}

function assertUniqueIds(items,label){
  const seen=new Set();
  for(const item of items||[]){
    const id=idOf(item?.id);
    if(!id) fail(`INVALID_${label}_ID`);
    if(seen.has(id)) fail(`DUPLICATE_${label}_ID`);
    seen.add(id);
  }
}

function soldByProduct(sales){
  const totals=new Map();
  for(const sale of sales||[]) for(const line of sale.lines||[]){
    const id=idOf(line.productId);
    if(id) totals.set(id,(totals.get(id)||0)+Math.max(0,Math.floor(Number(line.qty)||0)));
  }
  return totals;
}

function mergeSellerClients(incoming,current){
  const oldMap=new Map((current||[]).map(c=>[idOf(c.id),c]));
  assertUniqueIds(incoming,'CLIENT');
  const incomingMap=new Map((incoming||[]).map(c=>[idOf(c.id),c]));
  const merged=(current||[]).map(existing=>{
    const patch=incomingMap.get(idOf(existing.id));
    if(!patch) return {...existing};
    const next={...existing};
    for(const field of CLIENT_EDITABLE_FIELDS){
      if(Object.prototype.hasOwnProperty.call(patch,field)) next[field]=patch[field];
    }
    next.name=String(next.name||'').trim();
    if(!next.name) fail('INVALID_CLIENT_NAME');
    return next;
  });
  for(const client of incoming||[]){
    const id=idOf(client.id);
    if(oldMap.has(id)) continue;
    const next={id,totalSpent:0,lastPurchase:'',status:client.status==='Reativar'?'Reativar':'Ativo'};
    for(const field of CLIENT_EDITABLE_FIELDS) if(Object.prototype.hasOwnProperty.call(client,field)) next[field]=client[field];
    next.name=String(next.name||'').trim();
    if(!next.name) fail('INVALID_CLIENT_NAME');
    merged.push(next);
  }
  return merged;
}

function secureLine(line,productMap,unitPriceOverride){
  const product=productMap.get(idOf(line?.productId));
  if(!product) fail('UNKNOWN_PRODUCT');
  const qty=Math.floor(Number(line.qty)||0);
  if(qty<1) fail('INVALID_QUANTITY');
  return {
    ...line,
    productId:product.id,
    product:product.name,
    size:product.size,
    color:product.color,
    category:product.category,
    unitPrice:unitPriceOverride==null?money(product.price):money(unitPriceOverride),
    unitCost:money(product.cost),
    qty
  };
}

function secureDiscount(doc,subtotal){
  const base=money(Math.max(0,subtotal));
  const type=String(doc?.discountType||'').trim().toLowerCase();
  if(type==='percent'||type==='percentage'){
    const value=Math.max(0,Math.min(100,asNumber(doc.discountValue)));
    const amount=money(base*value/100);
    return {discountType:'percent',discountValue:value,discountAmount:amount};
  }
  if(type==='amount'){
    const requested=Object.prototype.hasOwnProperty.call(doc||{},'discountValue')?asNumber(doc.discountValue):asNumber(doc.discountAmount);
    const amount=money(Math.max(0,Math.min(base,requested)));
    return {discountType:amount>0?'amount':'none',discountValue:amount,discountAmount:amount};
  }
  const fallback=money(Math.max(0,Math.min(base,asNumber(doc?.discountAmount))));
  return {discountType:fallback>0?'amount':'none',discountValue:fallback,discountAmount:fallback};
}

function securePayments(payments,total){
  let remaining=money(Math.max(0,asNumber(total)));
  const secured=[];
  for(const payment of Array.isArray(payments)?payments:[]){
    if(remaining<=0) break;
    const amount=money(Math.max(0,Math.min(remaining,asNumber(payment?.amount))));
    if(amount<=0) continue;
    secured.push({...payment,amount});
    remaining=money(Math.max(0,remaining-amount));
  }
  return secured;
}

function secureNewSale(sale,productMap,clientMap){
  const id=idOf(sale?.id);
  if(!id) fail('INVALID_SALE_ID');
  const clientId=idOf(sale.clientId);
  if(clientId&&!clientMap.has(clientId)) fail('UNKNOWN_CLIENT');
  const lines=(sale.lines||[]).map(line=>secureLine(line,productMap));
  if(!lines.length) fail('EMPTY_SALE');
  const subtotal=money(lines.reduce((sum,line)=>sum+asNumber(line.unitPrice)*line.qty,0));
  const discount=secureDiscount(sale,subtotal);
  const total=money(subtotal-discount.discountAmount);
  const client=clientId?clientMap.get(clientId):null;
  const payments=securePayments(sale.payments,total);
  return {
    ...sale,
    ...discount,
    id,
    clientId:clientId||'',
    client:client?.name||sale.client||'Cliente avulso',
    lines,
    payments,
    subtotal,
    total,
    items:lines.reduce((sum,line)=>sum+line.qty,0)
  };
}

function secureQuotes(incoming,productMap,clientMap){
  assertUniqueIds(incoming,'QUOTE');
  return (incoming||[]).map(quote=>{
    const clientId=idOf(quote.clientId);
    if(clientId&&!clientMap.has(clientId)) fail('UNKNOWN_CLIENT');
    const lines=(quote.lines||[]).map(line=>secureLine(line,productMap));
    const subtotal=money(lines.reduce((sum,line)=>sum+asNumber(line.unitPrice)*line.qty,0));
    const discount=secureDiscount(quote,subtotal);
    const client=clientId?clientMap.get(clientId):null;
    return {
      ...quote,
      ...discount,
      id:idOf(quote.id),
      clientId:clientId||'',
      client:client?.name||quote.client||'Cliente avulso',
      lines,
      subtotal,
      total:money(subtotal-discount.discountAmount),
      items:lines.reduce((sum,line)=>sum+line.qty,0)
    };
  });
}

function recomputeClientStats(clients,sales){
  const totals=new Map();
  for(const sale of sales||[]){
    const clientId=idOf(sale.clientId);
    if(!clientId) continue;
    const prev=totals.get(clientId)||{total:0,last:''};
    prev.total=money(prev.total+asNumber(sale.total));
    if(String(sale.date||'')>prev.last) prev.last=String(sale.date||'');
    totals.set(clientId,prev);
  }
  return (clients||[]).map(client=>{
    const stats=totals.get(idOf(client.id))||{total:0,last:''};
    return {...client,totalSpent:stats.total,lastPurchase:stats.last,status:stats.total>=1000?'VIP':(client.status==='Reativar'?'Reativar':'Ativo')};
  });
}

function nextDocumentCounters(incoming,current,quotes){
  const currentCounters=current||{};
  const incomingCounters=incoming||{};
  const maxQuoteNo=(quotes||[]).reduce((max,quote)=>Math.max(max,Math.floor(asNumber(quote.quoteNo))),0);
  return {...currentCounters,quote:Math.max(Math.floor(asNumber(currentCounters.quote)),Math.floor(asNumber(incomingCounters.quote)),maxQuoteNo)};
}

export function secureSellerWrite(incoming,current){
  const currentProducts=current.products||[];
  const productMap=new Map(currentProducts.map(product=>[idOf(product.id),product]));
  const currentSales=current.sales||[];
  const oldSaleIds=new Set(currentSales.map(sale=>idOf(sale.id)));

  const incomingSales=incoming.sales||[];
  assertUniqueIds(incomingSales,'SALE');
  const clientsBase=mergeSellerClients(incoming.clients||[],current.clients||[]);
  const clientMapBase=new Map(clientsBase.map(client=>[idOf(client.id),client]));

  // Vendas já gravadas são canônicas: o vendedor não as edita nem apaga.
  const newSales=incomingSales.filter(sale=>!oldSaleIds.has(idOf(sale.id))).map(sale=>secureNewSale(sale,productMap,clientMapBase));
  const finalSales=[...currentSales,...newSales];

  // Estoque é afetado somente por vendas novas. Histórico antigo já está refletido no saldo atual.
  const newlySold=soldByProduct(newSales);
  const products=currentProducts.map(product=>{
    const nextStock=Math.round((asNumber(product.stock)-(newlySold.get(idOf(product.id))||0))*1000)/1000;
    if(nextStock<-.0001) fail('INSUFFICIENT_STOCK',{product:product.name});
    return {...product,stock:Math.max(0,nextStock)};
  });

  const clients=recomputeClientStats(clientsBase,finalSales);
  const clientMap=new Map(clients.map(client=>[idOf(client.id),client]));
  const quotes=secureQuotes(incoming.quotes||[],productMap,clientMap);
  const documentCounters=nextDocumentCounters(incoming.documentCounters,current.documentCounters,quotes);

  return {
    ...current,
    clients,
    sales:finalSales,
    quotes,
    products,
    documentCounters,
    expenses:current.expenses,
    entries:current.entries
  };
}

export const sellerRuleInternals={soldByProduct,recomputeClientStats,nextDocumentCounters,securePayments,secureDiscount};
