#!/usr/bin/env node

import { mkdirSync, writeFileSync } from 'node:fs';
import { request as httpRequest } from 'node:http';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { serve } from './serve.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const outputDir = resolve(root, process.env.Q_IOS_OUTPUT || 'test-results/ios-safari');
const reportPath = resolve(outputDir, 'report.json');
const gameplayPath = resolve(outputDir, 'ios-safari-gameplay.png');
const pausePath = resolve(outputDir, 'ios-safari-pause.png');
const appiumUrl = new URL(process.env.APPIUM_URL || 'http://127.0.0.1:4723/');
const externalUrl = process.env.Q_TEST_URL || '';
const udid = process.env.IOS_SIMULATOR_UDID || '';
const platformVersion = process.env.IOS_SIMULATOR_PLATFORM_VERSION || '';
const bootTimeout = Number(process.env.Q_IOS_TIMEOUT || 240000);

mkdirSync(outputDir, { recursive: true });

const report = {
  schemaVersion: 1,
  checkedAt: new Date().toISOString(),
  target: 'iPhone SE (3rd generation) iOS Simulator / Mobile Safari / landscape',
  checks: [],
  errors: [],
  failures: [],
  device: null,
  interaction: {},
  persistence: null,
  status: 'running',
};

function check(condition, name, detail = '') {
  const passed = Boolean(condition);
  report.checks.push({ name, passed, detail });
  if (!passed) report.failures.push(`${name}: ${detail}`);
  return passed;
}

async function waitForHttp(url, timeout = 90000) {
  const deadline = Date.now() + timeout;
  let lastError;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(url, { redirect: 'manual' });
      if (response.status >= 200 && response.status < 500) return;
      lastError = new Error(`HTTP ${response.status}`);
    } catch (error) {
      lastError = error;
    }
    await new Promise((done) => setTimeout(done, 500));
  }
  throw new Error(`endpoint did not become reachable: ${lastError?.message || 'timeout'}`);
}

