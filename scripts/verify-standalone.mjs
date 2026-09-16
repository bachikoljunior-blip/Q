import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
import {buildIdentity} from './build-identity.mjs';
import {unpackMedia} from './packed-media.mjs';
import {mediaPattern,verifyWebReceipt} from './web-package.mjs';

export async function verifyStandalone(html,root=process.cwd()){
  const manifest=JSON.parse(await readFile(`${root}/dist/.vite/manifest.json`,'utf8'));
  assert(html.includes((await buildIdentity(root)).sourceFingerprint),'Standalone source identity is stale');
  assert(!/<script[^>]+src=/.test(html),'Standalone contains an external script');
  assert(!/<link[^>]+(?:stylesheet|manifest)/.test(html),'Standalone contains an external stylesheet or manifest');
  assert(!/import\(["']\.\/assets\//.test(html),'Standalone contains an unresolved production import');
  assert(html.includes('aria-busy')&&html.includes('SceneView'),'Standalone omits the lazy scene bootstrap');
  const embedded=[...html.matchAll(/data:[^"'\s;]+;base64,([A-Za-z0-9+/=]+)/g)].map(match=>Buffer.from(match[1],'base64'));
  embedded.push(...[...html.matchAll(/["'](q85:[^"'\\<>`\s]*)["']/g)].map(match=>Buffer.from(unpackMedia(match[1]).bytes)));
  const sources=Object.keys(manifest).filter(source=>mediaPattern.test(source));
  assert.equal(embedded.length,sources.length,'Standalone media count differs from the current web graph');
  for(const source of sources){
    const original=await readFile(`${root}/${source}`);
    assert.equal(embedded.filter(bytes=>bytes.equals(original)).length,1,`Standalone must embed exactly one complete source asset: ${source}`);
  }
  return {htmlBytes:Buffer.byteLength(html),media:sources.length};
}
if(process.argv[1]&&pathToFileURL(process.argv[1]).href===import.meta.url){
  await verifyWebReceipt(JSON.parse(await readFile('release/Q-web-manifest.json','utf8')));
  const result=await verifyStandalone(await readFile('artifacts/Q-ash-pilgrim-standalone.html','utf8'));
  console.log(`Verified optional standalone: ${result.htmlBytes} bytes, ${result.media} complete media assets. No aggregate publishing-blob ceiling applies to this local artifact.`);
}
