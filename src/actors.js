import * as THREE from '../vendor/three.module.js';

const TAU = Math.PI * 2;

const GEO = Object.freeze({
  torso: new THREE.CapsuleGeometry(.64, 1.28, 5, 9),
  broadTorso: new THREE.CapsuleGeometry(.78, 1.18, 5, 9),
  head: new THREE.SphereGeometry(.54, 10, 8),
  hair: new THREE.SphereGeometry(.57, 10, 7, 0, TAU, 0, Math.PI * .62),
  arm: new THREE.CapsuleGeometry(.17, .72, 4, 7),
  heavyArm: new THREE.CapsuleGeometry(.22, .72, 4, 7),
  leg: new THREE.CapsuleGeometry(.21, .82, 4, 7),
  boot: new THREE.CapsuleGeometry(.24, .48, 4, 7),
  belt: new THREE.CylinderGeometry(.71, .74, .2, 10),
  shoulder: new THREE.SphereGeometry(.3, 7, 5),
  blade: new THREE.BoxGeometry(.13, 2.35, .2),
  grip: new THREE.CylinderGeometry(.09, .09, .72, 7),
  guard: new THREE.BoxGeometry(.78, .12, .16),
  hammerHead: new THREE.BoxGeometry(.68, .36, .36),
  quiver: new THREE.CylinderGeometry(.2, .26, 1.5, 7),
  beastBody: new THREE.CapsuleGeometry(.72, 1.5, 5, 8),
  beastHead: new THREE.DodecahedronGeometry(.72, 0),
  creatureLeg: new THREE.CapsuleGeometry(.15, .72, 4, 6),
  stalkerBody: new THREE.CapsuleGeometry(.48, 1.5, 5, 8),
  sentinelBody: new THREE.DodecahedronGeometry(.9, 1),
  mask: new THREE.DodecahedronGeometry(.48, 0),
  eye: new THREE.SphereGeometry(.1, 6, 4),
  horn: new THREE.ConeGeometry(.15, 1.35, 6),
  reed: new THREE.ConeGeometry(.14, 1.25, 5),
  plate: new THREE.BoxGeometry(.82, .18, .72)
});

function surface(color, options = {}) {
  return new THREE.MeshStandardMaterial({
    color,
    roughness: .78,
    metalness: .03,
    ...options
  });
}

function part(parent, geometry, material, position, scale = [1, 1, 1], rotation = [0, 0, 0], name = '') {
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(...position);
  mesh.scale.set(...scale);
  mesh.rotation.set(...rotation);
  if (name) mesh.name = name;
  parent.add(mesh);
  return mesh;
}

function limb(parent, geometry, material, position, lengthScale = 1, name = '') {
  const pivot = new THREE.Group();
  pivot.position.set(...position);
  pivot.name = name;
  part(pivot, geometry, material, [0, -.58 * lengthScale, 0], [1, lengthScale, 1]);
  parent.add(pivot);
  return pivot;
}

function capeGeometry(width = 1.55, height = 2.45, flare = .35) {
  const half = width / 2;
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute([
    -half, 0, 0,
    half, 0, 0,
    half + flare, -height, -.12,
    -half - flare, -height, -.12
  ], 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute([0, 1, 1, 1, 1, 0, 0, 0], 2));
  geometry.setIndex([0, 1, 2, 0, 2, 3]);
  geometry.computeVertexNormals();
  return geometry;
}

function wingGeometry(side = 1) {
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute([
    0, 0, 0,
    side * 2.25, .35, -.18,
    side * 1.55, -1.35, .08,
    side * .42, -1.05, .18
  ], 3));
  geometry.setIndex([0, 1, 2, 0, 2, 3]);
  geometry.computeVertexNormals();
  return geometry;
}

const ROLE_PALETTES = Object.freeze({
  traveler: { cloth: 0x1c5b61, accent: 0xd8c68c, skin: 0xc99670, dark: 0x26362f, metal: 0xd3d1b7 },
  mira: { cloth: 0x2f5669, accent: 0x889e8b, skin: 0xb98265, dark: 0x25343a, metal: 0xaebbb2 },
  orin: { cloth: 0x71513e, accent: 0xb18a5b, skin: 0xa96f50, dark: 0x302923, metal: 0x8c9690 },
  ilya: { cloth: 0x4c5365, accent: 0xd0b55f, skin: 0xb78d77, dark: 0x292d3a, metal: 0xd9c573 },
  crown: { cloth: 0x373442, accent: 0xc8a94e, skin: 0x9b7a72, dark: 0x1f222c, metal: 0xd7be65 }
});

