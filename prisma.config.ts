import 'dotenv/config';
import { defineConfig } from 'prisma/config';

export default defineConfig({
  schema: 'prisma',
  migrations: {
    path: 'prisma/migrations',
    // seed: 'node --import tsx prisma/seed.ts',
    seed: 'node --import tsx prisma/seed.faker.ts',
  },
  datasource: {
    url: process.env.DATABASE_URL,
  },
});
