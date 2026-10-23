import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Calendar,
  ChefHat,
  Download,
  LogIn,
  LogOut,
  Library,
  LockKeyhole,
  RefreshCw,
  ShieldCheck,
  Users,
} from 'lucide-react';
import { getAdminSession, loginAsAdmin, logoutAdmin } from './adminAuth';
import FestiveScene from './FestiveScene';
import MenuManager from './MenuManager';
import {
  DEFAULT_MENU,
  formatEventDate,
  getSharedMenu,
  itemNeedsPreference,
  readStoredMenus,
  storeMenus,
} from './menuData';

const SHEET_ID = '1tNpDNx3LRTXE6nWUIaX1FZ1p8hcLJYodAf9zCSxQtMw';
const API_KEY = 'AIzaSyBAZs3SukTI79zz4L403XT6aMgyor0pOUw';
const SHEET_NAME = 'Orders';
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbw-LKCNLy4V590ESImLF0PQ5T0UF7onFsh1kdjHuZTKjf129hjE76LhnYVqNo1KVBKySg/exec';
const SHARED_MENU = getSharedMenu();

function emptyOrder() {
  return {
    name: '',
    courses: 2,
    starter: '',
    main: '',
    dessert: '',
    steakPreference: '',
    orderDate: '',
  };
}

function priceLabel(value) {
  const number = Number(value || 0);
  return `£${Number.isInteger(number) ? number : number.toFixed(2)}`;
}

function getMenuItem(menu, category, id) {
  return menu?.[category]?.find((item) => item.id === id);
}

function FestiveBackdrop() {
  return (
    <>
      <div className="festive-background" aria-hidden="true" />
      <div className="snowfield" aria-hidden="true">
        {Array.from({ length: 36 }, (_, index) => <span key={index} style={{ '--i': index }} />)}
      </div>
    </>
  );
}

