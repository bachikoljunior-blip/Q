import {mkdir, writeFile, rename} from 'node:fs/promises';
import {createWebReceipt} from './web-package.mjs';

// This path deliberately does not import the optional media encoder/decoder.
const receipt=await createWebReceipt();
await mkdir('release',{recursive:true});
const temporary='release/Q-web-manifest.json.tmp';
await writeFile(temporary,JSON.stringify(receipt,null,2)+'\n');
await rename(temporary,'release/Q-web-manifest.json');
console.log(`Prepared web receipt: ${receipt.fileCount} public files, ${receipt.totalBytes} bytes, ${receipt.media.length} unchanged media assets. This is not a publication receipt.`);
