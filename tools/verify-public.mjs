import { readFileSync } from 'node:fs';

const args = process.argv.slice(2);
const valueAfter = flag => {
  const index = args.indexOf(flag);
  return index >= 0 ? args[index + 1] : null;
};

export function compareRelease(expected, served) {
  const failures = [];
  if (!expected?.release_id) failures.push('expected release_id is missing');
  if (!served?.release_id) failures.push('served release_id is missing');
  if (expected?.release_id && served?.release_id && expected.release_id !== served.release_id) {
    failures.push(`served release_id ${served.release_id} does not match ${expected.release_id}`);
  }
  return failures;
}

if (args.includes('--deliberate-failure')) {
  const failures = compareRelease({ release_id: 'expected-revision' }, { release_id: 'wrong-revision' });
  if (!failures.length) {
    console.error('DELIBERATE F6 FAILURE DID NOT FIRE');
    process.exit(2);
  }
  console.error('DELIBERATE F6 FAILURE OBSERVED');
  for (const failure of failures) console.error(`FAIL ${failure}`);
  process.exit(1);
}

const publicUrl = valueAfter('--url')?.replace(/\/$/, '');
const expectedFile = valueAfter('--expected-file') || 'release.json';
if (!publicUrl) {
  console.error('FAIL --url is required');
  process.exit(2);
}

let expected;
try {
  expected = JSON.parse(readFileSync(expectedFile, 'utf8'));
} catch (error) {
  console.error(`FAIL cannot read ${expectedFile}: ${error.message}`);
  process.exit(1);
}

try {
  const nonce = Date.now();
  const [releaseResponse, pageResponse] = await Promise.all([
    fetch(`${publicUrl}/release.json?gate=${nonce}`, { cache: 'no-store' }),
    fetch(`${publicUrl}/?gate=${nonce}`, { cache: 'no-store' })
  ]);
  if (!releaseResponse.ok) throw new Error(`release.json HTTP ${releaseResponse.status}`);
  if (!pageResponse.ok) throw new Error(`page HTTP ${pageResponse.status}`);
  const served = await releaseResponse.json();
  const page = await pageResponse.text();
  const failures = compareRelease(expected, served);
  if (!page.includes(`name="build-revision" content="${expected.release_id}"`)) {
    failures.push('public index does not expose the expected build-revision meta value');
  }
  if (failures.length) {
    for (const failure of failures) console.error(`FAIL F6 ${failure}`);
    process.exit(1);
  }
  console.log(`Public revision verified: ${expected.release_id} at ${publicUrl}.`);
} catch (error) {
  console.error(`FAIL F6 public verification: ${error.message}`);
  process.exit(1);
}
