# Portal MINSA

Aplicacao migrada para Next.js com roteamento por paginas.

## Como rodar localmente

1. Instale dependencias:
   `npm install`
2. Configure as variaveis de ambiente:
   `copy .env.example .env.local`
3. Execute o servidor de desenvolvimento:
   `npm run dev`
4. Abra `http://localhost:3000`

## Scripts uteis

- `npm run dev` - inicia o servidor de desenvolvimento Next.js
- `npm run build` - gera a versao de producao
- `npm start` - inicia a aplicacao gerada em producao
- `npm run lint` - valida o codigo Next.js
- `npm run typecheck` - verifica tipos TypeScript

## Estrutura de paginas

- `/dashboard`
- `/hospitals`
- `/epidemiology`
- `/reports`
- `/users`
- `/login`

## Autenticacao

- O login agora passa por `POST /api/auth/login` e a sessao fica num cookie `HttpOnly`.
- O frontend deixou de usar `localStorage` para sessao.
- As credenciais de desenvolvimento sao lidas no backend; a UI nao expoe perfis nem palavras-passe.
- O painel de utilizadores ficou em modo `read-only` ate a integracao com o `auth-service`.
- Se `AUTH_SERVICE_BASE_URL` estiver configurado em `.env.local`, as rotas locais de auth passam a funcionar como proxy seguro para o `auth-service`.
- O `auth-service` atual usa o fluxo real `POST /auth/login` -> OTP -> `POST /auth/verify-otp`, com refresh em `POST /auth/token/refresh` e revoke em `POST /auth/token/revoke`.
- O `access token` do backend real nao vai para o browser; ele fica apenas dentro do cookie de sessao assinado pelo servidor.
- O frontend consome a sessao apenas via `PortalContext` e `GET /api/auth/me`.
- As operacoes criticas passam por autorizacao no backend com claims/perfis validados no servidor.
- Ha suporte para refresh e rotacao de sessao quando o `auth-service` expuser `AUTH_SERVICE_REFRESH_PATH`.
- Perfis que exigem OTP/MFA podem concluir o segundo fator pela UI de login quando o `auth-service` expuser `AUTH_SERVICE_OTP_PATH`.
- Login, logout, leitura de sessao e operacoes protegidas emitem logs de auditoria no backend.


## OSIE MVP v1.0 status — 2026-10-01

The production dashboard uses `NationalStatisticsDashboard` and the server-side `/api/statistics/overview` BFF. The browser never receives the Auth Service access token directly. The BFF forwards the HttpOnly-session access token to the Statistics Service, which enforces `statistics:read` through centralized Auth introspection.

Production smoke currently verifies the login page is reachable and that the statistics BFF rejects unauthenticated requests with 401. Demo-only modules without a validated national source are frozen instead of displaying synthetic values as real MINSA data.

Final interactive acceptance requires an authorized MINSA account and OTP when enabled. After login, the expected chain is Portal MINSA → Statistics Service → Auth introspection → DBM statistics read endpoint → aggregate-only response.


<!-- deployment trigger: Vercel production refresh after MINSA auth cookie fix -->
