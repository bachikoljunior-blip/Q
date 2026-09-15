import * as T from 'three';
import { VAULT_TEXTURE_URLS } from './vault-asset-urls.js';

let pending;
export function loadVaultTextures() {
  if (!pending) {
    const loader = new T.TextureLoader();
    pending = Promise.all(Object.entries(VAULT_TEXTURE_URLS).map(async ([name, url]) => {
      const texture = await loader.loadAsync(url); texture.colorSpace = T.SRGBColorSpace;
      texture.wrapS = texture.wrapT = T.RepeatWrapping; texture.repeat.set(2, 2);
      return [name, texture];
    })).then(Object.fromEntries).catch(error => { pending = undefined; throw error; });
  }
  return pending;
}
