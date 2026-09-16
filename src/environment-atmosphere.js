import * as T from 'three';
import { skyFogColor } from './sky-exposure.js';
import { SKY_WORLD_SUN, SKY_YAW, skyDayState } from './sky-field.js';

// The visible HDR and native PBR environment share a level horizon, rotation,
// solar direction and day fade. The analytic field remains the night/fallback sky.
export const atmosphere = {
  top: { value: new T.Color(0x456576) },
  horizon: { value: new T.Color(0xb6b3a0) },
  sun: { value: new T.Vector3(-.61, .7, -.37).normalize() },
  sunColor: { value: new T.Color(0xffd4a0) },
  day: { value: 1 },
  time: { value: 0 },
  hdr: { value: null }, hdrActive: { value: 0 }, hdrFade: { value: 0 }, hdrGain: { value: 1 },
  hdrInverse: { value: new T.Matrix3().setFromMatrix4(new T.Matrix4().makeRotationY(SKY_YAW)).transpose() },
};
export const skyFunctions = `
uniform vec3 qSkyTop, qSkyHorizon, qSunDirection, qSunColor;
uniform float qDaylight, qAtmosphereTime, qHDRActive, qHDRFade, qHDRGain;
uniform sampler2D qHDRMap;
uniform mat3 qHDRInverse;
vec3 qSky(vec3 direction) {
  float elevation = max(direction.y, 0.0);
  vec3 sky = mix(qSkyHorizon, qSkyTop, pow(elevation, .48));
  float sun = max(dot(direction, qSunDirection), 0.0);
  sky += qSunColor * (pow(sun, 24.0) * .055 + pow(sun, 420.0) * .16) * qDaylight * (1.0-qHDRActive);
  if(qHDRActive>.5){
    vec3 sampleDirection=normalize(qHDRInverse*direction);
    vec2 uv=vec2(atan(sampleDirection.z,sampleDirection.x)*.159154943091895+.5,asin(clamp(sampleDirection.y,-1.0,1.0))*.318309886183791+.5);
    vec3 photograph=texture2D(qHDRMap,uv).rgb*qHDRGain;
    // The photograph has synthetic content below the horizon. Keep it hidden.
    sky=mix(sky,photograph,qHDRFade*smoothstep(0.0,.06,direction.y));
  }
  return sky;
}`;
export function atmosphereUniforms() {
  return { qSkyTop: atmosphere.top, qSkyHorizon: atmosphere.horizon,
    qSunDirection: atmosphere.sun, qSunColor: atmosphere.sunColor,
    qDaylight: atmosphere.day, qAtmosphereTime: atmosphere.time,
    qHDRMap: atmosphere.hdr, qHDRActive: atmosphere.hdrActive, qHDRFade: atmosphere.hdrFade, qHDRGain: atmosphere.hdrGain, qHDRInverse: atmosphere.hdrInverse };
}
export function skyMaterial() {
  return new T.ShaderMaterial({ side: T.BackSide, depthWrite: false,
    uniforms: { ...atmosphereUniforms(), top: atmosphere.top, bottom: atmosphere.horizon },
    vertexShader: 'varying vec3 qSkyDirection; void main(){qSkyDirection=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
    fragmentShader: `${skyFunctions}
      varying vec3 qSkyDirection;
      float cloudNoise(vec2 p) {
        vec2 i=floor(p),f=fract(p); f=f*f*(3.0-2.0*f);
        vec4 k=sin(vec4(dot(i,vec2(127.1,311.7)),dot(i+vec2(1,0),vec2(127.1,311.7)),dot(i+vec2(0,1),vec2(127.1,311.7)),dot(i+vec2(1,1),vec2(127.1,311.7))))*43758.5453;
        k=fract(k); return mix(mix(k.x,k.y,f.x),mix(k.z,k.w,f.x),f.y);
      }
      void main(){
        vec3 dir=normalize(qSkyDirection),sky=qSky(dir);
        vec2 p=dir.xz/max(dir.y+.19,.08)*2.2+vec2(qAtmosphereTime*.003,0);
        float mass=cloudNoise(p)*.57+cloudNoise(p*2.03)*.28+cloudNoise(p*4.11)*.15;
        float cloud=smoothstep(.43,.71,mass)*smoothstep(.015,.12,dir.y);
        vec3 cloudColor=mix(qSkyHorizon*.53,qSkyHorizon*1.07,smoothstep(.47,.72,mass));
        sky=mix(sky,cloudColor,cloud*.67*(1.0-qHDRActive));
        float disc=smoothstep(.99993,.99997,dot(dir,qSunDirection));
        sky+=qSunColor*disc*qDaylight*3.0*(1.0-qHDRActive);
        gl_FragColor=vec4(sky,1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }` });
}
const hdrHorizon=new T.Color(),hdrDayHorizon=new T.Color();
export function installSkyAtmosphere(resource) {
  atmosphere.hdr.value=resource?.visible||null;atmosphere.hdrActive.value=resource?1:0;
  atmosphere.sun.value.set(...(resource?SKY_WORLD_SUN:[-.61,.7,-.37])).normalize();
  atmosphere.sunColor.value.set(resource?0xfff0d8:0xffd4a0);
  atmosphere.hdrFade.value=0;
  if(resource)hdrHorizon.setRGB(...resource.horizon,T.LinearSRGBColorSpace);
}
export function releaseSkyAtmosphere(resource) {
  if(atmosphere.hdr.value===resource.visible)installSkyAtmosphere(null);
}
const nightTop=new T.Color(0x101d30),dayTop=new T.Color(0x567586),nightHorizon=new T.Color(0x3b4a5a),dayHorizon=new T.Color(0xb7b6a5);
const shadowRight=new T.Vector3(),shadowUp=new T.Vector3(),worldUp=new T.Vector3(0,1,0),shadowAnchor=new T.Vector3();
export function stableShadowAnchor(position,direction,shadow,target=new T.Vector3()) {
  shadowRight.crossVectors(worldUp,direction).normalize();
  shadowUp.crossVectors(direction,shadowRight).normalize();
  const horizontal=(shadow.camera.right-shadow.camera.left)/shadow.mapSize.x;
  const vertical=(shadow.camera.top-shadow.camera.bottom)/shadow.mapSize.y;
  const x=position.x*shadowRight.x+position.y*shadowRight.y+position.z*shadowRight.z;
  const y=position.x*shadowUp.x+position.y*shadowUp.y+position.z*shadowUp.z;
  const depth=position.x*direction.x+position.y*direction.y+position.z*direction.z;
  return target.copy(shadowRight).multiplyScalar(Math.round(x/horizontal)*horizontal)
    .addScaledVector(shadowUp,Math.round(y/vertical)*vertical).addScaledVector(direction,depth);
}
export function updateAtmosphere(view, day, time) {
  const {cycle,fade,gain,energy}=skyDayState(day);
  const daylight=.16+cycle*.84;
  atmosphere.time.value=time; atmosphere.day.value=daylight;
  atmosphere.top.value.copy(nightTop).lerp(dayTop,cycle);
  atmosphere.horizon.value.copy(nightHorizon).lerp(dayHorizon,cycle);
  view.ambient.intensity=.42+daylight*.75;
  view.sun.intensity=.2+daylight*2.65;
  if(view.skyLighting){
    atmosphere.hdrFade.value=fade;atmosphere.hdrGain.value=gain;atmosphere.day.value=energy;
    hdrDayHorizon.copy(hdrHorizon).multiplyScalar(gain);
    atmosphere.horizon.value.copy(nightHorizon).lerp(hdrDayHorizon,fade);
    view.scene.environmentIntensity=.85*energy;
    // HDR supplies diffuse and rough/specular lighting to all Standard materials.
    // Keep the established night fill for navigation; reduce daytime hemisphere
    // instead of adding the old full hemisphere on top of photographic IBL.
    view.ambient.intensity=.54-.40*fade;
    view.sun.intensity=2.65*energy;
  }
  view.sun.color.copy(atmosphere.sunColor.value);
  if(view.skyLighting)skyFogColor(atmosphere.horizon.value,view.renderer.toneMappingExposure,view.scene.fog.color);
  else view.scene.fog.color.copy(atmosphere.horizon.value);
  view.scene.fog.density=.0026+(1-cycle)*.0011;
  const p=view.game.player;
  // Hold the projected world on shadow-map texels while walking. This keeps
  // thin branches and masonry shadows from crawling through subpixel samples.
  stableShadowAnchor(p,atmosphere.sun.value,view.sun.shadow,shadowAnchor);
  view.sun.position.copy(shadowAnchor).addScaledVector(atmosphere.sun.value,135);
  view.sun.target.position.copy(shadowAnchor);
  // Keep the visual horizon centred on the player throughout the wide west map.
  view.sky.position.set(p.x,p.y,p.z);
}
