export interface CacheEntry<T> {
  value: T;
  timestamp: number;
}

export function setCacheItem<T>(key: string, value: T): void {
  const entry: CacheEntry<T> = {
    value,
    timestamp: Date.now()
  };
  localStorage.setItem(key, JSON.stringify(entry));
}

export function getCacheItem<T>(key: string, ttlMs: number): T | null {
  const raw = localStorage.getItem(key);
  if (!raw) return null;
  try {
    const entry: CacheEntry<T> = JSON.parse(raw);
    const isExpired = Date.now() - entry.timestamp > ttlMs;
    if (isExpired) {
      localStorage.removeItem(key);
      return null;
    }
    return entry.value;
  } catch {
    return null;
  }
}
