"""Recreate audit inputs under this scratch directory; never changes repository files."""
from pathlib import Path
import subprocess,hashlib,json
from PIL import Image
P=Path(__file__).resolve().parent;R=P.parent/'Q-ps4-v29';REF='f11819aceea515d166846e4bf85082bf2e51e9d1'
S=P/'baseline-v23-source';S.mkdir(exist_ok=True)
files=subprocess.check_output(['git','ls-tree','-r','--name-only',REF,'src'],cwd=R,text=True).splitlines()
for name in ['package.json']+[p for p in files if p.endswith('.js')]:
 p=S/name;p.parent.mkdir(parents=True,exist_ok=True);p.write_bytes(subprocess.check_output(['git','show',REF+':'+name],cwd=R))
(S/'SOURCE_COMMIT').write_text(REF+'\n')
if not (S/'node_modules').exists():(S/'node_modules').symlink_to(R/'node_modules',target_is_directory=True)
for name in ['pine','crown']:
 image=Image.open(R/f'src/assets/forest/{name}-branch-rgba.png').convert('RGBA');assert image.size==(512,512)
 (P/f'{name}.rgba').write_bytes(image.tobytes())
print('Prepared exact baseline JS and two actual forest RGBA fixtures.')
