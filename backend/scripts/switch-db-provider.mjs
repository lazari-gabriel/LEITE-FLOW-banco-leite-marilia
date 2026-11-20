import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const provider = process.argv[2];
if (!['sqlite', 'postgresql'].includes(provider)) {
  console.error('Uso: node scripts/switch-db-provider.mjs <sqlite|postgresql>');
  process.exit(1);
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const schemaPath = path.resolve(__dirname, '../prisma/schema.prisma');
const content = fs.readFileSync(schemaPath, 'utf-8');
const updated = content.replace(
  /provider\s*=\s*"(sqlite|postgresql)"/,
  `provider = "${provider}"`
);

fs.writeFileSync(schemaPath, updated, 'utf-8');
console.log(`Prisma datasource provider atualizado para: ${provider}`);
