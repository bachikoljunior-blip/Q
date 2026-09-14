import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import pilgrim from './assets/characters/pilgrim.glb';
import knight from './assets/characters/knight.glb';
import keeper from './assets/characters/keeper.glb';

let pending;
export function loadCharacterAssets(){
  if(!pending){
    const loader=new GLTFLoader();
    pending=Promise.all(Object.entries({pilgrim,knight,keeper}).map(async([name,url])=>[name,await loader.loadAsync(url)]))
      .then(entries=>Object.fromEntries(entries)).catch(error=>{pending=undefined;throw error;});
  }
  return pending;
}
