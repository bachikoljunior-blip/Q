import * as THREE from '../vendor/three.module.js';
import {
  CONSEQUENCE_CHOICES,
  GUARDIANS,
  WATER_LEVEL,
  WORLD_HALF,
  WORLD_POINTS,
  canEnterCrown,
  clamp,
  distance2D,
  endingFor,
  grantExperience,
  herbHealingFor,
  objectiveFor,
  playerStats,
  questText,
  regionAt,
  respawnCoinLossFor,
  terrainHeight,
  xpForLevel
} from './core.js';
import { World } from './world.js';

const STEP = 1 / 60;
const TAU = Math.PI * 2;
const v3 = new THREE.Vector3();
const targetV = new THREE.Vector3();

const ENEMY_SPAWNS = Object.freeze([
  { id: 'mossfang_1', name: '苔牙', type: 'beast', x: -185, z: 52, hp: 42, power: 9, xp: 24, coins: 7 },
  { id: 'mossfang_2', name: '苔牙', type: 'beast', x: -248, z: -52, hp: 42, power: 9, xp: 24, coins: 7 },
  { id: 'mossfang_3', name: '苔牙', type: 'beast', x: -310, z: -165, hp: 48, power: 10, xp: 27, coins: 8 },
  { id: 'reedshade_1', name: '葦影', type: 'stalker', x: -430, z: 245, hp: 52, power: 11, xp: 31, coins: 9 },
  { id: 'reedshade_2', name: '葦影', type: 'stalker', x: -605, z: 355, hp: 52, power: 11, xp: 31, coins: 9 },
  { id: 'stonewing_1', name: '岩羽', type: 'sentinel', x: 390, z: -310, hp: 62, power: 13, xp: 38, coins: 12 },
  { id: 'stonewing_2', name: '岩羽', type: 'sentinel', x: 575, z: -360, hp: 62, power: 13, xp: 38, coins: 12 },
  { id: 'tidebound_1', name: '潮骸', type: 'sentinel', x: 460, z: 390, hp: 68, power: 14, xp: 42, coins: 14 },
  { id: 'rootling_1', name: '根喰い', type: 'beast', x: 325, z: 115, hp: 58, power: 12, xp: 34, coins: 10 },
  { id: 'grove_warden', name: '苔角の守り手', type: 'warden', x: -410, z: -245, hp: 245, power: 17, xp: 145, coins: 48, guardian: true },
  { id: 'marsh_warden', name: '沼影の獣', type: 'stalker', x: -520, z: 310, hp: 275, power: 18, xp: 165, coins: 52, guardian: true },
  { id: 'peak_warden', name: '白嶺の番人', type: 'sentinel', x: 500, z: -420, hp: 315, power: 20, xp: 190, coins: 58, guardian: true },
  { id: 'crown_warden', name: '初代守印・イリヤ', type: 'crown', x: 0, z: -675, hp: 520, power: 24, xp: 320, coins: 120, final: true }
]);

const CONSEQUENCES = Object.freeze({
  grove_warden: {
    point: 'grove',
    title: '森の印 — 誰のために芽吹くか',
    prompt: '苔角が崩れ、父イリヤの記憶が流れ込む。「私は森を奪ったのではない。嵐の夜、里を守るため借りた」。ミラは印を大地へ返せと言い、オリンは次の嵐に備えて力を残せと言った。',
    options: [
      { id: 'wild_bloom', result: '枯れていた枝から新芽が開いた。その夜、里の古い防風柵が一本倒れた。自由には、守る手が要る。' },
      { id: 'haven_ward', result: '腕輪に森の脈動が宿り、里の柵へ緑の光が走った。背後で古樹の葉が一枚、静かに落ちた。' }
    ]
  },
  marsh_warden: {
    point: 'marsh',
    title: '水の印 — 鐘を鳴らすか',
    prompt: '水底の鐘には、洪水で失われた人々の名が刻まれていた。鳴らせば湿原の水は海へ戻るが、低地の旧道は二度と使えない。閉じれば里の水門は満ち、記憶は霧に残る。',
    options: [
      { id: 'ring_release', result: '鐘は一度だけ鳴った。霧が割れ、湿原に星空が映る。里では井戸が浅くなり、オリンが新しい水路を掘り始めた。' },
      { id: 'water_ward', result: '水門の紋が青く灯り、里の井戸が満ちた。湿原では、誰も触れていない鐘の音が夜ごと遠く響いた。' }
    ]
  },
  peak_warden: {
    point: 'peak',
    title: '風の印 — 嵐を恐れるか',
    prompt: '祭壇で最後の記憶がほどける。イリヤは空環の核に自ら残り、三つの印を抱えて嵐を止め続けていた。風を放てば彼の役目は終わる。束ねれば、その犠牲をあなたが継ぐ。',
    options: [
      { id: 'wind_release', result: '雲が裂け、何年ぶりかの強い風が谷を走った。ミラは笑い、里の者たちは屋根を押さえながら空を見上げた。' },
      { id: 'wind_ward', result: '風は腕輪の中で静まった。里の灯は揺れず、遠い峰の雲だけが出口を探すように渦巻いた。' }
    ]
  }
});

const ENEMY_BEHAVIORS = Object.freeze({
  beast: Object.freeze({ activation: 55, speed: 10.2, attackRange: 5.2, windup: .48, active: .2, recovery: .68, lunge: 21, damage: 1 }),
  stalker: Object.freeze({ activation: 64, speed: 12.4, attackRange: 6.4, windup: .7, active: .26, recovery: .56, lunge: 25, damage: .92, circle: true }),
  sentinel: Object.freeze({ activation: 68, speed: 7.4, attackRange: 7.2, windup: 1.05, active: .34, recovery: 1.08, lunge: 10, damage: 1.28 }),
  warden: Object.freeze({ activation: 88, speed: 9.2, attackRange: 7.6, windup: .82, active: .3, recovery: .82, lunge: 17, damage: 1.08 }),
  crown: Object.freeze({ activation: 98, speed: 8.1, attackRange: 9.2, windup: 1.18, active: .42, recovery: .92, lunge: 14, damage: 1.35 })
});

const emptyCallbacks = {
  status() {}, hud() {}, toast() {}, dialogue() {}, choice() {}, ending() {}, death() {}, save() {}, discovery() {}, quality() {}, fatal() {}
};

function makeSurface(color, emissive = 0) {
  return new THREE.MeshStandardMaterial({ color, roughness: .82, metalness: .04, emissive, emissiveIntensity: emissive ? .45 : 0 });
}

function addPart(parent, geometry, surface, x, y, z, scale = 1) {
  const mesh = new THREE.Mesh(geometry, surface);
  mesh.position.set(x, y, z);
  mesh.scale.setScalar(scale);
  parent.add(mesh);
  return mesh;
}

