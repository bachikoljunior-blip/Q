import hashlib, json, subprocess, wave
from datetime import datetime, timezone
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = HERE.parent / 'Q-audio-recovery-v52'
BASE = HERE.parent / 'Q-recovery-v51-20260916'
sha = lambda p: hashlib.sha256(p.read_bytes()).hexdigest()
old = json.loads((HERE / 'baseline-inventory.json').read_text())
base_media = json.loads((HERE / 'base-media.json').read_text())
media = json.loads((HERE / 'candidate-media.json').read_text())
runtime = json.loads((HERE / 'final-runtime.json').read_text())
assert len(runtime['results']) == 12
for file, expected in runtime['sourceHashes'].items():
    assert sha(ROOT / file) == expected, file
for m in media['assets']:
    assert sha(ROOT / m['file']) == m['sha256'], m['file']
    assert (ROOT / m['file']).stat().st_size == m['bytes']
raw = ROOT / 'assets-source/soundscape-vsco'
for m in old['sourceSamples']:
    p = raw / m['file']
    assert sha(p) == m['sha256'] and p.stat().st_size == m['bytes']
    with wave.open(str(p)) as w:
        assert (w.getframerate(), w.getnchannels(), w.getnframes()) == (m['rate'], m['channels'], m['frames'])
for f in ['manifest.json', 'LICENSE']:
    assert sha(raw / f) == old['baseSourceHashes']['assets-source/soundscape-vsco/' + f]
provenance_path = ROOT / 'src/assets/soundscape/provenance.json'
provenance = json.loads(provenance_path.read_text())
by_name = {m['name']: m for m in media['assets']}
base_by_name = {m['name']: m for m in base_media['assets']}
for p in provenance['assets']:
    m = by_name[p['file']]
    for k in ['sha256', 'bytes', 'sampleRate', 'channels']:
        assert p[k] == m[k], (p['file'], k)
    assert abs(p['durationSeconds'] - m['decodedSeconds']) < 1e-9
changed = [name for name, m in by_name.items() if m['sha256'] != base_by_name[name]['sha256']]
assert sorted(changed) == ['pilgrim-harmony.mp3', 'pilgrim-pulse.mp3']
for name in changed:
    m = by_name[name]
    assert (m['sampleRate'], m['channels'], m['decodedFrames'], m['bytes']) == (44100, 2, 2116800, 961326)
score = [by_name['pilgrim-' + stem + '.mp3'] for stem in ['harmony', 'motif', 'pulse']]
score_bytes = sum(m['decodedFloatBytes'] for m in score)
assert score_bytes == 38102400 == runtime['results'][0]['scoreBytes']
soundscape_bytes = sum(m['bytes'] for m in media['assets'] if '/soundscape/' in m['file'])
assert soundscape_bytes == 2941485 == provenance['totalBytes']
extra_files = ['src/soundscape-asset-urls.js', 'src/vault-asset-urls.js', 'src/vault-audio-cues.js',
               'src/assets/soundscape/cues.json', 'src/assets/soundscape/provenance.json',
               'scripts/generate-native-score.py', 'scripts/native_sampled_score.py']
extra_hashes = {f: sha(ROOT / f) for f in extra_files if (ROOT / f).exists()}
now = datetime.now(timezone.utc)
report = {
    'at': now.isoformat(), 'startedAt': '2026-09-16T08:43:14+00:00',
    'elapsedSeconds': (now - datetime.fromisoformat('2026-09-16T08:43:14+00:00')).total_seconds(),
    'scope': 'Fresh independent recovery review; no repository writes or historical PASS reuse',
    'baseCommit': old['baseCommit'],
    'candidateHeadAtFinalRead': subprocess.check_output(['git', '-C', str(ROOT), 'rev-parse', 'HEAD'], text=True).strip(),
    'sourceHashes': runtime['sourceHashes'], 'additionalReadbackHashes': extra_hashes,
    'rawRecordings': {'count': len(old['sourceSamples']), 'bytes': old['sourceBytes'], 'allMatchBaseManifest': True, 'licenseHash': old['licenseHash']},
    'media': {'count': len(media['assets']), 'changedFromBase': changed, 'encodedBytes': sum(m['bytes'] for m in media['assets']),
              'soundscapeBytes': soundscape_bytes, 'soundscapeDeltaBytes': soundscape_bytes - sum(m['bytes'] for m in base_media['assets'] if '/soundscape/' in m['file']),
              'scoreFloatBytes': score_bytes, 'otherMediaFloatBytes': sum(m['decodedFloatBytes'] for m in media['assets']) - score_bytes,
              'allMediaFloatBytes': sum(m['decodedFloatBytes'] for m in media['assets']), 'provenanceMatchesActualBytesAndMetadata': True},
    'runtimeConditionsPassed': len(runtime['results']), 'requiredSourceFixes': [],
    'limits': ['No real Web Audio API execution, listening, acoustic comparison, native resampler/MP3 gapless conformance, CPU/device/GPU/heap/RSS/GC measurement.',
               'Decoded byte counts are PCM payload, not peak/native process memory. Active voices, pending decodes, copies, reverb and browser overhead are additional.',
               'Only score decodes are serialized: observed production control-flow doubles peak at 2 initial decodes, 6 in the vault ABA/FX case.',
               'Offline constructor failure is cached by rate; Offline decode rejection is retried per subsequently uncached asset, including after FIFO eviction.',
               'Final build budgets, artifact staging, regression suite, generator reproducibility and source provenance gate are author/integrator responsibilities; historical results are not fresh evidence.']
}
(HERE / 'summary.json').write_text(json.dumps(report, indent=2) + '\n')
print(json.dumps(report, indent=2))
