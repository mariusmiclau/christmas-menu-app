import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const appSource = readFileSync(new URL('../src/App.jsx', import.meta.url), 'utf8');
const sceneSource = readFileSync(new URL('../src/FestiveScene.jsx', import.meta.url), 'utf8');
const styles = readFileSync(new URL('../src/index.css', import.meta.url), 'utf8');

test('the main page keeps its animated cinematic Christmas scene', () => {
  assert.match(appSource, /<FestiveScene/);
  assert.match(appSource, /className="snowfield"/);
  assert.match(sceneSource, /className="sleigh-flight"/);
  assert.match(sceneSource, /className="scene-reindeer"/);
  assert.match(sceneSource, /className="scene-snowman"/);
  assert.match(sceneSource, /ScrollTrigger/);
  assert.match(sceneSource, /prefers-reduced-motion: no-preference/);
  assert.match(styles, /@keyframes marquee-drift/);
  assert.match(styles, /@media \(prefers-reduced-motion: reduce\)/);
});