export function createHumanoid({ role = 'traveler', scale = 1, spectral = false } = {}) {
  const palette = ROLE_PALETTES[role] || ROLE_PALETTES.traveler;
  const alpha = spectral ? .72 : 1;
  const materialOptions = spectral ? { transparent: true, opacity: alpha, depthWrite: false } : {};
  const cloth = surface(palette.cloth, materialOptions);
  const accent = surface(palette.accent, { ...materialOptions, side: THREE.DoubleSide, emissive: spectral ? palette.accent : 0, emissiveIntensity: spectral ? .28 : 0 });
  const skin = surface(palette.skin, materialOptions);
  const dark = surface(palette.dark, materialOptions);
  const metal = surface(palette.metal, { ...materialOptions, roughness: .3, metalness: .52, emissive: spectral ? palette.metal : 0, emissiveIntensity: spectral ? .32 : 0 });

  const root = new THREE.Group();
  const visual = new THREE.Group();
  visual.scale.setScalar(scale);
  root.add(visual);

  const broad = role === 'orin' || role === 'crown';
  const torso = part(visual, broad ? GEO.broadTorso : GEO.torso, cloth, [0, 2.75, 0], broad ? [1.08, 1, .82] : [1, 1, .8], [0, 0, 0], 'body');
  part(visual, GEO.belt, dark, [0, 1.9, 0], broad ? [1.15, 1, .9] : [1, 1, .86]);
  const head = part(visual, GEO.head, skin, [0, 4.55, .03], [1, 1.06, .96]);
  const hair = part(visual, GEO.hair, dark, [0, 4.69, -.02], [1.04, 1.03, 1.02]);

  const armGeometry = broad ? GEO.heavyArm : GEO.arm;
  const arms = [
    limb(visual, armGeometry, cloth, [-.76 - (broad ? .12 : 0), 3.45, 0], 1.05, 'leftArm'),
    limb(visual, armGeometry, cloth, [.76 + (broad ? .12 : 0), 3.45, 0], 1.05, 'rightArm')
  ];
  for (const [index, arm] of arms.entries()) {
    if (broad) part(arm, GEO.shoulder, accent, [0, -.1, 0], [1.25, 1, 1.05]);
    arm.rotation.z = index ? -.08 : .08;
  }

  const legs = [
    limb(visual, GEO.leg, dark, [-.36, 1.72, 0], 1.12, 'leftLeg'),
    limb(visual, GEO.leg, dark, [.36, 1.72, 0], 1.12, 'rightLeg')
  ];
  for (const leg of legs) part(leg, GEO.boot, dark, [0, -1.52, .12], [1.05, .72, 1.2], [Math.PI / 2, 0, 0]);

  const cloak = part(visual, capeGeometry(role === 'orin' ? 1.8 : 1.55, role === 'crown' ? 2.8 : 2.45, .34), accent, [0, 3.6, -.62], [1, 1, 1], [.08, 0, 0], 'cloak');
  const accessories = [];

  if (role === 'traveler' || role === 'crown') {
    const weaponArm = arms[1];
    const grip = part(weaponArm, GEO.grip, dark, [0, -1.72, .03], [1, 1, 1]);
    grip.rotation.z = .08;
    part(weaponArm, GEO.guard, metal, [0, -1.88, .04], [1, 1, 1], [0, 0, .08]);
    part(weaponArm, GEO.blade, metal, [0, -3.05, .05], role === 'crown' ? [1.22, 1.32, 1.1] : [1, 1, 1], [0, 0, .08], 'blade');
  }

  if (role === 'mira') {
    const hood = part(visual, new THREE.TorusGeometry(.62, .13, 6, 12, Math.PI * 1.28), accent, [0, 4.42, .08], [1, 1, 1], [Math.PI / 2, 0, -.45]);
    const quiver = part(visual, GEO.quiver, dark, [-.48, 3.02, -.62], [1, 1, 1], [-.22, 0, -.28]);
    accessories.push(hood, quiver);
  }

  if (role === 'orin') {
    part(visual, new THREE.BoxGeometry(1.2, 1.45, .08), accent, [0, 2.5, .66], [1, 1, 1]);
    const hammer = new THREE.Group();
    hammer.position.set(0, -1.3, 0);
    part(hammer, GEO.grip, dark, [0, -.48, 0], [1.15, 1.6, 1.15]);
    part(hammer, GEO.hammerHead, metal, [0, -1.08, 0]);
    arms[1].add(hammer);
    accessories.push(hammer);
  }

  let halo = null;
  if (role === 'ilya' || role === 'crown') {
    halo = part(visual, new THREE.TorusGeometry(.94, .075, 6, 24), metal, [0, 4.9, -.2], [1, 1, 1], [Math.PI / 2, 0, 0], 'halo');
    for (const side of [-1, 1]) part(visual, GEO.horn, metal, [side * .48, 5.12, -.16], [.75, 1, .75], [0, 0, side * .48]);
  }

  root.userData.rig = { kind: 'humanoid', role, visual, torso, head, hair, arms, legs, cloak, halo, accessories, baseScale: scale };
  return root;
}

