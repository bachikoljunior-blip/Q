import {
  CONSEQUENCE_CHOICES,
  GUARDIANS,
  WORLD_HALF,
  WORLD_POINTS,
  WORLD_SIZE,
  formatTime,
  endingFor,
  newGame,
  objectiveFor,
  playerStats,
  questText,
  regionAt,
  riverCenter
} from './core.js';
import { Game } from './game.js';
import { Sound } from './audio.js';
import { load, reset, save as store } from './storage.js';

const $ = selector => document.querySelector(selector);
const screens = [...document.querySelectorAll('.screen')];
const canvas = $('#canvas');
const hud = $('#hud');
const controls = $('#touch-controls');
let data = load();
let lastHud = null;
let toastTimer = 0;
let resetTimer = 0;
let tutorialStep = 0;
let settingsReturn = 'menu';

function show(id = '') {
  for (const screen of screens) screen.classList.toggle('active', screen.id === id);
}

function gameUi(visible, allowControls = visible) {
  hud.classList.toggle('hidden', !visible);
  hud.setAttribute('aria-hidden', String(!visible));
  controls.classList.toggle('hidden', !allowControls);
  controls.setAttribute('aria-hidden', String(!allowControls));
}

function toast(message, duration = 1700) {
  clearTimeout(toastTimer);
  const element = $('#toast');
  element.textContent = message;
  element.classList.add('show');
  toastTimer = setTimeout(() => element.classList.remove('show'), duration);
}

function vibrate(pattern) {
  if (!data.settings.vibration) return;
  try { navigator.vibrate?.(pattern); } catch {}
}

const sound = new Sound(() => data.settings);
const game = new Game(canvas, {
  sound,
  settings: () => data.settings,
  callbacks: {
    status(status, reason) {
      if (status === 'running') { show(); gameUi(true, true); }
      if (status === 'idle') gameUi(false, false);
      if (status === 'paused') { show('paused'); gameUi(true, false); if (reason === 'orientation') toast('横向きに戻すと再開できます'); }
      if (status === 'camp') { renderCamp(); show('camp'); gameUi(true, false); }
    },
    hud: updateHud,
    toast,
    dialogue({ speaker, text, choices = [] }) {
      $('#speaker').textContent = speaker;
      $('#dialogue-text').textContent = text;
      const portrait = $('#dialogue-portrait');
      const portraitKey = /ミラ/.test(speaker) ? 'mira' : /オリン/.test(speaker) ? 'orin' : /イリヤ|空環|守印|の印|記憶/.test(speaker) ? 'ilya' : '';
      portrait.className = `dialogue-portrait ${portraitKey || 'hidden'}`;
      $('#dialogue-box').classList.toggle('has-portrait', Boolean(portraitKey));
      const choiceBox = $('#dialogue-choices');
      const close = $('#dialogue-close');
      choiceBox.replaceChildren();
      choiceBox.classList.toggle('hidden', choices.length === 0);
      close.classList.toggle('hidden', choices.length > 0);
      for (const option of choices) {
        const button = document.createElement('button');
        button.className = 'dialogue-choice';
        const label = document.createElement('b');
        const detail = document.createElement('small');
        label.textContent = option.label;
        detail.textContent = option.detail;
        button.append(label, detail);
        button.addEventListener('click', () => {
          if (game.chooseDialogue(option.id)) vibrate([14, 28, 14]);
        });
        choiceBox.append(button);
      }
      show('dialogue');
      gameUi(true, false);
      vibrate(12);
    },
    ending(snapshot) {
      const ending = snapshot.ending || endingFor(snapshot);
      const versions = {
        wild: { kicker: 'THE VALLEY UNBOUND', title: '季節は、谷へ還った。', lead: 'イリヤの長い役目は終わり、三つの印は人の手を離れた。嵐も渇きも戻る。それでも里は、守られるだけでなく自ら直す朝を選んだ。' },
        bastion: { kicker: 'THE KEEPERS’ DAWN', title: '灯は、消えなかった。', lead: 'あなたはイリヤの犠牲を終わらせ、その力を里の結界へ編み直した。人々は安全な朝を迎えたが、谷の遠い場所にはまだ静けさが残る。' },
        covenant: { kicker: 'A NEW COVENANT', title: '守ることと、返すこと。', lead: 'すべてを解くことも、すべてを縛ることも選ばなかった。里は受け取った力の代償を知り、自由になった大地の危うさを自分たちで支えると誓った。' }
      };
      const version = versions[ending] || versions.covenant;
      const memories = Object.entries(snapshot.choices || {}).map(([point, id]) => CONSEQUENCE_CHOICES[point]?.[id]?.ending).filter(Boolean).join(' ');
      const miraCoda = snapshot.choices?.grove === 'wild_bloom' ? 'ミラは倒れた柵の外に若木を植え、父の決断を責めるだけだった自分と向き合った。' : 'ミラは里の護りを見張りながら、守る力そのものではなく、使い続ける人を疑うべきだと学んだ。';
      const orinCoda = snapshot.choices?.marsh === 'ring_release' ? 'オリンは空になった水路を人の手で掘り直した。' : 'オリンは満ちた水門を毎日開き、霧に残した名を忘れないと決めた。';
      $('#ending-kicker').textContent = version.kicker;
      $('#ending-title').textContent = version.title;
      $('#ending-copy').textContent = `${version.lead} ${memories} ${miraCoda} ${orinCoda} イリヤの残響は、谷の答えを一人で背負う時代が終わるのを見届けた。あなたの選択は景色と人々の暮らしに残り続ける。`;
      show('ending');
      gameUi(false, false);
      vibrate([30, 40, 30, 40, 90]);
    },
    death() { show('dead'); gameUi(false, false); vibrate([70, 40, 100]); },
    save(progress) {
      data.progress = progress;
      data.progress.started = true;
      persist();
    },
    discovery(point) { toast(`新しい場所：${point.label}`, 2400); vibrate([12, 35, 12]); },
    quality(level) { toast(level ? '描画負荷を自動調整しました' : '省電力描画へ切り替えました'); },
    fatal(message) { $('#fatal-copy').textContent = message; show('fatal'); gameUi(false, false); }
  }
});

