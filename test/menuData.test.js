import test from 'node:test';
import assert from 'node:assert/strict';
import { itemNeedsPreference, sanitiseMenu } from '../src/menuData.js';

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

test('cleans footer fragments and repeated titles from existing shared menus', () => {
  const menu = sanitiseMenu({
    id: 'existing-import',
    title: 'Existing import',
    starters: [],
    mains: [
      { id: 'm1', name: '10oz Fillet Mignon', description: 'Fries and peppercorn sauce' },
      { id: 'm2', name: 'inity, connections and achievements as we bring the 2026 networkl' },
    ],
    desserts: [
      {
        id: 'd1',
        name: 'Layered Salted Caramel Cheesecake',
        description: 'Layered Salted Caramel Cheesecake Whipped cream & honeycomb',
      },
      { id: 'd2', name: 'king calendar to a close.' },
    ],
  });

  assert.deepEqual(menu.mains, [
    { id: 'm1', name: '10oz Fillet Mignon', description: 'Fries and peppercorn sauce' },
  ]);
  assert.deepEqual(menu.desserts, [
    { id: 'd1', name: 'Layered Salted Caramel Cheesecake', description: 'Whipped cream & honeycomb' },
  ]);
});
