import { SUPABASE_URL, SUPABASE_KEY, sessionUser } from './_supabase.js';

const json=(res,status,body)=>res.status(status).json(body);
const BUCKET='product-images';
const MAX_BYTES=2*1024*1024;
const STORAGE_PUBLIC_PREFIX=`/storage/v1/object/public/${BUCKET}/`;

function safeProductId(value=''){
  const id=String(value).trim().replace(/[^a-zA-Z0-9_-]/g,'_').slice(0,120);
  if(!id) throw new Error('INVALID_PRODUCT_ID');
  return id;
}
function objectPath(productId){return `products/${safeProductId(productId)}/main.jpg`;}
function encodedPath(path){return path.split('/').map(encodeURIComponent).join('/');}
function previousManagedPath(value,productId){
  if(!value) return '';
  try{
    const url=new URL(String(value));
    if(url.origin!==new URL(SUPABASE_URL).origin||!url.pathname.startsWith(STORAGE_PUBLIC_PREFIX)) return '';
    const raw=url.pathname.slice(STORAGE_PUBLIC_PREFIX.length).split('/').map(decodeURIComponent).join('/');
    const id=safeProductId(productId);
    if(raw===`products/${id}/main.jpg`) return raw;
    const parts=raw.split('/');
    if(parts.length===2&&parts[1]===`${id}.jpg`) return raw;
    return '';
  }catch{return '';}
}
async function removePath(session,path){
  if(!path) return true;
  const target=`${SUPABASE_URL}/storage/v1/object/${BUCKET}`;
  const removed=await fetch(target,{method:'DELETE',headers:{apikey:SUPABASE_KEY,Authorization:`Bearer ${session.access}`,'Content-Type':'application/json'},body:JSON.stringify({prefixes:[path]})});
  if(!removed.ok){console.error('product image delete failed',removed.status,await removed.text().catch(()=>''));return false;}
  return true;
}

export default async function handler(req,res){
  res.setHeader('Cache-Control','no-store');
  try{
    const session=await sessionUser(req,res);
    if(!session) return json(res,401,{error:'Unauthorized'});
    if(!['admin','manager'].includes(session.user.role)) return json(res,403,{error:'Forbidden'});
    const productId=req.body?.productId;
    const path=objectPath(productId);
    const previousPath=previousManagedPath(req.body?.previousUrl||req.body?.imageUrl,productId);

    if(req.method==='POST'){
      const dataUrl=String(req.body?.dataUrl||'');
      const match=dataUrl.match(/^data:image\/jpeg;base64,([A-Za-z0-9+/=]+)$/);
      if(!match) return json(res,400,{error:'Invalid image'});
      const buffer=Buffer.from(match[1],'base64');
      if(!buffer.length||buffer.length>MAX_BYTES) return json(res,413,{error:'Image too large'});
      const target=`${SUPABASE_URL}/storage/v1/object/${BUCKET}/${encodedPath(path)}`;
      const upload=await fetch(target,{method:'POST',headers:{apikey:SUPABASE_KEY,Authorization:`Bearer ${session.access}`,'Content-Type':'image/jpeg','x-upsert':'true','Cache-Control':'3600'},body:buffer});
      if(!upload.ok){console.error('product image upload failed',upload.status,await upload.text().catch(()=>''));return json(res,500,{error:'Upload failed'});}
      if(previousPath&&previousPath!==path) await removePath(session,previousPath);
      return json(res,200,{ok:true,url:`${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${encodedPath(path)}?v=${Date.now()}`});
    }

    if(req.method==='DELETE'){
      const removed=await removePath(session,previousPath||path);
      if(!removed) return json(res,500,{error:'Delete failed'});
      return json(res,200,{ok:true});
    }

    return json(res,405,{error:'Method Not Allowed'});
  }catch(error){
    if(error?.message==='INVALID_PRODUCT_ID') return json(res,400,{error:'Invalid product'});
    console.error('product image error',error);
    return json(res,500,{error:'Image operation failed'});
  }
}
