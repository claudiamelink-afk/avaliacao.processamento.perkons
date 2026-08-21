import { access, readFile } from "node:fs/promises";

const required = [
  "dist/server/index.js",
  "dist/server/wrangler.json",
  "dist/client/assets",
];

for (const path of required) await access(path);

const config = JSON.parse(await readFile("dist/server/wrangler.json", "utf8"));
if (config.name !== "avaliacao-processamento") {
  throw new Error("O nome do Worker gerado está incorreto.");
}
if (!config.d1_databases?.some((item) => item.binding === "DB")) {
  throw new Error("O binding D1 DB não foi incluído no build.");
}

console.log("Build Cloudflare validado com Worker, assets e binding D1.");
