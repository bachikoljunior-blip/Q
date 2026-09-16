"""Exact same-size standard WebP export; no image-content editing operations."""
import hashlib, io, json, pathlib, sys, time
from PIL import Image, features

root = pathlib.Path(__file__).resolve().parents[2]
assets = root / 'src/assets/characters/skin'
source = assets / 'sources/young_lightskinned_male_diffuse.png'
target = assets / 'young-male-q95.webp'
expected_source = '862a26e335e958b70534cb5f0d7c47ef30ab148a56c42b3e9da969cf76f12963'
expected_output = '7628814980308b9525b27f09f98a099a0144d1a29e67bc6377702b4605678c04'
assert hashlib.sha256(source.read_bytes()).hexdigest() == expected_source
image = Image.open(source)
image.load()
assert image.size == (2048, 2048) and image.mode == 'RGB'
output = io.BytesIO()
start = time.perf_counter()
image.save(output, format='WEBP', quality=95, method=6)
data = output.getvalue()
assert len(data) == 541954
assert hashlib.sha256(data).hexdigest() == expected_output, 'Codec version changed the encoded bytes'
if '--write' in sys.argv:
    target.write_bytes(data)
else:
    assert target.read_bytes() == data
assert hashlib.sha256(source.read_bytes()).hexdigest() == expected_source
print(json.dumps({'bytes': len(data), 'sha256': expected_output, 'seconds': time.perf_counter()-start,
                  'Pillow': Image.__version__, 'libwebp': features.version('webp'),
                  'operation': 'same-size format export only', 'originalUnchanged': True}))
