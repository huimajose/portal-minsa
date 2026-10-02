# OSIE MVP v1.0 - Release Candidate

Data: 2026-10-01

## Escopo congelado

O Portal MINSA funciona como centro nacional regulatório e estatístico, não como sistema clínico hospitalar. O MVP inclui autenticação MINSA via Auth Service, sessão server-side com cookies HttpOnly, Statistics Service autenticado por identidade M2M, agregados nacionais read-only do Database Manager, visão nacional, contagem de nodes ativos, mapa institucional real, diretório institucional, epidemiologia agregada, relatórios PDF/CSV e estado da cadeia de integração.

## Privacidade e ownership

O Portal MINSA não recebe linhas clínicas individuais e não executa operações clínicas. O Statistics Service usa o endpoint interno agregado do DBM. As métricas são allowlisted e não permitem SQL arbitrário ou seleção livre de campos.

## Dados reais

Dados sintéticos de runtime e componentes de simulação foram removidos. Localização ausente permanece ausente. Métricas sem fonte analítica confiável não são estimadas.

## Georreferenciação

A migration `021_add_organization_location.sql` introduz province, municipality, neighborhood, latitude e longitude. O mapa usa apenas coordenadas registadas. HCL e a instituição de Lubango possuem coordenadas reais configuradas para o MVP.

## Contrato analítico

O DBM disponibiliza `/api/v1/internal/statistics/aggregate` exclusivamente para STATISTIC-SERVICE. O overview nacional usa `resource_counts`, `organizations_directory`, `top_conditions` e `encounters_by_year`. `resource_counts` inclui `active_nodes`.

## Critérios de aceitação

- CI verde nos serviços alterados;
- deploy Render live;
- Auth introspection funcional;
- DBM aggregate API funcional;
- overview do Statistics Service sem PII;
- Portal MINSA compilado e publicado;
- mapa renderizado apenas com coordenadas válidas;
- export PDF/CSV sem registos individuais;
- ausência de dados demo no runtime.

## Extensão do MVP de apresentação

Foram promovidos ao MVP:
- distribuição etária agregada no DBM, sem exposição de data de nascimento;
- epidemiologia territorial por província/município quando a condição possui vínculo institucional explícito e a organização possui geografia registada;
- diretório administrativo read-only via Auth Service, sanitizado e auditado.

A ausência de vínculo territorial não é inferida. Registos sem dimensão suficiente permanecem fora do agregado territorial.

## Fora do MVP

Não bloqueiam a demonstração: entrega externa de OTP por fornecedor, enriquecimento epidemiológico para registos clínicos sem vínculo institucional explícito e atualização controlada das dependências frontend sinalizadas pelo audit.

## Evidência

As alterações foram entregues por PR, CI e auto-deploy. O núcleo HCL/HML mantém o fluxo E2E previamente validado de pedido, aprovação, transmissão FHIR e processamento 4/4. A release MINSA acrescenta a camada regulatória agregada sem alterar o ownership clínico dos hospitais.
