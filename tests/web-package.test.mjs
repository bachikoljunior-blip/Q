import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,readFile,writeFile,rm,rename} from 'node:fs/promises';
import {join,resolve} from 'node:path';
import {execFileSync} from 'node:child_process';
import {buildIdentity} from '../scripts/build-identity.mjs';
import {createWebReceipt,verifyWebReceipt} from '../scripts/web-package.mjs';
import {verifyStandalone} from '../scripts/verify-standalone.mjs';

async function fixture(run){
  await mkdir('artifacts',{recursive:true});const root=await mkdtemp('artifacts/web-package-fixture-');
  async function put(path,bytes){await mkdir(join(root,path,'..'),{recursive:true});await writeFile(join(root,path),bytes);}
  const stage='artifacts/site-fixed';
  async function output(path,bytes){await put('dist/'+path,bytes);await put(stage+'/dist/'+path,bytes);}
  try{
    for(const dir of ['src','public'])await mkdir(join(root,dir));
    const inputs=['index.html','package.json','package-lock.json','vite.config.js','scripts/package.mjs','scripts/package-standalone.mjs','scripts/web-package.mjs','scripts/build-identity.mjs','scripts/packed-media.mjs','scripts/packed-media-plugin.mjs'];
    for(const path of inputs)await put(path,await readFile(path));
    await put('src/photo.png',Buffer.from([1,3,5,7]));
    const identity=await buildIdentity(root);
    const manifest={'index.html':{file:'assets/index.js',dynamicImports:['src/scene.js']},'src/scene.js':{file:'assets/scene.js'},'src/photo.png':{file:'assets/photo.png'}};
    await put('dist/.vite/manifest.json',JSON.stringify(manifest));
    await output('index.html','<script type="module" src="./assets/index.js"></script><link rel="icon" href="./icon.svg">');
    await output('assets/index.js',`const identity=${JSON.stringify(identity)};import("./scene.js");`);
    await output('assets/scene.js','export const image=new URL("photo.png",import.meta.url).href;');
    await output('assets/photo.png',await readFile(join(root,'src/photo.png')));
    await output('icon.svg','<svg/>');await output('manifest.webmanifest',JSON.stringify({icons:[{src:'./icon.svg'}]}));
    const pointer={root:stage,files:['index.html','icon.svg','manifest.webmanifest','assets/index.js','assets/scene.js','assets/photo.png'].sort()};
    await put('artifacts/latest-site.json',JSON.stringify(pointer));await put('.openai/hosting.json','{}');await put(stage+'/.openai/hosting.json','{}');
    await run({root,stage,put,output,identity,pointer,manifest});
  }finally{await rm(root,{recursive:true,force:true});}
}

test('receipt is deterministic across fixed-stage names and rejects stale or modified content',async()=>fixture(async({root,stage,put,output,pointer})=>{
  const receipt=await createWebReceipt(root);assert.equal(receipt.media.length,1);assert.equal(receipt.fileCount,6);
  assert.deepEqual(await verifyWebReceipt(receipt,root),receipt);
  await rename(join(root,stage),join(root,'artifacts/site-repacked'));
  pointer.root='artifacts/site-repacked';await put('artifacts/latest-site.json',JSON.stringify(pointer));
  assert.deepEqual(await createWebReceipt(root),receipt);
  await put(pointer.root+'/dist/assets/scene.js','tampered');
  await assert.rejects(verifyWebReceipt(receipt,root),/Staged bytes differ/);
  await put('dist/assets/scene.js','tampered');
  await assert.rejects(verifyWebReceipt(receipt,root),/no packaged reference/);
  await put(pointer.root+'/dist/assets/scene.js','export const image=new URL("photo.png",import.meta.url).href; // modified');
  await put('dist/assets/scene.js','export const image=new URL("photo.png",import.meta.url).href; // modified');
  await assert.rejects(verifyWebReceipt(receipt,root),/Web receipt differs/);
}));

test('missing, extra and duplicate staged files cannot pass the receipt inventory',async()=>fixture(async({root,stage,put,pointer})=>{
  await put(stage+'/dist/old.js','obsolete');await assert.rejects(createWebReceipt(root),/Staged files differ/);
  await rm(join(root,stage,'dist/old.js'));await rm(join(root,stage,'dist/assets/photo.png'));
  await assert.rejects(createWebReceipt(root),/Staged files differ/);
  await put(stage+'/dist/assets/photo.png',Buffer.from([1,3,5,7]));pointer.files.push(pointer.files[0]);await put('artifacts/latest-site.json',JSON.stringify(pointer));
  await assert.rejects(createWebReceipt(root),/pointer inventory/);
}));

test('missing references, unsafe manifest paths and mismatched original media are rejected before packaging',async()=>fixture(async({root,put,output,identity,manifest})=>{
  await output('assets/index.js',`const id="${identity.sourceFingerprint}";import("./absent.js");`);
  await assert.rejects(createWebReceipt(root),/Missing packaged reference/);
  await output('assets/index.js',`const id="${identity.sourceFingerprint}";import("./scene.js");`);
  await output('assets/scene.js','export const image=new URL("missing.png",import.meta.url).href;');
  await assert.rejects(createWebReceipt(root),/Missing packaged reference/);
  await output('assets/scene.js','export const image=null;');
  await assert.rejects(createWebReceipt(root),/no packaged reference/);
  await output('assets/scene.js','export const image=new URL("photo.png",import.meta.url).href;');
  await output('assets/photo.png',Buffer.from([1,3,5,8]));await assert.rejects(createWebReceipt(root),/Media source bytes differ/);
  manifest['src/photo.png'].file='../escape.png';await put('dist/.vite/manifest.json',JSON.stringify(manifest));
  await assert.rejects(createWebReceipt(root),/Unsafe public path/);
}));

test('optional standalone verifier rejects a syntactically valid media byte mutation',async()=>fixture(async({root,identity})=>{
  const header=`<script>"${identity.sourceFingerprint}";"aria-busy";"SceneView";</script>`;
  const good=header+'"data:image/png;base64,AQMFBw=="';
  assert.equal((await verifyStandalone(good,root)).media,1);
  await assert.rejects(verifyStandalone(good.replace('AQMFBw==','AQMFCA=='),root),/exactly one complete source asset/);
  await assert.rejects(verifyStandalone(good+'"data:image/png;base64,AQMFBw=="',root),/media count/);
}));

test('default package writes only the web receipt without executing the optional encoder or decoder',async()=>fixture(async({root,put})=>{
  await put('loader.mjs',`export async function resolve(s,c,next){if(s==='esbuild'||/packed-media/.test(s))throw Error('Optional codec loaded by default package');return next(s,c);}`);
  await put('register.mjs',`import {register} from 'node:module';register('./loader.mjs',import.meta.url);`);
  execFileSync(process.execPath,['--import',resolve(root,'register.mjs'),resolve('scripts/package.mjs')],{cwd:root,stdio:'pipe'});
  const receipt=JSON.parse(await readFile(join(root,'release/Q-web-manifest.json'),'utf8'));
  assert.deepEqual(receipt,await createWebReceipt(root));
  await assert.rejects(readFile(join(root,'artifacts/Q-ash-pilgrim-standalone.html')),{code:'ENOENT'});
}));
