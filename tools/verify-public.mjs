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
const expectedId = valueAfter('--expected-id');
const attempts = Number.parseInt(valueAfter('--attempts') || '1', 10);
const delayMs = Number.parseInt(valueAfter('--delay-ms') || '5000', 10);
if (!publicUrl) {
  console.error('FAIL --url is required');
  process.exit(2);
}
if (!Number.isInteger(attempts) || attempts < 1 || !Number.isInteger(delayMs) || delayMs < 0) {
  console.error('FAIL --attempts must be at least 1 and --delay-ms must be non-negative');
  process.exit(2);
}

let expected;
if (expectedId) expected = { release_id: expectedId };
else {
  try {
    expected = JSON.parse(readFileSync(expectedFile, 'utf8'));
  } catch (error) {
    console.error(`FAIL cannot read ${expectedFile}: ${error.message}`);
    process.exit(1);
  }
}

async function verifyOnce(attempt) {
  const nonce = `${Date.now()}-${attempt}`;
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
  if (failures.length) throw new Error(failures.join('; '));
}

let lastError;
for (let attempt = 1; attempt <= attempts; attempt += 1) {
  try {
    await verifyOnce(attempt);
    console.log(`Public revision verified: ${expected.release_id} at ${publicUrl} (attempt ${attempt}/${attempts}).`);
    process.exit(0);
  } catch (error) {
    lastError = error;
    if (attempt < attempts) {
      console.log(`WAIT F6 attempt ${attempt}/${attempts}: ${error.message}`);
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }
}

console.error(`FAIL F6 public verification after ${attempts} attempt(s): ${lastError?.message || 'unknown error'}`);
process.exit(1);
