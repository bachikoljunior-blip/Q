import * as THREE from '../vendor/three.module.js';
import {
  BIOMES,
  WATER_LEVEL,
  WORLD_HALF,
  WORLD_POINTS,
  WORLD_SIZE,
  biomeAt,
  fbm,
  riverCenter,
  rng,
  terrainHeight
} from './core.js';

const TAU = Math.PI * 2;
const up = new THREE.Vector3(0, 1, 0);
const tempMatrix = new THREE.Matrix4();
const tempPosition = new THREE.Vector3();
const tempScale = new THREE.Vector3();
const tempQuaternion = new THREE.Quaternion();

function material(color, options = {}) {
  return new THREE.MeshStandardMaterial({ color, roughness: .92, metalness: 0, ...options });
}

function addMesh(parent, geometry, surface, position, rotation = [0, 0, 0], scale = [1, 1, 1]) {
  const mesh = new THREE.Mesh(geometry, surface);
  mesh.position.set(...position);
  mesh.rotation.set(...rotation);
  mesh.scale.set(...scale);
  parent.add(mesh);
  return mesh;
}

function matrixAt(x, y, z, rotation, sx, sy = sx, sz = sx) {
  tempPosition.set(x, y, z);
  tempQuaternion.setFromAxisAngle(up, rotation);
  tempScale.set(sx, sy, sz);
  tempMatrix.compose(tempPosition, tempQuaternion, tempScale);
  return tempMatrix;
}

function safeGround(x, z) {
  return Math.max(terrainHeight(x, z), WATER_LEVEL + .1);
}

function nearPoint(x, z, radius = 90) {
  return WORLD_POINTS.some(point => Math.hypot(x - point.x, z - point.z) < radius);
}

export class World {
  constructor(scene, quality = 2) {
    this.scene = scene;
    this.root = new THREE.Group();
    this.root.name = 'WILDBOUND_WORLD';
    this.random = rng(0x51a7f011);
    this.quality = quality;
    this.detail = [];
    this.interactables = [];
    this.animated = [];
    this.discovery = new Map();
    this.choiceVisuals = {};
    this.root.matrixAutoUpdate = false;
    scene.add(this.root);
    this.createLighting();
    this.createSky();
    this.createTerrain();
    this.createWater();
    this.createNature();
    this.createLandmarks();
    this.createAtmosphere();
    this.createObjectiveMarker();
    this.setQuality(quality);
  }

  createLighting() {
    this.hemi = new THREE.HemisphereLight(0xc9e5ff, 0x354028, 2.15);
    this.sun = new THREE.DirectionalLight(0xffedcb, 3.15);
    this.sun.position.set(-180, 310, 120);
    this.sun.target.position.set(0, 0, -100);
    this.root.add(this.hemi, this.sun, this.sun.target);
  }

  createSky() {
    const geometry = new THREE.SphereGeometry(820, 24, 14);
    const surface = new THREE.ShaderMaterial({
      side: THREE.BackSide,
      depthWrite: false,
      uniforms: {
        topColor: { value: new THREE.Color(0x4c80a4) },
        horizonColor: { value: new THREE.Color(0xc7c5a3) },
        bottomColor: { value: new THREE.Color(0x71877b) },
        dusk: { value: 0 }
      },
      vertexShader: 'varying vec3 vP; void main(){vP=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
      fragmentShader: 'varying vec3 vP;uniform vec3 topColor;uniform vec3 horizonColor;uniform vec3 bottomColor;uniform float dusk;void main(){float h=normalize(vP).y;vec3 c=mix(bottomColor,horizonColor,smoothstep(-.18,.06,h));c=mix(c,topColor,smoothstep(.02,.72,h));c=mix(c,vec3(.28,.18,.26),dusk*(1.-smoothstep(.15,.8,h)));gl_FragColor=vec4(c,1.);}'
    });
    this.sky = new THREE.Mesh(geometry, surface);
    this.sky.frustumCulled = false;
    this.root.add(this.sky);

    const cloudGeometry = new THREE.SphereGeometry(1, 7, 5);
    const cloudMaterial = new THREE.MeshBasicMaterial({ color: 0xf5f0dc, transparent: true, opacity: .34, depthWrite: false });
    this.clouds = new THREE.InstancedMesh(cloudGeometry, cloudMaterial, 28);
    this.clouds.frustumCulled = false;
    for (let i = 0; i < 28; i += 1) {
      const angle = this.random.next() * TAU;
      const radius = 210 + this.random.next() * 490;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      const y = 150 + this.random.next() * 105;
      this.clouds.setMatrixAt(i, matrixAt(x, y, z, angle, 24 + this.random.next() * 38, 4 + this.random.next() * 8, 9 + this.random.next() * 18));
    }
    this.clouds.instanceMatrix.needsUpdate = true;
    this.root.add(this.clouds);
  }

