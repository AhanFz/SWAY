import { Buffer } from 'node:buffer';
import { verifyAttestation, verifyAssertion } from 'node-app-attest';
import { importPKCS8, SignJWT } from 'jose';
import { env, sha256 } from './common.ts';
export function verifyAppleRegistration(body:{attestation:string;challenge:string;keyId:string}) {
  return verifyAttestation({ attestation:Buffer.from(body.attestation,'base64'),challenge:body.challenge,keyId:body.keyId,bundleIdentifier:env('APPLE_BUNDLE_ID'),teamIdentifier:env('APPLE_TEAM_ID'),allowDevelopmentEnvironment:Deno.env.get('APPLE_ATTEST_ENV')==='development' });
}
export function verifyAppleResponse(assertion:string,payload:string,key:{public_key:string;sign_count:number}) {
  return verifyAssertion({ assertion:Buffer.from(assertion,'base64'),payload,publicKey:key.public_key,signCount:key.sign_count,bundleIdentifier:env('APPLE_BUNDLE_ID'),teamIdentifier:env('APPLE_TEAM_ID') });
}
export async function verifyGoogleResponse(token:string,payload:string) {
  const credentials=JSON.parse(env('GOOGLE_SERVICE_ACCOUNT_JSON'));
  const key=await importPKCS8(credentials.private_key,'RS256');
  const assertion=await new SignJWT({scope:'https://www.googleapis.com/auth/playintegrity'}).setProtectedHeader({alg:'RS256'}).setIssuer(credentials.client_email).setAudience('https://oauth2.googleapis.com/token').setIssuedAt().setExpirationTime('5m').sign(key);
  const auth=await fetch('https://oauth2.googleapis.com/token',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({grant_type:'urn:ietf:params:oauth:grant-type:jwt-bearer',assertion}),signal:AbortSignal.timeout(10000)});
  if(!auth.ok)throw new Error('attestation_failed');
  const {access_token}=await auth.json();
  const packageName=env('ANDROID_PACKAGE_NAME');
  const result=await fetch(`https://playintegrity.googleapis.com/v1/${encodeURIComponent(packageName)}:decodeIntegrityToken`,{method:'POST',headers:{Authorization:`Bearer ${access_token}`,'Content-Type':'application/json'},body:JSON.stringify({integrity_token:token}),signal:AbortSignal.timeout(10000)});
  if(!result.ok)throw new Error('attestation_failed');
  const {tokenPayloadExternal:v}=await result.json();
  const expected=await sha256(payload);
  const timestamp=Number(v?.requestDetails?.timestampMillis);
  const certs=env('ANDROID_CERTIFICATE_SHA256').split(',');
  if(v?.requestDetails?.requestHash!==expected || v?.requestDetails?.requestPackageName!==packageName || !Number.isFinite(timestamp) || Math.abs(Date.now()-timestamp)>120000 || v?.appIntegrity?.appRecognitionVerdict!=='PLAY_RECOGNIZED' || v?.appIntegrity?.packageName!==packageName || !v?.appIntegrity?.certificateSha256Digest?.some((s:string)=>certs.includes(s)) || !v?.deviceIntegrity?.deviceRecognitionVerdict?.includes('MEETS_DEVICE_INTEGRITY') || v?.accountDetails?.appLicensingVerdict!=='LICENSED') throw new Error('attestation_failed');
}
