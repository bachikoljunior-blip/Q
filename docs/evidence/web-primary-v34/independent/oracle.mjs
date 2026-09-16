import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {join} from 'node:path';
import {createWebReceipt} from '../Q-web-primary-v34/scripts/web-package.mjs';
import {buildIdentity} from '../Q-web-primary-v34/scripts/build-identity.mjs';
const author='/workspace/scratch/e72662e3b71f/Q-web-primary-v34',root='/workspace/scratch/e72662e3b71f/q-v34-web-review/fixture';
async function put(p,b){await mkdir(join(root,p,'..'),{recursive:true});await writeFile(join(root,p),b);}
async function output(p,b){await put('dist/'+p,b);await put('artifacts/site-review/dist/'+p,b);}
await mkdir(root+'/src',{recursive:true});await mkdir(root+'/public',{recursive:true});
for(const p of ['index.html','package.json','package-lock.json','vite.config.js','scripts/package.mjs','scripts/package-standalone.mjs','scripts/web-package.mjs','scripts/build-identity.mjs','scripts/packed-media.mjs','scripts/packed-media-plugin.mjs'])await put(p,await readFile(join(author,p)));
await put('src/photo.png',Buffer.from([1,2,3,4]));
const identity=await buildIdentity(root),manifest={'index.html':{file:'assets/index.js',dynamicImports:['src/scene.js']},'src/scene.js':{file:'assets/scene.js'},'src/photo.png':{file:'assets/photo.png'}};
await put('dist/.vite/manifest.json',JSON.stringify(manifest));await output('index.html','<script type="module" src="./assets/index.js"></script>');await output('assets/index.js',`const id=${JSON.stringify(identity)};import("./scene.js");`);await output('assets/photo.png',Buffer.from([1,2,3,4]));await output('icon.svg','<svg/>');await output('manifest.webmanifest',JSON.stringify({icons:[{src:'./icon.svg'}]}));
await put('artifacts/latest-site.json',JSON.stringify({root:'artifacts/site-review',files:['index.html','icon.svg','manifest.webmanifest','assets/index.js','assets/scene.js','assets/photo.png'].sort()}));await put('.openai/hosting.json','{}');await put('artifacts/site-review/.openai/hosting.json','{}');
const rows=[];
for(const url of ['photo.png','missing.png']){await output('assets/scene.js',`export const image=new URL("${url}",import.meta.url).href;`);let accepted=true,error=null;try{await createWebReceipt(root);}catch(e){accepted=false;error=e.message;}rows.push({url,accepted,error});}
const r={boundary:'Independent emitted-format media-URL negative control; no author edits or rendered-browser claim.',rows};await writeFile('/workspace/scratch/e72662e3b71f/q-v34-web-review/media-url-negative.json',JSON.stringify(r,null,2)+'\n');console.log(JSON.stringify(r));
