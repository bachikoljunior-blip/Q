import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {performance} from 'node:perf_hooks';

// Representation study only. Original compressed media bytes are untouched.
const alphabet=Array.from({length:94},(_,i)=>String.fromCharCode(i+33)).filter(c=>!`"'\\<>\x60`.includes(c)).slice(0,85).join('');
if(alphabet.length!==85||new Set(alphabet).size!==85)throw Error('alphabet');
const digits=new Int16Array(128).fill(-1);for(let i=0;i<85;i++)digits[alphabet.charCodeAt(i)]=i;
function encode(bytes){
  const parts=[];
  for(let i=0;i<bytes.length;i+=4){let n=(bytes[i]*16777216+(bytes[i+1]||0)*65536+(bytes[i+2]||0)*256+(bytes[i+3]||0));let s='';for(let j=0;j<5;j++){s=alphabet[n%85]+s;n=Math.floor(n/85);}parts.push(s);}
  return parts.join('');
}
function decode(text,length){
  if(text.length!==Math.ceil(length/4)*5)throw Error('length');
  const bytes=new Uint8Array(length);let out=0;
  for(let i=0;i<text.length;i+=5){let n=0;for(let j=0;j<5;j++){const d=digits[text.charCodeAt(i+j)];if(d===undefined||d<0)throw Error('digit');n=n*85+d;}if(n>4294967295)throw Error('overflow');for(let j=3;j>=0;j--){if(out+j<length)bytes[out+j]=n%256;n=Math.floor(n/256);}out+=4;}
  return bytes;
}
function dataUrl(mime,encoded,length){
  const decoded=decode(encoded,length),strings=[];
  for(let i=0;i<decoded.length;i+=8192)strings.push(String.fromCharCode(...decoded.subarray(i,i+8192)));
  return `data:${mime};base64,${btoa(strings.join(''))}`;
}
const path='/workspace/scratch/e72662e3b71f/Q-ps4-v30/release/Q-ash-pilgrim.html';
const html=await readFile(path,'utf8');const rows=[];const seen=new Set();
for(const match of html.matchAll(/data:([^"'\s;]+);base64,([A-Za-z0-9+/=]+)/g)){
  const [uri,mime,payload]=match,bytes=Buffer.from(payload,'base64'),sha256=createHash('sha256').update(bytes).digest('hex');if(seen.has(sha256))continue;seen.add(sha256);
  const start=performance.now(),encoded=encode(bytes),encodeMs=performance.now()-start;
  const t=performance.now(),restored=dataUrl(mime,encoded,bytes.length),restoreMs=performance.now()-t;
  if(restored!==uri||!Buffer.from(decode(encoded,bytes.length)).equals(bytes))throw Error('byte mismatch '+sha256);
  if(/["'\\<>\x60\s]/.test(encoded))throw Error('unsafe alphabet');
  rows.push({mime,bytes:bytes.length,sha256,base64Chars:payload.length,base85Chars:encoded.length,savedChars:payload.length-encoded.length,encodeMs,restoreMs,exactByteAndDataUriMatch:true});
}
for(let length=0;length<17;length++){const bytes=Uint8Array.from({length},(_,i)=>(length*17+i*61)%256);if(!Buffer.from(decode(encode(bytes),length)).equals(bytes))throw Error('tail padding');}
const summary={recordedAt:new Date().toISOString(),source:path,sourceSha256:createHash('sha256').update(html).digest('hex'),sourceBytes:Buffer.byteLength(html),alphabet,assets:rows.length,mediaBytes:rows.reduce((s,r)=>s+r.bytes,0),base64Chars:rows.reduce((s,r)=>s+r.base64Chars,0),base85Chars:rows.reduce((s,r)=>s+r.base85Chars,0),savedCharsBeforeHelperAndDescriptors:rows.reduce((s,r)=>s+r.savedChars,0),nodeRestoreMs:rows.reduce((s,r)=>s+r.restoreMs,0),boundaryLengths0Through16:true,allOriginalBytesAndUrisExact:true,limitations:['Node representation and timing only; no browser or device measurements','Decoder allocates temporary byte/string arrays and the final base64 data URL; peak heap and lifecycle performance are not measured','No repository/runtime/package changes and no claim of asset or perceptual quality improvement','Helper/descriptor overhead and full package lifecycle validation remain to be measured'],rows};
await writeFile(new URL('./comparison.json',import.meta.url),JSON.stringify(summary,null,2)+'\n');console.log(JSON.stringify({...summary,rows:undefined}));
