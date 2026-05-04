import { UserRole } from '../types';

/**
 * True for explicit "approved" values (handles legacy string/number storage).
 */
export function isTruthyVerified(value) {
  if (value === null || value === undefined) return false;
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value === 1;
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    return (
      normalized === 'true' ||
      normalized === '1' ||
      normalized === 'verified' ||
      normalized === 'approved' ||
      normalized === 'active' ||
      normalized === 'yes'
    );
  }
  return false;
}

/**
 * Whether a Firestore teacher document (or auth profile shaped like one) is approved to use teacher features.
 * Prefer explicit `approvalState` when present so legacy fields cannot override a pending signup.
 */
export function isTeacherVerifiedProfile(data) {
  if (!data) return false;

  const state = data.approvalState;
  if (state === 'pending' || state === 'rejected') return false;
  if (state === 'approved') return true;

  if (isTruthyVerified(data.isVerified)) return true;
  if (isTruthyVerified(data.isApproved)) return true;

  // Legacy: only treat status as approval when it clearly means verified (not generic "active")
  if (typeof data.status === 'string') {
    const s = data.status.trim().toLowerCase();
    if (s === 'verified' || s === 'approved') return true;
  }

  return false;
}

/**
 * Teacher accounts that are not yet approved for app access (pending-approval flow).
 */
export function isTeacherPendingAccess(profile) {
  return profile?.role === UserRole.TEACHER && !isTeacherVerifiedProfile(profile);
}

/**
 * Map a teachers/{uid} document into a consistent currentUser shape (boolean isVerified).
 */
export function mapTeacherDocToCurrentUser(teacherData, firebaseUser) {
  const verified = isTeacherVerifiedProfile(teacherData);
  return {
    ...teacherData,
    uid: firebaseUser.uid,
    role: teacherData.role || UserRole.TEACHER,
    email: teacherData.email || firebaseUser.email || '',
    name: teacherData.name || firebaseUser.displayName || 'Teacher',
    isVerified: verified
  };
}
