import { clearSessionCookie, getAdminSession, primarySessionValue, setSessionCookie, validPrimaryPassword } from "../../../lib/admin-auth";
import { ensureAdminTables, passwordMatches, passwordRecord, randomToken, tokenHash, type AdminUserRow } from "../../../lib/admin-users";
import { getPool } from "../../../db";

export async function GET(request:Request){
 const session=await getAdminSession(request);
 return Response.json({authenticated:Boolean(session),configured:Boolean(primarySessionValue()),session});
}

export async function POST(request:Request){
 try{
  const {email,password}=await request.json() as {email?:string,password?:string};
  if(!password)return Response.json({error:"Informe a senha."},{status:400});
  if(!email?.trim()){
   if(!(await validPrimaryPassword(password)))return Response.json({error:"E-mail ou senha incorretos."},{status:401});
   const response=Response.json({authenticated:true,session:{id:0,name:"Administrador principal",email:"",isSuperAdmin:true,mustChangePassword:false}});
   setSessionCookie(response,primarySessionValue());
   return response;
  }
  await ensureAdminTables();
  const pool=getPool();
  const user=(await pool.query<AdminUserRow>("SELECT * FROM admin_users WHERE lower(email)=lower($1) LIMIT 1",[email.trim()])).rows[0];
  if(!user||!user.is_active||!(await passwordMatches(password,user)))return Response.json({error:"E-mail ou senha incorretos."},{status:401});
  const token=randomToken(),hash=await tokenHash(token),expires=new Date(Date.now()+8*60*60*1000).toISOString();
  await pool.query("DELETE FROM admin_sessions WHERE expires_at<=CURRENT_TIMESTAMP");
  await pool.query("INSERT INTO admin_sessions (token_hash,user_id,expires_at) VALUES ($1,$2,$3)",[hash,user.id,expires]);
  const session={id:user.id,name:user.name,email:user.email,isSuperAdmin:false,mustChangePassword:Boolean(user.must_change_password)};
  const response=Response.json({authenticated:true,session});
  setSessionCookie(response,"u:"+token);
  return response;
 }catch{return Response.json({error:"Não foi possível realizar o acesso."},{status:400})}
}

export async function PATCH(request:Request){
 try{
  const session=await getAdminSession(request);
  if(!session||session.isSuperAdmin)return Response.json({error:"Sessão inválida."},{status:401});
  const {newPassword}=await request.json() as {newPassword?:string};
  if(!newPassword?.trim())return Response.json({error:"Informe a nova senha."},{status:400});
  if(newPassword==="1234")return Response.json({error:"Escolha uma senha diferente da senha temporária."},{status:400});
  const record=await passwordRecord(newPassword);
  await getPool().query("UPDATE admin_users SET password_hash=$1,password_salt=$2,must_change_password=FALSE,updated_at=CURRENT_TIMESTAMP WHERE id=$3",[record.hash,record.salt,session.id]);
  return Response.json({authenticated:true,session:{...session,mustChangePassword:false}});
 }catch{return Response.json({error:"Não foi possível alterar a senha."},{status:500})}
}

export async function DELETE(request:Request){
 const value=(request.headers.get("cookie")||"").split(";").find(item=>item.trim().startsWith("perkons_admin="));
 if(value){
  const raw=decodeURIComponent(value.trim().slice("perkons_admin=".length));
  if(raw.startsWith("u:")){try{await ensureAdminTables();await getPool().query("DELETE FROM admin_sessions WHERE token_hash=$1",[await tokenHash(raw.slice(2))])}catch{}}
 }
 const response=Response.json({authenticated:false});
 clearSessionCookie(response);
 return response;
}
