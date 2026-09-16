"""Independent millimetre geometry checks and CPU orthographic design plots.
No renderer or source imagery is used to draw these figures. Flat ID colours
encode parts, not materials. Projected faces use approximate centroid ordering.
"""
import json, math, time, hashlib
from pathlib import Path
from collections import Counter, defaultdict
import numpy as np
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from matplotlib.collections import PolyCollection, LineCollection
from matplotlib.patches import Polygon, Rectangle

start=time.perf_counter()
raw=json.loads(Path('geometry.json').read_text())
EPS=1e-5 # millimetres; bigger than observed Float32 conversion error

def orient(a,b,c):
    u=b-a;v=c-a;return float(u[0]*v[1]-u[1]*v[0])
def inside(point,poly):
    x,y=point;hit=False
    for a,b in zip(poly,np.roll(poly,-1,axis=0)):
        if min(a[1],b[1])<y<=max(a[1],b[1]):
            at=a[0]+(y-a[1])*(b[0]-a[0])/(b[1]-a[1])
            if x<at:hit=not hit
    return hit
def proper_cross(a,b,c,d):
    return orient(a,b,c)*orient(a,b,d)<-1e-16 and orient(c,d,a)*orient(c,d,b)<-1e-16
def profile_cross(poly):
    found=[];n=len(poly)
    for i in range(n):
        for j in range(i+1,n):
            if j==i+1 or (i==0 and j==n-1):continue
            if proper_cross(poly[i],poly[(i+1)%n],poly[j],poly[(j+1)%n]):found.append([i,j])
    return found
def nonadjacent_touch(poly):
    hits=[];n=len(poly)
    for i in range(n):
        a,b=poly[i],poly[(i+1)%n]
        for j in range(i+1,n):
            if j==i+1 or (i==0 and j==n-1):continue
            c,d=poly[j],poly[(j+1)%n]
            touch=proper_cross(a,b,c,d)
            for x,p,q in [(a,c,d),(b,c,d),(c,a,b),(d,a,b)]:
                touch |= abs(orient(p,q,x))<EPS and bool(np.all(x>=np.minimum(p,q)-EPS) and np.all(x<=np.maximum(p,q)+EPS))
            if touch:hits.append([i,j])
    return hits
def faceted_inside(p,poly,n):
    a=math.atan2(p[2],p[0])%(2*math.pi);step=2*math.pi/n
    mid=(math.floor(a/step)+.5)*step
    profile_r=math.hypot(p[0],p[2])*math.cos(a-mid)/math.cos(step/2)
    return inside([profile_r,p[1]],poly)

