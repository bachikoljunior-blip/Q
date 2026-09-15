// Title presentation only. Gameplay, saving, focus ownership and sound unlocking
// remain in main.js. This module never imports Three.js or starts the world.
const TAU = Math.PI * 2;
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

export function titleCanvasSize(width, height, devicePixelRatio = 1) {
  width = clamp(Number(width) || 1, 1, 8192);
  height = clamp(Number(height) || 1, 1, 8192);
  const ratio = Math.min(clamp(Number(devicePixelRatio) || 1, 1, 1.5), Math.sqrt(1600000 / (width * height)));
  return { width, height, ratio, pixelWidth: Math.max(1, Math.floor(width * ratio)), pixelHeight: Math.max(1, Math.floor(height * ratio)) };
}

export function createTitleEmbers(count = 42) {
  // Fixed seeds keep layout changes from causing distracting particle reshuffles.
  let seed = 0x51a5cafe;
  const random = () => { seed = (Math.imul(1664525, seed) + 1013904223) >>> 0; return seed / 4294967296; };
  return Array.from({ length: clamp(Math.floor(Number(count) || 0), 0, 64) }, () => ({
    x: random(), y: random(), depth: .25 + random() * .75,
    phase: random() * TAU, size: .4 + random() * 1.05,
    speed: .012 + random() * .023, ash: random() < .52,
  }));
}

export function advanceTitleEmbers(particles, deltaSeconds, elapsedSeconds = 0) {
  const dt = clamp(Number(deltaSeconds) || 0, 0, .05);
  const elapsed = Number.isFinite(elapsedSeconds) ? elapsedSeconds : 0;
  for (const particle of particles) {
    particle.x = (particle.x + dt * (.011 + Math.sin(elapsed * .18 + particle.phase) * .008) * particle.depth + 1) % 1;
    particle.y = (particle.y - dt * particle.speed * (.4 + particle.depth) + 1) % 1;
  }
  return particles;
}

