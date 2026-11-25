# PLANO ESTRATÉGICO — NOVO PITCH DE 5 MINUTOS (LEITFLOW)

> **Projeto:** LEITFLOW — Sistema de Gestão Logística, Clínica e Rastreabilidade do Banco de Leite Humano de Marília – SP  
> **Repositório analisado:** `LEITE-FLOW-banco-leite-marilia` (branch `main`, commit `df9d947`)  
> **Público-alvo:** Banca avaliadora  
> **Duração total:** ~5 minutos (prioridade para demonstração prática ao vivo)  
> **Escopo desta etapa:** Análise completa do projeto, auditoria do pitch anterior e planejamento estratégico. Nenhum slide ou arquivo do sistema foi modificado.

---

## 1. Diagnóstico do Projeto

### 1.1 Salto de Maturidade Comprovado no Repositório
A investigação do código-fonte real (`src/` e `backend/`) revela que o projeto **ultrapassou em muito o estágio de protótipo frontend-only** retratado na apresentação antiga (`public/pitch.html`). Hoje o **LEITFLOW** é uma **plataforma web full-stack funcional**, com persistência em banco de dados relacional, API REST documentada em OpenAPI/Swagger (`/docs`), segurança baseada em papéis (RBAC/LGPD), módulos clínico-laboratoriais e portal público de captação.

### 1.2 Problema, Objetivos e Proposta Real
- **Problema:** A rotina de um Banco de Leite Humano (BLH) conecta etapas altamente sensíveis — captação de novas doadoras, conferência de sorologias e critérios clínicos, organização de coletas domiciliares por região, rotulagem de frascos submetidos ao congelamento, controle de qualidade laboratorial e dispensação para a UTI Neonatal. Quando apoiada em fichas de papel, planilhas desconexas e etiquetas escritas à mão, essa cadeia sofre com retrabalho, risco de rasura/perda de rastreabilidade, demora na triagem e baixa visibilidade operacional.
- **Objetivo do sistema:** Apoiar a equipe do Banco de Leite Humano de Marília – SP com uma plataforma integrada que organiza o fluxo ponta a ponta — **da manifestação de interesse da mãe até a dispensação do leite pasteurizado na UTI Neonatal** — mantendo o **frasco como entidade central rastreável** em conformidade com a **RDC ANVISA nº 171/2006** e a **LGPD (Lei nº 13.709/2018)**.
- **Princípio institucional (evidenciado no código):** Ferramenta de apoio operacional e sanitário, sem substituir o julgamento clínico dos profissionais de saúde.

### 1.3 Stack Tecnológica Real
- **Frontend:** React 18, TypeScript (`strict: true`), Vite 5, Tailwind CSS 3, React Router v6 (code-splitting por módulo), TanStack React Query v5, Motion (animações com `reducedMotion="user"`), Leaflet (mapas interativos com OSM/Esri + traçado viário OSRM), `jsbarcode` (Code 128 real) e `qrcode` (QR Code ISO/IEC 18004 real).
- **Backend:** Node.js + Fastify 5, TypeScript, Zod (validação de entrada), Prisma ORM 6 (schema único compatível com SQLite local e PostgreSQL em produção), `@fastify/jwt`, `@fastify/cookie`, `@fastify/helmet`, `@fastify/cors`, `@fastify/rate-limit`, `@fastify/swagger` + Swagger UI (`/docs`) e hash de senha com `scrypt`.
- **Qualidade & Deploy:** Testes automatizados com Vitest no frontend (`src/**/__tests__`) e testes de integração no backend (`backend/src/__tests__`); infraestrutura pronta para deploy na **Vercel** (frontend) + **Render / Docker + PostgreSQL** (backend, com bootstrap idempotente no startup).

### 1.4 Mapa de Maturidade Real (Completo vs. Parcial vs. Planejado)

| Módulo / Capacidade | Estado Atual | Evidência Real no Código |
|---|---|---|
| **Portal Institucional & Captação Digital (`/`, `/quero-doar`)** | **Completo** | `PublicHomePage.tsx`, `BottleExplodedScroll.tsx`, `DonorInterestPage.tsx`, `donorInterests.routes.ts` (protocolo único, consentimento LGPD, anti-spam, fila de atendimento e conversão para cadastro oficial). |
| **Autenticação, RBAC (4 perfis) & LGPD (`/login`, API)** | **Completo** | `auth.routes.ts`, `middlewares/auth.ts`, `LoginView.tsx`. Hash `scrypt`, JWT + Refresh Token rotativo em cookie `HttpOnly`. 4 perfis (`ADMIN`, `COORDENADOR_BLH`, `COLETOR_CAMPO`, `LABORATORIO`). Projeção LGPD no servidor oculta CPF, CNS e dados clínicos do perfil `COLETOR_CAMPO`. |
| **Gestão de Doadoras & Triagem Go/No-Go (`/doadoras`)** | **Completo** | `DoadorasView.tsx`, `CadastroWizard.tsx`, `CaptacaoDoadorasPanel.tsx`, `DonorProfileModal.tsx`, `donors.routes.ts`. Validação de CPF e CNS (15 dígitos), anti-duplicidade, sorologias com padrão fail-safe (`pendente`), regra de 12 meses para tatuagem/transfusão e Perfil 360°. |
| **Roteirização Multi-Veículo, Coleta `1:N` & Mapa (`/rotas`, `/mapa`)** | **Completo** | `RoteirizacaoView.tsx`, `RouteFleetManager.tsx`, `RouteDispatcher.tsx`, `ColetaModal.tsx`, `InteractiveMapView.tsx`, `routes.routes.ts`. Entidade `CollectionVisit` recorrente, otimização **Nearest Neighbor + 2-opt** no backend, coleta multi-frasco (`POST /bottles/batch`) com **Data da 1ª Ordenha**, entrega de frascos vazios e mapa Leaflet sanitizado contra XSS. |
| **Etiquetagem Óptica Real & Rastreabilidade (`/etiquetas`)** | **Completo** | `EtiquetasView.tsx`, `ThermalLabelPreview.tsx`, `labelService.ts`, `bottles.routes.ts`. **Code 128 real** + **QR Code ISO real** com payload opaco sem PII (`LF1:LF-2026-XXXXXX`), formatos `60×40mm`, `100×50mm`, lote A4 e exportação **ZPL II**, edição controlada antes da confirmação, imutabilidade pós-confirmação, histórico de vias, anulação auditada e **bloqueio sanitário** da Etiqueta 3 (UTI) antes da pasteurização. |
| **Laboratório BLH, Dispensação UTI & Estoque de Vidros (`/laboratorio`)** | **Completo** | `AccountabilityView.tsx`, `bottles.routes.ts`, `dashboard.routes.ts`. Registro real de Acidez Dornic (`≤ 8,0 °D`), Crematócrito (`Kcal/L`), cultura microbiológica, pasteurização (validade +6 meses), descarte justificado, dispensação anonimizada para UTI e ledger real de frascos de vidro (`GlassInventoryMovement`). |
| **Painel Operacional (`/dashboard`)** | **Completo** | `DashboardView.tsx`, `TripleVerificationPipeline.tsx`, `WeekMatrixOverview.tsx`. KPIs 100% calculados do banco (zero mocks), alertas reais (validade 15d, desvio térmico `> -10 °C`, sorologias pendentes, paradas não realizadas), filtro por zona e gráfico geográfico. |
| **Geocodificação & Traçado Viário** | **Parcial / Externo** | `geo.routes.ts` usa Nominatim (OSM) com validação de bounding box de Marília e fallback por zona; traçado de ruas no mapa usa OSRM público. |
| **Auditoria & Gestão de Frota/Equipe (UI Admin)** | **Parcial (API pronta)** | `AuditLog` grava eventos críticos no banco e existem `GET /api/v1/audit-logs` e `GET /api/v1/fleet`, porém ainda não há telas administrativas dedicadas (`/auditoria` e `/equipe-frota`) no frontend. |
| **PWA Offline, Bluetooth Térmico, IoT e Portal Logado da Doadora** | **Planejado (Não implementado)** | Não há Service Worker/IndexedDB offline, pareamento Bluetooth ESC/POS, sensores IoT automáticos nem área autenticada para a doadora acompanhar a van. |

