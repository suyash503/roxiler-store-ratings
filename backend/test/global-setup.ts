import { execSync } from 'node:child_process';
import { testDatabaseUrl } from './test-db';

/**
 * Once per run: bring the test database up to the latest migration.
 * `migrate deploy` never drops data; each test clears its own tables instead
 * (see resetDatabase in helpers.ts).
 */
export default function globalSetup() {
  execSync('npx prisma migrate deploy', {
    env: { ...process.env, DATABASE_URL: testDatabaseUrl() },
    stdio: 'pipe',
  });
}
