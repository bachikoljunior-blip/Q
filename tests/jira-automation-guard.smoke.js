'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const core = require('../product/jira-automation-guard/core.js');
const beforeText = fs.readFileSync(path.join(__dirname, '../product/jira-automation-guard/sample-before.json'), 'utf8');
const afterText = fs.readFileSync(path.join(__dirname, '../product/jira-automation-guard/sample-after.json'), 'utf8');

const parsed = core.parseJsonText(beforeText);
assert.ok(Array.isArray(parsed.rules));
assert.strictEqual(parsed.rules.length, 3);

const extracted = core.extractRules(parsed);
assert.strictEqual(extracted.path, '$.rules');
assert.strictEqual(extracted.rules.length, 3);

const single = core.buildReport(beforeText);
assert.strictEqual(single.mode, 'single');
assert.strictEqual(single.before.ruleCount, 3);
assert.strictEqual(single.after, null);
assert.strictEqual(single.diff, null);
assert.ok(single.warnings.some(item => item.code === 'RULE_DISABLED'));
assert.ok(single.warnings.some(item => item.code === 'SECRET_LIKE_VALUE'));
assert.ok(single.references.customFields.some(item => item.value.toLowerCase() === 'customfield_12345'));
assert.ok(single.references.customFields.some(item => item.value.toLowerCase() === 'customfield_15500'));
assert.ok(single.references.urls.some(item => item.value === 'https://hooks.example.test/jira/ops'));
assert.ok(single.references.secrets.length >= 1);
assert.ok(single.references.secrets.every(item => !String(item.value).includes('fake-before-secret-do-not-use')));

const compared = core.buildReport(beforeText, afterText);
assert.strictEqual(compared.mode, 'compare');
assert.strictEqual(compared.before.ruleCount, 3);
assert.strictEqual(compared.after.ruleCount, 3);
assert.deepStrictEqual(compared.diff.summary, {
  added: 1,
  removed: 1,
  changed: 1,
  unchanged: 1,
});

const changed = compared.diff.rows.find(row => row.status === 'changed' && row.name === 'Escalate high-priority bugs');
assert.ok(changed, 'expected changed escalation rule');
assert.ok(changed.changes.length > 0);
assert.ok(changed.changes.some(change => String(change.path).includes('customfield') || String(change.after).includes('customfield_98765')));
assert.ok(compared.references.customFields.some(item => item.value.toLowerCase() === 'customfield_98765'));
assert.ok(compared.references.urls.some(item => item.value === 'https://hooks.example.test/jira/production'));

const markdown = core.reportToMarkdown(compared);
assert.ok(markdown.includes('# Jira Automation Guard report'));
assert.ok(markdown.includes('## Rule diff'));
assert.ok(markdown.includes('## Reference inventory'));
assert.ok(markdown.includes('Escalate high-priority bugs'));
assert.ok(!markdown.includes('fake-before-secret-do-not-use'));
assert.ok(!markdown.includes('fake-after-secret-do-not-use'));
assert.ok(!markdown.includes('fake-sample-token'));
assert.ok(!markdown.includes('fake-after-token'));

const reportJson = JSON.stringify(compared);
assert.ok(!reportJson.includes('fake-before-secret-do-not-use'));
assert.ok(!reportJson.includes('fake-after-secret-do-not-use'));
assert.ok(!reportJson.includes('fake-sample-token'));
assert.ok(!reportJson.includes('fake-after-token'));

const nested = core.analyzeExport(JSON.stringify({ payload: { automationRules: parsed.rules } }));
assert.strictEqual(nested.rulePath, '$.payload.automationRules');
assert.strictEqual(nested.ruleCount, 3);

assert.throws(() => core.parseJsonText('{broken'), /JSONを読めませんでした/);
assert.throws(() => core.analyzeExport(JSON.stringify({ hello: 'world' })), /Automation ruleらしい配列/);

console.log('jira automation guard smoke passed');