### 1.5 Principais Diferenciais Técnicos
1. **Rastreabilidade óptica real e privada (LGPD by Design):** Code 128 e QR Code decodificáveis com payload opaco (sem nome/CPF expostos no código) + projeção de dados por perfil no servidor.
2. **Travas sanitárias reais baseadas na RDC ANVISA nº 171/2006:** Sorologia `pendente` por padrão, validade do leite cru calculada da **1ª ordenha** (15 dias), bloqueio de pasteurização se Acidez Dornic `> 8,0 °D`, bloqueio da etiqueta de UTI antes da aprovação laboratorial e imutabilidade do frasco após confirmação da etiqueta.
3. **Fluxo contínuo ponta a ponta:** Conecta captação pública da mãe → triagem clínica → roteirização otimizada (2-opt) → coleta multi-frasco → etiquetagem ZPL/térmica → laboratório → dispensação anonimizada na UTI.

---

## 2. Resumo da Proposta de Valor

> **O LEITFLOW transforma a operação do Banco de Leite Humano em uma cadeia digital contínua, segura e auditável — conectando o acolhimento de novas doadoras à entrega segura de leite pasteurizado na UTI Neonatal, com foco na rastreabilidade individual de cada frasco e conformidade com a RDC 171/2006 e a LGPD.**

Em termos que a banca percebe imediatamente:
- **Para o hospital e a equipe técnica:** substitui controles fragmentados por um fluxo único, com travas automáticas contra erros humanos críticos.
- **Para a logística externa:** organiza visitas por região de Marília com rotas otimizadas e registro ágil de múltiplos frascos em campo.
- **Para a mãe doadora:** reduz barreiras para iniciar a doação com uma porta de entrada digital acolhedora e respeitosa à privacidade.
- **Para os recém-nascidos da UTI Neonatal:** reforça a segurança sanitária e a continuidade do abastecimento de leite humano rastreável.

---

## 3. Análise do Pitch Antigo (`public/pitch.html`)

### 3.1 Inventário do Material Anterior
- **Arquivo:** `public/pitch.html` (standalone HTML/CSS/JS responsivo, 1.593 linhas, 8 slides).
- **Estrutura narrativa antiga (8 slides):**
  1. Capa Oficial & Equipe (6 integrantes + imagem `hero_banner.jpg`).
  2. A Nossa Ideia: Problema e Solução (3 colunas: Gargalos, Solução, foto `doacao_leite.jpg`).
  3. O Nosso Objetivo: 3 Pilares do MVP (3 cards numerados + foto `coleta_domiciliar.jpg`).
  4. Como o Sistema Funciona por Baixo dos Panos (Tecnologias + Algoritmos).
  5. Explicação do Site: Fluxo de Campo + Simulação de Etiqueta + Banner com botões ao vivo (`Acessar Sistema` e `GitHub`).
  6. O Que Iremos Implementar no Futuro (Fase 2 Curto Prazo / Fase 3 Médio-Longo Prazo).
  7. Impacto Social e Econômico (3 cards com estatísticas grandes: `0`, `-35%`, `100%`).
  8. Conclusão & Agradecimentos (frase de impacto + equipe + abertura para perguntas).

### 3.2 Pontos Fortes a Preservar
- **Linguagem visual muito coerente e profissional:** estética limpa de Health-Tech/Keynote, com contraste excelente tanto no Modo Escuro ("HUD cirúrgico") quanto no Modo Claro ("BLH estéril").
- **Componentes autorais reconhecíveis:** badges em formato pill (verde/azul/coral), cards elevados com barra superior colorida de `3.5px` (`.card-top-pine`, `.card-top-cold`, `.card-top-coral`), listas com marcadores quadrados arredondados (`.pill-dot`), `code-pill` em `JetBrains Mono` e fotos humanizadas com `object-position` calibrado para não cortar rostos.
- **Experiência de apresentação interativa:** barra de progresso superior em gradiente, alternância Claro/Escuro (`T`), cronômetro regressivo de 5 minutos (`P`), navegação por teclado (`←`/`→`, `1–N`), pontos clicáveis e gestos *touch swipe* no celular.
- **Banner interativo de transição para demo:** os botões diretos para a aplicação online e o GitHub no Slide 5 facilitam a transição ao vivo sem sair procurando links.

