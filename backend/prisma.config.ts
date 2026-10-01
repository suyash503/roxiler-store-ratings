import 'dotenv/config';
import { defineConfig } from 'prisma/config';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'tsx prisma/seed.ts',
  },
  datasource: {
    // Read lazily: `prisma generate` runs at install time (CI, Docker build)
    // when no database exists yet.
    url: process.env.DATABASE_URL ?? '',
  },
});
