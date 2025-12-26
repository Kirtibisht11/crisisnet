/**
 * roleGuard Utility
 * Checks if the current user has required role.
 */

export function hasRole(user, allowedRoles = []) {
  if (!user || !user.role) return false;
  return allowedRoles.includes(user.role);
}
