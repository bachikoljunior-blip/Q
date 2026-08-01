export const SAVE_KEY = 'q-wildbound-save';
export const LEGACY_SAVE_KEYS = Object.freeze(['q-starthread-save']);
export const SAVE_VERSION = 5;
export const WORLD_SIZE = 1800;
export const WORLD_HALF = WORLD_SIZE / 2;
export const WATER_LEVEL = -1.6;

export const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
export const lerp = (a, b, t) => a + (b - a) * t;
export const smoothstep = (a, b, value) => {
  const t = clamp((value - a) / (b - a || 1), 0, 1);
  return t * t * (3 - 2 * t);
};
export const distance2D = (a, b) => Math.hypot(a.x - b.x, (a.z ?? a.y) - (b.z ?? b.y));

export function rng(seed = 1) {
  let state = (Number(seed) || 1) >>> 0;
  return {
    next() {
      state += 0x6d2b79f5;
      let value = state;
      value = Math.imul(value ^ value >>> 15, value | 1);
      value ^= value + Math.imul(value ^ value >>> 7, value | 61);
      return ((value ^ value >>> 14) >>> 0) / 4294967296;
    },
    int(min, max) { return Math.floor(this.next() * (max - min + 1)) + min; },
    pick(list) { return list[Math.floor(this.next() * list.length)]; },
    get state() { return state >>> 0; }
  };
}

function hash(x, z) {
  let value = Math.imul(x | 0, 374761393) + Math.imul(z | 0, 668265263);
  value = Math.imul(value ^ value >>> 13, 1274126177);
  return ((value ^ value >>> 16) >>> 0) / 4294967295;
}

export function valueNoise(x, z) {
  const xi = Math.floor(x), zi = Math.floor(z), tx = x - xi, tz = z - zi;
  const sx = tx * tx * (3 - 2 * tx), sz = tz * tz * (3 - 2 * tz);
  const a = lerp(hash(xi, zi), hash(xi + 1, zi), sx);
  const b = lerp(hash(xi, zi + 1), hash(xi + 1, zi + 1), sx);
  return lerp(a, b, sz) * 2 - 1;
}

export function fbm(x, z, octaves = 5) {
  let value = 0, amplitude = .5, frequency = 1, total = 0;
  for (let i = 0; i < octaves; i += 1) {
    value += valueNoise(x * frequency, z * frequency) * amplitude;
    total += amplitude;
    frequency *= 2.03;
    amplitude *= .5;
  }
  return value / total;
}

export function riverCenter(x) {
  return 40 + Math.sin(x * .0062) * 72 + Math.sin(x * .0021 + 1.4) * 38;
}

function flatten(height, x, z, cx, cz, radius, target) {
  const mix = 1 - smoothstep(radius * .45, radius, Math.hypot(x - cx, z - cz));
  return lerp(height, target, mix * .88);
}

export function terrainHeight(x, z) {
  const broad = fbm(x * .00165, z * .00165, 5) * 22;
  const detail = fbm(x * .0065 + 19, z * .0065 - 7, 4) * 7;
  const northeast = 1 - smoothstep(170, 780, Math.hypot(x - 520, z + 430));
  const northwest = 1 - smoothstep(120, 600, Math.hypot(x + 640, z + 570));
  const ridges = Math.abs(fbm(x * .0032 - 30, z * .0032 + 12, 4));
  let height = broad + detail + northeast * (28 + ridges * 72) + northwest * (18 + ridges * 42);

  const coast = smoothstep(500, 840, z);
  height = lerp(height, -7 + detail * .18, coast);

  const riverDistance = Math.abs(z - riverCenter(x));
  const riverCut = 1 - smoothstep(18, 67, riverDistance);
  height = lerp(height, WATER_LEVEL - 2.2, riverCut * .94);

  const marsh = 1 - smoothstep(90, 300, Math.hypot(x + 520, z - 310));
  height = lerp(height, WATER_LEVEL - .7 + detail * .06, marsh * .83);

  height = flatten(height, x, z, 0, 270, 125, 7.5);
  height = flatten(height, x, z, -410, -245, 78, 19);
  height = flatten(height, x, z, 500, -420, 72, 70);
  height = flatten(height, x, z, 535, 430, 105, 2.5);
  height = flatten(height, x, z, 0, -675, 115, 48);

  const edge = smoothstep(790, 900, Math.max(Math.abs(x), Math.abs(z)));
  return height + edge * 35;
}

