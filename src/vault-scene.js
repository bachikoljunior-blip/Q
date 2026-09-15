import * as T from 'three';
import { VAULT_SLICES, vaultAnimationState, vaultByWarden } from './vault-slices.js';

const box = new T.BoxGeometry(1, 1, 1), cylinder = new T.CylinderGeometry(1, 1, 1, 10), crystal = new T.OctahedronGeometry(1, 0);
const styles = Object.freeze({
  ember: Object.freeze({ stone: 0x633b32, accent: 0xe2763f, emissive: 0x8b321b, light: 0xff8448, warden: 0xa84b2d, wardenAccent: 0xff9b52 }),
  tide: Object.freeze({ stone: 0x315f67, accent: 0x72d2cb, emissive: 0x235d62, light: 0x76e4dd, warden: 0x3a8e96, wardenAccent: 0x8ef4e7 }),
  gale: Object.freeze({ stone: 0x4c5866, accent: 0xcde0d5, emissive: 0x536d71, light: 0xd9fff1, warden: 0x71869a, wardenAccent: 0xe4fff4 }),
  moss: Object.freeze({ stone: 0x3a533c, accent: 0xabca74, emissive: 0x405f36, light: 0xd7f5a1, warden: 0x527754, wardenAccent: 0xd8f29d }),
});
const mesh = (geometry, material, parent, position = [0, 0, 0], scale = [1, 1, 1]) => {
  const item = new T.Mesh(geometry, material); item.position.set(...position); item.scale.set(...scale); item.castShadow = true; item.receiveShadow = true; parent.add(item); return item;
};
const standard = (color, extra = {}) => new T.MeshStandardMaterial({ color, roughness: .78, ...extra });
function terrainFloor(slice, groundAt, baseY) {
  const segments = 48, rings = 8, positions = [slice.center.x, groundAt(slice.center.x, slice.center.z) - baseY + .04, slice.center.z], uvs = [.5, .5], indices = [];
  for (let ring = 1; ring <= rings; ring++) for (let segment = 0; segment < segments; segment++) {
    const angle = segment / segments * Math.PI * 2, radius = 10.8 * ring / rings, x = slice.center.x + Math.sin(angle) * radius, z = slice.center.z + Math.cos(angle) * radius;
    positions.push(x, groundAt(x, z) - baseY + .04, z); uvs.push(.5 + Math.sin(angle) * ring / rings * .5, .5 + Math.cos(angle) * ring / rings * .5);
  }
  for (let segment = 0; segment < segments; segment++) indices.push(0, 1 + segment, 1 + (segment + 1) % segments);
  for (let ring = 1; ring < rings; ring++) for (let segment = 0; segment < segments; segment++) {
    const a = 1 + (ring - 1) * segments + segment, b = 1 + (ring - 1) * segments + (segment + 1) % segments, c = 1 + ring * segments + segment, d = 1 + ring * segments + (segment + 1) % segments;
    indices.push(a, c, b, b, c, d);
  }
  const geometry = new T.BufferGeometry(); geometry.setAttribute('position', new T.Float32BufferAttribute(positions, 3)); geometry.setAttribute('uv', new T.Float32BufferAttribute(uvs, 2)); geometry.setIndex(indices); geometry.computeVertexNormals(); return geometry;
}

