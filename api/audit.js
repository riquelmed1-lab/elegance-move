import { sb, sessionUser } from './_supabase.js';

const json=(res,status,body)=>res.status(status).json(body);
const clamp=(value,min,max)=>Math.max(min,Math.min(max,Number(value)||min));

export default async function handler(req,res){
  res.setHeader('Cache-Control','no-store');
  try{
    const session=await sessionUser(req,res);
    if(!session) return json(res,401,{error:'Unauthorized'});
    if(session.user.role!=='admin') return json(res,403,{error:'Forbidden'});
    if(req.method!=='GET') return json(res,405,{error:'Method Not Allowed'});

    const limit=clamp(req.query?.limit,1,100);
    const [logsResponse,profilesResponse,normalizationResponse]=await Promise.all([
      sb(`/rest/v1/audit_logs?select=id,actor_id,action,entity,entity_id,payload,created_at&order=created_at.desc&limit=${limit}`,{token:session.access}),
      sb('/rest/v1/profiles?select=id,full_name,email&order=full_name.asc',{token:session.access}),
      sb('/rest/v1/normalization_health?select=revision,ok,last_error,parity,synced_at&id=eq.1&limit=1',{token:session.access})
    ]);
    if(!logsResponse.response.ok) throw new Error('AUDIT_READ_FAILED');

    const profiles=Array.isArray(profilesResponse.data)?profilesResponse.data:[];
    const people=new Map(profiles.map(profile=>[profile.id,{name:profile.full_name||profile.email||'Usuário',email:profile.email||''}]));
    const logs=(Array.isArray(logsResponse.data)?logsResponse.data:[]).map(row=>({
      id:row.id,
      action:row.action,
      entity:row.entity,
      entityId:row.entity_id||null,
      payload:row.payload||{},
      createdAt:row.created_at,
      actorId:row.actor_id||null,
      actor:row.actor_id?(people.get(row.actor_id)||{name:'Usuário',email:''}):{name:'Sistema',email:''}
    }));

    const normalizationRow=normalizationResponse.response.ok&&Array.isArray(normalizationResponse.data)?normalizationResponse.data[0]:null;
    const normalization=normalizationRow?{
      revision:Number(normalizationRow.revision||0),
      ok:normalizationRow.ok===true,
      lastError:normalizationRow.last_error||null,
      parity:normalizationRow.parity||{},
      syncedAt:normalizationRow.synced_at||null
    }:null;

    return json(res,200,{logs,normalization});
  }catch(error){
    console.error('audit error',error);
    return json(res,500,{error:'Audit service failed'});
  }
}
