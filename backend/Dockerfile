# Dockerfile de Produção Online — LEITE FLOW Backend (PostgreSQL / Neon / Supabase / Render / Railway)
FROM node:22-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
# Em produção online o banco é PostgreSQL
RUN npm run db:use:postgres && npm run prisma:generate && npm run build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY package*.json ./
RUN npm ci --omit=dev

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/node_modules/prisma ./node_modules/prisma

EXPOSE 3333
CMD ["sh", "-c", "node ./node_modules/prisma/build/index.js db push --skip-generate && node dist/server.js"]