export const BIOMES = Object.freeze({
  meadow: { id: 'meadow', name: '風渡りの草原', color: 0x668851, accent: 0xa9ca6a },
  forest: { id: 'forest', name: '古樹の森', color: 0x365f43, accent: 0x6f9a55 },
  wetland: { id: 'wetland', name: '霞む湿原', color: 0x46695b, accent: 0x7b9270 },
  highland: { id: 'highland', name: '白嶺山地', color: 0x657064, accent: 0xa7a88b },
  coast: { id: 'coast', name: '蒼波海岸', color: 0x8d8563, accent: 0xc2ad76 },
  river: { id: 'river', name: '銀脈川', color: 0x496f5a, accent: 0x80aa7a },
  ruins: { id: 'ruins', name: '沈黙の遺構', color: 0x596653, accent: 0x8d916c }
});

export function biomeAt(x, z) {
  const height = terrainHeight(x, z);
  if (z > 570) return BIOMES.coast;
  if (Math.abs(z - riverCenter(x)) < 72) return BIOMES.river;
  if (Math.hypot(x + 520, z - 310) < 285) return BIOMES.wetland;
  if (height > 48 || Math.hypot(x - 500, z + 430) < 330) return BIOMES.highland;
  if (Math.hypot(x - 535, z - 430) < 165 || Math.hypot(x, z + 675) < 150) return BIOMES.ruins;
  const forest = fbm(x * .0042 + 6, z * .0042 - 14, 4);
  if (forest > -.04 || Math.hypot(x + 410, z + 245) < 290) return BIOMES.forest;
  return BIOMES.meadow;
}

export const WORLD_POINTS = Object.freeze([
  { id: 'haven', type: 'settlement', label: '風見の里', x: 0, z: 270, description: '旅人が集う小さな山里' },
  { id: 'grove', type: 'sigil', label: '古樹の聖域', x: -410, z: -245, description: '森の記憶が眠る場所' },
  { id: 'marsh', type: 'sigil', label: '水没した鐘楼', x: -520, z: 310, description: '霧と葦に沈んだ祈りの跡' },
  { id: 'peak', type: 'sigil', label: '白嶺の祭壇', x: 500, z: -420, description: '雲を見下ろす風の祭壇' },
  { id: 'coast', type: 'ruin', label: '潮騒の廃都', x: 535, z: 430, description: '海へ崩れ落ちた旧王都' },
  { id: 'cave', type: 'cave', label: '根喰らいの洞', x: 360, z: 70, description: '地中深く続く鉱石洞' },
  { id: 'crown', type: 'final', label: '空環の神殿', x: 0, z: -675, description: '谷を覆う眠りの中心' }
]);

export const GUARDIANS = Object.freeze([
  { id: 'grove_warden', point: 'grove', name: '苔角の守り手', type: 'warden', sigil: '森の印' },
  { id: 'marsh_warden', point: 'marsh', name: '沼影の獣', type: 'stalker', sigil: '水の印' },
  { id: 'peak_warden', point: 'peak', name: '白嶺の番人', type: 'sentinel', sigil: '風の印' }
]);

