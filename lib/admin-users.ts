import { timingSafeEqual } from "node:crypto";
import { ensureDatabase } from "../db/bootstrap";

export type AdminUserRow={
 id:number;
 name:string;
 email:string;
 password_hash:string;
 password_salt:string;
 must_change_password:boolean;
 is_active:boolean;
 created_at:string;
 updated_at:string;
};

const encoder=new TextEncoder();
const hex=(bytes:Uint8Array)=>Array.from(bytes,value=>value.toString(16).padStart(2,"0")).join("");
const fromHex=(value:string)=>new Uint8Array(value.match(/.{1,2}/g)?.map(byte=>parseInt(byte,16))||[]);

export async function ensureAdminTables(){await ensureDatabase()}

export async function passwordRecord(password:string,saltValue?:string){
 const salt=saltValue?fromHex(saltValue):crypto.getRandomValues(new Uint8Array(16));
 const material=await crypto.subtle.importKey("raw",encoder.encode(password),"PBKDF2",false,["deriveBits"]);
 const bits=await crypto.subtle.deriveBits({name:"PBKDF2",hash:"SHA-256",salt,iterations:100000},material,256);
 return{hash:hex(new Uint8Array(bits)),salt:hex(salt)};
}

export async function passwordMatches(password:string,user:AdminUserRow){
 const calculated=await passwordRecord(password,user.password_salt);
 const supplied=fromHex(calculated.hash),expected=fromHex(user.password_hash);
 return supplied.length===expected.length&&timingSafeEqual(Buffer.from(supplied),Buffer.from(expected));
}

export async function tokenHash(token:string){
 return hex(new Uint8Array(await crypto.subtle.digest("SHA-256",encoder.encode(token))));
}

export function randomToken(){return hex(crypto.getRandomValues(new Uint8Array(32)))}
