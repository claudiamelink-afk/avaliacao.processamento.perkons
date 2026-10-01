import { AsyncLocalStorage } from "node:async_hooks";

export type RuntimeEnv={
 ADMIN_PASSWORD?:string;
 ADMIN_SESSION_SECRET?:string;
 [key:string]:unknown;
};

const runtimeEnv=new AsyncLocalStorage<RuntimeEnv>();

export function runWithRuntimeEnv<T>(env:RuntimeEnv,callback:()=>T):T{return runtimeEnv.run(env,callback)}

export function getRuntimeEnv():RuntimeEnv{
 return runtimeEnv.getStore()||{
  ADMIN_PASSWORD:process.env.ADMIN_PASSWORD,
  ADMIN_SESSION_SECRET:process.env.ADMIN_SESSION_SECRET
 };
}
