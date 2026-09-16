import * as T from 'three';

// An authored coarse wool-like weave, not a measured fabric or photograph.
// 128 repeats across a 256 mm tile mean 2 mm yarn spacing before chart stretch.
export const CLOTH_TILE_METRES=.256;
const size=512,materials=new Map();let texture;
function clothTexture(){
  if(texture)return texture;
  const data=new Uint8Array(size*size*4),tau=Math.PI*2;
  const hash=(x,y,s)=>{let v=Math.imul(x+17,374761393)^Math.imul(y+31,668265263)^s;v=Math.imul(v^(v>>>13),1274126177);return((v^(v>>>16))>>>0)/4294967295;};
  const noise=(x,y,n,s)=>{const u=x/size*n,v=y/size*n,a=Math.floor(u),b=Math.floor(v),fx=u-a,fy=v-b,sx=fx*fx*(3-2*fx),sy=fy*fy*(3-2*fy),h=(i,j)=>hash((i+n)%n,(j+n)%n,s);return T.MathUtils.lerp(T.MathUtils.lerp(h(a,b),h(a+1,b),sx),T.MathUtils.lerp(h(a,b+1),h(a+1,b+1),sx),sy);};
  for(let y=0;y<size;y++)for(let x=0;x<size;x++){
    const coarse=noise(x,y,8,77)-.5,slub=noise(x,y,16,193)-.5;
    const warp=Math.sin(tau*(x/4+slub*.2)),weft=Math.cos(tau*(y/4+coarse*.2));
    const i=(y*size+x)*4;
    data[i]=Math.round(128+warp*weft*18+coarse*24+slub*10);
    data[i+1]=Math.round(255*(.91+coarse*.08+slub*.025));
    data[i+2]=128;data[i+3]=255;
  }
  texture=new T.DataTexture(data,size,size,T.RGBAFormat);texture.name='Q upper garment physical weave';
  texture.wrapS=texture.wrapT=T.RepeatWrapping;texture.magFilter=T.LinearFilter;texture.minFilter=T.LinearMipmapLinearFilter;
  texture.generateMipmaps=true;texture.needsUpdate=true;return texture;
}
export function upperCloth(parts,base){
  const key=base.color.getHex();let material=materials.get(key);
  if(!material){material=new T.MeshStandardMaterial({name:'Q upper cloth',color:base.color,side:base.side,roughness:1,metalness:0,bumpMap:clothTexture(),roughnessMap:clothTexture(),bumpScale:.00035});materials.set(key,material);}
  for(const [part,{geometry}]of parts.entries()){
    const p=geometry.attributes.position,uv=geometry.attributes.uv,n=part?12:18,rows=p.count/(n+1),arcs=[],travel=[0];let area=0;
    const distance=(a,b)=>Math.hypot(p.getX(a)-p.getX(b),p.getY(a)-p.getY(b),p.getZ(a)-p.getZ(b));
    for(let row=0;row<rows;row++){
      const arc=[0],start=row*(n+1);let step=0;
      for(let col=1;col<=n;col++)arc.push(arc[col-1]+distance(start+col,start+col-1));
      if(row){for(let col=0;col<n;col++)step+=distance(start+col,start+col-n-1)/n;travel.push(travel[row-1]+step);area+=(arcs[row-1][n]+arc[n])*.5*step;}
      arcs.push(arc);
    }
    // Integer circumferential tiles preserve the wrapped seam. Resulting local
    // yarn spacing still varies with taper and deformation; report that range.
    const repeats=Math.max(1,Math.round(area/travel.at(-1)/CLOTH_TILE_METRES));
    for(let row=0;row<rows;row++)for(let col=0;col<=n;col++)uv.setXY(row*(n+1)+col,arcs[row][col]/arcs[row][n]*repeats,travel[row]/CLOTH_TILE_METRES);
  }
  for(const part of parts)part.material=material;
}