### 3.3 Fragilidades e Desalinhamentos Atuais do Pitch Antigo
1. **Desatualizado em relação ao sistema real:** descreve o projeto como um MVP frontend-only ("React 18 + Vite + Leaflet", "etiquetas offline", sem mencionar backend Fastify/Prisma/PostgreSQL, RBAC/LGPD, Captação Digital ou Laboratório).
2. **Slide 6 (Roadmap) apresenta como "futuro" recursos que já estão prontos:** o módulo laboratorial (Acidez Dornic, crematócrito, pasteurização), a rastreabilidade até a UTI Neonatal e o cadastro socioeconômico/sanitário já existem no sistema atual!
3. **Métricas não comprovadas (risco alto perante banca):** afirma `"-35% Trajeto / Eficiência em Frota"`, `"0 Desperdício Zero (100% dos descartes)"`, `"< 1 min por casa"` e `"100% Segurança Neonatal"` sem estudo de campo que sustente esses números.
4. **Excesso de slides para 5 minutos com demo prioritária:** 8 slides densos consomem 3 a 4 minutos apenas em exposição teórica, espremendo a demonstração prática.
5. **Redundância narrativa:** os Slides 2, 3 e 5 repetem os mesmos pontos (zoneamento de Marília, etiqueta `60×40mm`, fluxo de 1 toque).
6. **Inconsistência na grafia da marca:** usa `LEITE-FLOW` enquanto a nova interface institucional e o planejamento oficial adotam `LEITFLOW`.

---

## 4. Identidade Visual que Deverá Ser Preservada

A nova apresentação será uma **evolução direta do `public/pitch.html`**, mantendo exatamente seu ecossistema visual e mecânica interativa:

### 4.1 Paleta de Cores Oficial (Tokens Preservados)
- **Modo Escuro (padrão HUD clínico):**
  - Fundo principal: `#091217` (`--bg-body`) com gradientes radiais sutis em verde-pinheiro (`rgba(35, 83, 71, 0.18)`) e azul frio (`rgba(2, 132, 199, 0.12)`).
  - Painéis e cards: `#111e27` / `rgba(17, 30, 39, 0.88)` com `backdrop-filter: blur(14px)` e borda `rgba(255, 255, 255, 0.1)`.
  - Textos: `#f8fafc` (principal), `#cbd5e1` (suave), `#94a3b8` (secundário).
- **Modo Claro (BLH estéril — alternável via botão / tecla `T`):**
  - Fundo principal: `#f4f7f6` (`--bg-body`) com superfícies `#ffffff` / `rgba(255, 255, 255, 0.95)` e bordas `#dbe5e1`.
  - Textos: `#0f1c24` (principal), `#223542` (suave), `#4a6375` (secundário).
- **Cores Semânticas Institucionais (idênticas ao `tailwind.config.js` e ao pitch antigo):**
  - **Verde Institucional BLH (`Pine`):** `#235347` (escuro `#16362e`, claro `#357262`, suave `#eaf3f0`, destaque `#10b981` / `#059669`) → solução, conformidade sanitária, aprovação.
  - **Azul Logística (`Cold / Cyan`):** `#0284c7` / `#38bdf8` → rotas, mapa, arquitetura, demonstração.
  - **Coral Suave (`Accent`):** `#cf6656` (suave `#fcf1ef`) → dores/riscos, alertas sanitários, impacto humano.

### 4.2 Tipografia e Hierarquia
- **Títulos e corpo:** `Plus Jakarta Sans` (pesos 400, 500, 600, 700, 800), com `h1` em `clamp(2.6rem, 4.4vw, 4rem)` e destaque em gradiente clínico (`h1 span`), `h2` em `clamp(1.7rem, 2.8vw, 2.3rem)`.
- **Códigos, protocolos e dados técnicos:** `JetBrains Mono` (pesos 500, 700, 800) para `LF-2026-XXXXXX`, normas (`RDC 171/2006`), badges numéricos e cronômetro.
- **Estilo dos títulos:** curtos, diretos e orientados a valor (máximo de 1 linha em desktop), sempre precedidos por 1 ou 2 badges pill de contexto e seguidos por 1 subtítulo de no máximo 2 linhas.

### 4.3 Componentes, Ativos e Interações Mantidos
- Cards com topo colorido de `3.5px` (`.card-top-pine`, `.card-top-cold`, `.card-top-coral`), `border-radius: 16px` e hover discreto (`translateY(-2px)`).
- Grid da equipe com avatares em iniciais (`.team-grid` / `.team-badge-icon`).
- Imagens reais já existentes em `public/` (`hero_banner.jpg`, `doacao_leite.jpg`, `coleta_domiciliar.jpg`, `uti_neonatal.jpg` e logos oficiais `logo-circle-white.png` / `logo-horizontal.png`) sempre dentro de `.img-box` com `object-position` seguro (sem cortes em rostos).
- Transição suave entre slides (`opacity` + `scale(0.97 -> 1)` em `0.4s cubic-bezier(0.16, 1, 0.3, 1)`), barra de progresso superior, toggle Claro/Escuro (`T`), cronômetro de 5 min (`P`), barra inferior flutuante com dots clicáveis e responsividade completa com *touch swipe* no celular.

---

## 5. Principais Informações que Merecem Destaque

1. **O problema real e sua relevância em saúde pública:** leite humano doado nutre recém-nascidos prematuros e de baixo peso em UTI Neonatal (referência oficial do Ministério da Saúde / rBLH-BR: **1 litro pode atender até 10 bebês por dia**, conforme prescrição clínica). Qualquer falha de identificação, validade ou triagem significa descarte ou risco assistencial.
2. **Visão ponta a ponta integrada em 5 elos reais:** Captação Digital → Triagem Clínica Go/No-Go → Roteirização & Coleta → Etiquetagem Óptica Real → Laboratório & Dispensação UTI.
3. **Rigor sanitário e jurídico embutido no código:** regras da **RDC ANVISA nº 171/2006** (validade de 15 dias contada da 1ª ordenha, Acidez Dornic `≤ 8,0 °D`, bloqueio da etiqueta de UTI antes da pasteurização, anonimização da doadora na UTI) e **LGPD** (RBAC com 4 perfis, projeção de dados no servidor, QR Code sem dados pessoais, trilha de auditoria).
4. **Software real rodando de ponta a ponta (Full-Stack):** não é uma maquete de telas — possui API Fastify + Prisma + PostgreSQL/SQLite, otimização de rotas (2-opt), código de barras/QR escaneáveis, exportação ZPL e testes automatizados.
5. **A própria demonstração ao vivo** como principal prova de valor para a banca.

---

## 6. Conteúdos que Devem Ser Descartados ou Reduzidos

