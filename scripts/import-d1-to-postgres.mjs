import { readFile } from "node:fs/promises";
import pg from "pg";

const args=Object.fromEntries(process.argv.slice(2).map((value,index,array)=>value.startsWith("--")?[value.slice(2),array[index+1]]:null).filter(Boolean));
if(!args.results)throw new Error("Use --results arquivo.json e, opcionalmente, --settings e --admins");
if(!process.env.DATABASE_URL)throw new Error("DATABASE_URL não configurada");

const rows=async path=>{
 if(!path)return[];
 const parsed=JSON.parse(await readFile(path,"utf8"));
 if(Array.isArray(parsed)&&parsed[0]?.results)return parsed[0].results;
 if(Array.isArray(parsed))return parsed;
 if(Array.isArray(parsed.results))return parsed.results;
 throw new Error(`Formato não reconhecido em ${path}`);
};

const results=await rows(args.results);
const settings=await rows(args.settings);
const admins=await rows(args.admins);
const client=new pg.Client({connectionString:process.env.DATABASE_URL,ssl:process.env.DB_SSL==="true"?{rejectUnauthorized:process.env.DB_SSL_REJECT_UNAUTHORIZED!=="false"}:undefined});
await client.connect();
try{
 await client.query("BEGIN");
 for(const item of results){
  await client.query(`INSERT INTO results (id,name,email,wpm,accuracy,infractions,plates,windows,overall,status,practical_answers,response_details,created_at)
   VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
   ON CONFLICT (id) DO UPDATE SET name=EXCLUDED.name,email=EXCLUDED.email,wpm=EXCLUDED.wpm,accuracy=EXCLUDED.accuracy,infractions=EXCLUDED.infractions,plates=EXCLUDED.plates,windows=EXCLUDED.windows,overall=EXCLUDED.overall,status=EXCLUDED.status,practical_answers=EXCLUDED.practical_answers,response_details=EXCLUDED.response_details,created_at=EXCLUDED.created_at`,
   [item.id,item.name,item.email,item.wpm,item.accuracy,item.infractions,item.plates,item.windows,item.overall,item.status,item.practical_answers??item.practicalAnswers??"[]",item.response_details??item.responseDetails??"{}",item.created_at??item.createdAt??new Date().toISOString()]);
 }
 for(const item of settings){
  await client.query(`INSERT INTO question_settings (id,questions,updated_at) VALUES ($1,$2,$3)
   ON CONFLICT (id) DO UPDATE SET questions=EXCLUDED.questions,updated_at=EXCLUDED.updated_at`,
   [item.id,item.questions,item.updated_at??item.updatedAt??new Date().toISOString()]);
 }
 for(const item of admins){
  await client.query(`INSERT INTO admin_users (id,name,email,password_hash,password_salt,must_change_password,is_active,created_at,updated_at)
   VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
   ON CONFLICT (id) DO UPDATE SET name=EXCLUDED.name,email=EXCLUDED.email,password_hash=EXCLUDED.password_hash,password_salt=EXCLUDED.password_salt,must_change_password=EXCLUDED.must_change_password,is_active=EXCLUDED.is_active,updated_at=EXCLUDED.updated_at`,
   [item.id,item.name,item.email,item.password_hash??item.passwordHash,item.password_salt??item.passwordSalt,Boolean(item.must_change_password??item.mustChangePassword),Boolean(item.is_active??item.isActive),item.created_at??item.createdAt??new Date().toISOString(),item.updated_at??item.updatedAt??new Date().toISOString()]);
 }
 await client.query("SELECT setval(pg_get_serial_sequence('results','id'),COALESCE((SELECT MAX(id) FROM results),1),true)");
 await client.query("SELECT setval(pg_get_serial_sequence('admin_users','id'),COALESCE((SELECT MAX(id) FROM admin_users),1),true)");
 await client.query("COMMIT");
 console.log(`Importação concluída: ${results.length} resultados, ${settings.length} configurações e ${admins.length} administradores.`);
}catch(error){
 await client.query("ROLLBACK");
 throw error;
}finally{
 await client.end();
}
