import assert from 'node:assert/strict';
import test from 'node:test';
import { hasRequiredRole, isAdmin, normalizeRole } from '../src/lib/rbac.ts';

test('RBAC accepts only the supported roles', () => {
  assert.equal(normalizeRole('STUDENT'), 'STUDENT');
  assert.equal(normalizeRole('ADMIN'), 'ADMIN');
  assert.equal(normalizeRole('LECTURER'), null);
  assert.equal(normalizeRole(undefined), null);
});

test('admin-only access rejects students', () => {
  assert.equal(isAdmin('ADMIN'), true);
  assert.equal(isAdmin('STUDENT'), false);
  assert.equal(hasRequiredRole('STUDENT', 'STUDENT'), true);
  assert.equal(hasRequiredRole('ADMIN', 'STUDENT'), false);
});
