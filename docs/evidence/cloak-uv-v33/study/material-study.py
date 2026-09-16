"""Read-only source pixel/metadata analysis; exact copies only, no image edits."""
from pathlib import Path
from PIL import Image
import hashlib,json,math,shutil,datetime
import numpy as np
HERE=Path(__file__).resolve().parent
OLD=HERE.parent/'q-v26-actor-options'
REPO=HERE.parent/'Q-ps4-v30'
manifest=json.loads((OLD/'actor_material_download_manifest.json').read_text())
copied=[]
for row in manifest:
 if row['asset']!='cotton_jersey': continue
 source=OLD/Path(row['path']).name;raw=source.read_bytes()
 assert hashlib.sha256(raw).hexdigest()==row['sha256']
 assert hashlib.md5(raw).hexdigest()==row['actual_md5'] and len(raw)==row['actual_bytes']
 target=HERE/'source'/source.name;target.write_bytes(raw)
 im=Image.open(source);im.load()
 w,h=im.size;mips=[]
 while True:
  mips.append([w,h,w*h*4])
  if w==1 and h==1:break
  w=max(1,w//2);h=max(1,h//2)
 item={**row,'path':str(target),'acquisition':'Exact copy of previously downloaded official bytes; no duplicate network transfer or image alteration.','mipRGBA8Bytes':sum(x[2]for x in mips),'mipLevels':mips}
 if row['channel']=='Diffuse':
  a=np.array(im,dtype=np.float64)/255
  linear=np.where(a<=.04045,a/12.92,((a+.055)/1.055)**2.4)
  item['imageStats']={'sRGBMean':a.mean(axis=(0,1)).tolist(),'linearRGBMean':linear.mean(axis=(0,1)).tolist(),'sRGBP01':np.quantile(a,.01,axis=(0,1)).tolist(),'sRGBP99':np.quantile(a,.99,axis=(0,1)).tolist()}
  gray=linear@np.array([.2126,.7152,.0722]);spectra={}
  for axis,label in [(1,'horizontal'),(0,'vertical')]:
   # Mean power across rows/columns; excludes periods longer than 1/20 tile.
   spec=np.abs(np.fft.rfft(gray-gray.mean(axis=axis,keepdims=True),axis=axis))**2
   power=spec.mean(axis=1-axis);order=np.argsort(power[20:])[::-1][:5]+20
   spectra[label]=[{'cyclesPerTile':int(k),'pixelPeriod':gray.shape[axis]/k,'power':float(power[k])}for k in order]
  item['imageStats']['rawFrequencyPeaksAbove20CyclesPerTile']=spectra
 copied.append(item)
for name in ['polyhaven_files_cotton_jersey.json','polyhaven_info_cotton_jersey.json','cotton_official_jpg_comparison.json']:
 shutil.copyfile(OLD/name,HERE/'source'/name)
info=json.loads((OLD/'polyhaven_info_cotton_jersey.json').read_text())
files=json.loads((OLD/'polyhaven_files_cotton_jersey.json').read_text())
cloth=[]
for y in range(64):
 for x in range(64):
  h=((x*73856093)^(y*19349663))&0xffffffff;noise=(h%127)/127
  weave=math.sin(x*math.pi/2)*math.cos(y*math.pi/2)
  cloth.append([math.floor(128+(noise-.5)*42+weave*25+.5),math.floor(255*min(1,.94+(noise-.5)*.12)+.5)])
c=np.array(cloth)/255
budgets={'additionalRuntimeBytesCap':160000,'additionalDecodedMipRGBA8BytesCap':1398100,'baseV30StandaloneBytes':16327411,'standaloneCapBytes':16777216,'baseV30RemainingBytes':449805,'faceCandidateEstimatedReservedBytes':94000,'bowEstimatedReservedBytes':4000,'remainingBeforeDialogueAndMaterialsBytes':351805,'base64BytesOf160000Binary':4*math.ceil(160000/3),'remainingAfterThoseReservationsAnd160000BinaryBase64BeforeDialogueCodeMarkupBytes':351805-4*math.ceil(160000/3)}
result={'timeUTC':datetime.datetime.now(datetime.timezone.utc).isoformat(),'sourceBase':'fb07441c63cc8e7c985972691eccaed0e1fa50b3','geometrySourceSHA256':hashlib.sha256((REPO/'src/assets/characters/detailed-geometry.js').read_bytes()).hexdigest(),'candidate':'cotton_jersey','officialPagesRecheckedUTC':'2026-09-16','apiReaderStatus':'web reader files/info returned not safe to open (non-retryable error); not retried through another route. Previously acquired exact official metadata retained.','physicalSizeM':[v/1000 for v in info['dimensions']],'authors':info['authors'],'license':'CC0-1.0','licenseURL':'https://polyhaven.com/license','assetURL':'https://polyhaven.com/a/cotton_jersey','originalFiles':copied,'availableDiffuseResolutionKeys':list(files['Diffuse']),'budgets':budgets,'currentSynthetic':{'RGBA64MipBytes':sum(4*s*s for s in [64,32,16,8,4,2,1]),'sharedKinds':5,'clothHeightRedRange':c[:,0].min().item(),'clothHeightRedMax':c[:,0].max().item(),'clothRoughGreenMean':c[:,1].mean().item(),'clothRoughGreenMin':c[:,1].min().item(),'clothRoughGreenMax':c[:,1].max().item(),'clothBumpScale':.0014,'clothRepeat':[4,4],'clothWeavePixelPeriod':4,'clothWeavePeriodsPerUV':64,'capeWidthM':[.53,.93],'capeLengthM':1.15,'capeNominalWeavePeriodHorizontalM':[.53/64,.93/64],'capeNominalWeavePeriodVerticalM':1.15/64},'candidateDecision':'Not suitable for direct runtime adoption at fixed byte/mip cap. One diffuse alone exceeds both. No derivative, downsample, retouch, bitmap generation or live integration made.','imageEditingPerformed':False}
(HERE/'material-source-analysis.json').write_text(json.dumps(result,indent=2)+'\n')
print(json.dumps({'copiedBytes':sum(x['actual_bytes']for x in copied),'diffuseRGBA8MipBytes':copied[0]['mipRGBA8Bytes'],'diffuseStats':copied[0].get('imageStats'),'synthetic':result['currentSynthetic'],'budgets':budgets},indent=2))
