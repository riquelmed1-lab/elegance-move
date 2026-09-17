import { sb, sessionUser } from './_supabase.js';
import { secureSellerWrite } from './_seller_rules.js';

const json = (res, status, body) => res.status(status).json(body);

function sanitizeSellerState(state){
  return {...state,
    products:(state.products||[]).map(p=>({...p,cost:0})),
    sales:(state.sales||[]).map(s=>({...s,lines:(s.lines||[]).map(l=>({...l,unitCost:0}))})),
    quotes:(state.quotes||[]).map(q=>({...q,lines:(q.lines||[]).map(l=>({...l,unitCost:0}))})),
    expenses:[],entries:[]};
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
    if(error?.code==='UNKNOWN_CLIENT') return json(res,400,{error:'Unknown client'});
    if(error?.code==='INVALID_QUANTITY') return json(res,400,{error:'Invalid quantity'});
    if(error?.code==='EMPTY_SALE') return json(res,400,{error:'Sale must have at least one product'});
    if(error?.code==='INVALID_CLIENT_NAME') return json(res,400,{error:'Invalid client'});
    if(/^INVALID_|^DUPLICATE_/.test(error?.code||'')) return json(res,400,{error:'Invalid commercial document'});
    console.error('state error',error);
    return json(res,500,{error:'Database operation failed'});
  }
}
