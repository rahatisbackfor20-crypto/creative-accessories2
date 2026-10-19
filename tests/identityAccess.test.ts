import { test } from 'node:test';
import assert from 'node:assert/strict';
import { canEnterPortal, portalUser } from '../src/identityAccess';

test('unconfirmed, anonymous, and unassigned users cannot enter the factory portal', () => {
  assert.equal(canEnterPortal(null), false);
  assert.equal(canEnterPortal({ id: 'member', roles: ['admin'] }), false);
  assert.equal(canEnterPortal({ id: 'member', confirmedAt: '2026-10-19' }), false);
  assert.equal(canEnterPortal({ id: 'member', confirmedAt: '2026-10-19', roles: ['employee'], appMetadata: { portal_user_id: ' ' } }), false);
});

test('user-editable metadata cannot grant admin rights or link another employee', () => {
  const identity = { id: 'member', confirmedAt: '2026-10-19', userMetadata: { roles: ['admin'], portal_user_id: 'another-worker', accountType: 'hosting' } };
  assert.equal(canEnterPortal(identity), false);
  assert.equal(portalUser(identity).accountType, 'employee');
  assert.equal(portalUser(identity).adminAccess, 'none');
  assert.equal(portalUser(identity).id, 'member');
  assert.equal(portalUser(identity).password, undefined);
});

test('verified admins receive admin permissions from Identity roles', () => {
  const identity = { id: 'admin-member', confirmedAt: '2026-10-19', roles: ['admin'] };
  assert.equal(canEnterPortal(identity), true);
  assert.equal(portalUser(identity).accountType, 'admin');
  assert.equal(portalUser(identity).adminAccess, 'full');
});

test('assigned employees use the server-managed factory profile id without admin permissions', () => {
  const identity = { id: 'identity-member', confirmedAt: '2026-10-19', roles: ['employee'], appMetadata: { portal_user_id: 'factory-member' } };
  assert.equal(canEnterPortal(identity), true);
  const profile = portalUser(identity);
  assert.equal(profile.id, 'factory-member');
  assert.equal(profile.adminAccess, 'none');
  assert.equal(profile.accountType, 'employee');
});