| Conteúdo do Pitch Antigo | Decisão | Motivo |
|---|---|---|
| **Métricas não comprovadas (`-35% trajeto`, `Desperdício Zero`, `< 1 min`, `100% segurança`)** | **Descartar** | Não há medição empírica em campo; apresentar estimativas como fatos reduz credibilidade perante uma banca técnica. |
| **Slide dedicado a explicar fórmula de distância, fator viário e detalhes de código (antigo Slide 4)** | **Reduzir drasticamente** | Em 5 minutos com foco na demo, a banca não precisa de aula de algoritmo; basta citar a arquitetura real e os 3 diferenciais em 1 faixa concisa. |
| **Mockups estáticos de tela do coletor e etiqueta (antigo Slide 5)** | **Descartar** | A banca verá a tela real de coleta e a etiqueta óptica real funcionando ao vivo segundos depois — mockup estático vira redundância. |
| **Slide inteiro de "3 Pilares do MVP" (antigo Slide 3)** | **Consolidar** | Repetia o Slide 2; seus pontos essenciais serão integrados em um único diagrama limpo da jornada completa. |
| **Roadmap desatualizado (antigo Slide 6 citando Laboratório e UTI como futuro)** | **Corrigir e condensar** | Laboratório, UTI e cadastro sanitário já estão prontos; próximos passos reais (PWA offline, Bluetooth portátil, homologação com o BLH) cabem em um bloco enxuto no encerramento. |
| **Lista exaustiva de todos os campos de formulário e endpoints** | **Descartar** | Evita transformar o pitch em documentação técnica. |

---

## 7. Estrutura Narrativa Recomendada

A narrativa segue uma progressão executiva em **3 atos fluidos** ao redor da demonstração:

1. **Contexto e Engajamento (1 min 35 s — Slides 1 a 3):** Quem somos → Qual dor crítica resolvemos e por que importa → Como a plataforma resolve de ponta a ponta com diferenciais reais de engenharia e segurança sanitária.
2. **Prova Prática ao Vivo (3 min 00 s — Slide 4 de ponte + Demonstração Real):** Conduzimos a banca pelo ciclo de vida real de uma doação e de um frasco no sistema em produção, deixando o software provar cada afirmação feita nos slides.
3. **Síntese de Valor e Fechamento (25 s — Slide 5):** Consolidamos o impacto público entregue hoje, os próximos passos realistas de implantação e abrimos para perguntas com clareza e segurança.

---

## 8. Quantidade de Slides Recomendada e Justificativa

### Recomendação: **5 Slides** (4 antes da demonstração + 1 após a demonstração)

**Justificativa estratégica baseada no projeto e no limite de 5 minutos:**
- Se **mais da metade do tempo (2 min 45 s = 55%)** é reservada à demonstração prática, restam **2 min 15 s (135 segundos)** para os slides.
- Com **8 slides** (modelo antigo), cada slide teria em média apenas ~16 segundos — ritmo apressado, superficial e cansativo.
- Com **3 slides**, faltaria fôlego visual para separar a dor/relevância da arquitetura da solução e criar uma transição limpa para a demo.
- Com **5 slides**, cada tela cumpre **uma única missão narrativa insubstituível**, mantém pouquíssimo texto por slide (leitura em menos de 5 segundos pela banca), respeita a cadência ideal de ~20 a 40 segundos por slide e coloca a demonstração prática como o grande clímax da apresentação.

---

## 9. Objetivo e Conteúdo de Cada Slide

### Slide 1 — Capa Oficial & Equipe
- **Objetivo:** Posicionar o projeto com autoridade institucional, esclarecer o escopo atual (não mais apenas um MVP de coleta, mas uma plataforma integrada) e apresentar a equipe de 6 integrantes.
- **Conteúdo:**
  - Badges: `LEITFLOW` · `Banco de Leite Humano · Marília – SP`.
  - Título: **LEITFLOW**
  - Subtítulo: *Gestão logística, clínica e rastreabilidade ponta a ponta para o Banco de Leite Humano de Marília.*
  - Referência institucional: Hospital Materno Infantil de Marília – SP.
  - Grid dos 6 integrantes e suas frentes de atuação:
    1. Gabriel Neves de Lazari
    2. Felipe Tenório Rodrigues
    3. Vinicius Fachini
    4. Rafael Garbelini
    5. Adelmo Henrique
    6. Miguel Rodrigues

### Slide 2 — O Problema e Por Que Ele Importa
- **Objetivo:** Responder rapidamente *qual problema o LEITFLOW resolve* e *por que esse problema é crítico* para a saúde neonatal.
- **Conteúdo:**
  - **Relevância (dado oficial rBLH-BR / Ministério da Saúde):** 1 litro de leite humano pode atender até 10 recém-nascidos prematuros ou de baixo peso por dia, conforme prescrição clínica.
  - **4 dores reais do modelo manual/fragmentado:**
    1. **Captação e triagem manuais:** fichas em papel e conferência manual de sorologias atrasam a habilitação de novas doadoras.
    2. **Logística urbana sem roteirização:** visitas espalhadas pelas regiões de Marília aumentam tempo de deslocamento e esforço operacional.
    3. **Identificação frágil:** etiquetas manuscritas podem borrar na umidade do congelamento, comprometendo a rastreabilidade e levando ao descarte.
    4. **Cadeia desconectada:** falta vínculo digital contínuo entre coleta domiciliar, laboratório (pasteurização) e dispensação para a UTI Neonatal.
  - **Frase-síntese de impacto:** *"Quando falta rastreabilidade, perde-se leite humano — e perde-se cuidado para bebês prematuros."*

### Slide 3 — A Solução LEITFLOW: Jornada Ponta a Ponta & Diferenciais
- **Objetivo:** Mostrar em uma única visão clara *qual solução foi desenvolvida*, *como ela funciona* e *quais são seus diferenciais técnicos e sanitários*.
- **Conteúdo:**
  - **Fluxo visual em 5 etapas reais integradas (horizontal):**
    1. **Captação Digital** (`/quero-doar` + consentimento LGPD)
    2. **Triagem Go / No-Go** (sorologias fail-safe + validação CPF/CNS)
    3. **Roteirização & Coleta** (zonas de Marília + 2-opt + multi-frasco + 1ª ordenha)
    4. **Etiquetagem Óptica** (Code 128 + QR ISO sem PII + ZPL `60×40mm`)
    5. **Laboratório & UTI** (Acidez Dornic `≤ 8°D`, pasteurização, dispensação anônima)
  - **3 Diferenciais Concretos (em 3 cards compactos na base):**
    - **Conformidade RDC 171/2006 no código:** validade de 15d a partir da 1ª ordenha, bloqueio automático da etiqueta de UTI antes da pasteurização e imutabilidade pós-confirmação.
    - **Privacidade LGPD & RBAC:** 4 perfis de acesso com projeção de dados no servidor (coletor de campo não vê CPF, CNS nem laudos sensíveis) + trilha de auditoria.
    - **Arquitetura Full-Stack Real:** React 18 + TypeScript + Fastify 5 + Prisma + PostgreSQL/SQLite, API OpenAPI (`/docs`) e suíte de testes automatizados.

