const END_EVENTS = ['pointerup', 'pointercancel', 'lostpointercapture'];
const round = value => Math.round(value * 1000) / 1000;

function pointerType(event) {
  return typeof event.pointerType === 'string' && event.pointerType ? event.pointerType : 'unknown';
}

function pointerKey(event) {
  return `${pointerType(event)}:${event.pointerId}`;
}

function viewportOrientation(width, height) {
  if (width === height) return 'square';
  return width > height ? 'landscape' : 'portrait';
}

// Aggregates pointer events observed by the production adapter without
// serializing raw coordinates or a per-event timeline. Coordinates are kept
// only while a gesture is active so its total travel can be accumulated.
export class PointerEvidence {
  constructor({ now = () => performance.now(), viewport = () => ({
    width: globalThis.innerWidth,
    height: globalThis.innerHeight,
    devicePixelRatio: globalThis.devicePixelRatio,
  }) } = {}) {
    this.now = now;
    this.viewport = viewport;
    this.reset('binding-created');
  }

  reset(reason = 'manual') {
    this.startedAt = this.now();
    this.resetReason = typeof reason === 'string' ? reason : 'manual';
    this.events = {};
    this.pointerTypes = {};
    this.channels = {};
    this.actions = {};
    this.rejected = {};
    this.captureFailures = {};
    this.clearReasons = {};
    this.gestureDistanceCssPx = {};
    this.simultaneousChannels = {};
    this.maxConcurrentPointers = 0;
    this.maxConcurrentTouchPointers = 0;
    this.clearedActivePointers = 0;
    this.active = new Map();
    this.currentCombination = '';
    this.viewports = [];
    this.recordViewport(reason);
  }

  recordViewport(reason = 'change') {
    const raw = this.viewport?.() || {};
    const width = Number(raw.width), height = Number(raw.height);
    if (!(width > 0) || !(height > 0)) return;
    const sample = {
      reason,
      width: round(width),
      height: round(height),
      devicePixelRatio: Number.isFinite(Number(raw.devicePixelRatio)) ? round(Number(raw.devicePixelRatio)) : null,
      orientation: viewportOrientation(width, height),
    };
    const previous = this.viewports.at(-1);
    if (!previous || previous.width !== sample.width || previous.height !== sample.height || previous.devicePixelRatio !== sample.devicePixelRatio) {
      this.viewports.push(sample);
    }
  }

  reject(channel, reason) {
    const key = `${channel}:${reason}`;
    this.rejected[key] = (this.rejected[key] || 0) + 1;
  }

  captureFailure(channel) {
    this.captureFailures[channel] = (this.captureFailures[channel] || 0) + 1;
  }

  recordInstant(type, channel, event, action = null) {
    const kind = pointerType(event);
    this.events[type] = (this.events[type] || 0) + 1;
    this.pointerTypes[kind] = (this.pointerTypes[kind] || 0) + 1;
    this.channels[channel] = (this.channels[channel] || 0) + 1;
    if (action) this.actions[action] = (this.actions[action] || 0) + 1;
  }

  record(type, channel, event, action = null) {
    const key = pointerKey(event), kind = pointerType(event);
    this.events[type] = (this.events[type] || 0) + 1;
    this.pointerTypes[kind] = (this.pointerTypes[kind] || 0) + 1;
    this.channels[channel] = (this.channels[channel] || 0) + 1;
    if (action && type === 'pointerdown') this.actions[action] = (this.actions[action] || 0) + 1;

    if (type === 'pointerdown') {
      this.active.set(key, {
        channel,
        pointerType: kind,
        x: Number(event.clientX),
        y: Number(event.clientY),
      });
    } else if (type === 'pointermove') {
      const active = this.active.get(key);
      if (active && Number.isFinite(active.x) && Number.isFinite(active.y) && Number.isFinite(Number(event.clientX)) && Number.isFinite(Number(event.clientY))) {
        const distance = Math.hypot(Number(event.clientX) - active.x, Number(event.clientY) - active.y);
        this.gestureDistanceCssPx[channel] = (this.gestureDistanceCssPx[channel] || 0) + distance;
        active.x = Number(event.clientX);
        active.y = Number(event.clientY);
      }
    } else if (END_EVENTS.includes(type)) {
      this.active.delete(key);
    }
    this.updateConcurrency();
  }

