import { desc, eq } from "drizzle-orm";
import { getDb } from "../../../db";
import { results } from "../../../db/schema";
import { isAdmin, unauthorized } from "../../../lib/admin-auth";
export async function GET(request:Request){if(!isAdmin(request))return unauthorized();try { return Response.json({results:await getDb().select().from(results).orderBy(desc(results.id)).limit(250)}); } catch { return Response.json({results:[]}); } }
export async function POST(request:Request){
 try { const data=await request.json() as typeof results.$inferInsert; if(!data.name?.trim()||!data.email?.trim()) return Response.json({error:"Dados obrigatórios"},{status:400}); const [result]=await getDb().insert(results).values(data).returning(); return Response.json({result},{status:201}); }
 catch { return Response.json({error:"Não foi possível salvar"},{status:500}); }
}
export async function PATCH(request:Request){
 try{
  if(!isAdmin(request))return unauthorized();
  const data=await request.json() as {id?:number,email?:string,status?:string};
  const allowed=["Reprovado","Aprovado","Em análise","Banco"];
  if(!data.status||!allowed.includes(data.status)||(!data.id&&!data.email))return Response.json({error:"Status inválido"},{status:400});
  const condition=data.id?eq(results.id,data.id):eq(results.email,data.email!);
  const [result]=await getDb().update(results).set({status:data.status}).where(condition).returning();
  return Response.json({result:result||null});
 }catch{return Response.json({error:"Não foi possível atualizar o status"},{status:500});}
}
export async function DELETE(request:Request){
 try{
  if(!isAdmin(request))return unauthorized();
  const data=await request.json() as {id?:number};
  if(!data.id)return Response.json({error:"Candidato inválido"},{status:400});
  const [deleted]=await getDb().delete(results).where(eq(results.id,data.id)).returning({id:results.id});
  if(!deleted)return Response.json({error:"Candidato não encontrado"},{status:404});
  return Response.json({deleted:true});
 }catch{return Response.json({error:"Não foi possível excluir o candidato"},{status:500});}
}