### Slide 4 — Roteiro da Demonstração Prática (Ponte para o Ao Vivo)
- **Objetivo:** Preparar a banca para acompanhar a demonstração sem se perder e servir como painel de lançamento imediato do sistema real.
- **Conteúdo:**
  - Título: **LEITFLOW na Prática: Do Interesse à UTI Neonatal**
  - **Mapa rápido dos 5 momentos da demonstração (stepper limpo):**
    1. Portal público & captação (`/` e `/quero-doar`)
    2. Painel operacional & triagem clínica (`/dashboard` e `/doadoras`)
    3. Rota otimizada, mapa & coleta multi-frasco (`/rotas` e `/mapa`)
    4. Etiqueta óptica real & bloqueio sanitário UTI (`/etiquetas`)
    5. Análise laboratorial, pasteurização & dispensação (`/laboratorio`)
  - **Barra de ação interativa (evolução do banner do pitch antigo):**
    - Botão primário destacado: **`▶ Abrir LEITFLOW ao Vivo`** (`https://leite-flow-banco-leite-marilia.vercel.app`)
    - Botão secundário: **`Código-Fonte no GitHub`** (`https://github.com/lazari-gabriel/LEITE-FLOW-banco-leite-marilia`)

### Slide 5 — Valor Entregue, Próximos Passos & Encerramento
- **Objetivo:** Consolidar o valor público/sanitário entregue hoje, mostrar maturidade de produto com próximos passos realistas (sem prometer o que não existe) e encerrar com elegância abrindo espaço para a banca.
- **Conteúdo:**
  - **Valor Entregue Hoje (3 pilares qualitativos sólidos):**
    - **Segurança Sanitária:** rastreabilidade individual do frasco e travas automáticas contra erro humano.
    - **Eficiência Operacional:** fluxo contínuo da captação ao estoque real de vidros, reduzindo retrabalho manual.
    - **Proteção de Dados & Transparência:** LGPD aplicada por perfil e histórico auditável das operações críticas.
  - **Próximos Passos Planejados (honestos e realistas):**
    - Modo **PWA offline** para áreas com sinal instável + integração direta com **impressora térmica Bluetooth** na van.
    - Telas administrativas dedicadas de **Auditoria** e **Gestão de Frota/Equipe** (endpoints já prontos na API).
    - **Validação física** de etiquetas 60×40mm e **homologação operacional** junto à equipe do BLH Marília.
  - **Fechamento:** Frase de assinatura (*"Cada gota importa. Tecnologia a serviço da vida."*) + nome dos 6 integrantes + badge **`Obrigado! Aberto às perguntas da banca.`**

---

## 10. Sugestões Visuais para Cada Slide

| Slide | Layout Recomendado (Padrão `pitch.html`) | Elementos Visuais & Assets Reais |
|---|---|---|
| **Slide 1 — Capa & Equipe** | Mesmo cabeçalho dividido do Slide 1 antigo (esquerda: badges + `h1` gradiente + subtítulo; direita: `.img-box` hero) + `.team-grid` 3×2 abaixo. | Incorporar o logo oficial (`logo-circle-white.png` / `logo-horizontal.png`) discretamente ao lado da marca + `hero_banner.jpg` no card direito. |
| **Slide 2 — Problema & Relevância** | Grid 2 colunas assimétrico (`1.35fr 1fr`): à esquerda, card destaque do dado rBLH-BR + card `.card-top-coral` com as 4 dores em `.pill-list`; à direita, foto vertical humanizada em `.img-box`. | Reaproveitar `doacao_leite.jpg` (com `object-position: center 15%`, sem cortes) + legenda sutil `"Apoio ao Banco de Leite Humano · Marília – SP"`. |
| **Slide 3 — Solução & Diferenciais** | Layout em 2 faixas verticais: no topo, **diagrama horizontal limpo em 5 nós conectados por setas** (cores semânticas: pine → cold → pine → cold → coral/pine); na base, `.grid-3` com os 3 cards de diferenciais (`.card-top-pine`, `.card-top-cold`, `.card-top-coral`). | Diagrama vetorial limpo em HTML/CSS/SVG (estilo pipeline de produto, leitura em 5 segundos) + `code-pill` apenas para `RDC 171/2006`, `2-opt`, `ZPL` e `LGPD`. Zero paredes de texto. |
| **Slide 4 — Ponte para Demo** | Layout focado e respirado: stepper horizontal/vertical com os 5 passos da demo + `.img-box` lateral com `coleta_domiciliar.jpg` (`center 18%`) + `.action-banner` em destaque na base com os 2 botões clicáveis. | Preservar e destacar o `.action-banner` com botão verde-esmeralda (`▶ Abrir LEITFLOW ao Vivo`) e botão secundário (`GitHub`). Indicar visualmente o perfil usado na demo (ex.: Coordenação / Admin). |
| **Slide 5 — Valor, Futuro & Encerramento** | Topo: 2 cards lado a lado (`.grid-2`) — esquerda `.card-top-pine` ("Valor Entregue Hoje") e direita `.card-top-cold` ("Próximos Passos Reais"). Base: bloco centralizado de encerramento com frase de impacto, os 6 nomes em linha/grid compacto e badge de perguntas. | Opcionalmente incluir miniatura discreta de `uti_neonatal.jpg` ou manter foco tipográfico limpo para não poluir o slide de fechamento. |

---

## 11. Distribuição do Tempo (Total: 5 Minutos / 300 Segundos)

