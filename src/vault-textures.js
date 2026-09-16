import * as T from 'three';
import { VAULT_TEXTURE_URLS } from './vault-asset-urls.js';

import { VAULT_SLICES } from './vault-slices.js';

// Priority bands, not visibility cutoffs: geometry remains rendered at distance.
export const VAULT_START_RADIUS = 80, VAULT_PREFETCH_RADIUS = 120;
export const vaultTextureThemes = (point, radius = VAULT_START_RADIUS) => VAULT_SLICES.filter(slice =>
  Number.isFinite(point?.x) && Number.isFinite(point?.z) && Math.hypot(point.x - slice.center.x, point.z - slice.center.z) <= radius
).map(slice => slice.theme);

// Application-lifetime cache, at most four themes. Keep ready maps across
// retreat/title/restart, avoiding visible downgrade and duplicate downloads.
export function createVaultTextureCache({ loader = new T.TextureLoader(), now = () => performance.now(), setTimer = setTimeout, clearTimer = clearTimeout } = {}) {
  const entries = new Map(); let generation = 0, disposed = false;
  function request(theme) {
    let entry = entries.get(theme);
    if (!entry) { entry = { texture: null, pending: null, retryAt: 0 }; entries.set(theme, entry); }
    if (entry.texture) return Promise.resolve(entry.texture);
    if (entry.pending) return entry.pending;
    // TextureLoader cannot abort a browser image request. After the deadline,
    // retain its in-flight slot until it settles instead of stacking retries.
    if (entry.busy) return Promise.resolve(null);
    if (now() < entry.retryAt) return Promise.resolve(null);
    const epoch = generation; entry.busy = true;
    entry.pending = new Promise(resolve => {
      let finished = false;
      const finish = texture => {
        if (finished) { texture?.dispose(); return; }
        finished = true; clearTimer(timer); entry.pending = null;
        if (epoch !== generation) { texture?.dispose(); resolve(null); return; }
        entry.texture = texture; entry.retryAt = texture ? 0 : now() + 4000; resolve(texture);
      };
      const timer = setTimer(() => finish(null), 8000);
      entry.cancel = () => finish(null);
      Promise.resolve().then(() => loader.loadAsync(VAULT_TEXTURE_URLS[theme])).then(texture => {
        if (!texture?.isTexture || texture.image?.width !== 128 || texture.image?.height !== 128) { texture?.dispose?.(); finish(null); return; }
        texture.colorSpace = T.SRGBColorSpace; texture.wrapS = texture.wrapT = T.RepeatWrapping; texture.repeat.set(2, 2);
        finish(texture);
      }).catch(() => finish(null)).finally(() => { entry.busy = false; });
    });
    return entry.pending;
  }
  return {
    async load(point, radius = VAULT_START_RADIUS) {
      if (disposed) return {};
      await Promise.all(vaultTextureThemes(point, radius).map(request));
      return Object.fromEntries([...entries].filter(([, entry]) => entry.texture).map(([theme, entry]) => [theme, entry.texture]));
    },
    dispose() { disposed = true; generation++; for (const entry of entries.values()) { entry.cancel?.(); entry.texture?.dispose(); } entries.clear(); },
  };
}
const cache = createVaultTextureCache();
export function loadVaultTextures(point, radius) { return cache.load(point, radius); }