game.bindControls({ pad: $('#move-pad'), knob: $('#move-knob'), attack: $('#attack'), dodge: $('#dodge'), interact: $('#interact') });

function persist() {
  data = store(data);
  refreshMenu();
}

function refreshMenu() {
  const hasJourney = Boolean(data.progress.started);
  $('#continue').classList.toggle('hidden', !hasJourney);
  $('#continue-place').textContent = hasJourney ? `${regionAt(data.progress.x, data.progress.z)}から` : '';
  $('#sound').checked = data.settings.sound;
  $('#vibration').checked = data.settings.vibration;
  $('#reduced').checked = data.settings.reduced;
  $('#quality').value = data.settings.quality;
  document.documentElement.classList.toggle('reduce-motion', data.settings.reduced);
}

async function beginJourney(fresh = false) {
  await sound.unlock();
  if (fresh) data = newGame(data);
  if (fresh && !data.tutorial) {
    tutorialStep = 0;
    renderTutorial();
    show('tutorial');
    gameUi(false, false);
    return;
  }
  startWorld();
}

function startWorld() {
  data.progress.started = true;
  const stats = playerStats(data.progress);
  data.progress.health = Math.max(1, Math.min(data.progress.health, stats.maxHealth));
  persist();
  game.start(data.progress);
  vibrate(10);
}

function returnToMenu() {
  game.stop();
  refreshMenu();
  show('menu');
  gameUi(false, false);
}

