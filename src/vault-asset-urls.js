import emberTexture from './assets/vaults/ember-stone.png';
import emberAmbient from './assets/vaults/ember-ambient.wav';
import tideTexture from './assets/vaults/tide-stone.png';
import tideAmbient from './assets/vaults/tide-ambient.wav';
import galeTexture from './assets/vaults/gale-stone.png';
import galeAmbient from './assets/vaults/gale-ambient.wav';
import mossTexture from './assets/vaults/moss-stone.png';
import mossAmbient from './assets/vaults/moss-ambient.wav';
import step from './assets/vaults/shared-step.wav';
import alert from './assets/vaults/shared-alert.wav';
import swing from './assets/vaults/shared-swing.wav';
import impact from './assets/vaults/shared-impact.wav';
import claim from './assets/vaults/shared-claim.wav';
import seal from './assets/vaults/shared-seal.wav';

// Static imports keep every binary in Vite's graph and let the standalone
// esbuild package inline the same source bytes.
export const VAULT_TEXTURE_URLS = Object.freeze({
  ember: emberTexture,
  tide: tideTexture,
  gale: galeTexture,
  moss: mossTexture,
});
export const VAULT_AMBIENT_URLS = Object.freeze({
  ember: emberAmbient,
  tide: tideAmbient,
  gale: galeAmbient,
  moss: mossAmbient,
});
export const VAULT_SFX_URLS = Object.freeze({
  step, alert, swing, impact, claim, seal,
});
