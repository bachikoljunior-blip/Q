import test from 'node:test';
import assert from 'node:assert/strict';
import {build} from 'esbuild';
import {mkdtemp,mkdir,readFile,writeFile,rm} from 'node:fs/promises';
import {buildIdentity} from '../scripts/build-identity.mjs';
import {PACKED_ALPHABET,packMedia,unpackMedia,restorePackedAsset} from '../scripts/packed-media.mjs';

test('script-safe media representation round trips byte boundaries and exact data URLs',()=>{
  assert.equal(PACKED_ALPHABET.length,85);assert.equal(new Set(PACKED_ALPHABET).size,85);assert(!/["'\\<>`\s]/.test(PACKED_ALPHABET));
  for(const length of [...Array.from({length:17},(_,i)=>i),255,256,257,8191,8192,8193]){
    const bytes=Uint8Array.from({length},(_,i)=>(length*17+i*61)%256),packed=packMedia(bytes,'application/octet-stream');
    assert.deepEqual(unpackMedia(packed).bytes,bytes);assert.equal(restorePackedAsset(packed),'data:application/octet-stream;base64,'+Buffer.from(bytes).toString('base64'));
  }
});
test('invalid headers, digits, overflow, cuts and noncanonical padding are rejected',()=>{
  for(const text of ['q85:text/plain:01:!!!!!','q85:text/plain:-1:','q85:text/plain:1:!!!!','q85:text/plain:4:~~~~~','q85:text/plain:4:{{{{{','q85:text/plain:1:!!!!#','q85:text/plain:4294967296:','q85:text/plain:9007199254740993:'])assert.throws(()=>unpackMedia(text));
  assert.throws(()=>packMedia(Uint8Array.of(1),'text/plain</script>'));
});
test('browser decoder compiles with no Node, eval, fetch or platform base64 dependencies',async()=>{
  const result=await build({stdin:{contents:"export {restorePackedAsset} from './scripts/packed-media.mjs'",resolveDir:process.cwd()},bundle:true,write:false,platform:'browser',format:'esm',minify:true});
  assert(!/\b(?:eval|Function|fetch|btoa|atob|Blob|DecompressionStream)\b/.test(result.outputFiles[0].text));
});
test('build identity detects changed or absent standalone helper inputs',async()=>{
  await mkdir('artifacts',{recursive:true});const root=await mkdtemp('artifacts/identity-fixture-');
  try{
    for(const directory of ['src','public','scripts'])await mkdir(root+'/'+directory);
    const inputs=['index.html','package.json','package-lock.json','vite.config.js','scripts/package.mjs','scripts/build-identity.mjs','scripts/packed-media.mjs','scripts/packed-media-plugin.mjs'];
    for(const path of inputs)await writeFile(root+'/'+path,await readFile(path));
    const before=await buildIdentity(root);
    for(const path of ['scripts/packed-media.mjs','scripts/packed-media-plugin.mjs']){
      const original=await readFile(root+'/'+path);await writeFile(root+'/'+path,Buffer.concat([original,Buffer.from('\n// changed input\n')]));
      assert.notEqual((await buildIdentity(root)).sourceFingerprint,before.sourceFingerprint);
      await rm(root+'/'+path);await assert.rejects(buildIdentity(root),{code:'ENOENT'});await writeFile(root+'/'+path,original);
    }
    assert.deepEqual(await buildIdentity(root),before);
  }finally{await rm(root,{recursive:true,force:true});}
});
