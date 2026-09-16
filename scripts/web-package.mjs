import assert from 'node:assert/strict';
import {readFile, readdir, lstat} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {join, posix} from 'node:path';
import {buildIdentity} from './build-identity.mjs';

export const mediaPattern=/\.(hdr|glb|png|webp|jpg|mp4|mp3|wav)$/;
const digest=bytes=>createHash('sha256').update(bytes).digest('hex');
function safePath(path){
  assert(typeof path==='string'&&path&&!/[\\\0?#]/.test(path)&&!path.startsWith('/')&&posix.normalize(path)===path&&!path.split('/').includes('..'),`Unsafe public path: ${path}`);
  return path;
}
async function publicFiles(root,dir=''){
  const result=[];
  for(const item of await readdir(join(root,dir),{withFileTypes:true})){
    const path=dir?`${dir}/${item.name}`:item.name;
    assert(!item.isSymbolicLink(),`Staged symbolic link: ${path}`);
    if(item.isDirectory())result.push(...await publicFiles(root,path));
    else {assert(item.isFile(),`Non-file public output: ${path}`);result.push(safePath(path));}
  }
  return result.sort();
}
function checkReferences(path,text,files){
  const refs=[];
  if(path.endsWith('.html'))for(const match of text.matchAll(/(?:src|href)=["']([^"']+)["']/g))refs.push(match[1]);
  if(path.endsWith('.css'))for(const match of text.matchAll(/url\(\s*["']?([^"')\s]+)["']?\s*\)/g))refs.push(match[1]);
  if(path.endsWith('.js')){
    for(const match of text.matchAll(/(?:\bfrom\s*|\bimport\s*\(\s*|\bimport\s*)["'](\.{1,2}\/[^"']+\.js)["']/g))refs.push(match[1]);
    // Vite's relative-base asset imports become new URL(file, import.meta.url).
    for(const match of text.matchAll(/\bnew\s+URL\(\s*["']([^"']+)["']\s*,\s*import\.meta\.url\s*\)/g))refs.push(match[1]);
  }
  if(path.endsWith('.webmanifest'))for(const icon of JSON.parse(text).icons||[])refs.push(icon.src);
  const resolved=[];
  for(const ref of refs){
    if(ref.startsWith('data:')||ref.startsWith('#'))continue;
    assert(!/^(?:[a-z]+:|\/\/|\/)/i.test(ref),`Non-relative packaged reference: ${path}: ${ref}`);
    const target=safePath(posix.normalize(posix.join(posix.dirname(path),ref.split(/[?#]/)[0])));
    assert(files.has(target),`Missing packaged reference: ${path} -> ${ref}`);
    resolved.push(target);
  }
  return resolved;
}

// Content-addressed: no random stage path, timestamp or Git HEAD in the receipt.
// Verification always reads the currently selected fixed staging directory.
export async function createWebReceipt(root=process.cwd()){
  const stage=JSON.parse(await readFile(join(root,'artifacts/latest-site.json'),'utf8'));
  safePath(stage.root);assert(/^artifacts\/site-[^/]+$/.test(stage.root),'Unexpected staging directory');
  for(const path of ['artifacts',stage.root,`${stage.root}/dist`])assert((await lstat(join(root,path))).isDirectory(),`Staging root is not a real directory: ${path}`);
  const manifestBytes=await readFile(join(root,'dist/.vite/manifest.json')),manifest=JSON.parse(manifestBytes);
  const expected=new Set(['index.html','icon.svg','manifest.webmanifest']);
  for(const entry of Object.values(manifest)){
    for(const path of [entry.file,...entry.css||[],...entry.assets||[]])expected.add(safePath(path));
    for(const dependency of [...entry.imports||[],...entry.dynamicImports||[]])assert(manifest[dependency],`Missing manifest dependency: ${dependency}`);
  }
  const paths=[...expected].sort(),publicRoot=join(root,stage.root,'dist');
  assert.deepEqual(stage.files,paths,'Staging pointer inventory differs from the current graph');
  assert.deepEqual(await publicFiles(publicRoot),paths,'Staged files differ from the current graph');
  const files=[],referenced=new Set();
  for(const path of paths){
    const bytes=await readFile(join(publicRoot,path));
    assert(bytes.equals(await readFile(join(root,'dist',path))),`Staged bytes differ from Vite: ${path}`);
    files.push({path,bytes:bytes.length,sha256:digest(bytes)});
    if(/\.(html|css|js|webmanifest)$/.test(path))for(const reference of checkReferences(path,bytes.toString('utf8'),expected))referenced.add(reference);
  }
  const media=[],outputs=new Set();
  for(const source of Object.keys(manifest).filter(path=>mediaPattern.test(path)).sort()){
    safePath(source);const path=manifest[source].file;
    assert(referenced.has(path),`Emitted media has no packaged reference: ${source}`);
    assert(!outputs.has(path),`Multiple media sources share one output: ${path}`);outputs.add(path);
    const bytes=await readFile(join(root,source)),emitted=await readFile(join(publicRoot,path));
    assert(bytes.equals(emitted),`Media source bytes differ from output: ${source}`);
    media.push({source,path,bytes:bytes.length,sha256:digest(bytes)});
  }
  const identity=await buildIdentity(root);
  assert(manifest['index.html']?.file,'Missing application entry');
  assert((await readFile(join(publicRoot,manifest['index.html'].file),'utf8')).includes(identity.sourceFingerprint),'Web output source identity is stale');
  const hosting=await readFile(join(root,'.openai/hosting.json'));
  assert(hosting.equals(await readFile(join(root,stage.root,'.openai/hosting.json'))),'Staged hosting configuration differs from source');
  const receipt={schemaVersion:1,delivery:'web',buildIdentity:identity,entry:'index.html',manifestSha256:digest(manifestBytes),hostingSha256:digest(hosting),fileCount:files.length,totalBytes:files.reduce((sum,file)=>sum+file.bytes,0),files,media};
  return {...receipt,contentSha256:digest(JSON.stringify(receipt))};
}
export async function verifyWebReceipt(receipt,root=process.cwd()){
  assert.deepEqual(receipt,await createWebReceipt(root),'Web receipt differs from current source, build or fixed stage');
  return receipt;
}
