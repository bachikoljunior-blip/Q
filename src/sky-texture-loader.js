import { HDRLoader } from 'three/addons/loaders/HDRLoader.js';
import { HalfFloatType } from 'three';

// Cache decoded CPU pixels, never a GPU texture shared across renderers. A failed
// download/parse clears the promise so the existing launch retry can try again.
export function createSkySourceLoader(url,makeLoader=()=>new HDRLoader()) {
  let pending;
  return function loadSkySource() {
    if(!pending)pending=(async()=>{
      const texture=await makeLoader().setDataType(HalfFloatType).loadAsync(url);
      try {
        const {data,width,height}=texture.image;
        if(width!==1024||height!==512||!(data instanceof Uint16Array)||data.length!==width*height*4)throw Error('Sky HDR has unexpected dimensions or pixel type');
        for(let i=0;i<data.length;i+=4)for(let c=0;c<3;c++)if((data[i+c]&0x7c00)===0x7c00||(data[i+c]&0x8000)!==0)throw Error('Sky HDR contains invalid radiance');
        return Object.freeze({data,width,height});
      } finally {texture.dispose();}
    })().catch(error=>{pending=undefined;throw error;});
    return pending;
  };
}
