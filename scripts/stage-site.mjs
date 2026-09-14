// Stage only the current build graph. Old hashed assets must never re-enter deployment.
import assert from 'node:assert/strict';
import { readFile, mkdir, copyFile, mkdtemp, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
const manifest=JSON.parse(await readFile('dist/.vite/manifest.json','utf8'));
const files=new Set(['index.html','icon.svg','manifest.webmanifest']);
for(const entry of Object.values(manifest))for(const file of [entry.file,...entry.css||[],...entry.assets||[]]){
  assert(file&&!file.includes('..')&&!file.startsWith('/'),'Unsafe output path');files.add(file);
}
await mkdir('artifacts',{recursive:true});
const root=await mkdtemp('artifacts/site-');
for(const file of files){const dest=join(root,'dist',file);await mkdir(dirname(dest),{recursive:true});await copyFile(join('dist',file),dest);}
await mkdir(join(root,'.openai'),{recursive:true});await copyFile('.openai/hosting.json',join(root,'.openai/hosting.json'));
await writeFile('artifacts/latest-site.json',JSON.stringify({root,files:[...files].sort()},null,2)+'\n');
console.log(JSON.stringify({root,files:files.size}));
