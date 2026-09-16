import skin from './assets/characters/skin/young-male-q95.webp';
import { createSkinTextureCache } from './skin-texture-loader.js';

export const SKIN_TEXTURE_URL = skin;
const cache = createSkinTextureCache(skin);
export function loadSkinTexture() { return cache.load(); }
export function releaseSkinTextureCache() { cache.dispose(); }
