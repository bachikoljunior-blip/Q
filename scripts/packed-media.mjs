// Lossless, script-safe representation of original compressed media bytes.
// No codecs, eval, external requests, platform compression or base64 APIs.
export const PACKED_ALPHABET='!#$%&()*+,-./0123456789:;=?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[]^_abcdefghijklmnopqrstuvwxyz{';
const base64='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
const digits=new Int16Array(128).fill(-1);
for(let i=0;i<85;i++)digits[PACKED_ALPHABET.charCodeAt(i)]=i;

export function packMedia(bytes,mime){
  if(!/^[a-z0-9.+-]+\/[a-z0-9.+-]+$/.test(mime))throw Error('Invalid packed media MIME');
  const parts=[];
  for(let i=0;i<bytes.length;i+=4){
    let value=bytes[i]*16777216+(bytes[i+1]||0)*65536+(bytes[i+2]||0)*256+(bytes[i+3]||0),part='';
    for(let j=0;j<5;j++){part=PACKED_ALPHABET[value%85]+part;value=Math.floor(value/85);}
    parts.push(part);
  }
  return `q85:${mime}:${bytes.length}:`+parts.join('');
}
export function unpackMedia(packed){
  const header=/^q85:([a-z0-9.+-]+\/[a-z0-9.+-]+):(0|[1-9]\d*):/.exec(packed);
  if(!header)throw Error('Invalid packed media header');
  const length=Number(header[2]),start=header[0].length;
  if(!Number.isSafeInteger(length)||length>4294967295||packed.length-start!==Math.ceil(length/4)*5)throw Error('Invalid packed media length');
  const bytes=new Uint8Array(length);let out=0;
  for(let i=start;i<packed.length;i+=5){
    let value=0;
    for(let j=0;j<5;j++){const digit=digits[packed.charCodeAt(i+j)];if(!(digit>=0))throw Error('Invalid packed media digit');value=value*85+digit;}
    if(value>4294967295)throw Error('Packed media overflow');
    const remaining=length-out;
    if(remaining<4&&value%2**((4-remaining)*8))throw Error('Invalid packed media padding');
    bytes[out]=value>>>24;if(remaining>1)bytes[out+1]=value>>>16;if(remaining>2)bytes[out+2]=value>>>8;if(remaining>3)bytes[out+3]=value;
    out+=4;
  }
  return {mime:header[1],bytes};
}
export function restorePackedAsset(packed){
  const {mime,bytes}=unpackMedia(packed),parts=[];let chunk='';
  for(let i=0;i<bytes.length;i+=3){
    const value=bytes[i]<<16|(bytes[i+1]||0)<<8|(bytes[i+2]||0);
    chunk+=base64[value>>>18]+base64[value>>>12&63]+(i+1<bytes.length?base64[value>>>6&63]:'=')+(i+2<bytes.length?base64[value&63]:'=');
    if(chunk.length>=8192){parts.push(chunk);chunk='';}
  }
  if(chunk)parts.push(chunk);
  return `data:${mime};base64,`+parts.join('');
}
