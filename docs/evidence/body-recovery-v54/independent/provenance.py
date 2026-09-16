from pathlib import Path
import sys,json,hashlib,math,re
root=Path(sys.argv[1]);d=root/'src/assets/characters';meta=json.loads((d/'body-profile-provenance.json').read_text());raw=(d/meta['source']['file']).read_bytes();h=lambda b:hashlib.sha256(b).hexdigest()
assert h(raw)==meta['source']['sha256'];assert len(raw)==meta['source']['bytes'];assert (d/meta['source']['licenseFile']).is_file()
generator=root/meta['generator']['file'];assert h(generator.read_bytes())==meta['generator']['sha256'];data=(d/meta['output']['file']).read_bytes();assert h(data)==meta['output']['sha256'];assert len(data)==meta['output']['bytes']
arrays=[json.loads(t) for t in re.findall(r'export const \w+=(\[[^;]+\]);',data.decode())];assert len(arrays)==2
verts=[];groups={};faces=[];group=None
for line in raw.decode().splitlines():
 a=line.split()
 if not a:continue
 if a[0]=='v':verts.append(tuple(map(float,a[1:4])))
 elif a[0]=='g':group=a[1]
 elif a[0]=='f':
  ids=[int(x.split('/')[0])-1 for x in a[1:]];groups.setdefault(group,set()).update(ids)
  if group=='body':faces.extend((ids[0],ids[i],ids[i+1]) for i in range(1,len(ids)-1))
def joint(n):
 ids=groups['joint-'+n];return [sum(verts[i][k] for i in ids)/len(ids) for k in range(3)]
def sub(a,b):return [x-y for x,y in zip(a,b)]
def dot(a,b):return sum(x*y for x,y in zip(a,b))
def length(a):return math.sqrt(dot(a,a))
def cross(a,b):return [a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]]
def unit(a):return [x/length(a) for x in a]
scale=1.94/(max(verts[i][1] for i in groups['body'])-min(verts[i][1] for i in groups['body']));assert abs(scale-meta['registration']['uniformScale'])<1e-12
out=[]
for s in meta['sections']:
 kind,r=s['label'].split('-');r=int(r);p=0 if kind=='torso' else 1;blend=meta['registration']['torsoBlend' if p==0 else 'sleeveBlend'][r]
 expected=[round(1+blend*(min(1.18,max(.82 if p==0 else 1,x))-1)*(max(0,-math.cos(i/len(s['rawNormalizedRadii'])*math.tau)) if p==0 else 1),6) for i,x in enumerate(s['rawNormalizedRadii'])];assert expected==arrays[p][r]
 center=s['sourceCenter'];axis=unit(s['sourceAxis']);u=unit(cross(axis,[0,0,1]));v=unit(cross(u,axis));graph={};coords={}
 for face in faces:
  points=[]
  for i,j in [(face[0],face[1]),(face[1],face[2]),(face[2],face[0])]:
   a,b=verts[i],verts[j];da=dot(sub(a,center),axis);db=dot(sub(b,center),axis)
   if (da<=0<db) or (db<=0<da):points.append([a[k]+(b[k]-a[k])*da/(da-db) for k in range(3)])
  if len(points)==2:
   keys=[tuple(round(c,6) for c in x) for x in points]
   for i,j in [(0,1),(1,0)]:graph.setdefault(keys[i],set()).add(keys[j]);coords[keys[i]]=points[i]
 components=[];todo=set(graph)
 while todo:
  stack=[todo.pop()];part=[]
  while stack:
   a=stack.pop();part.append(a)
   for b in graph[a]:
    if b in todo:todo.remove(b);stack.append(b)
  components.append(part)
 part=min(components,key=lambda a:sum(length(sub(coords[x],center)) for x in a)/len(a));points=[[dot(sub(coords[x],center),d) for d in [u,v]] for x in part];bounds=[(min(a[k] for a in points),max(a[k] for a in points)) for k in [0,1]];half=[(b-a)*scale/2 for a,b in bounds];offset=[(a+b)*scale/2 for a,b in bounds]
 assert len(part)==s['sectionVertices'];assert len(components)==s['components'];assert max(abs(a-b) for a,b in zip(half,s['sourceHalfExtentsM']))<1e-12;assert max(abs(a-b) for a,b in zip(offset,s['sourceCenterOffsetM']))<1e-12
 out.append({'section':s['label'],'components':len(components),'selectedPoints':len(part),'halfExtentsM':half,'centerOffsetM':offset,'raysClamped':sum(x<(.82 if p==0 else 1) or x>1.18 for x in s['rawNormalizedRadii']),'rays':len(expected),'factorMin':min(expected),'factorMax':max(expected)})
result={'sourceSHA256':h(raw),'sourceBytes':len(raw),'generatorSHA256':h(generator.read_bytes()),'outputSHA256':h(data),'sourceBodyTriangles':len(faces),'sections':out,'scope':'Independent re-intersection of original body triangle planes, nearest connected component, bounds and clamp/blend output from declared raw radii. Raw radii ray hits themselves were source-inspected, not independently re-solved here. Bbox center offsets removed by registration; clothing radii/ease and clamps authored, not calibrated cloth thickness or demographic inference. No source or runtime file written.'}
Path(__file__).with_name('provenance-review.json').write_text(json.dumps(result,indent=2)+'\n');print(json.dumps({'sections':len(out),'sourceBodyTriangles':len(faces),'clampedRays':sum(x['raysClamped'] for x in out),'rays':sum(x['rays'] for x in out)}))