  updateConcurrency() {
    this.maxConcurrentPointers = Math.max(this.maxConcurrentPointers, this.active.size);
    const touchCount = [...this.active.values()].filter(pointer => pointer.pointerType === 'touch').length;
    this.maxConcurrentTouchPointers = Math.max(this.maxConcurrentTouchPointers, touchCount);
    const combination = [...new Set([...this.active.values()].map(pointer => pointer.channel))].sort().join('+');
    if (combination.split('+').filter(Boolean).length > 1 && combination !== this.currentCombination) {
      this.simultaneousChannels[combination] = (this.simultaneousChannels[combination] || 0) + 1;
    }
    this.currentCombination = combination.split('+').filter(Boolean).length > 1 ? combination : '';
  }

  clear(reason = 'external') {
    this.clearReasons[reason] = (this.clearReasons[reason] || 0) + 1;
    this.clearedActivePointers += this.active.size;
    this.active.clear();
    this.updateConcurrency();
  }

  snapshot() {
    return {
      schemaVersion: 1,
      resetReason: this.resetReason,
      durationMs: round(Math.max(0, this.now() - this.startedAt)),
      viewports: this.viewports.map(sample => ({ ...sample })),
      events: { ...this.events },
      pointerTypes: { ...this.pointerTypes },
      channels: { ...this.channels },
      actions: { ...this.actions },
      rejected: { ...this.rejected },
      captureFailures: { ...this.captureFailures },
      clearReasons: { ...this.clearReasons },
      gestureDistanceCssPx: Object.fromEntries(Object.entries(this.gestureDistanceCssPx).map(([key, value]) => [key, round(value)])),
      simultaneousChannels: { ...this.simultaneousChannels },
      maxConcurrentPointers: this.maxConcurrentPointers,
      maxConcurrentTouchPointers: this.maxConcurrentTouchPointers,
      clearedActivePointers: this.clearedActivePointers,
      activePointers: this.active.size,
      note: 'Pointer Events observed by the production adapter, aggregated without serializing raw coordinates. This is not proof of physical touch accuracy or browser-rendered pixels.',
    };
  }
}