const tutorials = [
  ['01 / 04', '谷を歩く', '左のパッドで移動します。画面の何もない場所をドラッグすると、カメラを自由に回せます。'],
  ['02 / 04', '剣と回避', '「攻撃」で近くの敵へ剣を振ります。「回避」は気力を使いますが、短い間だけ攻撃をすり抜けられます。'],
  ['03 / 04', '人と大地を調べる', '人、篝火、草花、遺跡へ近づいたら「調べる」。回復、採集、会話、強化ができます。'],
  ['04 / 04', '自分の道を選ぶ', '金色の光は物語の目的地です。地図を頼りに、森、湿原、雪峰、海岸を好きな順で旅してください。']
];

function renderTutorial() {
  const page = tutorials[tutorialStep];
  $('#tutorial-count').textContent = page[0];
  $('#tutorial-title').textContent = page[1];
  $('#tutorial-copy').textContent = page[2];
  $('#tutorial-next').textContent = tutorialStep === tutorials.length - 1 ? '谷へ出る' : '次へ';
}

function finishTutorial() {
  data.tutorial = true;
  persist();
  startWorld();
}

function updateHud(snapshot) {
  lastHud = snapshot;
  const healthRatio = Math.max(0, snapshot.health / snapshot.maxHealth);
  const staminaRatio = Math.max(0, snapshot.stamina / snapshot.maxStamina);
  $('#health').style.transform = `scaleX(${healthRatio})`;
  $('#stamina').style.transform = `scaleX(${staminaRatio})`;
  $('#health-value').textContent = `${Math.ceil(snapshot.health)} / ${snapshot.maxHealth}`;
  $('#level').textContent = snapshot.level;
  $('#region').textContent = snapshot.region;
  $('#quest-title').textContent = snapshot.quest.title;
  $('#quest-detail').textContent = snapshot.quest.detail;
  $('#quest-step').textContent = snapshot.quest.step;
  $('#objective-distance').textContent = `${snapshot.objectiveDistance}m`;
  $('#coins').textContent = snapshot.coins;
  $('#herbs').textContent = snapshot.herbs;
  $('#crystals').textContent = snapshot.crystals;
  $('#boss').classList.toggle('hidden', !snapshot.boss);
  if (snapshot.boss) {
    $('#boss-name').textContent = snapshot.boss.name;
    $('#boss-health').style.transform = `scaleX(${snapshot.boss.health})`;
  }
  $('#interact').classList.toggle('hidden', !snapshot.interact);
  const hint = $('#interact-hint');
  hint.textContent = snapshot.interact ? `${snapshot.interact}を調べる` : '';
  hint.classList.toggle('show', Boolean(snapshot.interact));
  hud.style.boxShadow = snapshot.hitFlash > 0 ? `inset 0 0 75px rgba(159,28,22,${Math.min(.46, snapshot.hitFlash)})` : '';
  drawMap($('#minimap'), snapshot, false);
}

