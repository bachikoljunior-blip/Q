'use strict';

const METRIC_NS = 'bachikoljunior-blip.github.io';
const METRIC_ACTION = 'fba-reimbursement-cost-audit';
const INSTALL_ID_KEY = 'fba-audit-install-id';
const INTEREST_KEY = 'fba-audit-monthly-interest';

const reportInput = document.getElementById('reportFile');
const costInput = document.getElementById('costFile');
const reportState = document.getElementById('reportState');
const costState = document.getElementById('costState');
const reportDrop = document.getElementById('reportDrop');
const costDrop = document.getElementById('costDrop');
const mappingSection = document.getElementById('mapping');
const mappingError = document.getElementById('mappingError');
const resultsSection = document.getElementById('results');
const summaryGrid = document.getElementById('summaryGrid');
const resultBody = document.getElementById('resultBody');
const visibleCount = document.getElementById('visibleCount');
const resultFilter = document.getElementById('resultFilter');
const toast = document.getElementById('toast');

const mappingIds = [
  'mapReportKey', 'mapDate', 'mapReimbursementId', 'mapReason',
  'mapAmountTotal', 'mapAmountPerUnit', 'mapCashQty',
  'mapInventoryQty', 'mapTotalQty', 'mapOriginalId',
  'mapCostKey', 'mapCostValue', 'mapCostNote'
];

const state = {
  report: null,
  costs: null,
  audited: [],
  filtered: [],
  claimPack: ''
};

const aliases = {
  reportKey: [
    'fnsku', 'seller-sku', 'seller sku', 'sku', 'merchant-sku', 'merchant sku',
    'asin', '出品者sku', '商品管理番号', 'セラーsku'
  ],
  date: ['approval-date', 'approval date', 'approved-date', '承認日', '補てん承認日', 'date'],
  reimbursementId: ['reimbursement-id', 'reimbursement id', '補てんid', '補填id', '返金id'],
  reason: ['reason', 'reimbursement-reason', '補てん理由', '補填理由', '理由', 'type'],
  amountTotal: ['amount-total', 'amount total', 'total-amount', '補てん合計額', '補填合計額', '合計金額', 'amount'],
  amountPerUnit: ['amount-per-unit', 'amount per unit', 'unit-amount', '1個あたり金額', '単価', '補てん単価'],
  cashQty: [
    'quantity-reimbursed-cash', 'quantity reimbursed cash', 'cash-quantity',
    '現金補てん数量', '現金補填数量', 'cash qty'
  ],
  inventoryQty: [
    'quantity-reimbursed-inventory', 'quantity reimbursed inventory',
    '在庫補てん数量', '在庫補填数量', 'inventory qty'
  ],
  totalQty: [
    'quantity-reimbursed-total', 'quantity reimbursed total', 'quantity',
    '補てん数量合計', '補填数量合計', '数量'
  ],
  originalId: [
    'original-reimbursement-id', 'original reimbursement id',
    '元の補てんid', '元の補填id', 'original id'
  ],
  costKey: [
    'fnsku', 'seller-sku', 'seller sku', 'sku', 'merchant-sku', 'asin',
    '出品者sku', '商品管理番号', 'セラーsku'
  ],
  costValue: [
    'sourcing-cost', 'sourcing cost', 'manufacturing-cost', 'manufacturing cost',
    'unit-cost', 'unit cost', 'cost', '仕入原価', '製造原価', '原価'
  ],
  costNote: ['notes', 'note', 'memo', '原価メモ', 'メモ', '備考']
};

function getInstallId() {
  let id = localStorage.getItem(INSTALL_ID_KEY);
  if (!id) {
    id = crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    localStorage.setItem(INSTALL_ID_KEY, id);
  }
  return id;
}

