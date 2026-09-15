export async function loadFileAudio(host, key, url) {
  if (!host.ctx || !url) return null;
  if (host.assetBuffers.has(key)) return host.assetBuffers.get(key);
  if (!host.assetPending.has(key)) host.assetPending.set(key, fetch(url).then(response => {
    if (!response.ok) throw Error(`audio ${response.status}`); return response.arrayBuffer();
  }).then(data => host.ctx.decodeAudioData(data)).then(buffer => { host.assetBuffers.set(key, buffer); return buffer; }).catch(() => null).finally(() => host.assetPending.delete(key)));
  return host.assetPending.get(key);
}

export async function startFileAudio(host, key, url, { loop = false, volume = .25 } = {}) {
  const start = async () => {
    const buffer = await loadFileAudio(host, key, url);
    if (!buffer || !host.ctx || !host.master) return null;
    const source = host.ctx.createBufferSource(), gain = host.ctx.createGain(); source.buffer = buffer; source.loop = loop; gain.gain.value = volume;
    source.connect(gain); gain.connect(host.master); source.start(); source.onended = () => { source.disconnect(); gain.disconnect(); }; return { source, gain };
  };
  // Loop requests carry independent lifecycle generations: a stale gate must
  // be able to stop its own source without silencing a later re-entry. Only
  // collapse one-shot bursts while their shared decode is pending.
  if (loop || host.assetBuffers.has(key)) return start();
  host.assetStartPending ||= new Map();
  if (!host.assetStartPending.has(key)) host.assetStartPending.set(key, start().finally(() => host.assetStartPending.delete(key)));
  return host.assetStartPending.get(key);
}
