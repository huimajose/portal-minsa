# 📋 Documentação Técnica de APIs • MINSA-DNSP Angola
Este documento estabelece o roteiro de arquitetura de **APIs (RESTful JSON)** necessárias para integrar o painel estatístico e o sistema e despachos governamentais ao vosso servidor de backend de produção.

---

## 🔐 1. Módulo de Autenticação e Perfis (Auth)

### 🔹 `POST /api/auth/login`
Efectua a validação das credenciais ministeriais de Angola e retorna o perfil de permissões estruturado.
* **Request Body:**
  ```json
  {
    "username": "admin.minsa",
    "password": "senha_segura_minsa"
  }
  ```
* **Response (200 OK):**
  ```json
  {
    "success": true,
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "session": {
      "name": "Dr. Agostinho Neto Filho",
      "username": "admin.minsa",
      "role": "ADMIN_MINSA",
      "province": "All"
    }
  }
  ```

### 🔹 `POST /api/auth/logout`
Invalida o token JWT activo no servidor.
* **Headers:** `Authorization: Bearer <token>`
* **Response (200 OK):**
  ```json
  { "success": true, "message": "Sessão encerrada" }
  ```

---

## 🏥 2. Módulo de Hospitais e Unidades Sanitárias

### 🔹 `GET /api/hospitals`
Retorna a listagem de todos os hospitais e postos de saúde cadastrados, com suporte a filtros de província e tipo de unidade.
* **Query Params:** `province=Luanda`, `type=Hospital Geral`
* **Response (200 OK):**
  ```json
  [
    {
      "id": "hosp-luanda-central",
      "name": "Hospital Geral de Luanda",
      "province": "Luanda",
      "municipality": "Luanda Sul",
      "type": "Hospital Geral",
      "beds": 350,
      "activePatients": 284,
      "occupancyRate": 81,
      "status": "Estável",
      "doctors": 42,
      "nurses": 115
    }
  ]
  ```

### 🔹 `POST /api/hospitals/:id/patients`
Registra a entrada directa ou internamento de um paciente sintomático, alterando em tempo real as taxas e estatísticas.
* **Request Body:**
  ```json
  {
    "patientName": "Isabel de Sousa",
    "age": 28,
    "disease": "Malária",
    "isHospitalized": true,
    "triageLevel": "Atenção"
  }
  ```
* **Response (201 Created):**
  ```json
  {
    "success": true,
    "message": "Registro clínico gravado com sucesso",
    "hospital": {
      "id": "hosp-luanda-central",
      "activePatients": 285,
      "occupancyRate": 82
    }
  }
  ```

### 🔹 `POST /api/hospitals/:id/staff`
Alocação emergencial de recursos humanos adicionais (médicos/enfermeiros) para conter gargalos.
* **Request Body:**
  ```json
  { "doctorsToAdd": 2, "nursesToAdd": 5 }
  ```
* **Response (200 OK):**
  ```json
  { "success": true, "newDoctorsCount": 44 }
  ```

---

## 📈 3. Módulo Estatístico e Epidemiológico (Metrics)

### 🔹 `GET /api/epidemiology/totals`
Gera as métricas consolidadas básicas de acordo com o intervalo temporal e os parâmetros geográficos aplicados.
* **Query Params:** `province=Huambo`, `municipality=All`, `startDate=2026-05-01`, `endDate=2026-05-28`
* **Response (200 OK):**
  ```json
  {
    "totals": {
      "patients": 1420,
      "hospitals": 8,
      "consultations": 24900,
      "hospitalizations": 1280,
      "deaths": 14,
      "births": 320
    }
  }
  ```

### 🔹 `GET /api/epidemiology/by-disease`
Retorna a taxa de incidência estruturada de doenças sob vigilância contínua nacional.
* **Response (200 OK):**
  ```json
  [
    { "name": "Malária", "cases": 2450, "deaths": 8, "color": "#0d9488" },
    { "name": "Cólera", "cases": 280, "deaths": 4, "color": "#0f766e" }
  ]
  ```