function drawMap(target, snapshot = lastHud, full = true) {
  if (!snapshot) return;
  const context = target.getContext('2d');
  if (!context) return;
  const width = target.width, height = target.height;
  const mapX = x => (x + WORLD_HALF) / WORLD_SIZE * width;
  const mapY = z => (z + WORLD_HALF) / WORLD_SIZE * height;
  context.clearRect(0, 0, width, height);
  const gradient = context.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, '#334d3a');
  gradient.addColorStop(.52, '#65805a');
  gradient.addColorStop(1, '#7a7656');
  context.fillStyle = gradient;
  context.fillRect(0, 0, width, height);
  context.fillStyle = '#526e72';
  context.fillRect(0, mapY(590), width, height - mapY(590));
  context.strokeStyle = '#71979a';
  context.lineWidth = full ? 14 : 3;
  context.beginPath();
  for (let i = 0; i <= 45; i += 1) {
    const x = -WORLD_HALF + i / 45 * WORLD_SIZE;
    const y = riverCenter(x);
    if (!i) context.moveTo(mapX(x), mapY(y)); else context.lineTo(mapX(x), mapY(y));
  }
  context.stroke();
  const objective = objectiveFor(data.progress);
  for (const point of WORLD_POINTS) {
    if (!snapshot.discovered.includes(point.id) && point.id !== objective.id) continue;
    const x = mapX(point.x), y = mapY(point.z);
    context.fillStyle = point.id === objective.id ? '#f4ce64' : '#b8d0a7';
    context.beginPath();
    context.arc(x, y, full ? 7 : 2.5, 0, Math.PI * 2);
    context.fill();
    if (full && snapshot.discovered.includes(point.id)) {
      context.font = '700 14px system-ui';
      context.fillStyle = '#f3ead0';
      context.fillText(point.label, x + 11, y + 5);
    }
  }
  const objectiveX = mapX(objective.x), objectiveY = mapY(objective.z);
  context.strokeStyle = '#ffe289';
  context.lineWidth = full ? 3 : 1;
  context.beginPath();
  context.arc(objectiveX, objectiveY, full ? 14 : 5, 0, Math.PI * 2);
  context.stroke();
  const playerX = mapX(snapshot.x), playerY = mapY(snapshot.z);
  context.save();
  context.translate(playerX, playerY);
  context.rotate(-snapshot.yaw);
  context.fillStyle = '#ffffff';
  context.beginPath();
  context.moveTo(0, full ? -12 : -5);
  context.lineTo(full ? 8 : 3, full ? 9 : 4);
  context.lineTo(0, full ? 5 : 2);
  context.lineTo(full ? -8 : -3, full ? 9 : 4);
  context.closePath();
  context.fill();
  context.restore();
  if (!full) {
    context.strokeStyle = 'rgba(255,255,255,.33)';
    context.lineWidth = 2;
    context.strokeRect(1, 1, width - 2, height - 2);
  }
}

function openMap() {
  if (game.status === 'running') game.pause('map');
  show('map-screen');
  gameUi(true, false);
  drawMap($('#world-map'), game.testSnapshot(), true);
}

function renderJournal() {
  const progress = data.progress;
  const stats = playerStats(progress);
  const quest = questText(progress);
  const sigils = GUARDIANS.map(guardian => `<i class="${progress.sigils.includes(guardian.id) ? 'owned' : ''}" title="${guardian.sigil}">${progress.sigils.includes(guardian.id) ? '✦' : '·'}</i>`).join('');
  const choiceCards = Object.entries(CONSEQUENCE_CHOICES).map(([point, options]) => {
    const choice = options[progress.choices?.[point]];
    const labels = { grove: '森の行方', marsh: '水の行方', peak: '風の行方' };
    return choice ? `<section class="journal-card"><h3>${labels[point]} — ${choice.label}</h3><p>${choice.journal}</p></section>` : '';
  }).join('');
  const characterCards = [
    progress.npcFlags?.groveReport ? `<section class="journal-card"><h3>ミラ — 森のあとで</h3><p>${progress.choices.grove === 'wild_bloom' ? '自由にした森を支えるのは、残された人々だと知った。倒れた柵の外で若木を見張っている。' : '守る選択にも変わる余地があると認め、里へ分けた森の力を見張っている。'}</p></section>` : '',
    progress.npcFlags?.marshReport ? `<section class="journal-card"><h3>オリン — 水のあとで</h3><p>${progress.choices.marsh === 'ring_release' ? '失った水路を数えるのではなく、自分の手で掘り直し始めた。' : '水門が守る暮らしと、霧に残した声の両方を毎日確かめている。'}</p></section>` : '',
    progress.npcFlags?.ilyaTruth ? '<section class="journal-card"><h3>イリヤ — 残された声</h3><p>十二年前の結界は答えではなく、次の世代へ決断を送るための時間だった。神殿には彼ではなく、止まり続ける古い命令がいる。</p></section>' : ''
  ].join('');
  $('#journal-content').innerHTML = `
    <section class="journal-card"><h3>${quest.title}</h3><p>${quest.detail}<br><b>${quest.step}</b></p><div class="sigil-row">${sigils}</div></section>
    <section class="journal-card"><h3>旅人の力</h3><p>レベル ${progress.level}<br>生命 ${stats.maxHealth} · 攻撃 ${Math.round(stats.power)} · 気力 ${stats.maxStamina}<br>次の成長まで ${Math.max(0, 85 + (progress.level - 1) * 55 - progress.xp)} XP</p></section>
    <section class="journal-card"><h3>見つけたもの</h3><p>場所 ${progress.discovered.length} / ${WORLD_POINTS.length}<br>月露草 ${progress.herbs} · 青脈晶 ${progress.crystals}<br>木の葉貨 ${progress.coins}</p></section>
    <section class="journal-card"><h3>旅の時間</h3><p>${formatTime(progress.playTime)}<br>生命 LV.${progress.upgrades.vigor} · 剣 LV.${progress.upgrades.edge} · 足運び LV.${progress.upgrades.stride}</p></section>
    ${choiceCards}${characterCards}`;
}

