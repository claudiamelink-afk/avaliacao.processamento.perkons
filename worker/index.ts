/** Cloudflare Worker entry point for Avaliação Processamento. */
import handler from "vinext/server/app-router-entry";
import { runWithRuntimeEnv } from "../lib/runtime-env";

const worker = {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    return runWithRuntimeEnv(env, () => handler.fetch(request, env, ctx));
  },
} satisfies ExportedHandler<Env>;

export default worker;
