import { isPrimaryAdmin, unauthorized } from "../../../lib/admin-auth";
import { ensureAdminTables, passwordRecord } from "../../../lib/admin-users";
import { getPool } from "../../../db";

const list=async()=>(await getPool().query("SELECT id,name,email,must_change_password AS \"mustChangePassword\",is_active AS \"isActive\",created_at AS \"createdAt\",updated_at AS \"updatedAt\" FROM admin_users ORDER BY name")).rows;

export async function GET(request:Request){
 if(!(await isPrimaryAdmin(request)))return unauthorized();
 await ensureAdminTables();
 return Response.json({users:await list()});
}

export async function POST(request:Request){
 try{
  if(!(await isPrimaryAdmin(request)))return unauthorized();
  const {name,email}=await request.json() as {name?:string,email?:string};
  if(!name?.trim()||!email?.trim())return Response.json({error:"Nome e e-mail são obrigatórios."},{status:400});
  await ensureAdminTables();
  const temporary=await passwordRecord("1234");
  await getPool().query("INSERT INTO admin_users (name,email,password_hash,password_salt,must_change_password,is_active) VALUES ($1,$2,$3,$4,TRUE,TRUE)",[name.trim(),email.trim().toLowerCase(),temporary.hash,temporary.salt]);
  return Response.json({users:await list()},{status:201});
 }catch(error){
  const message=String(error);
  return Response.json({error:message.includes("unique")||message.includes("duplicate")?"Já existe um administrador com este e-mail.":"Não foi possível criar o administrador."},{status:400});
 }
}

export async function PATCH(request:Request){
 try{
  if(!(await isPrimaryAdmin(request)))return unauthorized();
  const {id,action,name,email}=await request.json() as {id?:number,action?:"reset"|"toggle"|"edit",name?:string,email?:string};
  if(!id)return Response.json({error:"Administrador inválido."},{status:400});
  await ensureAdminTables();
  const pool=getPool();
  if(action==="reset"){
   const temporary=await passwordRecord("1234");
   await pool.query("UPDATE admin_users SET password_hash=$1,password_salt=$2,must_change_password=TRUE,is_active=TRUE,updated_at=CURRENT_TIMESTAMP WHERE id=$3",[temporary.hash,temporary.salt,id]);
   await pool.query("DELETE FROM admin_sessions WHERE user_id=$1",[id]);
  }else if(action==="toggle"){
   await pool.query("UPDATE admin_users SET is_active=NOT is_active,updated_at=CURRENT_TIMESTAMP WHERE id=$1",[id]);
   await pool.query("DELETE FROM admin_sessions WHERE user_id=$1",[id]);
  }else if(action==="edit"){
   if(!name?.trim()||!email?.trim())return Response.json({error:"Nome e e-mail são obrigatórios."},{status:400});
   await pool.query("UPDATE admin_users SET name=$1,email=$2,updated_at=CURRENT_TIMESTAMP WHERE id=$3",[name.trim(),email.trim().toLowerCase(),id]);
  }else return Response.json({error:"Ação inválida."},{status:400});
  return Response.json({users:await list()});
 }catch(error){
  const message=String(error);
  return Response.json({error:message.includes("unique")||message.includes("duplicate")?"Já existe um administrador com este e-mail.":"Não foi possível atualizar o administrador."},{status:400});
 }
}

export async function DELETE(request:Request){
 try{
  if(!(await isPrimaryAdmin(request)))return unauthorized();
  const {id}=await request.json() as {id?:number};
  if(!id)return Response.json({error:"Administrador inválido."},{status:400});
  await ensureAdminTables();
  await getPool().query("DELETE FROM admin_users WHERE id=$1",[id]);
  return Response.json({users:await list()});
 }catch{return Response.json({error:"Não foi possível excluir o administrador."},{status:500})}
}
