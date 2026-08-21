import { adminConfigured, adminSessionValue, isAdmin, validAdminPassword } from "../../../lib/admin-auth";

export async function GET(request:Request){return Response.json({authenticated:isAdmin(request),configured:adminConfigured()})}
export async function POST(request:Request){
 try{
  const {password}=await request.json() as {password?:string};
  if(!password||!validAdminPassword(password))return Response.json({error:"Senha incorreta"},{status:401});
  const response=Response.json({authenticated:true});
  response.headers.set("Set-Cookie",`perkons_admin=${encodeURIComponent(adminSessionValue())}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=28800`);
  return response;
 }catch{return Response.json({error:"Não foi possível realizar o acesso"},{status:400})}
}
export async function DELETE(){const response=Response.json({authenticated:false});response.headers.set("Set-Cookie","perkons_admin=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0");return response}
