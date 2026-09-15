import * as T from 'three';
import { groundContactTexture, contactBounds } from './environment-contact.js';
import { atmosphereUniforms, skyFunctions } from './environment-atmosphere.js';

// Original, deterministic material fields. No network, canvas, image decoder or
// random gameplay stream is used. RGB is albedo modulation; alpha is roughness.
export const SURFACE_KINDS = Object.freeze(['earth','stone','wood','bark','leaf','cloth','metal','water']);
const textures = new Map(), materials = new Map(), authoredTextures = new Map(), liveMaterials = new Set();
export function installEnvironmentTextures(loaded) {
  for (const kind of ['earth', 'stone']) if (loaded[kind]) authoredTextures.set(kind, loaded[kind]);
  if (loaded.stoneNormal) authoredTextures.set('stoneNormal', loaded.stoneNormal);
  for (const material of liveMaterials) {
    const kind = material.userData.surfaceKind;
    if (material.userData.authoredSurface&&authoredTextures.has(kind)) { material.map = authoredTextures.get(kind); material.userData.textureBytes=1024*1024*4; material.needsUpdate = true; }
  }
}
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

// Three albedo taps per surface. Sourced stone adds three normal taps; terrain,
// wood, foliage and water retain one packed map and no extra lighting pass.
export function surfaceMaterial(kind,color,options={}) {
  const {worldScale=kind==='earth'?.48:kind==='bark'?1.8:kind==='stone'?.37:.9,wind=null,flow=null,unique=false,finish='raw',groundContact=false,...extra}=options;
  const key=`${kind}:${color}:${worldScale}:${finish}:${groundContact}:${JSON.stringify(extra)}`;
  if(!unique&&!wind&&!flow&&materials.has(key))return materials.get(key);
  const material=new T.MeshStandardMaterial({color,roughness:kind==='metal'?.58:kind==='water'?.24:.94,metalness:kind==='metal'?.72:0,map:(finish==='raw'&&authoredTextures.get(kind))||surfaceTexture(kind),...extra});
  material.name=`Q ${kind}`;material.userData.surfaceKind=kind;material.userData.finish=finish;material.userData.authoredSurface=finish==='raw'&&!extra.map;material.userData.textureBytes=material.userData.authoredSurface&&authoredTextures.has(kind)?1024*1024*4:128*128*4;
  liveMaterials.add(material);
  material.onBeforeCompile=shader=>{
    const photo=material.userData.authoredSurface&&authoredTextures.has(kind),photoNormal=photo&&kind==='stone'&&authoredTextures.has('stoneNormal');
    Object.assign(shader.uniforms,atmosphereUniforms());
    if(groundContact){shader.uniforms.qGroundContact={value:groundContactTexture};shader.uniforms.qContactBounds={value:contactBounds};}
    shader.uniforms.qSurfaceScale={value:worldScale};shader.uniforms.qSurfaceTime=wind||flow||{value:0};
    shader.uniforms.qRelief={value:kind==='stone'||kind==='earth'?.055:kind==='wood'||kind==='bark'?.07:.012};
    if(photoNormal)shader.uniforms.qStoneNormal={value:authoredTextures.get('stoneNormal')};
    shader.vertexShader='varying vec3 qWorld; varying vec3 qNormal; varying float qHeight; uniform float qSurfaceTime;\n'+shader.vertexShader;
    let deformation='';
    if(wind)deformation=`float qRoot=max(position.y,0.0); float qPhase=0.0;
      #ifdef USE_INSTANCING
      qPhase=instanceMatrix[3].x*.39+instanceMatrix[3].z*.28;
      #endif
      transformed.x+=(sin(qSurfaceTime*1.1+qPhase+position.y*1.8)*.024+sin(qSurfaceTime*2.3+qPhase)*.006)*qRoot;
      transformed.z+=cos(qSurfaceTime*.85+qPhase)*.018*qRoot;`;
    if(flow)deformation='transformed.y+=sin(position.z*.72+qSurfaceTime*1.3)*.035+sin(position.x*1.13-qSurfaceTime*.8)*.021;';
    shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>',`#include <begin_vertex>\nqHeight=position.y;\n${deformation}`);
    shader.vertexShader=shader.vertexShader.replace('#include <project_vertex>',`vec4 qLocal=vec4(transformed,1.0); vec3 qN=normal;
      #ifdef USE_INSTANCING
      qLocal=instanceMatrix*qLocal;
      qN/=vec3(dot(instanceMatrix[0].xyz,instanceMatrix[0].xyz),dot(instanceMatrix[1].xyz,instanceMatrix[1].xyz),dot(instanceMatrix[2].xyz,instanceMatrix[2].xyz));
      qN=mat3(instanceMatrix)*qN;
      #endif
      qN/=vec3(dot(modelMatrix[0].xyz,modelMatrix[0].xyz),dot(modelMatrix[1].xyz,modelMatrix[1].xyz),dot(modelMatrix[2].xyz,modelMatrix[2].xyz));
      qWorld=(modelMatrix*qLocal).xyz;qNormal=normalize(mat3(modelMatrix)*qN);
      #include <project_vertex>`);
    shader.fragmentShader=`varying vec3 qWorld; varying vec3 qNormal; varying float qHeight; uniform float qSurfaceScale; uniform float qSurfaceTime; uniform float qRelief;
      ${photoNormal?'uniform sampler2D qStoneNormal;':''}
      ${groundContact?'uniform sampler2D qGroundContact;uniform vec4 qContactBounds;':''}
      ${skyFunctions}\n`+shader.fragmentShader;
    const earthVariation=kind==='earth'?`
      float qRoute=1.0-smoothstep(2.8,6.2,abs(qWorld.x-7.0*sin(qWorld.z*.035)));
      float qSalt=(1.0-smoothstep(-307.0,-266.0,qWorld.x));
      float qSlope=1.0-smoothstep(.62,.9,abs(qNormal.y));
      float qBare=max(qRoute,max(qSalt,qSlope*.65));
      qSurface.rgb=mix(qSurface.rgb,vec3(.19,.167,.125)*(.83+.22*qSurface.r),qBare*.78);
      qSurface.rgb=mix(qSurface.rgb,vec3(.36,.34,.29)*(.88+.2*qSurface.r),qSalt*.85);` : '';
    shader.fragmentShader=shader.fragmentShader.replace('#include <map_fragment>',`#ifdef USE_MAP
      vec3 qBlend=pow(abs(normalize(qNormal)),vec3(5.0));qBlend/=max(dot(qBlend,vec3(1.0)),.001);
      vec3 qP=qWorld*qSurfaceScale;${flow?'qP.z-=qSurfaceTime*.035;':''}
      vec4 qSurface=texture2D(map,qP.yz)*qBlend.x+texture2D(map,qP.xz)*qBlend.y+texture2D(map,qP.xy)*qBlend.z;
      ${photo?earthVariation:''}
      ${photo?'diffuseColor.rgb=mix(vec3(.86),diffuseColor.rgb,.3)*qSurface.rgb;':'diffuseColor.rgb*=qSurface.rgb;'}
      ${groundContact?'diffuseColor.rgb*=texture2D(qGroundContact,(qWorld.xz-qContactBounds.xy)/qContactBounds.zw).r;':''}
      ${kind==='leaf'?'diffuseColor.rgb*=mix(.64,1.07,smoothstep(-.35,.45,qHeight));':''}
      ${kind==='stone'?'diffuseColor.rgb*=.91+.09*sin(qWorld.x*.12+sin(qWorld.z*.19)+qWorld.y*.21);':''}
      #endif`);
    shader.fragmentShader=shader.fragmentShader.replace('#include <roughnessmap_fragment>',`#include <roughnessmap_fragment>
      #ifdef USE_MAP
      roughnessFactor=clamp(roughnessFactor*qSurface.a,.15,1.0);
      #endif`);
    let normals;
    if(flow)normals=`normal=normalize(normal+mat3(viewMatrix)*vec3(sin(qWorld.z*2.3+qSurfaceTime*1.1)*.085+cos(qWorld.x*.81+qSurfaceTime*.7)*.035,0.0,cos(qWorld.x*2.9-qSurfaceTime)*.06));`;
    else if(photoNormal)normals=`
      vec3 qNx=texture2D(qStoneNormal,qP.yz).xyz*2.0-1.0,qNy=texture2D(qStoneNormal,qP.xz).xyz*2.0-1.0,qNz=texture2D(qStoneNormal,qP.xy).xyz*2.0-1.0;
      // Albedo and normal UVs are unflipped world yz/xz/xy. Their U/V
      // derivatives keep the same direction on both signs of each plane.
      // Only the geometric normal carries the outward-facing axis sign.
      vec3 qBump=vec3(0,qNx.x,qNx.y)*qBlend.x+vec3(qNy.x,0,qNy.y)*qBlend.y+vec3(qNz.x,qNz.y,0)*qBlend.z;
      normal=normalize(mat3(viewMatrix)*(normalize(qNormal)+qBump*.56));
      #ifdef DOUBLE_SIDED
      normal*=faceDirection;
      #endif`;
    else normals=`
      #ifdef USE_MAP
      vec3 qDx=dFdx(-vViewPosition),qDy=dFdy(-vViewPosition);vec3 qRx=cross(qDy,normal),qRy=cross(normal,qDx);float qDet=dot(qDx,qRx);
      vec3 qGradient=sign(qDet)*(dFdx(qSurface.r)*qRx+dFdy(qSurface.r)*qRy);
      normal=normalize((abs(qDet)+.000001)*normal-qRelief*qGradient);
      #endif`;
    shader.fragmentShader=shader.fragmentShader.replace('#include <normal_fragment_maps>',`#include <normal_fragment_maps>\n${normals}`);
    if(kind==='leaf')shader.fragmentShader=shader.fragmentShader.replace('#include <opaque_fragment>',`outgoingLight+=diffuseColor.rgb*max(dot(-normalize(qNormal),qSunDirection),0.0)*qDaylight*.11;\n#include <opaque_fragment>`);
    if(kind==='metal')shader.fragmentShader=shader.fragmentShader.replace('#include <opaque_fragment>',`vec3 qMetalNormal=inverseTransformDirection(normal,viewMatrix);vec3 qMetalView=normalize(cameraPosition-qWorld);outgoingLight+=qSky(reflect(-qMetalView,qMetalNormal))*diffuse*.22*(1.0-roughnessFactor*.6);\n#include <opaque_fragment>`);
    if(kind==='water')shader.fragmentShader=shader.fragmentShader.replace('#include <opaque_fragment>',`
      vec3 qWorldNormal=inverseTransformDirection(normal,viewMatrix);
      vec3 qView=normalize(cameraPosition-qWorld);
      float qFresnel=.02+.98*pow(1.0-max(dot(qView,qWorldNormal),0.0),5.0);
      vec3 qReflection=qSky(reflect(-qView,qWorldNormal));
      outgoingLight=mix(outgoingLight,qReflection,clamp(qFresnel*.86+.09,.0,.9));
      #include <opaque_fragment>`);
  };
  material.customProgramCacheKey=()=>`q-surface-v23:${kind}:${finish}:${groundContact}:${!!wind}:${!!flow}:${material.userData.authoredSurface&&authoredTextures.has(kind)}:${material.userData.authoredSurface&&kind==='stone'&&authoredTextures.has('stoneNormal')}`;
  if(!unique&&!wind&&!flow)materials.set(key,material);return material;
}

export function clothMaterial(color,time){return surfaceMaterial('cloth',color,{side:T.DoubleSide,wind:time});}
