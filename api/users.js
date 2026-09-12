import { sb, sessionUser } from './_supabase.js';

const json=(res,status,body)=>res.status(status).json(body);
const mapUser=p=>({id:p.id,name:p.full_name||'Usuário',email:p.email||'',role:p.role||'seller',active:p.active===true,lastLoginAt:p.last_login_at||null,createdAt:p.created_at||null,updatedAt:p.updated_at||null});

async function listUsers(token){
  const r=await sb('/rest/v1/profiles?select=id,full_name,email,role,active,last_login_at,created_at,updated_at&order=created_at.asc',{token});
  if(!r.response.ok) throw new Error('USERS_READ_FAILED');
  return (Array.isArray(r.data)?r.data:[]).map(mapUser);
}

export default async function handler(req,res){
  res.setHeader('Cache-Control','no-store');
  try{
    const session=await sessionUser(req,res);
    if(!session) return json(res,401,{error:'Unauthorized'});
    if(session.user.role!=='admin') return json(res,403,{error:'Forbidden'});

    if(req.method==='GET') return json(res,200,{users:await listUsers(session.access),currentUserId:session.user.id});
    if(req.method!=='POST') return json(res,405,{error:'Method Not Allowed'});

    const body=req.body||{},action=String(body.action||'');
    if(action==='create'){
      const name=String(body.name||'').trim(),email=String(body.email||'').trim().toLowerCase(),password=String(body.password||''),role=['admin','manager','seller'].includes(body.role)?body.role:'seller';
      if(name.length<2||!email||password.length<8) return json(res,400,{error:'Invalid user data'});
      const created=await sb('/auth/v1/signup',{method:'POST',body:{email,password,data:{full_name:name}}});
      if(!created.response.ok||!created.data?.user?.id) return json(res,409,{error:'Email already exists'});
      const id=created.data.user.id;
      const patch=await sb(`/rest/v1/profiles?id=eq.${encodeURIComponent(id)}`,{method:'PATCH',token:session.access,body:{full_name:name,email,role,active:true,updated_at:new Date().toISOString()},headers:{Prefer:'return=minimal'}});
      if(!patch.response.ok) return json(res,500,{error:'Could not configure user'});
      return json(res,200,{ok:true,user:{id,name,email,role,active:true},requiresEmailConfirmation:!created.data.access_token});
    }

    if(action==='update'){
      const id=String(body.id||'');
      if(!id) return json(res,400,{error:'Invalid user'});
      const current=await listUsers(session.access),target=current.find(u=>u.id===id);
      if(!target) return json(res,404,{error:'User not found'});
      const role=id===session.user.id?'admin':(['admin','manager','seller'].includes(body.role)?body.role:target.role);
      const active=id===session.user.id?true:body.active!==false;
      if(target.role==='admin'&&(!active||role!=='admin')&&current.filter(u=>u.active&&u.role==='admin'&&u.id!==id).length===0) return json(res,409,{error:'At least one active admin is required'});
      const update={full_name:String(body.name||target.name).trim()||target.name,email:String(body.email||target.email).trim().toLowerCase()||target.email,role,active,updated_at:new Date().toISOString()};
      const r=await sb(`/rest/v1/profiles?id=eq.${encodeURIComponent(id)}`,{method:'PATCH',token:session.access,body:update,headers:{Prefer:'return=minimal'}});
      if(!r.response.ok) return json(res,500,{error:'Could not update user'});
      return json(res,200,{ok:true});
    }

    if(action==='reset-password') return json(res,501,{error:'Password reset requires Supabase admin service'});
    return json(res,400,{error:'Invalid action'});
  }catch(error){console.error('users error',error);return json(res,500,{error:'User management failed'});}
}
