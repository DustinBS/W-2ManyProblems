/**
 * localStorage persistence layer
 * Saves/loads app state to/from localStorage
 */

const STORAGE_KEY = 'w2mp_state';

export function saveState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // localStorage full or unavailable - fail silently
  }
}

export function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function clearState() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // fail silently
  }
}

/**
 * Export state as a human-readable JSON string for cold storage
 */
export function exportStateJSON(state) {
  const exportData = {
    _meta: {
      app: 'W-2 Many Problems',
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
    },
    ...state,
  };
  return JSON.stringify(exportData, null, 2);
}

/**
 * Import state from a JSON string
 */
export function importStateJSON(jsonString) {
  const parsed = JSON.parse(jsonString);
  // Strip meta
  const { _meta, ...state } = parsed;
  return state;
}