export const CONSEQUENCE_CHOICES = Object.freeze({
  grove: Object.freeze({
    haven_ward: Object.freeze({ id: 'haven_ward', alignment: 'bind', label: '里へ分ける', detail: '森の印を風見の里の護りにも使う', journal: '森の印を里の護りに分けた。倒れた時に失う木の葉貨が少なくなる。', ending: '森の印は風見の里の灯となり、夜の境を守り続けた。' }),
    wild_bloom: Object.freeze({ id: 'wild_bloom', alignment: 'restore', label: '森へ還す', detail: '森の印を人の手から離し、大地へ戻す', journal: '森の印を大地へ還した。月露草の回復量と最大気力が増える。', ending: '森の印は古樹の根へ還り、失われた若木が谷に芽吹いた。' })
  }),
  marsh: Object.freeze({
    water_ward: Object.freeze({ id: 'water_ward', alignment: 'bind', label: '水門を閉じる', detail: '水を里へ蓄え、次の乾季と火災に備える', journal: '水の印を里の水門へ結んだ。最大生命力が増えたが、沈んだ鐘の声は霧に残った。', ending: '満ちた井戸は里を救い、霧の奥では名を呼ぶ鐘が鳴り続けた。' }),
    ring_release: Object.freeze({ id: 'ring_release', alignment: 'restore', label: '鐘を鳴らす', detail: '水を本来の流れへ返し、失われた名を谷へ響かせる', journal: '沈んだ鐘を鳴らし、水を海へ返した。里は新しい水路を掘り、湿原には星空が戻った。', ending: '澄んだ湿原は失われた名を映し、里の人々は自ら水路を築き直した。' })
  }),
  peak: Object.freeze({
    wind_ward: Object.freeze({ id: 'wind_ward', alignment: 'bind', label: '風を束ねる', detail: '静かな空を守るため、印の一部を結界へ残す', journal: '風の印を結界へ残した。剣に風圧が宿り、峰の雲は出口を探して渦巻いた。', ending: '里の灯は揺れず、あなたの刃が引き受けた風だけが遠く唸った。' }),
    wind_release: Object.freeze({ id: 'wind_release', alignment: 'restore', label: '風を放つ', detail: '嵐も恵みも谷へ返し、人々の手で季節を迎える', journal: '風を谷へ放った。足取りは軽くなり、里の人々は屋根を押さえながら久しい空を見上げた。', ending: '強い季節風が帰り、里は倒れては直す生き方をもう一度選んだ。' })
  })
});

export const GROVE_CHOICES = CONSEQUENCE_CHOICES.grove;

export const NARRATIVE_SCENES = Object.freeze({
  grove: Object.freeze({ id: 'mira_grove_scene', character: 'mira', label: '倒れた柵でミラと話す', x: -77.2, z: 238.8 }),
  marsh: Object.freeze({ id: 'orin_marsh_scene', character: 'orin', label: '水路でオリンと話す', x: 80.2, z: 307.8 }),
  ilya: Object.freeze({ id: 'ilya_echo', character: 'ilya', label: '神殿前でイリヤの残響に触れる', x: 0, z: -615 })
});

export const CHARACTER_TASKS = Object.freeze({
  mira: Object.freeze([
    Object.freeze({ id: 'mira_grove_scene', character: 'mira', stage: 0, label: '倒れた柵でミラと話す', x: -77.2, z: 238.8 }),
    Object.freeze({ id: 'mira_scout_trace', character: 'mira', stage: 1, label: '古樹の境で斥候の印を探す', x: -430, z: -180 }),
    Object.freeze({ id: 'mira_grove_scene', character: 'mira', stage: 2, label: '見つけた印をミラへ渡す', x: -77.2, z: 238.8 })
  ]),
  orin: Object.freeze([
    Object.freeze({ id: 'orin_marsh_scene', character: 'orin', stage: 0, label: '水路でオリンと話す', x: 80.2, z: 307.8 }),
    Object.freeze({ id: 'orin_sluice_fault', character: 'orin', stage: 1, label: '旧水路の詰まりを調べる', x: -220, z: 350 }),
    Object.freeze({ id: 'orin_marsh_scene', character: 'orin', stage: 2, label: '水路の様子をオリンへ伝える', x: 80.2, z: 307.8 })
  ]),
  ilya: Object.freeze([
    Object.freeze({ id: 'ilya_echo', character: 'ilya', stage: 0, label: '神殿前でイリヤの残響に触れる', x: 0, z: -615 }),
    Object.freeze({ id: 'ilya_archive_echo', character: 'ilya', stage: 1, label: '潮騒の廃都で古い記録を探す', x: 535, z: 430 }),
    Object.freeze({ id: 'ilya_echo', character: 'ilya', stage: 2, label: '記録をイリヤの残響へ届ける', x: 0, z: -615 })
  ])
});

