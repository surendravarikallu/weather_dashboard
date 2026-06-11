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
