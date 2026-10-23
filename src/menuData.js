const STORAGE_KEY = 'fv-menu-versions-v1';

export const DEFAULT_MENU = {
  id: 'fv-christmas-2025',
  title: 'F&V Christmas Dinner',
  eventDate: '2025-12-03',
  sourceName: 'Original website menu',
  courseOptions: {
    2: { label: '2 Courses', price: 32 },
    3: { label: '3 Courses', price: 37 },
  },
  starters: [
    { id: 's1', name: 'Creamy garlic mushrooms + sourdough toast', tags: ['v'] },
    { id: 's2', name: 'Lightly spiced parsnip soup + toasted cumin + honey', tags: ['v', 'vgo', 'gfo'] },
    { id: 's3', name: 'Salmon Gravadlax + rye bread + horseradish + mustard cream', tags: ['gfo'] },
  ],
  mains: [
    { id: 'm1', name: 'Angus Sirloin steak + mushrooms + roasted tomato + chips + green peppercorn sauce', tags: ['gfo'] },
    { id: 'm2', name: 'Roasted salmon + crushed new potatoes + asparagus + dill beurre blanc sauce', tags: ['gfo'] },
    { id: 'm3', name: 'Chicken breast + french beans + herby potatoes + tomato + mascarpone sauce', tags: ['gfo'] },
    { id: 'm4', name: 'BBQ rib + wing combo box + coleslaw + corn + seasoned fries', tags: ['gfo'] },
    { id: 'm5', name: 'Wild mushroom + roasted onion vegan puff pastry tart', tags: ['v', 'vgo'] },
  ],
  desserts: [
    { id: 'd1', name: 'Biscoff cheesecake + toffee sauce + vanilla cream', tags: ['v'] },
    { id: 'd2', name: 'Spiced cherry crumble + vanilla pod custard', tags: ['v'] },
    { id: 'd3', name: 'Dark chocolate + caramel tart + berry compote', tags: ['v', 'vgo', 'gf'] },
    { id: 'd4', name: 'British cheese + biscuit selection', tags: ['v'] },
  ],
};

export function readStoredMenus() {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (Array.isArray(stored) && stored.length) return stored;
  } catch (error) {
    console.warn('Could not read saved menu versions', error);
  }
  return [DEFAULT_MENU];
}

export function storeMenus(menus) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(menus));
}

export function createMenuId(title) {
  const slug = title
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 42) || 'menu';
  return `${slug}-${Date.now().toString(36)}`;
}

function bytesToBase64Url(bytes) {
  let binary = '';
  bytes.forEach((byte) => { binary += String.fromCharCode(byte); });
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

export function encodeMenu(menu) {
  return bytesToBase64Url(new TextEncoder().encode(JSON.stringify(menu)));
}

export function decodeMenu(encoded) {
  try {
    const padded = encoded.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(encoded.length / 4) * 4, '=');
    const binary = atob(padded);
    const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
    const menu = JSON.parse(new TextDecoder().decode(bytes));
    if (!menu?.id || !menu?.title || !Array.isArray(menu?.mains)) return null;
    return menu;
  } catch (error) {
    console.warn('Could not open shared menu', error);
    return null;
  }
}

export function getSharedMenu() {
  const encoded = new URLSearchParams(window.location.search).get('config');
  return encoded ? decodeMenu(encoded) : null;
}

export function getClientLink(menu) {
  const url = new URL(window.location.href);
  url.search = '';
  url.searchParams.set('menu', menu.id);
  url.searchParams.set('config', encodeMenu(menu));
  return url.toString();
}

export function formatEventDate(value) {
  if (!value) return 'Date to be confirmed';
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  return new Intl.DateTimeFormat('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(`${value}T12:00:00Z`));
}

export function itemNeedsPreference(item) {
  return /\b(?:steak|sirloin|fil(?:e|le)t\s+mignon|rib[ -]?eye|rump|t[ -]?bone|porterhouse|beef\s+fillet)\b/i.test(item?.name || '');
}
