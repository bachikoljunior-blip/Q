"""Canonical author curve evaluators, independent of any surface/mesh builder."""
import math
add=lambda a,b:[x+y for x,y in zip(a,b)]
sub=lambda a,b:[x-y for x,y in zip(a,b)]
mul=lambda a,s:[x*s for x in a]
dot=lambda a,b:sum(x*y for x,y in zip(a,b))
cross=lambda a,b:[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]]
norm=lambda a:math.sqrt(dot(a,a))
unit=lambda a:mul(a,1/norm(a))
def rot(p,q):return add(p,add(mul(cross(q[:3],p),2*q[3]),mul(cross(q[:3],cross(q[:3],p)),2)))
def nail(d,t,radial=1):
 a=2*math.pi*t;w,l=d['widthLengthMm'];s0=d['digitLengthMm']-l/2-2
 x=radial*w/2*math.sin(a);s=s0+radial*l/2*math.cos(a)
 xp=radial*w/2*math.cos(a)*2*math.pi;sp=-radial*l/2*math.sin(a)*2*math.pi
 start,end=d['tipArclengthRangeMm'];tt=(s-start)/(end-start)
 stops=[(0,1),(.55,.91),(.9,.60),(1,0)]
 for (a,fa),(b,fb) in zip(stops,stops[1:]):
  if tt<=b:
   span=(b-a)*(end-start);u=(s-(start+a*(end-start)))/span
   f=fa+(fb-fa)*(3*u*u-2*u*u*u);fs=(fb-fa)*(6*u-6*u*u)/span;fss=(fb-fa)*(6-12*u)/(span*span);break
 rx,rz=d['tipRadiiMm'];R=rx*f;Rs=rx*fs;Rss=rx*fss;Q=math.sqrt(R*R-x*x);k=rz/rx;sgn=d['radialSign']
 z=k*Q;qp=(R*Rs*sp-x*xp)/Q
 e=[sgn*x,-s,z];ep=[sgn*xp,-sp,k*qp]
 g=[sgn*k*x/Q,k*R*Rs/Q,1];gp=[sgn*k*(xp/Q-x*qp/(Q*Q)),k*((Rs*Rs+R*Rss)*sp/Q-R*Rs*qp/(Q*Q)),0]
 n=unit(g);np=mul(sub(gp,mul(n,dot(n,gp))),1/norm(g));q=d['rootQuaternion'];root=d['rootPositionHandMm'];depth=d['normalDepthMm'];th=d['plateThicknessMm']
 return {'positionMm':add(root,rot(sub(e,mul(n,depth)),q)),'derivative':rot(sub(ep,mul(np,depth)),q),'normal':rot(n,q),'skinPositionMm':add(root,rot(e,q)),'outerPlatePositionMm':add(root,rot(add(e,mul(n,th-depth)),q)),'ellipseDomainRatio':abs(x)/R}
def evaluate(c,t):
 if c.get('evaluator')=='analytic-normal-offset-elliptic-nail':
  result=nail(c['definition'],t);result['tangent']=unit(result['derivative']);return result
 rows=c['samples'];x=max(0,min(1,t))*(len(rows)-1);i=min(int(x),len(rows)-2);u=x-i;a,b=rows[i:i+2];p=a['positionMm'];q=b['positionMm'];da=mul(a['tangent'],a['tangentMagnitudeMm']);db=mul(b['tangent'],b['tangentMagnitudeMm'])
 h=[2*u**3-3*u*u+1,u**3-2*u*u+u,-2*u**3+3*u*u,u**3-u*u]
 dh=[6*u*u-6*u,3*u*u-4*u+1,-6*u*u+6*u,3*u*u-2*u]
 pos=[sum(h[j]*[p,da,q,db][j][k] for j in range(4)) for k in range(3)];der=[sum(dh[j]*[p,da,q,db][j][k] for j in range(4)) for k in range(3)];tan=unit(der)
 seed=add(mul(a['normal'],1-u),mul(b['normal'],u));nn=unit(sub(seed,mul(tan,dot(seed,tan))))
 return {'positionMm':pos,'derivative':mul(der,len(rows)-1),'tangent':tan,'normal':nn}
