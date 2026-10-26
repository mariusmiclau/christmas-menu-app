import { LEGACY_MENU } from './menuData.js';

export function parseSheetOrder(row) {
  return {
    name: row[0] || '',
    courses: Number.parseInt(row[1], 10) || 2,
    starter: row[2] || '',
    main: row[3] || '',
    dessert: row[4] || '',
    steakPreference: row[5] || '',
    orderDate: row[6] || '',
    menuId: row[7] || LEGACY_MENU.id,
    menuTitle: row[8] || LEGACY_MENU.title,
  };
}

export async function saveOrder(row) {
  const response = await fetch('/api/orders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ row }),
  });
  const result = await response.json().catch(() => null);
  if (!response.ok || result?.saved !== true) {
    throw new Error(result?.error || 'Your order was not confirmed. Please contact the organiser before submitting again.');
  }
}
