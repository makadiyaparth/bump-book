/* ============================================
   Server-Side In-Memory Cache (RAM Only)
   Strictly ephemeral, multi-tenant scoped,
   zero persistent disk storage.
   ============================================ */

interface CacheEntry<T> {
  data: T;
  cachedAt: number;
  expiresAt: number;
}

const DEFAULT_TTL_MS = 60 * 60 * 1000; // 1 hour

export class ServerCache {
  private static store = new Map<string, CacheEntry<unknown>>();

  /**
   * Builds isolated, multi-tenant cache key: `${spreadsheetId}:${tab}`
   */
  private static makeKey(spreadsheetId: string, tab: string): string {
    return `${spreadsheetId}:${tab}`;
  }

  /**
   * Retrieve cached data if present and not expired.
   */
  static get<T>(spreadsheetId: string, tab: string): T | null {
    const key = this.makeKey(spreadsheetId, tab);
    const entry = this.store.get(key);

    if (!entry) return null;

    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }

    return entry.data as T;
  }

  /**
   * Store data in cache with a TTL (default: 1 hour).
   */
  static set<T>(
    spreadsheetId: string,
    tab: string,
    data: T,
    ttlMs: number = DEFAULT_TTL_MS
  ): void {
    const key = this.makeKey(spreadsheetId, tab);
    const now = Date.now();
    this.store.set(key, {
      data,
      cachedAt: now,
      expiresAt: now + ttlMs,
    });
  }

  /**
   * Invalidate a single tab or all tabs for a given spreadsheet.
   */
  static invalidate(spreadsheetId: string, tab?: string): void {
    if (tab) {
      this.store.delete(this.makeKey(spreadsheetId, tab));
    } else {
      this.clearSpreadsheet(spreadsheetId);
    }
  }

  /**
   * Clear all cached tabs belonging to a specific spreadsheet.
   * Useful on sign-out, manual full sync, or account disconnect.
   */
  static clearSpreadsheet(spreadsheetId: string): void {
    const prefix = `${spreadsheetId}:`;
    for (const key of Array.from(this.store.keys())) {
      if (key.startsWith(prefix)) {
        this.store.delete(key);
      }
    }
  }

  /**
   * Clear entire cache (e.g. testing or admin restart).
   */
  static clearAll(): void {
    this.store.clear();
  }

  /**
   * Get metadata about active cache entries (useful for diagnostics).
   */
  static getStats(): {
    size: number;
    entries: Array<{ key: string; expiresInSec: number }>;
  } {
    const now = Date.now();
    const entries: Array<{ key: string; expiresInSec: number }> = [];

    for (const [key, entry] of this.store.entries()) {
      if (now > entry.expiresAt) {
        this.store.delete(key);
      } else {
        entries.push({
          key,
          expiresInSec: Math.round((entry.expiresAt - now) / 1000),
        });
      }
    }

    return {
      size: entries.length,
      entries,
    };
  }
}
