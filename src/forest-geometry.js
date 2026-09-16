import * as T from 'three';

// Crown coordinates deliberately retain the existing tree instance transforms.
// Each spray is an open, folded sheet with UVs for a photographed branch. There
// are no opaque cones, spheres, or closed canopy shells, including distant LOD.
const cache = new Map();
const TAU = Math.PI * 2;
const up = new T.Vector3(0, 1, 0);
const vec = (x, y, z) => new T.Vector3(x, y, z);
const wave = n => Math.sin(n * 127.1 + 311.7) * .5 + .5;

class CrownBuilder {
  constructor() { this.positions = []; this.normals = []; this.uvs = []; this.roots = []; this.flex = []; this.colors = []; this.indices = []; }
  spray(root, tip, width, roll, fold, shade, folded = true) {
    const direction = tip.clone().sub(root), along = direction.clone().normalize();
    let across = along.clone().cross(up);
    if (across.lengthSq() < .01) across = vec(1, 0, 0);
    across.normalize().applyAxisAngle(along, roll);
    const normal = across.clone().cross(along).normalize();
    const offset = this.positions.length / 3;
    // Two joined quads share a raised midrib; a far spray needs only one quad.
    const columns = folded ? [-.5, 0, .5] : [-.5, .5];
    for (const v of [0, 1]) for (const u of columns) {
      const point = root.clone().addScaledVector(direction, v).addScaledVector(across, u * width)
        .addScaledVector(normal, (1 - Math.abs(u) * 2) * fold * width);
      this.positions.push(...point.toArray());
      // Broad crown normals avoid the harsh, unrelated lighting of flat cards.
      // Keep some geometric normal so the underside still reads as a surface.
      const canopyNormal = point.clone().multiply(vec(1, .55, 1)).add(vec(0, .62, 0)).normalize();
      const n = normal.clone().multiplyScalar(.2).addScaledVector(canopyNormal, .8).normalize();
      this.normals.push(...n.toArray()); this.uvs.push(u + .5, v);
      this.roots.push(...root.toArray()); this.flex.push(v * (.48 + .52 * Math.abs(u) * 2));
      this.colors.push(shade, shade, shade);
    }
    const row = columns.length;
    for (let c = 0; c < row - 1; c++) {
      const a = offset + c, b = a + 1;
      this.indices.push(a, b, a + row, b, b + row, a + row);
    }
  }
  finish(name) {
    const g = new T.BufferGeometry(); g.name = name;
    for (const [name, values, size] of [['position', this.positions, 3], ['normal', this.normals, 3], ['uv', this.uvs, 2], ['qBranchRoot', this.roots, 3], ['qBranchFlex', this.flex, 1], ['color', this.colors, 3]]) g.setAttribute(name, new T.Float32BufferAttribute(values, size));
    g.setIndex(this.indices); g.computeBoundingBox(); g.computeBoundingSphere();
    // Includes maximum local wind excursion; instanced frustum bounds remain
    // conservative when a branch moves outside its static silhouette.
    g.boundingBox.expandByScalar(.045); g.boundingSphere.radius += .045;
    g.userData = { forestGeometry: true, primitiveShells: 0, windMargin: .045 };
    return g;
  }
}