export function mountTitleCinematic({ root, onCue = () => {} } = {}) {
  if (!root) throw new TypeError('A title root is required');
  const doc = root.ownerDocument, win = doc.defaultView;
  const canvas = root.querySelector('#title-embers');
  // A decorative canvas may be unavailable while semantic controls remain usable.
  let context = null;
  try { context = canvas?.getContext?.('2d', { alpha: true }) || null; } catch { /* optional decoration */ }
  const motion = win.matchMedia?.('(prefers-reduced-motion: reduce)');
  let reduced = !!motion?.matches, active = true, disposed = false, pageHidden = false;
  let blurred = typeof doc.hasFocus === 'function' && !doc.hasFocus();
  let frameId = null, previousTime = null, elapsed = 0;
  let size = null, pointerX = 0, pointerY = 0, driftX = 0, driftY = 0;
  const particles = createTitleEmbers();
  const listeners = [];
  const listen = (target, name, handler, options) => {
    target.addEventListener(name, handler, options);
    listeners.push(() => target.removeEventListener(name, handler, options));
  };
  const canAnimate = () => !disposed && active && !doc.hidden && !pageHidden && !blurred && !reduced && !!context;
  function cancelFrame() {
    if (frameId !== null) win.cancelAnimationFrame(frameId);
    frameId = null; previousTime = null;
  }
  function clearParallax() {
    pointerX = pointerY = driftX = driftY = 0;
    root.style.setProperty('--title-x', '0px');
    root.style.setProperty('--title-y', '0px');
  }
  function measure() {
    if (!context || disposed) return;
    const box = root.getBoundingClientRect();
    size = titleCanvasSize(box.width, box.height, win.devicePixelRatio);
    canvas.width = size.pixelWidth; canvas.height = size.pixelHeight;
    context.setTransform(size.ratio, 0, 0, size.ratio, 0, 0);
    paint();
  }
  function paint() {
    if (!context || !size) return;
    const { width, height } = size;
    context.clearRect(0, 0, width, height);
    context.globalCompositeOperation = 'screen';
    for (const particle of particles) {
      const x = particle.x * width, y = particle.y * height;
      // Keep menu/text quieter; ash still links the artwork with the title mark.
      const edgeFade = Math.min(1, particle.y * 12, (1 - particle.y) * 12);
      const dim = x < width * .43 ? .28 : .8;
      const alpha = edgeFade * dim * (.3 + particle.depth * .5) * (.7 + .3 * Math.sin(elapsed * .8 + particle.phase));
      const radius = particle.size * (.6 + particle.depth);
      context.globalAlpha = alpha;
      context.fillStyle = particle.ash ? '#abc2c7' : '#efad65';
      context.beginPath(); context.arc(x, y, radius, 0, TAU); context.fill();
      if (!particle.ash && particle.depth > .62) {
        context.globalAlpha = alpha * .12;
        context.beginPath(); context.arc(x, y, radius * 3.5, 0, TAU); context.fill();
      }
    }
    context.globalAlpha = 1;
    context.globalCompositeOperation = 'source-over';
  }
  function frame(now) {
    frameId = null;
    if (!canAnimate()) return;
    if (previousTime === null) previousTime = now;
    const delta = (now - previousTime) / 1000;
    // Paint at up to 30 Hz; never catch up hidden time with a particle jump.
    if (delta >= 1 / 30) {
      previousTime = now;
      const dt = Math.min(delta, .05);
      elapsed += dt;
      advanceTitleEmbers(particles, dt, elapsed);
      const follow = 1 - Math.exp(-dt * 3);
      driftX += (pointerX - driftX) * follow;
      driftY += (pointerY - driftY) * follow;
      root.style.setProperty('--title-x', `${driftX.toFixed(2)}px`);
      root.style.setProperty('--title-y', `${driftY.toFixed(2)}px`);
      paint();
    }
    frameId = win.requestAnimationFrame(frame);
  }
  function synchronize() {
    const shouldAnimate = canAnimate();
    root.classList.toggle('is-still', !shouldAnimate);
    if (!shouldAnimate) { cancelFrame(); clearParallax(); if (reduced) paint(); }
    else if (frameId === null) frameId = win.requestAnimationFrame(frame);
  }
  const resetPointer = () => { pointerX = pointerY = 0; };
  listen(root, 'pointermove', event => {
    if (!canAnimate() || event.pointerType !== 'mouse' || event.buttons) return;
    const box = root.getBoundingClientRect();
    if (!box.width || !box.height) return;
    pointerX = clamp((event.clientX - box.left) / box.width - .5, -.5, .5) * 10;
    pointerY = clamp((event.clientY - box.top) / box.height - .5, -.5, .5) * 6;
  }, { passive: true });
  listen(root, 'pointerleave', resetPointer, { passive: true });
  listen(doc, 'visibilitychange', synchronize);
  listen(win, 'blur', () => { blurred = true; synchronize(); });
  listen(win, 'focus', () => { blurred = false; synchronize(); });
  listen(win, 'pagehide', () => { pageHidden = true; synchronize(); });
  listen(win, 'pageshow', () => { pageHidden = false; blurred = typeof doc.hasFocus === 'function' && !doc.hasFocus(); synchronize(); });
  listen(win, 'resize', () => { clearParallax(); measure(); });
  if (motion?.addEventListener) listen(motion, 'change', event => { reduced = event.matches; synchronize(); });
  for (const [id, cue] of [['start', 'start'], ['continue', 'continue'], ['import-title-save', 'import'], ['title-settings', 'settings']]) {
    const button = root.querySelector(`#${id}`);
    if (!button) continue;
    const available = () => !disposed && active && !doc.hidden && !button.disabled && !button.classList.contains('hidden');
    listen(button, 'focus', () => { if (available()) onCue('focus'); });
    listen(button, 'pointerenter', event => { if (event.pointerType === 'mouse' && available()) onCue('focus'); }, { passive: true });
    listen(button, 'click', () => { if (available()) onCue(cue); });
  }
  const api = {
    setActive(value) {
      if (disposed) return;
      active = !!value;
      if (!active) api.setLaunching(false);
      else { blurred = typeof doc.hasFocus === 'function' && !doc.hasFocus(); measure(); }
      synchronize();
    },
    setSaveAvailable(value) { if (!disposed) root.classList.toggle('has-save', !!value); },
    setLaunching(value) {
      if (disposed) return;
      root.classList.toggle('is-launching', !!value);
      root.querySelector('#title-loading')?.classList.toggle('hidden', !value);
    },
    dispose() {
      if (disposed) return;
      disposed = true; active = false; cancelFrame();
      for (const remove of listeners) remove();
      clearParallax();
      root.classList.add('is-still');
      root.classList.remove('is-launching', 'is-ready');
      root.querySelector('#title-loading')?.classList.add('hidden');
      if (context && size) context.clearRect(0, 0, size.width, size.height);
    },
  };
  api.setSaveAvailable(!root.querySelector('#continue')?.classList.contains('hidden'));
  root.classList.add('is-ready');
  measure(); synchronize();
  return api;
}