const CREATURE_PALETTES = Object.freeze({
  beast: { body: 0x3f5b36, accent: 0x8ca85c, dark: 0x263624 },
  stalker: { body: 0x2d4b49, accent: 0x6f9787, dark: 0x182e30 },
  sentinel: { body: 0x5b6561, accent: 0xb1aa88, dark: 0x353c3c },
  warden: { body: 0x354c2f, accent: 0xa2b66d, dark: 0x283322 }
});

function creatureJoint(visual, position, material, name) {
  return limb(visual, GEO.creatureLeg, material, position, 1, name);
}

export function createCreature({ type = 'beast', scale = 1 } = {}) {
  const palette = CREATURE_PALETTES[type] || CREATURE_PALETTES.beast;
  const bodyMaterial = surface(palette.body);
  const accent = surface(palette.accent, { side: THREE.DoubleSide, emissive: palette.accent, emissiveIntensity: .08 });
  const dark = surface(palette.dark);
  const eye = surface(0xffc765, { emissive: 0xff6d22, emissiveIntensity: 1.2, roughness: .25 });
  const root = new THREE.Group();
  const visual = new THREE.Group();
  visual.scale.setScalar(scale);
  root.add(visual);
  const legs = [], arms = [], extras = [];
  let body;

  if (type === 'stalker') {
    body = part(visual, GEO.stalkerBody, bodyMaterial, [0, 2.05, 0], [1.08, 1, .82], [.22, 0, 0], 'body');
    const head = part(visual, GEO.mask, accent, [0, 3.55, .36], [1, 1.25, .72], [-.1, 0, 0]);
    for (const side of [-1, 1]) {
      const arm = creatureJoint(visual, [side * .58, 2.85, .12], dark, side < 0 ? 'leftArm' : 'rightArm');
      arm.rotation.z = side * .42;
      arms.push(arm);
      part(visual, GEO.eye, eye, [side * .2, 3.62, .73]);
    }
    for (let i = -2; i <= 2; i += 1) extras.push(part(visual, GEO.reed, accent, [i * .24, 3.2 - Math.abs(i) * .16, -.42], [.8, .9 + (2 - Math.abs(i)) * .18, .8], [.25, 0, i * .12]));
    head.rotation.z = .06;
  } else if (type === 'sentinel') {
    body = part(visual, GEO.sentinelBody, bodyMaterial, [0, 2.35, 0], [1, 1.25, .78], [0, 0, 0], 'body');
    part(visual, GEO.mask, accent, [0, 3.48, .34], [1, .9, .72]);
    for (const side of [-1, 1]) {
      const wing = part(visual, wingGeometry(side), accent, [side * .35, 3.05, -.42], [1, 1, 1], [0, 0, side * .08], side < 0 ? 'leftWing' : 'rightWing');
      extras.push(wing);
      const leg = creatureJoint(visual, [side * .36, 1.55, 0], dark, side < 0 ? 'leftLeg' : 'rightLeg');
      legs.push(leg);
      part(visual, GEO.eye, eye, [side * .18, 3.56, .76]);
    }
    part(visual, GEO.horn, accent, [0, 4.06, .1], [.7, .8, .7]);
  } else {
    const warden = type === 'warden';
    body = part(visual, GEO.beastBody, bodyMaterial, [0, 1.85, 0], warden ? [1.28, 1.1, 1.55] : [1.05, .95, 1.35], [Math.PI / 2, 0, 0], 'body');
    part(visual, GEO.beastHead, accent, [0, 2.25, 1.55], warden ? [1.2, 1.1, 1.35] : [1, .9, 1.18]);
    for (const side of [-1, 1]) {
      for (const z of [-.72, .72]) {
        const leg = creatureJoint(visual, [side * .62, 1.55, z], dark, `leg-${side}-${z}`);
        leg.rotation.z = side * .12;
        legs.push(leg);
      }
      part(visual, GEO.eye, eye, [side * .24, 2.38, 2.12]);
      const horn = part(visual, GEO.horn, accent, [side * .48, 2.9, 1.52], warden ? [1.25, 1.5, 1.25] : [.9, 1, .9], [0, 0, side * .5]);
      extras.push(horn);
      if (warden) extras.push(part(visual, GEO.horn, accent, [side * .86, 3.25, 1.35], [.8, 1.05, .8], [.2, 0, side * .82]));
    }
    for (let i = -1; i <= 1; i += 1) extras.push(part(visual, GEO.plate, dark, [i * .58, 2.65 - Math.abs(i) * .16, -.25], [1, 1, 1], [.18, 0, i * .14]));
  }

  root.userData.rig = { kind: 'creature', type, visual, body, legs, arms, extras, baseScale: scale };
  return root;
}