export class VaultScene {
  constructor(scene, game, groundAt, textures = {}) {
    this.groups = new Map(); this.altars = new Map();
    for (const slice of VAULT_SLICES) {
      const group = new T.Group(), y = groundAt(slice.center.x, slice.center.z); group.position.set(0, y, 0); group.userData.vaultId = slice.id; scene.add(group);
      const style = styles[slice.theme], texture = textures[slice.theme], stone = standard(style.stone, texture ? { map: texture } : {}), dark = standard(0x252a2d), accent = standard(style.accent, { emissive: style.emissive, emissiveIntensity: 1.5 });
      const floor = mesh(terrainFloor(slice, groundAt, y), stone, group); floor.userData.assetRole = 'terrain-floor';
      for (const wall of slice.walls) {
        const pillar = mesh(cylinder, stone, group, [wall.x, groundAt(wall.x, wall.z) - y + wall.height / 2, wall.z], [wall.r, wall.height, wall.r]); pillar.userData.assetRole = 'closed-space-wall';
        mesh(crystal, accent, pillar, [0, .58, 0], [.22, .32, .22]);
      }
      for (const prop of slice.props) {
        const holder = new T.Group(); holder.position.set(prop.x, groundAt(prop.x, prop.z) - y, prop.z); holder.userData.assetRole = `prop:${prop.kind}`; holder.userData.propId = prop.id; group.add(holder);
        if (prop.kind === 'brazier') {
          mesh(cylinder, dark, holder, [0, .45, 0], [.42, .9, .42]); mesh(crystal, accent, holder, [0, 1.18, 0], [.34, .62, .34]);
        } else {
          mesh(box, stone, holder, [0, 1.35, 0], [.92, 2.7, .48]); mesh(box, accent, holder, [0, 1.46, .255], [.38, 1.55, .035]);
        }
      }
      const altar = new T.Group(); altar.position.set(slice.focus.x, groundAt(slice.focus.x, slice.focus.z) - y + .02, slice.focus.z); altar.userData.assetRole = 'memory-altar'; altar.userData.nonSolid = 'flush-floor-marker'; group.add(altar);
      mesh(new T.CylinderGeometry(1.25, 1.55, .04, 12), dark, altar);
      const memory = mesh(crystal, accent, altar, [0, 1.15, 0], [.42, .95, .42]); memory.visible = false;
      const halo = mesh(new T.TorusGeometry(1.1, .035, 5, 32), accent, altar, [0, 1.15, 0]); halo.rotation.x = Math.PI / 2; halo.visible = false;
      const light = new T.PointLight(style.light, 0, 10, 2); light.position.set(0, 1.5, 0); altar.add(light);
      this.groups.set(slice.id, group); this.altars.set(slice.id, { memory, halo, light, accent });
    }
  }
  update(game, time) {
    for (const slice of VAULT_SLICES) {
      const altar = this.altars.get(slice.id), progress = game.vaults[slice.id], dead = game.enemies.find(enemy => enemy.id === slice.warden.id)?.dead;
      const ready = !!dead && !progress.claimed; altar.memory.visible = altar.halo.visible = ready; altar.light.intensity = ready ? 4 + Math.sin(time * 3) : 0;
      altar.memory.rotation.y = time * .8; altar.memory.position.y = 1.15 + Math.sin(time * 2.1) * .13; altar.halo.rotation.z = time * .35;
      altar.accent.emissiveIntensity = progress.claimed ? .18 : ready ? 1.7 : .55;
    }
  }
}

export function decorateVaultWarden(model, enemy, textures = {}) {
  const slice = vaultByWarden(enemy.id); if (!slice) return model;
  const style = styles[slice.theme], texture = textures[slice.theme], color = style.warden, accent = style.wardenAccent;
  const group = new T.Group(), plate = standard(color, texture ? { map: texture, metalness: .3, roughness: .52 } : { metalness: .3, roughness: .52 }), glow = standard(accent, { emissive: color, emissiveIntensity: 1.8 });
  const shield = mesh(new T.CylinderGeometry(.72, .72, .13, 8), plate, group, [-.75, 1.2, .05], [1, 1, 1]); shield.rotation.z = Math.PI / 2;
  const eye = mesh(crystal, glow, group, [0, 2.07, .25], [.22, .12, .12]);
  const crown = mesh(new T.TorusGeometry(.42, .055, 5, 18), glow, group, [0, 2.36, 0]); crown.rotation.x = Math.PI / 2;
  model.g.add(group); model.vaultAdornment = { group, shield, eye, crown, state: 'guard' }; model.g.scale.multiplyScalar(1.08); return model;
}

const poses = Object.freeze({
  guard: { shield: .05, crown: 1, eye: 1, bob: 0 },
  prowl: { shield: -.32, crown: 1.08, eye: 1.25, bob: .04 },
  charge: { shield: .72, crown: 1.32, eye: 1.65, bob: .1 },
  release: { shield: -1.05, crown: .82, eye: 2.1, bob: -.08 },
});
export function animateVaultWarden(model, enemy, time) {
  const adornment = model.vaultAdornment; if (!adornment) return null;
  const state = vaultAnimationState(enemy), pose = poses[state]; adornment.state = state;
  adornment.shield.rotation.x = pose.shield + Math.sin(time * 3) * .04; adornment.crown.scale.setScalar(pose.crown); adornment.crown.rotation.z = time * (state === 'charge' ? 2.5 : .55); adornment.eye.scale.z = pose.eye;
  adornment.group.position.y = pose.bob + Math.sin(time * (state === 'prowl' ? 8 : 2)) * .025;
  return state;
}
