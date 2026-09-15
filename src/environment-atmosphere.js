import * as T from 'three';

// A single analytic sky is shared with water reflections. This is neither a
// captured environment nor screen-space reflection, and requires no render pass.
export const atmosphere = {
  top: { value: new T.Color(0x456576) },
  horizon: { value: new T.Color(0xb6b3a0) },
  sun: { value: new T.Vector3(-.61, .7, -.37).normalize() },
  sunColor: { value: new T.Color(0xffd4a0) },
  day: { value: 1 },
  time: { value: 0 },
};
export const skyFunctions = `
uniform vec3 qSkyTop, qSkyHorizon, qSunDirection, qSunColor;
uniform float qDaylight, qAtmosphereTime;
vec3 qSky(vec3 direction) {
  float elevation = max(direction.y, 0.0);
  vec3 sky = mix(qSkyHorizon, qSkyTop, pow(elevation, .48));
  float sun = max(dot(direction, qSunDirection), 0.0);
  sky += qSunColor * (pow(sun, 24.0) * .055 + pow(sun, 420.0) * .16) * qDaylight;
  return sky;
}`;
export function atmosphereUniforms() {
  return { qSkyTop: atmosphere.top, qSkyHorizon: atmosphere.horizon,
    qSunDirection: atmosphere.sun, qSunColor: atmosphere.sunColor,
    qDaylight: atmosphere.day, qAtmosphereTime: atmosphere.time };
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
        sky=mix(sky,cloudColor,cloud*.67);
        float disc=smoothstep(.99993,.99997,dot(dir,qSunDirection));
        sky+=qSunColor*disc*qDaylight*3.0;
        gl_FragColor=vec4(sky,1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }` });
}
const nightTop=new T.Color(0x101d30),dayTop=new T.Color(0x567586),nightHorizon=new T.Color(0x3b4a5a),dayHorizon=new T.Color(0xb7b6a5);
export function updateAtmosphere(view, day, time) {
  const cycle=(Math.sin((day-.04)*Math.PI*2)+1)/2;
  const daylight=.16+cycle*.84;
  atmosphere.time.value=time; atmosphere.day.value=daylight;
  atmosphere.top.value.copy(nightTop).lerp(dayTop,cycle);
  atmosphere.horizon.value.copy(nightHorizon).lerp(dayHorizon,cycle);
  view.ambient.intensity=.42+daylight*.75;
  view.sun.intensity=.2+daylight*2.65;
  view.sun.color.copy(atmosphere.sunColor.value);
  view.scene.fog.color.copy(atmosphere.horizon.value);
  view.scene.fog.density=.0026+(1-cycle)*.0011;
  const p=view.game.player;
  view.sun.position.set(p.x+atmosphere.sun.value.x*135,p.y+atmosphere.sun.value.y*135,p.z+atmosphere.sun.value.z*135);
  view.sun.target.position.set(p.x,p.y,p.z);
  // Keep the visual horizon centred on the player throughout the wide west map.
  view.sky.position.set(p.x,p.y,p.z);
}
