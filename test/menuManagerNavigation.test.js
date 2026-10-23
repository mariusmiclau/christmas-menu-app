import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const managerSource = readFileSync(new URL('../src/MenuManager.jsx', import.meta.url), 'utf8');

test('opening the menu editor moves the viewport to the import form after render', () => {
  assert.match(managerSource, /useRef/);
  assert.match(managerSource, /requestAnimationFrame/);
  assert.match(managerSource, /scrollIntoView/);
  assert.match(managerSource, /ref=\{editorRef\}/);
});
