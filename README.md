# LEITE FLOW — Gestão Logística, Clínica e Rastreabilidade do BLH Marília

[![React 18](https://img.shields.io/badge/React-18.3.1-blue.svg)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue.svg)](https://www.typescriptlang.org/)
[![Fastify](https://img.shields.io/badge/Fastify-5-000000.svg)](https://fastify.dev/)
[![Prisma](https://img.shields.io/badge/Prisma-6-2D3748.svg)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Online_Ready-336791.svg)](https://www.postgresql.org/)

> Plataforma full-stack para triagem clínica de doadoras (RDC ANVISA nº 171/2006), roteirização urbana com otimização 2-opt, coleta domiciliar multi-frasco, etiquetagem óptica real (Code 128 + QR Code ISO/IEC 18004 + ZPL 60×40mm), processamento laboratorial e rastreabilidade completa até a UTI Neonatal do **Hospital Materno Infantil de Marília – SP**.

---

## Principais Módulos Implementados

1. **Autenticação, RBAC e Auditoria (LGPD)**
   - Login com senhas em hash `scrypt` + JWT de acesso + Refresh Token rotativo em cookie `HttpOnly`.
   - 4 perfis de acesso (`ADMIN`, `COORDENADOR_BLH`, `COLETOR_CAMPO`, `LABORATORIO`) com projeção LGPD no servidor (coletores de campo não recebem CPF, Cartão SUS nem laudos clínicos sensíveis).
   - Trilha imutável de auditoria (`AuditLog`) e headers HTTP de segurança.
2. **Doadoras & Triagem Go / No-Go**
   - Validação de CPF, Cartão SUS (CNS 15 dígitos), telefone, coerência de datas e anti-duplicidade.
   - Sorologias com padrão fail-safe (`pendente`), avaliação de hepatite e carência exata de 12 meses (365 dias) para tatuagem/transfusão.
   - Geocodificação real de endereço (`/api/v1/geo/geocode`) e **Perfil 360° da Doadora** com histórico completo de coletas e frascos.
3. **Roteirização Multi-Veículo, Coletas Recorrentes e Mapa**
   - Entidade `CollectionVisit` suportando coletas semanais recorrentes e múltiplos frascos (`1:N`) por visita com **Data da 1ª Ordenha** obrigatória.
   - Otimização **Nearest Neighbor + 2-opt** no backend, verificação de capacidade térmica da van e mapa Leaflet multi-rota sem XSS.
4. **Etiquetagem Óptica Real (RDC 171/2006)**
   - **Code 128 real** (`jsbarcode`) + **QR Code real ISO/IEC 18004** (`qrcode`) com payload opaco sem PII (`LF1:LF-2026-XXXXXX`).
   - Layout térmico `60×40mm`, lote em folha A4 e exportação **ZPL II** nativa para Zebra/Argox/Elgin.
   - Bloqueio sanitário da Etiqueta 3 (UTI Neonatal) enquanto o leite não for pasteurizado e aprovado; histórico de vias, motivo obrigatório para reimpressão e anulação auditada.
5. **Laboratório BLH, Estoque Patrimonial e Dashboard Operacional**
   - Lançamento real de Acidez Dornic (`≤ 8,0 °D`), Crematócrito (`Kcal/L`), pasteurização, descarte e dispensação anonimizada para UTI.
   - Estoque real de frascos de vidro baseado em ledger (`GlassInventoryMovement`) e painel operacional com alertas reais (validade 15d, desvios térmicos, sorologias pendentes).

---

## Como Executar Localmente

```bash
# Terminal 1 — Backend API (porta 3333, SQLite local + Swagger em /docs)
cd backend
npm install
npm run db:setup
npm run dev

# Terminal 2 — Frontend React (porta 3000, proxy automático /api -> :3333)
npm install
npm run dev
```

Acesse `http://localhost:3000` (Documentação OpenAPI em `http://localhost:3333/docs`).

## Testes Automatizados e Build

```bash
# Testes unitários do Frontend + Build de produção
npm test
npm run build

# Testes de integração do Backend (Auth, RBAC, DB, Etiquetas, Lab, Rotas) + Build
npm run test:api
npm --prefix backend run build
```

## Deploy Online (Vercel + Render + PostgreSQL)

O projeto inclui `render.yaml`, `backend/Dockerfile` (com conversão automática para PostgreSQL) e `vercel.json`. Consulte o passo a passo em **[docs/deploy-online.md](docs/deploy-online.md)**.
