import { atom } from 'jotai';

/** Supported user roles in TrustAgri. */
export type UserRole = 'farmer' | 'trader' | 'buyer' | 'guest';

/** Auth session stored in memory (never persisted to localStorage). */
export interface AuthSession {
  accessToken: string;
  refreshToken: string;
  userId: string;
  role: UserRole;
  roles: UserRole[];
  expiresAt: string; // ISO-8601
}

/** Null = unauthenticated / guest. */
export const authSessionAtom = atom<AuthSession | null>(null);

/** Derived: current role (defaults to 'guest' when not logged in). */
export const currentRoleAtom = atom<UserRole>(
  (get) => get(authSessionAtom)?.role ?? 'guest',
);

/** Derived: all roles assigned to the current user (defaults to ['buyer'] when not logged in). */
export const availableRolesAtom = atom<UserRole[]>(
  (get) => get(authSessionAtom)?.roles ?? ['buyer'],
);

/** Derived: access token string or empty string. */
export const accessTokenAtom = atom<string>(
  (get) => get(authSessionAtom)?.accessToken ?? '',
);

/** Derived: current user ID or null when unauthenticated. */
export const currentUserIdAtom = atom<string | null>(
  (get) => get(authSessionAtom)?.userId ?? null,
);
