import * as T from 'three';

// Original, deterministic material fields. No network, canvas, image decoder or
// random gameplay stream is used. RGB is albedo modulation; alpha is roughness.
export const SURFACE_KINDS = Object.freeze(['earth','stone','wood','bark','leaf','cloth','metal','water']);
const textures = new Map(), materials = new Map();
const clamp = (v, lo=0, hi=1) => Math.max(lo, Math.min(hi, v));
const noise = (x, y, seed) => { let n = Math.imul(x + 1031, 374761393) ^ Math.imul(y + 3253, 668265263) ^ seed; n = Math.imul(n ^ n >>> 13, 1274126177); return ((n ^ n >>> 16) >>> 0) / 4294967295; };
export function surfacePixels(kind, size=128) {
  if (!SURFACE_KINDS.includes(kind)) throw new Error(`Unknown surface ${kind}`);
  const pixels=new Uint8Array(size*size*4), seed=SURFACE_KINDS.indexOf(kind)*1009+5723;
  for(let y=0;y<size;y++)for(let x=0;x<size;x++){
    const u=x/size*Math.PI*2,v=y/size*Math.PI*2,n=noise(x,y,seed),broad=Math.sin(u*3+Math.sin(v*2))*Math.cos(v*3)*.5+.5;
    let value=.76+n*.18,rough=.85;
    if(kind==='earth'){const grain=Math.pow(n,7);value=.66+broad*.16+n*.14-grain*.16;rough=.79+n*.19;}
    if(kind==='stone'){const vein=Math.abs(Math.sin(u*3+Math.sin(v*2)*1.7+Math.sin(u-v)*.55));value=.63+broad*.22+n*.13-(vein<.075?.13:0);rough=.68+n*.28;}
    if(kind==='wood'||kind==='bark'){const grain=Math.sin(u*(kind==='bark'?17:23)+Math.sin(v*2)*1.3+Math.sin(v*5+u)*.5);value=.64+broad*.09+n*.1+grain*.13;rough=(kind==='bark'?.83:.65)+n*.16;}
    if(kind==='leaf'){value=.72+n*.18+Math.sin(u*12+v*4)*.07;rough=.65+n*.22;}
    if(kind==='cloth'){value=.83+((x%4<2)===(y%4<2)?-.075:.025)+n*.045;rough=.86+n*.12;}
    if(kind==='metal'){value=.79+n*.11+Math.sin(v*29)*.035-(broad>.84?.13:0);rough=.35+n*.18+broad*.15;}
    if(kind==='water'){value=.8+Math.sin(u*3+v*7+Math.sin(v*2))*.08+Math.sin(u*9-v*4)*.07;rough=.19+n*.09;}
    const i=(y*size+x)*4;pixels[i]=Math.round(clamp(value)*255);pixels[i+1]=Math.round(clamp(value*(kind==='earth'?1.02:1))*255);pixels[i+2]=Math.round(clamp(value*(kind==='wood'||kind==='bark'?.94:1))*255);pixels[i+3]=Math.round(clamp(rough)*255);
  }
  return pixels;
}
export function surfaceTexture(kind){
  if(!textures.has(kind)){const texture=new T.DataTexture(surfacePixels(kind),128,128,T.RGBAFormat);texture.name=`Q original ${kind} albedo-roughness`;texture.wrapS=texture.wrapT=T.RepeatWrapping;texture.magFilter=T.LinearFilter;texture.minFilter=T.LinearMipmapLinearFilter;texture.generateMipmaps=true;texture.colorSpace=T.NoColorSpace;texture.needsUpdate=true;textures.set(kind,texture);}
  return textures.get(kind);
}

