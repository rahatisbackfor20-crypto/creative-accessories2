import { User } from './types';
import { INITIAL_USERS } from './storage';

export const SESSION_USER_ID_KEY = 'caf_session_user_id';
export const ACTIVE_USER_KEY = 'caf_active_user';

/**
 * Validates a candidate User object for structural integrity.
 */
export function isValidUserRecord(user: any): user is User {
  if (!user || typeof user !== 'object') return false;
  if (typeof user.id !== 'string' || !user.id.trim()) return false;
  if (typeof user.fullName !== 'string' || !user.fullName.trim()) return false;
  if (typeof user.accountType !== 'string' || !user.accountType.trim()) return false;
  return true;
}

/**
 * Helper to fetch authoritative users from localStorage or default initial users.
 */
export function getAuthoritativeUsers(fallbackUsers?: User[]): User[] {
  try {
    const raw = localStorage.getItem('caf_users');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn('Could not read caf_users from localStorage:', err);
  }
  return fallbackUsers && fallbackUsers.length > 0 ? fallbackUsers : INITIAL_USERS;
}

/**
 * Strictly loads and validates the existing session tokens from localStorage:
 * - 'caf_session_user_id'
 * - 'caf_active_user'
 *
 * Validation checks:
 * 1. Checks if tokens exist. If neither exists, returns null without creating side effects.
 * 2. Parses 'caf_active_user' safely and verifies required schema fields.
 * 3. Compares session user ID with active user ID to prevent token spoofing or desync.
 * 4. Resolves the user against the authoritative user pool (saved 'caf_users' or INITIAL_USERS).
 * 5. Verifies account status: Must be strictly 'Active'. If 'Pending', 'Inactive', or deleted, tokens are purged.
 * 6. Synchronizes and updates any modified fields (e.g. salary, designation, permissions, photo) from the latest database state.
 * 7. Self-heals mismatched or single-missing tokens so both keys remain in strict sync.
 */
export function validateAndRestoreSession(providedUsers?: User[]): User | null {
  try {
    const rawSessionId = localStorage.getItem(SESSION_USER_ID_KEY)?.trim() || '';
    const rawActiveUser = localStorage.getItem(ACTIVE_USER_KEY)?.trim() || '';

    // If neither token is present, user is not logged in
    if (!rawSessionId && !rawActiveUser) {
      return null;
    }

    const allUsers = getAuthoritativeUsers(providedUsers);

    let parsedActiveUser: User | null = null;
    if (rawActiveUser) {
      try {
        const candidate = JSON.parse(rawActiveUser);
        if (isValidUserRecord(candidate)) {
          parsedActiveUser = candidate;
        }
      } catch {
        parsedActiveUser = null;
      }
    }

    // Determine target user ID
    let targetUserId = rawSessionId;
    if (!targetUserId && parsedActiveUser) {
      targetUserId = parsedActiveUser.id;
    }

    // If both exist, verify ID consistency
    if (rawSessionId && parsedActiveUser && rawSessionId !== parsedActiveUser.id) {
      // Token mismatch detected. Check if rawSessionId matches a valid active user in allUsers
      const foundBySessionId = allUsers.find(u => u.id === rawSessionId);
      if (foundBySessionId && foundBySessionId.accountStatus === 'Active') {
        parsedActiveUser = foundBySessionId;
        targetUserId = foundBySessionId.id;
      } else {
        const foundByActiveUser = allUsers.find(u => u.id === parsedActiveUser!.id);
        if (foundByActiveUser && foundByActiveUser.accountStatus === 'Active') {
          targetUserId = foundByActiveUser.id;
          parsedActiveUser = foundByActiveUser;
        } else {
          // Both desynced and invalid -> clear tokens
          clearAuthSession();
          return null;
        }
      }
    }

    // Lookup user in authoritative directory
    let authoritativeUser = allUsers.find(u => u.id === targetUserId);
    if (!authoritativeUser && parsedActiveUser?.username) {
      authoritativeUser = allUsers.find(
        u => u.username && u.username.toLowerCase() === parsedActiveUser!.username.toLowerCase()
      );
    }

    // Fallback to INITIAL_USERS if not in current user list
    if (!authoritativeUser) {
      authoritativeUser = INITIAL_USERS.find(u => u.id === targetUserId);
    }

    const candidateUser = authoritativeUser || parsedActiveUser;
    if (!candidateUser) {
      clearAuthSession();
      return null;
    }

    // Strict accountStatus validation: Must be 'Active'
    if (candidateUser.accountStatus !== 'Active') {
      clearAuthSession();
      return null;
    }

    // Merge authoritative user updates
    const resolvedUser: User = {
      ...candidateUser,
      ...(authoritativeUser || {})
    };

    // Ensure both tokens in localStorage are strictly synchronized
    saveAuthSession(resolvedUser);

    return resolvedUser;
  } catch (err) {
    console.error('Error during session validation:', err);
    return null;
  }
}

/**
 * Persists the user session to localStorage with strictly synchronized tokens.
 */
export function saveAuthSession(user: User): void {
  try {
    if (!user || !user.id) return;
    localStorage.setItem(SESSION_USER_ID_KEY, user.id);
    localStorage.setItem(ACTIVE_USER_KEY, JSON.stringify(user));
  } catch (err) {
    console.error('Failed to persist user session:', err);
  }
}

/**
 * Clears authentication session tokens completely.
 */
export function clearAuthSession(): void {
  try {
    localStorage.removeItem(SESSION_USER_ID_KEY);
    localStorage.removeItem(ACTIVE_USER_KEY);
    sessionStorage.removeItem(SESSION_USER_ID_KEY);
    sessionStorage.removeItem(ACTIVE_USER_KEY);
  } catch (err) {
    console.error('Failed to clear auth session:', err);
  }
}

/**
 * Verifies if an existing active user's session remains valid when users list changes.
 * Returns the refreshed User if valid, or null if deactivated/deleted.
 */
export function revalidateActiveUser(current: User | null, latestUsers: User[]): User | null {
  if (!current) return null;
  const matched = latestUsers.find(u => u.id === current.id);
  if (!matched) {
    const fallback = INITIAL_USERS.find(u => u.id === current.id);
    if (!fallback || fallback.accountStatus !== 'Active') {
      clearAuthSession();
      return null;
    }
    return fallback;
  }
  if (matched.accountStatus !== 'Active') {
    clearAuthSession();
    return null;
  }
  // User is still active - return refreshed user
  saveAuthSession(matched);
  return matched;
}
