'use strict';

const STORAGE_KEY = 'tsuzukikara-project-v1';
const INSTALL_ID_KEY = 'tsuzukikara-install-id';
const INTEREST_KEY = 'tsuzukikara-pro-interest';
const COUNTER_NS = 'bachikoljunior-blip.github.io';
const COUNTER_ACTION = 'tsuzukikara';

const fieldIds = [
  'projectName', 'phase', 'goal', 'currentState', 'constraints',
  'decisions', 'completed', 'openQuestions', 'nextAction', 'rawContext'
];

const form = document.getElementById('projectForm');
const output = document.getElementById('output');
const fileTabs = document.getElementById('fileTabs');
const fileEditor = document.getElementById('fileEditor');
const activeFilename = document.getElementById('activeFilename');
const formError = document.getElementById('formError');
const saveState = document.getElementById('saveState');
const toast = document.getElementById('toast');

let generatedFiles = {};
let activeFile = 'START_HERE.md';
let deferredInstallPrompt = null;
let saveTimer = null;

function getInstallId() {
  let id = localStorage.getItem(INSTALL_ID_KEY);
  if (!id) {
    id = (crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`);
    localStorage.setItem(INSTALL_ID_KEY, id);
  }
  return id;
}

function track(key, { once = false } = {}) {
  try {
    const onceKey = `tracked-${key}`;
    if (once && localStorage.getItem(onceKey)) return;
    const url = new URL(`https://counterapi.com/api/${COUNTER_NS}/${COUNTER_ACTION}/${encodeURIComponent(key)}`);
    url.searchParams.set('trackOnly', 'true');
    url.searchParams.set('userId', getInstallId());
    fetch(url.toString(), { mode: 'no-cors', keepalive: true }).catch(() => {});
    if (once) localStorage.setItem(onceKey, '1');
  } catch (_) {
    // Metrics must never block the product.
  }
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add('show');
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => toast.classList.remove('show'), 2200);
}

function splitLines(value) {
  return String(value || '')
    .split(/\r?\n/)
    .map(line => line.trim().replace(/^[-*・]\s*/, ''))
    .filter(Boolean);
}

function bullets(value, emptyText = '未記録') {
  const items = splitLines(value);
  return items.length ? items.map(item => `- ${item}`).join('\n') : `- ${emptyText}`;
}

function safeFilename(value) {
  return String(value || 'project')
    .normalize('NFKC')
    .replace(/[\\/:*?"<>|]/g, '-')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60) || 'project';
}

function todayJst() {
  return new Intl.DateTimeFormat('ja-JP', {
    timeZone: 'Asia/Tokyo', year: 'numeric', month: '2-digit', day: '2-digit'
  }).format(new Date()).replaceAll('/', '-');
}

function getFormData() {
  return Object.fromEntries(fieldIds.map(id => [id, document.getElementById(id).value.trim()]));
}

function setFormData(data) {
  fieldIds.forEach(id => {
    if (typeof data[id] === 'string') document.getElementById(id).value = data[id];
    if (Array.isArray(data[id])) document.getElementById(id).value = data[id].join('\n');
  });
  scheduleSave();
}

function scheduleSave() {
  saveState.textContent = '保存中…';
  window.clearTimeout(saveTimer);
  saveTimer = window.setTimeout(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: 1, updatedAt: new Date().toISOString(), data: getFormData() }));
    saveState.textContent = '端末に保存済み';
  }, 350);
}

function restoreDraft() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw);
    setFormData(parsed.data || parsed);
    saveState.textContent = '端末の下書きを復元';
  } catch (_) {
    localStorage.removeItem(STORAGE_KEY);
  }
}

