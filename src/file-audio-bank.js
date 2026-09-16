const bufferBytes = b => (b?.length || 0) * (b?.numberOfChannels || 1) * 4;
// These three slots are retained for phase-aligned resume, outside the FX FIFO.
export const SCORE_SAMPLE_RATES = Object.freeze({ 'score:harmony': 44100, 'score:motif': 22050, 'score:pulse': 44100 });
const decodeAsset = async (host, context, rate, data) => {
  if (host.disposed || host.ctx !== context) return null;
  const Offline = globalThis.OfflineAudioContext || globalThis.window?.OfflineAudioContext || globalThis.window?.webkitOfflineAudioContext;
  host.assetDecoders ||= new Map();
  if (!host.assetDecoders.has(rate)) {
    let decoder = null;
    try { if (Offline) decoder = new Offline(1, 1, rate); } catch { /* Native-rate fallback below. */ }
    host.assetDecoders.set(rate, decoder);
  }
  const decoder = host.assetDecoders.get(rate);
  if (decoder) {
    // decodeAudioData owns/detaches its input: retain the original for fallback.
    try { return await decoder.decodeAudioData(data.slice(0)); } catch { /* Same encoded bytes, no second fetch. */ }
  }
  if (host.disposed || host.ctx !== context) return null;
  // Never decimate with interpolation: the browser performs antialias filtering.
  return context.decodeAudioData(data);
};

export async function loadFileAudio(host, key, url) {
  if (!host.ctx || !url || host.disposed) return null;
  const pinned = !!host.scoreBuffers && Object.hasOwn(SCORE_SAMPLE_RATES, key);
  const cache = pinned ? host.scoreBuffers : host.assetBuffers;
  if (cache.has(key)) return cache.get(key);
  if (!host.assetPending.has(key)) {
    const context = host.ctx;
    const pending = Promise.resolve().then(() => fetch(url)).then(response => {
      if (!response.ok) throw Error(`audio ${response.status}`);
      return response.arrayBuffer();
    }).then(data => decodeAsset(host, context, pinned ? SCORE_SAMPLE_RATES[key] : 22050, data)).then(buffer => {
      if (!buffer || host.disposed || context !== host.ctx) return null;
      if (pinned) {
        // Fixed 48-second authored stems, at most stereo; no key-driven growth.
        if (!(buffer.duration > 0 && buffer.duration <= 49) || !(buffer.numberOfChannels > 0 && buffer.numberOfChannels <= 2)) return null;
        cache.set(key, buffer); return buffer;
      }
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
      source.disconnect(); source.buffer = null; gain.disconnect(); panner?.disconnect(); host.releaseVoice?.(node);
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