function renderCamp() {
  const labels = {
    vigor: ['生命の器', '最大生命力 +22'],
    edge: ['研がれた刃', '攻撃力 +5'],
    stride: ['風の足運び', '移動・最大気力を強化']
  };
  const box = $('#upgrade-list');
  box.replaceChildren();
  for (const [kind, label] of Object.entries(labels)) {
    const level = data.progress.upgrades[kind];
    const crystalCost = level + 1;
    const coinCost = 25 + level * 25;
    const button = document.createElement('button');
    button.className = 'upgrade-card';
    button.disabled = level >= 5;
    button.innerHTML = `<b>${label[0]}　LV.${level}</b><span>${label[1]}</span><small>${level >= 5 ? '最大強化' : `青脈晶 ${crystalCost} / 木の葉貨 ${coinCost}`}</small>`;
    button.addEventListener('click', () => {
      const result = game.upgrade(kind);
      if (!result.ok) toast(result.reason === 'max' ? 'これ以上は強化できません' : '素材か木の葉貨が足りません');
      else { data.progress = structuredClone(game.progress); persist(); toast(`${label[0]}を LV.${result.level} に強化`); vibrate([12, 30, 12]); renderCamp(); updateHud(game.snapshotHud()); }
    });
    box.append(button);
  }
}

function openSettings(returnTo) {
  settingsReturn = returnTo;
  refreshMenu();
  show('settings-panel');
  gameUi(returnTo !== 'menu', false);
}

$('#new-game').addEventListener('click', () => beginJourney(true));
$('#continue').addEventListener('click', () => beginJourney(false));
$('#help').addEventListener('click', () => show('help-panel'));
$('#settings').addEventListener('click', () => openSettings('menu'));
$('#pause-settings').addEventListener('click', () => openSettings('paused'));
$('#pause').addEventListener('click', () => game.pause('user'));
$('#resume').addEventListener('click', () => game.resume());
$('#to-menu').addEventListener('click', returnToMenu);
$('#quick-map').addEventListener('click', openMap);
$('#open-map').addEventListener('click', openMap);
$('#open-journal').addEventListener('click', () => { renderJournal(); show('journal'); gameUi(true, false); });
for (const button of document.querySelectorAll('[data-back]')) button.addEventListener('click', () => { show(button.dataset.back); gameUi(button.dataset.back !== 'menu', false); });
$('#dialogue-close').addEventListener('click', () => game.resume());
$('#camp-close').addEventListener('click', () => game.resume());
$('#respawn').addEventListener('click', () => game.respawn());
$('#death-menu').addEventListener('click', returnToMenu);
$('#free-roam').addEventListener('click', () => game.resume());
$('#ending-menu').addEventListener('click', returnToMenu);
$('#tutorial-next').addEventListener('click', () => {
  sound.event('ui');
  if (tutorialStep < tutorials.length - 1) { tutorialStep += 1; renderTutorial(); }
  else finishTutorial();
});
$('#tutorial-skip').addEventListener('click', finishTutorial);

