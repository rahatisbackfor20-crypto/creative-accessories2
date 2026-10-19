import type { User as IdentityUser } from '@netlify/identity';
import type { User } from './types';

export function canEnterPortal(identity: IdentityUser | null): boolean {
  if (!identity?.confirmedAt) return false;
  if (identity.roles?.includes('admin')) return true;
  const linkedId = identity.appMetadata?.portal_user_id;
  return identity.roles?.includes('employee') === true && typeof linkedId === 'string' && linkedId.trim().length > 0;
}

export function portalUser(identity: IdentityUser): User {
  const admin = identity.roles?.includes('admin') === true;
  const linkedId = identity.appMetadata?.portal_user_id;
  return {
    id: typeof linkedId === 'string' && linkedId ? linkedId : identity.id,
    username: identity.email || '', fullName: identity.name || identity.email || 'Member',
    accountType: admin ? 'admin' : 'employee', adminAccess: admin ? 'full' : 'none',
    accountStatus: 'Active', designation: admin ? 'Administrator' : 'Factory Worker',
    department: 'Production', section: '', employeeId: '', joiningDate: '', basicSalary: 0, hourlyRate: 0,
  };
}

