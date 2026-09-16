"""Read-only pixel statistics. Produces JSON only; no image output or editing."""
from pathlib import Path
import hashlib, json
import numpy as np
from PIL import Image

root = Path(__file__).parent
path = root / 'source/cotton_jersey_diff_1k.jpg'
with Image.open(path) as image:
    rgb = np.asarray(image).astype(np.float64) / 255
linear = np.where(rgb <= .04045, rgb / 12.92, ((rgb + .055) / 1.055) ** 2.4)
mean = linear.mean((0, 1))
rows = []
for size in (1, 8, 16, 32, 64, 128):
    vals = np.array([linear[y:y+size, x:x+size].mean((0, 1))
                     for y in range(0, linear.shape[0]-size+1, size)
                     for x in range(0, linear.shape[1]-size+1, size)])
    luminance = (vals / mean) @ np.array([.2126, .7152, .0722])
    rows.append({'squareBlockPx': size, 'physicalSideApproxMm': size*.2638/1025*1000,
                 'count': len(vals), 'linearRGBMean': vals.mean(0).tolist(),
                 'normalizedLuminanceP01P50P99': np.quantile(luminance, [.01, .5, .99]).tolist(),
                 'normalizedLuminanceStd': float(luminance.std())})
player = np.array([0x2c, 0x55, 0x5b])/255
base = np.where(player <= .04045, player/12.92, ((player+.055)/1.055)**2.4)
result = {'photoSHA256': hashlib.sha256(path.read_bytes()).hexdigest(),
          'linearMean': mean.tolist(), 'playerBaseLinear': base.tolist(),
          'naiveMultipliedMeanLinear': (base*mean).tolist(),
          'meanNormalizedTintLinear': (base/mean).tolist(), 'blockAnalysis': rows,
          'boundary': 'Read-only numerical aggregation of original pixels, not an edited or generated image, not GPU mip/screenshot. No raster written.'}
(root / 'surface-statistics.json').write_text(json.dumps(result, indent=2)+'\n')
