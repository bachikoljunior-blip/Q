import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DEFAULT_SAVE,
  GUARDIANS,
  SAVE_KEY,
  SAVE_VERSION,
  WORLD_HALF,
  biomeAt,
  canEnterCrown,
  characterTaskFor,
  cleanSave,
  endingFor,
  formatTime,
  grantExperience,
  herbHealingFor,
  newGame,
  narrativeSceneFor,
  objectiveFor,
  playerStats,
  questText,
  regionAt,
  respawnCoinLossFor,
  rng,
  terrainHeight,
  xpForLevel
} from '../src/core.js';
import { load, reset, save } from '../src/storage.js';

test('seeded generation and terrain are deterministic and bounded', () => {
  const a = rng(42), b = rng(42);
  assert.deepEqual(Array.from({ length: 32 }, () => a.next()), Array.from({ length: 32 }, () => b.next()));
  const samples = [[0, 0], [-410, -245], [500, -420], [535, 430], [WORLD_HALF - 1, 0]];
  for (const [x, z] of samples) {
    assert.equal(terrainHeight(x, z), terrainHeight(x, z));
    assert.ok(Number.isFinite(terrainHeight(x, z)));
    assert.ok(biomeAt(x, z)?.name);
  }
  assert.equal(regionAt(0, 270), '風見の里');
});

test('save cleaning rejects malformed progress while preserving valid RPG state', () => {
  assert.deepEqual(cleanSave(null), structuredClone(DEFAULT_SAVE));
  const clean = cleanSave({
    tutorial: 1,
    settings: { sound: false, vibration: 0, reduced: 1, quality: 'ultra' },
    progress: {
      started: true,
      story: 99,
      sigils: ['grove_warden', 'fake', 'grove_warden'],
      defeated: ['grove_warden', 'fake'],
      discovered: ['haven', 'cave', 'fake'],
      collected: ['herb_1', 'crystal_14', 'invalid', 'herb_1'],
      choices: { grove: 'copied_ending' },
      level: 500,
      xp: -10,
      coins: '91',
      upgrades: { vigor: 9, edge: 2.7, stride: -4 },
      health: Infinity,
      x: 9000,
      z: -9000
    }
  });
  assert.equal(clean.progress.story, 1, 'story is rebuilt from coherent defeated and choice state');
  assert.deepEqual(clean.progress.sigils, ['grove_warden']);
  assert.deepEqual(clean.progress.collected, ['herb_1', 'crystal_14']);
  assert.deepEqual(clean.progress.choices, { grove: '', marsh: '', peak: '' });
  assert.deepEqual(clean.progress.npcFlags, { orinIntro: false, groveReport: false, marshReport: false, ilyaTruth: false });
  assert.deepEqual(clean.progress.characterQuests, { mira: 0, orin: 0, ilya: 0 });
  assert.deepEqual(clean.progress.relationships, { mira: 0, orin: 0, ilya: 0 });
  assert.equal(clean.version, SAVE_VERSION);
  assert.equal(clean.progress.level, 40);
  assert.equal(clean.progress.x, WORLD_HALF - 20);
  assert.equal(clean.progress.z, -WORLD_HALF + 20);
  assert.deepEqual(clean.settings, { sound: false, vibration: true, reduced: true, quality: 'auto' });
  const forged = cleanSave({ progress: {
    story: 3,
    choices: { grove: 'wild_bloom', marsh: 'ring_release', peak: 'wind_release' },
    sigils: GUARDIANS.map(item => item.id),
    defeated: ['crown_warden'],
    victory: true,
    ending: 'wild'
  } });
  assert.deepEqual(forged.progress.choices, { grove: '', marsh: '', peak: '' }, 'choices cannot manufacture guardian completion');
  assert.deepEqual(forged.progress.sigils, [], 'sigils without matching defeated guardians are rejected');
  assert.deepEqual(forged.progress.defeated, [], 'the final encounter cannot bypass guardian completion');
  assert.equal(forged.progress.victory, false);
  assert.equal(forged.progress.ending, '');
  assert.equal(forged.progress.story, 0);
  const migratedV3 = cleanSave({
    version: 3,
    progress: {
      started: true,
      story: 2,
      defeated: GUARDIANS.map(item => item.id),
      sigils: GUARDIANS.map(item => item.id),
      choices: { grove: 'wild_bloom', marsh: 'ring_release', peak: 'wind_release' }
    }
  });
  assert.deepEqual(migratedV3.progress.npcFlags, { orinIntro: false, groveReport: true, marshReport: true, ilyaTruth: true }, 'version 3 completed routes retain crown access after migration');
  assert.deepEqual(migratedV3.progress.characterQuests, { mira: 3, orin: 3, ilya: 3 }, 'completed legacy character beats migrate to resolved quest stages');
  assert.deepEqual(migratedV3.progress.relationships, { mira: 2, orin: 2, ilya: 2 }, 'legacy completion receives a neutral preserved relationship baseline');
  assert.equal(canEnterCrown(migratedV3.progress), true);
});

