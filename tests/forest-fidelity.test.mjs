import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {inflateSync} from 'node:zlib';
import * as T from 'three';
import {forestCrownGeometry,forestTrunkGeometry} from '../src/forest-geometry.js';
import {forestMaterial,forestMipmaps,forestDataTexture,configureForestMesh,installForestTextures,FOREST_ALPHA_TEST,FOREST_WIND_GLSL} from '../src/forest-materials.js';
import {loadForestTextureSet} from '../src/forest-texture-loader.js';
const loadForestTextures=(loader,canvas)=>loadForestTextureSet({pine:'test:pine',crown:'test:crown'},loader,canvas);
import {Game} from '../src/core.js';

// Decode the committed 8-bit RGBA PNGs, including their real alpha. Node-only
// test; this is not a substitute for browser image decoding or WebGL pixels.
function pngRGBA(path){
 const bytes=readFileSync(path);assert.equal(bytes.readUInt32BE(0),0x89504e47);
 let at=8,width,height,raw=[];
 while(at<bytes.length){const n=bytes.readUInt32BE(at),type=bytes.toString('ascii',at+4,at+8),data=bytes.subarray(at+8,at+8+n);if(type==='IHDR'){width=data.readUInt32BE(0);height=data.readUInt32BE(4);assert.equal(data[8],8);assert.equal(data[9],6);assert.equal(data[12],0);}if(type==='IDAT')raw.push(data);at+=n+12;}
 const zipped=inflateSync(Buffer.concat(raw)),rgba=new Uint8Array(width*height*4),stride=width*4;
 const paeth=(a,b,c)=>{const p=a+b-c,pa=Math.abs(p-a),pb=Math.abs(p-b),pc=Math.abs(p-c);return pa<=pb&&pa<=pc?a:pb<=pc?b:c;};
 for(let y=0;y<height;y++){const filter=zipped[y*(stride+1)];for(let x=0;x<stride;x++){const o=y*stride+x,a=x>=4?rgba[o-4]:0,b=y?rgba[o-stride]:0,c=y&&x>=4?rgba[o-stride-4]:0;rgba[o]=(zipped[y*(stride+1)+1+x]+[0,a,b,Math.floor((a+b)/2),paeth(a,b,c)][filter])&255;}}
 return {rgba,width,height};
}
const coverage=data=>{let count=0;for(let i=3;i<data.length;i+=4)if(data[i]>=FOREST_ALPHA_TEST*255)count++;return count/(data.length/4);};

test('open near and distant foliage has finite normalized normals, real UV area, flex roots and bounded wind',()=>{
 const a=new T.Vector3(),b=new T.Vector3(),c=new T.Vector3();
 for(const family of ['pine','crown'])for(const distant of [false,true]){
  const g=forestCrownGeometry(family,distant),p=g.attributes.position,n=g.attributes.normal,uv=g.attributes.uv;
  assert.equal(g,forestCrownGeometry(family,distant));assert.equal(g.userData.primitiveShells,0);
  for(const attr of Object.values(g.attributes))for(const value of attr.array)assert(Number.isFinite(value));
  for(let i=0;i<p.count;i++){a.fromBufferAttribute(n,i);assert(Math.abs(a.length()-1)<1e-5);assert(uv.getX(i)>=0&&uv.getX(i)<=1&&uv.getY(i)>=0&&uv.getY(i)<=1);assert(g.attributes.qBranchFlex.getX(i)>=0&&g.attributes.qBranchFlex.getX(i)<=1);assert(g.boundingBox.containsPoint(a.fromBufferAttribute(p,i)));}
  for(let i=0;i<g.index.count;i+=3){a.fromBufferAttribute(p,g.index.getX(i));b.fromBufferAttribute(p,g.index.getX(i+1));c.fromBufferAttribute(p,g.index.getX(i+2));assert(b.sub(a).cross(c.sub(a)).length()>1e-7,'nondegenerate card face');}
  assert(p.count<=288);assert(g.index.count/3<=192);assert(g.userData.windMargin>Math.hypot(.019+.005,.013,.005*.5));
 }
 for(const distant of [false,true]){const g=forestTrunkGeometry(distant);for(const value of g.attributes.position.array)assert(Number.isFinite(value));for(let i=0;i<g.attributes.normal.count;i++){a.fromBufferAttribute(g.attributes.normal,i);assert(Math.abs(a.length()-1)<1e-4);}}
});

test('committed photos preserve cutout coverage across usable mips and do not carry black fringes',()=>{
 for(const family of ['pine','crown']){
  const {rgba,width,height}=pngRGBA(new URL(`../src/assets/forest/${family}-branch-rgba.png`,import.meta.url));assert.equal(width,512);assert.equal(height,512);
  for(let i=0;i<rgba.length;i+=4){const color=[rgba[i],rgba[i+1],rgba[i+2]];assert(!(Math.max(...color)>230&&Math.max(...color)-Math.min(...color)>180),'hidden RGB must not contain neon resampling fringes');}
  const texture=forestDataTexture(rgba,width,height,family),baseCoverage=coverage(rgba);assert(baseCoverage>.1&&baseCoverage<.5);assert.equal(texture.colorSpace,T.SRGBColorSpace);assert.equal(texture.generateMipmaps,false);assert.equal(texture.flipY,true);assert.equal(texture.image.data,texture.mipmaps[0].data);assert.equal(texture.mipmaps.length,10);
  for(const mip of texture.mipmaps){assert.equal(mip.data.length,mip.width*mip.height*4);if(mip.width>=16)assert(Math.abs(coverage(mip.data)-baseCoverage)<.065,'mip coverage drift');for(let i=0;i<mip.data.length;i+=4)if(mip.data[i+3]>92)assert(mip.data[i]+mip.data[i+1]+mip.data[i+2]>0,'opaque texel must retain branch color');}
  assert(texture.userData.rgbaMipBytes<=1398100);texture.dispose();
 }
 const decodedCanvas=new Uint8Array(4*4*4);for(let y=0;y<4;y++)decodedCanvas.set([0,180,0,255],(y*4)*4);const padded=forestMipmaps(decodedCanvas,4,4);assert.deepEqual(Array.from(padded[0].data.slice(4,8)),[0,180,0,0],'restore full RGB under alpha zero after canvas readback');assert.equal(padded[1].data[5],180,'mip border retains green vector');assert.equal(padded[1].data[7],0,'RGB gutter must not expand opacity');
 assert(Math.abs(forestMipmaps(new Uint8Array([255,255,255,255,0,0,0,255,255,255,255,255,0,0,0,255]),2,2)[1].data[0]-188)<=1,'sRGB mip filtering must average light in linear space');
 assert.throws(()=>forestMipmaps(new Uint8Array(12),3,1));
});

