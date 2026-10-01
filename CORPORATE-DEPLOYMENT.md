# Implantação corporativa — Docker e PostgreSQL

Esta ramificação remove a dependência obrigatória do Cloudflare Workers/D1 e entrega a aplicação como serviço Node.js conteinerizado.

## Arquitetura

- Aplicação: Next.js 16 em modo standalone
- Runtime: Node.js 22
- Banco: PostgreSQL 16 ou versão homologada compatível
- Porta interna: 3000
- Saúde: `GET /api/health`
- Persistência: PostgreSQL externo; o container da aplicação não mantém dados locais

## Teste completo fora da Cloudflare

1. Instale Docker Engine e Docker Compose.
2. Copie `.env.example` para `.env` e defina segredos adequados.
3. Execute:

```bash
docker compose up --build
```

4. Aguarde o PostgreSQL ficar saudável.
5. Acesse `http://localhost:3000`.
6. Confirme `http://localhost:3000/api/health`; o esperado é:

```json
{"status":"ok","database":"connected"}
```

7. Valide cadastro de candidato, conclusão das cinco etapas, login principal, criação de administrador, alteração de senha, consulta e exclusão de resultado.

Para encerrar:

```bash
docker compose down
```

Use `docker compose down -v` somente quando for desejado apagar o banco local de testes.

## Variáveis obrigatórias

| Variável | Finalidade |
|---|---|
| `DATABASE_URL` | String de conexão PostgreSQL |
| `ADMIN_PASSWORD` | Senha do administrador principal |
| `ADMIN_SESSION_SECRET` | Segredo aleatório longo das sessões |
| `DB_POOL_MAX` | Limite do pool; padrão 10 |
| `DB_SSL` | `true` quando o PostgreSQL exige TLS |
| `DB_SSL_REJECT_UNAUTHORIZED` | Deve permanecer `true` em produção |
| `COOKIE_SECURE` | `true` em produção; use `false` apenas no teste HTTP local |

Segredos não devem ser gravados na imagem, no Git ou no `docker-compose.yml` de produção. A infraestrutura deve fornecê-los pelo gerenciador corporativo.

## Banco corporativo

A criação inicial está em `db/postgres/001_init.sql`. A TI pode executá-la com a ferramenta corporativa de migrations ou com:

```bash
npm install
DATABASE_URL="postgresql://..." npm run db:migrate
```

O usuário do banco usado pela aplicação precisa de SELECT, INSERT, UPDATE e DELETE nas quatro tabelas e uso das sequences. Permissão de CREATE é necessária somente quando a inicialização automática for mantida. Se a TI executar migrations separadamente, poderá usar um usuário de runtime mais restrito após a homologação.

## Migração dos dados atuais do D1

Antes da troca definitiva, exporte resultados, configurações e administradores do D1 em JSON:

```bash
npx wrangler d1 execute avaliacao-processamento-db --remote --command "SELECT * FROM results" --json > d1-results.json
npx wrangler d1 execute avaliacao-processamento-db --remote --command "SELECT * FROM question_settings" --json > d1-settings.json
npx wrangler d1 execute avaliacao-processamento-db --remote --command "SELECT * FROM admin_users" --json > d1-admins.json
```

Depois de aplicar a migration PostgreSQL:

```bash
DATABASE_URL="postgresql://..." npm run db:import:d1 -- --results d1-results.json --settings d1-settings.json --admins d1-admins.json
```

Sessões administrativas não são migradas; todos deverão entrar novamente. Os arquivos exportados contêm dados pessoais e hashes de senha: devem ser transportados em canal aprovado e apagados após a conferência.

## Requisitos para a infraestrutura Perkons

- Registry corporativo para a imagem;
- PostgreSQL homologado e com backup;
- Ingress/reverse proxy com TLS;
- Redirecionamento HTTP para HTTPS no proxy;
- HSTS aplicado somente no endereço HTTPS definitivo;
- Limite de corpo e rate limiting no proxy;
- Logs centralizados;
- Secret manager;
- Monitoramento do endpoint `/api/health`;
- Política de retenção e restauração do banco.

## Critérios de aceite

- Build da imagem sem dependência do Wrangler;
- Container executado sem bindings Cloudflare;
- Saúde retorna HTTP 200 com PostgreSQL conectado;
- Todas as rotas funcionais aprovadas;
- Dados históricos conferidos por quantidade e amostragem;
- Cabeçalhos de segurança confirmados no domínio corporativo;
- Backup e rollback documentados;
- Cloudflare mantido até a homologação e virada oficial.
