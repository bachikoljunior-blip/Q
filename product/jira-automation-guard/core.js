(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.JAGCore = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const VOLATILE_KEYS = new Set([
    'created', 'createdat', 'createddate', 'updated', 'updatedat', 'updateddate',
    'lastmodified', 'lastmodifieddate', 'modified', 'revision', 'version',
    'audit', 'auditlog', 'executions', 'executioncount', 'lastupdated',
  ]);
  const SECRET_KEY_RE = /(token|secret|password|passwd|api[_-]?key|authorization|credential|bearer|private[_-]?key|client[_-]?secret)/i;
  const ID_KEY_RE = /(?:^|[_-])(id|ids)$/i;
  const CUSTOM_FIELD_RE = /customfield[_-]?\d+/gi;
  const URL_RE = /https?:\/\/[^\s"'<>]+/gi;
  const ACCOUNT_ID_RE = /(?:[a-z0-9]{8,}:[a-z0-9-]{8,}|[a-z0-9_-]{20,})/i;
  const PROJECT_KEY_IN_JQL_RE = /\bproject\s*(?:=|in\s*\()\s*["']?([A-Z][A-Z0-9_]{1,19})/gi;
  const ISSUE_TYPE_IN_JQL_RE = /\bissuetype\s*(?:=|in\s*\()\s*["']?([^\s,\)"']+)/gi;

  function parseJsonText(text) {
    const source = String(text || '').replace(/^\uFEFF/, '').trim();
    if (!source) throw new Error('JSONが空です。');
    try {
      return JSON.parse(source);
    } catch (error) {
      const position = /position\s+(\d+)/i.exec(String(error && error.message));
      let detail = '';
      if (position) {
        const index = Number(position[1]);
        const prefix = source.slice(0, index);
        const line = prefix.split(/\r?\n/).length;
        const column = index - prefix.lastIndexOf('\n');
        detail = `（${line}行 ${column}列付近）`;
      }
      throw new Error(`JSONを読めませんでした${detail}: ${error.message}`);
    }
  }

  function isObject(value) {
    return value !== null && typeof value === 'object' && !Array.isArray(value);
  }

  function scoreRuleObject(value) {
    if (!isObject(value)) return 0;
    const keys = Object.keys(value).map(key => key.toLowerCase());
    let score = 0;
    if (keys.some(key => ['name', 'title', 'rulename'].includes(key))) score += 3;
    if (keys.some(key => key.includes('trigger'))) score += 2;
    if (keys.some(key => ['components', 'actions', 'conditions', 'branches'].includes(key))) score += 3;
    if (keys.some(key => ['state', 'enabled', 'status'].includes(key))) score += 1;
    if (keys.some(key => ['id', 'ruleid', 'uuid'].includes(key))) score += 1;
    if (keys.some(key => key.includes('project') || key.includes('scope'))) score += 1;
    return score;
  }

  function findRuleArrays(value, path = '$', depth = 0, found = []) {
    if (depth > 10 || value === null || typeof value !== 'object') return found;
    if (Array.isArray(value)) {
      const objects = value.filter(isObject);
      if (objects.length) {
        const average = objects.reduce((sum, item) => sum + scoreRuleObject(item), 0) / objects.length;
        const pathBoost = /(?:^|\.)(rules?|automationrules?|rulelist)$/i.test(path) ? 5 : 0;
        found.push({ path, value, score: average + pathBoost, objectCount: objects.length });
      }
      value.slice(0, 20).forEach((item, index) => findRuleArrays(item, `${path}[${index}]`, depth + 1, found));
      return found;
    }
    for (const [key, child] of Object.entries(value)) {
      findRuleArrays(child, `${path}.${key}`, depth + 1, found);
    }
    return found;
  }

  function extractRules(rootValue) {
    if (Array.isArray(rootValue) && rootValue.some(item => scoreRuleObject(item) >= 4)) {
      return { path: '$', rules: rootValue.filter(isObject), warning: null };
    }
    if (isObject(rootValue)) {
      for (const key of ['rules', 'automationRules', 'automation_rules', 'ruleList', 'rule_list']) {
        if (Array.isArray(rootValue[key])) {
          return { path: `$.${key}`, rules: rootValue[key].filter(isObject), warning: null };
        }
      }
    }
    const candidates = findRuleArrays(rootValue).sort((a, b) => b.score - a.score || b.objectCount - a.objectCount);
    if (!candidates.length || candidates[0].score < 3.5) {
      throw new Error('Automation ruleらしい配列を見つけられませんでした。Jiraから書き出したJSON全体を入れてください。');
    }
    return {
      path: candidates[0].path,
      rules: candidates[0].value.filter(isObject),
      warning: `rule配列を ${candidates[0].path} と推定しました。出力を確認してください。`,
    };
  }

  function firstValue(object, names) {
    if (!isObject(object)) return undefined;
    const entries = Object.entries(object);
    for (const name of names) {
      const found = entries.find(([key]) => key.toLowerCase() === name.toLowerCase());
      if (found && found[1] !== undefined && found[1] !== null && found[1] !== '') return found[1];
    }
    return undefined;
  }

  function scalar(value) {
    return value === null || ['string', 'number', 'boolean'].includes(typeof value);
  }

  function walk(value, visitor, path = '$', parentKey = '', depth = 0) {
    if (depth > 30) return;
    visitor(value, path, parentKey);
    if (Array.isArray(value)) {
      value.forEach((item, index) => walk(item, visitor, `${path}[${index}]`, parentKey, depth + 1));
    } else if (isObject(value)) {
      Object.entries(value).forEach(([key, child]) => walk(child, visitor, `${path}.${key}`, key, depth + 1));
    }
  }

  function sanitizeUrl(raw) {
    try {
      const url = new URL(String(raw));
      return `${url.protocol}//${url.host}${url.pathname}`;
    } catch (_) {
      return String(raw).split(/[?#]/, 1)[0].slice(0, 240);
    }
  }

  function compactValue(value, max = 160) {
    const text = typeof value === 'string' ? value : JSON.stringify(value);
    if (text.length <= max) return text;
    return `${text.slice(0, max - 1)}…`;
  }

  function maskSecret(value) {
    const text = String(value == null ? '' : value);
    if (!text) return '[empty]';
    if (text.length <= 6) return '[redacted]';
    return `${text.slice(0, 2)}…${text.slice(-2)} [redacted]`;
  }

  function addUnique(list, item, keyFn) {
    const key = keyFn(item);
    if (!list.some(existing => keyFn(existing) === key)) list.push(item);
  }

  function collectReferences(raw) {
    const references = {
      customFields: [], projects: [], issueTypes: [], accounts: [], urls: [],
      secrets: [], hardcodedIds: [], jql: [], componentTypes: [],
    };
    let objectCount = 0;
    let scalarCount = 0;

    walk(raw, (value, path, parentKey) => {
      if (isObject(value)) {
        objectCount += 1;
        const type = firstValue(value, ['component', 'componentType', 'type', 'actionType', 'conditionType', 'triggerType']);
        if (typeof type === 'string' && type.length < 120) {
          addUnique(references.componentTypes, { value: type, path }, item => `${item.value}|${item.path}`);
        }
        return;
      }
      if (!scalar(value)) return;
      scalarCount += 1;
      const text = String(value == null ? '' : value);
      const key = String(parentKey || '').toLowerCase();

      for (const match of text.matchAll(CUSTOM_FIELD_RE)) {
        addUnique(references.customFields, { value: match[0], path }, item => `${item.value.toLowerCase()}|${item.path}`);
      }

      if (SECRET_KEY_RE.test(parentKey) && text) {
        addUnique(references.secrets, { key: parentKey, value: maskSecret(text), path }, item => item.path);
      }

      const urls = text.match(URL_RE) || [];
      urls.forEach(url => addUnique(references.urls, { value: sanitizeUrl(url), path }, item => `${item.value}|${item.path}`));

      if (/account.*id|user.*id|actor.*id/i.test(parentKey) && text && ACCOUNT_ID_RE.test(text)) {
        addUnique(references.accounts, { value: compactValue(text, 80), path }, item => `${item.value}|${item.path}`);
      }

      if (/project/.test(key) && /(?:id|key)$/.test(key) && text) {
        addUnique(references.projects, { value: compactValue(text, 80), path }, item => `${item.value}|${item.path}`);
      }
      if (/issue.?type/.test(key) && /(?:id|key|name)$/.test(key) && text) {
        addUnique(references.issueTypes, { value: compactValue(text, 80), path }, item => `${item.value}|${item.path}`);
      }

      if (ID_KEY_RE.test(parentKey) && text && !/^(rule|automation|component|audit|revision|version)/i.test(parentKey)) {
        addUnique(references.hardcodedIds, { key: parentKey, value: compactValue(text, 80), path }, item => `${item.key}|${item.value}|${item.path}`);
      }

      if (/jql|query|condition/i.test(parentKey) && typeof value === 'string' && value.length > 2) {
        addUnique(references.jql, { value: compactValue(value.replace(/(?:token|password|secret)\s*=\s*[^\s]+/gi, '$1=[redacted]'), 240), path }, item => `${item.value}|${item.path}`);
        for (const match of value.matchAll(PROJECT_KEY_IN_JQL_RE)) {
          addUnique(references.projects, { value: match[1], path: `${path} (JQL)` }, item => `${item.value}|${item.path}`);
        }
        for (const match of value.matchAll(ISSUE_TYPE_IN_JQL_RE)) {
          addUnique(references.issueTypes, { value: match[1], path: `${path} (JQL)` }, item => `${item.value}|${item.path}`);
        }
      }
    });

    return { references, objectCount, scalarCount };
  }

  function normalizeForDiff(value, parentKey = '') {
    if (Array.isArray(value)) return value.map(item => normalizeForDiff(item, parentKey));
    if (isObject(value)) {
      const output = {};
      Object.keys(value).sort().forEach(key => {
        const normalizedKey = key.toLowerCase().replace(/[^a-z0-9]/g, '');
        if (VOLATILE_KEYS.has(normalizedKey)) return;
        const child = value[key];
        output[key] = SECRET_KEY_RE.test(key) && scalar(child) ? '[redacted]' : normalizeForDiff(child, key);
      });
      return output;
    }
    return value;
  }

  function stableStringify(value) {
    if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`;
    if (isObject(value)) {
      return `{${Object.keys(value).sort().map(key => `${JSON.stringify(key)}:${stableStringify(value[key])}`).join(',')}}`;
    }
    return JSON.stringify(value);
  }

  function hashString(input) {
    let hash = 2166136261;
    for (let index = 0; index < input.length; index += 1) {
      hash ^= input.charCodeAt(index);
      hash = Math.imul(hash, 16777619);
    }
    return (hash >>> 0).toString(16).padStart(8, '0');
  }

  function flatten(value, path = '$', output = {}) {
    if (Array.isArray(value)) {
      if (!value.length) output[path] = '[]';
      value.forEach((item, index) => flatten(item, `${path}[${index}]`, output));
    } else if (isObject(value)) {
      const entries = Object.entries(value);
      if (!entries.length) output[path] = '{}';
      entries.forEach(([key, child]) => flatten(child, `${path}.${key}`, output));
    } else {
      output[path] = value;
    }
    return output;
  }

  function enabledState(raw) {
    const value = firstValue(raw, ['state', 'status', 'enabled', 'isEnabled', 'active']);
    if (typeof value === 'boolean') return value ? 'ENABLED' : 'DISABLED';
    const text = String(value == null ? '' : value).toUpperCase();
    if (/DISABLED|INACTIVE|OFF|FALSE|DRAFT/.test(text)) return 'DISABLED';
    if (/ENABLED|ACTIVE|ON|TRUE/.test(text)) return 'ENABLED';
    return text || 'UNKNOWN';
  }

  function analyzeRule(raw, index, sourceLabel) {
    const id = String(firstValue(raw, ['id', 'ruleId', 'uuid', 'clientKey', 'ruleUuid']) ?? '');
    const name = String(firstValue(raw, ['name', 'ruleName', 'title']) ?? `Rule ${index + 1}`);
    const description = String(firstValue(raw, ['description', 'summary']) ?? '');
    const state = enabledState(raw);
    const collected = collectReferences(raw);
    const normalized = normalizeForDiff(raw);
    const normalizedText = stableStringify(normalized);
    const componentPaths = collected.references.componentTypes.map(item => item.path.toLowerCase());
    const triggerCount = componentPaths.filter(path => path.includes('trigger')).length
      + (Object.keys(raw).some(key => key.toLowerCase().includes('trigger')) ? 1 : 0);
    const actionCount = componentPaths.filter(path => /action|component/.test(path) && !path.includes('trigger')).length
      + (Array.isArray(raw.actions) ? raw.actions.length : 0);
    const identityName = name.normalize('NFKC').trim().toLowerCase().replace(/\s+/g, ' ');
    return {
      sourceLabel,
      index,
      id,
      name,
      identityName,
      description,
      state,
      triggerCount,
      actionCount,
      componentCount: collected.references.componentTypes.length,
      objectCount: collected.objectCount,
      scalarCount: collected.scalarCount,
      references: collected.references,
      normalized,
      fingerprint: hashString(normalizedText),
      raw,
    };
  }

  function buildWarnings(rules, exportWarnings = []) {
    const warnings = exportWarnings.map(message => ({ severity: 'medium', code: 'EXPORT_STRUCTURE_GUESS', rule: '', message }));
    const names = new Map();
    rules.forEach(rule => {
      const list = names.get(rule.identityName) || [];
      list.push(rule);
      names.set(rule.identityName, list);

      if (rule.state === 'DISABLED') warnings.push({ severity: 'info', code: 'RULE_DISABLED', rule: rule.name, message: '無効状態のruleです。移行対象か確認してください。' });
      if (rule.triggerCount === 0) warnings.push({ severity: 'medium', code: 'TRIGGER_NOT_DETECTED', rule: rule.name, message: 'triggerを構造から検出できませんでした。export schemaまたはrule内容を確認してください。' });
      if (rule.actionCount === 0) warnings.push({ severity: 'medium', code: 'ACTION_NOT_DETECTED', rule: rule.name, message: 'actionを構造から検出できませんでした。' });
      if (rule.componentCount > 45 || rule.objectCount > 180) warnings.push({ severity: 'info', code: 'LARGE_RULE', rule: rule.name, message: `大きいruleです（components ${rule.componentCount}, objects ${rule.objectCount}）。レビューを分割できるか確認してください。` });
      if (rule.references.secrets.length) warnings.push({ severity: 'high', code: 'SECRET_LIKE_VALUE', rule: rule.name, message: `${rule.references.secrets.length}件のcredential/tokenらしきキーがあります。export共有前に必ず確認してください。` });
      if (rule.references.customFields.length) warnings.push({ severity: 'medium', code: 'CUSTOM_FIELD_REFERENCE', rule: rule.name, message: `${rule.references.customFields.length}件のcustom field参照があります。移行先IDとの対応を確認してください。` });
      if (rule.references.hardcodedIds.length) warnings.push({ severity: 'medium', code: 'HARDCODED_ID', rule: rule.name, message: `${rule.references.hardcodedIds.length}件のハードコードID候補があります。site間移行で壊れないか確認してください。` });
      if (rule.references.accounts.length) warnings.push({ severity: 'medium', code: 'ACCOUNT_REFERENCE', rule: rule.name, message: `${rule.references.accounts.length}件のaccount/user ID候補があります。移行先のactor権限を確認してください。` });
      if (rule.references.urls.length) warnings.push({ severity: 'medium', code: 'EXTERNAL_URL', rule: rule.name, message: `${rule.references.urls.length}件のURL/webhook候補があります。環境別URLと秘密情報を確認してください。` });
    });
    names.forEach(list => {
      if (list.length > 1) warnings.push({ severity: 'high', code: 'DUPLICATE_RULE_NAME', rule: list[0].name, message: `同名ruleが${list.length}件あります。名前だけの差分照合が曖昧になります。` });
    });
    const order = { high: 0, medium: 1, info: 2 };
    warnings.sort((a, b) => order[a.severity] - order[b.severity] || a.rule.localeCompare(b.rule));
    return warnings;
  }

  function analyzeExport(text, label = 'export') {
    const root = parseJsonText(text);
    const extracted = extractRules(root);
    const rules = extracted.rules.map((rule, index) => analyzeRule(rule, index, label));
    const exportWarnings = extracted.warning ? [extracted.warning] : [];
    return {
      label,
      rulePath: extracted.path,
      ruleCount: rules.length,
      rules,
      warnings: buildWarnings(rules, exportWarnings),
      rootType: Array.isArray(root) ? 'array' : typeof root,
    };
  }

  function uniqueNameMap(rules) {
    const counts = new Map();
    rules.forEach(rule => counts.set(rule.identityName, (counts.get(rule.identityName) || 0) + 1));
    const map = new Map();
    rules.forEach(rule => {
      const key = counts.get(rule.identityName) === 1 ? `name:${rule.identityName}` : (rule.id ? `id:${rule.id}` : `index:${rule.index}`);
      map.set(key, rule);
    });
    return map;
  }

  function pathDiff(beforeValue, afterValue, limit = 80) {
    const before = flatten(beforeValue);
    const after = flatten(afterValue);
    const paths = Array.from(new Set([...Object.keys(before), ...Object.keys(after)])).sort();
    const changes = [];
    for (const path of paths) {
      const left = before[path];
      const right = after[path];
      if (stableStringify(left) === stableStringify(right)) continue;
      changes.push({
        path,
        before: left === undefined ? '[missing]' : compactValue(SECRET_KEY_RE.test(path) ? '[redacted]' : left, 240),
        after: right === undefined ? '[missing]' : compactValue(SECRET_KEY_RE.test(path) ? '[redacted]' : right, 240),
      });
      if (changes.length >= limit) break;
    }
    return changes;
  }

  function diffExports(before, after) {
    const left = uniqueNameMap(before.rules);
    const right = uniqueNameMap(after.rules);
    const keys = Array.from(new Set([...left.keys(), ...right.keys()])).sort();
    const rows = [];
    keys.forEach(key => {
      const a = left.get(key);
      const b = right.get(key);
      if (!a) rows.push({ status: 'added', key, name: b.name, before: null, after: b, changes: [] });
      else if (!b) rows.push({ status: 'removed', key, name: a.name, before: a, after: null, changes: [] });
      else if (a.fingerprint === b.fingerprint) rows.push({ status: 'unchanged', key, name: b.name, before: a, after: b, changes: [] });
      else rows.push({ status: 'changed', key, name: b.name, before: a, after: b, changes: pathDiff(a.normalized, b.normalized) });
    });
    const summary = { added: 0, removed: 0, changed: 0, unchanged: 0 };
    rows.forEach(row => { summary[row.status] += 1; });
    return { rows, summary };
  }

  function referenceSummary(rules) {
    const groups = {
      customFields: [], projects: [], issueTypes: [], accounts: [], urls: [], secrets: [], hardcodedIds: [], jql: [],
    };
    rules.forEach(rule => {
      Object.keys(groups).forEach(group => {
        (rule.references[group] || []).forEach(item => addUnique(groups[group], { ...item, rule: rule.name }, existing => `${existing.rule}|${existing.path}|${existing.value || existing.key}`));
      });
    });
    return groups;
  }

  function publicRule(rule) {
    return {
      id: rule.id,
      name: rule.name,
      description: rule.description,
      state: rule.state,
      triggerCount: rule.triggerCount,
      actionCount: rule.actionCount,
      componentCount: rule.componentCount,
      fingerprint: rule.fingerprint,
      references: rule.references,
    };
  }

  function buildReport(beforeText, afterText = '') {
    const before = analyzeExport(beforeText, afterText ? 'before' : 'current');
    const after = afterText && String(afterText).trim() ? analyzeExport(afterText, 'after') : null;
    const diff = after ? diffExports(before, after) : null;
    const activeRules = after ? after.rules : before.rules;
    const warnings = after ? [...before.warnings.map(item => ({ ...item, source: 'before' })), ...after.warnings.map(item => ({ ...item, source: 'after' }))] : before.warnings;
    return {
      schemaVersion: 1,
      generatedAt: new Date().toISOString(),
      mode: after ? 'compare' : 'single',
      before: { label: before.label, rulePath: before.rulePath, ruleCount: before.ruleCount, rules: before.rules.map(publicRule), warnings: before.warnings },
      after: after ? { label: after.label, rulePath: after.rulePath, ruleCount: after.ruleCount, rules: after.rules.map(publicRule), warnings: after.warnings } : null,
      diff: diff ? { summary: diff.summary, rows: diff.rows.map(row => ({ status: row.status, key: row.key, name: row.name, changes: row.changes })) } : null,
      warnings,
      references: referenceSummary(activeRules),
    };
  }

  function markdownEscape(value) {
    return String(value == null ? '' : value).replace(/\|/g, '\\|').replace(/\r?\n/g, ' ');
  }

  function reportToMarkdown(report) {
    const lines = [
      '# Jira Automation Guard report',
      '',
      `Generated: ${report.generatedAt}`,
      `Mode: ${report.mode}`,
      '',
      '## Summary',
      '',
      `- Current rules: ${report.after ? report.after.ruleCount : report.before.ruleCount}`,
      `- Warnings: ${report.warnings.length}`,
      `- Custom-field references: ${report.references.customFields.length}`,
      `- Hard-coded ID candidates: ${report.references.hardcodedIds.length}`,
      `- Secret-like keys: ${report.references.secrets.length}`,
      `- URL/webhook candidates: ${report.references.urls.length}`,
    ];
    if (report.diff) {
      lines.push(`- Added: ${report.diff.summary.added}`);
      lines.push(`- Removed: ${report.diff.summary.removed}`);
      lines.push(`- Changed: ${report.diff.summary.changed}`);
      lines.push(`- Unchanged: ${report.diff.summary.unchanged}`);
    }

    lines.push('', '## Rules', '', '| State | Rule | Trigger | Action | Components | Fingerprint |', '|---|---|---:|---:|---:|---|');
    const rules = report.after ? report.after.rules : report.before.rules;
    rules.forEach(rule => lines.push(`| ${markdownEscape(rule.state)} | ${markdownEscape(rule.name)} | ${rule.triggerCount} | ${rule.actionCount} | ${rule.componentCount} | \`${rule.fingerprint}\` |`));

    lines.push('', '## Warnings', '');
    if (!report.warnings.length) lines.push('- No structural warnings detected.');
    report.warnings.forEach(item => lines.push(`- **${item.severity.toUpperCase()} / ${item.code}** ${item.rule ? `— ${markdownEscape(item.rule)}: ` : '— '}${markdownEscape(item.message)}`));

    if (report.diff) {
      lines.push('', '## Rule diff', '', '| Status | Rule | Changed paths |', '|---|---|---:|');
      report.diff.rows.forEach(row => lines.push(`| ${row.status} | ${markdownEscape(row.name)} | ${row.changes.length} |`));
      report.diff.rows.filter(row => row.changes.length).forEach(row => {
        lines.push('', `### ${row.name}`, '');
        row.changes.slice(0, 80).forEach(change => lines.push(`- \`${markdownEscape(change.path)}\`: \`${markdownEscape(change.before)}\` → \`${markdownEscape(change.after)}\``));
      });
    }

    const labels = {
      customFields: 'Custom fields', projects: 'Projects', issueTypes: 'Issue types', accounts: 'Accounts/users',
      hardcodedIds: 'Other hard-coded IDs', urls: 'URLs/webhooks', secrets: 'Secret-like keys', jql: 'JQL/query strings',
    };
    lines.push('', '## Reference inventory', '');
    Object.entries(labels).forEach(([group, title]) => {
      lines.push(`### ${title}`, '');
      const items = report.references[group] || [];
      if (!items.length) lines.push('- none detected');
      items.slice(0, 300).forEach(item => lines.push(`- **${markdownEscape(item.rule)}** — \`${markdownEscape(item.path)}\` — ${markdownEscape(item.value || item.key || '')}`));
      lines.push('');
    });

    lines.push('## Important', '', '- This is a static preflight report, not proof that a rule is correct or deployable.', '- Jira export schemas and app components vary. Review warnings against the source site and target site before import.', '- Secret-like values are redacted in the report. The input JSON is processed in the browser by the published MVP.');
    return `${lines.join('\n')}\n`;
  }

  return {
    parseJsonText,
    extractRules,
    collectReferences,
    normalizeForDiff,
    stableStringify,
    hashString,
    flatten,
    analyzeRule,
    analyzeExport,
    diffExports,
    pathDiff,
    buildReport,
    reportToMarkdown,
    maskSecret,
    sanitizeUrl,
  };
});
