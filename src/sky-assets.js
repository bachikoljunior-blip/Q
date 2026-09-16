import sky from './assets/sky/kloofendal_48d_partly_cloudy_puresky_1k.hdr';
import { createSkySourceLoader } from './sky-texture-loader.js';
export const loadSkySource=createSkySourceLoader(sky);
