#!/usr/bin/env node

import { mkdirSync, existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import pixelmatch from 'pixelmatch';
import { PNG } from 'pngjs';
import { chromium, devices, webkit } from 'playwright';
import { serve } from './serve.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const outputDir = resolve(root, process.env.Q_WEBKIT_OUTPUT || 'test-results/iphone-webkit');
const actualPath = resolve(outputDir, 'gameplay.png');
const candidatePath = resolve(outputDir, 'gameplay-candidate.png');
const diffPath = resolve(outputDir, 'gameplay-diff.png');
const tracePath = resolve(outputDir, 'trace.zip');
const reportPath = resolve(outputDir, 'report.json');
const baselinePath = resolve(root, 'tests/baselines/iphone-se3-webkit-gameplay.png');
const browserName = process.env.Q_BROWSER || 'webkit';
const requireBaseline = process.env.Q_REQUIRE_WEBKIT_BASELINE !== '0';
const externalUrl = process.env.Q_TEST_URL || '';
const allowedDiffRatio = Number(process.env.Q_WEBKIT_DIFF_RATIO || 0.08);

mkdirSync(outputDir, { recursive: true });

const report = {
  schemaVersion: 1,
  checkedAt: new Date().toISOString(),
  target: 'iPhone SE (3rd generation) / WebKit / landscape 667x375 / DPR 2',
  browser: browserName,
  checks: [],
  errors: { page: [], console: [], request: [], http: [] },
  device: null,
  interaction: {},
  persistence: null,
  visualRegression: null,
  failures: [],
  status: 'running',
};

function check(condition, name, detail = '') {
  const passed = Boolean(condition);
  report.checks.push({ name, passed, detail });
  if (!passed) report.failures.push(`${name}: ${detail}`);
  return passed;
}

function compareScreenshot() {
  if (!existsSync(baselinePath)) {
    writeFileSync(candidatePath, readFileSync(actualPath));
    if (requireBaseline) report.failures.push('WebKit baseline is missing; inspect gameplay-candidate.png and commit the approved image');
    return { baselinePresent: false, candidate: candidatePath.slice(root.length + 1) };
  }
  const baseline = PNG.sync.read(readFileSync(baselinePath));
  const actual = PNG.sync.read(readFileSync(actualPath));
  if (baseline.width !== actual.width || baseline.height !== actual.height) {
    report.failures.push(`visual dimensions differ: baseline=${baseline.width}x${baseline.height}, actual=${actual.width}x${actual.height}`);
    return { baselinePresent: true, dimensionsMatch: false };
  }
  const diff = new PNG({ width: actual.width, height: actual.height });
  const pixels = pixelmatch(baseline.data, actual.data, diff.data, actual.width, actual.height, {
    threshold: 0.12,
    includeAA: false,
  });
  writeFileSync(diffPath, PNG.sync.write(diff));
  const ratio = pixels / (actual.width * actual.height);
  check(ratio <= allowedDiffRatio, 'steady gameplay matches approved WebKit baseline', `diff=${(ratio * 100).toFixed(3)}%, limit=${(allowedDiffRatio * 100).toFixed(1)}%`);
  return { baselinePresent: true, dimensionsMatch: true, differentPixels: pixels, diffRatio: ratio, allowedDiffRatio };
}

async function dispatchTouch(page, selector, type, pointerId, xRatio, yRatio, primary = true) {
  return page.evaluate(({ selector, type, pointerId, xRatio, yRatio, primary }) => {
    const target = document.querySelector(selector);
    if (!target) throw new Error(`missing touch target: ${selector}`);
    // Script-created PointerEvents are not registered with the browser's native
    // pointer tracker, so pointer capture would throw. The real Safari layer
    // exercises native capture; this WebKit harness stubs capture only for its
    // synthetic multi-touch fallback.
    target.setPointerCapture = () => {};
    target.releasePointerCapture = () => {};
    const rect = target.getBoundingClientRect();
    const event = new PointerEvent(type, {
      pointerId,
      pointerType: 'touch',
      isPrimary: primary,
      clientX: rect.left + rect.width * xRatio,
      clientY: rect.top + rect.height * yRatio,
      width: 18,
      height: 18,
      pressure: type === 'pointerup' ? 0 : 0.7,
      button: 0,
      buttons: type === 'pointerup' ? 0 : 1,
      bubbles: true,
      cancelable: true,
      composed: true,
    });
    target.dispatchEvent(event);
    return { x: event.clientX, y: event.clientY };
  }, { selector, type, pointerId, xRatio, yRatio, primary });
}

let server = null;
let browser = null;
let context = null;
let page = null;

try {
  let baseUrl = externalUrl;
  if (!baseUrl) {
    server = await serve({ port: 0 });
    baseUrl = `http://127.0.0.1:${server.address().port}/Q/`;
  }
  const profile = devices['iPhone SE (3rd gen) landscape'];
  const browserType = browserName === 'chromium' ? chromium : webkit;
  browser = await browserType.launch({ headless: true });
  context = await browser.newContext({
    ...profile,
    locale: 'ja-JP',
    timezoneId: 'Asia/Tokyo',
    colorScheme: 'dark',
    reducedMotion: 'reduce',
    recordVideo: { dir: resolve(outputDir, 'video'), size: profile.viewport },
  });
  await context.tracing.start({ screenshots: true, snapshots: true, sources: true });
  page = await context.newPage();
  page.setDefaultTimeout(60000);
  page.on('pageerror', (error) => report.errors.page.push(error.stack || error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') report.errors.console.push(message.text());
  });
  page.on('requestfailed', (request) => report.errors.request.push({ url: request.url(), error: request.failure()?.errorText || 'unknown' }));
  page.on('response', (response) => {
    if (response.status() >= 400) report.errors.http.push({ url: response.url(), status: response.status() });
  });

  const url = new URL(baseUrl);
  url.searchParams.set('test', '1');
  const response = await page.goto(url.href, { waitUntil: 'domcontentloaded', timeout: 120000 });
  await page.waitForFunction(() => Boolean(window.__Q_TEST__), null, { timeout: 120000 });
  await page.evaluate(() => { window.__Q_TEST__.clear(); localStorage.clear(); });
  await page.reload({ waitUntil: 'domcontentloaded', timeout: 120000 });
  await page.waitForFunction(() => Boolean(window.__Q_TEST__), null, { timeout: 120000 });

  report.device = await page.evaluate(() => ({
    viewport: { width: innerWidth, height: innerHeight },
    visualViewport: window.visualViewport ? { width: visualViewport.width, height: visualViewport.height } : null,
    dpr: devicePixelRatio,
    userAgent: navigator.userAgent,
    maxTouchPoints: navigator.maxTouchPoints,
    coarse: matchMedia('(pointer: coarse)').matches,
    landscape: matchMedia('(orientation: landscape)').matches,
    scrollWidth: document.documentElement.scrollWidth,
  }));
  check(response?.status() === 200, 'entry responds successfully', `status=${response?.status()}`);
  check(report.device.viewport.width === 667 && report.device.viewport.height === 375, 'iPhone SE 3 landscape viewport', JSON.stringify(report.device.viewport));
  check(report.device.dpr === 2, 'iPhone SE 3 DPR', `dpr=${report.device.dpr}`);
  check(report.device.coarse && report.device.landscape, 'touch-oriented landscape surface is active', JSON.stringify(report.device));
  check(report.device.scrollWidth <= report.device.viewport.width, 'page has no horizontal overflow', `scroll=${report.device.scrollWidth}, viewport=${report.device.viewport.width}`);

  const menuTargets = await page.evaluate(() => ['continue', 'new-game', 'settings'].map((id) => {
    const element = document.getElementById(id);
    const rect = element.getBoundingClientRect();
    return { id, hidden: element.classList.contains('hidden'), width: rect.width, height: rect.height };
  }));
  check(menuTargets.filter((target) => !target.hidden).every((target) => target.width >= 44 && target.height >= 44), 'visible menu controls meet 44 CSS px target', JSON.stringify(menuTargets));

  await page.locator('#new-game').tap();
  await page.locator('#tutorial-skip').tap();
  await page.waitForFunction(() => window.__Q_TEST__.snapshot().status === 'running');
  const before = await page.evaluate(() => window.__Q_TEST__.snapshot());

  await dispatchTouch(page, '#move-pad', 'pointerdown', 31, 0.5, 0.5, true);
  await dispatchTouch(page, '#move-pad', 'pointermove', 31, 0.5, 0.12, true);
  const attackBefore = await page.evaluate(() => window.__Q_TEST__.snapshot().interaction.attackCooldown);
  await page.locator('#attack').tap();
  const attackAfter = await page.evaluate(() => window.__Q_TEST__.snapshot().interaction.attackCooldown);
  await page.evaluate(() => window.__Q_TEST__.tick(0.7));
  await dispatchTouch(page, '#move-pad', 'pointerup', 31, 0.5, 0.12, true);
  const afterMove = await page.evaluate(() => window.__Q_TEST__.snapshot());
  const moved = Math.hypot(afterMove.x - before.x, afterMove.z - before.z);
  check(moved > 0.2, 'touch pad moves the player', `distance=${moved.toFixed(3)}`);
  check(attackAfter > attackBefore, 'attack control starts its cooldown', `before=${attackBefore}, after=${attackAfter}`);
  check(afterMove.interaction.moveX === 0 && afterMove.interaction.moveY === 0, 'touch release clears movement', JSON.stringify(afterMove.interaction));

  const staminaBefore = afterMove.stamina;
  await page.locator('#dodge').tap();
  const afterDodge = await page.evaluate(() => window.__Q_TEST__.snapshot());
  check(afterDodge.stamina < staminaBefore && afterDodge.interaction.dodgeTimer > 0, 'dodge control consumes stamina and starts dodge', JSON.stringify({ before: staminaBefore, after: afterDodge.stamina, timer: afterDodge.interaction.dodgeTimer }));

  const canvas = await page.locator('#canvas').boundingBox();
  if (!canvas) throw new Error('game canvas is not visible');
  const cameraBefore = afterDodge.interaction.cameraYaw;
  await page.mouse.move(canvas.x + canvas.width * 0.55, canvas.y + canvas.height * 0.45);
  await page.mouse.down();
  await page.mouse.move(canvas.x + canvas.width * 0.72, canvas.y + canvas.height * 0.35, { steps: 6 });
  await page.mouse.up();
  const afterCamera = await page.evaluate(() => window.__Q_TEST__.snapshot());
  const cameraDelta = Math.abs(afterCamera.interaction.cameraYaw - cameraBefore);
  check(cameraDelta > 0.02, 'camera drag changes yaw', `delta=${cameraDelta.toFixed(4)}`);

  await page.locator('#pause').tap();
  await page.waitForFunction(() => window.__Q_TEST__.snapshot().status === 'paused');
  const paused = await page.evaluate(() => window.__Q_TEST__.snapshot());
  await page.locator('#resume').tap();
  await page.waitForFunction(() => window.__Q_TEST__.snapshot().status === 'running');
  check(paused.status === 'paused', 'pause control freezes the game', `status=${paused.status}`);

  await page.locator('#pause').tap();
  await page.waitForFunction(() => window.__Q_TEST__.snapshot().status === 'paused');
  const saved = await page.evaluate(() => ({ x: window.__Q_TEST__.snapshot().x, z: window.__Q_TEST__.snapshot().z, hasSave: Boolean(localStorage.length) }));
  await page.reload({ waitUntil: 'domcontentloaded', timeout: 120000 });
  await page.waitForFunction(() => Boolean(window.__Q_TEST__));
  const continueVisible = await page.locator('#continue').evaluate((element) => !element.classList.contains('hidden'));
  await page.locator('#continue').tap();
  await page.waitForFunction(() => window.__Q_TEST__.snapshot().status === 'running');
  const restored = await page.evaluate(() => window.__Q_TEST__.snapshot());
  report.persistence = { saved, continueVisible, restored: { x: restored.x, z: restored.z, status: restored.status } };
  check(saved.hasSave && continueVisible, 'reload exposes the saved journey', JSON.stringify(report.persistence));
  check(Math.hypot(restored.x - saved.x, restored.z - saved.z) < 0.3, 'reload restores the saved position', JSON.stringify(report.persistence));

  await page.evaluate(() => window.__Q_TEST__.tick(8));
  const soak = await page.evaluate(() => window.__Q_TEST__.snapshot());
  check(soak.status === 'running' && [soak.x, soak.z, soak.health, soak.stamina].every(Number.isFinite), 'automated play retains finite running state', JSON.stringify({ status: soak.status, x: soak.x, z: soak.z, health: soak.health, stamina: soak.stamina }));
  check(soak.metrics.drawCalls > 0 && soak.metrics.drawCalls <= 170, 'draw-call budget holds', `drawCalls=${soak.metrics.drawCalls}`);
  check(soak.metrics.triangles > 0 && soak.metrics.triangles <= 170000, 'triangle budget holds', `triangles=${soak.metrics.triangles}`);

  await page.waitForTimeout(800);
  await page.screenshot({ path: actualPath });
  report.visualRegression = compareScreenshot();
  report.interaction = {
    moved,
    attack: { before: attackBefore, after: attackAfter },
    dodge: { staminaBefore, staminaAfter: afterDodge.stamina },
    cameraDelta,
  };
  check(report.errors.page.length === 0, 'no page errors', `${report.errors.page.length} error(s)`);
  check(report.errors.console.length === 0, 'no console errors', `${report.errors.console.length} error(s)`);
  check(report.errors.request.length === 0, 'no failed requests', `${report.errors.request.length} failure(s)`);
  check(report.errors.http.length === 0, 'no HTTP error responses', `${report.errors.http.length} response(s)`);
} catch (error) {
  report.failures.push(error.stack || error.message || String(error));
} finally {
  if (context) {
    try { await context.tracing.stop({ path: tracePath }); } catch (error) { report.failures.push(`trace: ${error.message}`); }
  }
  if (page) await page.close().catch(() => {});
  if (context) await context.close().catch(() => {});
  if (browser) await browser.close().catch(() => {});
  if (server) await new Promise((done) => server.close(done));
  report.status = report.failures.length ? 'failed' : 'passed';
  writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);
}

console.log(`[q-iphone-webkit] ${report.status.toUpperCase()}: ${report.failures.length} failure(s)`);
if (report.visualRegression?.diffRatio != null) console.log(`[q-iphone-webkit] visual diff ratio=${report.visualRegression.diffRatio}`);
for (const failure of report.failures) console.error(`- ${failure}`);
if (report.failures.length) process.exit(1);
