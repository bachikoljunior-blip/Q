import {readFile,writeFile} from 'node:fs/promises';
import {sub,cross,dot,length} from '../cloth-micro-v62/surfaces.mjs';
// Same limited proper-crossing oracle as v63, copied without changing v63.
const out=new URL('../../docs/evidence/mira-cloth-support-v64/',import.meta.url);
const mesh=JSON.parse(await readFile(new URL('../../docs/evidence/mira-cloth-micro-v62/meshes.json',import.meta.url))).find(m=>m.id==='P01-R');
const selected=JSON.parse(await readFile(new URL('selected.json',out)));
function proper(a,b,tri){
 const d=sub(b,a),e1=sub(tri[1],tri[0]),e2=sub(tri[2],tri[0]),p=cross(d,e2),det=dot(e1,p);
 if(Math.abs(det)<1e-13)return false;const r=sub(a,tri[0]),u=dot(r,p)/det,q=cross(r,e1),v=dot(d,q)/det,t=dot(e2,q)/det,e=1e-8;
 return u>e&&v>e&&u+v<1-e&&t>e&&t<1-e;
}
function crossings(positions){
 const tris=mesh.indices.map(t=>({ids:t,p:t.map(i=>positions[i]),min:[0,1,2].map(k=>Math.min(...t.map(i=>positions[i][k]))),max:[0,1,2].map(k=>Math.max(...t.map(i=>positions[i][k])))})),pairs=[];
 for(let i=0;i<tris.length;i++)for(let j=i+1;j<tris.length;j++){
   const a=tris[i],b=tris[j];if(a.ids.some(id=>b.ids.includes(id)))continue;
   if([0,1,2].some(k=>a.max[k]<b.min[k]||b.max[k]<a.min[k]))continue;
   if([0,1,2].some(k=>proper(a.p[k],a.p[(k+1)%3],b.p)||proper(b.p[k],b.p[(k+1)%3],a.p)))pairs.push([i,j]);
 }return pairs;
}
function foldSag(positions){const [nu,nv]=mesh.divisions,values=[];
 for(let j=0;j<=nv;j++){const a=positions[j*(nu+1)],b=positions[j*(nu+1)+nu],ab=sub(b,a),l=length(ab);let max=0;
   for(let i=1;i<nu;i++)max=Math.max(max,length(cross(sub(positions[j*(nu+1)+i],a),ab))/l);values.push(max);
 }return values;
}

const cases=selected.map(s=>({terrain:s.terrain,age:s.age,v63Crossings:crossings(s.v63),candidateCrossings:crossings(s.after),
 restSag:foldSag(s.before),v63Sag:foldSag(s.v63),candidateSag:foldSag(s.after)}));
await writeFile(new URL('shape-check.json',out),JSON.stringify({at:new Date().toISOString(),cases,
 scope:'20 selected native poses; proper segment/triangle intersections only. Shared-vertex pairs and coplanar overlaps excluded.'},null,2)+'\n');
console.log(JSON.stringify(cases.map(c=>({...c,restSag:c.restSag.filter((_,i)=>[0,8,16].includes(i)),v63Sag:c.v63Sag.filter((_,i)=>[0,8,16].includes(i)),candidateSag:c.candidateSag.filter((_,i)=>[0,8,16].includes(i))})),null,2));
