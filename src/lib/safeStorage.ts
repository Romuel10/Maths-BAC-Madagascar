/** Accès résilient au stockage local (quota, navigation privée, JSON corrompu). */
export function storageGet(key: string): string | null {
 try {
  return window.localStorage.getItem(key);
 } catch {
  return null;
 }
}

export function storageSet(key: string, value: string): boolean {
 try {
  window.localStorage.setItem(key, value);
  return true;
 } catch {
  window.dispatchEvent(new CustomEvent('mathbac-storage-error'));
  return false;
 }
}

export function storageRemove(key: string): boolean {
 try {
  window.localStorage.removeItem(key);
  return true;
 } catch {
  window.dispatchEvent(new CustomEvent('mathbac-storage-error'));
  return false;
 }
}

export function storageJsonGet<T>(key: string, fallback: T): T {
 const raw = storageGet(key);
 if (!raw) return fallback;
 try {
  return JSON.parse(raw) as T;
 } catch {
  return fallback;
 }
}

export function storageJsonSet(key: string, value: unknown): boolean {
 try {
  return storageSet(key, JSON.stringify(value));
 } catch {
  window.dispatchEvent(new CustomEvent('mathbac-storage-error'));
  return false;
 }
}