// Three triplanar samples supply albedo and packed roughness without stretched
// terrain UVs. No per-pixel noise octaves, extra lights or shadow passes.
export function surfaceMaterial(kind,color,options={}){
  const {worldScale=kind==='earth'?.52:kind==='bark'?1.8:.9,wind=null,flow=null,unique=false,...extra}=options;
  const key=`${kind}:${color}:${worldScale}:${JSON.stringify(extra)}`;
  if(!unique&&!wind&&!flow&&materials.has(key))return materials.get(key);
  const material=new T.MeshStandardMaterial({color,roughness:kind==='metal'?.52:kind==='water'?.25:.92,metalness:kind==='metal'?.72:0,map:surfaceTexture(kind),...extra});
  material.name=`Q ${kind}`;material.userData.surfaceKind=kind;material.userData.textureBytes=128*128*4;
  material.onBeforeCompile=shader=>{
    shader.uniforms.qSurfaceScale={value:worldScale};shader.uniforms.qSurfaceTime=wind||flow||{value:0};shader.uniforms.qRelief={value:kind==='stone'||kind==='earth'?.13:kind==='wood'||kind==='bark'?.09:.018};
    shader.vertexShader='varying vec3 qWorld; varying vec3 qNormal; uniform float qSurfaceTime;\n'+shader.vertexShader;
    let deformation='';
    if(wind)deformation='float qRoot=max(position.y,0.0); float qPhase=0.0;\n#ifdef USE_INSTANCING\nqPhase=instanceMatrix[3].x*.39+instanceMatrix[3].z*.28;\n#endif\ntransformed.x+=sin(qSurfaceTime*1.6+qPhase+position.y*2.1)*.035*qRoot; transformed.z+=cos(qSurfaceTime*1.15+qPhase)*.023*qRoot;';
    if(flow)deformation='transformed.y+=sin(position.z*.72+qSurfaceTime*1.3)*.065+sin(position.x*1.13-qSurfaceTime*.8)*.038;';
    shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>',`#include <begin_vertex>\n${deformation}`);
    shader.vertexShader=shader.vertexShader.replace('#include <project_vertex>',`vec4 qLocal=vec4(transformed,1.0); vec3 qN=normal;\n#ifdef USE_INSTANCING\nqLocal=instanceMatrix*qLocal;qN=mat3(instanceMatrix)*qN;\n#endif\nqWorld=(modelMatrix*qLocal).xyz;qNormal=normalize(mat3(modelMatrix)*qN);\n#include <project_vertex>`);
    shader.fragmentShader='varying vec3 qWorld; varying vec3 qNormal; uniform float qSurfaceScale; uniform float qSurfaceTime; uniform float qRelief;\n'+shader.fragmentShader;
    shader.fragmentShader=shader.fragmentShader.replace('#include <map_fragment>',`#ifdef USE_MAP\nvec3 qBlend=pow(abs(normalize(qNormal)),vec3(5.0));qBlend/=max(dot(qBlend,vec3(1.0)),.001);vec3 qP=qWorld*qSurfaceScale;${flow?'qP.z-=qSurfaceTime*.035;':''}\nvec4 qSurface=texture2D(map,qP.yz)*qBlend.x+texture2D(map,qP.xz)*qBlend.y+texture2D(map,qP.xy)*qBlend.z;diffuseColor.rgb*=qSurface.rgb;\n#endif`);
    shader.fragmentShader=shader.fragmentShader.replace('#include <roughnessmap_fragment>','#include <roughnessmap_fragment>\n#ifdef USE_MAP\nroughnessFactor=clamp(roughnessFactor*qSurface.a,.09,1.0);\n#endif');
    if(flow)shader.fragmentShader=shader.fragmentShader.replace('#include <normal_fragment_maps>','#include <normal_fragment_maps>\nnormal=normalize(normal+vec3(sin(qWorld.z*2.3+qSurfaceTime*1.1)*.075,0.0,cos(qWorld.x*2.9-qSurfaceTime)*.06));');
    else shader.fragmentShader=shader.fragmentShader.replace('#include <normal_fragment_maps>','#include <normal_fragment_maps>\n#ifdef USE_MAP\nvec3 qDx=dFdx(-vViewPosition),qDy=dFdy(-vViewPosition);vec3 qRx=cross(qDy,normal),qRy=cross(normal,qDx);float qDet=dot(qDx,qRx);vec3 qGradient=sign(qDet)*(dFdx(qSurface.r)*qRx+dFdy(qSurface.r)*qRy);normal=normalize((abs(qDet)+.000001)*normal-qRelief*qGradient);\n#endif');
  };
  material.customProgramCacheKey=()=>`q-surface-v22:${!!wind}:${!!flow}`;
  if(!unique&&!wind&&!flow)materials.set(key,material);return material;
}

export function clothMaterial(color,time){return surfaceMaterial('cloth',color,{side:T.DoubleSide,wind:time});}
