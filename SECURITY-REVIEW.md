# Tratamento dos achados de segurança

## XXE — IDs 22 a 28

**Classificação proposta:** não aplicável / falso positivo sem evidência.

A aplicação não recebe nem processa documentos XML. As rotas de entrada utilizam JSON por meio de `request.json()`, e o projeto não inclui parser XML. Os parâmetros enviados pelo usuário são tratados como texto e não como entidades XML.

Os relatórios não apresentaram evidência nem callback out-of-band. Caso a equipe de TI deseje uma confirmação dinâmica adicional, poderá repetir o teste com domínio OOB; a ausência de callback confirma que não há resolução de entidade externa.

## Cabeçalhos HTTP — IDs 30 a 35

Tratamento centralizado em `worker/index.ts`:

- Strict-Transport-Security
- Content-Security-Policy
- X-Frame-Options
- X-Content-Type-Options
- Referrer-Policy
- Permissions-Policy

A CSP mantém apenas recursos da própria aplicação. `unsafe-inline` foi preservado para scripts e estilos gerados pelo framework; os demais carregamentos são restritos à mesma origem. `frame-ancestors 'none'` e `X-Frame-Options: DENY` impedem incorporação em frames.

O HSTS foi aplicado sem `includeSubDomains` e sem `preload`, evitando impacto indevido em outros serviços.

## HTTP para HTTPS

O Worker devolve redirecionamento permanente 301 caso receba uma requisição HTTP e também publica HSTS nas respostas HTTPS.

## robots.txt — ID 29

Foi criado um arquivo público neutro, contendo apenas:

```text
User-agent: *
Allow: /
```

Nenhuma rota administrativa ou endpoint interno é divulgado. Os recursos administrativos continuam protegidos por autenticação e autorização no servidor.
