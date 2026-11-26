
export const RedisKeys = {
  permissions: (employeeId: string) => `rbac:perms:${employeeId}`,
} as const;


export const RedisTtl = {
  rbacTtl: 10 * 60,
} as const;