// Replace the existing Code.gs with this file, then deploy a new Web app version.
// Set MENU_WRITE_SECRET in Project Settings > Script properties.
const MENU_SHEET_ID = '1tNpDNx3LRTXE6nWUIaX1FZ1p8hcLJYodAf9zCSxQtMw';
const INITIAL_MENU_ID = 'ppn-christmas-diner-menu-mvldpwzh';

function jsonResponse(body) {
  return ContentService.createTextOutput(JSON.stringify(body))
    .setMimeType(ContentService.MimeType.JSON);
}

function doGet(e) {
  if (!e || e.parameter.action !== 'menus') {
    return ContentService.createTextOutput('Google Apps Script is working!');
  }
  try {
    const spreadsheet = SpreadsheetApp.openById(MENU_SHEET_ID);
    const sheet = spreadsheet.getSheetByName('Menus');
    const rows = sheet ? sheet.getDataRange().getValues().slice(1) : [];
    const menus = rows.filter((row) => row[0]).map((row) => JSON.parse(row[3]));
    const activeMenuId = PropertiesService.getScriptProperties().getProperty('ACTIVE_MENU_ID') || INITIAL_MENU_ID;
    return jsonResponse({ status: 'success', menus: menus, activeMenuId: activeMenuId });
  } catch (error) {
    return jsonResponse({ status: 'error', message: String(error) });
  }
}

function validMenu(menu) {
  if (!menu || typeof menu.id !== 'string' || !/^[a-z0-9][a-z0-9-]{0,79}$/.test(menu.id)
      || typeof menu.title !== 'string' || !menu.title.trim() || menu.title.length > 120) return false;
  if (!menu.courseOptions || !menu.courseOptions[2] || !menu.courseOptions[3]) return false;
  return ['starters', 'mains', 'desserts'].every(function (category) {
    return Array.isArray(menu[category]) && menu[category].length <= 80
      && (category !== 'mains' || menu[category].length > 0)
      && menu[category].every(function (item) {
        return item && typeof item.id === 'string' && /^[a-z0-9][a-z0-9-]{0,79}$/.test(item.id)
          && typeof item.name === 'string' && item.name.trim() && item.name.length <= 250;
      });
  });
}

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    if (data.action === 'saveMenu' || data.action === 'publishMenu') {
      const properties = PropertiesService.getScriptProperties();
      const secret = properties.getProperty('MENU_WRITE_SECRET');
      if (!secret || secret.length < 32 || data.secret !== secret) {
        return jsonResponse({ status: 'error', message: 'Menu write access denied.' });
      }
      if (data.sheetId !== MENU_SHEET_ID || !validMenu(data.menu)
          || JSON.stringify(data.menu).length > 45000) {
        return jsonResponse({ status: 'error', message: 'Invalid menu data.' });
      }
      const lock = LockService.getScriptLock();
      lock.waitLock(10000);
      try {
        const spreadsheet = SpreadsheetApp.openById(MENU_SHEET_ID);
        let sheet = spreadsheet.getSheetByName('Menus');
        if (!sheet) {
          sheet = spreadsheet.insertSheet('Menus');
          sheet.appendRow(['Menu ID', 'Title', 'Event date', 'Menu JSON', 'Updated at']);
        }
        const ids = sheet.getLastRow() > 1
          ? sheet.getRange(2, 1, sheet.getLastRow() - 1, 1).getValues().map(function (row) { return row[0]; })
          : [];
        const existingIndex = ids.indexOf(data.menu.id);
        const rowNumber = existingIndex >= 0 ? existingIndex + 2 : sheet.getLastRow() + 1;
        const sheetTitle = /^[=+@-]/.test(data.menu.title.trim()) ? "'" + data.menu.title : data.menu.title;
        sheet.getRange(rowNumber, 1, 1, 5).setValues([[
          data.menu.id, sheetTitle, data.menu.eventDate || '',
          JSON.stringify(data.menu), new Date().toISOString(),
        ]]);
        if (data.action === 'publishMenu') properties.setProperty('ACTIVE_MENU_ID', data.menu.id);
        SpreadsheetApp.flush();
        return jsonResponse({
          status: 'success', menuId: data.menu.id,
          activeMenuId: properties.getProperty('ACTIVE_MENU_ID') || INITIAL_MENU_ID,
        });
      } finally {
        lock.releaseLock();
      }
    }

    // Existing guest order contract, kept compatible with the website.
    if (data.sheetId !== MENU_SHEET_ID || data.sheetName !== 'Orders'
        || !Array.isArray(data.values) || data.values.length !== 1
        || !Array.isArray(data.values[0]) || data.values[0].length !== 9) {
      return jsonResponse({ status: 'error', message: 'Invalid order data.' });
    }
    const orders = SpreadsheetApp.openById(MENU_SHEET_ID).getSheetByName('Orders');
    if (!orders) return jsonResponse({ status: 'error', message: 'Orders sheet not found.' });
    const safeRow = data.values[0].map(function (value) {
      return typeof value === 'string' && /^[=+@-]/.test(value.trim()) ? "'" + value : value;
    });
    orders.appendRow(safeRow);
    return jsonResponse({ status: 'success', message: 'Order saved successfully' });
  } catch (error) {
    return jsonResponse({ status: 'error', message: String(error) });
  }
}
