export interface LocalStorageAdapter {
  get<TValue>(key: string): TValue | null;
  set<TValue>(key: string, value: TValue): void;
  remove(key: string): void;
  clearByPrefix(prefix: string): void;
}

export const localStorageAdapter: LocalStorageAdapter = {
  get<TValue>(key: string): TValue | null {
    if (!canUseLocalStorage()) return null;

    const rawValue = window.localStorage.getItem(key);
    if (rawValue === null) return null;

    try {
      return JSON.parse(rawValue) as TValue;
    } catch {
      window.localStorage.removeItem(key);
      return null;
    }
  },

  set<TValue>(key: string, value: TValue) {
    if (!canUseLocalStorage()) return;

    window.localStorage.setItem(key, JSON.stringify(value));
  },

  remove(key: string) {
    if (!canUseLocalStorage()) return;

    window.localStorage.removeItem(key);
  },

  clearByPrefix(prefix: string) {
    if (!canUseLocalStorage()) return;

    Object.keys(window.localStorage)
      .filter((key) => key.startsWith(prefix))
      .forEach((key) => window.localStorage.removeItem(key));
  },
};

function canUseLocalStorage() {
  return typeof window !== 'undefined' && 'localStorage' in window;
}
