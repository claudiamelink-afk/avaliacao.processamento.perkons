import { timingSafeEqual } from "node:crypto";
import { getPool } from "../db";
import { getRuntimeEnv } from "./runtime-env";
import { ensureAdminTables, tokenHash, type AdminUserRow } from "./admin-users";

const runtime=()=>getRuntimeEnv();
const COOKIE="perkons_admin";

export type AdminSession={
 id:number;
 name:string;
 email:string;
 isSuperAdmin:boolean;
 mustChangePassword:boolean;
};

function cookieValue(request:Request){
 const cookies=request.headers.get("cookie")||"";
 const part=cookies.split(";").find(item=>item.trim().startsWith(COOKIE+"="));
 return part?decodeURIComponent(part.trim().slice(COOKIE.length+1)):"";
}

export function adminConfigured(){
 const values=runtime();
 return Boolean(values.ADMIN_PASSWORD&&values.ADMIN_SESSION_SECRET);
}

export async function validPrimaryPassword(password:string){
 const expected=runtime().ADMIN_PASSWORD;
 if(!expected)return false;
 const encoder=new TextEncoder();
 const [providedHash,expectedHash]=await Promise.all([
  crypto.subtle.digest("SHA-256",encoder.encode(password)),
  crypto.subtle.digest("SHA-256",encoder.encode(expected)),
 ]);
 return timingSafeEqual(Buffer.from(providedHash),Buffer.from(expectedHash));
}

export function primarySessionValue(){return runtime().ADMIN_SESSION_SECRET||""}

export async function getAdminSession(request:Request):Promise<AdminSession|null>{
 const value=cookieValue(request);
 if(!value)return null;
 const primary=primarySessionValue();
 if(primary&&value===primary)return{id:0,name:"Administrador principal",email:"",isSuperAdmin:true,mustChangePassword:false};
 if(!value.startsWith("u:"))return null;
 await ensureAdminTables();
 const hash=await tokenHash(value.slice(2));
 const {rows}=await getPool().query<{id:number,name:string,email:string,must_change_password:boolean,is_active:boolean}>(`
  SELECT u.id,u.name,u.email,u.must_change_password,u.is_active
  FROM admin_sessions s JOIN admin_users u ON u.id=s.user_id
  WHERE s.token_hash=$1 AND s.expires_at>CURRENT_TIMESTAMP LIMIT 1
 `,[hash]);
 const row=rows[0];
 if(!row||!row.is_active)return null;
 return{id:row.id,name:row.name,email:row.email,isSuperAdmin:false,mustChangePassword:Boolean(row.must_change_password)};
}

export async function isAdmin(request:Request){
 const session=await getAdminSession(request);
 return Boolean(session&&!session.mustChangePassword);
}

export async function isPrimaryAdmin(request:Request){
 return Boolean((await getAdminSession(request))?.isSuperAdmin);
}

export function setSessionCookie(response:Response,value:string){
 const secure=process.env.COOKIE_SECURE==="false"?"":"; Secure";
 response.headers.set("Set-Cookie",`${COOKIE}=${encodeURIComponent(value)}; HttpOnly${secure}; SameSite=Strict; Path=/; Max-Age=28800`);
}

export function clearSessionCookie(response:Response){
 const secure=process.env.COOKIE_SECURE==="false"?"":"; Secure";
 response.headers.set("Set-Cookie",`${COOKIE}=; HttpOnly${secure}; SameSite=Strict; Path=/; Max-Age=0`);
}

export function unauthorized(){return Response.json({error:"Acesso administrativo não autorizado"},{status:401})}
export type {AdminUserRow};
