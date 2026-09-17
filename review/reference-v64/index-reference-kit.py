"""Index the fixed reference images without claiming assembly or visual acceptance."""
from pathlib import Path
import hashlib
import json

ROOT = Path(__file__).resolve().parents[2]
BASE = ROOT / 'docs/evidence/mira-reference-set-v64'

def read(path):
    return json.loads((BASE / path).read_text())

def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()

images_by_hash = {}
for path in sorted((ROOT / 'docs/evidence').rglob('*.png')):
    images_by_hash.setdefault(digest(path), []).append(path)

def image(path=None, expected=None):
    p = Path(path) if path else None
    if p and not p.is_absolute():
        p = BASE / p
    if not p or not p.exists() or not p.is_relative_to(ROOT):
        if not expected and p and p.exists():
            expected = digest(p)
        assert expected in images_by_hash, ('unpreserved image', str(p), expected)
        p = images_by_hash[expected][0]
    actual = digest(p)
    assert expected is None or actual == expected, (p, expected, actual)
    return {'path': str(p.relative_to(ROOT)), 'sha256': actual,
            'bytes': p.stat().st_size, 'meaning': 'generated design reference, not rendered game'}

rows = []
def add(group, type_id, ids, refs, note):
    rows.append({'id': f'{group}:{type_id}', 'group': group,
                 'instances': [f'{group}:{i}' for i in ids],
                 'references': refs, 'selectionBasis': note,
                 'dimensionsFromImage': False, 'assemblyAccepted': False})

head = read('head-reference-set/coverage.json')
head_supplements = {
    'F17': 'head-assembly-registration/F17-side-supplement/mira-F17-side-v2.png',
    'A01a': 'head-assembly-registration/A01a-attachment-supplement/mira-A01a-attachment-v1.png',
}
for row in head['types']:
    refs = [image('head-reference-set/' + row['image'])]
    if row['id'] in head_supplements:
        refs.append(image(head_supplements[row['id']]))
    add('head', row['id'], row['instanceIds'], refs,
        'Fixed base shape plus any listed local supplement; excluded locators are not coordinates.')
add('head', 'F21', ['F21-L', 'F21-R'],
    [image('head-assembly-registration/F21-supplement/mira-F21-v1.png')],
    'Explicit new revision: preauricular patch, separate from the preserved 40-type/80-instance base.')

for row in read('cloth-reference-set/COVERAGE.json')['types']:
    add('cloth', row['typeID'], row['instances'],
        [image(row['selectedImage'], row['sha256'])],
        row['notes'] + ' Nominal dimensions are author choices, not measurements of generated pixels.')

accessory_overrides = {
    'AH07': 'accessory-boundary-references/AH07-bare-seat-v1.png',
    'AH08': 'accessory-reference-supplement/AH08-nail-plate-v2.png',
    'AH10': 'accessory-reference-supplement/AH10-wrist-sleeve-v2.png',
    'AB01': 'accessory-boundary-references/AB01-thin-outsole-v1.png',
    'AB02': 'accessory-boundary-references/AB02-empty-heel-v1.png',
    'AB03': 'accessory-reference-supplement/AB03-open-patch-v3.png',
}
for row in read('accessory-reference-set/TYPE_REFERENCE_COVERAGE.json')['types']:
    group = 'hands' if row['id'].startswith('AH') else 'boots'
    selected = accessory_overrides.get(row['id'], 'accessory-reference-set/' + row['selectedImage'])
    add(group, row['id'], row['instanceIDs'], [image(selected)],
        'Fixed original or locally corrected shape selection; numerical joins and triangle contact remain separate.')

for row in read('staff-reference-set/STAFF_REFERENCE_COVERAGE.json')['rows']:
    add('staff', row['id'], row['instances'], [image(row['referenceFile'], row['sha256'])],
        row['status'] + ': ' + row.get('limitation', ''))

type_ids = [r['id'] for r in rows]
instance_ids = [i for r in rows for i in r['instances']]
assert len(type_ids) == len(set(type_ids))
assert len(instance_ids) == len(set(instance_ids))
counts = {g: {'types': sum(r['group'] == g for r in rows),
              'instances': sum(len(r['instances']) for r in rows if r['group'] == g)}
          for g in ['head', 'cloth', 'hands', 'boots', 'staff']}
assert counts == {'head': {'types': 41, 'instances': 82},
                  'cloth': {'types': 40, 'instances': 96},
                  'hands': {'types': 10, 'instances': 56},
                  'boots': {'types': 11, 'instances': 34},
                  'staff': {'types': 18, 'instances': 19}}
record = {
    'schema': 'mira-reference-kit-v64/1',
    'scope': 'Image inventory and explicit selection, before numerical assembly acceptance',
    'canonical': image(ROOT / 'docs/evidence/character-reference-v60/references/mira-complete-six-views-v1.png'),
    'typeCount': len(rows), 'placementCount': len(instance_ids), 'counts': counts,
    'newGeometry': 0, 'newRuntimeImports': 0, 'allReferencesAssemblyReady': False,
    'remaining': ['Cloth TR03 four boundary ownerships and numerical connections',
                  'Concrete head/cloth/hand/boot shared curves and placement frames',
                  'Cross-domain neck/collar, cuffs/wrists, pelvis/cloth, trouser/boot and right-hand/staff contracts',
                  'Independent review of the final authored numerical registration'],
    'limits': ['Unique IDs and byte preservation do not establish consistent geometry.',
               'Precise dimensions and shared curves come from explicit author design, not image pixels.',
               'No WebGL, material, animation or device acceptance is implied.'],
    'types': rows,
}
dest = BASE / 'WHOLE_REFERENCE_SELECTION.json'
dest.write_text(json.dumps(record, ensure_ascii=False, indent=2) + '\n')
print(json.dumps({'types': len(rows), 'placements': len(instance_ids), 'counts': counts,
                  'selectedPNGCount': len({i['sha256'] for r in rows for i in r['references']}),
                  'output': str(dest.relative_to(ROOT)), 'sha256': digest(dest)}))
