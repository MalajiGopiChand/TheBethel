import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';
import { transformSync } from 'esbuild';

function launchHarness(screen) {
  const scheduled = [];
  const module = { exports: {} };
  const code = transformSync(readFileSync(new URL('../src/utils/launchScreen.js', import.meta.url), 'utf8'), { format: 'cjs' }).code;
  vm.runInNewContext(code, { module, exports: module.exports, document: { getElementById: () => screen }, window: { setTimeout: callback => scheduled.push(callback) } });
  return { dismiss: module.exports.dismissLaunchScreen, scheduled };
}
test('a completed startup removes the splash once, including Strict Mode duplicate effects', () => {
  let removed = 0; const attributes = {}; const classes = [];
  const screen = { dataset: {}, setAttribute: (key, value) => { attributes[key] = value; }, classList: { add: name => classes.push(name) }, remove: () => { removed++; } };
  const h = launchHarness(screen);
  h.dismiss(); h.dismiss();
  assert.equal(h.scheduled.length, 1);
  assert.equal(attributes['aria-hidden'], 'true');
  assert.deepEqual(classes, ['launch-complete']);
  h.scheduled[0]();
  assert.equal(removed, 1);
});
test('client navigation and startup error recovery safely proceed when the splash is already gone', () => {
  const h = launchHarness(null);
  assert.doesNotThrow(h.dismiss);
  assert.equal(h.scheduled.length, 0);
});
