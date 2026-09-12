import { sb, sessionUser } from './_supabase.js';

const asNumber = v => Number(v ?? 0) || 0;
const json = (res, status, body) => res.status(status).json(body);

function sanitizeSellerState(state){
  return {...state,
    products:(state.products||[]).map(p=>({...p,cost:0})),
    sales:(state.sales||[]).map(s=>({...s,lines:(s.lines||[]).map(l=>({...l,unitCost:0}))})),
    quotes:(state.quotes||[]).map(q=>({...q,lines:(q.lines||[]).map(l=>({...l,unitCost:0}))})),
    expenses:[],entries:[]};
}

function soldByProduct(sales){
  const totals=new Map();
  for(const sale of sales||[]) for(const line of sale.lines||[]){
    const id=String(line.productId||'');
    if(id) totals.set(id,(totals.get(id)||0)+Math.max(0,Number(line.qty)||0));
  }
  return totals;
}

function secureSellerWrite(incoming,current){
  const productMap=new Map((current.products||[]).map(p=>[String(p.id),p]));
  const oldSalesMap=new Map((current.sales||[]).map(s=>[String(s.id),s]));
  const oldSold=soldByProduct(current.sales||[]),newSold=soldByProduct(incoming.sales||[]);
  const products=(current.products||[]).map(p=>{
    const id=String(p.id), nextStock=Math.round((Number(p.stock)+(oldSold.get(id)||0)-(newSold.get(id)||0))*1000)/1000;
    if(nextStock<-.0001) throw Object.assign(new Error('INSUFFICIENT_STOCK'),{code:'INSUFFICIENT_STOCK',product:p.name});
    return {...p,stock:Math.max(0,nextStock)};
  });
  const sales=(incoming.sales||[]).map(s=>{
    const oldSale=oldSalesMap.get(String(s.id));
    const lines=(s.lines||[]).map(l=>{
      const product=productMap.get(String(l.productId));
      if(!product) throw Object.assign(new Error('UNKNOWN_PRODUCT'),{code:'UNKNOWN_PRODUCT'});
      const previous=(oldSale?.lines||[]).find(x=>String(x.productId)===String(l.productId));
      return {...l,product:product.name,size:product.size,color:product.color,category:product.category,
        unitPrice:previous?asNumber(previous.unitPrice):asNumber(product.price),
        unitCost:previous?asNumber(previous.unitCost):asNumber(product.cost),qty:Math.max(1,Math.floor(Number(l.qty)||1))};
    });
    const subtotal=lines.reduce((sum,l)=>sum+asNumber(l.unitPrice)*Number(l.qty),0);
    const discountAmount=Math.max(0,Math.min(subtotal,asNumber(s.discountAmount)));
    return {...s,lines,subtotal,discountAmount,total:subtotal-discountAmount,items:lines.reduce((a,l)=>a+Number(l.qty),0)};
  });
  const totals=new Map();
  for(const sale of sales){const cid=String(sale.clientId||'');if(!cid)continue;const prev=totals.get(cid)||{total:0,last:''};prev.total+=asNumber(sale.total);if(String(sale.date||'')>prev.last)prev.last=String(sale.date||'');totals.set(cid,prev);}
  const clients=(incoming.clients||[]).map(c=>{const t=totals.get(String(c.id))||{total:0,last:''};return {...c,totalSpent:t.total,lastPurchase:t.last,status:t.total>=1000?'VIP':(c.status==='Reativar'?'Reativar':'Ativo')};});
  const quotes=(incoming.quotes||[]).map(q=>{
    const lines=(q.lines||[]).map(l=>{const product=productMap.get(String(l.productId));if(!product)throw Object.assign(new Error('UNKNOWN_PRODUCT'),{code:'UNKNOWN_PRODUCT'});return {...l,product:product.name,size:product.size,color:product.color,category:product.category,unitPrice:asNumber(product.price),unitCost:asNumber(product.cost),qty:Math.max(1,Math.floor(Number(l.qty)||1))};});
    const subtotal=lines.reduce((sum,l)=>sum+asNumber(l.unitPrice)*Number(l.qty),0),discountAmount=Math.max(0,Math.min(subtotal,asNumber(q.discountAmount)));
    return {...q,lines,subtotal,discountAmount,total:subtotal-discountAmount,items:lines.reduce((a,l)=>a+Number(l.qty),0)};
  });
  return {...current,clients,sales,quotes,products,expenses:current.expenses,entries:current.entries};
}

async function readRow(token){
  const result=await sb('/rest/v1/app_state?select=state,revision,updated_at&id=eq.1&limit=1',{token});
  if(!result.response.ok) throw new Error('STATE_READ_FAILED');
  const row=Array.isArray(result.data)?result.data[0]:null;
  if(!row) throw new Error('STATE_NOT_FOUND');
  return row;
}

export default async function handler(req,res){
  res.setHeader('Cache-Control','no-store');
  try{
    const session=await sessionUser(req,res);
    if(!session) return json(res,401,{error:'Unauthorized'});
    const row=await readRow(session.access);
    const current=row.state||{};

    if(req.method==='GET'){
      const state=session.user.role==='seller'?sanitizeSellerState(current):current;
      return json(res,200,{...state,revision:Number(row.revision||0),updatedAt:row.updated_at||null});
    }
    if(req.method!=='PUT') return json(res,405,{error:'Method Not Allowed'});
    const payload=req.body||{}, incoming=payload.state||payload;
    if(!incoming||!Array.isArray(incoming.clients)||!Array.isArray(incoming.products)||!Array.isArray(incoming.sales)) return json(res,400,{error:'Invalid state'});
    const expected=payload.expectedRevision==null?Number(row.revision||0):Number(payload.expectedRevision);
    if(Number(row.revision||0)!==expected) return json(res,409,{error:'Revision conflict'});
    const next=session.user.role==='seller'?secureSellerWrite(incoming,current):incoming;
    const nextRevision=expected+1, updatedAt=new Date().toISOString();
    const update=await sb(`/rest/v1/app_state?id=eq.1&revision=eq.${encodeURIComponent(expected)}`,{
      method:'PATCH',token:session.access,body:{state:next,revision:nextRevision,updated_at:updatedAt},headers:{Prefer:'return=representation'}
    });
    if(!update.response.ok) return json(res,500,{error:'Database operation failed'});
    if(!Array.isArray(update.data)||!update.data.length) return json(res,409,{error:'Revision conflict'});
    return json(res,200,{ok:true,revision:nextRevision,updatedAt});
  }catch(error){
    if(error?.code==='INSUFFICIENT_STOCK') return json(res,409,{error:'Insufficient stock',product:error.product});
    if(error?.code==='UNKNOWN_PRODUCT') return json(res,400,{error:'Unknown product'});
    console.error('state error',error);
    return json(res,500,{error:'Database operation failed'});
  }
}
