# OSIE MVP v1.0 - Release Candidate

Data: 2026-10-01

## Escopo congelado

O Portal MINSA funciona como centro nacional regulatório e estatístico, não como sistema clínico hospitalar. O MVP inclui:

- autenticação MINSA via Auth Service;
- sessão server-side com cookies HttpOnly;
- Statistics Service autenticado por identidade M2M;
- agregados nacionais read-only fornecidos pelo Database Manager;
- visão nacional de pacientes registados, instituições, encontros, observações e condições;
- contagem real de nodes OSIE ativos;
- mapa institucional com coordenadas reais registadas no DBM;
- diretório institucional;
- epidemiologia agregada com condições mais frequentes, série anual, Total/Percentagem e Min/Máx/Média;
- relatórios PDF e CSV de agregados autorizados;
- administração com perfil ativo e estado real da cadeia Portal → Statistics → Auth → DBM.

## Privacidade e ownership

O Portal MINSA não recebe linhas clínicas individuais e não executa operações clínicas. O Statistics Service usa o endpoint interno agregado do DBM. As métricas aceites são allowlisted e não permitem SQL arbitrário ou seleção livre de campos.

## Dados reais

Dados sintéticos de runtime e componentes de simulação foram removidos. Localização institucional ausente permanece ausente. Métricas sem fonte analítica confiável não são estimadas.

## Georreferenciação

A migration `021_add_organization_location.sql` introduz province, municipality, neighborhood, latitude e longitude. O mapa usa apenas coordenadas registadas. HCL e a instituição de Lubango possuem coordenadas reais configuradas para o MVP.

## Contrato analítico

O DBM disponibiliza `/api/v1/internal/statistics/aggregate` exclusivamente para STATISTIC-SERVICE. O overview nacional usa:

- resource_counts;
- organizations_directory;
- top_conditions;
- encounters_by_year.

`resource_counts` inclui também `active_nodes`.

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

## Fora do MVP

Permanecem evolução pós-MVP, sem bloquear a demonstração:

- epidemiologia por província/município quando existir vínculo territorial clínico confiável;
- distribuição clínica por faixa etária quando existir agregado seguro;
- diretório administrativo read-only de utilizadores via Auth Service;
- entrega externa de OTP por fornecedor;
- atualização controlada das dependências frontend sinalizadas pelo audit.

## Evidência de release

As alterações foram entregues por PR, CI e auto-deploy. A validação final deve considerar o trio DBM, Statistics Service e Portal MINSA na mesma janela de release, além do smoke clínico HCL/HML já estabelecido para o núcleo de interoperabilidade.
