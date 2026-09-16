import * as T from 'three';
import { forestDataTexture } from './forest-materials.js';

let pending;
export function loadForestTextureSet(urls, loader = new T.TextureLoader(), makeCanvas = (width, height) => {
  const canvas = document.createElement('canvas'); canvas.width = width; canvas.height = height; return canvas;
}) {
  if (!pending) pending = Promise.allSettled(Object.entries(urls).map(async ([family, url]) => {
    const source = await loader.loadAsync(url);
    try {
      const { width, height } = source.image, canvas = makeCanvas(width, height), context = canvas.getContext('2d', { willReadFrequently: true });
      if (!context) throw new Error('Foliage texture decoder unavailable');
      context.drawImage(source.image, 0, 0);
      const rgba = context.getImageData(0, 0, width, height).data;
      return [family, forestDataTexture(rgba, width, height, `Q Poly Haven ${family} alpha foliage`)];
    } finally { source.dispose(); }
  })).then(results => {
    const failure = results.find(result => result.status === 'rejected');
    if (failure) { for (const result of results) if (result.status === 'fulfilled') result.value[1].dispose(); throw failure.reason; }
    return Object.fromEntries(results.map(result => result.value));
  }).catch(error => { pending = undefined; throw error; });
  return pending;
}
