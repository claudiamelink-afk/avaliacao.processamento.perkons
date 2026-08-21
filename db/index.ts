import { drizzle } from "drizzle-orm/d1";
import * as schema from "./schema";
import { getRuntimeEnv } from "../lib/runtime-env";
export function getDb(){ const db=getRuntimeEnv().DB; if(!db) throw new Error("D1 binding DB unavailable"); return drizzle(db,{schema}); }
