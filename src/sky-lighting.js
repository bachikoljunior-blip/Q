import * as T from 'three';
import { prepareSkyEnvironment, SKY_YAW } from './sky-field.js';

function radianceTexture(source) {
  const texture=new T.DataTexture(source.data,source.width,source.height,T.RGBAFormat,T.HalfFloatType);
  texture.colorSpace=T.LinearSRGBColorSpace;texture.mapping=T.EquirectangularReflectionMapping;
  texture.flipY=true;texture.generateMipmaps=false;texture.minFilter=texture.magFilter=T.LinearFilter;
  texture.wrapS=T.RepeatWrapping;texture.needsUpdate=true;return texture;
}

// One synchronous loading-stage GPU bake. Public Three API derives face=width/4:
// 512 input fixes face128; passing a size argument to fromEquirectangular does not.
export function createSkyLighting(renderer,source,makeGenerator=()=>new T.PMREMGenerator(renderer)) {
  // WebGL2 alone does not promise renderable RGBA16F attachments. Match Three's
  // public capability policy, without creating textures or baking on fallback.
  const supported=renderer.extensions?.has?.('EXT_color_buffer_float')===true||renderer.extensions?.has?.('EXT_color_buffer_half_float')===true;
  if(!supported)return null;
  const field=prepareSkyEnvironment(source);
  const state={target:renderer.getRenderTarget(),face:renderer.getActiveCubeFace(),mip:renderer.getActiveMipmapLevel(),xr:renderer.xr.enabled,autoClear:renderer.autoClear};
  let visible,input,generator,output;
  try {
    visible=radianceTexture(source);input=radianceTexture(field);generator=makeGenerator();
    output=generator.fromEquirectangular(input);
    if(output.width!==384||output.height!==512||output.texture.mapping!==T.CubeUVReflectionMapping)throw Error('Unexpected sky PMREM layout');
    let disposed=false;
    return {visible,environment:output.texture,yaw:SKY_YAW,horizon:field.horizon,
      budget:{visibleBytes:4194304,environmentBytes:1572864,temporaryInputBytes:1048576,temporaryPingBytes:1572864,pmremFace:128},
      dispose(){if(disposed)return;disposed=true;visible.dispose();output.dispose();}};
  } catch(error) {visible?.dispose();output?.dispose();throw error;}
  finally {
    // The public PMREM implementation restores these only on successful return.
    renderer.setRenderTarget(state.target,state.face,state.mip);renderer.xr.enabled=state.xr;renderer.autoClear=state.autoClear;
    input?.dispose();generator?.dispose();
  }
}
