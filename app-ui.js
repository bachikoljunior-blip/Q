function renderResults() {
  const records = state.audited;
  const costCandidates = records.filter(record => record.classInfo.costBased);
  const withinWindow = costCandidates.filter(record => record.daysLeft === null || record.daysLeft >= 0);
  const potential = withinWindow.reduce((sum, record) =>
    sum + (record.shortfall > 0 && Number.isFinite(record.fullGap) ? record.fullGap : 0), 0);
  const missing = costCandidates.filter(record => !Number.isFinite(record.cost)).length;
  const urgent = records.filter(record => record.daysLeft !== null && record.daysLeft >= 0 && record.daysLeft <= 14 && record.bucket !== 'reversal').length;

  summaryGrid.innerHTML = [
    summaryCard(records.length.toLocaleString('ja-JP'), '読込補てん行', ''),
    summaryCard(formatYen(potential), '閾値を超えた差額候補', potential > 0 ? 'critical' : 'good'),
    summaryCard(missing.toLocaleString('ja-JP'), '原価未照合', missing > 0 ? 'warn' : 'good'),
    summaryCard(urgent.toLocaleString('ja-JP'), '期限14日以内候補', urgent > 0 ? 'critical' : 'good')
  ].join('');

  resultsSection.hidden = false;
  applyFilter();
  resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function summaryCard(value, label, className) {
  return `<article class="summary-card ${className}"><strong>${value}</strong><span>${label}</span></article>`;
}

function applyFilter() {
  const filter = resultFilter.value;
  state.filtered = filter === 'all' ? state.audited : state.audited.filter(record => record.bucket === filter);
  resultBody.innerHTML = state.filtered.map(renderRow).join('');
  visibleCount.textContent = `${state.filtered.length.toLocaleString('ja-JP')}件を表示`;
}

function renderRow(record) {
  const badgeClass = record.bucket;
  const badgeText = {
    high: '要確認',
    missing: '原価なし',
    review: '理由確認',
    reversal: '取消候補',
    ok: '大きな差なし'
  }[record.bucket] || '確認';

  const deadline = renderDeadline(record);
  const expected = Number.isFinite(record.expected) ? `${formatYen(record.expected)}<br><span class="muted">${formatYen(record.cost)} × ${record.cashQty}</span>` : '—';
  const reason = escapeHtml(record.reason || '不明');
  const idLine = record.reimbursementId ? `<br><span class="muted">ID: ${escapeHtml(record.reimbursementId)}</span>` : '';
  const flags = record.flags.length ? record.flags.map(flag => `• ${escapeHtml(flag)}`).join('<br>') : '明確な指摘なし';

  return `<tr>
    <td><span class="issue-badge ${badgeClass}">${badgeText}</span></td>
    <td>${deadline}</td>
    <td><strong>${escapeHtml(record.key)}</strong>${idLine}</td>
    <td>${reason}<br><span class="muted">${escapeHtml(record.classInfo.label)}</span></td>
    <td class="money">${formatYen(record.amountTotal)}<br><span class="muted">現金数量 ${record.cashQty} / 在庫 ${record.inventoryQty}</span></td>
    <td class="money">${expected}</td>
    <td class="money">${record.fullGap > 0 ? `<strong>${formatYen(record.fullGap)}</strong>` : '—'}</td>
    <td>${flags}</td>
  </tr>`;
}

function renderDeadline(record) {
  if (!record.date) return '<span class="muted">日付不明</span>';
  const date = formatDate(record.date);

  if (record.daysLeft === null) return date;
  if (record.daysLeft < 0) return `${date}<br><span class="deadline-expired">${Math.abs(record.daysLeft)}日超過候補</span>`;
  if (record.daysLeft <= 14) return `${date}<br><span class="deadline-soon">残り約${record.daysLeft}日</span>`;
  return `${date}<br><span class="deadline-open">残り約${record.daysLeft}日</span>`;
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function buildClaimPack() {
  const candidates = state.audited.filter(record =>
    record.classInfo.costBased &&
    Number.isFinite(record.cost) &&
    record.shortfall > 0 &&
    (record.daysLeft === null || record.daysLeft >= 0) &&
    record.bucket !== 'reversal'
  );

  const header = `FBA補てん評価額 再評価依頼の下書き
生成日: ${new Intl.DateTimeFormat('ja-JP').format(new Date())}

注意:
- この文面は申請資格や回収を保証しません。
- Amazon Seller Centralの最新ポリシー・申請画面・証憑要件を確認して編集してください。
- 製造/仕入原価には、送料・関税・保管・広告等を含めないでください。
- 同じ案件の重複申請は避けてください。
`;

  if (!candidates.length) {
    state.claimPack = `${header}
現時点で、設定した閾値を超える原価差の再評価候補は生成されませんでした。
`;
    return;
  }

  const sections = candidates.map((record, index) => `

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
候補 ${index + 1}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
件名:
FBA補てん評価額の再評価依頼（補てんID: ${record.reimbursementId || '要記入'}）

本文:
Amazon FBA在庫の補てん評価額について、再評価をお願いいたします。

補てんID: ${record.reimbursementId || '要記入'}
承認日: ${formatDate(record.date)}
SKU/FNSKU/ASIN: ${record.key}
補てん理由: ${record.reason || '要記入'}
現金補てん数量: ${record.cashQty}
現在の補てん合計額: ${formatYen(record.amountTotal)}
商品1個あたりの製造・仕入原価: ${formatYen(record.cost)}
原価 × 対象数量: ${formatYen(record.expected)}
差額: ${formatYen(record.fullGap)}

上記原価を確認できる請求書・領収書等を添付します。
補てん額の算定根拠をご確認のうえ、適用可能な場合は再評価をお願いいたします。

添付前チェック:
[ ] 購入日
[ ] 商品名
[ ] 数量
[ ] 仕入先情報
[ ] 対象SKUとの対応
[ ] 送料・関税等を原価に含めていない
[ ] 同一案件を重複申請していない
`);

  state.claimPack = header + sections.join('');
}

function exportFlags() {
  const columns = [
    '判定', '承認日', '残日数', '照合キー', '補てんID', '理由',
    '現金補てん数量', '在庫補てん数量', '補てん合計額', '1個あたり原価',
    '原価基準額', '差額候補', '指摘', '元データ行'
  ];
  const rows = state.audited.map(record => [
    record.bucket,
    record.date ? formatDate(record.date) : '',
    record.daysLeft ?? '',
    record.key,
    record.reimbursementId,
    record.reason,
    record.cashQty,
    record.inventoryQty,
    record.amountTotal,
    Number.isFinite(record.cost) ? record.cost : '',
    Number.isFinite(record.expected) ? record.expected : '',
    record.fullGap || '',
    record.flags.join(' / '),
    record.rowNumber
  ]);

  const csv = '\uFEFF' + [columns, ...rows].map(row => row.map(csvEscape).join(',')).join('\r\n');
  downloadText('fba-reimbursement-audit.csv', csv, 'text/csv;charset=utf-8');
  track('audit-export');
  showToast('指摘CSVを保存しました');
}

function downloadText(filename, content, type = 'text/plain;charset=utf-8') {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1200);
}

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
  } catch (_) {
    const area = document.createElement('textarea');
    area.value = text;
    area.style.position = 'fixed';
    area.style.opacity = '0';
    document.body.appendChild(area);
    area.select();
    document.execCommand('copy');
    area.remove();
  }
}