function buildFiles(data) {
  const date = todayJst();
  const name = data.projectName || '名称未設定プロジェクト';
  const phase = data.phase || '未設定';

  const startHere = `# START HERE — ${name}\n\n最終更新: ${date}\n\n## このパックの目的\nこのフォルダを、このプロジェクトの会話コンテキストより優先する正本として使う。長い会話で要約が発生した場合や、別のAI・別セッションへ移った場合も、ここから再開する。\n\n## 読む順番\n1. \`PROJECT_STATE.md\` — 目標、現在地、制約、次の行動\n2. \`DECISIONS.md\` — 既に決めたこと。理由なく蒸し返さない\n3. \`CONTEXT.md\` — 生の会話・メモ。必要な場合だけ参照\n4. \`RESUME_PROMPT.txt\` — 新しいAIへ貼る再開指示\n\n## AIへの運用ルール\n- 過去会話の曖昧な記憶より、このパックの最新内容を優先する。\n- 未確認事項を事実として補完しない。\n- 同じ質問を再度する前に、このパックに答えがないか確認する。\n- 作業後は \`PROJECT_STATE.md\` の現在地と次の行動を更新する。\n- 重要な方針変更は \`DECISIONS.md\` に日付と理由を残す。\n\n## 直ちに再開する場所\n${data.nextAction || '次の行動は未設定。PROJECT_STATE.md を読み、最小の確認だけ行って設定する。'}\n`;

  const projectState = `# PROJECT STATE — ${name}\n\n最終更新: ${date}\n\n## Goal\n${data.goal || '未設定'}\n\n## Current phase\n${phase}\n\n## Current state\n${data.currentState || '未記録'}\n\n## Non-negotiable constraints\n${bullets(data.constraints)}\n\n## Completed / learned\n${bullets(data.completed)}\n\n## Open questions\n${bullets(data.openQuestions)}\n\n## Immediate next action\n**${data.nextAction || '未設定'}**\n\n## Resume instruction\n新しいセッションでは \`START_HERE.md\` → このファイル → \`DECISIONS.md\` の順で読む。同じ前提を再質問せず、Immediate next action から続ける。終了時にこのファイルを更新する。\n`;

  const decisions = `# DECISIONS — ${name}\n\n最終更新: ${date}\n\nこのファイルは重要な意思決定のログ。方針を変えても過去の理由を消さない。\n\n## ${date} — Imported decisions\n${bullets(data.decisions, '決定事項はまだ記録されていない')}\n\n## 追記フォーマット\n\`\`\`markdown\n## YYYY-MM-DD — 決定の短い名前\n**Decision:** 何を決めたか\n\n**Reason:** なぜそう決めたか\n\n**Revisit when:** どの条件で見直すか\n\`\`\`\n`;

  const context = `# CONTEXT — ${name}\n\n最終更新: ${date}\n\nここには、圧縮して失う可能性がある生の会話・メモ・参考情報を残す。PROJECT_STATE.md と矛盾する場合は、日付が新しい方を優先し、不明なら勝手に解決しない。\n\n---\n\n${data.rawContext || '生のコンテキストは未登録。'}\n`;

  const resumePrompt = `あなたは「${name}」を引き継ぎます。添付または貼付された START_HERE.md、PROJECT_STATE.md、DECISIONS.md、CONTEXT.md を読んでください。\n\nルール:\n1. 過去の会話履歴より、これらの最新ファイルを正本として優先する。\n2. 既に答えが書かれている質問を繰り返さない。\n3. 不明点があっても、現在の情報だけで安全に進められる作業は先に進める。\n4. PROJECT_STATE.md の「Immediate next action」から実行を再開する。\n5. 作業の最後に、現在地・結果・次の一手を更新するための差分を提示する。\n\n最初に長い計画説明だけをせず、ファイルから読み取った現在地を2〜4文で確認し、そのまま次の行動を実行してください。`;

  return {
    'START_HERE.md': startHere,
    'PROJECT_STATE.md': projectState,
    'DECISIONS.md': decisions,
    'CONTEXT.md': context,
    'RESUME_PROMPT.txt': resumePrompt
  };
}

function renderTabs() {
  fileTabs.innerHTML = '';
  Object.keys(generatedFiles).forEach((filename, index) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'file-tab';
    button.setAttribute('role', 'tab');
    button.setAttribute('aria-selected', filename === activeFile ? 'true' : 'false');
    button.tabIndex = filename === activeFile ? 0 : -1;
    button.textContent = filename;
    button.addEventListener('click', () => switchFile(filename));
    button.addEventListener('keydown', event => {
      if (!['ArrowRight', 'ArrowLeft', 'ArrowDown', 'ArrowUp'].includes(event.key)) return;
      event.preventDefault();
      const names = Object.keys(generatedFiles);
      const delta = ['ArrowRight', 'ArrowDown'].includes(event.key) ? 1 : -1;
      const next = names[(index + delta + names.length) % names.length];
      switchFile(next);
      fileTabs.querySelector(`[data-file="${CSS.escape(next)}"]`)?.focus();
    });
    button.dataset.file = filename;
    fileTabs.appendChild(button);
  });
}

