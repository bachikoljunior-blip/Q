// Explicit Web Audio node contract mock. It records graph/scheduling calls;
// it neither renders samples nor represents an actual browser/audio device.
class Param {
  constructor(value = 0) { this.value = value; this.calls = []; }
  setValueAtTime(value, time) { this.value = value; this.calls.push(['set', value, time]); }
  setTargetAtTime(value, time, constant) { this.target = value; this.calls.push(['target', value, time, constant]); }
  linearRampToValueAtTime(value, time) { this.calls.push(['linear', value, time]); }
  exponentialRampToValueAtTime(value, time) { this.calls.push(['exponential', value, time]); }
  cancelScheduledValues(time) { this.calls.push(['cancel', time]); }
}
class Node {
  constructor(context, kind) { this.context = context; this.kind = kind; this.connections = []; this.disconnected = false; }
  connect(node) { if (!node) throw Error('Missing audio destination'); this.connections.push(node); return node; }
  disconnect() { this.disconnected = true; this.connections = []; }
}
class Source extends Node {
  constructor(context, kind) { super(context, kind); this.playbackRate = new Param(1); this.frequency = new Param(440); this.started = []; this.stopped = []; }
  start(...args) { if (this.started.length) throw Error('Audio source cannot start twice'); this.started.push(args); }
  stop(when = 0) { this.stopped.push(when); }
}
export class SoundContext {
  static rejectResume = false;
  constructor() { this.currentTime = 0; this.sampleRate = 48000; this.state = 'suspended'; this.destination = new Node(this, 'destination'); this.created = []; }
  add(node) { this.created.push(node); return node; }
  createGain() { const n = this.add(new Node(this, 'gain')); n.gain = new Param(1); return n; }
  createDynamicsCompressor() { const n = this.add(new Node(this, 'compressor')); for (const key of ['threshold', 'knee', 'ratio', 'attack', 'release']) n[key] = new Param(); return n; }
  createConvolver() { return this.add(new Node(this, 'convolver')); }
  createBiquadFilter() { const n = this.add(new Node(this, 'filter')); n.frequency = new Param(); n.Q = new Param(); return n; }
  createStereoPanner() { const n = this.add(new Node(this, 'panner')); n.pan = new Param(); return n; }
  createBufferSource() { return this.add(new Source(this, 'buffer')); }
  createOscillator() { return this.add(new Source(this, 'oscillator')); }
  createBuffer(channels, length, rate) {
    const data = Array.from({ length: channels }, () => new Float32Array(length));
    return { numberOfChannels: channels, length, sampleRate: rate, duration: length / rate, getChannelData(channel) { return data[channel]; } };
  }
  async decodeAudioData(bytes) {
    const url = new TextDecoder().decode(bytes), score = url.endsWith('.mp3');
    return this.createBuffer(url.includes('harmony') ? 2 : 1, this.sampleRate * (score ? 48 : url.includes('foley') ? 30 : 3), this.sampleRate);
  }
  async resume() { if (SoundContext.rejectResume) throw Error('Gesture required'); this.state = 'running'; }
  async suspend() { this.state = 'suspended'; }
  async close() { this.state = 'closed'; }
}
