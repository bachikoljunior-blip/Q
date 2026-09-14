// Structural animation tests only. Texture decoding and GPU rendering are not tested.
import { readFile } from 'node:fs/promises';
import { Texture } from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
export async function loadCharacter(name){
  const data=await readFile(new URL(`../src/assets/characters/${name}.glb`,import.meta.url));
  const loader=new GLTFLoader();
  loader.register(()=>({name:'Q_NODE_TEXTURE_STUB',loadTexture(){return Promise.resolve(new Texture());}}));
  return loader.parseAsync(data.buffer.slice(data.byteOffset,data.byteOffset+data.byteLength),'');
}
