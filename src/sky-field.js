import { DataUtils, Vector3 } from 'three';

// Measured in the original, unrotated CC0 Radiance panorama; +Y stays vertical.
export const SKY_YAW = 3.193171925892692;
export const SKY_SOURCE_SUN = Object.freeze([.5545829108103306,.7419213933971978,.3768161900140457]);
export const SKY_WORLD_SUN = Object.freeze(new Vector3(...SKY_SOURCE_SUN).applyAxisAngle(new Vector3(0,1,0),SKY_YAW).toArray());
export const SKY_GROUND = Object.freeze([.085,.075,.055]);
export function skyDirection(x,y,width,height) {
  const longitude=((x+.5)/width-.5)*Math.PI*2,latitude=(.5-(y+.5)/height)*Math.PI;
  return [Math.cos(latitude)*Math.cos(longitude),Math.sin(latitude),Math.cos(latitude)*Math.sin(longitude)];
}
const smooth=(a,b,x)=>{const t=Math.max(0,Math.min(1,(x-a)/(b-a)));return t*t*(3-2*t);};
export function skyDayState(day) {
  const cycle=(Math.sin((day-.04)*Math.PI*2)+1)/2;
  const fade=smooth(.03,.72,cycle),gain=.4+.6*cycle;
  return {cycle,fade,gain,energy:fade*gain};
}

// Work on linear radiance. Solid-angle strip weights integrate sin(latitude),
// rather than treating the very small polar texels like equatorial texels.
// Only the IBL copy loses the photographed solar disc: the directional light is
// its single direct-light replacement. The visible photograph stays untouched.
export function prepareSkyEnvironment(source) {
  const {data,width,height}=source;
  if(width!==1024||height!==512||!(data instanceof Uint16Array)||data.length!==width*height*4)throw Error('Expected the verified 1024×512 half-float sky');
  const read=(index)=>DataUtils.fromHalfFloat(data[index]);
  const annulus=[0,0,0];let weightSum=0;
  const inner=Math.cos(4*Math.PI/180),outer=Math.cos(8*Math.PI/180);
  for(let y=0;y<height;y++)for(let x=0;x<width;x++) {
    const d=skyDirection(x,y,width,height),dot=d.reduce((v,n,i)=>v+n*SKY_SOURCE_SUN[i],0);
    if(dot<inner&&dot>outer){const weight=Math.cos((.5-(y+.5)/height)*Math.PI),i=(y*width+x)*4;for(let c=0;c<3;c++)annulus[c]+=read(i+c)*weight;weightSum+=weight;}
  }
  for(let c=0;c<3;c++)annulus[c]/=weightSum;
  const output=new Uint16Array(512*256*4),horizon=[0,0,0];let horizonWeight=0;
  for(let y=0;y<256;y++)for(let x=0;x<512;x++) {
    const sum=[0,0,0];let weights=0;
    for(let dy=0;dy<2;dy++) {
      const sy=y*2+dy,lat0=(.5-sy/height)*Math.PI,lat1=(.5-(sy+1)/height)*Math.PI,weight=Math.sin(lat0)-Math.sin(lat1);
      for(let dx=0;dx<2;dx++) {
        const sx=x*2+dx,d=skyDirection(sx,sy,width,height),index=(sy*width+sx)*4;
        const dot=d.reduce((v,n,i)=>v+n*SKY_SOURCE_SUN[i],0),sun=smooth(Math.cos(4*Math.PI/180),Math.cos(2*Math.PI/180),dot),ground=1-smooth(-.16,0,d[1]);
        for(let c=0;c<3;c++)sum[c]+=((read(index+c)*(1-sun)+annulus[c]*sun)*(1-ground)+SKY_GROUND[c]*ground)*weight;
        weights+=weight;
      }
    }
    const index=(y*512+x)*4;
    for(let c=0;c<3;c++)output[index+c]=DataUtils.toHalfFloat(sum[c]/weights);
    output[index+3]=DataUtils.toHalfFloat(1);
    const elevation=skyDirection(x,y,512,256)[1];
    if(elevation>.02&&elevation<.08){for(let c=0;c<3;c++)horizon[c]+=sum[c]/weights;horizonWeight++;}
  }
  return {data:output,width:512,height:256,horizon:horizon.map(v=>v/horizonWeight),sunFill:annulus};
}
