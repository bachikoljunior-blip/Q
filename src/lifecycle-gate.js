export class LifecycleGate {
  constructor() {
    this.generation = 0;
  }

  begin() {
    return this.generation;
  }

  interrupt() {
    this.generation++;
  }

  shouldPause(token, { hidden = false, focused = true } = {}) {
    return token !== this.generation || hidden || !focused;
  }
}
