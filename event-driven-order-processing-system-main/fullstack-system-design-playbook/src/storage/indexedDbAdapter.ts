interface IndexedDbEntry<TValue> {
  key: string;
  value: TValue;
  updatedAt: string;
  expiresAt?: string;
}

export interface IndexedDbSetOptions {
  ttlMs?: number;
}

export interface IndexedDbAdapter {
  get<TValue>(key: string): Promise<TValue | null>;
  set<TValue>(
    key: string,
    value: TValue,
    options?: IndexedDbSetOptions,
  ): Promise<void>;
  remove(key: string): Promise<void>;
  clear(): Promise<void>;
}

const DB_NAME = 'minishop-browser-cache';
const DB_VERSION = 1;
const STORE_NAME = 'entries';

export const indexedDbAdapter: IndexedDbAdapter = {
  async get<TValue>(key: string): Promise<TValue | null> {
    if (!canUseIndexedDb()) return null;

    const db = await openDatabase();
    const entry = await requestToPromise<IndexedDbEntry<TValue> | undefined>(
      db.transaction(STORE_NAME, 'readonly').objectStore(STORE_NAME).get(key),
    );

    db.close();

    if (!entry) return null;

    if (entry.expiresAt && new Date(entry.expiresAt).getTime() < Date.now()) {
      await this.remove(key);
      return null;
    }

    return entry.value;
  },

  async set<TValue>(
    key: string,
    value: TValue,
    options: IndexedDbSetOptions = {},
  ): Promise<void> {
    if (!canUseIndexedDb()) return;

    const db = await openDatabase();
    const now = new Date();
    const entry: IndexedDbEntry<TValue> = {
      key,
      value,
      updatedAt: now.toISOString(),
      expiresAt: options.ttlMs
        ? new Date(now.getTime() + options.ttlMs).toISOString()
        : undefined,
    };

    await requestToPromise(
      db.transaction(STORE_NAME, 'readwrite').objectStore(STORE_NAME).put(entry),
    );
    db.close();
  },

  async remove(key: string): Promise<void> {
    if (!canUseIndexedDb()) return;

    const db = await openDatabase();
    await requestToPromise(
      db.transaction(STORE_NAME, 'readwrite').objectStore(STORE_NAME).delete(key),
    );
    db.close();
  },

  async clear(): Promise<void> {
    if (!canUseIndexedDb()) return;

    const db = await openDatabase();
    await requestToPromise(
      db.transaction(STORE_NAME, 'readwrite').objectStore(STORE_NAME).clear(),
    );
    db.close();
  },
};

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;

      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'key' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function requestToPromise<TValue>(request: IDBRequest<TValue>) {
  return new Promise<TValue>((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function canUseIndexedDb() {
  return typeof window !== 'undefined' && 'indexedDB' in window;
}
