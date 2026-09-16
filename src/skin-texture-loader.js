import * as T from 'three';

// One application-lifetime decoded texture, shared by all eligible faces and
// qualities. No image import here: Node fixtures supply an explicit loader.
export function createSkinTextureCache(url, loader = new T.TextureLoader()) {
  let pending, texture, generation = 0;
  return {
    load() {
      if (pending) return pending;
      const epoch = generation;
      const request = Promise.resolve().then(() => loader.loadAsync(url)).then(value => {
        if (epoch !== generation) { value.dispose(); throw Error('Skin load released'); }
        if (!value?.isTexture || value.image?.width !== 2048 || value.image?.height !== 2048) {
          value?.dispose?.(); throw Error('Skin texture must decode to 2048×2048');
        }
        value.name = 'MakeHuman CC0 young male skin / WebP q95';
        value.colorSpace = T.SRGBColorSpace;
        // Original OBJ v grows upwards; browser image rows grow downwards.
        value.flipY = true;
        value.wrapS = value.wrapT = T.ClampToEdgeWrapping;
        value.minFilter = T.LinearMipmapLinearFilter; value.magFilter = T.LinearFilter;
        value.generateMipmaps = true; value.anisotropy = 2;
        value.needsUpdate = true; texture = value;
        return value;
      }).catch(error => { if (pending === request) pending = undefined; throw error; });
      pending = request;
      return request;
    },
    // Detach live face maps before releasing this application cache. Actors do
    // not own or dispose it. A late decode after release cannot re-enter cache.
    dispose() { generation++; texture?.dispose(); texture = undefined; pending = undefined; },
  };
}