function MenuSection({ title, subtitle, items, selectedId, onSelect, disabledItem, accent = 'red', loading, children }) {
  if (!items.length) return null;
  const selectedClasses = accent === 'green'
    ? 'bg-emerald-700 text-white border-emerald-800 shadow-md'
    : 'bg-red-700 text-white border-red-800 shadow-md';
  const hoverClasses = accent === 'green'
    ? 'hover:border-emerald-400 hover:bg-emerald-50'
    : 'hover:border-red-400 hover:bg-red-50';

  return (
    <fieldset>
      <legend className="text-lg font-extrabold text-slate-800 mb-3">
        {title} <span className="text-sm font-medium text-slate-500">{subtitle}</span>
      </legend>
      <div className={accent === 'green' ? 'space-y-3' : 'grid md:grid-cols-2 gap-3'}>
        {items.map((item) => {
          const unavailable = disabledItem?.(item);
          const selected = selectedId === item.id;
          return (
            <div key={item.id}>
              <button
                type="button"
                onClick={() => onSelect(item.id)}
                disabled={loading || unavailable}
                className={`w-full p-4 rounded-xl border-2 text-left transition-all ${selected ? selectedClasses : unavailable ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed opacity-60' : `bg-white border-slate-200 ${hoverClasses}`}`}
              >
                <span className="block font-bold text-sm leading-relaxed">{item.name}</span>
                {item.description && <span className="block text-xs leading-relaxed mt-1 opacity-75">{item.description}</span>}
                {!!item.tags?.length && <span className="block text-xs mt-1.5 opacity-75 uppercase tracking-wide">{item.tags.join(' · ')}</span>}
              </button>
              {selected && children?.(item)}
            </div>
          );
        })}
      </div>
    </fieldset>
  );
}
function OrderForm({ menu, order, setOrder, loading, onSubmit, clientMode }) {
  const handleCourseSelect = (courseType, itemId) => {
    setOrder((current) => {
      const nextValue = current[courseType] === itemId ? '' : itemId;
      if (current.courses === 2 && courseType === 'starter') {
        return { ...current, starter: nextValue, dessert: '' };
      }
      if (current.courses === 2 && courseType === 'dessert') {
        return { ...current, dessert: nextValue, starter: '' };
      }
      if (courseType === 'main') {
        const selectedItem = getMenuItem(menu, 'mains', nextValue);
        return {
          ...current,
          main: nextValue,
          steakPreference: itemNeedsPreference(selectedItem) ? current.steakPreference : '',
        };
      }
      return { ...current, [courseType]: nextValue };
    });
  };

  return (
    <section className="order-stage max-w-5xl mx-auto bg-white/95 backdrop-blur rounded-2xl shadow-2xl border border-white/70 overflow-hidden">
      <div className="bg-slate-950 text-white px-6 py-7 md:px-9 flex flex-col md:flex-row md:items-end justify-between gap-3">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-amber-300 mb-2">Your selection</p>
          <h2 className="text-3xl font-black">Choose your meal</h2>
        </div>
        {clientMode && (
          <span className="inline-flex items-center gap-2 text-sm text-emerald-200"><ShieldCheck size={17} /> Client menu version</span>
        )}
      </div>

      <form onSubmit={onSubmit} className="p-6 md:p-9 space-y-8">
        <label className="block">
          <span className="block text-lg font-extrabold mb-2 text-slate-800">Your name *</span>
          <input
            type="text"
            value={order.name}
            onChange={(event) => setOrder((current) => ({ ...current, name: event.target.value }))}
            className="field text-lg"
            placeholder="Enter your full name"
            required
            disabled={loading}
          />
        </label>

        <fieldset>
          <legend className="text-lg font-extrabold mb-3 text-slate-800">Choose your package *</legend>
          <div className="grid grid-flow-dense sm:grid-cols-2 gap-4">
            {[2, 3].map((courseCount) => {
              const option = menu.courseOptions?.[courseCount];
              if (!option) return null;
              const selected = order.courses === courseCount;
              return (
                <button
                  key={courseCount}
                  type="button"
                  onClick={() => setOrder((current) => ({ ...current, courses: courseCount, starter: '', dessert: '' }))}
                  disabled={loading}
                  className={`p-5 rounded-xl border-2 text-left transition-all ${selected ? 'bg-red-700 text-white border-red-800 shadow-lg -translate-y-0.5' : 'bg-white border-slate-200 hover:border-red-400'}`}
                >
                  <span className="flex items-center justify-between gap-3">
                    <span className="font-black text-lg">{option.label || `${courseCount} Courses`}</span>
                    <span className={`font-black px-3 py-1 rounded-full ${selected ? 'bg-white/15' : 'bg-red-50 text-red-800'}`}>{priceLabel(option.price)}</span>
                  </span>
                  <span className="block text-sm mt-2 opacity-80">{courseCount === 2 ? 'Main + starter or dessert' : 'Starter + main + dessert'}</span>
                </button>
              );
            })}
          </div>
          {order.courses === 2 && menu.starters.length > 0 && menu.desserts.length > 0 && (
            <p className="mt-3 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-900 font-semibold">Choose either a starter or a dessert alongside your main.</p>
          )}
        </fieldset>

        <MenuSection
          title="Starters"
          subtitle={order.courses === 3 ? '*' : '(choose this or dessert)'}
          items={menu.starters}
          selectedId={order.starter}
          onSelect={(id) => handleCourseSelect('starter', id)}
          disabledItem={() => order.courses === 2 && order.dessert}
          loading={loading}
        />

        <MenuSection
          title="Main course *"
          subtitle=""
          items={menu.mains}
          selectedId={order.main}
          onSelect={(id) => handleCourseSelect('main', id)}
          accent="green"
          loading={loading}
        >
          {(item) => itemNeedsPreference(item) && (
            <div className="mt-3 ml-3 p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
              <p className="font-extrabold text-slate-800 mb-3">How would you like it cooked? *</p>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {['Rare', 'Medium-Rare', 'Medium', 'Medium-Well', 'Well Done'].map((preference) => (
                  <button
                    key={preference}
                    type="button"
                    onClick={() => setOrder((current) => ({ ...current, steakPreference: preference }))}
                    className={`px-2 py-2.5 rounded-lg border text-xs font-bold transition-colors ${order.steakPreference === preference ? 'bg-emerald-700 text-white border-emerald-800' : 'bg-white text-slate-700 border-slate-300 hover:border-emerald-500'}`}
                  >
                    {preference}
                  </button>
                ))}
              </div>
            </div>
          )}
        </MenuSection>

        <MenuSection
          title="Desserts"
          subtitle={order.courses === 3 ? '*' : '(choose this or starter)'}
          items={menu.desserts}
          selectedId={order.dessert}
          onSelect={(id) => handleCourseSelect('dessert', id)}
          disabledItem={() => order.courses === 2 && order.starter}
          loading={loading}
        />

        <button type="submit" disabled={loading} className="w-full py-4 px-5 text-lg font-black rounded-xl text-white bg-gradient-to-r from-red-800 via-red-700 to-emerald-800 shadow-lg hover:-translate-y-0.5 hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:translate-y-0">
          {loading ? 'Saving your selection…' : `Submit order · ${priceLabel(menu.courseOptions?.[order.courses]?.price)}`}
        </button>
      </form>
    </section>
  );
}
function OrdersView({ menu, guests, loading, lastUpdate, onRefresh, onExport }) {
  const stats = useMemo(() => {
    const result = { starters: {}, mains: {}, desserts: {} };
    ['starters', 'mains', 'desserts'].forEach((category) => {
      menu[category].forEach((item) => { result[category][item.id] = 0; });
    });
    guests.forEach((guest) => {
      if (guest.starter && result.starters[guest.starter] !== undefined) result.starters[guest.starter] += 1;
      if (guest.main && result.mains[guest.main] !== undefined) result.mains[guest.main] += 1;
      if (guest.dessert && result.desserts[guest.dessert] !== undefined) result.desserts[guest.dessert] += 1;
    });
    return result;
  }, [guests, menu]);

  return (
    <section className="max-w-6xl mx-auto bg-white/95 backdrop-blur rounded-2xl shadow-2xl border border-white/70 overflow-hidden">
      <div className="p-6 md:p-8 border-b border-slate-200 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-emerald-700 mb-1">{menu.title}</p>
          <h2 className="text-3xl font-black text-slate-900">Guest orders <span className="text-slate-400">({guests.length})</span></h2>
          {lastUpdate && <p className="text-sm text-slate-500 mt-2">Last synced at {lastUpdate.toLocaleTimeString('en-GB')}</p>}
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <button type="button" onClick={onRefresh} disabled={loading} className="px-5 py-3 bg-emerald-700 text-white rounded-xl font-bold hover:bg-emerald-800 flex items-center justify-center gap-2 disabled:opacity-50"><RefreshCw size={18} className={loading ? 'animate-spin' : ''} /> Refresh</button>
          <button type="button" onClick={onExport} className="px-5 py-3 bg-blue-700 text-white rounded-xl font-bold hover:bg-blue-800 flex items-center justify-center gap-2"><Download size={18} /> Export orders</button>
        </div>
      </div>

      <div className="p-6 md:p-8">
        <div className="rounded-2xl bg-slate-950 text-white p-5 md:p-6 mb-7">
          <h3 className="text-lg font-black mb-4">Kitchen totals</h3>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              ['starters', 'Starters'],
              ['mains', 'Main courses'],
              ['desserts', 'Desserts'],
            ].map(([category, label]) => (
              <div key={category}>
                <h4 className="text-xs font-bold uppercase tracking-[0.16em] text-amber-300 mb-3">{label}</h4>
                <div className="space-y-2 text-sm">
                  {menu[category].filter((item) => stats[category][item.id] > 0).map((item) => (
                    <p key={item.id} className="flex items-start gap-2"><strong className="text-emerald-300">{stats[category][item.id]}×</strong><span>{item.name}</span></p>
                  ))}
                  {!menu[category].some((item) => stats[category][item.id] > 0) && <p className="text-slate-400">None selected</p>}
                </div>
              </div>
            ))}
          </div>
        </div>

        {!guests.length ? (
          <div className="text-center py-14 text-slate-500"><Users size={56} className="mx-auto mb-4 opacity-30" /><p className="text-xl font-bold text-slate-700">No orders for this menu yet</p><p className="mt-2">Share its client link to start collecting selections.</p></div>
        ) : (
          <div className="grid lg:grid-cols-2 gap-4">
            {guests.map((guest, index) => {
              const main = getMenuItem(menu, 'mains', guest.main);
              return (
                <article key={`${guest.name}-${guest.orderDate}-${index}`} className="bg-slate-50 rounded-xl p-5 border border-slate-200">
                  <div className="flex justify-between items-start gap-4 mb-3">
                    <h3 className="text-xl font-black text-slate-900">{guest.name}</h3>
                    <span className="shrink-0 bg-red-100 text-red-800 px-3 py-1 rounded-full text-xs font-bold">{guest.courses} courses · {priceLabel(menu.courseOptions?.[guest.courses]?.price)}</span>
                  </div>
                  <div className="space-y-2 text-sm text-slate-700">
                    {guest.starter && <p><strong className="text-red-700">Starter:</strong> {getMenuItem(menu, 'starters', guest.starter)?.name || 'Menu item no longer available'}</p>}
                    <p><strong className="text-emerald-700">Main:</strong> {main?.name || 'Menu item no longer available'} {guest.steakPreference && <span className="ml-1 inline-block bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full text-xs font-bold">{guest.steakPreference}</span>}</p>
                    {guest.dessert && <p><strong className="text-red-700">Dessert:</strong> {getMenuItem(menu, 'desserts', guest.dessert)?.name || 'Menu item no longer available'}</p>}
                    <p className="pt-1 flex items-center gap-1.5 text-xs text-slate-500"><Calendar size={13} /> {guest.orderDate}</p>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
function AdminLogin({ onLogin, onCancel }) {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      await onLogin(username.trim(), password);
    } catch (loginError) {
      setError(loginError.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="max-w-md mx-auto rounded-2xl bg-white/95 p-7 md:p-9 shadow-2xl border border-white/70">
      <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-950 text-amber-300">
        <LockKeyhole size={28} />
      </div>
      <div className="text-center mb-7">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-red-700 mb-2">Private area</p>
        <h2 className="text-3xl font-black text-slate-950">Admin sign in</h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">Only the administrator can import menus, manage versions, or view all orders.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <label className="block">
          <span className="block text-sm font-extrabold mb-2 text-slate-800">Username</span>
          <input className="field" value={username} onChange={(event) => setUsername(event.target.value)} autoComplete="username" required disabled={submitting} />
        </label>
        <label className="block">
          <span className="block text-sm font-extrabold mb-2 text-slate-800">Password</span>
          <input className="field" type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" required disabled={submitting} />
        </label>
        {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-800">{error}</p>}
        <button type="submit" disabled={submitting} className="w-full rounded-xl bg-slate-950 px-5 py-3.5 font-black text-white transition-colors hover:bg-slate-800 disabled:opacity-50">
          {submitting ? 'Signing in…' : 'Sign in as admin'}
        </button>
        <button type="button" onClick={onCancel} disabled={submitting} className="w-full px-5 py-2 text-sm font-bold text-slate-600 hover:text-slate-950 disabled:opacity-50">Back to the menu</button>
      </form>
    </section>
  );
}
export default function ChristmasMenuSelector() {
  const clientMode = Boolean(SHARED_MENU);
  const [menus, setMenus] = useState(() => SHARED_MENU ? [SHARED_MENU] : readStoredMenus());
  const requestedMenuId = new URLSearchParams(window.location.search).get('menu');
  const [activeMenuId, setActiveMenuId] = useState(() => SHARED_MENU?.id || requestedMenuId || menus[0].id);
  const [order, setOrder] = useState(emptyOrder);
  const [guests, setGuests] = useState([]);
  const [viewMode, setViewMode] = useState('form');
  const [loading, setLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [message, setMessage] = useState('');
  const [isAdmin, setIsAdmin] = useState(() => !clientMode && import.meta.env.DEV);
  const [authChecking, setAuthChecking] = useState(() => !clientMode && !import.meta.env.DEV);

  const activeMenu = menus.find((menu) => menu.id === activeMenuId) || menus[0] || DEFAULT_MENU;
  const activeGuests = guests.filter((guest) => guest.menuId === activeMenu.id || (!guest.menuId && activeMenu.id === DEFAULT_MENU.id));

  useEffect(() => {
    if (!clientMode) storeMenus(menus);
  }, [clientMode, menus]);

  useEffect(() => {
    if (clientMode || import.meta.env.DEV) return undefined;
    let current = true;
    getAdminSession()
      .then((session) => {
        if (current) setIsAdmin(Boolean(session.authenticated));
      })
      .catch(() => {
        if (current) setIsAdmin(false);
      })
      .finally(() => {
        if (current) setAuthChecking(false);
      });
    return () => { current = false; };
  }, [clientMode]);

  const loadOrdersFromSheet = useCallback(async (quiet = false) => {
    try {
      if (!quiet) setLoading(true);
      const response = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${SHEET_NAME}?key=${API_KEY}`);
      if (!response.ok) throw new Error('Failed to load orders');
      const data = await response.json();
      const loaded = (data.values || []).slice(1).map((row) => ({
        name: row[0] || '',
        courses: Number.parseInt(row[1], 10) || 2,
        starter: row[2] || '',
        main: row[3] || '',
        dessert: row[4] || '',
        steakPreference: row[5] || '',
        orderDate: row[6] || '',
        menuId: row[7] || DEFAULT_MENU.id,
        menuTitle: row[8] || DEFAULT_MENU.title,
      }));
      setGuests(loaded);
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Error loading orders:', error);
      if (!quiet) setMessage('Orders could not be loaded from Google Sheets. Please check the connection and try again.');
    } finally {
      if (!quiet) setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!clientMode && isAdmin) loadOrdersFromSheet();
  }, [clientMode, isAdmin, loadOrdersFromSheet]);

  useEffect(() => {
    if (viewMode !== 'view' || !isAdmin) return undefined;
    const interval = window.setInterval(() => loadOrdersFromSheet(true), 30000);
    return () => window.clearInterval(interval);
  }, [isAdmin, loadOrdersFromSheet, viewMode]);

  const handleAdminLogin = async (username, password) => {
    await loginAsAdmin(username, password);
    setIsAdmin(true);
    setMessage('Admin access granted successfully.');
    setViewMode('manage');
  };

  const handleAdminLogout = async () => {
    try {
      if (!import.meta.env.DEV) await logoutAdmin();
    } finally {
      setIsAdmin(false);
      setGuests([]);
      setMessage('You have signed out of the admin area.');
      setViewMode('form');
    }
  };

  const activateMenu = (menuId) => {
    setActiveMenuId(menuId);
    setOrder(emptyOrder());
    setMessage('');
    setViewMode('form');
  };

  const saveMenu = (menu) => {
    setMenus((current) => current.some((item) => item.id === menu.id)
      ? current.map((item) => item.id === menu.id ? menu : item)
      : [...current, menu]);
    setActiveMenuId(menu.id);
  };

  const deleteMenu = (menuId) => {
    const menu = menus.find((item) => item.id === menuId);
    if (!menu || !window.confirm(`Delete the saved menu version “${menu.title}”? Existing Google Sheets orders will not be deleted.`)) return;
    const remaining = menus.filter((item) => item.id !== menuId);
    setMenus(remaining);
    if (activeMenuId === menuId) activateMenu(remaining[0].id);
  };

  const saveOrderToSheet = async (guest) => {
    setLoading(true);
    try {
      const rowData = [
        guest.name,
        guest.courses,
        guest.starter,
        guest.main,
        guest.dessert,
        guest.steakPreference,
        guest.orderDate,
        activeMenu.id,
        activeMenu.title,
      ];
      await fetch(SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sheetId: SHEET_ID, sheetName: SHEET_NAME, values: [rowData] }),
      });
      await new Promise((resolve) => window.setTimeout(resolve, 1000));
      if (!clientMode) await loadOrdersFromSheet(true);
      return true;
    } catch (error) {
      console.error('Error saving order:', error);
      setMessage('Your order could not be saved. Please try again.');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const submitOrder = async (event) => {
    event.preventDefault();
    setMessage('');
    if (!order.name.trim()) return setMessage('Please enter your name.');
    if (!order.main) return setMessage('Please select a main course.');

    const main = getMenuItem(activeMenu, 'mains', order.main);
    if (itemNeedsPreference(main) && !order.steakPreference) return setMessage('Please choose how you would like your steak cooked.');

    if (order.courses === 3) {
      if (activeMenu.starters.length && !order.starter) return setMessage('Please select a starter for the 3-course menu.');
      if (activeMenu.desserts.length && !order.dessert) return setMessage('Please select a dessert for the 3-course menu.');
    }
    if (order.courses === 2 && (activeMenu.starters.length || activeMenu.desserts.length)) {
      if (!order.starter && !order.dessert) return setMessage('Please select a starter or dessert for the 2-course menu.');
      if (order.starter && order.dessert) return setMessage('For the 2-course menu, select a starter or dessert, not both.');
    }

    const orderDate = new Date().toLocaleString('en-GB', {
      day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
    });
    const saved = await saveOrderToSheet({ ...order, name: order.name.trim(), orderDate });
    if (saved) {
      setOrder(emptyOrder());
      setMessage('Your order was submitted successfully.');
      setViewMode(clientMode ? 'form' : 'view');
    }
  };

  const exportOrders = () => {
    const lines = [
      '=======================================================',
      `${activeMenu.title.toUpperCase()} - FINAL ORDERS`,
      '=======================================================',
      '',
      `Menu version: ${activeMenu.id}`,
      `Event date: ${formatEventDate(activeMenu.eventDate)}`,
      `Total guests: ${activeGuests.length}`,
      ...[2, 3].map((count) => {
        const total = activeGuests.filter((guest) => guest.courses === count).length;
        return `${count}-course menu (${priceLabel(activeMenu.courseOptions?.[count]?.price)}): ${total}`;
      }),
      '',
      'KITCHEN TOTALS',
      '-------------------------------------------------------',
    ];

    ['starters', 'mains', 'desserts'].forEach((category) => {
      lines.push('', category.toUpperCase());
      activeMenu[category].forEach((item) => {
        const field = category === 'mains' ? 'main' : category.slice(0, -1);
        const selected = activeGuests.filter((guest) => guest[field] === item.id);
        if (selected.length) {
          lines.push(`${selected.length}x ${item.name}`);
          if (itemNeedsPreference(item)) {
            const preferences = selected.reduce((totals, guest) => {
              if (guest.steakPreference) totals[guest.steakPreference] = (totals[guest.steakPreference] || 0) + 1;
              return totals;
            }, {});
            Object.entries(preferences).forEach(([preference, count]) => lines.push(`   ${count}x ${preference}`));
          }
        }
      });
    });

    lines.push('', 'INDIVIDUAL ORDERS', '-------------------------------------------------------');
    activeGuests.forEach((guest, index) => {
      lines.push('', `${index + 1}. ${guest.name} (${guest.courses} courses)`, `   Ordered: ${guest.orderDate}`);
      if (guest.starter) lines.push(`   Starter: ${getMenuItem(activeMenu, 'starters', guest.starter)?.name || guest.starter}`);
      lines.push(`   Main: ${getMenuItem(activeMenu, 'mains', guest.main)?.name || guest.main}${guest.steakPreference ? ` (${guest.steakPreference})` : ''}`);
      if (guest.dessert) lines.push(`   Dessert: ${getMenuItem(activeMenu, 'desserts', guest.dessert)?.name || guest.dessert}`);
    });
    lines.push('', `Generated: ${new Date().toLocaleString('en-GB')}`);

    const blob = new Blob([lines.join('\n')], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${activeMenu.title.replace(/[^a-z0-9]+/gi, '_')}_orders_${new Date().toISOString().slice(0, 10)}.txt`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <main className="min-h-screen relative overflow-x-hidden w-full max-w-full bg-slate-950">
      <FestiveBackdrop />

      <div className="relative z-10 container mx-auto px-4 py-8 md:py-12">
        <FestiveScene title={activeMenu.title} eventDate={formatEventDate(activeMenu.eventDate)} clientMode={clientMode} />

        {!clientMode && isAdmin && menus.length > 1 && (
          <div className="max-w-md mx-auto mb-5">
            <label className="block text-xs uppercase tracking-wider font-bold text-white/70 mb-2 text-center">Active menu version</label>
            <select value={activeMenu.id} onChange={(event) => activateMenu(event.target.value)} className="field font-bold text-center">
              {menus.map((menu) => <option key={menu.id} value={menu.id}>{menu.title}</option>)}
            </select>
          </div>
        )}

        <nav className="flex flex-wrap justify-center gap-2 mb-7" aria-label="Main navigation">
          <button type="button" onClick={() => setViewMode('form')} className={`nav-button ${viewMode === 'form' ? 'nav-button-active' : ''}`}><ChefHat size={18} /> Place order</button>
          {!clientMode && isAdmin && <button type="button" onClick={() => { setViewMode('view'); loadOrdersFromSheet(); }} className={`nav-button ${viewMode === 'view' ? 'nav-button-active' : ''}`}><Users size={18} /> Orders <span className="nav-count">{activeGuests.length}</span></button>}
          {!clientMode && isAdmin && <button type="button" onClick={() => setViewMode('manage')} className={`nav-button ${viewMode === 'manage' ? 'nav-button-active' : ''}`}><Library size={18} /> Menus</button>}
          {!clientMode && !authChecking && !isAdmin && <button type="button" onClick={() => setViewMode('admin')} className={`nav-button ${viewMode === 'admin' ? 'nav-button-active' : ''}`}><LogIn size={18} /> Admin</button>}
          {!clientMode && isAdmin && !import.meta.env.DEV && <button type="button" onClick={handleAdminLogout} className="nav-button"><LogOut size={18} /> Sign out</button>}
        </nav>

        {loading && <div className="fixed top-4 right-4 z-50 bg-white rounded-xl shadow-xl px-4 py-3 flex items-center gap-2 text-sm font-bold text-slate-800"><RefreshCw className="animate-spin" size={17} /> Syncing…</div>}
        {message && <div className={`max-w-5xl mx-auto mb-5 px-4 py-3 rounded-xl border font-semibold ${message.includes('successfully') ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-amber-50 border-amber-200 text-amber-950'}`}>{message}</div>}

        {viewMode === 'form' && <OrderForm menu={activeMenu} order={order} setOrder={setOrder} loading={loading} onSubmit={submitOrder} clientMode={clientMode} />}
        {viewMode === 'admin' && !clientMode && !isAdmin && <AdminLogin onLogin={handleAdminLogin} onCancel={() => setViewMode('form')} />}
        {viewMode === 'view' && isAdmin && <OrdersView menu={activeMenu} guests={activeGuests} loading={loading} lastUpdate={lastUpdate} onRefresh={() => loadOrdersFromSheet()} onExport={exportOrders} />}
        {viewMode === 'manage' && !clientMode && isAdmin && <MenuManager menus={menus} activeMenuId={activeMenu.id} onActivate={activateMenu} onSave={saveMenu} onDelete={deleteMenu} />}
      </div>
    </main>
  );
}
