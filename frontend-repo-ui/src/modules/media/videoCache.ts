import type { VideoSource } from '../projector/utils/media';

/** 8-hour TTL cache window (28,800 seconds) required by backend/cache contract */
export const VIDEO_CACHE_TTL_SECONDS = 28800;
export const VIDEO_CACHE_TTL_MS = VIDEO_CACHE_TTL_SECONDS * 1000;
export const VIDEO_CACHE_STORAGE_KEY = 'aigameria-video-cache-v1';

export interface CachedVideoEntry {
  cacheKey: string;
  gameId: string;
  skillId: string;
  source: VideoSource;
  cachedAt: number;
  expiresAt: number;
  ttlSeconds: number;
}

export interface VideoCacheSnapshot {
  entries: CachedVideoEntry[];
  ttlSeconds: number;
}

export function createCacheKey(gameId: string, skillId: string): string {
  return `${gameId.trim().toLowerCase()}::${skillId.trim().toLowerCase()}`;
}

export function isEntryExpired(entry: CachedVideoEntry, nowMs = Date.now()): boolean {
  return nowMs >= entry.expiresAt;
}

export function getRemainingTtlSeconds(entry: CachedVideoEntry, nowMs = Date.now()): number {
  const remainingMs = Math.max(0, entry.expiresAt - nowMs);
  return Math.floor(remainingMs / 1000);
}

export function formatTtlCountdown(remainingSeconds: number): string {
  const safe = Math.max(0, Math.floor(remainingSeconds));
  const hrs = Math.floor(safe / 3600);
  const mins = Math.floor((safe % 3600) / 60);
  const secs = safe % 60;
  return `${hrs}h ${String(mins).padStart(2, '0')}m ${String(secs).padStart(2, '0')}s`;
}

export class VideoTtlCache {
  private readonly store = new Map<string, CachedVideoEntry>();
  private readonly ttlMs: number;
  private readonly persistToStorage: boolean;

  constructor(options?: { ttlSeconds?: number; persistToStorage?: boolean }) {
    const ttlSeconds = options?.ttlSeconds ?? VIDEO_CACHE_TTL_SECONDS;
    this.ttlMs = ttlSeconds * 1000;
    this.persistToStorage = options?.persistToStorage ?? typeof window !== 'undefined';
    if (this.persistToStorage) {
      this.hydrate();
    }
  }

  set(gameId: string, skillId: string, source: VideoSource, nowMs = Date.now()): CachedVideoEntry {
    const cacheKey = createCacheKey(gameId, skillId);
    const ttlSeconds = Math.round(this.ttlMs / 1000);
    const entry: CachedVideoEntry = {
      cacheKey,
      gameId,
      skillId,
      source,
      cachedAt: nowMs,
      expiresAt: nowMs + this.ttlMs,
      ttlSeconds,
    };
    this.store.set(cacheKey, entry);
    this.persist();
    return entry;
  }

  get(gameId: string, skillId: string, nowMs = Date.now()): CachedVideoEntry | null {
    const cacheKey = createCacheKey(gameId, skillId);
    const entry = this.store.get(cacheKey);
    if (!entry) return null;
    if (isEntryExpired(entry, nowMs)) {
      this.store.delete(cacheKey);
      this.persist();
      return null;
    }
    return entry;
  }

  prune(nowMs = Date.now()): number {
    let removed = 0;
    for (const [key, entry] of this.store.entries()) {
      if (isEntryExpired(entry, nowMs)) {
        this.store.delete(key);
        removed += 1;
      }
    }
    if (removed > 0) this.persist();
    return removed;
  }

  listValid(nowMs = Date.now()): CachedVideoEntry[] {
    this.prune(nowMs);
    return Array.from(this.store.values()).sort((a, b) => b.cachedAt - a.cachedAt);
  }

  clear(): void {
    this.store.clear();
    this.persist();
  }

  private hydrate(): void {
    if (typeof window === 'undefined') return;
    try {
      const raw = window.localStorage.getItem(VIDEO_CACHE_STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as CachedVideoEntry[];
      if (!Array.isArray(parsed)) return;
      const now = Date.now();
      for (const item of parsed) {
        if (item && item.cacheKey && !isEntryExpired(item, now)) {
          // Blob URLs cannot survive full browser reloads
          if (item.source?.isLocalFile || item.source?.src?.startsWith('blob:')) continue;
          this.store.set(item.cacheKey, item);
        }
      }
    } catch {
      // Ignore storage read restrictions
    }
  }

  private persist(): void {
    if (!this.persistToStorage || typeof window === 'undefined') return;
    try {
      const serializable = Array.from(this.store.values()).filter(
        (entry) => !entry.source.isLocalFile && !entry.source.src?.startsWith('blob:'),
      );
      window.localStorage.setItem(VIDEO_CACHE_STORAGE_KEY, JSON.stringify(serializable));
    } catch {
      // Ignore storage quota restrictions
    }
  }
}

export const sharedVideoCache = new VideoTtlCache();