test('RPG growth and objective progression remain coherent', () => {
  let progress = newGame(DEFAULT_SAVE).progress;
  const base = playerStats(progress);
  progress.upgrades.vigor = 2;
  progress.upgrades.edge = 1;
  progress.upgrades.stride = 3;
  const upgraded = playerStats(progress);
  assert.equal(upgraded.maxHealth, base.maxHealth + 44);
  assert.equal(upgraded.power, base.power + 5);
  assert.ok(upgraded.speed > base.speed);
  assert.equal(upgraded.dodgeCost, 24);
  progress.choices.grove = 'wild_bloom';
  assert.equal(playerStats(progress).maxStamina, upgraded.maxStamina + 16);
  assert.equal(herbHealingFor(progress), 30);
  progress.choices.marsh = 'water_ward';
  assert.equal(playerStats(progress).maxHealth, upgraded.maxHealth + 18);
  progress.choices.peak = 'wind_release';
  assert.equal(playerStats(progress).speed, upgraded.speed + 1.5);
  progress.choices.grove = 'haven_ward';
  progress.relationships.mira = 2;
  assert.equal(playerStats(progress).dodgeCost, 22);
  progress.relationships.mira = 3;
  assert.equal(playerStats(progress).dodgeCost, 20);
  progress.coins = 200;
  assert.equal(respawnCoinLossFor(progress), 10);
  assert.equal(objectiveFor(progress).label, 'ミラと話す');
  progress.story = 1;
  assert.equal(objectiveFor(progress).id, 'grove');
  progress.defeated = ['grove_warden'];
  progress.sigils = ['grove_warden'];
  progress.choices.grove = '';
  assert.equal(objectiveFor(progress).label, '森の印の行方を決める');
  assert.equal(questText(progress).step, '選択');
  progress.choices.grove = 'wild_bloom';
  assert.equal(narrativeSceneFor(progress).id, 'mira_grove_scene');
  assert.equal(objectiveFor(progress).id, 'mira_grove_scene');
  assert.equal(questText(progress).step, '人物 1 / 3');
  progress.npcFlags.groveReport = true;
  progress.characterQuests.mira = 3;
  assert.equal(objectiveFor(progress).id, 'marsh');
  progress.sigils = GUARDIANS.map(item => item.id);
  progress.choices.grove = '';
  assert.equal(canEnterCrown(progress), false, 'the ending cannot bypass the unresolved grove decision');
  progress.choices.grove = 'wild_bloom';
  progress.choices.marsh = 'ring_release';
  progress.choices.peak = 'wind_release';
  progress.defeated = GUARDIANS.map(item => item.id);
  progress.characterQuests.mira = 3;
  assert.equal(objectiveFor(progress).id, 'orin_marsh_scene');
  assert.equal(canEnterCrown(progress), false, 'the final encounter waits for visible character aftermath scenes');
  progress.npcFlags.marshReport = true;
  progress.characterQuests.orin = 3;
  assert.equal(objectiveFor(progress).id, 'ilya_echo');
  assert.equal(canEnterCrown(progress), false);
  progress.npcFlags.ilyaTruth = true;
  progress.characterQuests.ilya = 3;
  assert.equal(canEnterCrown(progress), true);
  assert.equal(endingFor(progress), 'wild');
  progress.choices.peak = 'wind_ward';
  assert.equal(endingFor(progress), 'covenant');
  assert.equal(objectiveFor(progress).id, 'crown');
  assert.equal(questText(progress).step, '最終章');
  const gained = grantExperience(progress, xpForLevel(1) + xpForLevel(2) + 5);
  assert.equal(gained.levels, 2);
  assert.equal(gained.progress.level, 3);
});

test('character quest planner returns only the next coherent staged task', () => {
  const progress = structuredClone(DEFAULT_SAVE.progress);
  progress.started = true;
  progress.story = 1;
  progress.defeated.push('grove_warden');
  progress.sigils.push('grove_warden');
  progress.choices.grove = 'wild_bloom';
  assert.deepEqual(characterTaskFor(progress), { id: 'mira_grove_scene', character: 'mira', stage: 0, label: '倒れた柵でミラと話す', x: -77.2, z: 238.8 });
  progress.characterQuests.mira = 1;
  assert.equal(characterTaskFor(progress).id, 'mira_scout_trace');
  progress.characterQuests.mira = 3;
  progress.defeated.push('marsh_warden');
  progress.sigils.push('marsh_warden');
  progress.choices.marsh = 'water_ward';
  assert.equal(characterTaskFor(progress).id, 'orin_marsh_scene');
  progress.characterQuests.orin = 3;
  progress.defeated.push('peak_warden');
  progress.sigils.push('peak_warden');
  progress.choices.peak = 'wind_release';
  assert.equal(characterTaskFor(progress).id, 'ilya_echo');
  progress.characterQuests.ilya = 3;
  assert.equal(characterTaskFor(progress), null);
});

test('storage migrates safely and tolerates corrupt or unavailable data', () => {
  const values = new Map();
  const storage = { getItem: key => values.get(key) || null, setItem: (key, value) => values.set(key, value), removeItem: key => values.delete(key) };
  const sample = cleanSave({ progress: { started: true, coins: 77 } });
  save(sample, storage);
  assert.equal(load(storage).progress.coins, 77);
  values.set(SAVE_KEY, '{bad');
  assert.deepEqual(load(storage), structuredClone(DEFAULT_SAVE));
  values.clear();
  values.set('q-starthread-save', '{"best":100}');
  assert.equal(load(storage).tutorial, true, 'legacy save grants returning-player tutorial bypass without importing incompatible state');
  const blocked = { getItem() { throw new Error('blocked'); }, setItem() { throw new Error('blocked'); }, removeItem() { throw new Error('blocked'); } };
  assert.doesNotThrow(() => save(sample, blocked));
  assert.deepEqual(load(blocked), structuredClone(DEFAULT_SAVE));
  assert.deepEqual(reset(blocked), structuredClone(DEFAULT_SAVE));
});

test('time formatting is stable for short and long journeys', () => {
  assert.equal(formatTime(0), '00:00');
  assert.equal(formatTime(125.9), '02:05');
  assert.equal(formatTime(3725), '1:02:05');
});
