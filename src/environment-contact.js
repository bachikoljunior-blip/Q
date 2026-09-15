import * as T from 'three';

// Static ground contact only, rasterized from the SAME solid obstacle positions.
// One shared 512² single-channel map. This is ambient grounding, not a dynamic
// shadow, SSAO, collision change, or a replacement for directional shadows.
const size=512, left=-510, bottom=-330, width=840, depth=660;
export const contactBounds=new T.Vector4(left,bottom,width,depth);
const pixels=new Uint8Array(size*size).fill(255);
export const groundContactTexture=new T.DataTexture(pixels,size,size,T.RedFormat);
groundContactTexture.name='Q static terrain contact';
groundContactTexture.magFilter=groundContactTexture.minFilter=T.LinearFilter;
groundContactTexture.colorSpace=T.NoColorSpace;
groundContactTexture.needsUpdate=true;
let previous;
export function bakeGroundContact(obstacles) {
  const key=obstacles.map(o=>`${o.x},${o.z},${o.r},${o.type}`).join(';');
  if(key===previous)return;
  previous=key;pixels.fill(255);
  for(const o of obstacles){
    if(o.type==='salt-gate')continue;
    const radius=Math.min(9,(o.r||1)*(o.type==='tree'?3.2:1.15)+1.1);
    const minX=Math.max(0,Math.floor((o.x-radius-left)/width*size)),maxX=Math.min(size-1,Math.ceil((o.x+radius-left)/width*size));
    const minZ=Math.max(0,Math.floor((o.z-radius-bottom)/depth*size)),maxZ=Math.min(size-1,Math.ceil((o.z+radius-bottom)/depth*size));
    for(let z=minZ;z<=maxZ;z++)for(let x=minX;x<=maxX;x++){
      const wx=left+(x+.5)/size*width,wz=bottom+(z+.5)/size*depth;
      const distance=Math.hypot(wx-o.x,wz-o.z)/radius;
      if(distance>=1)continue;
      const amount=(1-distance)*(1-distance)*(o.type==='tree'?.23:.31);
      pixels[z*size+x]=Math.min(pixels[z*size+x],Math.round(255*(1-amount)));
    }
  }
  groundContactTexture.needsUpdate=true;
}
