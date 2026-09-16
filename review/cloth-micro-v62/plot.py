"""Plot actual exported triangles. No source image editing and no game renderer."""
import json
from pathlib import Path
import numpy as np
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from matplotlib.collections import PolyCollection

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'docs/evidence/mira-cloth-micro-v62'
meshes = json.loads((OUT / 'meshes.json').read_text())
metrics = json.loads((OUT / 'metrics.json').read_text())
views = [('FRONT: camera +Z', np.array([0., 0., 1.])),
         ('PROFILE: camera -X', np.array([-1., 0., 0.])),
         ('BACK: camera -Z', np.array([0., 0., -1.])),
         ('3/4: camera -X,+Z', np.array([-1., 0., 1.]))]

def frame(camera):
    camera = camera / np.linalg.norm(camera)
    right = np.cross([0., 1., 0.], camera)
    return np.array([right, [0., 1., 0.], camera])

def draw(ax, mesh, camera, centre, scale=1000):
    f = frame(camera)
    points = (np.array(mesh['positions']) - centre) @ f.T * scale
    tris = np.array(mesh['indices'])
    depth = points[tris, 2].mean(axis=1)
    order = np.argsort(depth)
    norms = np.array(mesh['normals'])[tris].mean(axis=1)
    light = np.array([-.4, .65, .64]); light /= np.linalg.norm(light)
    shade = .68 + .21 * (norms @ light)
    colors = np.column_stack([shade, shade*.95, shade*.83, np.ones(len(shade))])
    # Both sides are shown as a drafting convention, not a physical back layer.
    ax.add_collection(PolyCollection(points[tris[order], :2], facecolors=colors[order],
                                     edgecolors='#3d454b', linewidths=.25))
    for edge in mesh['boundary'].values():
        p = points[np.array(edge['vertices'])]
        ax.plot(p[:, 0], p[:, 1], color='#b66d15', linewidth=.9)
    ax.set_aspect('equal'); ax.grid(alpha=.15); ax.tick_params(labelsize=7)
    return points

fig, axes = plt.subplots(3, 4, figsize=(13, 12))
for row, mesh in enumerate(meshes):
    p = np.array(mesh['positions']); centre = (p.min(0) + p.max(0))/2
    # Same scale within each part's four views, independent of screen/image pixels.
    span = (p.max(0)-p.min(0))*1000
    horizontal = max(span[0], span[2], (span[0]+span[2])/np.sqrt(2))*1.3
    vertical = span[1]*1.16
    for col, (name, camera) in enumerate(views):
        ax = axes[row, col]; draw(ax, mesh, camera, centre)
        ax.set_xlim(-horizontal/2, horizontal/2); ax.set_ylim(-vertical/2, vertical/2)
        ax.set_title(name, fontsize=9)
        ax.set_xlabel('mm from patch centre', fontsize=8)
        if col == 0:
            ax.set_ylabel(f"{mesh['id']}\nmm from patch centre\n{len(p)} vertices / {len(mesh['indices'])} triangles", fontsize=9)
fig.suptitle('Mira: three isolated open surface prototypes\nCPU orthographic geometry diagrams - NOT a game image or reference-match approval', fontsize=13)
fig.text(.5, .015, 'Gold lines are named open boundaries, not raised seams. No material, thickness, neighbouring patch or cloth simulation is present.', ha='center', fontsize=9)
fig.tight_layout(rect=[0,.035,1,.94]); fig.savefig(OUT/'cpu-four-views.png', dpi=160); plt.close(fig)

fig, axes = plt.subplots(1, 3, figsize=(12, 7))
for ax, (name, camera) in zip(axes, [views[0], views[1], views[2]]):
    for mesh in meshes:
        draw(ax, mesh, camera, np.array([0., -.985, 0.]), scale=1)
        midpoint=np.array(mesh['positions']).mean(0)+[0.,.985,0.]
        point=midpoint@frame(camera).T
        ax.annotate(mesh['id'], point[:2], xytext=(6,3), textcoords='offset points', fontsize=8)
    bones=metrics['bones']; edges=[('pelvis','spine'),('spine','chest'),('chest','arm-0'),('arm-0','elbow-0'),('elbow-0','hand-0')]
    for a,b in edges:
        line=np.array([bones[a],bones[b]])@frame(camera).T
        ax.plot(line[:,0],line[:,1],color='#26738c',marker='o',markersize=3,linewidth=1)
    ax.set_xlim(-.45,.45);ax.set_ylim(.2,1.65);ax.set_title(name,fontsize=10)
    ax.set_xlabel('root-frame metres');ax.set_ylabel('root-frame Y (metres)')
fig.suptitle('Authored placement against actual current NPC bind joints\nIsolated parts only: not an assembled garment; body fit and dynamic contacts are unapproved',fontsize=12)
fig.tight_layout(rect=[0,0,1,.92]);fig.savefig(OUT/'cpu-bind-registration.png',dpi=150);plt.close(fig)
print('Saved two CPU geometry diagrams from meshes.json; no reference raster was read or modified.')
