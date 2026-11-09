// Fails fast at startup if a required variable is missing or malformed.
const REQUIRED_REDIS_URLS = ['REDIS_AUTH_URL', 'REDIS_CACHE_URL'] as const;

export function validateEnv(config: Record<string, unknown>): Record<string, unknown> {
  for (const key of REQUIRED_REDIS_URLS) {
    const value = config[key];
    if (typeof value !== 'string' || !/^rediss?:\/\//.test(value)) {
      throw new Error(`${key} must be set to a redis:// or rediss:// URL`);
    }
  }
  return config;
}