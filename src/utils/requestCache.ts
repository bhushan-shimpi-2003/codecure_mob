type CacheRecord<T> = {
  value: T;
  expiresAt: number;
};

export class RequestCache {
  private cache = new Map<string, CacheRecord<unknown>>();
  private inFlight = new Map<string, Promise<unknown>>();

  get<T>(key: string): T | null {
    const record = this.cache.get(key);
    if (!record) return null;

    if (Date.now() > record.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return record.value as T;
  }

  set<T>(key: string, value: T, ttlMs: number) {
    this.cache.set(key, { value, expiresAt: Date.now() + ttlMs });
  }

  async getOrFetch<T>(key: string, ttlMs: number, fetcher: () => Promise<T>): Promise<T> {
    const cached = this.get<T>(key);
    if (cached !== null) return cached;

    const existing = this.inFlight.get(key);
    if (existing) {
      return existing as Promise<T>;
    }

    const request = fetcher()
      .then((result) => {
        this.set(key, result, ttlMs);
        return result;
      })
      .finally(() => {
        this.inFlight.delete(key);
      });

    this.inFlight.set(key, request);
    return request;
  }

  clearByPrefix(prefix: string) {
    for (const key of this.cache.keys()) {
      if (key.startsWith(prefix)) this.cache.delete(key);
    }
    for (const key of this.inFlight.keys()) {
      if (key.startsWith(prefix)) this.inFlight.delete(key);
    }
  }
}

export const createRequestCache = () => new RequestCache();