| Etapa | Slide / Tela | Duração | % do Tempo | Faixa Acumulada | Foco Principal |
|---|---|---:|---:|---|---|
| **1. Abertura** | Slide 1 — Capa & Equipe | 20 s | 6,7% | `0:00 – 0:20` | Identidade do projeto, instituição e equipe |
| **2. Contexto & Dor** | Slide 2 — Problema e Relevância | 35 s | 11,7% | `0:20 – 0:55` | Por que o problema importa e gargalos manuais |
| **3. Solução & Diferenciais** | Slide 3 — Jornada & Diferenciais | 40 s | 13,3% | `0:55 – 1:35` | Fluxo em 5 elos + travas sanitárias/LGPD + Full-Stack |
| **4. Transição** | Slide 4 — Ponte para Demo | 15 s | 5,0% | `1:35 – 1:50` | Alinhar o que a banca vai ver e abrir a aplicação |
| **5. Demo — Ato 1** | `/` e `/quero-doar` (Público) | 25 s | 8,3% | `1:50 – 2:15` | Portal institucional e captação digital de doadoras |
| **6. Demo — Ato 2** | `/dashboard` e `/doadoras` | 35 s | 11,7% | `2:15 – 2:50` | KPIs reais, fila de captação e triagem Go/No-Go |
| **7. Demo — Ato 3** | `/rotas` e `/mapa` (+ Coleta) | 45 s | 15,0% | `2:50 – 3:35` | Otimização 2-opt, mapa de Marília e coleta multi-frasco |
| **8. Demo — Ato 4** | `/etiquetas` | 30 s | 10,0% | `3:35 – 4:05` | Code 128/QR real, confirmação imutável, ZPL e trava UTI |
| **9. Demo — Ato 5** | `/laboratorio` | 30 s | 10,0% | `4:05 – 4:35` | Acidez Dornic, pasteurização, dispensação UTI e estoque |
| **10. Encerramento** | Slide 5 — Valor, Futuro & Fechamento | 25 s | 8,3% | `4:35 – 5:00` | Síntese de valor, próximos passos reais e perguntas |
| **TOTAL** | **5 Slides + 5 Atos ao Vivo** | **5 min 00 s** | **100%** | **`0:00 – 5:00`** | **Slides: 2 min 15 s (45%) · Demo ao vivo: 2 min 45 s (55%)** |

> **Observação de ritmo:** Se a banca demonstrar interesse especial em alguma tela durante a demo, os 15s de transição e a abertura podem ser comprimidos levemente, preservando sempre pelo menos 20s para o encerramento limpo no Slide 5.

---

## 12. Sequência da Demonstração Prática (2 min 45 s)

A sequência foi desenhada para seguir **o caminho real do leite humano** usando os **próprios redirecionamentos nativos do sistema**, evitando navegação desnecessária:

### Pré-requisitos (5 minutos antes da banca)
- Abrir previamente a URL da aplicação (`https://leite-flow-banco-leite-marilia.vercel.app`) para evitar *cold start* da API no Render Free.
- Confirmar que o banco de demonstração está populado (ex.: com dados realistas de Marília como no `seed-demo.ts`, incluindo ao menos 1 solicitação em Captação, 1 rota ativa com parada pendente e frascos em diferentes status).
- Deixar a **Aba 1** no pitch (`pitch.html`) e a **Aba 2** na página inicial (`/`) do LEITFLOW — e ter o login do perfil `COORDENADOR_BLH` ou `ADMIN` pronto no gerenciador/área de transferência (sem expor senhas sensíveis se estiver gravando).

### Fluxo Passo a Passo (Zero Zigue-Zague)

1. **Ato 1 — Porta de Entrada Pública & Captação (`/` → `/quero-doar` → `/login`) — 25 s**
   - Mostrar o topo institucional do LEITFLOW e rolar brevemente para evidenciar o caráter acolhedor para mães de Marília.
   - Clicar em **"Quero ser doadora"** (`/quero-doar`): destacar que a mãe informa apenas contato, bairro e consentimento LGPD — sem expor exames clínicos na etapa pública — gerando um protocolo para a equipe.
   - Clicar em **"Acessar sistema"** (`/login`): destacar a tela restrita com 4 perfis RBAC e entrar como Coordenação/Admin.

2. **Ato 2 — Painel Operacional & Doadoras (`/dashboard` → `/doadoras`) — 35 s**
   - Em **Painel Geral** (`/dashboard`): apontar os KPIs 100% reais (doadoras aptas, frascos, volume, conformidade térmica), os alertas reais (validade 15 dias, sorologias pendentes) e o funil vivo da cadeia de custódia.
   - Clicar no atalho de **Captação** ou ir para **Doadoras & Triagem** (`/doadoras`): mostrar rapidamente a aba **Captação de Doadoras** (onde chegam os protocolos do site para conversão em 1 clique) e a aba **Doadoras Cadastradas** (evidenciando os vereditos Go/No-Go `Apta`, `Pendente` e `Inapta` e o **Perfil 360°**).

3. **Ato 3 — Roteirização, Mapa & Registro de Coleta (`/rotas` → `/mapa` → `ColetaModal`) — 45 s**
   - Ir para **Rotas de Coleta** (`/rotas`): mostrar as rotas da semana por zona de Marília e, em **Montar Paradas**, destacar o botão de otimização automática (**Nearest Neighbor + 2-opt**).
   - Abrir **Mapa da Região** (`/mapa`) por 10 segundos: mostrar os pontos geocodificados em Marília e o traçado viário saindo e retornando ao Hospital Materno Infantil.
   - Ainda no mapa (ou na aba **Executar Coletas**), clicar em uma parada pendente e abrir o modal de coleta: registrar um frasco com seleção rápida de volume, temperatura da caixa e **Data da 1ª Ordenha** (mostrando o cálculo automático da validade de 15 dias) e finalizar — **o sistema redireciona automaticamente para `/etiquetas`!**

4. **Ato 4 — Etiquetagem Óptica Real & Trava Sanitária (`/etiquetas`) — 30 s**
   - No frasco recém-registrado (`LF-2026-XXXXXX`), mostrar o preview 1:1 com **Code 128 real** e **QR Code ISO real sem PII** (privacidade LGPD).
   - Destacar que antes da confirmação o coletor ainda pode corrigir um erro de digitação (`Editar Dados`), mas ao clicar em **"Confirmar Etiqueta"**, o registro fica **bloqueado/imutável** e gera histórico auditado de emissão (além da opção **Arquivo térmico ZPL** para Zebra/Argox/Elgin).
   - Trocar o seletor de modelo para **`3. UTI Neonatal (Anônimo)`**: mostrar ao vivo o **Bloqueio Sanitário (RDC 171/2006)** impedindo emitir etiqueta de UTI para leite ainda não pasteurizado — e clicar no próprio botão **`Ir para Laboratório BLH`**!

