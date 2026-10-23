import test from 'node:test';
import assert from 'node:assert/strict';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createServer } from 'vite';
import { createOrderConfirmation } from '../src/orderReceipt.js';

const menu = {
  id: 'christmas-2026', title: 'Christmas Dinner', eventDate: '2026-12-09',
  courseOptions: { 2: { price: 40 }, 3: { price: 45 } },
  starters: [{ id: 's1', name: 'Creamy Wild Mushrooms' }],
  mains: [{ id: 'm1', name: 'Fillet Mignon', description: 'Port sauce (£8 supplement)' }],
  desserts: [{ id: 'd1', name: 'Caramel Cheesecake' }],
};
const order = {
  name: ' Test Guest ', courses: 3, starter: 's1', main: 'm1', dessert: 'd1',
  steakPreference: 'Medium-Rare', orderDate: '23 Oct 2026, 21:00',
};

test('receipt snapshots names, package price and preferences before resetting the form', () => {
  const sourceMenu = structuredClone(menu);
  const sourceOrder = { ...order };
  const receipt = createOrderConfirmation(sourceMenu, sourceOrder);
  sourceOrder.name = '';
  sourceOrder.main = '';
  sourceMenu.mains[0].name = 'Different dish';
  sourceMenu.courseOptions[3].price = 99;
  assert.equal(receipt.name, 'Test Guest');
  assert.equal(receipt.price, 45);
  assert.equal(receipt.dishes[1].name, 'Fillet Mignon');
  assert.equal(receipt.dishes[1].preference, 'Medium-Rare');
  assert.equal(receipt.menuId, menu.id);
});

test('two-course receipts only include the chosen starter or dessert', () => {
  for (const omitted of ['starter', 'dessert']) {
    const receipt = createOrderConfirmation(menu, { ...order, courses: 2, [omitted]: '' });
    assert.equal(receipt.dishes.length, 2);
    assert.equal(receipt.price, 40);
    assert.ok(!receipt.dishes.some((dish) => dish.label.toLowerCase() === omitted));
  }
});

test('confirmation renders the submitted meal, preference, supplement and next action', async () => {
  const server = await createServer({ server: { middlewareMode: true }, appType: 'custom' });
  try {
    const { default: OrderConfirmation } = await server.ssrLoadModule('/src/OrderConfirmation.jsx');
    const html = renderToStaticMarkup(createElement(OrderConfirmation, {
      confirmation: createOrderConfirmation(menu, order), onNewOrder() {},
    }));
    for (const text of ['Your order is confirmed', 'Test Guest', 'Creamy Wild Mushrooms', 'Fillet Mignon', 'Caramel Cheesecake', 'Medium-Rare', '£45.00', '£8 supplement', 'Place another order']) {
      assert.ok(html.includes(text), `missing ${text}`);
    }
    assert.ok(!html.includes('Submit order'));
    assert.ok(html.includes('aria-labelledby="order-confirmation-title"'));

    const twoCourse = renderToStaticMarkup(createElement(OrderConfirmation, {
      confirmation: createOrderConfirmation(menu, { ...order, courses: 2, starter: '', steakPreference: '' }), onNewOrder() {},
    }));
    assert.ok(!twoCourse.includes('Creamy Wild Mushrooms'));
    assert.ok(!twoCourse.includes('Cooking preference:'));
    assert.ok(twoCourse.includes('£40.00'));
  } finally {
    await server.close();
  }
});
