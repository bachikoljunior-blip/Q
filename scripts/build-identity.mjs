import {createHash} from 'node:crypto';
import {readFile,readdir} from 'node:fs/promises';
import {join} from 'node:path';

// Identical app inputs have identical identity in Vite and standalone output.
// Git HEAD, docs, timestamps and generated output must not affect regeneration.
export async function buildIdentity(root=process.cwd()){
  const paths=['index.html','package.json','package-lock.json','vite.config.js','scripts/package.mjs','scripts/build-identity.mjs','scripts/packed-media.mjs','scripts/packed-media-plugin.mjs'];
  async function walk(dir){for(const entry of await readdir(join(root,dir),{withFileTypes:true})){const path=dir+'/'+entry.name;if(entry.isDirectory())await walk(path);else if(entry.isFile())paths.push(path);}}
  await walk('src');await walk('public');
  const hash=createHash('sha256');
  for(const path of paths.sort()){const bytes=await readFile(join(root,path));hash.update(path+'\0'+bytes.length+'\0');hash.update(bytes);}
  return {version:JSON.parse(await readFile(join(root,'package.json'),'utf8')).version,sourceFingerprint:'sha256:'+hash.digest('hex')};
}
