import { createClient } from '@supabase/supabase-js';
export function env(name: string) { const value=Deno.env.get(name); if (!value) throw new Error('server_not_configured'); return value; }
export function database() { return createClient(env('SUPABASE_URL'),env('SUPABASE_SERVICE_ROLE_KEY'),{ auth: { persistSession:false,autoRefreshToken:false } }); }
export function json(body: unknown,status=200) { return new Response(JSON.stringify(body),{ status,headers:{'Content-Type':'application/json','Cache-Control':'no-store'} }); }
export async function readBody(req: Request) {
  if(Number(req.headers.get('content-length')||0)>40000) throw new Error('invalid_request');
  const reader=req.body?.getReader(); if(!reader) throw new Error('invalid_request');
  const chunks:Uint8Array[]=[];let size=0;
  while(true){const next=await reader.read();if(next.done)break;size+=next.value.byteLength;if(size>40000){await reader.cancel();throw new Error('invalid_request');}chunks.push(next.value);}
  const bytes=new Uint8Array(size);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.length;}
  return JSON.parse(new TextDecoder().decode(bytes));
}
export async function sha256(value:string) {return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value))),b=>b.toString(16).padStart(2,'0')).join('');}
export function check(result:{error:unknown}) { if(result.error) throw result.error; }
