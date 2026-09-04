import { getRuntimeEnv } from "./runtime-env";

export type AdminUserRow = {
 id: number;
 name: string;
 email: string;
 password_hash: string;
 password_salt: string;
 must_change_password: number;
 is_active: number;
 created_at: string;
 updated_at: string;
};

const encoder=new TextEncoder();
const hex=(bytes:Uint8Array)=>Array.from(bytes,value=>value.toString(16).padStart(2,"0")).join("");
const fromHex=(value:string)=>new Uint8Array(value.match(/.{1,2}/g)?.map(byte=>parseInt(byte,16))||[]);

export async function ensureAdminTables(){
 const db=getRuntimeEnv().DB;
 await db.exec(`
 CREATE TABLE IF NOT EXISTS admin_users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT NOT NULL COLLATE NOCASE UNIQUE,
  password_hash TEXT NOT NULL,
  password_salt TEXT NOT NULL,
  must_change_password INTEGER NOT NULL DEFAULT 1,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
 );
 CREATE TABLE IF NOT EXISTS admin_sessions (
  token_hash TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES admin_users(id) ON DELETE CASCADE
 );
 CREATE INDEX IF NOT EXISTS admin_sessions_user_id_idx ON admin_sessions(user_id);
 `);
}

export async function passwordRecord(password:string,saltValue?:string){
 const salt=saltValue?fromHex(saltValue):crypto.getRandomValues(new Uint8Array(16));
 const material=await crypto.subtle.importKey("raw",encoder.encode(password),"PBKDF2",false,["deriveBits"]);
 const bits=await crypto.subtle.deriveBits({name:"PBKDF2",hash:"SHA-256",salt,iterations:120000},material,256);
 return {hash:hex(new Uint8Array(bits)),salt:hex(salt)};
}

export async function passwordMatches(password:string,user:AdminUserRow){
 const calculated=await passwordRecord(password,user.password_salt);
 const supplied=fromHex(calculated.hash),expected=fromHex(user.password_hash);
 return supplied.length===expected.length&&crypto.subtle.timingSafeEqual(supplied,expected);
}

export async function tokenHash(token:string){
 return hex(new Uint8Array(await crypto.subtle.digest("SHA-256",encoder.encode(token))));
}

export function randomToken(){
 return hex(crypto.getRandomValues(new Uint8Array(32)));
}