### 🔹 `GET /api/epidemiology/by-province`
Usado para colorir de forma dinâmica do mapa interactivo das 18 Províncias de Angola.
* **Response (200 OK):**
  ```json
  [
    { "province": "Luanda", "patients": 4830, "hospitals": 34, "deaths": 11 },
    { "province": "Benguela", "patients": 2940, "hospitals": 19, "deaths": 8 }
  ]
  ```

---

## 🚨 4. Módulo de Alertas Epidemiológicos (Outbreaks)

### 🔹 `GET /api/alerts`
Retorna os surtos ativos monitorizados pelo Ministério da Saúde.
* **Response (200 OK):**
  ```json
  [
    {
      "id": "alert-colera-benguela",
      "province": "Benguela",
      "disease": "Cólera",
      "date": "2026-05-25",
      "alertLevel": "Crítico",
      "description": "Foco suspeito de Cólera detectado na foz fluvial. Saneamento e cloração urgente decretados."
    }
  ]
  ```

### 🔹 `POST /api/alerts`
Permite a um Administrador MINSA publicar e emitir um novo alerta oficial com efeitos dinâmicos no sino de notificações do painel.
* **Request Body:**
  ```json
  {
    "province": "Huíla",
    "disease": "Sarampo",
    "alertLevel": "Atenção",
    "description": "Surto sazonal em clínicas sob monitoramento."
  }
  ```
* **Response (221 Created):**
  ```json
  { "success": true, "alertId": "alert-sarampo-huila" }
  ```

---

## 📑 5. Módulo de Despachos e Decretos (Reports)

### 🔹 `GET /api/reports/templates`
Retorna a listagem de templates técnicos editáveis e os parágrafos legais padrão de Angola.
* **Response (200 OK):**
  ```json
  [
    {
      "id": "epidemic_alert",
      "label": "🚨 Alerta Epidemiológico Urgente",
      "defaultBody": "1. Havendo detectado um incremento anómalo..."
    }
  ]
  ```

### 🔹 `POST /api/reports/generate`
Registra a emissão oficial de um despacho sanitário, gravando o conteúdo editado, assinaturas e gerando o hash hash SHA-256 de validação governamental permanente.
* **Request Body:**
  ```json
  {
    "reference": "MINSA-DNSP-2026-ALERT-EPI-048",
    "subject": "DECLARAÇÃO DE ALERTA EPIDEMIOLÓGICO DE CONCENTRAÇÃO DE CASOS",
    "title": "Despacho de Investigação Clínica, Profilaxia e Bloqueio",
    "bodyText": "1. Havendo detectado um incremento anómalo na província de Benguela...",
    "urgency": "Crítica",
    "budget": "Aprovado sob Orçamento de Contingência da Direcção Nacional",
    "signatoryName": "Dr. Geraldo Augusto dos Santos",
    "signatoryTitle": "Director Nacional de Saúde Pública - DNSP",
    "province": "Benguela"
  }
  ```
* **Response (200 OK):**
  ```json
  {
    "success": true,
    "documentId": "MS-2026-8842-BG",
    "sha256Signature": "d5aef8a29c118a8b8f8fa9b2b...",
    "status": "Registrado e Validado no Diário Oficial"
  }
  ```

---

### 🛡️ Boas Práticas Recomendadas para Implementação
1. **Middlewares de Segurança (Role-Based Access Control):** Bloquear rotas `POST /api/reports/generate` e `POST /api/alerts` de forma a aceitar apenas requests contendo headers JWT válidos com as funções `ADMIN_MINSA` ou `MINISTRO_SAUDE`.
2. **Compressão gzip:** Utilizar compressão Gzip/Brotli no endpoint `/api/epidemiology/by-province` de forma que a plotagem de mapas coropléticos permaneça fluida e performante em ligações de largura de banda reduzida.
3. **Persistência Auditável:** Os despachos gerados na rota `POST /api/reports/generate` devem ser salvos em uma tabela do tipo histórico no banco de dados para auditoria em conformidade com as exigências públicas de integridade sanitária de Angola.