export function animateHumanoid(root, { time = 0, speed = 0, attack = 0, dodge = 0, reduced = false } = {}) {
  const rig = root?.userData?.rig;
  if (!rig || rig.kind !== 'humanoid') return;
  const motion = Math.min(1, Math.max(0, speed / 9));
  const gait = Math.sin(time * (5.6 + motion * 4.4)) * motion;
  const breath = Math.sin(time * 1.75) * (reduced ? .006 : .018);
  rig.visual.position.y = breath + (reduced ? 0 : Math.abs(gait) * .035);
  rig.torso.rotation.z = -gait * .035;
  rig.torso.rotation.x = dodge > 0 ? .22 : 0;
  rig.legs[0].rotation.x = gait * .68;
  rig.legs[1].rotation.x = -gait * .68;
  rig.arms[0].rotation.x = -gait * .42;
  rig.arms[1].rotation.x = gait * .32;
  rig.arms[0].rotation.z = .08;
  rig.arms[1].rotation.z = -.08;
  if (attack > 0) {
    const swing = Math.sin(Math.min(1, attack) * Math.PI);
    rig.arms[1].rotation.z = -.12 - swing * 2.28;
    rig.arms[1].rotation.x = -.4 + attack * .8;
    rig.torso.rotation.y = -.18 + attack * .42;
  } else {
    rig.torso.rotation.y *= .82;
  }
  if (rig.role === 'mira' && motion < .05) rig.arms[0].rotation.x = -.26 + Math.sin(time * .7) * .08;
  if (rig.role === 'orin' && motion < .05) rig.arms[1].rotation.z = -.34 + Math.sin(time * .6) * .035;
  if ((rig.role === 'ilya' || rig.role === 'crown') && motion < .05) {
    rig.arms[0].rotation.z = .28 + Math.sin(time * .8) * .04;
    rig.arms[1].rotation.z = -.28 - Math.sin(time * .8) * .04;
  }
  rig.cloak.rotation.x = .06 + Math.min(.34, speed * .014) + dodge * .22 + (reduced ? 0 : Math.sin(time * 2.2) * .018);
  if (rig.halo) rig.halo.rotation.z = time * (rig.role === 'crown' ? .58 : .28);
}

export function animateCreature(root, { time = 0, phase = 0, state = 'idle', windup = 0, active = 0, speed = 0, reduced = false } = {}) {
  const rig = root?.userData?.rig;
  if (!rig || rig.kind !== 'creature') return;
  const moving = state === 'approach' || state === 'active' ? Math.min(1, Math.max(.25, speed / 10)) : 0;
  const gait = Math.sin(time * (6.2 + moving * 3.8) + phase) * moving;
  rig.visual.position.y = reduced ? 0 : Math.sin(time * 2.4 + phase) * .025 + Math.abs(gait) * .035;
  rig.body.rotation.z = gait * .045;
  rig.body.rotation.x += ((state === 'windup' ? -.26 * windup : state === 'active' ? .24 * active : 0) - rig.body.rotation.x) * .28;
  rig.legs.forEach((leg, index) => { leg.rotation.x = (index % 2 ? -gait : gait) * .62; });
  rig.arms.forEach((arm, index) => {
    arm.rotation.x = (index % 2 ? gait : -gait) * .45 - windup * .35 + active * .55;
  });
  if (rig.type === 'sentinel') rig.extras.forEach((wing, index) => { if (/Wing/.test(wing.name)) wing.rotation.z = (index ? -.09 : .09) + Math.sin(time * 3 + phase) * .07 + windup * (index ? -.2 : .2); });
}
