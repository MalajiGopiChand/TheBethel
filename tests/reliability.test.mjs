import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { URL } from 'node:url';
import { transformSync } from 'esbuild';
import { handleBackNavigation } from '../src/utils/navigation.js';
import * as verification from '../src/utils/teacherVerification.js';
import { UserRole } from '../src/types/index.js';

const source = transformSync(readFileSync(new URL('../src/contexts/AuthContext.jsx', import.meta.url), 'utf8'), { loader: 'jsx', format: 'cjs' }).code;
function authHarness({ invalidRoll = false, failedWrite = false, failedCleanup = false } = {}) {
  const calls = [];
  const state = [];
  let listener;
  const user = { uid: 'new-user', email: 'parent@test.invalid' };
  const auth = { currentUser: user };
  const react = {
    createContext: () => ({ Provider: 'Provider' }),
    createElement: (_, props) => props.value,
    useContext: () => null,
    useState: (initial) => { const i = state.length; state.push(initial); return [initial, value => { state[i] = value; }]; },
    useRef: value => ({ current: value }),
    useCallback: fn => fn,
    useEffect: fn => fn(),
  };
  const modules = {
    react,
    '../services/notificationService': { unregisterPushTokenForUser: async () => {} },
    'firebase/auth': {
      onAuthStateChanged: (_, fn) => { listener = fn; return () => {}; },
      createUserWithEmailAndPassword: async () => { calls.push('create'); await listener(user); return { user }; },
      updateProfile: async () => {},
      deleteUser: async () => { calls.push('delete'); if (failedCleanup) throw new Error('offline'); },
      signOut: async () => { calls.push('signout'); await listener(null); },
    },
    '../services/notifyingFirestore': {
      doc: (...args) => args,
      collection: (...args) => args,
      query: (...args) => args,
      where: (...args) => args,
      getDocs: async () => ({ empty: invalidRoll }),
      getDoc: async () => { calls.push('read-profile'); return { exists: () => true }; },
      setDoc: async () => { calls.push('write'); if (failedWrite) throw new Error('write response lost'); },
    },
    '../config/firebase': { auth, db: {} },
    '../types': { UserRole },
    '../utils/teacherVerification': verification,
  };
  const context = { module: { exports: {} }, require: name => { assert.ok(modules[name], name); return modules[name]; }, console: { error() {}, warn() {} } };
  vm.runInNewContext(source, context);
  const value = context.module.exports.AuthProvider({ children: null });
  return { value, calls, state };
}
const signup = (h, role = UserRole.PARENT) => h.value.signUp('Parent', 'parent@test.invalid', 'example-only', '1234567890', role, 'Student', '123');

test('invalid roll number removes only the newly created incomplete account', async () => {
  const h = authHarness({ invalidRoll: true });
  await assert.rejects(signup(h), /roll number not found/);
  assert.deepEqual(h.calls, ['create', 'delete', 'signout']);
  assert.equal(h.state[0], null);
  assert.equal(h.state[2], false);
});
test('successful signup publishes the parent profile after validation', async () => {
  const h = authHarness();
  await signup(h);
  assert.deepEqual(h.calls, ['create', 'write']);
  assert.equal(h.state[0].studentId, '123');
});
test('ambiguous profile write failure never deletes the account', async () => {
  const h = authHarness({ failedWrite: true });
  await assert.rejects(signup(h), /write response lost/);
  assert.deepEqual(h.calls, ['create', 'write', 'signout']);
  assert.match(h.state[3], /Try signing in/);
});
test('failed cleanup gives a recovery message and signs out', async () => {
  const h = authHarness({ invalidRoll: true, failedCleanup: true });
  await assert.rejects(signup(h));
  assert.match(h.state[3], /cleanup failed/);
  assert.equal(h.calls.at(-1), 'signout');
});
test('teacher signup remains pending', async () => {
  const h = authHarness();
  await signup(h, UserRole.TEACHER);
  assert.equal(h.state[0].approvalState, 'pending');
  assert.equal(verification.isTeacherPendingAccess(h.state[0]), true);
});
test('unsupported signup roles never create an account', async () => {
  const h = authHarness();
  await assert.rejects(signup(h, UserRole.ADMIN));
  assert.deepEqual(h.calls, []);
});
test('pending or rejected approval wins over legacy verified flags', () => {
  for (const approvalState of ['pending', 'rejected']) {
    assert.equal(verification.isTeacherPendingAccess({ role: 'TEACHER', approvalState, isVerified: true }), true);
  }
  assert.equal(verification.isTeacherPendingAccess({ role: 'TEACHER', approvalState: 'approved' }), false);
});
test('back uses in-app history or a dashboard fallback for direct links', () => {
  const calls = [];
  const navigate = (...args) => calls.push(args);
  globalThis.window = { history: { state: { idx: 0 } }, location: { pathname: '/teacher/homework' } };
  handleBackNavigation(navigate);
  assert.deepEqual(calls.pop(), ['/teacher/dashboard', { replace: true }]);
  handleBackNavigation(navigate, { role: 'ADMIN' });
  assert.deepEqual(calls.pop(), ['/admin/dashboard', { replace: true }]);
  handleBackNavigation(navigate, null, '/');
  assert.deepEqual(calls.pop(), ['/', { replace: true }]);
  globalThis.window.history.state.idx = 1;
  handleBackNavigation(navigate);
  assert.deepEqual(calls.pop(), [-1]);
  delete globalThis.window;
});
