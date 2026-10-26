import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { DEFAULT_MENU } from '../src/menuData.js';

test('Google script saves menus, publishes one, and keeps guest orders working', () => {
  const sheets = new Map([['Orders', { rows: [['Name']], appendRow(row) { this.rows.push(row); } }]]);
  const properties = new Map([['MENU_WRITE_SECRET', 'menu-write-secret-of-at-least-32-characters']]);
  const context = {
    JSON, Date,
    ContentService: {
      MimeType: { JSON: 'application/json' },
      createTextOutput(text) { return { text, setMimeType() { return this; } }; },
    },
    SpreadsheetApp: {
      openById(id) {
        assert.equal(id, '1tNpDNx3LRTXE6nWUIaX1FZ1p8hcLJYodAf9zCSxQtMw');
        return {
          getSheetByName(name) { return sheets.get(name); },
          insertSheet(name) {
            const sheet = {
              rows: [],
              appendRow(row) { this.rows.push(row); },
              getLastRow() { return this.rows.length; },
              getDataRange() { return { getValues: () => this.rows }; },
              getRange(row, column, height, width) {
                return {
                  getValues: () => this.rows.slice(row - 1, row - 1 + height).map((values) => values.slice(column - 1, column - 1 + width)),
                  setValues: (values) => { this.rows[row - 1] = values[0]; },
                };
              },
            };
            sheets.set(name, sheet);
            return sheet;
          },
        };
      },
      flush() {},
    },
    PropertiesService: { getScriptProperties: () => ({
      getProperty(key) { return properties.get(key); },
      setProperty(key, value) { properties.set(key, value); },
    }) },
    LockService: { getScriptLock: () => ({ waitLock() {}, releaseLock() {} }) },
  };
  runInNewContext(readFileSync(new URL('../google-apps-script/Code.gs', import.meta.url), 'utf8'), context);
  const post = (body) => JSON.parse(context.doPost({ postData: { contents: JSON.stringify(body) } }).text);
  const get = () => JSON.parse(context.doGet({ parameter: { action: 'menus' } }).text);
  const menuRequest = { sheetId: '1tNpDNx3LRTXE6nWUIaX1FZ1p8hcLJYodAf9zCSxQtMw', secret: properties.get('MENU_WRITE_SECRET'), menu: DEFAULT_MENU };

  assert.equal(get().activeMenuId, DEFAULT_MENU.id);
  assert.equal(get().menus.length, 0);
  assert.equal(post({ ...menuRequest, action: 'saveMenu', secret: 'wrong' }).status, 'error');
  assert.equal(sheets.has('Menus'), false);
  assert.equal(post({ ...menuRequest, action: 'saveMenu' }).status, 'success');
  assert.equal(get().menus[0].mains[1].id, DEFAULT_MENU.mains[1].id);
  assert.equal(post({ ...menuRequest, action: 'publishMenu' }).status, 'success');
  assert.equal(get().activeMenuId, DEFAULT_MENU.id);
  assert.equal(sheets.get('Menus').rows.length, 2, 'publishing updates the existing row');

  assert.equal(post({ ...menuRequest, action: 'saveMenu', menu: { ...DEFAULT_MENU, deleted: true } }).status, 'success');
  assert.equal(get().menus[0].deleted, true);
  assert.equal(post({ ...menuRequest, action: 'saveMenu', menu: { ...DEFAULT_MENU, deleted: false } }).status, 'success');
  assert.equal(get().menus[0].deleted, false);
  assert.equal(sheets.get('Menus').rows.length, 2, 'deleting and restoring keep the menu record');

  const values = [['Guest', 3, 's1', 'm1', 'd1', '', '26 Oct 2026', DEFAULT_MENU.id, DEFAULT_MENU.title]];
  assert.equal(post({ sheetId: menuRequest.sheetId, sheetName: 'Orders', values }).status, 'success');
  assert.equal(sheets.get('Orders').rows.length, 2);
  assert.equal(context.doGet().text, 'Google Apps Script is working!');
});
