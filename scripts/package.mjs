import { build } from 'esbuild';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { buildIdentity } from './build-identity.mjs';
import { packedMediaPlugin } from './packed-media-plugin.mjs';
import { pathToFileURL } from 'node:url';

export async function buildStandalone(){
  const r=await build({entryPoints:['src/main.js'],bundle:true,format:'iife',minify:true,target:'es2022',write:false,outfile:'game.js',legalComments:'inline',metafile:true,plugins:[packedMediaPlugin()],define:{__Q_BUILD_INFO__:JSON.stringify(await buildIdentity())}});
  let html=await readFile('index.html','utf8');
  const script=r.outputFiles.find(f=>f.path.endsWith('.js')).text;
  const css=r.outputFiles.find(f=>f.path.endsWith('.css')).text;
  const icon=await readFile('public/icon.svg','utf8');
  html=html.replace(/<link rel="manifest"[^>]*>/,'').replace('./icon.svg','data:image/svg+xml,'+encodeURIComponent(icon));
  html=html.replace('<script type="module" src="/src/main.js"></script>',()=>'<style>'+css+'</style><script>'+script.replace(/<\/script/gi,'<\\/script')+'</script>');
  const inputs=r.metafile.outputs['game.js'].inputs;
  const mediaSources=Object.keys(r.metafile.inputs).filter(path=>/\.(hdr|glb|png|webp|jpg|mp4|mp3|wav)$/.test(path)).map(path=>path.replace(/^css-media:/,''));
  return {html,mediaSources,stats:{htmlBytes:Buffer.byteLength(html),scriptBytes:Buffer.byteLength(script),cssBytes:Buffer.byteLength(css),decoderAttributedBytes:inputs['scripts/packed-media.mjs'].bytesInOutput,packedAssets:[...script.matchAll(/["']q85:[^"']*["']/g)].length}};
}
if(process.argv[1]&&pathToFileURL(process.argv[1]).href===import.meta.url){
  const {html,stats}=await buildStandalone();
  await mkdir('release',{recursive:true});await mkdir('artifacts',{recursive:true});
  await writeFile('release/Q-ash-pilgrim.html',html);
  await writeFile('artifacts/standalone-encoding.json',JSON.stringify(stats,null,2)+'\n');
  console.log(`Created release/Q-ash-pilgrim.html (${Math.round(Buffer.byteLength(html)/1024)} KiB, self-contained, no network required).`);
}