export function bindTouchControls({
  actionButtons,
  joystick,
  stickElement,
  cameraSurfaces,
  isEnabled,
  dispatchAction,
  getView,
  getSensitivity,
  evidenceOptions,
  endTarget,
}) {
  const evidence = new PointerEvidence(evidenceOptions);
  const stick = { x: 0, y: 0 };
  const actionPointers = new Map();
  const listeners = [];
  let stickId = null, cameraId = null, cameraElement = null, cameraX = 0, cameraY = 0, attackHeld = false;

  const listen = (element, type, listener, options) => {
    element.addEventListener(type, listener, options);
    listeners.push(() => element.removeEventListener(type, listener, options));
  };
  const capture = (element, pointerId) => {
    if (typeof element.setPointerCapture !== 'function') return false;
    try {
      element.setPointerCapture(pointerId);
      return !element.hasPointerCapture || element.hasPointerCapture(pointerId);
    } catch { return false; }
  };
  const release = (element, pointerId) => {
    try {
      if (!element.hasPointerCapture || element.hasPointerCapture(pointerId)) element.releasePointerCapture?.(pointerId);
    } catch {}
  };

  const endAction = (name, type, event) => {
    if (actionPointers.get(name) !== event.pointerId) return;
    evidence.record(type, 'action', event, name);
    actionPointers.delete(name);
    actionButtons[name].classList.remove('pressed');
    if (name === 'attack') attackHeld = false;
  };

  for (const [name, button] of Object.entries(actionButtons)) {
    listen(button, 'pointerdown', event => {
      if (!isEnabled()) { evidence.reject('action', 'disabled'); return; }
      if (actionPointers.has(name)) { evidence.reject('action', 'already-held'); return; }
      event.preventDefault();
      actionPointers.set(name, event.pointerId);
      const captured = capture(button, event.pointerId);
      if (!captured) evidence.captureFailure('action');
      evidence.record('pointerdown', 'action', event, name);
      dispatchAction(name);
      button.classList.add('pressed');
      if (name === 'attack') attackHeld = true;
      if (!captured) endAction(name, 'pointercancel', event);
    });
    for (const type of END_EVENTS) listen(button, type, event => endAction(name, type, event));
  }

  function moveStick(event, record = true) {
    if (event.pointerId !== stickId) return;
    const box = joystick.getBoundingClientRect();
    const dx = event.clientX - box.left - box.width / 2, dy = event.clientY - box.top - box.height / 2;
    const maximum = box.width * .37, distance = Math.hypot(dx, dy);
    stick.x = dx / Math.max(maximum, distance);
    stick.y = dy / Math.max(maximum, distance);
    stickElement.style.transform = `translate(${stick.x * maximum}px,${stick.y * maximum}px)`;
    if (record) evidence.record('pointermove', 'movement', event);
  }
  listen(joystick, 'pointerdown', event => {
    if (!isEnabled()) { evidence.reject('movement', 'disabled'); return; }
    if (stickId !== null) { evidence.reject('movement', 'already-held'); return; }
    event.preventDefault();
    stickId = event.pointerId;
    const captured = capture(joystick, event.pointerId);
    if (!captured) evidence.captureFailure('movement');
    evidence.record('pointerdown', 'movement', event);
    moveStick(event, false);
    if (!captured) endStick('pointercancel', event);
  });
  listen(joystick, 'pointermove', moveStick);
  const endStick = (type, event) => {
    if (event.pointerId !== stickId) return;
    evidence.record(type, 'movement', event);
    stickId = null;
    stick.x = stick.y = 0;
    stickElement.style.transform = '';
  };
  for (const type of END_EVENTS) listen(joystick, type, event => endStick(type, event));

  const endCamera = (type, event) => {
    if (event.pointerId !== cameraId) return;
    evidence.record(type, 'camera', event);
    cameraId = null;
    cameraElement = null;
  };

  for (const surface of cameraSurfaces) {
    listen(surface, 'pointerdown', event => {
      if (!isEnabled()) { evidence.reject('camera', 'disabled'); return; }
      if (cameraId !== null) { evidence.reject('camera', 'already-held'); return; }
      if (event.button === 2) { evidence.recordInstant('pointerdown', 'camera', event, 'parry'); dispatchAction('parry'); return; }
      cameraId = event.pointerId;
      cameraElement = surface;
      cameraX = event.clientX;
      cameraY = event.clientY;
      const captured = capture(surface, event.pointerId);
      if (!captured) evidence.captureFailure('camera');
      evidence.record('pointerdown', 'camera', event);
      if (!captured) endCamera('pointercancel', event);
    });
    listen(surface, 'pointermove', event => {
      if (event.pointerId !== cameraId) return;
      const view = getView();
      if (!view) return;
      const sensitivity = getSensitivity();
      view.yaw -= (event.clientX - cameraX) * .006 * sensitivity;
      view.pitch = Math.max(-.12, Math.min(1.1, view.pitch + (event.clientY - cameraY) * .004 * sensitivity));
      cameraX = event.clientX;
      cameraY = event.clientY;
      evidence.record('pointermove', 'camera', event);
    });
    for (const type of END_EVENTS) listen(surface, type, event => endCamera(type, event));
  }

  const globalEndTarget = endTarget || joystick?.ownerDocument || globalThis.document;
  if (globalEndTarget) for (const type of ['pointerup', 'pointercancel']) listen(globalEndTarget, type, event => {
    for (const name of actionPointers.keys()) endAction(name, type, event);
    endStick(type, event);
    endCamera(type, event);
  });

  function clear(reason = 'external') {
    const captures = [...actionPointers.entries()].map(([name, pointerId]) => [actionButtons[name], pointerId]);
    if (stickId !== null) captures.push([joystick, stickId]);
    if (cameraId !== null && cameraElement) captures.push([cameraElement, cameraId]);
    actionPointers.clear();
    stickId = null;
    cameraId = null;
    cameraElement = null;
    stick.x = stick.y = 0;
    attackHeld = false;
    stickElement.style.transform = '';
    for (const button of Object.values(actionButtons)) button.classList.remove('pressed');
    evidence.clear(reason);
    for (const [element, pointerId] of captures) release(element, pointerId);
  }

  return {
    stick,
    get attackHeld() { return attackHeld; },
    clear,
    resetEvidence(reason) { evidence.reset(reason); },
    recordViewport(reason) { evidence.recordViewport(reason); },
    evidenceSnapshot() { return evidence.snapshot(); },
    stateSnapshot() {
      return {
        stick: { ...stick },
        stickId,
        cameraId,
        actionPointers: actionPointers.size,
        attackHeld,
      };
    },
    destroy() {
      clear('destroy');
      for (const remove of listeners.splice(0)) remove();
    },
  };
}
