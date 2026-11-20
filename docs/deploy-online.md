# Guia de Deploy Online — LEITE FLOW (Vercel + Render + PostgreSQL)

O projeto está estruturado para rodar **imediatamente em desenvolvimento local** (com SQLite) e subir **100% online em produção** com **PostgreSQL gerenciado**, sem alterar uma única linha de regra de negócio.

---

## Arquitetura Online Recomendada

| Camada | Serviço Recomendado | Configuração Pronta no Repositório |
|---|---|---|
| **Frontend (SPA React)** | **Vercel** | `vercel.json` (headers de segurança + SPA rewrites) |
| **Backend (API Fastify)** | **Render** (ou Railway / Fly.io) | `backend/Dockerfile` + `render.yaml` |
| **Banco de Dados** | **PostgreSQL** (Render Postgres, Neon ou Supabase) | `backend/prisma/schema.prisma` (`npm run db:use:postgres` automático no Dockerfile) |

---

## Passo 1 — Subir o Backend + PostgreSQL (Render)

1. Acesse [render.com](https://render.com) → **New +** → **Blueprint**.
2. Conecte este repositório GitHub (`LEITE-FLOW-banco-leite-marilia`).
3. O Render lerá automaticamente o arquivo `render.yaml` na raiz, criando:
   - Banco gerenciado **PostgreSQL** (`leiteflow-db`)
   - Serviço Web Docker **leiteflow-api** (`backend/Dockerfile`) já com `provider = "postgresql"` e `prisma db push` na inicialização.
4. Configure a variável de ambiente `CORS_ORIGIN` no serviço `leiteflow-api` com a URL do seu frontend na Vercel (ex.: `https://leite-flow.vercel.app`).
5. Na primeira subida, rode o seed inicial uma única vez pelo Shell do Render (ou configure `SEED_ADMIN_PASSWORD` com senha forte antes):
   ```bash
   npx tsx prisma/seed.ts
   ```
6. Teste o healthcheck: `https://<sua-api>.onrender.com/health` e a documentação OpenAPI em `https://<sua-api>.onrender.com/docs`.

---

## Passo 2 — Conectar o Frontend na Vercel

1. No painel da **Vercel** → **Project Settings** → **Environment Variables**, adicione:
   - `VITE_API_BASE_URL` = `https://<sua-api>.onrender.com/api/v1`
2. Faça um novo deploy (Redeploy).
3. Pronto! O sistema estará 100% online com autenticação JWT + Refresh Cookie `HttpOnly`, RBAC por perfil e persistência permanente em PostgreSQL.

---

## Como Rodar Localmente (Desenvolvimento)

```bash
# Terminal 1 — API Backend (porta 3333, banco local backend/prisma/dev.db)
cd backend
npm install
npm run db:setup
npm run dev

# Terminal 2 — Frontend React (porta 3000, proxy automático /api -> :3333)
npm install
npm run dev
```

Acesse `http://localhost:3000` (em modo `DEV`, a tela de login exibe atalhos para os 4 perfis RBAC).