5. **Ato 5 — Laboratório BLH, Pasteurização & Dispensação UTI (`/laboratorio`) — 30 s**
   - Em **Laboratório & Frascos** (`/laboratorio`), apontar no topo os 4 cartões reais do **estoque patrimonial de frascos de vidro** (hospital vs. com doadoras vs. taxa de retorno).
   - Na tabela de Cadeia de Custódia, clicar em **"Analisar"** em um frasco em triagem: mostrar a validação de **Acidez Dornic (`≤ 8,0 °D`)**, **Crematócrito (`Kcal/L`)** e cultura microbiológica, liberando como **`Pasteurizado` (validade +6 meses)**.
   - Clicar em **"UTI"** no frasco pasteurizado (ou em um já pronto) e registrar a dispensação para um leito/receptor — destacando que o nome da doadora fica **anonimizado** na etiqueta final, fechando o ciclo completo do frasco.

---

## 13. Roteiro de Fala (Natural, Objetivo e Alinhado aos 5 Minutos)

> *Ritmo pensado para fala natural (~135 palavras/min), sem leitura mecânica de slides. Use os slides como apoio visual enquanto olha para a banca.*

### Slide 1 — Capa & Equipe (`0:00 – 0:20`)
> "Boa tarde, banca. Nós somos a equipe do **LEITFLOW** — Gabriel, Felipe, Vinicius, Rafael, Adelmo e Miguel. Desenvolvemos uma plataforma full-stack para apoiar a gestão logística, clínica e a rastreabilidade do **Banco de Leite Humano de Marília**, vinculado ao Hospital Materno Infantil."

### Slide 2 — O Problema e Por Que Ele Importa (`0:20 – 0:55`)
> "Por que esse tema é tão sensível? Segundo o Ministério da Saúde e a Rede Brasileira de Bancos de Leite Humano, **um único litro de leite humano doado pode alimentar até dez recém-nascidos prematuros por dia**.  
> Só que, na rotina real de um Banco de Leite, quando o controle depende de fichas em papel, rotas sem agrupamento e etiquetas preenchidas à mão que borram no congelamento, acontecem três problemas graves: demora para habilitar novas doadoras, esforço logístico desnecessário na cidade e risco de perda de rastreabilidade — que obriga o descarte de um leite precioso."

### Slide 3 — A Solução & Diferenciais (`0:55 – 1:35`)
> "Para resolver isso, construímos o **LEITFLOW** tratando **o frasco como entidade central rastreável** em cinco etapas conectadas: começamos na **captação digital** de mães interessadas; passamos pela **triagem clínica Go/No-Go** com conferência de sorologias; organizamos a **roteirização por zonas de Marília** com otimização de paradas e coleta multi-frasco; emitimos **etiquetas ópticas reais** em padrão 60 por 40 milímetros; e fechamos no **laboratório até a dispensação na UTI Neonatal**.  
> Tudo isso rodando sobre uma arquitetura full-stack real — React, Fastify, Prisma e PostgreSQL — com regras da **RDC 171 da ANVISA** e da **LGPD** aplicadas direto no código."

### Slide 4 — Transição para a Demo (`1:35 – 1:50`)
> "Mais importante do que falar sobre o sistema é mostrar ele funcionando. Nos próximos dois minutos e meio, vamos percorrer ao vivo o caminho completo de uma doação — da página pública até a liberação para a UTI Neonatal."  
> *(Clica em **`▶ Abrir LEITFLOW ao Vivo`** / alterna para a aba do sistema.)*

### Demonstração Prática ao Vivo (`1:50 – 4:35`)
- **Ato 1 — Portal Público & Captação (`1:50 – 2:15`):**
  > "Esta é a porta de entrada pública do LEITFLOW. Uma mãe de Marília que deseja doar encontra orientações claras e clica em **Quero ser doadora**. Reparem que, por LGPD, aqui ela informa apenas contato e bairro — nenhum exame clínico é exposto na internet. O sistema gera um protocolo e envia essa interessada para a fila da equipe. Agora entro na área restrita, protegida por autenticação e quatro perfis de acesso."
- **Ato 2 — Painel Operacional & Doadoras (`2:15 – 2:50`):**
  > "No **Painel Operacional**, todos os números vêm direto do banco de dados: doadoras aptas, frascos coletados, alertas reais de validade de 15 dias e o funil da cadeia de custódia. Em **Doadoras e Triagem**, a coordenação acompanha a aba de **Captação**, onde pode converter a interessada em cadastro oficial com um clique, e gerencia a triagem **Go/No-Go**: por segurança, toda sorologia nasce como *pendente* — ninguém entra em rota sem liberação."
- **Ato 3 — Roteirização, Mapa & Coleta (`2:50 – 3:35`):**
  > "Em **Rotas de Coleta**, organizamos as visitas por zona de Marília, de segunda a sexta. O backend otimiza automaticamente a ordem das paradas com algoritmo *Nearest Neighbor* e refinamento *2-opt*, refletido aqui no **Mapa da Região** com saída e retorno no hospital. Quando o coletor chega na casa, registra um ou vários frascos de uma vez, informa volume, temperatura e a **data da primeira ordenha** — que é o marco real da ANVISA para a validade de 15 dias. Ao salvar, o sistema já abre a etiquetagem."
- **Ato 4 — Etiquetagem Óptica & Trava Sanitária (`3:35 – 4:05`):**
  > "Aqui está o frasco com código único sequencial, **Code 128 real** e **QR Code ISO** sem nenhum dado pessoal exposto — protegendo a doadora. Antes de confirmar, ainda é possível corrigir um dado; depois de **Confirmar Etiqueta**, o registro fica bloqueado para auditoria e pode ser impresso em 60 por 40 milímetros, em lote A4 ou exportado em **ZPL** para impressora térmica. E olhem esta trava sanitária: se eu tentar emitir a **Etiqueta 3 de UTI Neonatal** agora, o sistema **bloqueia automaticamente**, porque o leite ainda não foi pasteurizado."
- **Ato 5 — Laboratório & Dispensação UTI (`4:05 – 4:35`):**
  > "Clicando direto para o **Laboratório**, vemos o estoque real de frascos de vidro e a cadeia de custódia. Ao clicar em **Analisar**, o técnico registra **Acidez Dornic** — que bloqueia aprovação acima de 8 graus Dornic —, o **Crematócrito** e a cultura microbiológica. Aprovado como **Pasteurizado**, a validade passa automaticamente para seis meses e o botão **UTI** é liberado para dispensação com a doadora anonimizada, fechando toda a rastreabilidade."

