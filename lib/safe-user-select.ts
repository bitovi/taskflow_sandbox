/**
 * Safe user selection utility to prevent password exposure in API responses
 * This ensures consistent and secure user data selection across all server actions
 */

export const safeUserSelect = {
  id: true,
  name: true,
  // Explicitly excluding email and password for security
  // email: false,  // Comment shows what we're intentionally excluding
  // password: false,
} as const;

export type SafeUser = {
  id: number;
  name: string;
};