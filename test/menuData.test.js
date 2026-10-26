import test from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_MENU, LEGACY_MENU, decodeMenu, encodeMenu, itemNeedsPreference, readStoredMenus, resolveMenu, sanitiseMenu } from '../src/menuData.js';

function mockStorage(t, value) {
  const previous = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: { getItem: () => value } });
  t.after(() => {
    if (previous) Object.defineProperty(globalThis, 'localStorage', previous);
    else delete globalThis.localStorage;
  });
}

test('fresh and incognito visitors receive the published PPN menu', (t) => {
  mockStorage(t, null);
  const menus = readStoredMenus();
  assert.equal(resolveMenu(menus).id, 'ppn-christmas-diner-menu-mvldpwzh');
  assert.equal(DEFAULT_MENU.eventDate, '2026-12-09');
  assert.deepEqual([DEFAULT_MENU.starters.length, DEFAULT_MENU.mains.length, DEFAULT_MENU.desserts.length], [4, 5, 4]);
  assert.equal(DEFAULT_MENU.courseOptions[2].price, 40);
  assert.equal(DEFAULT_MENU.courseOptions[3].price, 45);
  assert.equal(DEFAULT_MENU.mains[1].id, 'm-2-49n65z');
  assert.equal(DEFAULT_MENU.desserts[3].id, 'd-4-1f3flwb');
  assert.ok(menus.some((menu) => menu.id === LEGACY_MENU.id));
});

test('existing browser menus are retained without overriding the website default', (t) => {
  const draft = { ...DEFAULT_MENU, id: 'private-draft', title: 'Unpublished draft' };
  mockStorage(t, JSON.stringify([LEGACY_MENU, draft]));
  const menus = readStoredMenus();
  assert.equal(resolveMenu(menus).id, DEFAULT_MENU.id);
  assert.equal(resolveMenu(menus, LEGACY_MENU.id).id, LEGACY_MENU.id);
  assert.equal(resolveMenu(menus, draft.id).title, draft.title);
  assert.equal(resolveMenu(menus, 'unknown-menu').id, DEFAULT_MENU.id);
});

test('explicit shared links still select their menu and retain all dish IDs', () => {
  const shared = decodeMenu(encodeMenu(LEGACY_MENU));
  assert.equal(resolveMenu([shared], shared.id).id, LEGACY_MENU.id);
  assert.deepEqual(decodeMenu(encodeMenu(DEFAULT_MENU)), DEFAULT_MENU);
});

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
