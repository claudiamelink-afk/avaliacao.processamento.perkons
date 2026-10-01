import { ensureDatabase } from "../../../db/bootstrap";
import { getPool } from "../../../db";

export async function GET(){
 try{
  await ensureDatabase();
  await getPool().query("SELECT 1");
  return Response.json({status:"ok",database:"connected"});
 }catch{
  return Response.json({status:"error",database:"unavailable"},{status:503});
 }
}
