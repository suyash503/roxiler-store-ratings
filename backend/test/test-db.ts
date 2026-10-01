import 'dotenv/config';

/**
 * The e2e suite wipes its database, so it only ever runs against one whose
 * name ends in `_test`: TEST_DATABASE_URL if set, else DATABASE_URL with
 * `_test` appended to the database name.
 */
export function testDatabaseUrl(): string {
  const explicit = process.env.TEST_DATABASE_URL;
  const base = explicit ?? process.env.DATABASE_URL;
  if (!base) throw new Error('Set TEST_DATABASE_URL or DATABASE_URL to run the tests');

  const url = new URL(base);
  if (!explicit) url.pathname = `${url.pathname.replace(/_test$/, '')}_test`;
  if (!url.pathname.endsWith('_test')) {
    throw new Error(`Refusing to run tests against "${url.pathname.slice(1)}": its name must end in _test`);
  }
  return url.toString();
}
