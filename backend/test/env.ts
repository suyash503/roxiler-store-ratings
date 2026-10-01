import { testDatabaseUrl } from './test-db';

// Runs in every test worker before the app module loads.
process.env.DATABASE_URL = testDatabaseUrl();
process.env.NODE_ENV = 'test';
process.env.BCRYPT_ROUNDS = '4';
process.env.JWT_SECRET ??= 'test-secret-that-is-at-least-32-characters-long';
