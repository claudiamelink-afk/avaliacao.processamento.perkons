import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

const globalDb=globalThis as typeof globalThis&{__perkonsPool?:Pool};

export function getPool(){
 if(globalDb.__perkonsPool)return globalDb.__perkonsPool;
 const connectionString=process.env.DATABASE_URL;
 if(!connectionString)throw new Error("DATABASE_URL não configurada");
 globalDb.__perkonsPool=new Pool({
  connectionString,
  max:Number(process.env.DB_POOL_MAX||10),
  ssl:process.env.DB_SSL==="true"?{rejectUnauthorized:process.env.DB_SSL_REJECT_UNAUTHORIZED!=="false"}:undefined
 });
 return globalDb.__perkonsPool;
}

export function getDb(){return drizzle(getPool(),{schema})}
