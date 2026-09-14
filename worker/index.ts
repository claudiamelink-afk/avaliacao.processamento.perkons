/** Cloudflare Worker entry point for Avaliação Processamento. */
import handler from "vinext/server/app-router-entry";
import { runWithRuntimeEnv } from "../lib/runtime-env";

const securityHeaders:Record<string,string>={
 "Strict-Transport-Security":"max-age=31536000",
 "Content-Security-Policy":[
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  "connect-src 'self'",
  "object-src 'none'",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "upgrade-insecure-requests"
 ].join("; "),
 "X-Frame-Options":"DENY",
 "X-Content-Type-Options":"nosniff",
 "Referrer-Policy":"strict-origin-when-cross-origin",
 "Permissions-Policy":"camera=(), microphone=(), geolocation=()"
};

function secure(response:Response){
 const headers=new Headers(response.headers);
 Object.entries(securityHeaders).forEach(([name,value])=>headers.set(name,value));
 return new Response(response.body,{status:response.status,statusText:response.statusText,headers});
}

const worker = {
 async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
  const url=new URL(request.url);
  if(url.protocol==="http:"){
   url.protocol="https:";
   return secure(Response.redirect(url.toString(),301));
  }
  const response=await runWithRuntimeEnv(env,()=>handler.fetch(request,env,ctx));
  return secure(response);
 },
} satisfies ExportedHandler<Env>;

export default worker;
