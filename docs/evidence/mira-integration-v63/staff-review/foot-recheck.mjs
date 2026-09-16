import{readFile,writeFile}from'node:fs/promises';import{createHash}from'node:crypto';import{pathToFileURL}from'node:url';import assert from'node:assert/strict';
const root=process.argv[2]||'/workspace/scratch/e72662e3b71f/Q-mira-micro-v63',out=new URL('./',import.meta.url),start=new Date().toISOString(),sha=b=>createHash('sha256').update(b).digest('hex');
const path=root+'/review/staff-v63/staff-parts.mjs',current=await readFile(path,'utf8');assert.equal(sha(current),'c71aad81b0acaff2070b3681dcdae8ba057c51a28468cef5a16957fa69d1f5cc');
// Recover the immediately reviewed exact bytes by undoing ONLY the reported
// textual foot extension. The prior hash must match, otherwise stop.
const prior=current.replace('shaft:{bottom:4,visibleTaperBottom:30,top:1418,r0:18,r1:21}','shaft:{bottom:30,top:1418,r0:18,r1:21}').replace('    // Concealed constant-radius extension reaches the actual S03 top face;\n    // the visible taper from Y30 upward is unchanged.\n    S01:[[0,4],[18,4],[18,30],[21,1418],[0,1418]],','    S01:[[0,30],[18,30],[21,1418],[0,1418]],');
assert.equal(sha(prior),'bb16b0fe5584dcf85be6fd016da4b8510df49bafe05e73194b864e76a9238f7e');await writeFile(new URL('staff-after-collar-before-foot.mjs.txt',out),prior);
const T=await import(pathToFileURL(root+'/node_modules/three/build/three.module.js'));
const resolve=s=>s.replaceAll("from 'three'","from '"+pathToFileURL(root+'/node_modules/three/build/three.module.js').href+"'").replaceAll("from 'three/addons/utils/BufferGeometryUtils.js'","from '"+pathToFileURL(root+'/node_modules/three/examples/jsm/utils/BufferGeometryUtils.js').href+"'");
const before=await import('data:text/javascript;base64,'+Buffer.from(resolve(prior)).toString('base64')),after=await import(pathToFileURL(path)),A=before.makeStaffLower(),B=after.makeStaffLower();
function arrays(m){return{position:Array.from(m.geometry.attributes.position.array),normal:Array.from(m.geometry.attributes.normal.array),uv:Array.from(m.geometry.attributes.uv.array),index:Array.from(m.geometry.index.array)}}
for(const m of A.children)if(m.name!=='S01')assert.deepEqual(arrays(m),arrays(B.getObjectByName(m.name)));
for(const[id,p]of Object.entries(before.profiles()))if(id!=='S01')assert.deepEqual(p,after.profiles()[id]);
function tris(m){const p=m.geometry.attributes.position,I=m.geometry.index;return Array.from({length:I.count/3},(_,f)=>{const v=[0,1,2].map(k=>new T.Vector3().fromBufferAttribute(p,I.getX(f*3+k)).multiplyScalar(1000)),t=new T.Triangle(...v);return{f,v,t,n:t.getNormal(new T.Vector3()),box:new T.Box3().setFromPoints(v)}});}
const wood=tris(B.getObjectByName('S01')),ferrule=tris(B.getObjectByName('S02')),disc=tris(B.getObjectByName('S03'));
const seat=disc.filter(t=>t.n.y>.999999&&t.v.every(p=>Math.abs(p.y-4)<1e-4)),bottom=wood.filter(t=>t.n.y<-.999999&&t.v.every(p=>Math.abs(p.y-4)<1e-4));assert.equal(bottom.length,16);assert.equal(seat.length,16);
const outer=seat.flatMap(t=>t.v).filter(v=>Math.hypot(v.x,v.z)>20),uniq=[...new Map(outer.map(v=>[v.toArray().join(':'),v])).values()].sort((a,b)=>Math.atan2(a.z,a.x)-Math.atan2(b.z,b.x));assert.equal(uniq.length,16);
let minInside=Infinity;for(const t of bottom)for(const p of t.v)for(let j=0;j<16;j++){
 const a=uniq[j],b=uniq[(j+1)%16],ex=b.x-a.x,ez=b.z-a.z;const d=(ex*(p.z-a.z)-ez*(p.x-a.x))/Math.hypot(ex,ez);minInside=Math.min(minInside,d);
}assert.ok(minInside>3);
function signature(t){return t.v.map(p=>p.toArray().join(',')).sort().join(';');}
const visible=(m)=>tris(m).filter(t=>Math.abs(t.n.y)<.99&&Math.min(...t.v.map(p=>p.y))>=29.9999).map(signature).sort();assert.deepEqual(visible(A.getObjectByName('S01')),visible(B.getObjectByName('S01')));
function hit(a,b,t){const d=b.clone().sub(a),L=d.length();if(L<1e-8)return false;const p=new T.Ray(a,d.divideScalar(L)).intersectTriangle(...t.v,false,new T.Vector3());if(!p)return false;const s=p.distanceTo(a);if(s<1e-7||s>L-1e-7)return false;const bcc=t.t.getBarycoord(p,new T.Vector3());return bcc&&Math.min(bcc.x,bcc.y,bcc.z)>1e-7;}
let crossing=0;for(const a of wood)for(const b of ferrule){if(!a.box.intersectsBox(b.box))continue;let any=false;for(let k=0;k<3;k++)any||=hit(a.v[k],a.v[(k+1)%3],b)||hit(b.v[k],b.v[(k+1)%3],a);if(any)crossing++;}assert.equal(crossing,0);
const planeWood=bottom[0].v[0].y,planeSeat=seat[0].v[0].y;
const report={start,finish:new Date().toISOString(),source:{path,sha256:sha(current)},recoveredPrior:{sha256:sha(prior),exactHashMatchesPreviouslyReviewedBytes:true,method:'reverse only the declared foot text diff, require full old SHA, rewrite import locations only for temporary Node data-URL loading'},
 unchanged:{allNonS01NativeAttributes:true,allNonS01Profiles:true,visibleS01SideTrianglesY30AndAbove:true,visibleSideTriangles:visible(B.getObjectByName('S01')).length},
 support:{woodPlaneMm:planeWood,discPlaneMm:planeSeat,gapMm:planeWood-planeSeat,woodFaces:bottom.length,discFaces:seat.length,woodContactAreaMm2:bottom.reduce((s,t)=>s+t.t.getArea(),0),minimumInsideDiscPolygonMm:minInside,coverage:1,method:'all vertices of each wooden cap triangle are inside the same convex disc top polygon and coplanar; hence every point of those triangles is supported'},
 S01S02properCrossings:crossing,limits:['radial ferrule clearance still exists','no adhesive/retention strength or physical material simulation','only hidden wood extension rechecked, no full sweep or new plot','no hand/device/render approval']};
assert.equal(sha(await readFile(path)),sha(current));await writeFile(new URL('foot-recheck.json',out),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));
