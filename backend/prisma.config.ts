import path from 'node:path';
import dotenv from 'dotenv';
import { defineConfig } from 'prisma/config';

// Load backend/.env regardless of the directory the CLI is run from.
dotenv.config({ path: path.resolve(__dirname, '.env') });

// DIRECT_URL (non-pooled) is used by the CLI for migrations; the app uses DATABASE_URL at runtime.
export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'ts-node --transpile-only prisma/seed.ts',
  },
  datasource: {
    url: process.env.DIRECT_URL ?? process.env.DATABASE_URL ?? '',
  },
});
