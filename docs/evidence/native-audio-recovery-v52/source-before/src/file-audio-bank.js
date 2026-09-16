const bufferBytes = b => (b?.length || 0) * (b?.numberOfChannels || 1) * 4;
const compactBuffer = (context, buffer) => {
  // decodeAudioData resamples to the device context rate (often 48/96 kHz).
  // Our source assets are already band-limited to 22.05 kHz: retain that rate
  // rather than silently tripling music residency on high-rate devices.
  const rate = 22050;
  if (!(buffer.sampleRate > rate) || !buffer.getChannelData) return buffer;
  const compact = context.createBuffer(buffer.numberOfChannels, Math.round(buffer.duration * rate), rate);
  for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
    const source = buffer.getChannelData(channel), dest = compact.getChannelData(channel), ratio = buffer.sampleRate / rate;
    for (let i = 0; i < dest.length; i++) {
      const at = i * ratio, low = Math.min(source.length - 1, Math.floor(at)), high = Math.min(source.length - 1, low + 1);
      dest[i] = source[low] + (source[high] - source[low]) * (at - low);
    }
  }
  return compact;
};

export async function loadFileAudio(host, key, url) {
  if (!host.ctx || !url || host.disposed) return null;
  if (host.assetBuffers.has(key)) return host.assetBuffers.get(key);
  if (!host.assetPending.has(key)) {
    const context = host.ctx;
    const pending = Promise.resolve().then(() => fetch(url)).then(response => {
      if (!response.ok) throw Error(`audio ${response.status}`);
      return response.arrayBuffer();
    }).then(data => context.decodeAudioData(data)).then(decoded => {
      if (host.disposed || context !== host.ctx) return null;
      const buffer = compactBuffer(context, decoded);
      const cap = host.maxDecodedBytes || 24 * 1024 * 1024;
      const incoming = bufferBytes(buffer);
      if (incoming > cap) return null;
      let size = [...host.assetBuffers.values()].reduce((sum, b) => sum + bufferBytes(b), 0);
      for (const [oldKey, oldBuffer] of host.assetBuffers) {
        if (size + incoming <= cap) break;
        size -= bufferBytes(oldBuffer); host.assetBuffers.delete(oldKey);
      }
      host.assetBuffers.set(key, buffer); return buffer;
    }).catch(() => null).finally(() => {
      if (host.assetPending.get(key) === pending) host.assetPending.delete(key);
    });
    host.assetPending.set(key, pending);
  }
  return host.assetPending.get(key);
}

export async function startFileAudio(host, key, url, options = {}) {
  const { loop = false, volume = .25, bus = loop ? 'ambience' : 'sfx', pan = 0, playbackRate = 1, offset = 0, duration, loopEnd } = options;
  const revision = host.audioRevision, requestedAt = host.ctx?.currentTime || 0;
  const start = async () => {
    const buffer = await loadFileAudio(host, key, url);
    if (!buffer || !host.ctx || !host.master || host.disposed || host.active === false || revision !== host.audioRevision) return null;
    // Decoding after a pause or a long network stall must not replay an old hit.
    if (!loop && (host.ctx.currentTime || 0) - requestedAt > .35) return null;
    if (host.canAllocate && !host.canAllocate(loop)) return null;
    const context = host.ctx, source = context.createBufferSource(), gain = context.createGain();
    source.buffer = buffer; source.loop = loop; gain.gain.value = volume;
    if (source.playbackRate) source.playbackRate.value = playbackRate;
    if (loopEnd) source.loopEnd = loopEnd;
    source.connect(gain);
    const panner = context.createStereoPanner?.();
    if (panner) { panner.pan.value = pan; gain.connect(panner); panner.connect(host.buses?.[bus] || host.master); }
    else gain.connect(host.buses?.[bus] || host.master);
    let ended = false;
    const node = { source, gain, panner, loop, stop(fade = 0) {
      if (ended) return;
      const now = context.currentTime || 0;
      if (fade && gain.gain.setTargetAtTime) gain.gain.setTargetAtTime(.0001, now, fade / 4);
      try { source.stop(now + fade); } catch { /* A completed source needs no second stop. */ }
      if (!fade) cleanup();
    } };
    const cleanup = () => {
      if (ended) return; ended = true;
      source.disconnect(); gain.disconnect(); panner?.disconnect(); host.releaseVoice?.(node);
    };
    source.onended = cleanup;
    host.registerVoice?.(node);
    try {
      const when = options.when ?? context.currentTime ?? 0;
      if (duration !== undefined) source.start(when, offset, duration);
      else source.start(when, offset);
    } catch { cleanup(); return null; }
    return node;
  };
  // Loop generations retain separate sources: stale ABA acceptance can stop only
  // its own source. Pending one-shots dedupe per cue and lifecycle generation.
  if (loop || host.assetBuffers.has(key)) return start();
  host.assetStartPending ||= new Map();
  const pendingKey = `${revision ?? ''}:${key}:${options.cue || ''}`;
  if (!host.assetStartPending.has(pendingKey)) {
    const pending = start().finally(() => {
      if (host.assetStartPending.get(pendingKey) === pending) host.assetStartPending.delete(pendingKey);
    });
    host.assetStartPending.set(pendingKey, pending);
  }
  return host.assetStartPending.get(pendingKey);
}
