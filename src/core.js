export const SAVE_KEY = 'q-starthread-save';
export const SAVE_VERSION = 1;
export const clamp = (n, min, max) => Math.max(min, Math.min(max, n));
export const lerp = (a, b, t) => a + (b - a) * t;
export const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

export function rng(seed = 1) {
  let state = (Number(seed) || 1) >>> 0;
  return {
    next() {
      state += 0x6d2b79f5;
      let t = state;
      t = Math.imul(t ^ t >>> 15, t | 1);
      t ^= t + Math.imul(t ^ t >>> 7, t | 61);
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    },
    int(min, max) { return Math.floor(this.next() * (max - min + 1)) + min; },
    pick(list) { return list[Math.floor(this.next() * list.length)]; },
    get state() { return state >>> 0; }
  };
}

export function pointToSegment(point, a, b) {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const length = dx * dx + dy * dy;
  if (!length) return distance(point, a);
  const t = clamp(((point.x - a.x) * dx + (point.y - a.y) * dy) / length, 0, 1);
  return Math.hypot(point.x - (a.x + dx * t), point.y - (a.y + dy * t));
}

export function beamHits(a, b, circle, width = 0) {
  return pointToSegment(circle, a, b) <= circle.radius + width;
}

export function formatNumber(value) {
  return Math.max(0, Math.floor(value)).toLocaleString('ja-JP');
}

export function formatTime(value) {
  const seconds = Math.max(0, Math.floor(value));
  return `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
}

export const DEFAULT_SAVE = Object.freeze({
  version: SAVE_VERSION,
  best: 0,
  depth: 0,
  wins: 0,
  runs: 0,
  tutorial: false,
  settings: { sound: true, vibration: true, reduced: false }
});

const number = value => Number.isFinite(Number(value)) ? Math.max(0, Math.floor(Number(value))) : 0;

export function cleanSave(raw) {
  if (!raw || typeof raw !== 'object') return structuredClone(DEFAULT_SAVE);
  const settings = raw.settings && typeof raw.settings === 'object' ? raw.settings : {};
  return {
    version: SAVE_VERSION,
    best: number(raw.best),
    depth: number(raw.depth),
    wins: number(raw.wins),
    runs: number(raw.runs),
    tutorial: Boolean(raw.tutorial),
    settings: {
      sound: settings.sound !== false,
      vibration: settings.vibration !== false,
      reduced: Boolean(settings.reduced)
    }
  };
}

export function recordRun(save, run) {
  const out = cleanSave(save);
  out.runs += 1;
  out.best = Math.max(out.best, number(run.score));
  out.depth = Math.max(out.depth, number(run.wave));
  if (run.victory) out.wins += 1;
  return out;
}

export const UPGRADES = Object.freeze([
  { id:'edge', icon:'⌁', name:'HOT THREAD', text:'糸の攻撃力 +35%', max:5 },
  { id:'width', icon:'═', name:'WIDE ARC', text:'糸の判定幅 +30%', max:4 },
  { id:'gravity', icon:'●', name:'DEEP WELL', text:'重力 +22%、旋回力が上がる', max:4 },
  { id:'energy', icon:'◇', name:'LONG BURN', text:'最大TETHER +25、完全回復', max:3 },
  { id:'regen', icon:'≈', name:'COLD LOOP', text:'TETHER回復速度 +30%', max:4 },
  { id:'hull', icon:'♥', name:'CORE PLATE', text:'最大HULL +1、完全回復', max:3 },
  { id:'surge', icon:'×', name:'SURGE MEMORY', text:'連鎖の猶予 +50%', max:3 },
  { id:'burst', icon:'✦', name:'STAR BURST', text:'撃破時に周囲へ爆発', max:1, rare:true },
  { id:'shield', icon:'⬡', name:'FIRST LIGHT', text:'各区画の最初の被弾を無効化', max:1, rare:true },
  { id:'leech', icon:'↑', name:'LIGHT SIPHON', text:'10体撃破ごとにHULLを1回復', max:1, rare:true },
  { id:'focus', icon:'◎', name:'TIDAL LOCK', text:'重力点の近くで糸の威力2倍', max:1, rare:true },
  { id:'velocity', icon:'↗', name:'RED SHIFT', text:'最高速度 +20%、速度倍率上昇', max:3 }
]);

export function upgradeChoices(random, levels = {}, count = 3) {
  const pool = UPGRADES.filter(item => (levels[item.id] || 0) < item.max).map(item => ({...item}));
  const result = [];
  while (pool.length && result.length < count) {
    const weights = pool.map(item => item.rare ? .45 : 1);
    let roll = random.next() * weights.reduce((a,b) => a+b, 0);
    let index = 0;
    for (; index < pool.length - 1; index += 1) { roll -= weights[index]; if (roll <= 0) break; }
    result.push(pool.splice(index, 1)[0]);
  }
  return result;
}
