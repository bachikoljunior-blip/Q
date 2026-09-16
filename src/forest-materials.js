import * as T from 'three';
import { atmosphereUniforms } from './environment-atmosphere.js';

export const FOREST_ALPHA_TEST = .36;
const loaded = new Map(), live = new Set(), fallback = new Map();
const shadowPairs = new WeakMap();
const linearRGB = Float64Array.from({ length: 256 }, (_, i) => { const v = i / 255; return v <= .04045 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4); });
const toSRGB = value => Math.round(255 * (value <= .0031308 ? value * 12.92 : 1.055 * Math.pow(value, 1 / 2.4) - .055));

function padRGB(data, width, height, cutoff) {
  // Canvas readback loses hidden RGB at alpha zero. Restore a two-texel gutter
  // after that readback and for every generated mip; copy complete color vectors
  // so interpolation cannot manufacture neon or black outlines. Alpha is fixed.
  let valid = new Uint8Array(width * height);
  for (let i = 0; i < valid.length; i++) valid[i] = data[i * 4 + 3] >= cutoff ? 1 : 0;
  for (let pass = 0; pass < 2; pass++) {
    const next = valid.slice(), source = data.slice();
    for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
      const i = y * width + x; if (valid[i]) continue;
      const neighbor = x > 0 && valid[i - 1] ? i - 1 : x + 1 < width && valid[i + 1] ? i + 1 : y > 0 && valid[i - width] ? i - width : y + 1 < height && valid[i + width] ? i + width : -1;
      if (neighbor < 0) continue;
      for (let k = 0; k < 3; k++) data[i * 4 + k] = source[neighbor * 4 + k];
      next[i] = 1;
    }
    valid = next;
  }
}

// Downsample straight-alpha photos through premultiplied RGB, then preserve the
// cutout coverage in each mip. Thin needles otherwise disappear long before the
// distant tree LOD. This happens once on load, never in the render loop.
export function forestMipmaps(rgba, width, height, threshold = FOREST_ALPHA_TEST) {
  if (rgba.length !== width * height * 4 || width < 1 || height < 1 || (width & (width - 1)) || (height & (height - 1))) throw new Error('Forest texture must be power-of-two RGBA');
  const mipmaps = [{ data: new Uint8Array(rgba), width, height }], cutoff = threshold * 255;
  padRGB(mipmaps[0].data, width, height, cutoff);
  let covered = 0; for (let i = 3; i < rgba.length; i += 4) if (rgba[i] >= cutoff) covered++;
  const coverage = covered / (width * height);
  while (width > 1 || height > 1) {
    const old = mipmaps.at(-1), w = Math.max(1, width >> 1), h = Math.max(1, height >> 1), data = new Uint8Array(w * h * 4);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      let alpha = 0; const color = [0, 0, 0];
      for (let j = 0; j < 2; j++) for (let i = 0; i < 2; i++) {
        const o = (Math.min(height - 1, y * 2 + j) * width + Math.min(width - 1, x * 2 + i)) * 4, a = old.data[o + 3];
        alpha += a; for (let k = 0; k < 3; k++) color[k] += linearRGB[old.data[o + k]] * a;
      }
      const o = (y * w + x) * 4;
      for (let k = 0; k < 3; k++) data[o + k] = alpha ? toSRGB(color[k] / alpha) : 0;
      data[o + 3] = Math.round(alpha / 4);
    }
    const target = Math.round(coverage * w * h);
    if (target > 0) {
      const alphas = []; for (let i = 3; i < data.length; i += 4) alphas.push(data[i]);
      alphas.sort((a, b) => b - a);
      const pivot = alphas[Math.min(target - 1, alphas.length - 1)];
      const scale = pivot ? (Math.ceil(cutoff) + .01) / pivot : 1;
      for (let i = 3; i < data.length; i += 4) data[i] = Math.min(255, Math.round(data[i] * scale));
    }
    padRGB(data, w, h, cutoff);
    mipmaps.push({ data, width: w, height: h }); width = w; height = h;
  }
  return mipmaps;
}

export function forestDataTexture(rgba, width, height, name) {
  const mipmaps = forestMipmaps(rgba, width, height);
  const texture = new T.DataTexture(mipmaps[0].data, width, height, T.RGBAFormat);
  texture.name = name; texture.colorSpace = T.SRGBColorSpace;
  texture.wrapS = texture.wrapT = T.ClampToEdgeWrapping;
  texture.magFilter = T.LinearFilter; texture.minFilter = T.LinearMipmapLinearFilter;
  texture.mipmaps = mipmaps; texture.generateMipmaps = false;
  // ImageData starts at the top left; crown UV v=0 is the branch base.
  texture.flipY = true; texture.anisotropy = 4; texture.needsUpdate = true;
  texture.userData.rgbaMipBytes = texture.mipmaps.reduce((sum, mip) => sum + mip.data.byteLength, 0);
  return texture;
}

