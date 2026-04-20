import { atom } from 'jotai';

/** Supported user roles in TrustAgri. */
export type UserRole = 'farmer' | 'trader' | 'buyer' | 'guest';

/** Auth session stored in memory (never persisted to localStorage). */
export interface AuthSession {
  accessToken: string;
  refreshToken: string;
  userId: string;
  role: UserRole;
  expiresAt: string; // ISO-8601
}

/** Null = unauthenticated / guest. */
export const authSessionAtom = atom<AuthSession | null>(null);

/** Derived: current role (defaults to 'guest' when not logged in). */
export const currentRoleAtom = atom<UserRole>(
  (get) => get(authSessionAtom)?.role ?? 'guest',
);

/** Derived: access token string or empty string. */
export const accessTokenAtom = atom<string>(
  (get) => get(authSessionAtom)?.accessToken ?? '',
);
