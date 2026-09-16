"""Read-only local capability preflight; does not contact the network/install."""
import sys,platform,sysconfig,importlib.util,shutil,os,json,ctypes.util
from pathlib import Path
from numpy._core._multiarray_umath import __cpu_features__
out=Path(__file__).resolve().parent
reads={}
for p in ['/sys/fs/cgroup/memory.max','/sys/fs/cgroup/memory.current','/sys/fs/cgroup/cpu.max']:
 try:reads[p]=Path(p).read_text().strip()
 except Exception as e:reads[p]=type(e).__name__+': '+str(e)
result={'python':sys.version,'executable':sys.executable,'platform':platform.platform(),
 'machine':platform.machine(),'libc':platform.libc_ver(),'soabi':sysconfig.get_config_var('SOABI'),
 'blender':shutil.which('blender'),'pythonModules':{m:bool(importlib.util.find_spec(m))for m in ['bpy','trimesh','pyrender','moderngl','matplotlib','numpy','pip']},
 'workspaceDisk':dict(zip(['total','used','free'],shutil.disk_usage(out))),
 'osRelease':Path('/etc/os-release').read_text(),'cpuCount':os.cpu_count(),
 'cpuFeatures':{k:__cpu_features__.get(k)for k in ['SSE41','SSE42','AVX','AVX2']},
 'cgroupRead':reads,'systemLibraryDiscovery':{s:ctypes.util.find_library(s)for s in ['c','stdc++','gcc_s','X11','Xi','Xfixes','Xrender','Xxf86vm','GL','EGL','SM','ICE','z']},
 'physPages':os.sysconf('SC_PHYS_PAGES'),'pageSize':os.sysconf('SC_PAGE_SIZE'),
 'scope':'Names/features and filesystem/sysconf reads only. No Blender binary/import, renderer, GPU/display/context test, installation or package download. Sysconf and CPU counts do not establish the process memory/CPU quota.'}
(out/'local-preflight.json').write_text(json.dumps(result,indent=2)+'\n')
print(json.dumps(result,indent=2))
