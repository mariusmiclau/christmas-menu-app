import { requestHasAdminSession, sendJson } from './_adminAuth.js';

const SHEET_ID = '1tNpDNx3LRTXE6nWUIaX1FZ1p8hcLJYodAf9zCSxQtMw';
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbw-LKCNLy4V590ESImLF0PQ5T0UF7onFsh1kdjHuZTKjf129hjE76LhnYVqNo1KVBKySg/exec';
const menuId = (value) => typeof value === 'string' && /^[a-z0-9][a-z0-9-]{0,79}$/.test(value);

function validMenu(menu) {
  if (!menu || !menuId(menu.id) || typeof menu.title !== 'string' || !menu.title.trim() || menu.title.length > 120) return false;
  if (typeof menu.eventDate !== 'string' || menu.eventDate.length > 40) return false;
  if (![2, 3].every((count) => Number.isFinite(Number(menu.courseOptions?.[count]?.price)) && Number(menu.courseOptions[count].price) >= 0)) return false;
  return ['starters', 'mains', 'desserts'].every((category) => Array.isArray(menu[category])
    && menu[category].length <= 80
    && (category !== 'mains' || menu[category].length > 0)
    && menu[category].every((item) => menuId(item?.id) && typeof item.name === 'string' && item.name.trim() && item.name.length <= 250));
}

async function fetchScript(body) {
  const url = process.env.ORDERS_SCRIPT_URL || SCRIPT_URL;
  const upstream = body
    ? await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body), signal: AbortSignal.timeout(15000) })
    : await fetch(`${url}?action=menus&sheetId=${SHEET_ID}`, { signal: AbortSignal.timeout(15000) });
  if (!upstream.ok) throw new Error('Google menu storage could not be reached.');
  const result = await upstream.json();
  if (result?.status !== 'success') throw new Error(result?.message || 'Google menu storage is not ready.');
  return result;
}

export default async function handler(request, response) {
  if (request.method === 'GET') {
    try {
      const data = await fetchScript();
      if (!Array.isArray(data.menus) || data.menus.length > 100
        || !data.menus.every(validMenu) || !menuId(data.activeMenuId)) throw new Error('Google menu storage is not ready.');
      return sendJson(response, 200, { available: true, menus: data.menus, activeMenuId: data.activeMenuId });
    } catch {
      return sendJson(response, 503, { available: false, error: 'Shared menus are not available yet. The published menu is still shown.' });
    }
  }
  if (request.method !== 'POST') {
    response.setHeader('Allow', 'GET, POST');
    return sendJson(response, 405, { error: 'Method not allowed.' });
  }
  if (!requestHasAdminSession(request)) return sendJson(response, 401, { error: 'Sign in as admin to manage menus.' });
  const secret = process.env.MENU_WRITE_SECRET;
  if (!secret || secret.length < 32) return sendJson(response, 503, { error: 'Menu storage needs its write secret configured in Vercel.' });
  const { action, menu } = request.body || {};
  if (!['saveMenu', 'publishMenu'].includes(action) || !validMenu(menu) || JSON.stringify(menu).length > 60000) {
    return sendJson(response, 400, { error: 'Please check the menu details before saving.' });
  }
  try {
    const result = await fetchScript({ action, sheetId: SHEET_ID, secret, menu });
    if (result.menuId !== menu.id || typeof result.activeMenuId !== 'string') throw new Error('Google did not confirm the menu update.');
    return sendJson(response, 200, { saved: true, activeMenuId: result.activeMenuId });
  } catch (error) {
    return sendJson(response, 502, { error: error.message || 'The menu update could not be confirmed. Please refresh before trying again.' });
  }
}