export function characterTaskFor(progress) {
  const p = progress || {};
  const choices = p.choices || {};
  const stages = p.characterQuests || {};
  const flags = p.npcFlags || {};
  const defeated = new Set(p.defeated || []);
  const hasStages = Boolean(p.characterQuests);
  const miraComplete = (stages.mira || 0) >= 3 || (!hasStages && flags.groveReport);
  const orinComplete = (stages.orin || 0) >= 3 || (!hasStages && flags.marshReport);
  const ilyaComplete = (stages.ilya || 0) >= 3 || (!hasStages && flags.ilyaTruth);
  if (choices.grove && defeated.has('grove_warden') && !miraComplete) {
    return CHARACTER_TASKS.mira[clamp(integer(stages.mira), 0, 2)];
  }
  if (miraComplete && choices.marsh && defeated.has('marsh_warden') && !orinComplete) {
    return CHARACTER_TASKS.orin[clamp(integer(stages.orin), 0, 2)];
  }
  const allGuardians = GUARDIANS.every(guardian => choices[guardian.point] && defeated.has(guardian.id));
  if (allGuardians && miraComplete && orinComplete && !ilyaComplete) {
    return CHARACTER_TASKS.ilya[clamp(integer(stages.ilya), 0, 2)];
  }
  return null;
}

export function narrativeSceneFor(progress) {
  if (progress?.characterQuests) return characterTaskFor(progress);
  const choices = progress?.choices || {};
  const flags = progress?.npcFlags || {};
  const defeated = new Set(progress?.defeated || []);
  const groveComplete = Boolean(choices.grove && defeated.has('grove_warden'));
  const marshComplete = Boolean(choices.marsh && defeated.has('marsh_warden'));
  const peakComplete = Boolean(choices.peak && defeated.has('peak_warden'));
  if (groveComplete && !flags.groveReport) return NARRATIVE_SCENES.grove;
  if (marshComplete && !flags.marshReport) return NARRATIVE_SCENES.marsh;
  if (groveComplete && marshComplete && peakComplete && flags.groveReport && flags.marshReport && !flags.ilyaTruth) return NARRATIVE_SCENES.ilya;
  return null;
}

const DEFAULT_PROGRESS = Object.freeze({
  started: false,
  story: 0,
  sigils: [],
  defeated: [],
  discovered: ['haven'],
  level: 1,
  xp: 0,
  coins: 0,
  herbs: 0,
  crystals: 0,
  collected: [],
  choices: { grove: '', marsh: '', peak: '' },
  pendingChoice: null,
  ending: '',
  npcFlags: { orinIntro: false, groveReport: false, marshReport: false, ilyaTruth: false },
  characterQuests: { mira: 0, orin: 0, ilya: 0 },
  relationships: { mira: 0, orin: 0, ilya: 0 },
  upgrades: { vigor: 0, edge: 0, stride: 0 },
  health: 100,
  x: 0,
  z: 330,
  yaw: 0,
  playTime: 0,
  victory: false,
  endings: 0,
  lastSaved: 0
});

export const DEFAULT_SAVE = Object.freeze({
  version: SAVE_VERSION,
  tutorial: false,
  settings: { sound: true, vibration: true, reduced: false, quality: 'auto' },
  progress: DEFAULT_PROGRESS
});

const finite = (value, fallback = 0) => Number.isFinite(Number(value)) ? Number(value) : fallback;
const integer = (value, fallback = 0) => Math.max(0, Math.floor(finite(value, fallback)));
const unique = (value, allowed) => [...new Set(Array.isArray(value) ? value.filter(item => allowed.includes(item)) : [])];
const resourceIds = Object.freeze([
  ...Array.from({ length: 24 }, (_, index) => `herb_${index}`),
  ...Array.from({ length: 15 }, (_, index) => `crystal_${index}`),
  'cave_mine'
]);

export function playerStats(progress) {
  const p = progress || DEFAULT_PROGRESS;
  const level = clamp(integer(p.level, 1), 1, 40);
  const upgrades = p.upgrades || {};
  return {
    maxHealth: 100 + (level - 1) * 9 + integer(upgrades.vigor) * 22 + (p.choices?.marsh === 'water_ward' ? 18 : 0),
    power: 18 + (level - 1) * 2.4 + integer(upgrades.edge) * 5 + (p.choices?.peak === 'wind_ward' ? 4 : 0),
    speed: 15.5 + integer(upgrades.stride) * 1.25 + (p.choices?.peak === 'wind_release' ? 1.5 : 0),
    maxStamina: 100 + integer(upgrades.stride) * 12 + (p.choices?.grove === 'wild_bloom' ? 16 : 0),
    dodgeCost: p.relationships?.mira >= 3 ? 20 : p.relationships?.mira >= 2 ? 22 : 24,
    attackCooldown: p.relationships?.ilya >= 3 ? .42 : p.relationships?.ilya >= 2 ? .45 : .48
  };
}

