import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildColumnRegions,
  editorTextToItems,
  findMenuColumnHeadings,
  groupOcrColumnLines,
  itemsToEditorText,
  mergeOcrLines,
  parseMenuText,
} from '../src/menuParser.js';

function line(text, y0, height = 34) {
  return { text, confidence: 90, bbox: { x0: 0, y0, x1: 600, y1: y0 + height } };
}

test('finds the three headings even when OCR puts them on one visual line', () => {
  const blocks = [{
    paragraphs: [{
      lines: [{
        words: [
          { text: 'STARTERS', bbox: { x0: 72, y0: 244, x1: 165, y1: 258 } },
          { text: 'MAINS', bbox: { x0: 473, y0: 244, x1: 533, y1: 258 } },
          { text: 'DESSERTS', bbox: { x0: 873, y0: 244, x1: 968, y1: 258 } },
        ],
      }],
    }],
  }];

  const headings = findMenuColumnHeadings(blocks);
  assert.deepEqual(headings.map(({ category }) => category), ['starters', 'mains', 'desserts']);

  const regions = buildColumnRegions(headings, 1321, 224, 620);
  assert.ok(regions[0].left < 72);
  assert.ok(regions[0].left + regions[0].width > 440);
  assert.ok(regions[1].left < 473);
  assert.ok(regions[1].left + regions[1].width < 873);
  assert.ok(regions[2].left + regions[2].width < 1250);
});

test('groups small description lines with the dish above instead of making extra dishes', () => {
  const starters = groupOcrColumnLines([
    line('STARTERS', 729, 46),
    line('Mini Baked Camembert', 850),
    line('Roasted breads, confit garlic, cranberry jam', 929),
    line('Smoked Salmon', 1059),
    line('Horseradish crème fraîche, caper berries, lemon & shallot dressing', 1139),
    line('Creamy Wild Mushrooms', 1294),
    line('Chargrilled garlic sourdough (VOA)', 1378),
    line('Chicken Liver Parfait', 1503),
    line('Smoked sea salt crostini, caramelised fig & onion chutney', 1587),
  ], 'starters');

  assert.deepEqual(starters, [
    'Mini Baked Camembert — Roasted breads, confit garlic, cranberry jam',
    'Smoked Salmon — Horseradish crème fraîche, caper berries, lemon & shallot dressing',
    'Creamy Wild Mushrooms — Chargrilled garlic sourdough (VOA)',
    'Chicken Liver Parfait — Smoked sea salt crostini, caramelised fig & onion chutney',
  ]);

  const mains = groupOcrColumnLines([
    line('MAINS', 729, 46),
    line('Pan Fried Chicken Supreme', 850, 42),
    line('Crushed new potatoes, buttered greens & tarragon cream', 929),
    line('Oven Baked Salmon', 1036),
    line('Sautéed potatoes, green beans & Provençal sauce', 1108),
    line('Butternut Squash, Roasted Chestnut & Sage Tart', 1220, 42),
    line('Roasted new potatoes, tomato & cranberry compote (V) (VOA)', 1304),
    line('8oz Sirloin', 1403),
    line('Fries, tenderstem broccoli, flat mushroom & 3 peppercorn sauce', 1478),
    line('10oz Fillet Mignon', 1612, 43),
    line('Fries, tenderstem broccoli, flat mushroom & Port and Stilton sauce (£8', 1691),
    line('supplement)', 1738, 30),
  ], 'mains');

  assert.equal(mains.length, 5);
  assert.equal(mains[4], '10oz Fillet Mignon — Fries, tenderstem broccoli, flat mushroom & Port and Stilton sauce (£8 supplement)');
});

test('merges a title recovered by the sparse-text fallback into its visual position', () => {
  const primary = [
    line('DESSERTS', 75, 46),
    line('Dark Cherry & Chocolate Brownie', 196, 41),
    line('Madagascan vanilla ice cream & warm chocolate sauce', 276, 33),
    line('Apple, Blackberry & Cinnamon Crumble', 405, 42),
    line('Served with custard', 485, 26),
    line('Warm Christmas Pudding', 614, 42),
    line('Brandy sauce', 694, 31),
    line('Whipped cream & honeycomb', 899, 32),
  ];
  const sparse = [
    line('Dark Cherry & Chocolate Brownie', 196, 41),
    line('Apple, Blackberry & Cinnamon Crumble', 405, 42),
    line('Warm Christmas Pudding', 614, 42),
    line('Layered Salted Caramel Cheesecake', 814, 42),
  ];

  const merged = mergeOcrLines(primary, sparse);
  const desserts = groupOcrColumnLines(merged, 'desserts');
  assert.deepEqual(desserts, [
    'Dark Cherry & Chocolate Brownie — Madagascan vanilla ice cream & warm chocolate sauce',
    'Apple, Blackberry & Cinnamon Crumble — Served with custard',
    'Warm Christmas Pudding — Brandy sauce',
    'Layered Salted Caramel Cheesecake — Whipped cream & honeycomb',
  ]);
});

