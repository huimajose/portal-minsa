# Portal MINSA

Portal regulatório e estatístico do OSIE, construído em Next.js.

## MVP v1.0

A navegação do MVP está organizada como um centro nacional de situação:

- **Visão Nacional**: KPIs nacionais agregados.
- **Rede Hospitalar**: mapa georreferenciado e diretório institucional real.
- **Epidemiologia**: condições e atividade clínica agregadas, com filtro temporal suportado pela série real de encontros.
- **Relatórios**: snapshot executivo exportável em PDF e CSV.
- **Administração**: identidade, permissões e estado da cadeia de integração. O diretório de utilizadores permanece indisponível até existir endpoint administrativo autorizado no Auth Service.

## Regra de dados

O portal não usa dados clínicos sintéticos em runtime. Indicadores nacionais devem vir do Statistics Service, que consulta o Database Manager com identidade de serviço e valida o utilizador MINSA no Auth Service.

Fluxo: **Portal MINSA → Statistics Service → Auth Service → Database Manager**.

Nenhum registo clínico individual é exposto pelo dashboard ou pelos relatórios do MVP.

## Mapa institucional

O mapa utiliza exclusivamente `latitude` e `longitude` registadas na organização no Database Manager. Não são inventadas coordenadas nem localizações ausentes. A migration `021_add_organization_location.sql` introduziu os metadados geográficos no registo institucional.

## Relatórios

PDF e CSV são gerados no browser a partir da resposta agregada já autorizada. O export atual contém apenas os indicadores efetivamente disponíveis no contrato `/api/statistics/overview`.

## Desenvolvimento

```
npm install
npm run typecheck
npm run build
npm run dev
```

Variáveis de ambiente são descritas em `.env.example`. Tokens de acesso permanecem em cookies HttpOnly e não são entregues ao JavaScript do browser.

## Pendências pós-MVP

- substituir paginação de tabelas no Statistics Service por endpoints agregados dedicados no DBM;
- disponibilizar `active_nodes` pelo registry;
- criar endpoint administrativo read-only no Auth Service para o diretório MINSA;
- ampliar agregações epidemiológicas por geografia somente quando os campos de origem forem confiáveis;
- atualizar dependências Next.js após validação de compatibilidade.