function approachAngle(current, target, amount) {
  let delta = (target - current + Math.PI) % TAU - Math.PI;
  if (delta < -Math.PI) delta += TAU;
  return current + clamp(delta, -amount, amount);
}

function createNullRenderer(canvas) {
  return {
    domElement: canvas,
    pixelRatio: 1,
    setPixelRatio(value) { this.pixelRatio = value; },
    setSize(width, height) {
      canvas.width = Math.max(1, Math.round(width * this.pixelRatio));
      canvas.height = Math.max(1, Math.round(height * this.pixelRatio));
    },
    render() {}, dispose() {}
  };
}

export class Game {
  constructor(canvas, { sound, settings = () => ({}), callbacks = {} } = {}) {
    this.canvas = canvas;
    this.sound = sound;
    this.settings = settings;
    this.cb = { ...emptyCallbacks, ...callbacks };
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x8ca5a1);
    this.scene.fog = new THREE.FogExp2(0x8ca5a1, .00275);
    this.camera = new THREE.PerspectiveCamera(58, 1, .1, 760);
    this.renderer = this.createRenderer();
    this.quality = this.resolveQuality();
    this.world = new World(this.scene, this.quality);
    this.player = this.createPlayer();
    this.enemyRoot = new THREE.Group();
    this.scene.add(this.enemyRoot);
    this.enemies = [];
    this.progress = null;
    this.status = 'idle';
    this.input = { x: 0, y: 0, keys: new Set(), padPointer: null, lookPointer: null };
    this.cameraYaw = Math.PI;
    this.cameraPitch = .33;
    this.stamina = 100;
    this.attackTimer = 0;
    this.attackCooldown = 0;
    this.attackHit = false;
    this.dodgeTimer = 0;
    this.invulnerable = 0;
    this.hitFlash = 0;
    this.velocity = new THREE.Vector3();
    this.dodgeDirection = new THREE.Vector3(0, 0, -1);
    this.clock = 0;
    this.day = .29;
    this.saveTimer = 0;
    this.hudTimer = 0;
    this.samples = [];
    this.accumulator = 0;
    this.lastFrame = 0;
    this.frameHandle = 0;
    this.nearby = null;
    this.pendingChoice = null;
    this.disposed = false;
    this.bound = [];
    this.createEffects();
    this.bindLifecycle();
    this.resize();
    this.frame = this.frame.bind(this);
    this.frameHandle = requestAnimationFrame(this.frame);
  }

  createRenderer() {
    if (globalThis.__Q_HEADLESS__) return createNullRenderer(this.canvas);
    try {
      const renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true, powerPreference: 'high-performance' });
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.04;
      return renderer;
    } catch (error) {
      this.rendererFailed = true;
      this.cb?.fatal?.('この端末では3D描画を開始できません。ブラウザを更新して再読み込みしてください。');
      console.error(error);
      return createNullRenderer(this.canvas);
    }
  }

  resolveQuality() {
    const chosen = this.settings()?.quality;
    if (chosen === 'low') return 0;
    if (chosen === 'high') return 2;
    return 2;
  }

  createPlayer() {
    const root = new THREE.Group();
    root.name = 'PLAYER';
    const tunic = makeSurface(0x1d5860);
    const cloth = makeSurface(0xd6c58f);
    const skin = makeSurface(0xc99670);
    const dark = makeSurface(0x28362f);
    const metal = new THREE.MeshStandardMaterial({ color: 0xd4d1b3, roughness: .32, metalness: .48 });
    addPart(root, new THREE.CapsuleGeometry(.72, 1.55, 4, 7), tunic, 0, 2.2, 0);
    addPart(root, new THREE.SphereGeometry(.55, 9, 7), skin, 0, 4.15, 0);
    this.cloak = addPart(root, new THREE.ConeGeometry(1.24, 2.75, 7, 1, true), cloth, 0, 2.15, .35);
    this.cloak.rotation.z = Math.PI;
    for (const side of [-1, 1]) addPart(root, new THREE.CapsuleGeometry(.23, .8, 3, 5), dark, side * .43, .8, 0);
    this.swordPivot = new THREE.Group();
    this.swordPivot.position.set(.78, 2.55, 0);
    addPart(this.swordPivot, new THREE.BoxGeometry(.16, 3.6, .26), metal, 0, -1.35, -.1);
    addPart(this.swordPivot, new THREE.BoxGeometry(.9, .16, .2), dark, 0, .38, 0);
    this.swordPivot.rotation.z = -.42;
    root.add(this.swordPivot);
    this.scene.add(root);
    return root;
  }

  createEffects() {
    this.targetRing = new THREE.Mesh(
      new THREE.RingGeometry(2.3, 2.65, 28),
      new THREE.MeshBasicMaterial({ color: 0xf6db87, transparent: true, opacity: .72, side: THREE.DoubleSide, depthWrite: false })
    );
    this.targetRing.rotation.x = -Math.PI / 2;
    this.targetRing.visible = false;
    this.scene.add(this.targetRing);
    this.attackArc = new THREE.Mesh(
      new THREE.TorusGeometry(3.4, .11, 5, 20, Math.PI * 1.16),
      new THREE.MeshBasicMaterial({ color: 0xf5df9c, transparent: true, opacity: 0, depthWrite: false })
    );
    this.attackArc.rotation.x = Math.PI / 2;
    this.attackArc.rotation.z = -.58;
    this.player.add(this.attackArc);
  }

  bindLifecycle() {
    const on = (target, event, handler, options) => {
      target.addEventListener(event, handler, options);
      this.bound.push(() => target.removeEventListener(event, handler, options));
    };
    on(globalThis, 'resize', () => this.resize());
    on(globalThis, 'keydown', event => {
      if (['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.code)) {
        this.input.keys.add(event.code);
        event.preventDefault();
      }
      if (!event.repeat && ['Space', 'KeyJ'].includes(event.code)) { this.attack(); event.preventDefault(); }
      if (!event.repeat && ['ShiftLeft', 'ShiftRight', 'KeyK'].includes(event.code)) { this.dodge(); event.preventDefault(); }
      if (!event.repeat && event.code === 'KeyE') { this.interact(); event.preventDefault(); }
    });
    on(globalThis, 'keyup', event => this.input.keys.delete(event.code));
    on(globalThis, 'blur', () => this.resetInput());
    on(this.canvas, 'contextmenu', event => event.preventDefault());
    on(this.canvas, 'pointerdown', event => {
      if (this.status !== 'running' || this.input.lookPointer !== null) return;
      this.input.lookPointer = event.pointerId;
      this.input.lookX = event.clientX;
      this.input.lookY = event.clientY;
      this.canvas.setPointerCapture?.(event.pointerId);
    });
    on(this.canvas, 'pointermove', event => {
      if (event.pointerId !== this.input.lookPointer) return;
      const dx = event.clientX - this.input.lookX;
      const dy = event.clientY - this.input.lookY;
      this.input.lookX = event.clientX;
      this.input.lookY = event.clientY;
      this.cameraYaw -= dx * .0062;
      this.cameraPitch = clamp(this.cameraPitch + dy * .0035, .12, .63);
    });
    const releaseLook = event => {
      if (event.pointerId !== this.input.lookPointer) return;
      this.canvas.releasePointerCapture?.(event.pointerId);
      this.input.lookPointer = null;
    };
    on(this.canvas, 'pointerup', releaseLook);
    on(this.canvas, 'pointercancel', releaseLook);
  }

  bindControls({ pad, knob, attack, dodge, interact }) {
    this.pad = pad;
    this.knob = knob;
    const on = (target, event, handler, options) => {
      target.addEventListener(event, handler, options);
      this.bound.push(() => target.removeEventListener(event, handler, options));
    };
    const updatePad = event => {
      const rect = pad.getBoundingClientRect();
      const radius = Math.max(28, Math.min(rect.width, rect.height) * .36);
      const dx = event.clientX - (rect.left + rect.width / 2);
      const dy = event.clientY - (rect.top + rect.height / 2);
      const length = Math.hypot(dx, dy) || 1;
      const scale = Math.min(1, radius / length);
      const x = dx * scale, y = dy * scale;
      this.input.x = clamp(x / radius, -1, 1);
      this.input.y = clamp(-y / radius, -1, 1);
      knob.style.transform = `translate(${x}px,${y}px)`;
    };
    on(pad, 'pointerdown', event => {
      if (this.input.padPointer !== null) return;
      this.input.padPointer = event.pointerId;
      pad.setPointerCapture?.(event.pointerId);
      updatePad(event);
      event.preventDefault();
    }, { passive: false });
    on(pad, 'pointermove', event => {
      if (event.pointerId === this.input.padPointer) updatePad(event);
    });
    const releasePad = event => {
      if (event.pointerId !== this.input.padPointer) return;
      pad.releasePointerCapture?.(event.pointerId);
      this.input.padPointer = null;
      this.input.x = 0;
      this.input.y = 0;
      knob.style.transform = 'translate(0,0)';
    };
    on(pad, 'pointerup', releasePad);
    on(pad, 'pointercancel', releasePad);
    on(attack, 'pointerdown', event => { event.preventDefault(); this.attack(); }, { passive: false });
    on(dodge, 'pointerdown', event => { event.preventDefault(); this.dodge(); }, { passive: false });
    on(interact, 'pointerdown', event => { event.preventDefault(); this.interact(); }, { passive: false });
  }

  resetInput() {
    this.input.x = 0;
    this.input.y = 0;
    this.input.keys.clear();
    this.input.padPointer = null;
    this.input.lookPointer = null;
    if (this.knob) this.knob.style.transform = 'translate(0,0)';
  }

  start(progress) {
    this.progress = structuredClone(progress);
    this.progress.collected ||= [];
    this.progress.choices ||= { grove: '', marsh: '', peak: '' };
    this.clock = Number(this.progress.playTime) || 0;
    this.day = .27 + this.clock / 780 % .48;
    this.cameraYaw = Number.isFinite(Number(this.progress.yaw)) ? Number(this.progress.yaw) : 0;
    this.stamina = playerStats(this.progress).maxStamina;
    this.player.position.set(this.progress.x, terrainHeight(this.progress.x, this.progress.z), this.progress.z);
    this.player.rotation.y = this.cameraYaw + Math.PI;
    this.world.setCollected(this.progress.collected);
    this.world.setChoices(this.progress.choices);
    this.spawnEnemies();
    this.status = 'running';
    this.saveTimer = 0;
    this.accumulator = 0;
    this.setObjective();
    this.updateCamera(1);
    this.sound?.start?.();
    this.cb.status('running');
    this.cb.hud(this.snapshotHud());
  }

  stop() {
    if (this.progress && this.status !== 'idle') this.checkpoint('menu');
    this.status = 'idle';
    this.resetInput();
    this.sound?.stop?.();
    this.cb.status('idle');
  }

  pause(reason = 'user') {
    if (this.status !== 'running') return false;
    this.status = 'paused';
    this.pauseReason = reason;
    this.resetInput();
    this.checkpoint(reason);
    this.sound?.stop?.();
    this.cb.status('paused', reason);
    return true;
  }

  resume() {
    if (!['paused', 'dialogue', 'camp', 'ending'].includes(this.status)) return false;
    this.pendingChoice = null;
    this.status = 'running';
    this.sound?.start?.();
    this.cb.status('running');
    return true;
  }

  respawn() {
    if (!this.progress) return;
    this.progress.coins = Math.max(0, this.progress.coins - respawnCoinLossFor(this.progress));
    const stats = playerStats(this.progress);
    this.progress.health = stats.maxHealth;
    this.player.position.set(0, terrainHeight(0, 310), 310);
    this.progress.x = 0;
    this.progress.z = 310;
    this.stamina = stats.maxStamina;
    this.spawnEnemies();
    this.status = 'running';
    this.invulnerable = 2;
    this.checkpoint('respawn');
    this.cb.status('running');
  }

  spawnEnemies() {
    for (const enemy of this.enemies) this.enemyRoot.remove(enemy.mesh);
    this.enemies.length = 0;
    for (const [index, spec] of ENEMY_SPAWNS.entries()) {
      if (this.progress.defeated.includes(spec.id)) continue;
      const locked = (spec.guardian && this.progress.story < 1) || (spec.final && !canEnterCrown(this.progress));
      const enemy = {
        ...spec,
        maxHp: spec.hp,
        alert: false,
        dead: false,
        locked,
        flash: 0,
        phase: (index * 2.399963229728653) % TAU,
        state: 'idle',
        stateTimer: 0,
        stateTotal: 0,
        attackConnected: false,
        circleSide: index % 2 ? 1 : -1
      };
      enemy.mesh = this.createEnemyMesh(enemy);
      enemy.mesh.position.set(enemy.x, terrainHeight(enemy.x, enemy.z), enemy.z);
      enemy.mesh.visible = !locked;
      this.enemyRoot.add(enemy.mesh);
      this.enemies.push(enemy);
    }
  }

  createEnemyMesh(enemy) {
    const root = new THREE.Group();
    root.name = enemy.id;
    const boss = enemy.guardian || enemy.final;
    const scale = enemy.final ? 2.25 : enemy.guardian ? 1.65 : 1;
    const colors = enemy.type === 'stalker' ? [0x324d4a, 0x719482] : enemy.type === 'sentinel' ? [0x626b65, 0xb5ad89] : enemy.type === 'crown' ? [0x3d3849, 0xd1b35b] : [0x455e37, 0x93aa60];
    const body = addPart(root, new THREE.IcosahedronGeometry(1.45, boss ? 1 : 0), makeSurface(colors[0]), 0, 2.1, 0, scale);
    body.name = 'body';
    addPart(root, new THREE.ConeGeometry(.78, 2.7, 5), makeSurface(colors[1], colors[1]), -1.15 * scale, 3.2 * scale, 0, scale);
    addPart(root, new THREE.ConeGeometry(.78, 2.7, 5), makeSurface(colors[1], colors[1]), 1.15 * scale, 3.2 * scale, 0, scale);
    for (const side of [-1, 1]) addPart(root, new THREE.SphereGeometry(.18 * scale, 6, 4), makeSurface(0xffd57b, 0xff7b2e), side * .48 * scale, 2.35 * scale, -1.25 * scale);
    if (boss) {
      const ring = addPart(root, new THREE.TorusGeometry(2.35 * scale, .14 * scale, 6, 22), makeSurface(colors[1], colors[1]), 0, 4.5 * scale, 0);
      ring.rotation.x = Math.PI / 2;
      ring.name = 'ring';
    }
    const radius = 2.4 * scale;
    const tell = new THREE.Mesh(
      new THREE.RingGeometry(radius * 1.12, radius * 1.38, 28),
      new THREE.MeshBasicMaterial({ color: 0xffb45f, transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide })
    );
    tell.rotation.x = -Math.PI / 2;
    tell.position.y = .12;
    tell.visible = false;
    tell.name = 'attackTell';
    root.add(tell);
    root.userData.radius = radius;
    return root;
  }

  setObjective() {
    const target = objectiveFor(this.progress);
    this.world.setObjective(target);
  }

  movementInput() {
    let x = this.input.x;
    let y = this.input.y;
    if (this.input.keys.has('KeyA') || this.input.keys.has('ArrowLeft')) x -= 1;
    if (this.input.keys.has('KeyD') || this.input.keys.has('ArrowRight')) x += 1;
    if (this.input.keys.has('KeyW') || this.input.keys.has('ArrowUp')) y += 1;
    if (this.input.keys.has('KeyS') || this.input.keys.has('ArrowDown')) y -= 1;
    const length = Math.hypot(x, y);
    return length > 1 ? { x: x / length, y: y / length, length: 1 } : { x, y, length };
  }

  update(dt) {
    if (!this.progress) return;
    this.clock += dt;
    this.day = (.27 + this.clock / 780) % 1;
    this.saveTimer += dt;
    this.attackTimer = Math.max(0, this.attackTimer - dt);
    this.attackCooldown = Math.max(0, this.attackCooldown - dt);
    this.dodgeTimer = Math.max(0, this.dodgeTimer - dt);
    this.invulnerable = Math.max(0, this.invulnerable - dt);
    this.hitFlash = Math.max(0, this.hitFlash - dt * 2.5);
    const move = this.movementInput();
    const stats = playerStats(this.progress);
    const forwardX = -Math.sin(this.cameraYaw), forwardZ = -Math.cos(this.cameraYaw);
    const rightX = Math.cos(this.cameraYaw), rightZ = -Math.sin(this.cameraYaw);
    let moveX = rightX * move.x + forwardX * move.y;
    let moveZ = rightZ * move.x + forwardZ * move.y;
    if (this.dodgeTimer > 0) {
      moveX = this.dodgeDirection.x;
      moveZ = this.dodgeDirection.z;
    }
    const targetSpeed = this.dodgeTimer > 0 ? 34 : stats.speed * (terrainHeight(this.player.position.x, this.player.position.z) < WATER_LEVEL + .25 ? .58 : 1);
    this.velocity.x += (moveX * targetSpeed - this.velocity.x) * Math.min(1, dt * (this.dodgeTimer ? 20 : 9));
    this.velocity.z += (moveZ * targetSpeed - this.velocity.z) * Math.min(1, dt * (this.dodgeTimer ? 20 : 9));
    if (move.length < .08 && this.dodgeTimer <= 0) {
      this.velocity.x *= Math.max(0, 1 - dt * 11);
      this.velocity.z *= Math.max(0, 1 - dt * 11);
    }
    this.player.position.x = clamp(this.player.position.x + this.velocity.x * dt, -WORLD_HALF + 12, WORLD_HALF - 12);
    this.player.position.z = clamp(this.player.position.z + this.velocity.z * dt, -WORLD_HALF + 12, WORLD_HALF - 12);
    const ground = Math.max(terrainHeight(this.player.position.x, this.player.position.z), WATER_LEVEL - .15);
    this.player.position.y += (ground - this.player.position.y) * Math.min(1, dt * 14);
    if (Math.hypot(this.velocity.x, this.velocity.z) > 1.4) {
      const angle = Math.atan2(this.velocity.x, this.velocity.z);
      this.player.rotation.y = approachAngle(this.player.rotation.y, angle, dt * 10);
    }
    this.stamina = clamp(this.stamina + dt * (this.dodgeTimer ? 4 : 19), 0, stats.maxStamina);
    this.updateCombatAnimation();
    this.updateEnemies(dt);
    this.updateNearby();
    this.updateDiscovery();
    this.updateCamera(dt);
    this.world.update(this.clock, this.player.position, this.day);
    if (this.saveTimer >= 18) this.checkpoint('autosave');
  }

  updateCombatAnimation() {
    if (this.attackTimer > 0) {
      const t = 1 - this.attackTimer / .38;
      this.swordPivot.rotation.z = -.45 - Math.sin(t * Math.PI) * 2.45;
      this.attackArc.material.opacity = Math.sin(t * Math.PI) * .85;
      if (!this.attackHit && t > .24) {
        this.attackHit = true;
        this.resolveAttack();
      }
    } else {
      this.swordPivot.rotation.z += (-.42 - this.swordPivot.rotation.z) * .18;
      this.attackArc.material.opacity = 0;
    }
    const speed = Math.hypot(this.velocity.x, this.velocity.z);
    this.player.position.y += Math.sin(this.clock * 9) * Math.min(.035, speed * .002);
    this.cloak.rotation.x = .08 + Math.min(.32, speed * .012);
  }

  attack() {
    if (this.status !== 'running' || this.attackCooldown > 0) return false;
    this.attackTimer = .38;
    this.attackCooldown = .48;
    this.attackHit = false;
    this.sound?.event?.('attack');
    return true;
  }

  resolveAttack() {
    const stats = playerStats(this.progress);
    const nearby = this.enemies.filter(enemy => !enemy.dead && !enemy.locked && enemy.mesh.visible && distance2D(this.player.position, enemy) < (enemy.guardian || enemy.final ? 10 : 8));
    nearby.sort((a, b) => distance2D(this.player.position, a) - distance2D(this.player.position, b));
    const target = nearby[0];
    if (!target) return;
    this.player.rotation.y = Math.atan2(target.x - this.player.position.x, target.z - this.player.position.z);
    const damage = stats.power * (.92 + Math.min(1, this.stamina / stats.maxStamina) * .16);
    this.damageEnemy(target, damage);
  }

  dodge() {
    if (this.status !== 'running' || this.dodgeTimer > 0 || this.stamina < 24) return false;
    const move = this.movementInput();
    if (move.length > .08) {
      const fx = -Math.sin(this.cameraYaw), fz = -Math.cos(this.cameraYaw);
      const rx = Math.cos(this.cameraYaw), rz = -Math.sin(this.cameraYaw);
      this.dodgeDirection.set(rx * move.x + fx * move.y, 0, rz * move.x + fz * move.y).normalize();
    } else {
      this.dodgeDirection.set(Math.sin(this.player.rotation.y), 0, Math.cos(this.player.rotation.y));
    }
    this.stamina -= 24;
    this.dodgeTimer = .34;
    this.invulnerable = .48;
    this.sound?.event?.('dodge');
    return true;
  }

  damageEnemy(enemy, amount) {
    if (enemy.dead) return;
    enemy.hp -= amount;
    enemy.flash = .17;
    enemy.alert = true;
    this.sound?.event?.('hit', enemy.guardian || enemy.final ? 1.2 : 1);
    if (enemy.hp <= 0) this.defeatEnemy(enemy);
  }

  defeatEnemy(enemy) {
    enemy.dead = true;
    enemy.mesh.visible = false;
    this.progress.coins += enemy.coins;
    const result = grantExperience(this.progress, enemy.xp);
    this.progress = result.progress;
    if (result.levels) this.cb.toast(`レベル ${this.progress.level} — 生命力と攻撃力が上昇`);
    if (enemy.guardian) {
      if (!this.progress.defeated.includes(enemy.id)) this.progress.defeated.push(enemy.id);
      if (!this.progress.sigils.includes(enemy.id)) this.progress.sigils.push(enemy.id);
      const guardian = GUARDIANS.find(item => item.id === enemy.id);
      if (!this.progress.choices[guardian.point]) this.progress.pendingChoice = enemy.id;
      this.progress.story = this.progress.sigils.length >= 3 ? 2 : 1;
      this.cb.toast(`${guardian.sigil}を取り戻した`, 2600);
      this.sound?.event?.('discover');
      for (const other of this.enemies) if (other.final) { other.locked = !canEnterCrown(this.progress); other.mesh.visible = !other.locked; }
    } else if (enemy.final) {
      if (!this.progress.defeated.includes(enemy.id)) this.progress.defeated.push(enemy.id);
      this.progress.story = 3;
      this.progress.victory = true;
      this.progress.ending = endingFor(this.progress);
      this.progress.endings += 1;
      this.status = 'ending';
      this.checkpoint('ending');
      this.sound?.event?.('victory');
      this.cb.ending(this.snapshotHud());
      return;
    }
    this.setObjective();
    this.checkpoint('enemy-defeated');
  }

  updateEnemies(dt) {
    const player = this.player.position;
    let boss = null;
    for (const enemy of this.enemies) {
      if (enemy.dead || enemy.locked || !enemy.mesh.visible) continue;
      const behavior = ENEMY_BEHAVIORS[enemy.type] || ENEMY_BEHAVIORS.beast;
      let dx = player.x - enemy.x, dz = player.z - enemy.z, distance = Math.hypot(dx, dz) || 1;
      const enter = (state, duration = 0) => {
        enemy.state = state;
        enemy.stateTimer = duration;
        enemy.stateTotal = duration;
        if (state === 'idle') enemy.alert = false;
        if (state === 'windup') {
          enemy.attackConnected = false;
          if (distance < 30) this.sound?.event?.('danger', enemy.guardian || enemy.final ? 1.25 : 1);
        }
      };

      if (enemy.state === 'idle') {
        enemy.x += Math.sin(this.clock * .36 + enemy.phase) * dt * .4;
        enemy.z += Math.cos(this.clock * .31 + enemy.phase) * dt * .4;
        if (distance < behavior.activation) {
          enemy.alert = true;
          enter('approach');
        }
      } else if (enemy.state === 'approach') {
        enemy.alert = true;
        if (distance > 175) {
          enemy.alert = false;
          enter('idle');
        } else if (distance <= behavior.attackRange + enemy.mesh.userData.radius * .18) {
          enter('windup', behavior.windup * (enemy.guardian ? .92 : 1));
        } else {
          let moveX = dx / distance, moveZ = dz / distance;
          if (behavior.circle && distance < 21) {
            const forwardWeight = clamp((distance - behavior.attackRange) / 14, .18, .72);
            const sideX = -moveZ * enemy.circleSide, sideZ = moveX * enemy.circleSide;
            moveX = moveX * forwardWeight + sideX * (1 - forwardWeight);
            moveZ = moveZ * forwardWeight + sideZ * (1 - forwardWeight);
            const length = Math.hypot(moveX, moveZ) || 1;
            moveX /= length;
            moveZ /= length;
          }
          enemy.x += moveX * behavior.speed * dt;
          enemy.z += moveZ * behavior.speed * dt;
        }
      } else if (enemy.state === 'windup') {
        enemy.alert = true;
        enemy.stateTimer -= dt;
        if (enemy.stateTimer <= 0) enter('active', behavior.active);
      } else if (enemy.state === 'active') {
        enemy.alert = true;
        enemy.stateTimer -= dt;
        enemy.x += dx / distance * behavior.lunge * dt;
        enemy.z += dz / distance * behavior.lunge * dt;
        dx = player.x - enemy.x;
        dz = player.z - enemy.z;
        distance = Math.hypot(dx, dz) || 1;
        const hitRange = behavior.attackRange + enemy.mesh.userData.radius * .28;
        if (!enemy.attackConnected && distance <= hitRange) {
          enemy.attackConnected = true;
          this.hurt(enemy.power * behavior.damage, enemy);
        }
        if (enemy.stateTimer <= 0) enter('recovery', behavior.recovery);
      } else if (enemy.state === 'recovery') {
        enemy.alert = true;
        enemy.stateTimer -= dt;
        if (enemy.stateTimer <= 0) enter(distance > 175 ? 'idle' : 'approach');
      }

      if ((enemy.guardian || enemy.final) && enemy.alert) boss = enemy;
      enemy.mesh.position.x = enemy.x;
      enemy.mesh.position.z = enemy.z;
      enemy.mesh.position.y = Math.max(terrainHeight(enemy.x, enemy.z), WATER_LEVEL - .1);
      enemy.mesh.rotation.y = Math.atan2(dx, dz);
      const windupProgress = enemy.state === 'windup' ? 1 - clamp(enemy.stateTimer / (enemy.stateTotal || 1), 0, 1) : 0;
      enemy.mesh.scale.y = 1 + Math.sin(this.clock * 4 + enemy.phase) * .035 + windupProgress * .09;
      const ring = enemy.mesh.getObjectByName('ring');
      if (ring) ring.rotation.z += dt * (enemy.final ? 1.5 : .8);
      const tell = enemy.mesh.getObjectByName('attackTell');
      if (tell) {
        tell.visible = enemy.state === 'windup' || enemy.state === 'active';
        tell.material.opacity = enemy.state === 'active' ? .92 : .14 + windupProgress * .68;
        const pulse = 1 + windupProgress * .18 + Math.sin(this.clock * 16) * .025;
        tell.scale.setScalar(pulse);
      }
      const body = enemy.mesh.getObjectByName('body');
      if (body?.material) {
        body.material.emissive.setHex(enemy.flash > 0 ? 0xffffff : enemy.state === 'windup' ? 0x8a3309 : enemy.state === 'active' ? 0xff7a18 : 0x000000);
        body.material.emissiveIntensity = enemy.flash > 0 ? 1 : enemy.state === 'active' ? .9 : enemy.state === 'windup' ? .48 : 0;
      }
      enemy.flash = Math.max(0, enemy.flash - dt);
    }
    this.activeBoss = boss;
  }

  hurt(amount, source) {
    if (this.status !== 'running' || this.invulnerable > 0) return;
    this.progress.health = Math.max(0, this.progress.health - amount);
    this.invulnerable = .72;
    this.hitFlash = .7;
    this.sound?.event?.('hurt');
    if (source) {
      v3.set(this.player.position.x - source.x, 0, this.player.position.z - source.z).normalize();
      this.player.position.addScaledVector(v3, 3.5);
    }
    if (this.progress.health <= 0) {
      this.status = 'dead';
      this.checkpoint('defeat');
      this.sound?.stop?.();
      this.cb.death({ coins: this.progress.coins });
    }
  }

  updateNearby() {
    let nearest = null;
    for (const item of this.world.interactables) {
      if (item.mesh && !item.mesh.visible) continue;
      const distance = Math.hypot(this.player.position.x - item.x, this.player.position.z - item.z);
      const reach = (item.radius || 5) + 7;
      if (distance <= reach && (!nearest || distance < nearest.distance)) nearest = { ...item, distance };
    }
    this.nearby = nearest;
    this.targetRing.visible = Boolean(nearest);
    if (nearest) this.targetRing.position.set(nearest.x, terrainHeight(nearest.x, nearest.z) + .12, nearest.z);
  }

  interact() {
    if (this.status !== 'running' || !this.nearby) return false;
    const item = this.nearby;
    if (item.type === 'herb' || item.type === 'crystal') {
      if (!this.progress.collected.includes(item.id)) this.progress.collected.push(item.id);
      item.collected = true;
      item.mesh.visible = false;
      if (item.type === 'herb') {
        this.progress.herbs += 1;
        const stats = playerStats(this.progress);
        this.progress.health = Math.min(stats.maxHealth, this.progress.health + herbHealingFor(this.progress));
        this.cb.toast('月露草 +1　生命力を回復');
      } else {
        this.progress.crystals += 1;
        this.cb.toast('青脈晶 +1');
      }
      this.sound?.event?.('pickup');
      this.checkpoint('resource');
      return true;
    }
    if (item.type === 'cache') {
      if (this.progress.collected.includes(item.id)) return false;
      this.progress.collected.push(item.id);
      this.progress.crystals += 3;
      this.progress.coins += 35;
      this.cb.toast('古い鉱夫の箱：青脈晶 +3 / 木の葉貨 +35', 2600);
      this.checkpoint('cache');
      return true;
    }
    if (item.id === 'mira') {
      this.status = 'dialogue';
      this.pendingChoice = null;
      if (this.progress.story === 0) {
        this.progress.story = 1;
        for (const enemy of this.enemies) if (enemy.guardian) {
          enemy.locked = false;
          enemy.mesh.visible = true;
        }
        this.setObjective();
        this.checkpoint('quest-start');
        this.cb.dialogue({ speaker: '斥候ミラ', text: '帰ってきたのね。父イリヤが三つの印を空環へ束ね、あの大嵐から里を救って十二年。でも代わりに森も川も風も眠った。私は印を大地へ返したい。オリンは結界を失えば次は誰も救えないと言う。古樹、鐘楼、白嶺で記憶を見て、最後はあなた自身で決めて。' });
      } else if (this.progress.sigils.length < 3) {
        const consequence = this.progress.choices.grove === 'haven_ward'
          ? '森の印は里の境に根づいた。あの淡い輪が、旅人をここへ導いてくれる。'
          : this.progress.choices.grove === 'wild_bloom'
            ? '古樹の森に若木が戻った。月露草にも、前より強い命が巡っている。'
            : '古樹の記憶が、印の行方をあなたに問いかけている。';
        const decisions = Object.values(this.progress.choices).filter(Boolean).length;
        this.cb.dialogue({ speaker: '斥候ミラ', text: `${consequence} 印はあと${3 - this.progress.sigils.length}つ。${decisions ? 'あなたの答えで谷はもう変わり始めている。選んだ責任から目を逸らさないで。' : '守ることと、返すこと。その両方に代償がある。'}` });
      } else if (!canEnterCrown(this.progress)) {
        const unresolved = GUARDIANS.find(guardian => !this.progress.choices[guardian.point]);
        this.cb.dialogue({ speaker: '斥候ミラ', text: `${unresolved?.sigil || '印'}はまだ行き先を持たない。${unresolved ? WORLD_POINTS.find(point => point.id === unresolved.point)?.label : '記憶の場所'}で答えを出してから、空環神殿へ向かって。` });
      } else if (!this.progress.victory) {
        this.cb.dialogue({ speaker: '斥候ミラ', text: '三つの印が響いている。北の空環神殿へ。谷を縛る王を倒せるのは、もうあなただけ。' });
      } else {
        const memory = this.progress.choices.grove === 'haven_ward' ? '里の護りは、あなたの決断を覚えている。' : this.progress.choices.grove === 'wild_bloom' ? '芽吹いた森は、あなたの決断を覚えている。' : '';
        this.cb.dialogue({ speaker: '斥候ミラ', text: `風が帰ってきた。${memory} 物語は終わっても、この谷はまだ広い。好きな道を歩いて。` });
      }
      return true;
    }
    if (item.id === 'orin') {
      if (!this.progress.npcFlags?.orinIntro) {
        this.progress.npcFlags ||= {};
        this.progress.npcFlags.orinIntro = true;
        this.status = 'dialogue';
        this.pendingChoice = null;
        this.checkpoint('orin-intro');
        this.cb.dialogue({ speaker: '鍛冶師オリン', text: 'ミラは父親を檻から解きたい。それは分かる。だが十二年前、イリヤの結界がなければ、ここにいる子どもは一人も生まれていない。印を大地へ返すなら、次の嵐を人の手で耐える覚悟も一緒に持て。俺は武器も水路も直す。決めるのは旅を見たお前だ。' });
        return true;
      }
      this.status = 'camp';
      this.cb.status('camp');
      return true;
    }
    if (item.type === 'camp') {
      const stats = playerStats(this.progress);
      this.progress.health = stats.maxHealth;
      this.stamina = stats.maxStamina;
      this.status = 'camp';
      this.checkpoint('camp');
      this.sound?.event?.('heal');
      this.cb.status('camp');
      return true;
    }
    if (item.type === 'final' && !canEnterCrown(this.progress)) {
      this.status = 'dialogue';
      this.pendingChoice = null;
      const unresolved = GUARDIANS.find(guardian => !this.progress.choices[guardian.point]);
      const text = this.progress.sigils.length < 3
        ? `三つの窪みのうち、${this.progress.sigils.length}つだけが光っている。すべての印が必要だ。`
        : `${unresolved?.sigil || '印'}はまだ行き先を持たない。${unresolved ? WORLD_POINTS.find(point => point.id === unresolved.point)?.label : '記憶の場所'}で答えなければ、門は印を受け入れない。`;
      this.cb.dialogue({ speaker: '空環の門', text });
      return true;
    }
    const choicePoint = { grove_altar: 'grove', marsh_bell: 'marsh', peak_wind: 'peak' }[item.id];
    const choiceGuardian = GUARDIANS.find(guardian => guardian.point === choicePoint);
    if (choicePoint && this.progress.defeated.includes(choiceGuardian.id)) {
      this.status = 'dialogue';
      if (!this.progress.choices[choicePoint]) {
        this.pendingChoice = choicePoint;
        const memory = CONSEQUENCES[choiceGuardian.id];
        this.cb.dialogue({
          speaker: memory.title,
          text: memory.prompt,
          choices: Object.values(CONSEQUENCE_CHOICES[choicePoint]).map(({ id, label, detail }) => ({ id, label, detail }))
        });
      } else {
        this.pendingChoice = null;
        const chosen = CONSEQUENCE_CHOICES[choicePoint][this.progress.choices[choicePoint]];
        this.cb.dialogue({ speaker: CONSEQUENCES[choiceGuardian.id].title, text: `${chosen.label}と決めた記憶は消えない。${chosen.journal}` });
      }
      return true;
    }
    const lore = {
      grove_altar: ['古樹の記憶', '倒れた木も、土の下で森を支える。谷の力は失われず、姿を変えて巡る。'],
      marsh_bell: ['沈んだ鐘', '鐘は水の底でも鳴る。霧の夜、その音を聞いた旅人は帰る道を思い出した。'],
      peak_wind: ['風読みの碑', '風に逆らう者は峰を恐れ、風を読む者は峰を道に変える。'],
      coast_archive: ['潮騒の碑文', '王都は海へ崩れた。それでも人々は高台に里を築き、朝を待った。']
    }[item.id];
    if (lore) {
      this.status = 'dialogue';
      this.pendingChoice = null;
      this.cb.dialogue({ speaker: lore[0], text: lore[1] });
      return true;
    }
    return false;
  }

  chooseDialogue(choiceId) {
    const point = this.pendingChoice;
    const options = CONSEQUENCE_CHOICES[point];
    if (this.status !== 'dialogue' || !options || !Object.prototype.hasOwnProperty.call(options, choiceId) || this.progress.choices[point]) return false;
    const guardian = GUARDIANS.find(item => item.point === point);
    this.progress.choices[point] = choiceId;
    if (this.progress.pendingChoice === guardian?.id) this.progress.pendingChoice = null;
    this.pendingChoice = null;
    this.world.setChoices(this.progress.choices);
    const stats = playerStats(this.progress);
    this.stamina = stats.maxStamina;
    this.progress.health = Math.min(stats.maxHealth, this.progress.health + (point === 'marsh' && choiceId === 'water_ward' ? 18 : 0));
    for (const enemy of this.enemies) if (enemy.final) {
      enemy.locked = !canEnterCrown(this.progress);
      enemy.mesh.visible = !enemy.locked;
    }
    this.setObjective();
    this.checkpoint(`${point}-choice`);
    this.sound?.event?.('discover');
    const result = CONSEQUENCES[guardian.id].options.find(option => option.id === choiceId)?.result || options[choiceId].journal;
    this.cb.dialogue({ speaker: CONSEQUENCES[guardian.id].title, text: result });
    return true;
  }

  upgrade(kind) {
    if (!this.progress || !['vigor', 'edge', 'stride'].includes(kind)) return { ok: false, reason: 'invalid' };
    const level = this.progress.upgrades[kind] || 0;
    const crystalCost = level + 1;
    const coinCost = 25 + level * 25;
    if (level >= 5) return { ok: false, reason: 'max' };
    if (this.progress.crystals < crystalCost || this.progress.coins < coinCost) return { ok: false, reason: 'cost', crystalCost, coinCost };
    this.progress.crystals -= crystalCost;
    this.progress.coins -= coinCost;
    this.progress.upgrades[kind] = level + 1;
    const stats = playerStats(this.progress);
    this.progress.health = stats.maxHealth;
    this.stamina = stats.maxStamina;
    this.checkpoint('upgrade');
    this.sound?.event?.('discover');
    return { ok: true, level: level + 1 };
  }

  updateDiscovery() {
    for (const point of WORLD_POINTS) {
      if (this.progress.discovered.includes(point.id)) continue;
      if (Math.hypot(this.player.position.x - point.x, this.player.position.z - point.z) < 92) {
        this.progress.discovered.push(point.id);
        this.cb.discovery(point);
        this.sound?.event?.('discover');
        this.checkpoint('discovery');
      }
    }
  }

  updateCamera(dt) {
    const distance = 15.5;
    const height = 8.4 + this.cameraPitch * 8;
    const desired = v3.set(
      this.player.position.x + Math.sin(this.cameraYaw) * distance,
      this.player.position.y + height,
      this.player.position.z + Math.cos(this.cameraYaw) * distance
    );
    desired.y = Math.max(desired.y, terrainHeight(desired.x, desired.z) + 3.2);
    const factor = dt >= 1 ? 1 : 1 - Math.exp(-dt * 8);
    this.camera.position.lerp(desired, factor);
    targetV.set(this.player.position.x, this.player.position.y + 3.1, this.player.position.z);
    this.camera.lookAt(targetV);
  }

  checkpoint(reason) {
    if (!this.progress) return;
    this.progress.x = this.player.position.x;
    this.progress.z = this.player.position.z;
    this.progress.yaw = this.cameraYaw;
    this.progress.playTime = this.clock;
    this.progress.lastSaved = Date.now();
    const stats = playerStats(this.progress);
    this.progress.health = clamp(this.progress.health, 0, stats.maxHealth);
    this.saveTimer = 0;
    this.cb.save(structuredClone(this.progress), reason);
  }

  snapshotHud() {
    if (!this.progress) return { status: this.status };
    const stats = playerStats(this.progress);
    const objective = objectiveFor(this.progress);
    return {
      status: this.status,
      health: this.progress.health,
      maxHealth: stats.maxHealth,
      stamina: this.stamina,
      maxStamina: stats.maxStamina,
      level: this.progress.level,
      xp: this.progress.xp,
      nextXp: xpForLevel(this.progress.level),
      coins: this.progress.coins,
      herbs: this.progress.herbs,
      crystals: this.progress.crystals,
      upgrades: { ...this.progress.upgrades },
      quest: questText(this.progress),
      region: regionAt(this.player.position.x, this.player.position.z),
      objectiveDistance: Math.round(Math.hypot(this.player.position.x - objective.x, this.player.position.z - objective.z)),
      interact: this.nearby?.name || '',
      boss: this.activeBoss ? { name: this.activeBoss.name, health: Math.max(0, this.activeBoss.hp / this.activeBoss.maxHp) } : null,
      x: this.player.position.x,
      z: this.player.position.z,
      yaw: this.player.rotation.y,
      discovered: [...this.progress.discovered],
      sigils: [...this.progress.sigils],
      choices: { ...this.progress.choices },
      pendingChoice: this.progress.pendingChoice || null,
      ending: this.progress.ending || '',
      playTime: this.clock,
      victory: this.progress.victory,
      hitFlash: this.hitFlash
    };
  }

  render() {
    this.renderer.render(this.scene, this.camera);
  }

  resize() {
    const rect = this.canvas.parentElement?.getBoundingClientRect?.() || this.canvas.getBoundingClientRect();
    const width = Math.max(1, Math.round(rect.width || globalThis.innerWidth || 1));
    const height = Math.max(1, Math.round(rect.height || globalThis.innerHeight || 1));
    const cap = this.quality === 2 ? 1.55 : this.quality === 1 ? 1.25 : 1;
    let dpr = Math.min(globalThis.devicePixelRatio || 1, cap);
    if (width * height * dpr * dpr > 1_850_000) dpr = Math.sqrt(1_850_000 / (width * height));
    this.renderer.setPixelRatio(Math.max(.75, dpr));
    this.renderer.setSize(width, height, false);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
  }

  frame(time) {
    if (this.disposed) return;
    const elapsed = this.lastFrame ? clamp((time - this.lastFrame) / 1000, 0, .05) : 0;
    this.lastFrame = time;
    if (this.status === 'running') {
      this.accumulator += elapsed;
      let steps = 0;
      while (this.accumulator >= STEP && steps < 3) {
        this.update(STEP);
        this.accumulator -= STEP;
        steps += 1;
      }
      if (steps === 3) this.accumulator = 0;
      this.hudTimer += elapsed;
      if (this.hudTimer > .1) { this.hudTimer = 0; this.cb.hud(this.snapshotHud()); }
    } else {
      this.accumulator = 0;
      if (this.progress) this.world.update(this.clock, this.player.position, this.day);
    }
    this.render();
    if (elapsed > 0) this.samples.push(elapsed * 1000);
    if (this.samples.length >= 90) {
      const average = this.samples.reduce((sum, value) => sum + value, 0) / this.samples.length;
      const ordered = [...this.samples].sort((a, b) => a - b);
      const p95 = ordered[Math.floor(ordered.length * .95)];
      this.samples.length = 0;
      if (this.settings()?.quality === 'auto' && this.quality > 0 && (average > 24 || p95 > 34)) {
        this.quality -= 1;
        this.world.setQuality(this.quality);
        this.resize();
        this.cb.quality(this.quality, { average, p95 });
      }
    }
    this.frameHandle = requestAnimationFrame(this.frame);
  }

  setQuality(value) {
    this.quality = value === 'low' ? 0 : 2;
    this.world.setQuality(this.quality);
    this.resize();
  }

  testSnapshot() {
    const render = this.renderer.info?.render;
    const metrics = {
      quality: this.quality,
      canvasPixels: this.canvas.width * this.canvas.height,
      drawCalls: render?.calls ?? null,
      triangles: render?.triangles ?? null
    };
    return this.progress ? { ...this.snapshotHud(), enemyCount: this.enemies.filter(enemy => !enemy.dead && !enemy.locked).length, metrics } : { status: this.status, metrics };
  }

  testEnemy(id) {
    const enemy = this.enemies.find(item => item.id === id);
    if (!enemy) return null;
    return {
      id: enemy.id,
      type: enemy.type,
      state: enemy.state,
      stateTimer: enemy.stateTimer,
      attackConnected: enemy.attackConnected,
      locked: enemy.locked,
      visible: enemy.mesh.visible,
      x: enemy.x,
      z: enemy.z,
      hp: enemy.hp
    };
  }

  testTeleport(x, z) {
    if (!this.progress) return;
    this.player.position.set(clamp(x, -WORLD_HALF + 12, WORLD_HALF - 12), terrainHeight(x, z), clamp(z, -WORLD_HALF + 12, WORLD_HALF - 12));
    this.updateNearby();
    this.updateDiscovery();
    this.updateCamera(1);
  }

  testDefeat(id) {
    const enemy = this.enemies.find(item => item.id === id && !item.dead);
    if (!enemy) return false;
    enemy.locked = false;
    enemy.mesh.visible = true;
    this.defeatEnemy(enemy);
    return true;
  }

  testTick(seconds = STEP) {
    const frames = Math.min(600, Math.max(1, Math.round(seconds / STEP)));
    for (let i = 0; i < frames; i += 1) if (this.status === 'running') this.update(STEP);
  }

  destroy() {
    this.checkpoint('destroy');
    this.disposed = true;
    cancelAnimationFrame(this.frameHandle);
    this.bound.splice(0).forEach(unbind => unbind());
    this.world.dispose();
    this.renderer.dispose();
    this.sound?.destroy?.();
  }
}
