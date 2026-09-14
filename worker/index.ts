/** Cloudflare Worker entry point for Avaliação Processamento. */
import handler from "vinext/server/app-router-entry";
import { runWithRuntimeEnv } from "../lib/runtime-env";

const enforcedCsp=[
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
].join("; ");

const reportOnlyCsp=[
 "default-src 'self'",
 "script-src 'self'",
 "style-src 'self'",
 "img-src 'self' data: blob:",
 "font-src 'self' data:",
 "connect-src 'self'",
 "object-src 'none'",
 "frame-ancestors 'none'",
 "base-uri 'self'",
 "form-action 'self'",
 "report-uri /api/csp-report"
].join("; ");

const securityHeaders:Record<string,string>={
 "Strict-Transport-Security":"max-age=31536000",
 "Content-Security-Policy":enforcedCsp,
 "Content-Security-Policy-Report-Only":reportOnlyCsp,
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

  if(url.pathname==="/api/csp-report"&&request.method==="POST"){
   const length=Number(request.headers.get("content-length")||0);
   if(length>65536)return secure(new Response(null,{status:413}));
   const report=(await request.text()).slice(0,65536);
   console.warn("CSP_REPORT",report);
   return secure(new Response(null,{status:204}));
  }

  const contentType=(request.headers.get("content-type")||"").toLowerCase();
  if(contentType.includes("application/xml")||contentType.includes("text/xml")){
   return secure(Response.json({error:"Conteúdo XML não é aceito por esta aplicação."},{status:415}));
  }

  const response=await runWithRuntimeEnv(env,()=>handler.fetch(request,env,ctx));
  return secure(response);
 },
} satisfies ExportedHandler<Env>;

export default worker;
