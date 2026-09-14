import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdir, mkdtemp, writeFile, readFile, readdir, rm } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { spawnSync } from 'node:child_process';

test('failed staging preserves the last valid pointer and removes partial output',async()=>{
  await mkdir('artifacts',{recursive:true});const root=await mkdtemp('artifacts/staging-test-');
  try{
    for(const dir of ['dist/.vite','dist/assets','.openai','artifacts'])await mkdir(join(root,dir),{recursive:true});
    for(const name of ['index.html','icon.svg','manifest.webmanifest'])await writeFile(join(root,'dist',name),name);
    await writeFile(join(root,'.openai/hosting.json'),'{}');
    await writeFile(join(root,'dist/assets/current.js'),'verified output');
    await writeFile(join(root,'dist/.vite/manifest.json'),JSON.stringify({entry:{file:'assets/current.js'}}));
    const script=resolve('scripts/stage-site.mjs');
    const run=()=>spawnSync(process.execPath,[script],{cwd:root,encoding:'utf8'});
    const success=run();assert.equal(success.status,0,success.stderr);
    const pointer=await readFile(join(root,'artifacts/latest-site.json'),'utf8');
    const saved=JSON.parse(pointer);assert.equal(await readFile(join(root,saved.root,'dist/assets/current.js'),'utf8'),'verified output');
    await writeFile(join(root,'dist/.vite/manifest.json'),JSON.stringify({entry:{file:'assets/current.js'},missing:{file:'assets/missing.js'}}));
    const failure=run();assert.notEqual(failure.status,0);assert(failure.stderr.includes('ENOENT'));
    assert.equal(await readFile(join(root,'artifacts/latest-site.json'),'utf8'),pointer);
    const remaining=(await readdir(join(root,'artifacts'))).filter(name=>name.startsWith('site-'));assert.equal(remaining.length,1);
  }finally{await rm(root,{recursive:true});}
});
