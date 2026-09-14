// Stage only the current build graph. Old hashed assets must never re-enter deployment.
import assert from 'node:assert/strict';
import { readFile, mkdir, copyFile, link, unlink, rmdir, mkdtemp, writeFile, rename } from 'node:fs/promises';
import { dirname, join } from 'node:path';
const manifest=JSON.parse(await readFile('dist/.vite/manifest.json','utf8'));
const files=new Set(['index.html','icon.svg','manifest.webmanifest']);
for(const entry of Object.values(manifest))for(const file of [entry.file,...entry.css||[],...entry.assets||[]]){
  assert(file&&!file.includes('..')&&!file.startsWith('/'),'Unsafe output path');files.add(file);
}
await mkdir('artifacts',{recursive:true});
const root=await mkdtemp('artifacts/site-');
const created=[],directories=new Set();
async function stageFile(source,dest){
  const parent=dirname(dest);await mkdir(parent,{recursive:true});directories.add(parent);created.push(dest);
  // The validated build is kept unchanged until publication completes. Linking its
  // immutable output avoids another model-sized allocation; other filesystems copy.
  try{await link(source,dest);}catch(error){if(!['EXDEV','ENOSYS','EPERM','EOPNOTSUPP'].includes(error.code))throw error;await copyFile(source,dest);}
}
try{
  for(const file of files)await stageFile(join('dist',file),join(root,'dist',file));
  await stageFile('.openai/hosting.json',join(root,'.openai/hosting.json'));
  const pointer=join(root,'staging.json');created.push(pointer);
  await writeFile(pointer,JSON.stringify({root,files:[...files].sort()},null,2)+'\n');
  await rename(pointer,'artifacts/latest-site.json');
  console.log(JSON.stringify({root,files:files.size}));
}catch(error){
  for(const file of created)await unlink(file).catch(()=>{});
  for(const dir of [...directories].sort((a,b)=>b.length-a.length))await rmdir(dir).catch(()=>{});
  await rmdir(join(root,'dist')).catch(()=>{});await rmdir(root).catch(()=>{});
  throw error;
}
