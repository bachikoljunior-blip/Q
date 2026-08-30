'use strict';

const COUNTER_NS = 'bachikoljunior-blip.github.io';
const COUNTER_ACTION = 'jira-automation-guard';
const INSTALL_ID_KEY = 'jira-automation-guard-install-id';
const PRO_INTEREST_KEY = 'jira-automation-guard-pro-interest';
const MAX_FILE_BYTES = 12 * 1024 * 1024;

const beforeFile = document.getElementById('beforeFile');
const afterFile = document.getElementById('afterFile');
const beforeText = document.getElementById('beforeText');
const afterText = document.getElementById('afterText');
const beforeState = document.getElementById('beforeState');
const afterState = document.getElementById('afterState');
const errorBox = document.getElementById('errorBox');
const resultsSection = document.getElementById('results');
const summaryGrid = document.getElementById('summaryGrid');
const warningList = document.getElementById('warningList');
const warningCount = document.getElementById('warningCount');
const ruleBody = document.getElementById('ruleBody');
const ruleCount = document.getElementById('ruleCount');
const diffList = document.getElementById('diffList');
const diffCount = document.getElementById('diffCount');
const referenceGroups = document.getElementById('referenceGroups');
const markdownPreview = document.getElementById('markdownPreview');
const resultCaption = document.getElementById('resultCaption');
const toast = document.getElementById('toast');

let currentReport = null;
let currentMarkdown = '';

function getInstallId() {
  let value = localStorage.getItem(INSTALL_ID_KEY);
  if (!value) {
    value = crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    localStorage.setItem(INSTALL_ID_KEY, value);
  }
  return value;
}

function track(key, { once = false } = {}) {
  try {
    const onceKey = `jag-tracked-${key}`;
    if (once && localStorage.getItem(onceKey)) return;
    const url = new URL(`https://counterapi.com/api/${COUNTER_NS}/${COUNTER_ACTION}/${encodeURIComponent(key)}`);
    url.searchParams.set('trackOnly', 'true');
    url.searchParams.set('userId', getInstallId());
    fetch(url.toString(), { mode: 'no-cors', keepalive: true }).catch(() => {});
    if (once) localStorage.setItem(onceKey, '1');
  } catch (_) {
    // Metrics must never block local analysis.
  }
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => toast.classList.remove('show'), 2200);
}

function setFileState(element, text, ready = false) {
  element.textContent = text;
  element.title = text;
  element.classList.toggle('ready', ready);
}

