import pine from './assets/forest/pine-branch-rgba.png';
import crown from './assets/forest/crown-branch-rgba.png';
import { loadForestTextureSet } from './forest-texture-loader.js';

export const FOREST_TEXTURE_URLS = Object.freeze({ pine, crown });
export function loadForestTextures(loader, makeCanvas) { return loadForestTextureSet(FOREST_TEXTURE_URLS, loader, makeCanvas); }
