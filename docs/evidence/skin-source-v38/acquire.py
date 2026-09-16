"""Read one explicitly listed skin PNG and its descriptor from official ZIP ranges.
No alternate host, transport, generation or retry. CRC validates original bytes.
"""
from pathlib import Path
import json,struct,urllib.request,zlib,hashlib,time,concurrent.futures
OUT=Path(__file__).parent
meta=json.loads((OUT/'archive-response.json').read_text());assert meta['status']==206
URL=meta['url'];etag=meta['headers']['ETag'];tail=(OUT/'archive-tail.bin').read_bytes();base=int(meta['headers']['Content-Range'].split()[1].split('-')[0]);end=tail.rfind(b'PK\x05\x06');eocd=struct.unpack_from('<4s4H2LH',tail,end);count,cdsize,cdoff=eocd[4:7];pos=cdoff-base;entries=[]
for i in range(count):
 vals=struct.unpack_from('<4s6H3L5H2L',tail,pos);assert vals[0]==b'PK\x01\x02'
 n,x,c=vals[10:13];name=tail[pos+46:pos+46+n].decode('utf8');entries.append({'name':name,'compression':vals[4],'crc32':f'{vals[7]:08x}','compressedBytes':vals[8],'bytes':vals[9],'offset':vals[16]});pos+=46+n+x+c
chosen=[e for e in entries if e['name'].startswith('skins/young_caucasian_female/')and e['name'].endswith(('.mhmat','.png'))];assert len(chosen)==2
(OUT/'selected-current-entries.json').write_text(json.dumps({'archiveURL':URL,'etag':etag,'centralDirectoryEntries':count,'selected':chosen},indent=2)+'\n')
records=[]
def fetch(a,b,slot):
 start=time.perf_counter();req=urllib.request.Request(URL,headers={'Range':f'bytes={a}-{b}','If-Range':etag})
 with urllib.request.urlopen(req,timeout=30)as r:
  assert r.status==206,(slot,r.status)
  assert r.headers['Content-Range']==f'bytes {a}-{b}/280737770',dict(r.headers)
  assert r.headers['ETag']==etag
  data=bytearray()
  while len(data)<=b-a:
   if time.perf_counter()-start>360:raise TimeoutError('bounded 360s range deadline')
   chunk=r.read(min(65536,b-a+1-len(data)))
   if not chunk:break
   data.extend(chunk)
  assert len(data)==b-a+1,(slot,len(data),b-a+1)
 rec={'slot':slot,'range':[a,b],'bytes':len(data),'seconds':time.perf_counter()-start,'status':206,'etag':etag};records.append(rec);(OUT/'transfer-progress.json').write_text(json.dumps(records,indent=2)+'\n');print(json.dumps(rec),flush=True);return bytes(data)
start=time.perf_counter();outputs=[]
try:
 for e in chosen:
  header=fetch(e['offset'],e['offset']+29,e['name']+' header');v=struct.unpack('<4s5H3L2H',header);assert v[0]==b'PK\x03\x04' and v[3]==8
  n,x=v[-2:];localname=fetch(e['offset']+30,e['offset']+29+n,e['name']+' name');assert localname.decode()==e['name']
  begin=e['offset']+30+n+x;size=e['compressedBytes']
  if e['name'].endswith('.png'):
   step=(size+3)//4;ranges=[(a,min(begin+size-1,a+step-1))for a in range(begin,begin+size,step)]
   with concurrent.futures.ThreadPoolExecutor(max_workers=4)as pool:
    jobs=[pool.submit(fetch,a,b,e['name']+f' chunk {i}')for i,(a,b)in enumerate(ranges)];compressed=b''.join(job.result()for job in jobs)
  else:compressed=fetch(begin,begin+size-1,e['name']+' body')
  data=zlib.decompress(compressed,-15);assert len(data)==e['bytes'];assert f'{zlib.crc32(data)&0xffffffff:08x}'==e['crc32']
  f=OUT/Path(e['name']).name;f.write_bytes(data);row={**e,'saved':f.name,'sha256':hashlib.sha256(data).hexdigest(),'zipCRCVerified':True};outputs.append(row);print(json.dumps(row),flush=True)
  if f.suffix=='.mhmat':
   s=data.decode();assert 'explicitly released as CC0' in s and 'diffuseTexture young_lightskinned_female_diffuse.png' in s
 result={'status':'complete','sourceType':'Separate original MakeHuman graphical skin, not OpenAI output or edited male source','archiveURL':URL,'etag':etag,'seconds':time.perf_counter()-start,'transfers':records,'outputs':outputs}
except Exception as e:
 result={'status':'failed_no_retry','errorType':type(e).__name__,'error':str(e),'archiveURL':URL,'etag':etag,'seconds':time.perf_counter()-start,'transfers':records,'outputs':outputs}
(OUT/'acquisition.json').write_text(json.dumps(result,indent=2)+'\n');print(json.dumps({k:v for k,v in result.items()if k not in ['transfers','outputs']}),flush=True)
