import { getRuntimeEnv } from "./runtime-env";

const runtime=()=>getRuntimeEnv();

export function adminConfigured(){const values=runtime();return Boolean(values.ADMIN_PASSWORD&&values.ADMIN_SESSION_SECRET)}
export async function validAdminPassword(password:string){
 const expected=runtime().ADMIN_PASSWORD;
 if(!expected)return false;
 const encoder=new TextEncoder();
 const [providedHash,expectedHash]=await Promise.all([
  crypto.subtle.digest("SHA-256",encoder.encode(password)),
  crypto.subtle.digest("SHA-256",encoder.encode(expected)),
 ]);
 return crypto.subtle.timingSafeEqual(providedHash,expectedHash);
}
export function adminSessionValue(){return runtime().ADMIN_SESSION_SECRET||""}
export function isAdmin(request:Request){
 const expected=adminSessionValue();
 if(!expected)return false;
 const cookies=request.headers.get("cookie")||"";
 return cookies.split(";").some(part=>{const [key,...value]=part.trim().split("=");return key==="perkons_admin"&&decodeURIComponent(value.join("="))===expected});
}
export function unauthorized(){return Response.json({error:"Acesso administrativo não autorizado"},{status:401})}