function fallbackTexture(family) {
  if (fallback.has(family)) return fallback.get(family);
  const size = 64, data = new Uint8Array(size * size * 4);
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const u = (x - 31.5) / size, v = y / size, segment = Math.floor(v * 7), stem = Math.abs(u) < .012 && v > .04;
    const spread = (1 - v) * .36 + .04, leaf = Math.abs(Math.abs(u) - spread) < (family === 'pine' ? .04 : .073) && Math.abs(v * 7 - segment - .45) < .28;
    const i = (y * size + x) * 4; data.set(family === 'pine' ? [101, 119, 81, stem || leaf ? 255 : 0] : [166, 141, 86, stem || leaf ? 255 : 0], i);
  }
  const texture = forestDataTexture(data, size, size, `Q ${family} loading fallback`); fallback.set(family, texture); return texture;
}

const windDeclarations = 'attribute vec3 qBranchRoot; attribute float qBranchFlex; uniform float qForestTime;\n';
export const FOREST_WIND_GLSL = `
  float qTreePhase=0.0;
  #ifdef USE_INSTANCING
  qTreePhase=instanceMatrix[3].x*.37+instanceMatrix[3].z*.29;
  #endif
  float qBranchPhase=dot(qBranchRoot,vec3(8.7,5.4,6.2));
  float qGust=sin(qForestTime*1.13+qTreePhase+qBranchPhase)*.019;
  float qFlutter=sin(qForestTime*3.1+qTreePhase*.7+qBranchPhase*1.8)*.005;
  transformed.x+=(qGust+qFlutter)*qBranchFlex;
  transformed.z+=cos(qForestTime*.87+qTreePhase+qBranchPhase)*.013*qBranchFlex;
  transformed.y+=qFlutter*.5*qBranchFlex;
`;
function installWind(material, time, family, visible) {
  material.onBeforeCompile = shader => {
    shader.uniforms.qForestTime = time;
    shader.vertexShader = windDeclarations + shader.vertexShader;
    shader.vertexShader = shader.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n' + FOREST_WIND_GLSL);
    if (visible) {
      Object.assign(shader.uniforms, atmosphereUniforms());
      shader.vertexShader = 'varying vec3 qFoliageNormal;\n' + shader.vertexShader;
      shader.vertexShader = shader.vertexShader.replace('#include <defaultnormal_vertex>', '#include <defaultnormal_vertex>\nqFoliageNormal=inverseTransformDirection(transformedNormal,viewMatrix);');
      shader.fragmentShader = 'varying vec3 qFoliageNormal; uniform vec3 qSunDirection; uniform float qDaylight;\n' + shader.fragmentShader;
      // Retain the saved seeded color stream without double-darkening photos.
      shader.fragmentShader = shader.fragmentShader.replace('#include <color_fragment>', `
        #if defined( USE_COLOR ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
        diffuseColor.rgb*=mix(vec3(.9),vColor.rgb,.3);
        #endif`);
      shader.fragmentShader = shader.fragmentShader.replace('#include <opaque_fragment>', `
        outgoingLight+=diffuseColor.rgb*max(dot(-normalize(qFoliageNormal),qSunDirection),0.0)*qDaylight*.14;
        #include <opaque_fragment>`);
    }
  };
  material.customProgramCacheKey = () => `q-forest-v24:${family}:${visible ? 'lit' : material.type}`;
}

export function forestMaterial(family, time = { value: 0 }) {
  if (!['pine', 'crown'].includes(family)) throw new Error(`Unknown forest material ${family}`);
  const material = new T.MeshStandardMaterial({ map: loaded.get(family) || fallbackTexture(family), color: 0xffffff,
    roughness: .86, metalness: 0, alphaTest: FOREST_ALPHA_TEST, side: T.DoubleSide, shadowSide: T.DoubleSide, vertexColors: true });
  material.name = `Q ${family} photographed foliage`; material.forceSinglePass = true;
  material.userData.forestFamily = family; material.userData.textureSource = loaded.has(family) ? 'Poly Haven CC0 derivative' : 'loading fallback';
  installWind(material, time, family, true); live.add(material);
  material.addEventListener('dispose', () => { live.delete(material); const pair = shadowPairs.get(material); pair?.depth.dispose(); pair?.distance.dispose(); shadowPairs.delete(material); });
  const options = { map: material.map, alphaTest: FOREST_ALPHA_TEST, side: T.DoubleSide };
  const depth = new T.MeshDepthMaterial({ ...options, depthPacking: T.RGBADepthPacking });
  const distance = new T.MeshDistanceMaterial(options);
  for (const shadow of [depth, distance]) installWind(shadow, time, family, false);
  shadowPairs.set(material, { depth, distance }); return material;
}

// Apply to both source and detail meshes: shadow maps must use the same alpha
// and wind as visible needles, otherwise branch cards cast solid rectangles.
export function configureForestMesh(mesh) {
  const pair = shadowPairs.get(mesh.material); if (!pair) return mesh;
  mesh.customDepthMaterial = pair.depth; mesh.customDistanceMaterial = pair.distance;
  mesh.receiveShadow = true; return mesh;
}

export function installForestTextures(textures) {
  for (const family of ['pine', 'crown']) if (textures[family]) loaded.set(family, textures[family]);
  for (const material of live) {
    const texture = loaded.get(material.userData.forestFamily); if (!texture) continue;
    material.map = texture; material.needsUpdate = true; material.userData.textureSource = 'Poly Haven CC0 derivative';
    const pair = shadowPairs.get(material);
    for (const shadow of [pair.depth, pair.distance]) { shadow.map = texture; shadow.needsUpdate = true; }
  }
}