test('splits dessert dishes when OCR collapses the column into one visual line', () => {
  const desserts = groupOcrColumnLines([
    line('DESSERTS', 75, 46),
    line(
      'Dark Cherry & Chocolate Brownie — Madagascan vanilla ice cream & warm chocolate sauce   Apple, Blackberry & Cinnamon Crumble — Served with custard   Warm Christmas Pudding — Brandy sauce   Layered Salted Caramel Cheesecake — Whipped cream & honeycomb',
      196,
      42,
    ),
  ], 'desserts');

  assert.deepEqual(desserts, [
    'Dark Cherry & Chocolate Brownie — Madagascan vanilla ice cream & warm chocolate sauce',
    'Apple, Blackberry & Cinnamon Crumble — Served with custard',
    'Warm Christmas Pudding — Brandy sauce',
    'Layered Salted Caramel Cheesecake — Whipped cream & honeycomb',
  ]);
});

test('recovers dessert boundaries from a flattened browser OCR result', () => {
  const desserts = groupOcrColumnLines([
    line('DESSERTS', 75, 46),
    line(
      'Dark Cherry & Chocolate Brownie Madagascan vanilla ice cream & warm chocolate sauce Apple, Blackberry & Cinnamon Crumble Served with custard Warm Christmas Pudding Brandy sauce Layered Salted Caramel Cheesecake ¥ Layered Salted Caramel Cheesecake Whipped cream & honeycomb',
      196,
      42,
    ),
  ], 'desserts');

  assert.deepEqual(desserts, [
    'Dark Cherry & Chocolate Brownie — Madagascan vanilla ice cream & warm chocolate sauce',
    'Apple, Blackberry & Cinnamon Crumble — Served with custard',
    'Warm Christmas Pudding — Brandy sauce',
    'Layered Salted Caramel Cheesecake — Whipped cream & honeycomb',
  ]);
});

test('parses this poster into 4 starters, 5 mains and 4 desserts with prices', () => {
  const text = `
2COURSES £40 | 3 COURSES £45
STARTERS
Mini Baked Camembert — Roasted breads, confit garlic, cranberry jam
Smoked Salmon — Horseradish crème fraîche, caper berries, lemon & shallot dressing
Creamy Wild Mushrooms — Chargrilled garlic sourdough (VOA)
Chicken Liver Parfait — Smoked sea salt crostini, caramelised fig & onion chutney
MAINS
Pan Fried Chicken Supreme — Crushed new potatoes, buttered greens & tarragon cream
Oven Baked Salmon — Sautéed potatoes, green beans & Provençal sauce
Butternut Squash, Roasted Chestnut & Sage Tart — Roasted new potatoes, tomato & cranberry compote (V) (VOA)
8oz Sirloin — Fries, tenderstem broccoli, flat mushroom & 3 peppercorn sauce
10oz Fillet Mignon — Fries, tenderstem broccoli, flat mushroom & Port and Stilton sauce (£8 supplement)
DESSERTS
Dark Cherry & Chocolate Brownie — Madagascan vanilla ice cream & warm chocolate sauce
Apple, Blackberry & Cinnamon Crumble — Served with custard
Warm Christmas Pudding — Brandy sauce
Layered Salted Caramel Cheesecake — Whipped cream & honeycomb
`;

  const parsed = parseMenuText(text);
  assert.equal(parsed.starters.length, 4);
  assert.equal(parsed.mains.length, 5);
  assert.equal(parsed.desserts.length, 4);
  assert.equal(parsed.courseOptions[2].price, 40);
  assert.equal(parsed.courseOptions[3].price, 45);
  assert.equal(parsed.starters[0].name, 'Mini Baked Camembert');
  assert.equal(parsed.starters[0].description, 'Roasted breads, confit garlic, cranberry jam');
  assert.deepEqual(parsed.starters[2].tags, ['voa']);

  const edited = itemsToEditorText(parsed.mains);
  const roundTripped = editorTextToItems(edited, 'mains');
  assert.equal(roundTripped[4].description, parsed.mains[4].description);
});