parts=[];checks=[]
for item in raw['parts']:
    p=np.array(item['positions'],float).reshape(-1,3)*1000
    indices=np.array(item['indices'],int).reshape(-1,3)
    normal=np.array(item['normals'],float).reshape(-1,3)
    tri=p[indices];cross=np.cross(tri[:,1]-tri[:,0],tri[:,2]-tri[:,0]);length=np.linalg.norm(cross,axis=1);face=cross/length[:,None]
    assert np.isfinite(p).all() and np.isfinite(normal).all()
    edges=defaultdict(list)
    for fi,t in enumerate(indices):
        for a,b in zip(t,np.roll(t,-1)):edges[tuple(sorted((int(a),int(b))))].append((fi,int(a)<int(b)))
    boundary=[e for e,v in edges.items() if len(v)!=2]
    unorient=[e for e,v in edges.items() if len(v)==2 and v[0][1]==v[1][1]]
    volume=float(np.einsum('ij,ij->i',tri[:,0],np.cross(tri[:,1],tri[:,2])).sum()/6)
    spec=item['spec'];profile=np.array(spec['profileMm'],float);segments=len(p)//len(profile)
    # Verify actual face connectivity stays inside adjacent meridian/azimuth cells.
    invalid_cells=0
    for t in indices:
        rows=set((t//segments).tolist());cols=set((t%segments).tolist())
        def adjacent(s,n):
            if len(s)!=2:return False
            a,b=sorted(s);return b-a==1 or (a==0 and b==n-1)
        if not adjacent(rows,len(profile)) or not adjacent(cols,segments):invalid_cells+=1
    radial=np.linalg.norm(p[:,[0,2]],axis=1).reshape(len(profile),segments)
    lattice_error=max(float(np.max(abs(radial-profile[:,0,None]))),float(np.max(abs(p[:,1].reshape(len(profile),segments)-profile[:,1,None]))))
    signed_normal_failures=0
    for c,n in zip(tri.mean(axis=1),face):
        if faceted_inside(c+n*1e-4,profile,segments) or not faceted_inside(c-n*1e-4,profile,segments):signed_normal_failures+=1
    vertex_dot=np.einsum('ijk,ik->ij',normal[indices],face)
    row={'id':item['id'],'vertices':len(p),'triangles':len(indices),'edges':len(edges),'eulerCharacteristic':len(p)-len(edges)+len(indices),'boundaryOrNonmanifoldEdges':len(boundary),'sameDirectionEdgePairs':len(unorient),'minTriangleAreaMm2':float(length.min()/2),'materialVolumeMm3':volume,'normalLengthRange':[float(np.linalg.norm(normal,axis=1).min()),float(np.linalg.norm(normal,axis=1).max())],'minimumFacetVertexNormalDot':float(vertex_dot.min()),'faceNormalInsideOutsideFailures':signed_normal_failures,'profileProperIntersections':profile_cross(profile),'nonadjacentProfileContacts':nonadjacent_touch(profile),'invalidSweepCells':invalid_cells,'profileLatticeErrorMm':lattice_error,'localBoundsMm':[p.min(axis=0).tolist(),p.max(axis=0).tolist()],'bufferBytes':item['bytes'],'totalBufferBytes':sum(item['bytes'].values())}
    assert not boundary and not unorient and volume>0 and length.min()>1e-6
    assert not row['profileProperIntersections'] and not row['nonadjacentProfileContacts'] and invalid_cells==0 and lattice_error<EPS
    assert signed_normal_failures==0 and vertex_dot.min()>0
    origin=np.array(spec['originMm'],float);world=p+origin
    parts.append({'id':item['id'],'p':p,'world':world,'indices':indices,'profile':profile,'origin':origin,'spec':spec,'segments':segments})
    checks.append(row)

# Intersections of the actual rotational material profiles: shared boundaries
# count as designed contact, positive interior overlap counts as penetration.
a,b=parts
ap=a['profile']+np.array([0,a['origin'][1]])
bp=b['profile']+np.array([0,b['origin'][1]])
crossings=[]
for i,(a0,a1) in enumerate(zip(ap,np.roll(ap,-1,axis=0))):
    for j,(b0,b1) in enumerate(zip(bp,np.roll(bp,-1,axis=0))):
        if proper_cross(a0,a1,b0,b1):crossings.append([i,j])
def strict_inside(x,poly):
    for p,q in zip(poly,np.roll(poly,-1,axis=0)):
        if abs(orient(p,q,x))<EPS and np.all(x>=np.minimum(p,q)-EPS) and np.all(x<=np.maximum(p,q)+EPS):return False
    return inside(x,poly)
interior_vertices=[['S13',i] for i,p in enumerate(ap) if strict_inside(p,bp)]+[['S14',i] for i,p in enumerate(bp) if strict_inside(p,ap)]
assert not crossings and not interior_vertices
contacts=[]
for p,q in zip(ap,np.roll(ap,-1,axis=0)):
    for r,s in zip(bp,np.roll(bp,-1,axis=0)):
        if abs(p[1]-q[1])<EPS and abs(r[1]-s[1])<EPS and abs(p[1]-r[1])<EPS:
            lo=max(min(p[0],q[0]),min(r[0],s[0]));hi=min(max(p[0],q[0]),max(r[0],s[0]))
            if hi-lo>EPS:contacts.append({'yMm':float(p[1]),'radialBandMm':[float(lo),float(hi)]})
assert contacts==[{'yMm':1668.,'radialBandMm':[14.5,18.]}]

# Read native bore face planes, rather than equating a vertex radius with aperture.
cap=b;cp=cap['p'];ci=cap['indices'];ct=cp[ci];cc=np.cross(ct[:,1]-ct[:,0],ct[:,2]-ct[:,0]);cn=cc/np.linalg.norm(cc,axis=1)[:,None]
radius=np.linalg.norm(ct[:,:,[0,2]],axis=2)
bore=np.all(abs(radius-6.3)<EPS,axis=1)&(abs(cn[:,1])<EPS)
distances=abs(np.einsum('ij,ij->i',cn[bore],ct[bore,0]))
assert len(distances)==48
clearance=float(distances.min()-6)
assert clearance>0
n=b['segments'];contact_area=n*.5*math.sin(2*math.pi/n)*(18**2-14.5**2)
paircheck={'positiveProfileEdgeCrossings':crossings,'strictlyInteriorProfileVertices':interior_vertices,'contactBands':contacts,'actualFacetedContactAreaMm2':contact_area,'seatPlaneDifferenceMm':float((a['p'][:,1].max()+a['origin'][1])-1668),'continuousStemRadiusMm':6,'boreNativePlaneCount':len(distances),'minimumNativeBoreApothemMm':float(distances.min()),'minimumClearanceToContinuousSixMmRadiusStemMm':clearance,'nominalRadiusDifferenceMm':.3,'scope':'S13/S14 only; S15 continuous circular design envelope used for aperture bound; no actual S15/glass/other staff mesh supplied.'}

# One meaningful adverse fixture: a crossed cap meridian must be detected.
negative=b['profile'].copy();negative[12]=[6,-6]
bad=profile_cross(negative);assert bad

colors={'S13':'#a5cbe3','S14':'#edbb84'}
views=[('FRONT  +Z',0,0),('RIGHT  +X',90,0),('TOP  +Y',0,90),('THREE-QUARTER',45,25)]
def project(p,yaw,elevation):
    y=math.radians(yaw);e=math.radians(elevation)
    right=np.array([math.cos(y),0,-math.sin(y)])
    up=np.array([-math.sin(e)*math.sin(y),math.cos(e),-math.sin(e)*math.cos(y)])
    depth=np.array([math.cos(e)*math.sin(y),math.sin(e),math.cos(e)*math.cos(y)])
    return np.stack([p@right,p@up,p@depth],axis=1)
def draw(ax,selected,yaw,elev,center=(0,0,0),wire=False):
    alltri=[];fc=[];dep=[]
    for part,useworld in selected:
        q=project((part['world'] if useworld else part['p'])-np.array(center),yaw,elev)
        ts=q[part['indices']];alltri.extend(ts[:,:,:2]);dep.extend(ts[:,:,2].mean(axis=1));fc.extend([colors[part['id']]]*len(ts))
    order=np.argsort(dep,kind='stable')
    collection=PolyCollection(np.asarray(alltri)[order],facecolors=np.asarray(fc)[order],edgecolors='#415364',linewidths=.16)
    if wire:
        for part,useworld in selected:
            q=project((part['world'] if useworld else part['p'])-np.array(center),yaw,elev)
            es=set()
            for t in part['indices']:
                for a,b in zip(t,np.roll(t,-1)):es.add(tuple(sorted((int(a),int(b)))))
            lines=np.array([[q[a,:2],q[b,:2]] for a,b in sorted(es)])
            ax.add_collection(LineCollection(lines,colors='#24668b' if part['id']=='S13' else '#9a591b',linewidths=.35,alpha=.6))
    else:ax.add_collection(collection)
    ax.set_aspect('equal');ax.grid(alpha=.15);ax.set_xlabel('mm');ax.set_ylabel('mm')
    ax.text(.02,.97,'GEOMETRY ONLY · CPU ORTHOGRAPHIC\nNo material / light / WebGL',transform=ax.transAxes,va='top',fontsize=6.6,color='#7a1825')

fig,axes=plt.subplots(2,4,figsize=(15,7.3),layout='constrained')
for row,part in enumerate(parts):
    for col,(label,yaw,elev) in enumerate(views):
        ax=axes[row,col];draw(ax,[(part,False)],yaw,elev);ax.set_xlim(-26,26);ax.set_ylim(-24,27);ax.set_title(f"{part['id']} · {label}",fontsize=10)
fig.suptitle('S13 / S14 — actual native vertices, equal millimetre scale\nFlat part-ID colours; triangle faces sorted by centroid depth (approximate visibility)',fontsize=12)
fig.savefig('parts-orthographic.svg');fig.savefig('parts-orthographic.png',dpi=150);plt.close(fig)

fig,axes=plt.subplots(1,3,figsize=(15,6),layout='constrained')
ax=axes[0]
for p in parts:
    poly=p['profile']+np.array([0,p['origin'][1]-1668])
    ax.add_patch(Polygon(poly,closed=True,facecolor=colors[p['id']],edgecolor='#233343',linewidth=1,label=p['id']))
ax.add_patch(Rectangle((0,6),6,7,facecolor='none',edgecolor='#9c2d32',linestyle='--',label='S15 stem envelope ONLY'))
ax.plot([14.5,18],[0,0],color='#1b6f3a',linewidth=3,label='S13/S14 contact')
ax.set_xlim(0,22);ax.set_ylim(-8,14);ax.set_aspect('equal');ax.grid(alpha=.2);ax.legend(fontsize=7,loc='upper right');ax.set_xlabel('radius r (mm)');ax.set_ylabel('Y − 1668 mm');ax.set_title('DESIGN SECTION · r/Y\nActual profile, no image tracing',fontsize=10)
ax.text(.02,.03,'GEOMETRY ONLY · no material / light / WebGL\nStem outline is not an implemented third part',transform=ax.transAxes,fontsize=6.5,color='#7a1825')
for ax,(label,yaw,elev) in zip(axes[1:],[('PAIR FRONT',0,0),('PAIR THREE-QUARTER',45,25)]):
    draw(ax,[(p,True) for p in parts],yaw,elev,center=(0,1668,0),wire=True);ax.set_xlim(-25,25);ax.set_ylim(-18,25);ax.set_title(label+' · X-RAY ALL EDGES · Y1668',fontsize=10)
fig.suptitle('Partial pair: shared seat r14.5–18 mm at Y1668; no positive material penetration\n24-sided socket: minimum clearance to a continuous R6 stem = '+f'{clearance:.6f} mm (nominal radii difference 0.300 mm)',fontsize=12)
fig.savefig('joint-sections.svg');fig.savefig('joint-sections.png',dpi=150);plt.close(fig)

results={'at':__import__('datetime').datetime.now(__import__('datetime').timezone.utc).isoformat(),'sourceSha256':raw['sourceSha256'],'parts':checks,'pair':paircheck,'selfIntersectionMethod':'Independent r/Y non-adjacent segment crossing/contact, strictly positive radius, actual native adjacent-sector/meridian cell connectivity, manifold orientation, and point-in-faceted-solid normals. This establishes no proper self crossing for these two simple positive-radius polygon sweeps; not an arbitrary mesh collider. Coplanar designed contact is reported separately.','negativeFixture':{'change':'S14 profile vertex12 to [6,-6] on scratch-only copy','crossedEdgesDetected':bad},'drawingBoundary':'Native triangle projections only; orthographic matrices stated by angle, equal mm scale. Flat ID colours, no textures/normals lighting or WebGL. Single-part centroid-depth painter visibility is approximate; paired views draw all actual edges as X-ray projections to avoid misleading coplanar visibility. Intersection results use geometry checks, not plot visibility. Generated reference is neither sampled nor edited.','orthographicViews':[{'name':name,'yawDegrees':yaw,'elevationDegrees':e}for name,yaw,e in views],'analysisAndPlotWallSeconds':time.perf_counter()-start,'notCompleted':['actual S15/glass/full staff assembly','game rendering','material appearance','GPU/device performance','whole-character quality']}
Path('analysis.json').write_text(json.dumps(results,indent=2)+'\n')
print(json.dumps({'parts':checks,'pair':paircheck,'negativeCrossings':bad,'analysisAndPlotWallSeconds':results['analysisAndPlotWallSeconds']},indent=2))
