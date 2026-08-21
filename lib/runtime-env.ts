import { AsyncLocalStorage } from "node:async_hooks";

export type RuntimeEnv = Env & {
  ADMIN_PASSWORD?: string;
  ADMIN_SESSION_SECRET?: string;
};

const runtimeEnv = new AsyncLocalStorage<RuntimeEnv>();

export function runWithRuntimeEnv<T>(env: RuntimeEnv, callback: () => T): T {
  return runtimeEnv.run(env, callback);
}

export function getRuntimeEnv(): RuntimeEnv {
  const env = runtimeEnv.getStore();
  if (!env) throw new Error("Cloudflare runtime environment unavailable");
  return env;
}