export function herbHealingFor(progress) {
  return progress?.choices?.grove === 'wild_bloom' ? 30 : 18;
}

export function respawnCoinLossFor(progress) {
  const coins = integer(progress?.coins);
  return progress?.choices?.grove === 'haven_ward'
    ? Math.min(10, Math.floor(coins * .05))
    : Math.min(25, Math.floor(coins * .12));
}

export function upgradeCostFor(progress, kind) {
  const level = clamp(integer(progress?.upgrades?.[kind]), 0, 5);
  const trust = clamp(integer(progress?.relationships?.orin), 0, 3);
  return {
    crystalCost: level + 1,
    coinCost: Math.max(15, 25 + level * 25 - trust * 5)
  };
}

export function canEnterCrown(progress) {
  return GUARDIANS.every(guardian => progress?.sigils?.includes(guardian.id) && Boolean(progress?.choices?.[guardian.point]))
    && ['mira', 'orin', 'ilya'].every(character => (progress?.characterQuests?.[character] || 0) >= 3)
    && Boolean(progress?.npcFlags?.groveReport && progress?.npcFlags?.marshReport && progress?.npcFlags?.ilyaTruth);
}

export function cleanSave(raw) {
  if (!raw || typeof raw !== 'object') return structuredClone(DEFAULT_SAVE);
  const settings = raw.settings && typeof raw.settings === 'object' ? raw.settings : {};
  const source = raw.progress && typeof raw.progress === 'object' ? raw.progress : {};
  const sourceVersion = integer(raw.version);
  const pointIds = WORLD_POINTS.map(point => point.id);
  const defeatedIds = [...GUARDIANS.map(item => item.id), 'crown_warden'];
  const progress = {
    started: Boolean(source.started),
    story: clamp(integer(source.story), 0, 3),
    sigils: unique(source.sigils, GUARDIANS.map(item => item.id)),
    defeated: unique(source.defeated, defeatedIds),
    discovered: unique(source.discovered, pointIds),
    level: clamp(integer(source.level, 1), 1, 40),
    xp: integer(source.xp),
    coins: integer(source.coins),
    herbs: integer(source.herbs),
    crystals: integer(source.crystals),
    collected: unique(source.collected, resourceIds),
    choices: Object.fromEntries(Object.entries(CONSEQUENCE_CHOICES).map(([point, options]) => [point, Object.prototype.hasOwnProperty.call(options, source.choices?.[point]) ? source.choices[point] : ''])),
    pendingChoice: GUARDIANS.some(item => item.id === source.pendingChoice) ? source.pendingChoice : null,
    ending: ['', 'wild', 'covenant', 'bastion'].includes(source.ending) ? source.ending : '',
    npcFlags: {
      orinIntro: Boolean(source.npcFlags?.orinIntro),
      groveReport: Boolean(source.npcFlags?.groveReport),
      marshReport: Boolean(source.npcFlags?.marshReport),
      ilyaTruth: Boolean(source.npcFlags?.ilyaTruth)
    },
    characterQuests: {
      mira: clamp(integer(source.characterQuests?.mira), 0, 3),
      orin: clamp(integer(source.characterQuests?.orin), 0, 3),
      ilya: clamp(integer(source.characterQuests?.ilya), 0, 3)
    },
    relationships: {
      mira: clamp(integer(source.relationships?.mira), 0, 3),
      orin: clamp(integer(source.relationships?.orin), 0, 3),
      ilya: clamp(integer(source.relationships?.ilya), 0, 3)
    },
    upgrades: {
      vigor: clamp(integer(source.upgrades?.vigor), 0, 5),
      edge: clamp(integer(source.upgrades?.edge), 0, 5),
      stride: clamp(integer(source.upgrades?.stride), 0, 5)
    },
    health: Math.max(1, finite(source.health, 100)),
    x: clamp(finite(source.x, 0), -WORLD_HALF + 20, WORLD_HALF - 20),
    z: clamp(finite(source.z, 330), -WORLD_HALF + 20, WORLD_HALF - 20),
    yaw: finite(source.yaw, 0),
    playTime: Math.max(0, finite(source.playTime)),
    victory: Boolean(source.victory),
    endings: integer(source.endings),
    lastSaved: integer(source.lastSaved)
  };
  progress.sigils = progress.sigils.filter(id => progress.defeated.includes(id));
  for (const guardian of GUARDIANS) {
    const defeated = progress.defeated.includes(guardian.id);
    if (!defeated) progress.choices[guardian.point] = '';
    if (defeated && progress.choices[guardian.point] && !progress.sigils.includes(guardian.id)) progress.sigils.push(guardian.id);
  }
  if (sourceVersion > 0 && sourceVersion < SAVE_VERSION) {
    progress.npcFlags.groveReport ||= Boolean(progress.choices.grove);
    progress.npcFlags.marshReport ||= Boolean(progress.choices.marsh);
    progress.npcFlags.ilyaTruth ||= Boolean(progress.choices.grove && progress.choices.marsh && progress.choices.peak);
    progress.characterQuests.mira = progress.npcFlags.groveReport ? 3 : 0;
    progress.characterQuests.orin = progress.npcFlags.marshReport ? 3 : 0;
    progress.characterQuests.ilya = progress.npcFlags.ilyaTruth ? 3 : 0;
    progress.relationships.mira = progress.npcFlags.groveReport ? 2 : 0;
    progress.relationships.orin = progress.npcFlags.marshReport ? 2 : 0;
    progress.relationships.ilya = progress.npcFlags.ilyaTruth ? 2 : 0;
  }
  if (!progress.choices.grove) {
    progress.npcFlags.groveReport = false;
    progress.characterQuests.mira = 0;
    progress.relationships.mira = 0;
  }
  if (!progress.choices.marsh) {
    progress.npcFlags.marshReport = false;
    progress.characterQuests.orin = 0;
    progress.relationships.orin = 0;
  }
  if (!(progress.choices.grove && progress.choices.marsh && progress.choices.peak && progress.npcFlags.groveReport && progress.npcFlags.marshReport)) {
    progress.npcFlags.ilyaTruth = false;
    progress.characterQuests.ilya = 0;
    progress.relationships.ilya = 0;
  }
  if (progress.characterQuests.mira < 3) progress.relationships.mira = 0;
  if (progress.characterQuests.orin < 3) progress.relationships.orin = 0;
  if (progress.characterQuests.ilya < 3) {
    progress.relationships.ilya = 0;
    progress.npcFlags.ilyaTruth = false;
  }
  const finalDefeated = canEnterCrown(progress) && progress.defeated.includes('crown_warden');
  if (!finalDefeated) progress.defeated = progress.defeated.filter(id => id !== 'crown_warden');
  progress.victory = finalDefeated;
  progress.ending = finalDefeated ? endingFor(progress) : '';
  progress.endings = finalDefeated ? Math.max(1, progress.endings) : 0;
  progress.story = finalDefeated ? 3 : progress.sigils.length >= 3 ? 2 : progress.sigils.length ? 1 : progress.started ? clamp(progress.story, 0, 1) : 0;
  const unresolved = GUARDIANS.find(guardian => progress.defeated.includes(guardian.id) && !progress.choices[guardian.point]);
  progress.pendingChoice = unresolved?.id || null;
  const stats = playerStats(progress);
  progress.health = clamp(progress.health, 1, stats.maxHealth);
  if (!progress.discovered.includes('haven')) progress.discovered.unshift('haven');
  return {
    version: SAVE_VERSION,
    tutorial: Boolean(raw.tutorial),
    settings: {
      sound: settings.sound !== false,
      vibration: settings.vibration !== false,
      reduced: Boolean(settings.reduced),
      quality: ['auto', 'high', 'low'].includes(settings.quality) ? settings.quality : 'auto'
    },
    progress
  };
}

