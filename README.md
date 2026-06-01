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
- O `access token` do backend real nao vai para o browser; ele fica apenas dentro do cookie de sessao assinado pelo servidor.
- O frontend consome a sessao apenas via `PortalContext` e `GET /api/auth/me`.
- As operacoes criticas passam por autorizacao no backend com claims/perfis validados no servidor.
- Ha suporte para refresh e rotacao de sessao quando o `auth-service` expuser `AUTH_SERVICE_REFRESH_PATH`.
- Perfis que exigem OTP/MFA podem concluir o segundo fator pela UI de login quando o `auth-service` expuser `AUTH_SERVICE_OTP_PATH`.
- Login, logout, leitura de sessao e operacoes protegidas emitem logs de auditoria no backend.