export function forestCrownGeometry(family = 'pine', distant = false) {
  const key = `${family}:${distant}`; if (cache.has(key)) return cache.get(key);
  if (!['pine', 'crown'].includes(family)) throw new Error(`Unknown forest crown ${family}`);
  const b = new CrownBuilder();
  if (family === 'pine') {
    const tiers = distant ? 3 : 6, spokes = distant ? 3 : 5;
    for (let tier = 0; tier < tiers; tier++) {
      const t = tier / (tiers - 1), y = -.38 + t * .83, radius = .66 * (1 - t * .8);
      for (let k = 0; k < spokes; k++) {
        const n = tier * spokes + k, angle = k / spokes * TAU + tier * 2.399;
        const reach = radius * (.86 + wave(n) * .14);
        const root = vec(Math.sin(angle) * .025, y + .06, Math.cos(angle) * .025);
        const tip = vec(Math.sin(angle) * reach, y - .07 - (1 - t) * .025, Math.cos(angle) * reach);
        b.spray(root, tip, reach * (distant ? 1.05 : .84), (k % 2 ? -1 : 1) * (.36 + wave(n + 20) * .28), .12, .72 + t * .2 + wave(n + 7) * .08, !distant);
        // Upright sprays split the tier silhouette and expose needles from the
        // gameplay camera even where the main horizontal bough is edge-on.
        if (!distant && k % 2 === 0) {
          const sideRoot = root.clone().lerp(tip, .44);
          const sideTip = tip.clone().add(vec(Math.cos(angle) * .08, .16, -Math.sin(angle) * .08));
          b.spray(sideRoot, sideTip, reach * .56, 1.02, .09, .84 + wave(n + 41) * .12);
        }
      }
    }
  } else {
    // Lateral forks and uneven lobes form an open deciduous crown. Both LODs
    // share its branch directions and bounds, reducing the shape jump.
    const limbs = distant ? 9 : 18;
    for (let limb = 0; limb < limbs; limb++) {
      const angle = limb * 2.399, ring = limb % 3, h = -.23 + ring * .26;
      const radius = ring === 2 ? .42 : .71;
      const root = vec(Math.sin(angle) * .17, h, Math.cos(angle) * .17);
      const tip = vec(Math.sin(angle) * radius, h + .18 + wave(limb + 4) * .14, Math.cos(angle) * radius);
      const width = ring === 2 ? .46 : .6;
      b.spray(root, tip, width, .52 + wave(limb + 19) * .85, .13, .74 + ring * .08 + wave(limb) * .08, !distant);
      if (!distant) {
        const fork = root.clone().lerp(tip, .38);
        const forkTip = tip.clone().add(vec(Math.cos(angle) * .19, -.1, -Math.sin(angle) * .19));
        b.spray(fork, forkTip, width * .8, -.68 + wave(limb + 90) * .25, .12, .77 + ring * .06);
      }
    }
  }
  const g = b.finish(`Q open ${family} crown ${distant ? 'distant' : 'near'}`); cache.set(key, g); return g;
}

export function forestTrunkGeometry(distant = false) {
  const key = `trunk:${distant}`; if (cache.has(key)) return cache.get(key);
  const positions = [], uvs = [], indices = [];
  function branch(points, radii, sides) {
    const offset = positions.length / 3;
    points.forEach((point, ring) => {
      const direction = (points[ring + 1] || point).clone().sub(points[Math.max(0, ring - 1)]).normalize();
      let side = direction.clone().cross(vec(0, 0, 1)).normalize(); if (side.lengthSq() < .01) side = vec(1, 0, 0);
      const cross = direction.clone().cross(side).normalize();
      for (let j = 0; j <= sides; j++) {
        const angle = j / sides * TAU, flute = 1 + Math.cos(angle * 3 + ring * .26) * .07;
        positions.push(...point.clone().addScaledVector(side, Math.cos(angle) * radii[ring] * flute).addScaledVector(cross, Math.sin(angle) * radii[ring] * flute).toArray());
        uvs.push(j / sides, ring / (points.length - 1));
      }
    });
    for (let ring = 0; ring < points.length - 1; ring++) for (let j = 0; j < sides; j++) {
      const a = offset + ring * (sides + 1) + j, b = a + sides + 1;
      indices.push(a, a + 1, b, a + 1, b + 1, b);
    }
  }
  if (distant) branch([vec(0, -.5, 0), vec(.018, 0, -.012), vec(-.015, .5, .018)], [.22, .14, .06], 5);
  else {
    branch([vec(0, -.5, 0), vec(.018, -.36, .008), vec(-.017, -.1, .018), vec(.032, .18, -.017), vec(.012, .5, .014)], [.25, .178, .138, .098, .045], 8);
    for (let i = 0; i < 7; i++) {
      const a = i * 2.399, y = -.1 + i * .067, r = .6 + (i % 3) * .16;
      branch([vec(.01, y, 0), vec(Math.sin(a) * r * .5, y + .07, Math.cos(a) * r * .5), vec(Math.sin(a) * r, y + .17, Math.cos(a) * r)], [.058 - i * .003, .029, .008], 4);
    }
    for (let i = 0; i < 5; i++) {
      const a = i / 5 * TAU + .5;
      branch([vec(Math.sin(a) * .07, -.39, Math.cos(a) * .07), vec(Math.sin(a) * .43, -.5, Math.cos(a) * .43)], [.094, .015], 4);
    }
  }
  const g = new T.BufferGeometry(); g.name = `Q tapered branching trunk ${distant ? 'distant' : 'near'}`;
  g.setAttribute('position', new T.Float32BufferAttribute(positions, 3)); g.setAttribute('uv', new T.Float32BufferAttribute(uvs, 2)); g.setIndex(indices);
  g.computeVertexNormals(); g.computeBoundingBox(); g.computeBoundingSphere(); cache.set(key, g); return g;
}