export function newGame(save) {
  const clean = cleanSave(save);
  return cleanSave({ ...clean, progress: structuredClone(DEFAULT_PROGRESS) });
}

export function xpForLevel(level) {
  return 85 + Math.max(0, level - 1) * 55;
}

export function grantExperience(progress, amount) {
  const next = structuredClone(progress);
  next.xp += integer(amount);
  let levels = 0;
  while (next.level < 40 && next.xp >= xpForLevel(next.level)) {
    next.xp -= xpForLevel(next.level);
    next.level += 1;
    levels += 1;
  }
  if (levels) next.health = playerStats(next).maxHealth;
  return { progress: next, levels };
}

export function objectiveFor(progress) {
  const p = progress || DEFAULT_PROGRESS;
  if (p.story === 0) return { ...WORLD_POINTS[0], x: -8, z: 264, label: 'ミラと話す' };
  if (p.pendingChoice) {
    const guardian = GUARDIANS.find(item => item.id === p.pendingChoice);
    const point = WORLD_POINTS.find(item => item.id === guardian?.point) || WORLD_POINTS[0];
    return { ...point, label: `${guardian?.sigil || '印'}の行く先を決める` };
  }
  const narrative = narrativeSceneFor(p);
  if (narrative) return { ...narrative };
  const unresolved = GUARDIANS.find(guardian => p.defeated?.includes(guardian.id) && !p.choices?.[guardian.point]);
  if (unresolved) return { ...WORLD_POINTS.find(item => item.id === unresolved.point), label: `${unresolved.sigil}の行方を決める` };
  const missing = GUARDIANS.find(guardian => !p.sigils.includes(guardian.id));
  if (missing) {
    const point = WORLD_POINTS.find(item => item.id === missing.point);
    return { ...point, label: `${missing.sigil}を取り戻す` };
  }
  if (!p.victory) return { ...WORLD_POINTS.find(item => item.id === 'crown'), label: '空環の神殿へ向かう' };
  return { ...WORLD_POINTS[0], label: '風見の里へ帰る' };
}

