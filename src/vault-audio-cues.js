const direct = Object.freeze({ vaultEnter: 'seal', vaultAlert: 'alert', vaultStep: 'step', vaultSeal: 'seal', vaultClaim: 'claim' });

export function vaultCueForEvent(type, data = {}) {
  if (type === 'enemySwing' && data.vaultId) return 'swing';
  if (type === 'hit' && data.vaultId) return 'impact';
  return direct[type] || null;
}

export class VaultLoopGate {
  constructor() { this.theme = null; this.node = null; this.pending = false; this.revision = 0; }
  request(theme) {
    if (theme === this.theme && (this.node || this.pending)) return null;
    this.theme = theme; this.pending = Boolean(theme); this.revision++;
    if (this.node) this.node.source.stop();
    this.node = null;
    return theme ? { theme, revision: this.revision } : null;
  }
  accept(request, node) {
    if (!request || request.revision !== this.revision || request.theme !== this.theme) { if (node) node.source.stop(); return false; }
    this.pending = false;
    if (!node) return false;
    if (this.node) this.node.source.stop();
    this.node = node; return true;
  }
}