function loadSample() {
  const today = new Date();
  const dateText = offsetDateString(today, -18);
  const olderText = offsetDateString(today, -52);

  const reportText = [
    'approval-date\treimbursement-id\treason\tseller-sku\tamount-total\tamount-per-unit\tquantity-reimbursed-cash\tquantity-reimbursed-inventory\tquantity-reimbursed-total\toriginal-reimbursement-id',
    `${dateText}\tR-JP-001\tDamaged_Warehouse\tSKU-RED-01\t1180\t1180\t1\t0\t1\t`,
    `${olderText}\tR-JP-002\tLost_Warehouse\tSKU-BLUE-02\t900\t450\t2\t0\t2\t`,
    `${dateText}\tR-JP-003\tCustomer_Return\tSKU-GREEN-03\t2400\t2400\t1\t0\t1\t`,
    `${dateText}\tR-JP-004\tDamaged_Warehouse\tSKU-NOCOST-04\t700\t700\t1\t0\t1\t`,
    `${dateText}\tR-JP-005\tReimbursement_Reversal\tSKU-RED-01\t-1180\t-1180\t1\t0\t1\tR-JP-001`
  ].join('\n');

  const costText = [
    'seller-sku,sourcing-cost,notes',
    'SKU-RED-01,1800,仕入先請求書',
    'SKU-BLUE-02,1100,商品本体のみ',
    'SKU-GREEN-03,1200,商品本体のみ'
  ].join('\n');

  state.report = parseDelimited(reportText);
  state.costs = parseDelimited(costText);
  reportState.textContent = `サンプル補てんレポート · ${state.report.rows.length}行`;
  costState.textContent = `サンプル原価表 · ${state.costs.rows.length}行`;
  reportDrop.classList.add('ready');
  costDrop.classList.add('ready');
  populateMappings();
  track('sample-loaded');
}