function track(key, { once = false } = {}) {
  try {
    const onceKey = `metric-once-${METRIC_ACTION}-${key}`;
    if (once && localStorage.getItem(onceKey)) return;
    const url = new URL(`https://counterapi.com/api/${METRIC_NS}/${METRIC_ACTION}/${encodeURIComponent(key)}`);
    url.searchParams.set('trackOnly', 'true');
    url.searchParams.set('userId', getInstallId());
    fetch(url.toString(), { mode: 'no-cors', keepalive: true }).catch(() => {});
    if (once) localStorage.setItem(onceKey, '1');
  } catch (_) {
    // Measurement must never block the audit.
  }
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => toast.classList.remove('show'), 2300);
}

function normalizeHeader(value) {
  return String(value ?? '')
    .replace(/^\uFEFF/, '')
    .normalize('NFKC')
    .trim()
    .toLowerCase()
    .replace(/[＿_]+/g, '-')
    .replace(/\s+/g, ' ')
    .replace(/\s*-\s*/g, '-');
}

function normalizeKey(value) {
  return String(value ?? '')
    .normalize('NFKC')
    .trim()
    .toUpperCase()
    .replace(/\s+/g, '');
}

function parseNumber(value) {
  if (value === null || value === undefined || value === '') return NaN;
  let text = String(value).normalize('NFKC').trim();
  if (!text) return NaN;
  const negativeByParens = /^\(.*\)$/.test(text);
  text = text
    .replace(/[¥￥$€£,\s]/g, '')
    .replace(/[()]/g, '')
    .replace(/−/g, '-');
  const number = Number(text);
  if (!Number.isFinite(number)) return NaN;
  return negativeByParens ? -Math.abs(number) : number;
}

function parseDate(value) {
  const text = String(value ?? '').normalize('NFKC').trim();
  if (!text) return null;

  const isoLike = text
    .replace(/[年月]/g, '-')
    .replace(/日/g, '')
    .replace(/\./g, '-')
    .replace(/\//g, '-');
  const match = isoLike.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (match) {
    const date = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])));
    return Number.isNaN(date.getTime()) ? null : date;
  }

  const us = text.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})/);
  if (us) {
    const date = new Date(Date.UTC(Number(us[3]), Number(us[1]) - 1, Number(us[2])));
    return Number.isNaN(date.getTime()) ? null : date;
  }

  const fallback = new Date(text);
  return Number.isNaN(fallback.getTime()) ? null : fallback;
}

function formatDate(date) {
  if (!date) return '不明';
  return new Intl.DateTimeFormat('ja-JP', {
    timeZone: 'UTC', year: 'numeric', month: '2-digit', day: '2-digit'
  }).format(date);
}

function formatYen(value) {
  if (!Number.isFinite(value)) return '—';
  return `${value < 0 ? '-' : ''}¥${Math.round(Math.abs(value)).toLocaleString('ja-JP')}`;
}

function csvEscape(value) {
  const text = String(value ?? '');
  return /[",\r\n\t]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function detectDelimiter(text) {
  const lines = String(text).replace(/^\uFEFF/, '').split(/\r?\n/).filter(line => line.trim()).slice(0, 6);
  const candidates = ['\t', ',', ';'];
  let best = '\t';
  let bestScore = -Infinity;

  for (const delimiter of candidates) {
    const counts = lines.map(line => countDelimiterOutsideQuotes(line, delimiter));
    if (!counts.length) continue;
    const positive = counts.filter(count => count > 0);
    if (!positive.length) continue;
    const average = positive.reduce((sum, count) => sum + count, 0) / positive.length;
    const variance = positive.reduce((sum, count) => sum + Math.abs(count - average), 0) / positive.length;
    const score = average * 10 - variance - (positive.length !== counts.length ? 4 : 0);
    if (score > bestScore) {
      bestScore = score;
      best = delimiter;
    }
  }
  return best;
}

function countDelimiterOutsideQuotes(line, delimiter) {
  let inQuotes = false;
  let count = 0;
  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') i += 1;
      else inQuotes = !inQuotes;
    } else if (char === delimiter && !inQuotes) {
      count += 1;
    }
  }
  return count;
}

