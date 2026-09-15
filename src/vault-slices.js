// Two compact encounter slices share one authored contract. Slice B is added
// through the same data path after slice A proves the production route.
const ring = (center, radius = 11) => Array.from({ length: 20 }, (_, i) => {
  if (i === 0) return null; // a single readable entrance on the +z side
  const angle = i / 20 * Math.PI * 2;
  return { id: `wall-${i}`, kind: 'wall', x: center.x + Math.sin(angle) * radius, z: center.z + Math.cos(angle) * radius, r: 1.78, height: 4.8 + (i % 3) * .55 };
}).filter(Boolean);
const props = center => [
  [-6.6, -2.7, 'brazier'], [6.6, -2.7, 'brazier'], [-6.6, 3.3, 'brazier'], [6.6, 3.3, 'brazier'],
  [-3.5, -6.7, 'stele'], [3.5, -6.7, 'stele'], [-3.5, 6.5, 'stele'], [3.5, 6.5, 'stele'],
].map(([x, z, kind], index) => ({ id: `prop-${index + 1}`, kind, x: center.x + x, z: center.z + z, r: kind === 'stele' ? .58 : .48, height: kind === 'stele' ? 2.9 : 1.4 }));
function defineSlice({ id, name, en, center, theme, wardenName, result }) {
  const focus = { id: `${id}-memory`, type: 'vault-memory', vaultId: id, name: `${name}の記憶に触れる`, x: center.x, z: center.z };
  return Object.freeze({ id, name, en, center: Object.freeze(center), radius: 11.5, theme, wardenName, result, focus: Object.freeze(focus),
    warden: Object.freeze({ id: `${id}-warden`, x: center.x, z: center.z - 3.8, type: 'knight', encounter: id, vaultId: id, maxHp: 96 }),
    walls: Object.freeze(ring(center).map(Object.freeze)), props: Object.freeze(props(center).map(Object.freeze)),
    audio: Object.freeze({ ambient: `${theme}-ambient`, sfx: Object.freeze(['step', 'alert', 'swing', 'impact', 'claim', 'seal']) }),
    animationStates: Object.freeze(['guard', 'prowl', 'charge', 'release']),
  });
}

export const VAULT_SLICES = Object.freeze([
  defineSlice({ id: 'ember-vault', name: '熾火の納骨堂', en: 'EMBER OSSUARY', center: { x: 55, z: 116 }, theme: 'ember', wardenName: '熾火を抱く番兵', result: '焼けた石板から、名を失った巡礼者たちの帰路が浮かび上がった。' }),
  defineSlice({ id: 'tide-vault', name: '潮錆の水祠', en: 'TIDE-CORRODED CISTERN', center: { x: -55, z: 116 }, theme: 'tide', wardenName: '潮錆をまとう番兵', result: '濡れた石板から、灰の海を渡った巡礼者たちの航路が浮かび上がった。' }),
  defineSlice({ id: 'gale-vault', name: '風蝕の鐘庭', en: 'WIND-SCOURED BELL COURT', center: { x: 85, z: 145 }, theme: 'gale', wardenName: '風紋を刻む番兵', result: '風に磨かれた石板から、鐘を背負った巡礼者たちの足跡が浮かび上がった。' }),
  defineSlice({ id: 'moss-vault', name: '苔影の石廊', en: 'MOSS-SHADOW STONE GALLERY', center: { x: -85, z: 145 }, theme: 'moss', wardenName: '苔冠を戴く番兵', result: '苔に覆われた石板から、森へ帰った巡礼者たちの祈りが浮かび上がった。' }),
]);

export const vaultById = id => VAULT_SLICES.find(slice => slice.id === id) || null;
export const vaultByWarden = id => VAULT_SLICES.find(slice => slice.warden.id === id) || null;
export const vaultAt = point => VAULT_SLICES.find(slice => Math.hypot(point.x - slice.center.x, point.z - slice.center.z) < slice.radius) || null;
export const inVaultFootprint = point => VAULT_SLICES.some(slice => Math.hypot(point.x - slice.center.x, point.z - slice.center.z) < slice.radius + 3);
export const vaultObstacles = () => VAULT_SLICES.flatMap(slice => [...slice.walls, ...slice.props].map(item => ({ ...item, id: `${slice.id}-${item.id}`, type: `vault-${item.kind}`, vaultId: slice.id })));
export const createVaultProgress = () => Object.fromEntries(VAULT_SLICES.map(slice => [slice.id, { entered: false, claimed: false }]));

export function restoreVaultProgress(value, defeated = []) {
  const progress = createVaultProgress();
  for (const slice of VAULT_SLICES) {
    const saved = value?.[slice.id];
    if (!saved || typeof saved !== 'object' || Array.isArray(saved)) continue;
    const claimed = saved.claimed === true && defeated.includes(slice.warden.id);
    progress[slice.id].claimed = claimed;
    progress[slice.id].entered = saved.entered === true || claimed;
  }
  return progress;
}
export function availableVaultTargets(game) {
  return VAULT_SLICES.filter(slice => game.vaults[slice.id]?.entered && !game.vaults[slice.id].claimed && game.enemies.find(enemy => enemy.id === slice.warden.id)?.dead).map(slice => slice.focus);
}
export function tickVaultSlices(game) {
  const slice = vaultAt(game.player);
  if (!slice) return;
  const progress = game.vaults[slice.id];
  if (!progress.entered) { progress.entered = true; game.emit('vaultEnter', { vaultId: slice.id, name: slice.name, en: slice.en }); game.emit('save'); }
  const warden = game.enemies.find(enemy => enemy.id === slice.warden.id);
  if (warden && !warden.dead && ['chase', 'windup', 'strike'].includes(warden.state) && !game.vaultAlerts.has(slice.id)) {
    game.vaultAlerts.add(slice.id); game.emit('vaultAlert', { vaultId: slice.id, id: warden.id });
  }
}
export function claimVaultMemory(game, target) {
  const slice = vaultById(target?.vaultId), progress = slice && game.vaults[slice.id], warden = slice && game.enemies.find(enemy => enemy.id === slice.warden.id);
  if (!slice || target.id !== slice.focus.id || !progress?.entered || progress.claimed || !warden?.dead) return false;
  progress.claimed = true; game.reward(65, 55); game.player.herbs += 1;
  game.emit('vaultClaim', { vaultId: slice.id, title: slice.name, en: slice.en, text: slice.result, x: slice.focus.x, z: slice.focus.z }); game.emit('save');
  return true;
}

export function vaultAnimationState(enemy) {
  if (enemy.state === 'windup') return 'charge';
  if (enemy.state === 'strike') return 'release';
  if (['chase', 'return'].includes(enemy.state)) return 'prowl';
  return 'guard';
}
