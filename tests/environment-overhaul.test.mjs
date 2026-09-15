import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import * as T from 'three';
import { SURFACE_KINDS, surfacePixels, surfaceTexture, surfaceMaterial } from '../src/environment-materials.js';
import { createScenePair, nodesOf } from './static-scene-fixture.mjs';
import { Game } from '../src/core.js';

test('original packed surface payloads reproduce the recorded bytes and share one upload per family',()=>{
  const manifest=JSON.parse(readFileSync(new URL('../docs/evidence/environment-v22.json',import.meta.url)));
  for(const kind of SURFACE_KINDS){const pixels=surfacePixels(kind),entry=manifest.materialAssets.find(a=>a.id===kind);assert.equal(pixels.byteLength,entry.bytes);assert.equal(createHash('sha256').update(pixels).digest('hex'),entry.sha256);assert.equal(surfaceMaterial(kind,0x887766).map,surfaceTexture(kind));assert.equal(surfaceMaterial(kind,0x887766),surfaceMaterial(kind,0x887766));let lo=255,hi=0;for(let i=3;i<pixels.length;i+=4){lo=Math.min(lo,pixels[i]);hi=Math.max(hi,pixels[i]);}assert(hi-lo>15,kind+' needs a material-specific roughness field');}
});

test('real standard shader hooks preserve lighting and expose bounded triplanar, flow and wind contracts',()=>{
  for(const kind of['stone','earth','leaf','water']){const clock={value:1.25},material=surfaceMaterial(kind,0x999999,{wind:kind==='leaf'?clock:null,flow:kind==='water'?clock:null}),shader={uniforms:{},vertexShader:T.ShaderLib.standard.vertexShader,fragmentShader:T.ShaderLib.standard.fragmentShader};material.onBeforeCompile(shader);assert.equal((shader.fragmentShader.match(/texture2D\(map,/g)||[]).length,3);assert(shader.fragmentShader.includes('roughnessFactor*qSurface.a'));assert(shader.fragmentShader.includes('#include <lights_fragment_begin>'));assert(shader.vertexShader.includes('qLocal=instanceMatrix*qLocal'));assert(shader.vertexShader.includes('#include <project_vertex>'));assert(shader.fragmentShader.indexOf('vec4 qSurface=')<shader.fragmentShader.indexOf('roughnessFactor*qSurface.a'));if(kind==='water'||kind==='leaf')assert.equal(shader.uniforms.qSurfaceTime,clock);if(kind==='water')assert(shader.fragmentShader.includes('normal=normalize(normal+'));if(kind==='leaf')assert(shader.vertexShader.includes('float qRoot='));}
  // This checks real shader-source integration contracts, not GLSL compilation or pixels.
});

test('scenery preserves the original seeded placement stream and partitions every tree once across quality changes',async()=>{
  const[,view]=await createScenePair();
  // Frozen bytes captured from the real base constructor, so shallow CI checkouts
  // retain the old-placement oracle without needing unavailable git history.
  const baseline=JSON.parse(readFileSync(new URL('../docs/evidence/environment-v22.json',import.meta.url))).seededPlacementBaseline;
  const hash=array=>array?createHash('sha256').update(new Uint8Array(array.buffer,array.byteOffset,array.byteLength)).digest('hex'):null;
  for(let i=0;i<3;i++){assert.equal(view.treeDetail[i].total,baseline.trees[i].count);assert.equal(hash(view.treeDetail[i].matrices),baseline.trees[i].matrices);assert.equal(hash(view.treeDetail[i].colors),baseline.trees[i].colors);}
  assert.equal(hash(view.grass.instanceMatrix.array),baseline.grassMatrices);assert.equal(hash(view.grass.instanceColor.array),baseline.grassColors);assert.equal(hash(view.motes.geometry.attributes.position.array),baseline.particles);
  const stableNodes=nodesOf(view.scene).length,matrix=new T.Matrix4(),point=new T.Vector3();
  for(const quality of['low','high','medium','high'])for(const[x,z]of[[0,80],[-105,0],[-300,-130],[170,-200]]){
    view.game.player.x=x;view.game.player.z=z;view.setQuality(quality);const before=JSON.stringify(view.game.serialize());view.updateTreeDetail(true);assert.equal(JSON.stringify(view.game.serialize()),before);assert.equal(nodesOf(view.scene).length,stableNodes);
    for(const set of view.treeDetail){assert.equal(set.source.count+set.detail.count,set.total);const expected=[];for(let i=0;i<set.total;i++)expected.push(Array.from(set.matrices.subarray(i*16,i*16+16)).join(','));const actual=[];for(const mesh of[set.source,set.detail]){for(let i=0;i<mesh.count;i++){mesh.getMatrixAt(i,matrix);actual.push(matrix.elements.join(','));point.setFromMatrixPosition(matrix);assert(mesh.boundingSphere.containsPoint(point), 'changed instance bounds must include every tree origin');}}assert.deepEqual(actual.sort(),expected.sort());if(quality==='low')assert.equal(set.detail.count,0);}
  }
});

test('production enemy death plays once without changing saved state; restored dead enemies stay hidden',async()=>{
  const[,view]=await createScenePair();const enemy=view.game.enemies.find(e=>e.type==='wolf'),model=view.enemyModels.get(enemy.id),p=view.game.player;
  Object.assign(enemy,{x:p.x+2,y:p.y,z:p.z,dead:false});view.update(1/60,true);assert(model.g.visible);enemy.dead=true;const saved=JSON.stringify(view.game.serialize());view.update(1/60,true);assert(model.g.visible);assert.equal(model.deathElapsed,0);view.update(.5,true);assert(model.g.visible);assert.equal(model.motion.state,'death');view.update(.75,true);assert.equal(model.g.visible,false);assert.equal(JSON.stringify(view.game.serialize()),saved);
  const restored=new view.constructor({},new Game(JSON.parse(saved)),{quality:'low'},null);restored.update(1/60,true);assert.equal(restored.enemyModels.get(enemy.id).g.visible,false);
});
