import { cleanSave, DEFAULT_SAVE, LEGACY_SAVE_KEYS, SAVE_KEY } from './core.js';
export function load(storage = globalThis.localStorage) {
  try {
    const current = storage?.getItem(SAVE_KEY);
    if (current) return cleanSave(JSON.parse(current));
    for (const key of LEGACY_SAVE_KEYS) {
      if (!storage?.getItem(key)) continue;
      const migrated = cleanSave(null);
      migrated.tutorial = true;
      return migrated;
    }
    return cleanSave(null);
  } catch { return structuredClone(DEFAULT_SAVE); }
}
export function save(value, storage = globalThis.localStorage) { const clean = cleanSave(value); try { storage?.setItem(SAVE_KEY, JSON.stringify(clean)); } catch {} return clean; }
export function reset(storage = globalThis.localStorage) { try { storage?.removeItem(SAVE_KEY); for (const key of LEGACY_SAVE_KEYS) storage?.removeItem(key); } catch {} return structuredClone(DEFAULT_SAVE); }
