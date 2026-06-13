/* core/store.js — state + localStorage persistence.
   The only module that touches localStorage. No UI here. */

const STORAGE_KEY = "tickbox:v1";

/** The single live state object. UI reads it; actions mutate it then call save(). */
export const state = { lists: [], activeId: null };

/** Hydrate `state` from localStorage. Tolerates missing/corrupt data. */
export function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      state.lists = Array.isArray(parsed.lists) ? parsed.lists : [];
      state.activeId = parsed.activeId ?? null;
    }
  } catch (_) {
    // corrupt storage — start fresh
  }
}

let saveTimer = null;
/** Debounced persist — safe to call on every keystroke. */
export function save() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (_) {
      /* quota / privacy mode — ignore */
    }
  }, 120);
}

export const activeList = () =>
  state.lists.find((l) => l.id === state.activeId) || null;
