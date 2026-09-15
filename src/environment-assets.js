import * as T from 'three';
import earth from './assets/environment/forest_floor_diff_1k.jpg';
import stone from './assets/environment/rock_face_03_diff_1k.jpg';
import stoneNormal from './assets/environment/rock_face_03_nor_gl_1k.jpg';

// Byte-identical CC0 source maps, shared by every terrain/stone material. Loaded
// only with the 3D entrypoint. No runtime CDN request or per-prop texture upload.
export const ENVIRONMENT_TEXTURE_URLS = Object.freeze({ earth, stone, stoneNormal });
let pending;
export function loadEnvironmentTextures(loader = new T.TextureLoader()) {
  if (!pending) pending = Promise.allSettled(Object.entries(ENVIRONMENT_TEXTURE_URLS).map(async ([kind, url]) => {
    const texture = await loader.loadAsync(url);
    texture.name = `Q Poly Haven ${kind}`;
    texture.colorSpace = kind.endsWith('Normal') ? T.NoColorSpace : T.SRGBColorSpace;
    texture.wrapS = texture.wrapT = T.RepeatWrapping;
    texture.minFilter = T.LinearMipmapLinearFilter;
    texture.anisotropy = 4;
    return [kind, texture];
  })).then(results => {
    const failure = results.find(result => result.status === 'rejected');
    if (failure) {
      for (const result of results) if (result.status === 'fulfilled') result.value[1].dispose();
      throw failure.reason;
    }
    return Object.fromEntries(results.map(result => result.value));
  }).catch(error => { pending = undefined; throw error; });
  return pending;
}
