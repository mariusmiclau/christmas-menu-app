import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const appSource = readFileSync(new URL('../src/App.jsx', import.meta.url), 'utf8');
const styles = readFileSync(new URL('../src/index.css', import.meta.url), 'utf8');

test('the main page keeps its animated Christmas characters and snow', () => {
  assert.match(appSource, /className="festive-characters"/);
  assert.match(appSource, /🎅/u);
  assert.match(appSource, /⛄/u);
  assert.match(appSource, /🦌/u);
  assert.match(appSource, /❄/u);
  assert.match(styles, /@keyframes festive-float/);
  assert.match(styles, /@keyframes reindeer-prance/);
});
