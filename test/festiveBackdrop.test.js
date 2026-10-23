import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const appSource = readFileSync(new URL('../src/App.jsx', import.meta.url), 'utf8');
const sceneSource = readFileSync(new URL('../src/FestiveScene.jsx', import.meta.url), 'utf8');
const styles = readFileSync(new URL('../src/index.css', import.meta.url), 'utf8');

test('the main page presents a refined animated Christmas business dinner', () => {
  assert.match(appSource, /<FestiveScene/);
  assert.match(appSource, /className="snowfield"/);
  assert.match(sceneSource, /business-christmas-dinner\.webp/);
  assert.match(sceneSource, /className="business-christmas-image"/);
  assert.match(sceneSource, /className="guest-motion guest-left"/);
  assert.match(sceneSource, /className="guest-motion guest-centre"/);
  assert.match(sceneSource, /className="guest-motion guest-right"/);
  assert.match(sceneSource, /className="toast-glint"/);
  assert.match(sceneSource, /className="living-flame"/);
  assert.match(sceneSource, /onPointerMove/);
  assert.match(sceneSource, /className="candle-glow"/);
  assert.match(sceneSource, /Private Christmas dinner/);
  assert.doesNotMatch(sceneSource, /sleigh|reindeer|snowman/i);
  assert.match(sceneSource, /prefers-reduced-motion: no-preference/);
  assert.match(styles, /@keyframes window-snowfall/);
  assert.match(styles, /@keyframes flame-dance/);
  assert.match(styles, /mask-image:\s*radial-gradient/);
  assert.match(styles, /@media \(prefers-reduced-motion: reduce\)/);
});
