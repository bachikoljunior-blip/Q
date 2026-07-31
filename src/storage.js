import { cleanSave, DEFAULT_SAVE, SAVE_KEY } from './core.js';
export function load(storage = globalThis.localStorage) { try { return cleanSave(JSON.parse(storage?.getItem(SAVE_KEY) || 'null')); } catch { return structuredClone(DEFAULT_SAVE); } }
export function save(value, storage = globalThis.localStorage) { const clean = cleanSave(value); try { storage?.setItem(SAVE_KEY, JSON.stringify(clean)); } catch {} return clean; }
export function reset(storage = globalThis.localStorage) { try { storage?.removeItem(SAVE_KEY); } catch {} return structuredClone(DEFAULT_SAVE); }
