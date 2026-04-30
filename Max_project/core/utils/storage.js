const STORAGE_KEY = "lifemax-os-state";

function canUseStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

export function loadState() {
  if (!canUseStorage()) {
    return null;
  }
  const raw = window.localStorage.getItem(STORAGE_KEY);
  return raw ? JSON.parse(raw) : null;
}

export function saveState(state) {
  if (!canUseStorage()) {
    return;
  }
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function resetState() {
  if (!canUseStorage()) {
    return;
  }
  window.localStorage.removeItem(STORAGE_KEY);
}
