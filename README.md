# Portal MINSA

Portal regulatório e estatístico do OSIE, construído em Next.js.

## MVP v1.0

A navegação do MVP está organizada como um centro nacional de situação:

- **Visão Nacional**: KPIs nacionais agregados.
- **Rede Hospitalar**: mapa georreferenciado e diretório institucional real.
- **Epidemiologia**: workbench nacional com mapa, seleção de indicador, Total/Percentagem, resumo Min/Máx/Média e gráficos agregados.
- **Relatórios**: snapshot executivo exportável em PDF e CSV.
- **Administração**: identidade, permissões e estado da cadeia de integração.

## Regra de dados

O portal não usa dados clínicos sintéticos em runtime. Indicadores nacionais vêm do Statistics Service, que consulta o Database Manager com identidade de serviço e valida o utilizador MINSA no Auth Service.

Fluxo: **Portal MINSA → Statistics Service → Auth Service → Database Manager**.

Nenhum registo clínico individual é exposto pelo dashboard ou pelos relatórios do MVP.

## Epidemiologia

O workbench mantém a composição preparada para heatmap territorial, treemap por província/município, distribuição por faixa etária, filtros de indicador/período, Total/Percentagem e Min/Máx/Média.

Uma visualização só apresenta valores quando a dimensão correspondente existe no contrato analítico real. O mapa atual mostra instituições georreferenciadas. Treemap epidemiológico e distribuição etária permanecem explicitamente indisponíveis até o DBM fornecer agregados seguros para essas dimensões. O frontend não estima, replica ou inventa valores ausentes.

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

Tokens de acesso permanecem em cookies HttpOnly e não são entregues ao JavaScript do browser.

## Próxima evolução analítica

- substituir paginação de tabelas no Statistics Service por endpoints agregados dedicados no DBM;
- agregar condições por província/município quando houver vínculo territorial clínico confiável;
- agregar condições por faixas etárias quando a identidade clínica possuir a dimensão de nascimento necessária;
- disponibilizar `active_nodes` pelo registry;
- criar endpoint administrativo read-only no Auth Service;
- atualizar dependências Next.js após validação de compatibilidade.
