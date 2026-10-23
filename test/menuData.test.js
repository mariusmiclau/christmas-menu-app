import test from 'node:test';
import assert from 'node:assert/strict';
import { itemNeedsPreference } from '../src/menuData.js';

test('asks for doneness on imported steak cuts without affecting other mains', () => {
  [
    'Angus Sirloin steak',
    '8oz Sirloin',
    '10oz Fillet Mignon',
    'Filet Mignon',
    'Ribeye',
    'Rib-eye steak',
    'Rump Steak',
    'T-Bone',
    'Porterhouse',
    'Beef fillet',
  ].forEach((name) => assert.equal(itemNeedsPreference({ name }), true, name));

  [
    'Pan Fried Chicken Supreme',
    'Oven Baked Salmon',
    'Butternut Squash, Roasted Chestnut & Sage Tart',
    'Braised beef bourguignon',
  ].forEach((name) => assert.equal(itemNeedsPreference({ name }), false, name));
});
