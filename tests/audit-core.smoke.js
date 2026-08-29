const fs = require('fs');
const vm = require('vm');
const assert = require('assert');

function element() {
  return {
    value: '', hidden: false, textContent: '', innerHTML: '', files: [],
    classList: { add() {}, remove() {} },
    addEventListener() {}, scrollIntoView() {}, appendChild() {}, remove() {},
    setAttribute() {}, querySelectorAll() { return []; }
  };
}

const elements = new Map();
const documentStub = {
  getElementById(id) {
    if (!elements.has(id)) elements.set(id, element());
    return elements.get(id);
  },
  createElement() { return element(); },
  body: element()
};

const storage = new Map();
const context = {
  console,
  document: documentStub,
  window: { addEventListener() {}, clearTimeout, setTimeout },
  navigator: {},
  localStorage: {
    getItem(key) { return storage.has(key) ? storage.get(key) : null; },
    setItem(key, value) { storage.set(key, String(value)); },
    removeItem(key) { storage.delete(key); }
  },
  crypto: { randomUUID: () => 'test-id' },
  fetch: () => Promise.resolve({ ok: true, json: async () => ({ value: 0 }) }),
  URL, Blob, setTimeout, clearTimeout,
  Intl, Date, Number, String, Math, Map, Promise
};
vm.createContext(context);
for (const file of ['app-core.js', 'app-audit.js', 'app-ui.js']) {
  vm.runInContext(fs.readFileSync(file, 'utf8'), context);
}

const parsed = context.parseDelimited(
  'approval-date\treimbursement-id\treason\tseller-sku\tamount-total\tquantity-reimbursed-cash\n' +
  '2026-08-01\tR1\tDamaged_Warehouse\tSKU-1\t800\t1\n'
);
assert.strictEqual(parsed.headers.length, 6);
assert.strictEqual(parsed.rows.length, 1);
assert.strictEqual(parsed.rows[0]['seller-sku'], 'SKU-1');

const quoted = context.parseDelimited('sku,cost,note\n"A,1","1,200","x""y"\n');
assert.strictEqual(quoted.rows[0].sku, 'A,1');
assert.strictEqual(context.parseNumber(quoted.rows[0].cost), 1200);
assert.strictEqual(quoted.rows[0].note, 'x"y');

const jp = context.parseDelimited(
  '承認日,補てんID,理由,出品者SKU,補てん合計額,現金補てん数量\n' +
  '2026/08/01,R-JP,倉庫破損,SKU-JP,￥900,1\n'
);
assert.strictEqual(jp.rows[0]['出品者SKU'], 'SKU-JP');
assert.strictEqual(context.parseNumber(jp.rows[0]['補てん合計額']), 900);
assert.strictEqual(context.findHeader(jp.headers, ['出品者sku']), '出品者SKU');
assert.strictEqual(context.classifyReason('倉庫破損', 900, '').costBased, true);

assert.strictEqual(context.normalizeKey(' sku-1 '), 'SKU-1');
assert.strictEqual(context.classifyReason('Damaged_Warehouse', 800, '').costBased, true);
assert.strictEqual(context.classifyReason('Lost_Inbound', 800, '').costBased, true);
assert.strictEqual(context.classifyReason('Customer_Return', 800, '').costBased, false);
assert.strictEqual(context.classifyReason('Damaged_Outbound', 800, '').costBased, false);
assert.strictEqual(context.classifyReason('Damaged', 800, '').costBased, false);
assert.strictEqual(context.classifyReason('Reimbursement_Reversal', -800, 'R1').type, 'reversal');
assert.strictEqual(context.costDefinitionWarning('送料込み landed cost'), true);
assert.strictEqual(context.costDefinitionWarning('商品本体のみ'), false);

console.log('audit core smoke passed');
