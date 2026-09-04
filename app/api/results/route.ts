import { count, desc, eq, sql } from "drizzle-orm";
import { getDb } from "../../../db";
import { questionSettings, results } from "../../../db/schema";
import { isAdmin, unauthorized } from "../../../lib/admin-auth";
export async function GET(request:Request){if(!isAdmin(request))return unauthorized();try { return Response.json({results:await getDb().select().from(results).orderBy(desc(results.id)).limit(250)}); } catch { return Response.json({results:[]}); } }
export async function POST(request:Request){
 try {
  const data=await request.json() as typeof results.$inferInsert;
  if(!data.name?.trim()||!data.email?.trim())return Response.json({error:"Nome e e-mail são obrigatórios."},{status:400});
  const db=getDb();
  const [settingRow]=await db.select().from(questionSettings).where(eq(questionSettings.id,1)).limit(1);
  let maxAttempts=2;
  if(settingRow){try{const saved=JSON.parse(settingRow.questions) as {settings?:{maxAttempts?:number}};maxAttempts=Math.max(1,Number(saved.settings?.maxAttempts)||2)}catch{}}
  const normalizedEmail=data.email.trim().toLowerCase();
  const [attemptRow]=await db.select({total:count()}).from(results).where(sql`lower(${results.email}) = ${normalizedEmail}`);
  if((Number(attemptRow?.total)||0)>=maxAttempts)return Response.json({error:`O limite de ${maxAttempts} tentativa(s) para este e-mail foi atingido.`},{status:409});
  const [result]=await db.insert(results).values({...data,email:normalizedEmail}).returning();
  return Response.json({result},{status:201});
 }catch{return Response.json({error:"Não foi possível salvar"},{status:500})}
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