async function webdriver(pathname, { method = 'POST', body } = {}) {
  const url = new URL(pathname.replace(/^\//, ''), appiumUrl);
  const encoded = body === undefined ? '' : JSON.stringify(body);
  const response = await new Promise((resolveRequest, rejectRequest) => {
    const request = httpRequest(url, {
      method,
      headers: body === undefined ? undefined : {
        'content-type': 'application/json',
        'content-length': Buffer.byteLength(encoded),
      },
    }, (incoming) => {
      let text = '';
      incoming.setEncoding('utf8');
      incoming.on('data', (chunk) => { text += chunk; });
      incoming.on('end', () => resolveRequest({ ok: incoming.statusCode >= 200 && incoming.statusCode < 300, status: incoming.statusCode, text }));
    });
    request.setTimeout(900000, () => request.destroy(new Error(`WebDriver ${method} ${pathname} exceeded 15 minutes`)));
    request.on('error', rejectRequest);
    if (encoded) request.write(encoded);
    request.end();
  });
  let payload;
  try { payload = response.text ? JSON.parse(response.text) : {}; }
  catch { payload = { value: response.text }; }
  if (!response.ok || payload?.value?.error) {
    const message = payload?.value?.message || payload?.value || `HTTP ${response.status}`;
    throw new Error(`WebDriver ${method} ${pathname}: ${message}`);
  }
  return payload.value;
}

let sessionId = '';
const sessionPath = (suffix = '') => `session/${sessionId}${suffix}`;
const execute = (script, args = []) => webdriver(sessionPath('/execute/sync'), { body: { script, args } });

async function waitForScript(script, timeout = 30000) {
  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) {
    try {
      const value = await execute(script);
      if (value) return value;
    } catch (error) {
      report.errors.push(`poll: ${error.message}`);
    }
    await new Promise((done) => setTimeout(done, 250));
  }
  throw new Error(`Safari condition timed out: ${script.slice(0, 140)}`);
}

const WEB_ELEMENT_KEY = 'element-6066-11e4-a52e-4f735466cecf';

async function clickElement(selector) {
  const element = await webdriver(sessionPath('/element'), { body: { using: 'css selector', value: selector } });
  const id = element?.[WEB_ELEMENT_KEY] || element?.ELEMENT;
  if (!id) throw new Error(`Safari did not resolve element: ${selector}`);
  await webdriver(sessionPath(`/element/${encodeURIComponent(id)}/click`), { body: {} });
}

async function performActions(actions) {
  await webdriver(sessionPath('/actions'), { body: { actions } });
  await webdriver(sessionPath('/actions'), { method: 'DELETE' }).catch(() => {});
}

function finger(id, actions) {
  return { type: 'pointer', id, parameters: { pointerType: 'touch' }, actions };
}

const move = (x, y, duration = 0) => ({ type: 'pointerMove', duration, x: Math.round(x), y: Math.round(y), origin: 'viewport' });
const down = () => ({ type: 'pointerDown', button: 0 });
const up = () => ({ type: 'pointerUp', button: 0 });
const pause = (duration) => ({ type: 'pause', duration });

async function tap(x, y, id = `tap-${Date.now()}`) {
  await performActions([finger(id, [move(x, y), down(), pause(90), up()])]);
}

async function screenshot(path) {
  const encoded = await webdriver(sessionPath('/screenshot'), { method: 'GET' });
  writeFileSync(path, Buffer.from(encoded, 'base64'));
}

let server = null;

try {
  if (!udid) throw new Error('IOS_SIMULATOR_UDID is required');
  if (!platformVersion) throw new Error('IOS_SIMULATOR_PLATFORM_VERSION is required');
  let baseUrl = externalUrl;
  if (!baseUrl) {
    server = await serve({ port: 0 });
    baseUrl = `http://127.0.0.1:${server.address().port}/Q/`;
  }
  await waitForHttp(baseUrl);
  await waitForHttp(new URL('status', appiumUrl));

  const created = await webdriver('session', {
    body: {
      capabilities: {
        alwaysMatch: {
          platformName: 'iOS',
          browserName: 'Safari',
          'appium:automationName': 'XCUITest',
          'appium:deviceName': 'iPhone SE (3rd generation)',
          'appium:udid': udid,
          'appium:platformVersion': platformVersion,
          'appium:noReset': true,
          'appium:newCommandTimeout': 300,
          'appium:safariAllowPopups': true,
          'appium:includeSafariInWebviews': true,
          'appium:simulatorStartupTimeout': 300000,
          'appium:wdaLaunchTimeout': 180000,
          'appium:wdaStartupRetries': 3,
          'appium:wdaStartupRetryInterval': 10000,
          'appium:showXcodeLog': true,
        },
        firstMatch: [{}],
      },
    },
  });
  sessionId = created?.sessionId || '';
  if (!sessionId) {
    const sessions = await webdriver('sessions', { method: 'GET' });
    sessionId = sessions?.at?.(-1)?.id || '';
  }
  if (!sessionId) throw new Error('Appium did not return a session id');

  await webdriver(sessionPath('/orientation'), { body: { orientation: 'LANDSCAPE' } });
  const url = new URL(baseUrl);
  url.searchParams.set('test', '1');
  await webdriver(sessionPath('/url'), { body: { url: url.href } });
  await waitForScript('return Boolean(window.__Q_TEST__);', bootTimeout);
  await execute('window.__Q_TEST__.clear(); localStorage.clear(); return true;');
  await webdriver(sessionPath('/refresh'), { body: {} });
  await waitForScript('return Boolean(window.__Q_TEST__);', bootTimeout);
  await execute(`
    window.__qIosErrors = [];
    window.__qIosEvents = [];
    window.addEventListener('error', function (event) { window.__qIosErrors.push(String(event.message || 'error')); });
    window.addEventListener('unhandledrejection', function (event) { window.__qIosErrors.push(String(event.reason || 'unhandled rejection')); });
    ['move-pad', 'attack', 'dodge', 'canvas'].forEach(function (id) {
      var element = document.getElementById(id);
      element.addEventListener('pointerdown', function (event) {
        var trusted = event.isTrusted;
        var pointerId = event.pointerId;
        queueMicrotask(function () {
          var snapshot = window.__Q_TEST__.snapshot();
          window.__qIosEvents.push({
            id: id,
            trusted: trusted,
            pointerId: pointerId,
            pointerType: event.pointerType,
            attackCooldown: snapshot.interaction.attackCooldown,
            dodgeTimer: snapshot.interaction.dodgeTimer
          });
        });
      });
    });
    return true;
  `);

  report.device = await execute(`
    return {
      viewport: { width: innerWidth, height: innerHeight },
      visualViewport: window.visualViewport ? { width: visualViewport.width, height: visualViewport.height } : null,
      dpr: devicePixelRatio,
      maxTouchPoints: navigator.maxTouchPoints,
      userAgent: navigator.userAgent,
      coarse: matchMedia('(pointer: coarse)').matches,
      landscape: matchMedia('(orientation: landscape)').matches,
      scrollWidth: document.documentElement.scrollWidth
    };
  `);
  check(report.device.viewport.width === 667, 'iPhone SE 3 landscape width', JSON.stringify(report.device.viewport));
  check(report.device.viewport.height >= 300 && report.device.viewport.height <= 375, 'Mobile Safari landscape height', JSON.stringify(report.device.viewport));
  check(report.device.dpr === 2, 'iPhone SE 3 DPR', `dpr=${report.device.dpr}`);
  check(report.device.maxTouchPoints > 0 && report.device.coarse && report.device.landscape, 'real Mobile Safari touch surface is active', JSON.stringify(report.device));
  check(/Safari\//.test(report.device.userAgent) && /Mobile\//.test(report.device.userAgent), 'Mobile Safari user agent is active', report.device.userAgent);
  check(report.device.scrollWidth <= report.device.viewport.width, 'page has no horizontal overflow', `scroll=${report.device.scrollWidth}, viewport=${report.device.viewport.width}`);

  await clickElement('#new-game');
  await waitForScript("return document.getElementById('tutorial').classList.contains('active');", 15000);
  await clickElement('#tutorial-skip');
  await waitForScript("return window.__Q_TEST__.snapshot().status === 'running';", 30000);
  const before = await execute('return window.__Q_TEST__.snapshot();');
  const controls = await execute(`
    function rect(id) {
      var r = document.getElementById(id).getBoundingClientRect();
      return { x:r.x, y:r.y, width:r.width, height:r.height };
    }
    return { pad:rect('move-pad'), attack:rect('attack'), dodge:rect('dodge'), canvas:rect('canvas') };
  `);
  const padStart = { x: controls.pad.x + controls.pad.width / 2, y: controls.pad.y + controls.pad.height / 2 };
  const padEnd = { x: padStart.x, y: controls.pad.y + controls.pad.height * 0.12 };
  const attackPoint = { x: controls.attack.x + controls.attack.width / 2, y: controls.attack.y + controls.attack.height / 2 };
  await performActions([
    finger('move-thumb', [
      move(padStart.x, padStart.y), down(), move(padEnd.x, padEnd.y, 250), pause(0), pause(90), pause(510), up(),
    ]),
    finger('attack-thumb', [
      pause(0), pause(0), pause(250), move(attackPoint.x, attackPoint.y), down(), pause(90), up(),
    ]),
  ]);
  const afterMove = await execute('return window.__Q_TEST__.snapshot();');
  const eventsAfterAttack = await execute('return window.__qIosEvents.slice();');
  const moved = Math.hypot(afterMove.x - before.x, afterMove.z - before.z);
  const moveEvent = eventsAfterAttack.find((event) => event.id === 'move-pad' && event.trusted);
  const attackEvent = eventsAfterAttack.find((event) => event.id === 'attack' && event.trusted && event.attackCooldown > 0);
  check(moved > 0.1, 'trusted touch pad moves the player', `distance=${moved.toFixed(3)}`);
  check(Boolean(moveEvent && attackEvent && moveEvent.pointerId !== attackEvent.pointerId), 'two trusted fingers move and attack together', JSON.stringify(eventsAfterAttack));
  check(afterMove.interaction.moveX === 0 && afterMove.interaction.moveY === 0, 'touch release clears movement', JSON.stringify(afterMove.interaction));

  const dodgePoint = { x: controls.dodge.x + controls.dodge.width / 2, y: controls.dodge.y + controls.dodge.height / 2 };
  const staminaBefore = afterMove.stamina;
  await tap(dodgePoint.x, dodgePoint.y, 'dodge-thumb');
  const afterDodge = await execute('return window.__Q_TEST__.snapshot();');
  const eventsAfterDodge = await execute('return window.__qIosEvents.slice();');
  const dodgeEvent = eventsAfterDodge.find((event) => event.id === 'dodge' && event.trusted && event.dodgeTimer > 0);
  check(Boolean(dodgeEvent) && afterDodge.stamina < staminaBefore, 'trusted dodge consumes stamina', JSON.stringify({ event: dodgeEvent, before: staminaBefore, after: afterDodge.stamina }));

  const cameraBefore = afterDodge.interaction.cameraYaw;
  const cameraStart = { x: controls.canvas.x + controls.canvas.width * 0.55, y: controls.canvas.y + controls.canvas.height * 0.42 };
  const cameraEnd = { x: controls.canvas.x + controls.canvas.width * 0.72, y: controls.canvas.y + controls.canvas.height * 0.30 };
  await performActions([finger('camera-thumb', [move(cameraStart.x, cameraStart.y), down(), move(cameraEnd.x, cameraEnd.y, 450), up()])]);
  const afterCamera = await execute('return window.__Q_TEST__.snapshot();');
  const cameraDelta = Math.abs(afterCamera.interaction.cameraYaw - cameraBefore);
  const cameraEvent = (await execute('return window.__qIosEvents.slice();')).find((event) => event.id === 'canvas' && event.trusted);
  check(Boolean(cameraEvent) && cameraDelta > 0.02, 'trusted right-thumb drag moves the camera', JSON.stringify({ cameraDelta, event: cameraEvent }));

  await clickElement('#pause');
  await waitForScript("return window.__Q_TEST__.snapshot().status === 'paused';", 15000);
  await screenshot(pausePath);
  await clickElement('#resume');
  await waitForScript("return window.__Q_TEST__.snapshot().status === 'running';", 15000);
  check(true, 'pause and resume work through visible Safari controls', 'paused then running');

  await clickElement('#pause');
  await waitForScript("return window.__Q_TEST__.snapshot().status === 'paused';", 15000);
  const saved = await execute('var s=window.__Q_TEST__.snapshot(); return {x:s.x,z:s.z,hasSave:localStorage.length>0};');
  await webdriver(sessionPath('/refresh'), { body: {} });
  await waitForScript('return Boolean(window.__Q_TEST__);', bootTimeout);
  const continueVisible = await execute("return !document.getElementById('continue').classList.contains('hidden');");
  await clickElement('#continue');
  await waitForScript("return window.__Q_TEST__.snapshot().status === 'running';", 30000);
  const restored = await execute('return window.__Q_TEST__.snapshot();');
  report.persistence = { saved, continueVisible, restored: { x: restored.x, z: restored.z, status: restored.status } };
  check(saved.hasSave && continueVisible, 'Safari reload exposes the saved journey', JSON.stringify(report.persistence));
  check(Math.hypot(restored.x - saved.x, restored.z - saved.z) < 0.3, 'Safari reload restores the saved position', JSON.stringify(report.persistence));

  await execute('window.__Q_TEST__.tick(8); return true;');
  const soak = await execute('return window.__Q_TEST__.snapshot();');
  check(soak.status === 'running' && [soak.x, soak.z, soak.health, soak.stamina].every(Number.isFinite), 'Safari automated play retains finite state', JSON.stringify({ status: soak.status, x: soak.x, z: soak.z, health: soak.health, stamina: soak.stamina }));
  check(soak.metrics.drawCalls > 0 && soak.metrics.drawCalls <= 170, 'Safari draw-call budget holds', `drawCalls=${soak.metrics.drawCalls}`);
  check(soak.metrics.triangles > 0 && soak.metrics.triangles <= 170000, 'Safari triangle budget holds', `triangles=${soak.metrics.triangles}`);
  await screenshot(gameplayPath);
  const runtimeErrors = await execute('return window.__qIosErrors || [];');
  check(runtimeErrors.length === 0, 'no Safari runtime errors', JSON.stringify(runtimeErrors));
  report.interaction = { moved, staminaBefore, staminaAfter: afterDodge.stamina, cameraDelta, events: await execute('return window.__qIosEvents || [];') };
} catch (error) {
  report.failures.push(error.stack || error.message || String(error));
} finally {
  if (sessionId) await webdriver(sessionPath(), { method: 'DELETE' }).catch((error) => report.errors.push(`session cleanup: ${error.message}`));
  if (server) await new Promise((done) => server.close(done));
  report.status = report.failures.length ? 'failed' : 'passed';
  writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);
}

console.log(`[q-ios-safari] ${report.status.toUpperCase()}: ${report.failures.length} failure(s)`);
for (const failure of report.failures) console.error(`- ${failure}`);
if (report.failures.length) process.exit(1);