### Slide 5 — Valor, Próximos Passos & Encerramento (`4:35 – 5:00`)
> *(Retorna à aba da apresentação e avança para o Slide 5.)*  
> "Em resumo, o LEITFLOW já entrega hoje uma base concreta de **segurança sanitária**, **eficiência operacional** e **conformidade com a LGPD** para o Banco de Leite de Marília. Como próximos passos reais de evolução, planejamos modo PWA offline, impressão Bluetooth portátil na van, painéis administrativos dedicados de auditoria e a validação prática junto à equipe do hospital.  
> Porque no cuidado neonatal, **cada gota importa**. Muito obrigado, e ficamos à disposição para as perguntas da banca."

---

## 14. Transições Entre Apresentação e Demonstração

### 14.1 Mecânica de Transição Sem Atrito
1. **Saída do Slide 4 para a Demo:**
   - **Opções:** Clicar diretamente no botão **`▶ Abrir LEITFLOW ao Vivo`** do Slide 4 (abre em nova aba mantendo o pitch estacionado no Slide 4) **ou** usar `Ctrl + Tab` para uma aba já pré-carregada e autenticada/aquecida.
   - **Recomendação:** Deixar a aba do LEITFLOW **já aberta e testada antes da apresentação** (evita espera de carregamento ou *cold start* diante da banca), mantendo o botão no Slide 4 como atalho elegante e prova de transparência para quem acessar o pitch depois.
2. **Retorno da Demo para o Slide 5:**
   - Assim que concluir a dispensação no Laboratório, fechar o modal de sucesso, dar `Ctrl + Shift + Tab` de volta ao pitch e pressionar `→` (ou Espaço) para cair direto no **Slide 5 (Valor, Próximos Passos & Encerramento)**.
3. **Uso do Cronômetro Integrado:**
   - Iniciar o cronômetro de 5 minutos (`P`) no Slide 1. Ao bater no Slide 4, o ideal é o cronômetro marcar entre **`03:15` e `03:05` restantes** — sinal claro de que há tempo confortável para toda a demo e fechamento.

### 14.2 Plano de Contingência Técnica (Segurança na Hora H)
- **Aquecimento da API (Render Free):** Abrir `/health` ou a home + fazer 1 login 5 minutos antes da banca para garantir que o container do backend já esteja acordado.
- **Fallback local:** Manter o ambiente local (`backend` + `frontend` rodando em `localhost:3000` com `seed-demo.ts` populado) como plano B imediato caso o Wi-Fi da sala oscile.
- **Não desperdiçar tempo digitando formulários longos ao vivo:** Usar dados já cadastrados pelo seed de demonstração para mostrar Doadoras, Rotas e Laboratório; executar ao vivo apenas 1 ação rápida de coleta (3 cliques) + confirmação de etiqueta + 1 análise laboratorial.

---

## 15. Cuidados Para Não Apresentar Informações Incorretas

Esta lista protege a equipe contra perguntas difíceis ou contradições durante a arguição da banca:

1. **Nunca citar estatísticas não medidas em campo:**
   - **Não dizer:** "reduzimos 35% da quilometragem da van", "zeramos 100% dos descartes" ou "cada coleta leva menos de 1 minuto".
   - **Dizer corretamente:** o sistema *otimiza o sequenciamento das paradas* (Nearest Neighbor + 2-opt), *reduz o risco de descarte por identificação ilegível* com etiquetas térmicas/ópticas e *agiliza o registro em campo*. O único número de impacto em saúde que deve ser citado é o referencial oficial do **Ministério da Saúde / rBLH-BR** (*"1 litro de leite humano pode atender até 10 recém-nascidos prematuros por dia, conforme prescrição clínica"*).
2. **Não prometer como implementado o que está apenas planejado:**
   - **Não existe hoje:** funcionamento 100% offline (PWA/IndexedDB), pareamento Bluetooth ESC/POS com impressora portátil na van, sensores IoT automáticos de temperatura na caixa térmica, aplicativo/portal autenticado para a doadora rastrear a van ou receber notificações de impacto, nem testes físicos realizados em impressora Zebra/Argox real.
   - **Como responder se perguntarem:** assumir com segurança técnica — *"a geração de código de barras real, QR Code ISO e arquivo ZPL 60×40mm já está pronta no sistema; a homologação em impressora física, o modo PWA offline e a integração Bluetooth são a próxima etapa de implantação"*.
3. **Diferenciar o que existe na API vs. na UI administrativa:**
   - `AuditLog` grava eventos reais no banco e há endpoints `GET /api/v1/audit-logs` e `GET /api/v1/fleet`, mas as telas CRUD dedicadas de Auditoria e Frota/Equipe ainda não foram criadas no frontend. Não afirmar que há um painel visual de logs de auditoria — dizer corretamente que *a trilha de auditoria já é persistida no banco e exposta na API (e pode ser conferida no Swagger `/docs`)*.
4. **Clareza sobre temperatura na coleta:**
   - O sistema atual **registra e valida** a temperatura informada pelo coletor (`≤ -10 °C`), exibindo alertas reais de desvio térmico no dashboard e no laboratório. Deixar claro que a aferição é feita pela equipe e digitada no sistema — **não** vem de telemetria IoT automática.
5. **Alinhar nomenclatura e endereço institucional antes da banca:**
   - **Nome do projeto:** padronizar **`LEITFLOW`** na nova apresentação (explicando, se necessário, que a marca evoluiu de `LEITE FLOW` nos módulos internos/repositório para `LEITFLOW` na identidade institucional).
   - **Endereço do BLH Marília:** há divergência no código atual entre `PublicHomePage.tsx` (`Rua XV de Novembro, nº 50` — endereço tradicional do BLH Marília) e `src/constants/blh.ts` (`Rua São Luiz, 375`). Na apresentação, referir-se ao **Banco de Leite Humano / Hospital Materno Infantil de Marília – SP** e conferir com a equipe qual endereço citar caso a banca pergunte.
6. **Não afirmar que o sistema já está em produção oficial no hospital:**
   - Posicionar com honestidade e maturidade: trata-se de uma **plataforma funcional completa em ambiente de demonstração/validação**, estruturada com base na RDC ANVISA nº 171/2006 e na LGPD, pronta para validação operacional e homologação junto à equipe do BLH de Marília.
7. **Geocodificação e traçado de ruas:**
   - Explicar com transparência que o projeto utiliza serviços abertos (**Nominatim/OpenStreetMap** para geocodificação com validação da região de Marília e **OSRM** para traçado viário) com fallback seguro por zona em caso de indisponibilidade externa.