function switchFile(filename) {
  if (generatedFiles[activeFile] !== undefined) generatedFiles[activeFile] = fileEditor.value;
  activeFile = filename;
  activeFilename.textContent = filename;
  fileEditor.value = generatedFiles[filename] || '';
  fileTabs.querySelectorAll('.file-tab').forEach(button => {
    const selected = button.dataset.file === filename;
    button.setAttribute('aria-selected', selected ? 'true' : 'false');
    button.tabIndex = selected ? 0 : -1;
  });
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
  window.setTimeout(() => URL.revokeObjectURL(url), 1200);
}

function syncActiveEdit() {
  if (generatedFiles[activeFile] !== undefined) generatedFiles[activeFile] = fileEditor.value;
}

function buildBundle() {
  syncActiveEdit();
  const data = getFormData();
  const divider = '\n\n--- FILE: $FILENAME ---\n\n';
  return Object.entries(generatedFiles)
    .map(([filename, content]) => divider.replace('$FILENAME', filename) + content)
    .join('') + `\n\n--- BACKUP JSON ---\n\n\`\`\`json\n${JSON.stringify({ version: 1, exportedAt: new Date().toISOString(), data }, null, 2)}\n\`\`\`\n`;
}

function extractPrompt(rawContext) {
  return `以下の会話・メモから、プロジェクトを別セッションへ引き継ぐための事実だけを抽出してください。推測で埋めず、曖昧な点は openQuestions に入れてください。\n\n返答は説明文なし・コードフェンスなしの有効なJSONだけにしてください。キーは必ず次の10個です。配列ではなく文字列を使い、複数項目は改行で区切ってください。\n\n{\n  "projectName": "",\n  "phase": "",\n  "goal": "",\n  "currentState": "",\n  "constraints": "",\n  "decisions": "",\n  "completed": "",\n  "openQuestions": "",\n  "nextAction": "",\n  "rawContext": ""\n}\n\n抽出ルール:\n- goal は最終到達状態。\n- currentState は現在の数字・資源・進捗。\n- constraints は絶対に守る条件。\n- decisions は既に決めた方針。\n- completed は試したことと学び。\n- nextAction は会話履歴なしでも一意に実行できる一手。\n- rawContext は重要な原文・URLだけを短く残す。\n\n対象:\n<<<\n${rawContext || 'ここに会話を貼る'}\n>>>`;
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

form.addEventListener('input', scheduleSave);
form.addEventListener('submit', event => {
  event.preventDefault();
  const data = getFormData();
  if (!data.projectName || !data.goal) {
    formError.textContent = 'プロジェクト名と最終目標を入力してください。';
    formError.hidden = false;
    document.getElementById(!data.projectName ? 'projectName' : 'goal').focus();
    return;
  }
  formError.hidden = true;
  generatedFiles = buildFiles(data);
  activeFile = 'START_HERE.md';
  renderTabs();
  switchFile(activeFile);
  output.hidden = false;
  output.scrollIntoView({ behavior: 'smooth', block: 'start' });
  track('generate');
  track('first-generate', { once: true });
  showToast('引き継ぎパックを生成しました');
});

fileEditor.addEventListener('input', () => {
  if (generatedFiles[activeFile] !== undefined) generatedFiles[activeFile] = fileEditor.value;
});

document.getElementById('copyActiveBtn').addEventListener('click', async () => {
  syncActiveEdit();
  await copyText(generatedFiles[activeFile] || '');
  showToast(`${activeFile} をコピーしました`);
});

document.getElementById('downloadActiveBtn').addEventListener('click', () => {
  syncActiveEdit();
  downloadText(activeFile, generatedFiles[activeFile] || '');
  track('download-file');
  showToast(`${activeFile} を保存しました`);
});

document.getElementById('downloadBundleBtn').addEventListener('click', () => {
  const data = getFormData();
  downloadText(`${safeFilename(data.projectName)}-handoff-pack.md`, buildBundle(), 'text/markdown;charset=utf-8');
  track('download-bundle');
  track('first-download', { once: true });
  showToast('全ファイルを1つにまとめて保存しました');
});

document.getElementById('exportBackupBtn').addEventListener('click', () => {
  const data = getFormData();
  const backup = { version: 1, exportedAt: new Date().toISOString(), data };
  downloadText(`${safeFilename(data.projectName)}-backup.json`, JSON.stringify(backup, null, 2), 'application/json;charset=utf-8');
  track('backup-export');
  showToast('入力バックアップを保存しました');
});

document.getElementById('importBackupInput').addEventListener('change', async event => {
  const file = event.target.files?.[0];
  if (!file) return;
  try {
    const parsed = JSON.parse(await file.text());
    setFormData(parsed.data || parsed);
    track('backup-import');
    showToast('バックアップを復元しました');
  } catch (_) {
    showToast('JSONを読み込めませんでした');
  } finally {
    event.target.value = '';
  }
});

document.getElementById('copyExtractPromptBtn').addEventListener('click', async () => {
  await copyText(extractPrompt(document.getElementById('rawContext').value));
  track('copy-extract-prompt');
  showToast('抽出用プロンプトをコピーしました');
});

document.getElementById('importAiJsonBtn').addEventListener('click', () => {
  const raw = document.getElementById('aiJson').value.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
  if (!raw) return showToast('AIが返したJSONを貼ってください');
  try {
    const parsed = JSON.parse(raw);
    setFormData(parsed);
    document.getElementById('aiJson').value = '';
    track('ai-json-import');
    showToast('AIの抽出結果を反映しました');
  } catch (_) {
    showToast('有効なJSONではありません');
  }
});

document.getElementById('loadSampleBtn').addEventListener('click', () => {
  const sample = {
    projectName: '不労月収20万円プロジェクト',
    phase: '無人販売型MVPの検証',
    goal: '本人の継続労働への依存が小さい月収20万円を作り、生活のための労働を不要にする。',
    currentState: '週18時間、月0〜10万円を投入可能。iPhone中心。AIにGitHub上のシステムを構築・運用させた経験がある。',
    constraints: '原則として人と個別に関わらない\n顧客数に比例して作業を増やさない\n高利回り投資や借金で一発逆転を狙わない',
    decisions: '主戦略をmicro-SaaSまたはデジタル商品にする\nYouTubeは副戦線として維持する\n7〜14日で需要の弱い案を切る',
    completed: '個別受託は最終目的と不一致のため却下\n求人比較ツールは現実とのズレが大きいため主候補から外した',
    openQuestions: '最初の無料利用者をどこから獲得するか\nどの有料機能なら月額課金されるか',
    nextAction: '無料MVPを公開し、生成・保存・有料版希望の匿名イベントを14日間測定する。',
    rawContext: 'GitHub repository Q を正本として使用。別セッションではプロジェクトファイルから再開する。'
  };
  setFormData(sample);
  showToast('サンプルを入力しました');
});

document.getElementById('clearBtn').addEventListener('click', () => {
  if (!window.confirm('端末に保存した入力と生成結果を消しますか？')) return;
  fieldIds.forEach(id => document.getElementById(id).value = '');
  document.getElementById('aiJson').value = '';
  localStorage.removeItem(STORAGE_KEY);
  generatedFiles = {};
  output.hidden = true;
  saveState.textContent = '入力なし';
  showToast('入力を消しました');
});

document.getElementById('proInterestBtn').addEventListener('click', () => {
  const result = document.getElementById('interestResult');
  if (localStorage.getItem(INTEREST_KEY)) {
    result.textContent = '希望はすでに記録済みです。ありがとうございます。';
    return;
  }
  localStorage.setItem(INTEREST_KEY, '1');
  track('pro-interest');
  result.textContent = '匿名で1票を記録しました。需要が確認できたら完全自動版を実装します。';
});

window.addEventListener('beforeinstallprompt', event => {
  event.preventDefault();
  deferredInstallPrompt = event;
  document.getElementById('installBtn').hidden = false;
});

document.getElementById('installBtn').addEventListener('click', async () => {
  if (!deferredInstallPrompt) return;
  deferredInstallPrompt.prompt();
  await deferredInstallPrompt.userChoice;
  deferredInstallPrompt = null;
  document.getElementById('installBtn').hidden = true;
});

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(() => {}));
}

restoreDraft();
track('pageview');
track('unique-visitor', { once: true });
