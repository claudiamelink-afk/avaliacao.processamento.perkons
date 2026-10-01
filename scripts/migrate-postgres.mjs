import { readFile } from "node:fs/promises";
import pg from "pg";

const connectionString=process.env.DATABASE_URL;
if(!connectionString)throw new Error("DATABASE_URL não configurada");

const sql=await readFile(new URL("../db/postgres/001_init.sql",import.meta.url),"utf8");
const client=new pg.Client({
 connectionString,
 ssl:process.env.DB_SSL==="true"?{rejectUnauthorized:process.env.DB_SSL_REJECT_UNAUTHORIZED!=="false"}:undefined
});

await client.connect();
try{
 await client.query(sql);
 console.log("Migração PostgreSQL concluída.");
}finally{
 await client.end();
}
