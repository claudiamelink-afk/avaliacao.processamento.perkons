# Avaliação Processamento

Plataforma de processo seletivo preparada para Cloudflare Workers com banco D1.

## Recursos Cloudflare

- Worker: `avaliacao-processamento`
- Banco D1: `avaliacao-processamento-db`
- Binding do banco: `DB`
- Arquivos estáticos servidos pelo Worker Assets
- Segredos obrigatórios: `ADMIN_PASSWORD` e `ADMIN_SESSION_SECRET`

## Publicação

1. Crie o D1 com `npm run db:create`.
2. Copie o `database_id` retornado para `wrangler.jsonc`.
3. Execute `npm run db:migrate`.
4. Cadastre os segredos com `wrangler secret put ADMIN_PASSWORD` e `wrangler secret put ADMIN_SESSION_SECRET`.
5. Execute `npm run deploy`.

A senha administrativa nunca deve ser gravada em arquivos do projeto. O segredo de sessão deve ser uma sequência aleatória longa.

## Validação local

- `npm run build`
- `npm run test`

O site anterior deve permanecer ativo até a validação completa do novo endereço `.workers.dev`.