export function questText(progress) {
  const p = progress || DEFAULT_PROGRESS;
  if (p.pendingChoice) {
    const guardian = GUARDIANS.find(item => item.id === p.pendingChoice);
    return { title: '大地の答え', detail: `${guardian.sigil}の行く先を決める`, step: '選択' };
  }
  if (p.story === 0) return { title: '谷に目覚めて', detail: '風見の里で斥候ミラを探す', step: '0 / 3' };
  const narrative = narrativeSceneFor(p);
  if (narrative) {
    const titles = { mira: '森のあとで', orin: '水のあとで', ilya: '残された声' };
    return { title: titles[narrative.character], detail: narrative.label, step: Number.isInteger(narrative.stage) ? `人物 ${narrative.stage + 1} / 3` : '人物' };
  }
  const unresolved = GUARDIANS.find(guardian => p.defeated?.includes(guardian.id) && !p.choices?.[guardian.point]);
  if (unresolved) return { title: '大地の答え', detail: `${unresolved.sigil}の行く先を決める`, step: '選択' };
  if (p.sigils.length < 3) return { title: '眠れる大地', detail: '三つの自然の印を取り戻す', step: `${p.sigils.length} / 3` };
  if (!p.victory) return { title: '空を縛るもの', detail: '空環の神殿で谷の眠りを断つ', step: '最終章' };
  return { title: '新しい朝', detail: '蘇った谷を自由に旅する', step: '完了' };
}

export function endingFor(progress) {
  const choices = Object.entries(progress?.choices || {}).map(([point, choice]) => CONSEQUENCE_CHOICES[point]?.[choice]?.alignment).filter(Boolean);
  if (choices.length < 3) return '';
  if (choices.every(choice => choice === 'restore')) return 'wild';
  if (choices.every(choice => choice === 'bind')) return 'bastion';
  return 'covenant';
}

export function regionAt(x, z) {
  let nearest = null;
  for (const point of WORLD_POINTS) {
    const distance = Math.hypot(x - point.x, z - point.z);
    if (distance < 105 && (!nearest || distance < nearest.distance)) nearest = { point, distance };
  }
  return nearest ? nearest.point.label : biomeAt(x, z).name;
}

export function formatNumber(value) {
  return Math.max(0, Math.floor(value)).toLocaleString('ja-JP');
}

export function formatTime(value) {
  const seconds = Math.max(0, Math.floor(value));
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor(seconds % 3600 / 60);
  const rest = seconds % 60;
  return hours ? `${hours}:${String(minutes).padStart(2, '0')}:${String(rest).padStart(2, '0')}` : `${String(minutes).padStart(2, '0')}:${String(rest).padStart(2, '0')}`;
}
