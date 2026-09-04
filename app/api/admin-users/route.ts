import { isPrimaryAdmin, unauthorized } from "../../../lib/admin-auth";
import { ensureAdminTables, passwordRecord } from "../../../lib/admin-users";
import { getRuntimeEnv } from "../../../lib/runtime-env";

const list=async()=>getRuntimeEnv().DB.prepare("SELECT id,name,email,must_change_password AS mustChangePassword,is_active AS isActive,created_at AS createdAt,updated_at AS updatedAt FROM admin_users ORDER BY name").all();

export async function GET(request:Request){
 if(!(await isPrimaryAdmin(request)))return unauthorized();
 await ensureAdminTables();
 return Response.json({users:(await list()).results});
}

export async function POST(request:Request){
 try{
  if(!(await isPrimaryAdmin(request)))return unauthorized();
  const {name,email}=await request.json() as {name?:string,email?:string};
  if(!name?.trim()||!email?.trim())return Response.json({error:"Nome e e-mail são obrigatórios."},{status:400});
  await ensureAdminTables();
  const temporary=await passwordRecord("1234");
  await getRuntimeEnv().DB.prepare("INSERT INTO admin_users (name,email,password_hash,password_salt,must_change_password,is_active) VALUES (?,?,?,?,1,1)").bind(name.trim(),email.trim().toLowerCase(),temporary.hash,temporary.salt).run();
  return Response.json({users:(await list()).results},{status:201});
 }catch(error){
  const message=String(error);
  return Response.json({error:message.includes("UNIQUE")?"Já existe um administrador com este e-mail.":"Não foi possível criar o administrador."},{status:400});
 }
}

export async function PATCH(request:Request){
 try{
  if(!(await isPrimaryAdmin(request)))return unauthorized();
  const {id,action,name,email}=await request.json() as {id?:number,action?:"reset"|"toggle"|"edit",name?:string,email?:string};
  if(!id)return Response.json({error:"Administrador inválido."},{status:400});
  await ensureAdminTables();
  if(action==="reset"){
   const temporary=await passwordRecord("1234");
   await getRuntimeEnv().DB.prepare("UPDATE admin_users SET password_hash=?,password_salt=?,must_change_password=1,is_active=1,updated_at=CURRENT_TIMESTAMP WHERE id=?").bind(temporary.hash,temporary.salt,id).run();
   await getRuntimeEnv().DB.prepare("DELETE FROM admin_sessions WHERE user_id=?").bind(id).run();
  }else if(action==="toggle"){
   await getRuntimeEnv().DB.prepare("UPDATE admin_users SET is_active=CASE is_active WHEN 1 THEN 0 ELSE 1 END,updated_at=CURRENT_TIMESTAMP WHERE id=?").bind(id).run();
   await getRuntimeEnv().DB.prepare("DELETE FROM admin_sessions WHERE user_id=?").bind(id).run();
  }else if(action==="edit"){
   if(!name?.trim()||!email?.trim())return Response.json({error:"Nome e e-mail são obrigatórios."},{status:400});
   await getRuntimeEnv().DB.prepare("UPDATE admin_users SET name=?,email=?,updated_at=CURRENT_TIMESTAMP WHERE id=?").bind(name.trim(),email.trim().toLowerCase(),id).run();
  }else return Response.json({error:"Ação inválida."},{status:400});
  return Response.json({users:(await list()).results});
 }catch(error){
  return Response.json({error:String(error).includes("UNIQUE")?"Já existe um administrador com este e-mail.":"Não foi possível atualizar o administrador."},{status:400});
 }
}

export async function DELETE(request:Request){
 try{
  if(!(await isPrimaryAdmin(request)))return unauthorized();
  const {id}=await request.json() as {id?:number};
  if(!id)return Response.json({error:"Administrador inválido."},{status:400});
  await ensureAdminTables();
  await getRuntimeEnv().DB.prepare("DELETE FROM admin_sessions WHERE user_id=?").bind(id).run();
  await getRuntimeEnv().DB.prepare("DELETE FROM admin_users WHERE id=?").bind(id).run();
  return Response.json({users:(await list()).results});
 }catch{return Response.json({error:"Não foi possível excluir o administrador."},{status:500})}
}