async function readSelectedFile(input, target, stateElement) {
  const file = input.files && input.files[0];
  if (!file) return;
  if (file.size > MAX_FILE_BYTES) {
    input.value = '';
    throw new Error('12MBを超えるファイルは無料MVPでは読み込めません。ruleを分けるか、テキストで必要範囲を確認してください。');
  }
  const text = await file.text();
  target.value = text;
  setFileState(stateElement, `${file.name} · ${formatBytes(file.size)}`, true);
}

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function showError(message) {
  errorBox.textContent = message;
  errorBox.hidden = false;
  errorBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function clearError() {
  errorBox.hidden = true;
  errorBox.textContent = '';
}

function escapeHtml(value) {
  return String(value == null ? '' : value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function summaryCard(value, label, className = '') {
  return `<article class="summary-card ${className}"><strong>${escapeHtml(value)}</strong><span>${escapeHtml(label)}</span></article>`;
}

function renderSummary(report) {
  const rules = report.after ? report.after.rules : report.before.rules;
  const high = report.warnings.filter(item => item.severity === 'high').length;
  const medium = report.warnings.filter(item => item.severity === 'medium').length;
  const changed = report.diff ? report.diff.summary.changed : 0;
  const refs = Object.values(report.references).reduce((sum, list) => sum + list.length, 0);
  summaryGrid.innerHTML = [
    summaryCard(rules.length.toLocaleString('ja-JP'), '現在のrules', 'info'),
    summaryCard(high.toLocaleString('ja-JP'), '高優先警告', high ? 'critical' : 'good'),
    summaryCard(medium.toLocaleString('ja-JP'), '確認警告', medium ? 'warn' : 'good'),
    summaryCard(report.diff ? changed.toLocaleString('ja-JP') : '—', '変更rules', changed ? 'warn' : 'good'),
    summaryCard(refs.toLocaleString('ja-JP'), '参照候補', refs ? 'info' : 'good'),
  ].join('');
}

function renderWarnings(report) {
  warningCount.textContent = `${report.warnings.length.toLocaleString('ja-JP')}件`;
  if (!report.warnings.length) {
    warningList.innerHTML = '<div class="empty-state">構造上の明確な警告は検出されませんでした。ruleの論理・権限・移行先設定は別途確認してください。</div>';
    return;
  }
  warningList.innerHTML = report.warnings.map(item => `
    <article class="warning-item">
      <span class="warning-badge ${escapeHtml(item.severity)}">${escapeHtml(item.severity.toUpperCase())}</span>
      <div>
        <strong>${escapeHtml(item.rule || 'Export全体')} · ${escapeHtml(item.code)}</strong>
        <p>${escapeHtml(item.message)}${item.source ? ` <span class="muted">(${escapeHtml(item.source)})</span>` : ''}</p>
      </div>
    </article>
  `).join('');
}

function renderRules(report) {
  const rules = report.after ? report.after.rules : report.before.rules;
  ruleCount.textContent = `${rules.length.toLocaleString('ja-JP')}件`;
  ruleBody.innerHTML = rules.map(rule => {
    const state = String(rule.state || 'UNKNOWN').toLowerCase();
    const stateClass = state === 'enabled' ? 'enabled' : (state === 'disabled' ? 'disabled' : 'unknown');
    return `<tr>
      <td><span class="state-pill ${stateClass}">${escapeHtml(rule.state)}</span></td>
      <td><strong>${escapeHtml(rule.name)}</strong>${rule.description ? `<br><span class="muted">${escapeHtml(rule.description)}</span>` : ''}</td>
      <td>${Number(rule.triggerCount || 0).toLocaleString('ja-JP')}</td>
      <td>${Number(rule.actionCount || 0).toLocaleString('ja-JP')}</td>
      <td>${Number(rule.componentCount || 0).toLocaleString('ja-JP')}</td>
      <td><span class="fingerprint">${escapeHtml(rule.fingerprint)}</span></td>
    </tr>`;
  }).join('');
}

function renderDiff(report) {
  if (!report.diff) {
    diffCount.textContent = '比較対象なし';
    diffList.innerHTML = '<div class="empty-state">変更後JSONを追加すると、volatile項目を除いたrule単位の差分を表示します。</div>';
    return;
  }
  const summary = report.diff.summary;
  diffCount.textContent = `追加 ${summary.added} · 削除 ${summary.removed} · 変更 ${summary.changed} · 同一 ${summary.unchanged}`;
  diffList.innerHTML = report.diff.rows.map(row => {
    const changes = row.changes || [];
    const body = changes.length
      ? `<div class="change-list">${changes.map(change => `
          <div class="change-row">
            <span class="change-path">${escapeHtml(change.path)}</span>
            <span class="change-value">${escapeHtml(change.before)}</span>
            <span class="change-arrow">→</span>
            <span class="change-value">${escapeHtml(change.after)}</span>
          </div>`).join('')}</div>`
      : '<div class="empty-state">path差分なし</div>';
    const open = row.status === 'changed' ? ' open' : '';
    return `<details class="diff-card"${open}>
      <summary>
        <span class="diff-title"><span class="diff-pill ${escapeHtml(row.status)}">${escapeHtml(row.status)}</span><strong>${escapeHtml(row.name)}</strong></span>
        <span class="diff-meta">${changes.length.toLocaleString('ja-JP')} paths</span>
      </summary>
      ${body}
    </details>`;
  }).join('');
}

function referenceValue(item) {
  return item.value || item.key || '';
}

function renderReferences(report) {
  const labels = {
    customFields: 'Custom fields',
    projects: 'Projects',
    issueTypes: 'Issue types',
    accounts: 'Accounts / users',
    hardcodedIds: 'Other hard-coded IDs',
    urls: 'URLs / webhooks',
    secrets: 'Secret-like keys',
    jql: 'JQL / query strings',
  };
  referenceGroups.innerHTML = Object.entries(labels).map(([key, label]) => {
    const items = report.references[key] || [];
    const list = items.length
      ? items.slice(0, 300).map(item => `<div class="reference-item"><b>${escapeHtml(item.rule || 'Rule')}</b> — ${escapeHtml(referenceValue(item))}<span class="reference-path">${escapeHtml(item.path || '')}</span></div>`).join('')
      : '<div class="reference-item">検出なし</div>';
    return `<section class="reference-group"><h4>${escapeHtml(label)} <span>${items.length.toLocaleString('ja-JP')}</span></h4><div class="reference-list">${list}</div></section>`;
  }).join('');
}

function renderReport(report) {
  currentReport = report;
  currentMarkdown = JAGCore.reportToMarkdown(report);
  markdownPreview.value = currentMarkdown;
  renderSummary(report);
  renderWarnings(report);
  renderRules(report);
  renderDiff(report);
  renderReferences(report);
  resultCaption.textContent = report.mode === 'compare'
    ? '2つのexportを正規化し、追加・削除・変更をrule単位で比較しました。'
    : '1つのexportをlintし、参照候補と移行前の確認事項を抽出しました。';
  resultsSection.hidden = false;
  activatePanel('warningsPanel');
  resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function activatePanel(panelId) {
  document.querySelectorAll('.result-tab').forEach(button => {
    const selected = button.dataset.panel === panelId;
    button.classList.toggle('active', selected);
    button.setAttribute('aria-selected', selected ? 'true' : 'false');
  });
  document.querySelectorAll('.result-panel').forEach(panel => {
    const selected = panel.id === panelId;
    panel.classList.toggle('active', selected);
    panel.hidden = !selected;
  });
}

function safeFilename(prefix, extension) {
  const date = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Tokyo' }).format(new Date());
  return `${prefix}-${date}.${extension}`;
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

async function loadSample() {
  clearError();
  try {
    const [beforeResponse, afterResponse] = await Promise.all([
      fetch('sample-before.json', { cache: 'no-store' }),
      fetch('sample-after.json', { cache: 'no-store' }),
    ]);
    if (!beforeResponse.ok || !afterResponse.ok) throw new Error('sample fetch failed');
    beforeText.value = await beforeResponse.text();
    afterText.value = await afterResponse.text();
    setFileState(beforeState, 'sample-before.json', true);
    setFileState(afterState, 'sample-after.json', true);
    track('sample-loaded');
    document.getElementById('analyzer').scrollIntoView({ behavior: 'smooth', block: 'start' });
    showToast('比較用サンプルを読み込みました');
  } catch (_) {
    showError('サンプルを読み込めませんでした。ページを再読込してください。');
  }
}

function analyze() {
  clearError();
  const before = beforeText.value.trim();
  const after = afterText.value.trim();
  if (!before) {
    showError('現在版または変更前のJSONを入れてください。');
    beforeText.focus();
    return;
  }
  const button = document.getElementById('analyzeBtn');
  button.disabled = true;
  button.textContent = '解析中…';
  try {
    const report = JAGCore.buildReport(before, after);
    renderReport(report);
    track(after ? 'analyze-compare' : 'analyze-single');
    track('qualified-device', { once: true });
    if (report.warnings.length) track('warnings-found');
    if (report.references.secrets.length) track('secret-warning-found');
    if (report.diff && (report.diff.summary.changed || report.diff.summary.added || report.diff.summary.removed)) track('diff-found');
  } catch (error) {
    showError(error && error.message ? error.message : 'JSONの解析に失敗しました。');
  } finally {
    button.disabled = false;
    button.textContent = 'JSONを解析する';
  }
}

function clearAll() {
  beforeFile.value = '';
  afterFile.value = '';
  beforeText.value = '';
  afterText.value = '';
  setFileState(beforeState, '未読込', false);
  setFileState(afterState, '未読込', false);
  currentReport = null;
  currentMarkdown = '';
  markdownPreview.value = '';
  resultsSection.hidden = true;
  clearError();
  document.getElementById('analyzer').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

beforeFile.addEventListener('change', async () => {
  clearError();
  try {
    await readSelectedFile(beforeFile, beforeText, beforeState);
    track('before-file-loaded');
  } catch (error) {
    showError(error.message);
  }
});

afterFile.addEventListener('change', async () => {
  clearError();
  try {
    await readSelectedFile(afterFile, afterText, afterState);
    track('after-file-loaded');
  } catch (error) {
    showError(error.message);
  }
});

beforeText.addEventListener('input', () => {
  if (!beforeFile.files.length) setFileState(beforeState, beforeText.value.trim() ? '貼り付け済み' : '未読込', Boolean(beforeText.value.trim()));
});
afterText.addEventListener('input', () => {
  if (!afterFile.files.length) setFileState(afterState, afterText.value.trim() ? '貼り付け済み' : '未読込', Boolean(afterText.value.trim()));
});

document.getElementById('sampleBtn').addEventListener('click', loadSample);
document.getElementById('analyzeBtn').addEventListener('click', analyze);
document.getElementById('clearBtn').addEventListener('click', clearAll);

document.querySelectorAll('.result-tab').forEach(button => button.addEventListener('click', () => activatePanel(button.dataset.panel)));

document.getElementById('copyMarkdownBtn').addEventListener('click', async () => {
  if (!currentReport) return;
  currentMarkdown = markdownPreview.value;
  await copyText(currentMarkdown);
  track('markdown-copy');
  showToast('Markdownをコピーしました');
});

document.getElementById('downloadMarkdownBtn').addEventListener('click', () => {
  if (!currentReport) return;
  currentMarkdown = markdownPreview.value;
  downloadText(safeFilename('jira-automation-guard-report', 'md'), currentMarkdown, 'text/markdown;charset=utf-8');
  track('markdown-download');
  showToast('Markdownを保存しました');
});

document.getElementById('downloadJsonBtn').addEventListener('click', () => {
  if (!currentReport) return;
  downloadText(safeFilename('jira-automation-guard-report', 'json'), JSON.stringify(currentReport, null, 2), 'application/json;charset=utf-8');
  track('json-download');
  showToast('JSONレポートを保存しました');
});

document.getElementById('proInterestBtn').addEventListener('click', () => {
  const result = document.getElementById('interestResult');
  if (localStorage.getItem(PRO_INTEREST_KEY)) {
    result.textContent = 'この端末からの希望は記録済みです。';
    return;
  }
  localStorage.setItem(PRO_INTEREST_KEY, '1');
  track('pro-interest', { once: true });
  result.textContent = '匿名で記録しました。利用データがGateを超えた場合だけPro版を検討します。';
  showToast('Pro版の希望を記録しました');
});

track('pageview');
track('unique-visitor', { once: true });
