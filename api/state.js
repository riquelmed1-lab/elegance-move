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

const text = value => value == null ? '' : String(value);
const number = value => Number(value || 0);

function mapNormalizedProduct(product){
  return {
    id:text(product.id),
    code:text(product.code),
    cost:number(product.cost),
    name:text(product.name),
    size:text(product.size),
    color:text(product.color),
    price:number(product.price),
    stock:number(product.stock),
    category:text(product.category),
    imageUrl:text(product.image_url)
  };
}

function sameProductSnapshot(currentProducts, normalizedProducts){
  if(!Array.isArray(currentProducts)||!Array.isArray(normalizedProducts)||currentProducts.length!==normalizedProducts.length) return false;
  const byId=new Map(normalizedProducts.map(product=>[product.id,product]));
  if(byId.size!==normalizedProducts.length) return false;
  return currentProducts.every(current=>{
    const normalized=byId.get(text(current.id));
    if(!normalized) return false;
    return text(current.id)===normalized.id
      && text(current.code)===normalized.code
      && number(current.cost)===normalized.cost
      && text(current.name)===normalized.name
      && text(current.size)===normalized.size
      && text(current.color)===normalized.color
      && number(current.price)===normalized.price
      && number(current.stock)===normalized.stock
      && text(current.category)===normalized.category
      && text(current.imageUrl)===normalized.imageUrl;
  });
}

async function readNormalizedProducts(token,currentProducts){
  const result=await sb('/rest/v1/products?select=id,code,name,category,size,color,stock,price,cost,image_url',{token});
  if(!result.response.ok||!Array.isArray(result.data)) return null;
  const normalized=result.data.map(mapNormalizedProduct);
  if(!sameProductSnapshot(currentProducts,normalized)) return null;
  const byId=new Map(normalized.map(product=>[product.id,product]));
  return currentProducts.map(product=>byId.get(text(product.id)));
}

export default async function handler(req,res){
  res.setHeader('Cache-Control','no-store');
  try{
    const session=await sessionUser(req,res);
    if(!session) return json(res,401,{error:'Unauthorized'});
    const row=await readRow(session.access);
    const current=row.state||{};

    if(req.method==='GET'){
      let readState=current;
      let productSource='app_state';
      try{
        const normalizedProducts=await readNormalizedProducts(session.access,current.products||[]);
        if(normalizedProducts){
          readState={...current,products:normalizedProducts};
          productSource='normalized';
        }
      }catch(error){
        console.warn('normalized product read fallback',error?.message||error);
      }
      res.setHeader('X-Elegance-Products-Source',productSource);
      const state=session.user.role==='seller'?sanitizeSellerState(readState):readState;
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
