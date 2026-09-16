# Historical acquisition attempt. Do not repeat these inferred URLs.
raise SystemExit("Archived only: subsequent instruction prohibits inferred URL requests")
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor
import urllib.request,time,json,hashlib,datetime
p=Path(__file__).resolve().parent; started=time.monotonic()
# The official page lists a 1K variant; its file naming follows its exact 4K links.
# One ordinary native GET per proposed file, no retries, API/mirror/auth changes.
def get(kind):
 url=f'https://dl.polyhaven.org/file/ph-assets/Textures/jpg/1k/hessian_380/hessian_380_{kind}_1k.jpg'
 record={'url':url,'urlDerivation':'1K variant of the exact official individual 4K link','beganAt':datetime.datetime.now(datetime.timezone.utc).isoformat()}
 try:
  with urllib.request.urlopen(url,timeout=30) as r:
   record['status']=r.status;data=r.read(4000000)
  if not data.startswith(b'\xff\xd8') or len(data)>=4000000:raise ValueError('JPEG or bounded-length verification failed')
  target=p/'source'/url.rsplit('/',1)[1];target.write_bytes(data)
  record.update(bytes=len(data),sha256=hashlib.sha256(data).hexdigest(),file=target.name)
 except Exception as e:record['error']=type(e).__name__+': '+str(e)
 print(json.dumps(record),flush=True);return record
with ThreadPoolExecutor(max_workers=3) as pool: records=list(pool.map(get,['diff','nor_gl','rough']))
(p/'acquisition.json').write_text(json.dumps({'began':'2026-09-16T06:23:39Z','ended':datetime.datetime.now(datetime.timezone.utc).isoformat(),'nativeDownloadWallSeconds':time.monotonic()-started,'records':records,'priorAPIAttempt':{'info':'403 Forbidden','files':'Remote end closed connection without response','session':70414,'exitCode':130,'savedBytes':0}},indent=2)+'\n')