test('lit, depth and point-shadow shaders share branch movement, alpha and material updates',()=>{
 const clock={value:2.5},material=forestMaterial('pine',clock),mesh=configureForestMesh(new T.InstancedMesh(forestCrownGeometry('pine'),material,1));
 assert.equal(material.transparent,false);assert.equal(material.depthWrite,true);assert.equal(material.side,T.DoubleSide);assert.equal(material.forceSinglePass,true);
 for(const [mat,source]of [[material,T.ShaderLib.standard],[mesh.customDepthMaterial,T.ShaderLib.depth],[mesh.customDistanceMaterial,T.ShaderLib.distance]]){
  assert.equal(mat.map,material.map);assert.equal(mat.alphaTest,FOREST_ALPHA_TEST);const shader={uniforms:{},vertexShader:source.vertexShader,fragmentShader:source.fragmentShader};mat.onBeforeCompile(shader);assert.equal(shader.uniforms.qForestTime,clock);assert(shader.vertexShader.includes(FOREST_WIND_GLSL));assert(shader.fragmentShader.includes('#include <alphatest_fragment>'));assert(shader.fragmentShader.includes('#include <map_fragment>'));assert(!shader.fragmentShader.includes('qSurface'));if(mat===material){assert(shader.fragmentShader.includes('#include <lights_fragment_begin>'));assert(shader.fragmentShader.includes('mix(vec3(.9),vColor.rgb,.3)'),'Three color varying is vec4; mix must select RGB');assert(shader.vertexShader.includes('qFoliageNormal=inverseTransformDirection'));}
 }
 const texture=forestDataTexture(new Uint8Array([155,163,95,255]),1,1,'test');installForestTextures({pine:texture});assert.equal(material.map,texture);assert.equal(mesh.customDepthMaterial.map,texture);assert.equal(mesh.customDistanceMaterial.map,texture);assert.equal(material.userData.textureSource,'Poly Haven CC0 derivative');material.dispose();texture.dispose();
});

test('same 805 tree placement and LOD radii keep six draw sets and bounded triangle changes',()=>{
 const baseline=JSON.parse(readFileSync(new URL('../docs/evidence/forest-v24-baseline.json',import.meta.url))),trees=new Game().trees;
 assert.equal(trees.length,baseline.conditions.treeCount);assert.equal(trees.filter(t=>t.gold).length,baseline.conditions.broadleafTrees);
 const tris={trunk:forestTrunkGeometry().index.count/3,farTrunk:forestTrunkGeometry(true).index.count/3,pine:forestCrownGeometry('pine').index.count/3,farPine:forestCrownGeometry('pine',true).index.count/3,crown:forestCrownGeometry('crown').index.count/3,farCrown:forestCrownGeometry('crown',true).index.count/3};
 for(const scenario of baseline.scenarios){const r=baseline.conditions.qualityRadii[scenario.quality],counts={trunk:0,pine:0,crown:0,farTrunk:0,farPine:0,farCrown:0};for(const t of trees){const near=r&&Math.hypot(t.x-scenario.x,t.z-scenario.z)<r;counts[near?'trunk':'farTrunk']++;counts[t.gold?(near?'crown':'farCrown'):(near?'pine':'farPine')]+=t.gold?1:2;}assert.deepEqual(counts,scenario.counts);assert(Object.values(counts).filter(Boolean).length<=6);const triangles=Object.entries(counts).reduce((s,[n,c])=>s+c*tris[n],0);assert(triangles<scenario.triangles+30000);}
});

test('photo loader disposes temporary decoder textures, rejects a partial set and retries',async()=>{
 let fail=true,calls=0,disposed=0;const loader={async loadAsync(){calls++;if(fail&&calls===2)throw new Error('decode failed');const t=new T.Texture();t.image={width:2,height:2};t.addEventListener('dispose',()=>disposed++);return t;}},makeCanvas=()=>({getContext:()=>({drawImage(){},getImageData:()=>({data:new Uint8ClampedArray(16).fill(255)})})});
 await assert.rejects(loadForestTextures(loader,makeCanvas),/decode failed/);assert.equal(disposed,1);fail=false;const a=loadForestTextures(loader,makeCanvas),b=loadForestTextures(loader,makeCanvas);assert.equal(a,b);const result=await a;assert.equal(calls,4);assert.equal(disposed,3);assert.equal(result.pine.image.width,2);assert.equal(result.crown.image.width,2);result.pine.dispose();result.crown.dispose();
});