$('#sound').addEventListener('change', async event => {
  data.settings.sound = event.target.checked;
  persist();
  sound.setEnabled(event.target.checked);
  if (event.target.checked) { await sound.unlock(); sound.event('ui'); }
});
$('#vibration').addEventListener('change', event => { data.settings.vibration = event.target.checked; persist(); vibrate(15); });
$('#reduced').addEventListener('change', event => { data.settings.reduced = event.target.checked; persist(); });
$('#quality').addEventListener('change', event => { data.settings.quality = event.target.value; persist(); game.setQuality(event.target.value); });
for (const button of document.querySelectorAll('[data-settings-close]')) button.addEventListener('click', () => { show(settingsReturn); gameUi(settingsReturn !== 'menu', false); });
$('#reset').addEventListener('click', event => {
  const button = event.currentTarget;
  if (!button.dataset.ready) {
    button.dataset.ready = '1';
    button.textContent = 'もう一度押すと全データを消去';
    clearTimeout(resetTimer);
    resetTimer = setTimeout(() => { delete button.dataset.ready; button.textContent = 'セーブデータをリセット'; }, 3500);
    return;
  }
  clearTimeout(resetTimer);
  game.stop();
  data = reset();
  persist();
  delete button.dataset.ready;
  button.textContent = 'セーブデータをリセット';
  settingsReturn = 'menu';
  show('menu');
  gameUi(false, false);
  toast('セーブデータをリセットしました');
});

document.addEventListener('visibilitychange', () => { if (document.hidden) game.pause('visibility'); });
globalThis.addEventListener('pagehide', () => { if (game.status === 'running') game.pause('pagehide'); });
document.addEventListener('gesturestart', event => event.preventDefault(), { passive: false });
document.addEventListener('dblclick', event => { if (event.target === canvas) event.preventDefault(); }, { passive: false });
globalThis.addEventListener('error', event => { console.error(event.error || event.message); if (game.status === 'running') { game.pause('error'); toast('予期しないエラーのため一時停止しました', 3500); } });
globalThis.addEventListener('unhandledrejection', event => console.error(event.reason));

if ('serviceWorker' in navigator && location.protocol.startsWith('http')) globalThis.addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(error => console.warn('offline unavailable', error)));

const localTest = ['localhost', '127.0.0.1', '[::1]'].includes(location.hostname) && new URLSearchParams(location.search).get('test') === '1';
if (localTest) Object.defineProperty(globalThis, '__Q_TEST__', { value: Object.freeze({
  startNew() { data = newGame(data); data.tutorial = true; startWorld(); },
  snapshot: () => game.testSnapshot(),
  enemy: id => game.testEnemy(id),
  teleport: (x, z) => game.testTeleport(x, z),
  interact: () => game.interact(),
  choose: id => game.chooseDialogue(id),
  defeat: id => game.testDefeat(id),
  tick: seconds => game.testTick(seconds),
  attack: () => game.attack(),
  dodge: () => game.dodge(),
  grant(resources = {}) {
    for (const key of ['coins', 'herbs', 'crystals']) if (Number.isFinite(Number(resources[key]))) game.progress[key] = Math.max(0, Math.floor(Number(resources[key])));
    game.checkpoint('test-injection');
    updateHud(game.snapshotHud());
  },
  damage(amount = 999) { game.hurt(Number(amount) || 999, { x: game.player.position.x + 1, z: game.player.position.z }); },
  pause: () => game.pause('test'),
  resume: () => game.resume(),
  respawn: () => game.respawn(),
  upgrade: kind => game.upgrade(kind),
  clear() { game.stop(); data = reset(); refreshMenu(); show('menu'); gameUi(false, false); }
}) });

refreshMenu();
gameUi(false, false);
show(game.rendererFailed ? 'fatal' : 'menu');
