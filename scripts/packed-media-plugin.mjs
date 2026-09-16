import {readFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {transform} from 'esbuild';
import {packMedia} from './packed-media.mjs';

export function packedMediaPlugin(){
  const filter=/\.(hdr|glb|png|webp|jpg|mp4|mp3|wav)$/;
  const helper=fileURLToPath(new URL('./packed-media.mjs',import.meta.url));
  return {name:'lossless-standalone-media',setup(builder){
    // CSS still receives its original data URL: no CSS bootstrap or first-paint change.
    builder.onResolve({filter},args=>args.kind==='url-token'?{path:resolve(args.resolveDir,args.path),namespace:'css-media'}:undefined);
    builder.onLoad({filter,namespace:'css-media'},async args=>({contents:await readFile(args.path),loader:'dataurl'}));
    builder.onLoad({filter,namespace:'file'},async args=>{
      const bytes=await readFile(args.path);
      // Keep esbuild's exact MIME choice rather than maintaining a competing table.
      const result=await transform(bytes,{loader:'dataurl',sourcefile:args.path,format:'esm'});
      const match=/["']data:([^;,]+);base64,/.exec(result.code);
      if(!match)throw Error('Expected original esbuild base64 media URL: '+args.path);
      return {contents:`import {restorePackedAsset} from ${JSON.stringify(helper)};export default restorePackedAsset(${JSON.stringify(packMedia(bytes,match[1]))});`,loader:'js'};
    });
  }};
}
