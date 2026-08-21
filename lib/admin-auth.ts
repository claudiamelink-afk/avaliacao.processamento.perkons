import { env } from "cloudflare:workers";

const runtime=()=>env as unknown as {ADMIN_PASSWORD?:string,ADMIN_SESSION_SECRET?:string};

export function adminConfigured(){const values=runtime();return Boolean(values.ADMIN_PASSWORD&&values.ADMIN_SESSION_SECRET)}
export function validAdminPassword(password:string){const expected=runtime().ADMIN_PASSWORD;return Boolean(expected&&password===expected)}
export function adminSessionValue(){return runtime().ADMIN_SESSION_SECRET||""}
export function isAdmin(request:Request){
 const expected=adminSessionValue();
 if(!expected)return false;
 const cookies=request.headers.get("cookie")||"";
 return cookies.split(";").some(part=>{const [key,...value]=part.trim().split("=");return key==="perkons_admin"&&decodeURIComponent(value.join("="))===expected});
}
export function unauthorized(){return Response.json({error:"Acesso administrativo não autorizado"},{status:401})}
