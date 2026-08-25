export const APP_ROLES = ['STUDENT', 'ADMIN'] as const;

export type AppRole = (typeof APP_ROLES)[number];

export function normalizeRole(role: unknown): AppRole | null {
  return typeof role === 'string' && APP_ROLES.includes(role as AppRole)
    ? (role as AppRole)
    : null;
}

export function hasRequiredRole(role: unknown, requiredRole: AppRole) {
  return normalizeRole(role) === requiredRole;
}

export function isAdmin(role: unknown) {
  return hasRequiredRole(role, 'ADMIN');
}
