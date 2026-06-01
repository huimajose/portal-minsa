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
