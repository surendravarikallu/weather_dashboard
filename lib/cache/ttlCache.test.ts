import { setCacheItem, getCacheItem } from './ttlCache';

describe('TTL Cache Utility', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should retrieve fresh cache items', () => {
    setCacheItem('test-key', { temp: 22 });
    const cached = getCacheItem<{ temp: number }>('test-key', 5000);
    expect(cached?.temp).toBe(22);
  });
});