  createTerrain() {
    const segments = 128;
    const geometry = new THREE.PlaneGeometry(WORLD_SIZE, WORLD_SIZE, segments, segments);
    geometry.rotateX(-Math.PI / 2);
    const positions = geometry.attributes.position;
    const colors = new Float32Array(positions.count * 3);
    const color = new THREE.Color();
    const accent = new THREE.Color();
    for (let i = 0; i < positions.count; i += 1) {
      const x = positions.getX(i), z = positions.getZ(i), height = terrainHeight(x, z);
      positions.setY(i, height);
      const biome = biomeAt(x, z);
      color.setHex(biome.color);
      accent.setHex(biome.accent);
      const variation = .16 + (fbm(x * .018, z * .018, 3) + 1) * .18;
      color.lerp(accent, variation);
      if (height > 72) color.lerp(new THREE.Color(0xc7c8b9), Math.min(.58, (height - 72) / 85));
      if (height < WATER_LEVEL + 1.2) color.lerp(new THREE.Color(0x4f5f4e), .5);
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;
    }
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.computeVertexNormals();
    let groundTexture = null;
    if (!globalThis.__Q_HEADLESS__ && typeof document !== 'undefined') {
      groundTexture = new THREE.TextureLoader().load('./assets/textures/ground.webp');
      groundTexture.wrapS = THREE.RepeatWrapping;
      groundTexture.wrapT = THREE.RepeatWrapping;
      groundTexture.repeat.set(34, 34);
      groundTexture.anisotropy = 4;
      this.groundTexture = groundTexture;
    }
    this.terrain = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: .98, metalness: 0, bumpMap: groundTexture, bumpScale: .72 }));
    this.terrain.receiveShadow = false;
    this.root.add(this.terrain);
  }

  createWater() {
    const waterSurface = material(0x4f8791, { roughness: .28, metalness: .05, transparent: true, opacity: .72, depthWrite: false });
    const vertices = [], indices = [], samples = 120, width = 27;
    for (let i = 0; i <= samples; i += 1) {
      const x = -WORLD_HALF + i / samples * WORLD_SIZE;
      const center = riverCenter(x);
      vertices.push(x, WATER_LEVEL, center - width, x, WATER_LEVEL, center + width);
      if (i < samples) {
        const a = i * 2;
        indices.push(a, a + 2, a + 1, a + 2, a + 3, a + 1);
      }
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();
    this.river = new THREE.Mesh(geometry, waterSurface);
    this.root.add(this.river);

    const marsh = addMesh(this.root, new THREE.CircleGeometry(235, 48), waterSurface.clone(), [-520, WATER_LEVEL + .08, 310], [-Math.PI / 2, 0, 0], [1.15, 1, .85]);
    const ocean = addMesh(this.root, new THREE.PlaneGeometry(1900, 440), waterSurface.clone(), [0, WATER_LEVEL - .1, 770], [-Math.PI / 2, 0, 0]);
    this.waterMeshes = [this.river, marsh, ocean];
    this.animated.push({ type: 'water', meshes: this.waterMeshes });
  }

  createNature() {
    const treeLocations = [];
    for (let attempts = 0; attempts < 9000 && treeLocations.length < 720; attempts += 1) {
      const x = (this.random.next() * 2 - 1) * (WORLD_HALF - 26);
      const z = (this.random.next() * 2 - 1) * (WORLD_HALF - 26);
      const biome = biomeAt(x, z);
      const probability = biome === BIOMES.forest ? .78 : biome === BIOMES.meadow ? .17 : biome === BIOMES.wetland ? .12 : biome === BIOMES.highland ? .09 : .025;
      if (this.random.next() > probability || nearPoint(x, z, 68)) continue;
      const y = terrainHeight(x, z);
      if (y < WATER_LEVEL + 1 || y > 105) continue;
      treeLocations.push({ x, y, z, scale: .75 + this.random.next() * 1.35, rotation: this.random.next() * TAU, conifer: biome === BIOMES.highland || this.random.next() < .46 });
    }

    const trunkGeometry = new THREE.CylinderGeometry(.52, .82, 6, 5);
    const coniferGeometry = new THREE.ConeGeometry(3.6, 9.5, 7, 2);
    const crownGeometry = new THREE.IcosahedronGeometry(3.35, 1);
    const trunkMaterial = material(0x5a3f2c);
    const coniferMaterial = material(0x315b3d);
    const crownMaterial = material(0x487344);
    this.trunks = new THREE.InstancedMesh(trunkGeometry, trunkMaterial, treeLocations.length);
    const conifers = treeLocations.filter(tree => tree.conifer);
    const crowns = treeLocations.filter(tree => !tree.conifer);
    this.conifers = new THREE.InstancedMesh(coniferGeometry, coniferMaterial, conifers.length);
    this.crowns = new THREE.InstancedMesh(crownGeometry, crownMaterial, crowns.length);
    treeLocations.forEach((tree, i) => this.trunks.setMatrixAt(i, matrixAt(tree.x, tree.y + 3 * tree.scale, tree.z, tree.rotation, tree.scale, tree.scale, tree.scale)));
    conifers.forEach((tree, i) => this.conifers.setMatrixAt(i, matrixAt(tree.x, tree.y + 8.1 * tree.scale, tree.z, tree.rotation, tree.scale, tree.scale, tree.scale)));
    crowns.forEach((tree, i) => this.crowns.setMatrixAt(i, matrixAt(tree.x, tree.y + 7.2 * tree.scale, tree.z, tree.rotation, tree.scale * 1.25, tree.scale, tree.scale * 1.25)));
    for (const mesh of [this.trunks, this.conifers, this.crowns]) {
      mesh.instanceMatrix.needsUpdate = true;
      mesh.frustumCulled = false;
      this.root.add(mesh);
    }

    const rockGeometry = new THREE.DodecahedronGeometry(1, 0);
    this.rocks = new THREE.InstancedMesh(rockGeometry, material(0x717467), 230);
    for (let i = 0; i < 230; i += 1) {
      let x, z, y;
      do {
        x = (this.random.next() * 2 - 1) * (WORLD_HALF - 20);
        z = (this.random.next() * 2 - 1) * (WORLD_HALF - 20);
        y = terrainHeight(x, z);
      } while (y < WATER_LEVEL + .25);
      const scale = .7 + this.random.next() * 3.6;
      this.rocks.setMatrixAt(i, matrixAt(x, y + scale * .42, z, this.random.next() * TAU, scale, scale * (.45 + this.random.next() * .55), scale * (.7 + this.random.next() * .6)));
    }
    this.rocks.instanceMatrix.needsUpdate = true;
    this.rocks.frustumCulled = false;
    this.root.add(this.rocks);

    const grassGeometry = new THREE.ConeGeometry(.11, 1.25, 3);
    this.grass = new THREE.InstancedMesh(grassGeometry, material(0x88a752, { side: THREE.DoubleSide }), 1700);
    for (let i = 0; i < 1700; i += 1) {
      let x, z, y;
      do {
        x = (this.random.next() * 2 - 1) * (WORLD_HALF - 18);
        z = (this.random.next() * 2 - 1) * (WORLD_HALF - 18);
        y = terrainHeight(x, z);
      } while (y < WATER_LEVEL + .18);
      const scale = .55 + this.random.next() * 1.25;
      this.grass.setMatrixAt(i, matrixAt(x, y + .55 * scale, z, this.random.next() * TAU, scale, scale, scale));
    }
    this.grass.instanceMatrix.needsUpdate = true;
    this.grass.frustumCulled = false;
    this.root.add(this.grass);

    const flowerGeometry = new THREE.OctahedronGeometry(.18, 0);
    this.flowers = new THREE.InstancedMesh(flowerGeometry, material(0xe9c882, { emissive: 0x291907, emissiveIntensity: .2 }), 320);
    for (let i = 0; i < 320; i += 1) {
      let x, z, y;
      do {
        x = (this.random.next() * 2 - 1) * 610;
        z = (this.random.next() * 2 - 1) * 610;
        y = terrainHeight(x, z);
      } while (y < WATER_LEVEL + .25);
      this.flowers.setMatrixAt(i, matrixAt(x, y + .48, z, this.random.next() * TAU, .65 + this.random.next() * 1.1));
    }
    this.flowers.instanceMatrix.needsUpdate = true;
    this.flowers.frustumCulled = false;
    this.root.add(this.flowers);
    this.detail.push(this.grass, this.flowers);
  }

  createLandmarks() {
    this.createVillage();
    this.createGrove();
    this.createMarshTower();
    this.createPeakShrine();
    this.createCoastRuins();
    this.createCave();
    this.createCrownTemple();
    this.createBridge();
    this.createResources();
  }

  landmarkRoot(id) {
    const point = WORLD_POINTS.find(item => item.id === id);
    const group = new THREE.Group();
    group.position.set(point.x, terrainHeight(point.x, point.z), point.z);
    group.name = point.label;
    this.root.add(group);
    this.discovery.set(id, { ...point, group });
    return group;
  }

  createVillage() {
    const group = this.landmarkRoot('haven');
    const wood = material(0x796049), plaster = material(0xb2a681), roof = material(0x4d5542), warm = material(0xffb55b, { emissive: 0x7a2605, emissiveIntensity: .7 });
    const houses = [[-27, -18, .2], [24, -14, -.4], [-31, 24, .5], [31, 25, -.8], [2, 38, 0]];
    for (const [x, z, rotation] of houses) {
      const house = new THREE.Group();
      house.position.set(x, 0, z);
      house.rotation.y = rotation;
      addMesh(house, new THREE.BoxGeometry(12, 7, 10), plaster, [0, 3.5, 0]);
      addMesh(house, new THREE.ConeGeometry(8.8, 4.2, 4), roof, [0, 8.3, 0], [0, Math.PI / 4, 0], [1.12, 1, .9]);
      addMesh(house, new THREE.BoxGeometry(2.2, 4.2, .35), wood, [0, 2.1, 5.15]);
      addMesh(house, new THREE.BoxGeometry(1.1, 1.25, .25), warm, [-3.2, 4.3, 5.2]);
      group.add(house);
    }
    addMesh(group, new THREE.CylinderGeometry(5.5, 6.2, 1.1, 20), material(0x8c876f), [0, .5, 3]);
    const fire = addMesh(group, new THREE.ConeGeometry(1.25, 2.8, 6), warm, [0, 2, 3]);
    const light = new THREE.PointLight(0xffad55, 14, 30, 2);
    light.position.set(0, 5, 3);
    group.add(light);
    this.animated.push({ type: 'fire', mesh: fire, light });
    const havenWard = new THREE.Group();
    havenWard.name = 'HAVEN_WARD_CHOICE';
    const wardSurface = new THREE.MeshBasicMaterial({ color: 0xb6e6d0, transparent: true, opacity: .72, depthWrite: false });
    const wardRing = addMesh(havenWard, new THREE.TorusGeometry(8.5, .18, 6, 36), wardSurface, [0, 1.2, 3], [Math.PI / 2, 0, 0]);
    const wardLight = new THREE.PointLight(0x7fd9b7, 9, 42, 2);
    wardLight.position.set(0, 4.5, 3);
    havenWard.add(wardLight);
    havenWard.visible = false;
    group.add(havenWard);
    this.choiceVisuals.havenWard = havenWard;
    this.animated.push({ type: 'choiceWard', mesh: wardRing, light: wardLight });
    const waterWard = new THREE.Group();
    const waterLight = new THREE.PointLight(0x71c7dd, 9, 34, 2);
    const waterRing = addMesh(waterWard, new THREE.TorusGeometry(3.2, .16, 6, 28), new THREE.MeshBasicMaterial({ color: 0x83d9e5, transparent: true, opacity: .7 }), [10, 1.4, 4], [Math.PI / 2, 0, 0]);
    waterLight.position.set(10, 3.5, 4);
    waterWard.add(waterLight);
    waterWard.visible = false;
    group.add(waterWard);
    this.choiceVisuals.waterWard = waterWard;
    this.animated.push({ type: 'choiceGlyph', mesh: waterRing, light: waterLight });
    const windWard = new THREE.Group();
    const windLight = new THREE.PointLight(0xe7d58e, 9, 34, 2);
    const windRing = addMesh(windWard, new THREE.TorusGeometry(3.5, .13, 6, 30), new THREE.MeshBasicMaterial({ color: 0xf2dc92, transparent: true, opacity: .7 }), [-10, 1.5, 4], [Math.PI / 2, 0, 0]);
    windLight.position.set(-10, 3.5, 4);
    windWard.add(windLight);
    windWard.visible = false;
    group.add(windWard);
    this.choiceVisuals.windWard = windWard;
    this.animated.push({ type: 'choiceGlyph', mesh: windRing, light: windLight });
    this.addNpc(group, 'mira', -8, -6, 0x38586d);
    this.addNpc(group, 'orin', 12, 9, 0x76533e);
    this.interactables.push({ id: 'mira', type: 'npc', name: '斥候ミラ', x: -8, z: 264, radius: 6 });
    this.interactables.push({ id: 'orin', type: 'npc', name: '鍛冶師オリン', x: 12, z: 279, radius: 6 });
    this.interactables.push({ id: 'haven_fire', type: 'camp', name: '風見の篝火', x: 0, z: 273, radius: 7 });
  }

  addNpc(parent, id, x, z, color) {
    const npc = new THREE.Group();
    npc.name = id;
    addMesh(npc, new THREE.CapsuleGeometry(1.05, 2.4, 4, 7), material(color), [0, 2.6, 0]);
    addMesh(npc, new THREE.SphereGeometry(.72, 8, 6), material(0xc89a72), [0, 5.05, 0]);
    addMesh(npc, new THREE.ConeGeometry(1.7, 3.8, 8, 1, true), material(color + 0x101010, { side: THREE.DoubleSide }), [0, 2.4, .2], [0, 0, Math.PI]);
    npc.position.set(x, 0, z);
    parent.add(npc);
  }

  stoneRing(group, radius, count, height, color = 0x737868) {
    const surface = material(color);
    for (let i = 0; i < count; i += 1) {
      const angle = i / count * TAU;
      addMesh(group, new THREE.BoxGeometry(2.4, height * (.75 + (i % 3) * .12), 1.8), surface, [Math.cos(angle) * radius, height * .45, Math.sin(angle) * radius], [0, -angle, (i % 2 ? .07 : -.06)]);
    }
  }

  createGrove() {
    const group = this.landmarkRoot('grove');
    this.stoneRing(group, 20, 11, 7);
    addMesh(group, new THREE.CylinderGeometry(3.7, 5.8, 24, 9), material(0x59432e), [0, 12, 0]);
    for (let i = 0; i < 7; i += 1) {
      const a = i / 7 * TAU;
      addMesh(group, new THREE.IcosahedronGeometry(7 + i % 2 * 1.8, 1), material(0x3f7244), [Math.cos(a) * 6, 25 + (i % 3) * 2, Math.sin(a) * 6], [0, a, 0], [1.25, .85, 1.25]);
    }
    const wildBloom = new THREE.Group();
    wildBloom.name = 'WILD_BLOOM_CHOICE';
    const shootSurface = material(0x8fbd64, { emissive: 0x2a5d22, emissiveIntensity: .85 });
    for (let i = 0; i < 11; i += 1) {
      const angle = i / 11 * TAU;
      const radius = 8 + i % 3 * 3.2;
      addMesh(wildBloom, new THREE.ConeGeometry(.55 + i % 2 * .18, 3.4 + i % 3, 6), shootSurface, [Math.cos(angle) * radius, 1.7, Math.sin(angle) * radius], [0, angle, 0]);
    }
    wildBloom.visible = false;
    group.add(wildBloom);
    this.choiceVisuals.wildBloom = wildBloom;
    this.interactables.push({ id: 'grove_altar', type: 'lore', name: '古樹の記憶', x: -410, z: -245, radius: 9 });
  }

  createMarshTower() {
    const group = this.landmarkRoot('marsh');
    const stone = material(0x6f786d), dark = material(0x3d4942);
    addMesh(group, new THREE.CylinderGeometry(8.5, 10.5, 25, 10, 1, true, 0, Math.PI * 1.62), stone, [0, 10, 0]);
    addMesh(group, new THREE.CylinderGeometry(10.8, 11.5, 1.3, 10), dark, [0, -1, 0]);
    addMesh(group, new THREE.TorusGeometry(3, .55, 6, 12, Math.PI), stone, [0, 10, 8], [0, 0, Math.PI]);
    for (let i = 0; i < 8; i += 1) addMesh(group, new THREE.CylinderGeometry(.12, .2, 5 + i % 3, 4), material(0x667458), [-15 + i * 4.2, 1.5, 10 + Math.sin(i) * 7]);
    const release = new THREE.Group();
    for (let i = 0; i < 3; i += 1) {
      const ring = addMesh(release, new THREE.TorusGeometry(4 + i * 2.7, .1, 5, 28), new THREE.MeshBasicMaterial({ color: 0x89d5dc, transparent: true, opacity: .48 - i * .08, depthWrite: false }), [0, 3 + i * 2.1, 1], [Math.PI / 2, 0, 0]);
      this.animated.push({ type: 'choiceGlyph', mesh: ring });
    }
    release.visible = false;
    group.add(release);
    this.choiceVisuals.ringRelease = release;
    this.interactables.push({ id: 'marsh_bell', type: 'lore', name: '沈んだ鐘', x: -520, z: 310, radius: 9 });
  }

  createPeakShrine() {
    const group = this.landmarkRoot('peak');
    const pale = material(0xb0afa0), cloth = material(0xc9a45a, { side: THREE.DoubleSide });
    addMesh(group, new THREE.CylinderGeometry(14, 17, 2.2, 12), pale, [0, 0, 0]);
    this.stoneRing(group, 11, 6, 9, 0x98998e);
    for (const side of [-1, 1]) {
      addMesh(group, new THREE.CylinderGeometry(.35, .5, 9, 6), material(0x5d4836), [side * 8, 5, -7]);
      addMesh(group, new THREE.PlaneGeometry(5, 2.4), cloth, [side * 8 + side * 2.6, 7.2, -7], [0, side > 0 ? -Math.PI / 2 : Math.PI / 2, 0]);
    }
    const release = new THREE.Group();
    for (let i = 0; i < 4; i += 1) {
      const ring = addMesh(release, new THREE.TorusGeometry(4.5 + i * 2.5, .11, 5, 30), new THREE.MeshBasicMaterial({ color: 0xe9e5c4, transparent: true, opacity: .5 - i * .07, depthWrite: false }), [0, 5 + i * 2.7, 0], [Math.PI / 2, 0, 0]);
      this.animated.push({ type: 'choiceGlyph', mesh: ring });
    }
    release.visible = false;
    group.add(release);
    this.choiceVisuals.windRelease = release;
    this.interactables.push({ id: 'peak_wind', type: 'lore', name: '風読みの碑', x: 500, z: -420, radius: 9 });
  }

  createCoastRuins() {
    const group = this.landmarkRoot('coast');
    const stone = material(0x989080), moss = material(0x667254);
    for (let i = 0; i < 9; i += 1) {
      const angle = i / 9 * TAU, radius = 20 + (i % 2) * 7;
      addMesh(group, new THREE.CylinderGeometry(1.3, 1.65, 7 + i % 4 * 3.5, 8), i % 3 ? stone : moss, [Math.cos(angle) * radius, 4 + i % 4 * 1.7, Math.sin(angle) * radius], [0, 0, i % 2 ? .06 : -.09]);
    }
    addMesh(group, new THREE.BoxGeometry(34, 2.2, 22), stone, [0, -1, 0]);
    addMesh(group, new THREE.TorusGeometry(9, 1.5, 8, 18, Math.PI), stone, [0, 8, -7], [0, 0, 0]);
    this.interactables.push({ id: 'coast_archive', type: 'lore', name: '潮騒の碑文', x: 535, z: 430, radius: 10 });
  }

  createCave() {
    const group = this.landmarkRoot('cave');
    const rock = material(0x4e514b), glow = material(0x73a9a0, { emissive: 0x2f766f, emissiveIntensity: 1.1 });
    for (let i = 0; i < 13; i += 1) {
      const angle = Math.PI * .12 + i / 12 * Math.PI * .76;
      addMesh(group, new THREE.DodecahedronGeometry(2.4 + i % 3, 0), rock, [Math.cos(angle) * 12, Math.sin(angle) * 13 - 1, 0], [i * .3, 0, i * .1]);
    }
    addMesh(group, new THREE.CircleGeometry(9.5, 20), material(0x111814, { side: THREE.DoubleSide }), [0, 7, .4], [0, 0, 0]);
    for (let i = 0; i < 7; i += 1) addMesh(group, new THREE.OctahedronGeometry(.35 + this.random.next() * .45), glow, [-6 + i * 2, 1 + this.random.next() * 4, -1]);
    this.interactables.push({ id: 'cave_mine', type: 'cache', name: '根喰らいの鉱脈', x: 360, z: 70, radius: 11 });
  }

  createCrownTemple() {
    const group = this.landmarkRoot('crown');
    const stone = material(0xaaa891), gold = material(0xc2a65b, { metalness: .2, roughness: .55, emissive: 0x3f2905, emissiveIntensity: .25 });
    addMesh(group, new THREE.CylinderGeometry(31, 37, 4, 16), stone, [0, 0, 0]);
    for (let i = 0; i < 10; i += 1) {
      const angle = i / 10 * TAU;
      addMesh(group, new THREE.CylinderGeometry(1.4, 1.8, 17, 8), stone, [Math.cos(angle) * 23, 9, Math.sin(angle) * 23]);
    }
    addMesh(group, new THREE.TorusGeometry(15, 1.6, 8, 32), gold, [0, 19, 0], [Math.PI / 2, 0, 0]);
    addMesh(group, new THREE.OctahedronGeometry(4, 1), gold, [0, 7, 0]);
    this.interactables.push({ id: 'crown_gate', type: 'final', name: '空環の核', x: 0, z: -675, radius: 14 });
  }

  createBridge() {
    const x = 35, z = riverCenter(x), y = terrainHeight(x, z - 38) + 1.2;
    const group = new THREE.Group();
    group.position.set(x, y, z);
    const wood = material(0x6f5134), rope = material(0x9a8055);
    for (let i = -6; i <= 6; i += 1) addMesh(group, new THREE.BoxGeometry(8, .45, 3.6), wood, [0, Math.cos(i * .3) * .25, i * 4.3]);
    for (const side of [-1, 1]) for (let i = -3; i <= 3; i += 1) addMesh(group, new THREE.CylinderGeometry(.13, .13, 5.5, 5), rope, [side * 4, 2, i * 9], [0, 0, side * .08]);
    this.root.add(group);
  }

  createResources() {
    const herbSurface = material(0x7ec665, { emissive: 0x173b13, emissiveIntensity: .45 });
    const crystalSurface = material(0x79cad0, { emissive: 0x1e6f78, emissiveIntensity: .85, roughness: .35 });
    for (let i = 0; i < 24; i += 1) {
      const x = (this.random.next() * 2 - 1) * 680, z = (this.random.next() * 2 - 1) * 680;
      if (terrainHeight(x, z) < WATER_LEVEL) { i -= 1; continue; }
      const y = safeGround(x, z), group = new THREE.Group();
      for (let blade = 0; blade < 5; blade += 1) addMesh(group, new THREE.ConeGeometry(.25, 1.8, 4), herbSurface, [(blade - 2) * .4, .9, Math.sin(blade) * .45], [0, 0, (blade - 2) * .12]);
      group.position.set(x, y, z);
      this.root.add(group);
      this.interactables.push({ id: `herb_${i}`, type: 'herb', name: '月露草', x, z, radius: 4, mesh: group });
    }
    for (let i = 0; i < 15; i += 1) {
      const angle = this.random.next() * TAU, radius = 70 + this.random.next() * 660;
      const x = Math.cos(angle) * radius, z = Math.sin(angle) * radius, y = terrainHeight(x, z);
      if (y < WATER_LEVEL + .15) { i -= 1; continue; }
      const group = new THREE.Group();
      for (let shard = 0; shard < 4; shard += 1) addMesh(group, new THREE.OctahedronGeometry(.55 + shard * .12, 0), crystalSurface, [(shard - 1.5) * .7, .75 + shard * .25, Math.sin(shard * 2) * .5], [0, shard, .2]);
      group.position.set(x, y, z);
      this.root.add(group);
      this.interactables.push({ id: `crystal_${i}`, type: 'crystal', name: '青脈晶', x, z, radius: 4, mesh: group });
    }
  }

  createAtmosphere() {
    const count = 120;
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i += 1) {
      positions[i * 3] = (this.random.next() * 2 - 1) * 520;
      positions[i * 3 + 1] = 3 + this.random.next() * 36;
      positions[i * 3 + 2] = (this.random.next() * 2 - 1) * 520;
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const surface = new THREE.PointsMaterial({ color: 0xc9e5b0, size: 1.35, transparent: true, opacity: .45, depthWrite: false, sizeAttenuation: true });
    this.fireflies = new THREE.Points(geometry, surface);
    this.root.add(this.fireflies);
    this.detail.push(this.fireflies);
  }

  createObjectiveMarker() {
    const group = new THREE.Group();
    const ringSurface = new THREE.MeshBasicMaterial({ color: 0xf1d684, transparent: true, opacity: .78, depthWrite: false });
    const ring = new THREE.Mesh(new THREE.TorusGeometry(3.2, .16, 6, 24), ringSurface);
    ring.rotation.x = Math.PI / 2;
    const beam = new THREE.Mesh(new THREE.CylinderGeometry(.08, .5, 20, 8, 1, true), new THREE.MeshBasicMaterial({ color: 0xf2d88d, transparent: true, opacity: .18, depthWrite: false, side: THREE.DoubleSide }));
    beam.position.y = 10;
    group.add(ring, beam);
    group.visible = false;
    group.renderOrder = 3;
    this.objective = { group, ring, beam };
    this.root.add(group);
  }

  setObjective(point) {
    if (!point) { this.objective.group.visible = false; return; }
    this.objective.group.visible = true;
    this.objective.group.position.set(point.x, terrainHeight(point.x, point.z) + 2, point.z);
  }

  setCollected(ids = []) {
    const set = new Set(ids);
    for (const item of this.interactables) if (item.mesh) {
      item.collected = set.has(item.id);
      item.mesh.visible = !item.collected;
    }
  }

  setChoices(choices = {}) {
    if (this.choiceVisuals.havenWard) this.choiceVisuals.havenWard.visible = choices.grove === 'haven_ward';
    if (this.choiceVisuals.wildBloom) this.choiceVisuals.wildBloom.visible = choices.grove === 'wild_bloom';
    if (this.choiceVisuals.waterWard) this.choiceVisuals.waterWard.visible = choices.marsh === 'water_ward';
    if (this.choiceVisuals.ringRelease) this.choiceVisuals.ringRelease.visible = choices.marsh === 'ring_release';
    if (this.choiceVisuals.windWard) this.choiceVisuals.windWard.visible = choices.peak === 'wind_ward';
    if (this.choiceVisuals.windRelease) this.choiceVisuals.windRelease.visible = choices.peak === 'wind_release';
  }

  update(time, playerPosition, day = .28) {
    const angle = day * TAU - Math.PI * .5;
    this.sun.position.set(Math.cos(angle) * 330, 90 + Math.max(0, Math.sin(angle)) * 280, Math.sin(angle) * 240);
    this.sun.intensity = 1.05 + Math.max(0, Math.sin(angle)) * 2.5;
    this.hemi.intensity = 1.25 + Math.max(0, Math.sin(angle)) * 1.05;
    this.sky.material.uniforms.dusk.value = Math.max(0, .32 - Math.sin(angle)) * .75;
    this.sky.position.copy(playerPosition);
    this.clouds.position.x = Math.sin(time * .008) * 26;
    this.clouds.position.z = Math.cos(time * .006) * 18;
    for (const entry of this.animated) {
      if (entry.type === 'water') for (let i = 0; i < entry.meshes.length; i += 1) entry.meshes[i].material.opacity = .69 + Math.sin(time * .8 + i) * .035;
      if (entry.type === 'fire') {
        entry.mesh.scale.y = .86 + Math.sin(time * 9) * .16;
        entry.mesh.rotation.y += .028;
        entry.light.intensity = 12 + Math.sin(time * 11) * 2.5;
      }
      if (entry.type === 'choiceWard' && entry.mesh.parent?.visible) {
        entry.mesh.rotation.z = time * .42;
        entry.light.intensity = 7.5 + Math.sin(time * 2.4) * 1.5;
      }
      if (entry.type === 'choiceGlyph' && entry.mesh.parent?.visible) {
        entry.mesh.rotation.z = time * .32;
        if (entry.light) entry.light.intensity = 7 + Math.sin(time * 2.1) * 1.2;
      }
    }
    if (this.fireflies.visible) {
      this.fireflies.rotation.y = time * .018;
      this.fireflies.material.opacity = .3 + Math.sin(time * .7) * .15;
    }
    if (this.objective.group.visible) {
      this.objective.ring.rotation.z = time * .8;
      const scale = 1 + Math.sin(time * 2.6) * .13;
      this.objective.ring.scale.setScalar(scale);
    }
    for (const landmark of this.discovery.values()) landmark.group.visible = Math.hypot(playerPosition.x - landmark.x, playerPosition.z - landmark.z) < 440;
    for (const item of this.interactables) if (item.mesh) item.mesh.visible = !item.collected && Math.hypot(playerPosition.x - item.x, playerPosition.z - item.z) < 210;
  }

  setQuality(level) {
    this.quality = level;
    this.clouds.visible = level > 0;
    this.grass.visible = level > 0;
    this.flowers.visible = level > 0;
    this.fireflies.visible = level > 1;
  }

  dispose() {
    this.root.traverse(object => {
      object.geometry?.dispose?.();
      if (Array.isArray(object.material)) object.material.forEach(item => item.dispose?.());
      else object.material?.dispose?.();
    });
    this.scene.remove(this.root);
    this.groundTexture?.dispose();
  }
}
