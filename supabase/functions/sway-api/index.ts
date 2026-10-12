import { database, check, json, readBody } from '../_shared/common.ts';
import { verifyAppleRegistration, verifyAppleResponse, verifyGoogleResponse } from '../_shared/integrity.ts';
const hashPattern=/^[a-f0-9]{64}$/;
const uuidPattern=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
Deno.serve(async req=>{
  if(req.method!=='POST')return json({error:'Method not allowed'},405);
  try {
    const body=await readBody(req),db=database();
    if(body.action==='feed'){
      let query=db.from('stories').select('id,headline,summary,topic,published_at,story_sources(outlet_name,article_url)').order('published_at',{ascending:false}).order('id',{ascending:false}).limit(30);
      if(body.cursor){const c=JSON.parse(atob(body.cursor));if(!uuidPattern.test(c.id)||!Number.isFinite(Date.parse(c.time)))throw new Error('invalid_request');const time=new Date(c.time).toISOString();query=query.or(`published_at.lt.${time},and(published_at.eq.${time},id.lt.${c.id})`);}
      const result=await query;check(result);const rows=result.data||[];const last=rows.at(-1);
      return json({stories:rows.map(s=>({id:s.id,headline:s.headline,summary:s.summary,topic:s.topic,publishedAt:s.published_at,sources:s.story_sources.map(source=>({name:source.outlet_name,url:source.article_url})),totals:{good:0,bad:0,skip:0}})),cursor:rows.length===30&&last?btoa(JSON.stringify({time:last.published_at,id:last.id})):null});
    }
    if(body.action==='results'){
      if(!uuidPattern.test(body.storyId))throw new Error('invalid_request');
      const result=await db.from('story_totals').select('good_count,bad_count,skip_count').eq('story_id',body.storyId).maybeSingle();check(result);const t=result.data;
      return json({totals:t&&t.good_count+t.bad_count+t.skip_count>=20?{good:t.good_count,bad:t.bad_count,skip:t.skip_count}:null});
    }
    if(body.action==='challenge'){
      if(!hashPattern.test(body.deviceHash))throw new Error('invalid_request');
      const challenge=crypto.randomUUID()+crypto.randomUUID();
      check(await db.rpc('new_challenge',{p_device_hash:body.deviceHash,p_challenge:challenge}));return json({challenge});
    }
    if(body.action==='register'){
      if(!hashPattern.test(body.deviceHash)||typeof body.attestation!=='string'||typeof body.keyId!=='string'||typeof body.challenge!=='string')throw new Error('invalid_request');
      const challenge=await db.from('attest_challenges').select('challenge').eq('challenge',body.challenge).eq('device_hash',body.deviceHash).gt('expires_at',new Date().toISOString()).maybeSingle();check(challenge);if(!challenge.data)throw new Error('invalid_challenge');
      const verified=verifyAppleRegistration(body);
      check(await db.rpc('register_attestation',{p_device_hash:body.deviceHash,p_challenge:body.challenge,p_key_id:body.keyId,p_public_key:verified.publicKey}));return json({registered:true});
    }
    if(body.action==='respond'){
      if(typeof body.payload!=='string'||body.payload.length>2048)throw new Error('invalid_request');
      const vote=JSON.parse(body.payload);
      if(!uuidPattern.test(vote.storyId)||!hashPattern.test(vote.deviceHash)||!['good','bad','skip'].includes(vote.value)||typeof vote.challenge!=='string')throw new Error('invalid_request');
      let keyId:string|null=null,signCount:number|null=null;
      if(body.proof?.platform==='ios'){
        const key=await db.from('attest_keys').select('public_key,sign_count').eq('key_id',body.proof.keyId).eq('device_hash',vote.deviceHash).single();check(key);if(!key.data)throw new Error('attestation_failed');
        signCount=verifyAppleResponse(body.proof.assertion,body.payload,key.data).signCount;keyId=body.proof.keyId;
      } else if(body.proof?.platform==='android') await verifyGoogleResponse(body.proof.token,body.payload);
      else throw new Error('attestation_failed');
      const result=await db.rpc('record_response',{p_story_id:vote.storyId,p_device_hash:vote.deviceHash,p_value:vote.value,p_challenge:vote.challenge,p_key_id:keyId,p_sign_count:signCount});check(result);return json(result.data);
    }
    return json({error:'Unknown action'},400);
  }catch(error){
    // Do not log request bodies, identifiers, attestation evidence, or IP addresses.
    const message=error instanceof Error?error.message:String((error as {message?:string})?.message||'');
    if(message.includes('rate_limited'))return json({error:'Too many responses. Please wait a minute.'},429);
    if(message.includes('response_final'))return json({error:'Your response to this story is already final.'},409);
    if(message.includes('server_not_configured'))return json({error:'Live voting is not configured yet.'},503);
    return json({error:'Could not verify this request. Please retry from the signed Sway app.'},400);
  }
});
