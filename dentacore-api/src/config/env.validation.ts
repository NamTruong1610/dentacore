// Fails fast at startup if a required variable is missing or malformed.
// All problems are collected and reported together, so one restart shows every issue.

type Env = Record<string, unknown>;
type Check = (value: string) => string | null; // returns an error message, or null when valid

const nonEmpty: Check = (v) => (v.trim() === '' ? 'must not be empty' : null);

const urlWithScheme =
  (...schemes: string[]): Check =>
    (v) =>
      new RegExp(`^(${schemes.join('|')})://`).test(v) ? null : `must be a ${schemes.map((s) => `${s}://`).join(' or ')} URL`;

const port: Check = (v) => {
  const n = Number(v);
  return Number.isInteger(n) && n >= 1 && n <= 65535 ? null : 'must be an integer port between 1 and 65535';
};

const booleanString: Check = (v) => (v === 'true' || v === 'false' ? null : "must be 'true' or 'false'");

const base64Key32: Check = (v) => {
  if (!/^[A-Za-z0-9+/]+={0,2}$/.test(v)) return 'must be base64-encoded';
  return Buffer.from(v, 'base64').length === 32 ? null : 'must decode to exactly 32 bytes';
};

const REQUIRED: Record<string, Check> = {
  // Database
  DATABASE_URL: urlWithScheme('postgres', 'postgresql'),

  // Redis
  REDIS_AUTH_URL: urlWithScheme('redis', 'rediss'),
  REDIS_CACHE_URL: urlWithScheme('redis', 'rediss'),

  // Mail
  SMTP_HOST: nonEmpty,
  SMTP_PORT: port,
  SMTP_USER: nonEmpty,
  SMTP_PASS: nonEmpty,
  MAIL_FROM: nonEmpty,

  // Security
  DENTACORE_API_KEY: nonEmpty,
  TOTP_ENC_KEY: base64Key32, // generate: node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
};

// Checked only when set; the code has a default otherwise.
const OPTIONAL: Record<string, Check> = {
  PORT: port, // defaults to 3000 in main.ts
  SMTP_SECURE: booleanString, // treated as false when unset
};

export function validateEnv(config: Env): Env {
  const errors: string[] = [];

  for (const [key, check] of Object.entries(REQUIRED)) {
    const value = config[key];
    if (typeof value !== 'string' || value === '') {
      errors.push(`${key} is required`);
      continue;
    }
    const error = check(value);
    if (error) errors.push(`${key} ${error}`);
  }

  for (const [key, check] of Object.entries(OPTIONAL)) {
    const value = config[key];
    if (value === undefined || value === '') continue;
    const error = typeof value === 'string' ? check(value) : 'must be a string';
    if (error) errors.push(`${key} ${error}`);
  }

  if (errors.length > 0) {
    throw new Error(`Invalid environment configuration:\n  - ${errors.join('\n  - ')}`);
  }
  return config;
}