// Single source of truth for key names on the sessions instance,
// so prefixes can't drift between the guard, login, logout and MFA code.
export const RedisKeys = {
  session: (sessionIdHash: string) => `session:${sessionIdHash}`,
  userSessions: (userId: string) => `user:${userId}:sessions`,
  mfaChallenge: (challengeId: string) => `mfa:${challengeId}`,
  activation: (tokenHash: string) => `activation:${tokenHash}`,
} as const;

// TTLs in seconds. The sessions instance runs `noeviction`, so every
// temporary key must be written with its TTL in the same command (SET ... EX).
export const RedisTtl = {
  sessionIdle: 30 * 60, // capped at the remaining absolute lifetime per request
  sessionIdleRememberMe: 7 * 24 * 60 * 60,
  mfaChallenge: 5 * 60,
  activation: 15 * 60,
} as const;