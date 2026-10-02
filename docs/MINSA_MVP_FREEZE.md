# Portal MINSA — MVP Freeze

Status: Release Candidate  
Data: 2026-10-02

## Escopo congelado

O MVP MINSA entrega:
- autenticação regulatória através do Auth Service;
- visão nacional com indicadores agregados;
- rede hospitalar com diretório e mapa navegável de instituições georreferenciadas;
- epidemiologia com condições agregadas, distribuição etária e dimensão territorial;
- relatórios nacionais PDF/CSV;
- diretório administrativo de utilizadores;
- cadeia Portal MINSA → Statistics Service → Database Manager.

## Regras de dados

- O Portal MINSA não apresenta registos clínicos individuais.
- Não são fabricados valores para preencher gráficos, mapas ou KPIs.
- A idade é entregue apenas em faixas agregadas.
- A epidemiologia territorial só inclui registos com vínculo institucional explícito e instituição com território conhecido.
- Ausência de vínculo ou localização é tratada como lacuna de qualidade/cobertura de dados.
- Credenciais, BI, hashes, tokens e OTP não pertencem ao contrato do Portal MINSA.

## Contrato analítico

A migration 022 cria as views:
- vw_statistics_resource_counts
- vw_statistics_conditions
- vw_statistics_encounters_by_year
- vw_statistics_organizations
- vw_statistics_patient_age
- vw_statistics_territorial_conditions

O Database Manager é responsável pelas projeções analíticas. O Statistics Service compõe os agregados nacionais e o Portal apenas apresenta esses contratos.

## Critérios de aceitação do MVP

1. Login regulatório funcional.
2. Visão Nacional carrega sem dados simulados.
3. Rede Hospitalar apresenta instituições reais e mapa navegável.
4. Epidemiologia apresenta apenas agregados disponíveis.
5. Distribuição etária não expõe data de nascimento.
6. Territorialização não infere geografia ausente.
7. Administração apresenta diretório autorizado.
8. Relatórios exportam os indicadores disponíveis.
9. Estados de loading, vazio e erro são apresentados sem inventar resultados.
10. CI e deploy dos serviços envolvidos estão verdes.

## Pós-freeze

Mudanças estruturais seguintes devem evoluir o modelo canónico:

Patient → Encounter → Condition/Observation → Organization → Administrative Area

A organização do evento clínico deve ser distinta de organização proprietária/origem, transmissora e destinatária. Backfills só podem criar relações demonstráveis a partir dos dados existentes.

## Regra de release

Após o smoke autenticado final, alterações funcionais novas deixam de entrar no MVP. Correções de bugs, segurança, dados, acessibilidade e documentação continuam permitidas.


## Centro de Situação Territorial

O mapa nacional do Portal MINSA funciona como uma superfície analítica agregada e possui três camadas no MVP:

- **Rede hospitalar:** instituições OSIE georreferenciadas por província.
- **Epidemiologia:** coroplético provincial calculado exclusivamente a partir de `territorial_epidemiology`, com filtro por condição clínica.
- **Qualidade dos dados:** cobertura de georreferenciação institucional por província.

Ao selecionar uma província, a ficha territorial apresenta apenas informação agregada ou administrativa: sede, municípios/comunas, instituições OSIE, registos clínicos territorializados e condições agregadas. O portal não recebe data de nascimento, registos clínicos individuais nem identidade de pacientes.

Não existem previsões, inferências epidemiológicas, classificação por IA ou geografia inventada. Ausência de dados é apresentada como ausência de dados. A geometria administrativa utilizada no MVP é uma camada de visualização derivada da Lei 14/24 e não substitui cartografia oficial de precisão legal/geodésica. O drill-down cartográfico municipal permanece fora do freeze enquanto não houver geometria municipal suficientemente validada.