function parseDelimited(text) {
  const source = String(text ?? '').replace(/^\uFEFF/, '');
  const delimiter = detectDelimiter(source);
  const rows = [];
  let row = [];
  let cell = '';
  let inQuotes = false;

  for (let i = 0; i < source.length; i += 1) {
    const char = source[i];

    if (inQuotes) {
      if (char === '"') {
        if (source[i + 1] === '"') {
          cell += '"';
          i += 1;
        } else {
          inQuotes = false;
        }
      } else {
        cell += char;
      }
      continue;
    }

    if (char === '"') {
      inQuotes = true;
    } else if (char === delimiter) {
      row.push(cell);
      cell = '';
    } else if (char === '\n') {
      row.push(cell.replace(/\r$/, ''));
      if (row.some(value => String(value).trim() !== '')) rows.push(row);
      row = [];
      cell = '';
    } else {
      cell += char;
    }
  }

  row.push(cell.replace(/\r$/, ''));
  if (row.some(value => String(value).trim() !== '')) rows.push(row);

  if (rows.length < 2) {
    throw new Error('見出し行とデータ行を読み取れませんでした。CSV/TSV/TXTを確認してください。');
  }

  const headers = rows[0].map((header, index) => {
    const trimmed = String(header).replace(/^\uFEFF/, '').trim();
    return trimmed || `column-${index + 1}`;
  });

  const data = rows.slice(1).map((cells, rowIndex) => {
    const record = { __rowNumber: rowIndex + 2 };
    headers.forEach((header, index) => {
      record[header] = cells[index] ?? '';
    });
    return record;
  }).filter(record => headers.some(header => String(record[header] ?? '').trim() !== ''));

  return { delimiter, headers, rows: data };
}

function delimiterLabel(delimiter) {
  if (delimiter === '\t') return 'TSV';
  if (delimiter === ';') return 'セミコロン区切り';
  return 'CSV';
}

function findHeader(headers, candidates) {
  const normalized = headers.map(header => normalizeHeader(header));

  for (const candidate of candidates) {
    const exact = normalized.indexOf(normalizeHeader(candidate));
    if (exact >= 0) return headers[exact];
  }

  for (const candidate of candidates) {
    const target = normalizeHeader(candidate);
    const fuzzy = normalized.findIndex(header => header.includes(target) || target.includes(header));
    if (fuzzy >= 0) return headers[fuzzy];
  }
  return '';
}

function fillSelect(id, headers, selected = '', optional = true) {
  const select = document.getElementById(id);
  select.innerHTML = '';

  if (optional) {
    const empty = document.createElement('option');
    empty.value = '';
    empty.textContent = '使用しない / 見つからない';
    select.appendChild(empty);
  }

  headers.forEach(header => {
    const option = document.createElement('option');
    option.value = header;
    option.textContent = header;
    if (header === selected) option.selected = true;
    select.appendChild(option);
  });
}

function populateMappings() {
  if (!state.report || !state.costs) return;

  const rh = state.report.headers;
  const ch = state.costs.headers;

  fillSelect('mapReportKey', rh, findHeader(rh, aliases.reportKey), false);
  fillSelect('mapDate', rh, findHeader(rh, aliases.date));
  fillSelect('mapReimbursementId', rh, findHeader(rh, aliases.reimbursementId));
  fillSelect('mapReason', rh, findHeader(rh, aliases.reason));
  fillSelect('mapAmountTotal', rh, findHeader(rh, aliases.amountTotal));
  fillSelect('mapAmountPerUnit', rh, findHeader(rh, aliases.amountPerUnit));
  fillSelect('mapCashQty', rh, findHeader(rh, aliases.cashQty));
  fillSelect('mapInventoryQty', rh, findHeader(rh, aliases.inventoryQty));
  fillSelect('mapTotalQty', rh, findHeader(rh, aliases.totalQty));
  fillSelect('mapOriginalId', rh, findHeader(rh, aliases.originalId));

  fillSelect('mapCostKey', ch, findHeader(ch, aliases.costKey), false);
  fillSelect('mapCostValue', ch, findHeader(ch, aliases.costValue), false);
  fillSelect('mapCostNote', ch, findHeader(ch, aliases.costNote));

  mappingSection.hidden = false;
  mappingSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
}
