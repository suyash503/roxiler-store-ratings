/**
 * Environment variables, validated once at startup so a missing secret fails
 * the boot instead of the first request.
 */
export interface Env {
  NODE_ENV: 'development' | 'production' | 'test';
  DATABASE_URL: string;
  JWT_SECRET: string;
  JWT_EXPIRES_IN: string;
  PORT: number;
  CORS_ORIGINS: string[];
  /** bcrypt cost factor. Tests lower it to keep the suite fast. */
  BCRYPT_ROUNDS: number;
  /** Send the session cookie only over HTTPS. Defaults to true in production. */
  COOKIE_SECURE: boolean;
  /**
   * Express "trust proxy": how many proxy hops to trust for the client IP.
   * Set it behind nginx, or the rate limiter sees every user as the proxy.
   */
  TRUST_PROXY: number;
}

export function validateEnv(raw: Record<string, unknown>): Env {
  const errors: string[] = [];
  const str = (key: string, fallback?: string) => {
    const value = raw[key];
    if (typeof value === 'string' && value.trim() !== '') return value.trim();
    if (fallback !== undefined) return fallback;
    errors.push(`${key} is required`);
    return '';
  };

  const nodeEnv = str('NODE_ENV', 'development');
  if (!['development', 'production', 'test'].includes(nodeEnv)) {
    errors.push('NODE_ENV must be development, production or test');
  }

  const jwtSecret = str('JWT_SECRET');
  if (jwtSecret && jwtSecret.length < 32) {
    errors.push('JWT_SECRET must be at least 32 characters');
  }

  const port = Number(str('PORT', '4100'));
  if (!Number.isInteger(port) || port <= 0) errors.push('PORT must be a positive integer');

  const bcryptRounds = Number(str('BCRYPT_ROUNDS', '12'));
  if (!Number.isInteger(bcryptRounds) || bcryptRounds < 4 || bcryptRounds > 15) {
    errors.push('BCRYPT_ROUNDS must be an integer from 4 to 15');
  }

  const cookieSecure = str('COOKIE_SECURE', nodeEnv === 'production' ? 'true' : 'false');
  if (!['true', 'false'].includes(cookieSecure)) errors.push('COOKIE_SECURE must be true or false');

  const trustProxy = Number(str('TRUST_PROXY', '0'));
  if (!Number.isInteger(trustProxy) || trustProxy < 0) errors.push('TRUST_PROXY must be a whole number of hops');

  const env: Env = {
    NODE_ENV: nodeEnv as Env['NODE_ENV'],
    DATABASE_URL: str('DATABASE_URL'),
    JWT_SECRET: jwtSecret,
    JWT_EXPIRES_IN: str('JWT_EXPIRES_IN', '1d'),
    PORT: port,
    CORS_ORIGINS: str('CORS_ORIGINS', 'http://localhost:5180')
      .split(',')
      .map((origin) => origin.trim())
      .filter(Boolean),
    BCRYPT_ROUNDS: bcryptRounds,
    COOKIE_SECURE: cookieSecure === 'true',
    TRUST_PROXY: trustProxy,
  };

  if (errors.length > 0) {
    throw new Error(`Invalid environment:\n  - ${errors.join('\n  - ')}`);
  }
  return env;
}