function offsetDateString(date, offsetDays) {
  const copy = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  copy.setUTCDate(copy.getUTCDate() + offsetDays);
  return copy.toISOString().slice(0, 10);
}

function resetAudit() {
  state.report = null;
  state.costs = null;
  state.audited = [];
  state.filtered = [];
  state.claimPack = '';
  reportInput.value = '';
  costInput.value = '';
  reportState.textContent = 'ファイルを選択';
  costState.textContent = 'ファイルを選択';
  reportDrop.classList.remove('ready');
  costDrop.classList.remove('ready');
  mappingSection.hidden = true;
  resultsSection.hidden = true;
  document.getElementById('audit').scrollIntoView({ behavior: 'smooth' });
}

reportInput.addEventListener('change', () => handleFileInput(reportInput, 'report'));
costInput.addEventListener('change', () => handleFileInput(costInput, 'cost'));
wireDropZone(reportDrop, 'report');
wireDropZone(costDrop, 'cost');

document.getElementById('sampleBtn').addEventListener('click', loadSample);
document.getElementById('auditBtn').addEventListener('click', auditData);
document.getElementById('resetBtn').addEventListener('click', resetAudit);
resultFilter.addEventListener('change', applyFilter);

document.getElementById('downloadCostTemplateBtn').addEventListener('click', () => {
  const content = '\uFEFFseller-sku,sourcing-cost,notes\r\nSKU-EXAMPLE-001,1200,商品本体の仕入原価のみ\r\n';
  downloadText('fba-sourcing-cost-template.csv', content, 'text/csv;charset=utf-8');
  track('cost-template-download');
});

document.getElementById('exportFlagsBtn').addEventListener('click', exportFlags);
document.getElementById('copyClaimPackBtn').addEventListener('click', async () => {
  await copyText(state.claimPack);
  track('claim-pack-copy');
  showToast('再評価依頼の下書きをコピーしました');
});
document.getElementById('downloadClaimPackBtn').addEventListener('click', () => {
  downloadText('fba-revaluation-draft.txt', state.claimPack);
  track('claim-pack-download');
  showToast('再評価依頼の下書きを保存しました');
});

document.getElementById('paidInterestBtn').addEventListener('click', () => {
  if (localStorage.getItem(INTEREST_KEY)) {
    document.getElementById('interestResult').textContent = 'この端末からの希望は記録済みです。';
    return;
  }
  localStorage.setItem(INTEREST_KEY, '1');
  track('monthly-interest', { once: true });
  document.getElementById('interestResult').textContent = '匿名で記録しました。数字が集まった場合だけ月額版を作ります。';
  showToast('月額版の希望を記録しました');
});

track('pageview');
track('unique-visitor', { once: true });

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(() => {});
  }, { once: true });
}
