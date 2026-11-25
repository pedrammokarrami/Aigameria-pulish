import type { StrategyGameId, WeaponChassisId } from './types';

export interface ResolvedAsset {
  url: string;
  source: string;
  image: HTMLImageElement | null;
  status: 'loading' | 'ready' | 'fallback';
  flipX?: boolean;
}

export const STUDIO_WEAPON_ASSETS: Record<
  WeaponChassisId,
  { url: string; flipX: boolean }
> = {
  m4a1: {
    url: '/src/assets/images/weapon_m4a1_studio_1795548947017.jpg',
    flipX: false,
  },
  vx9: {
    url: '/src/assets/images/weapon_vector_studio_1795548949535.jpg',
    flipX: true,
  },
  m200: {
    url: '/src/assets/images/weapon_sniper_studio_1795548950555.jpg',
    flipX: true,
  },
};

export const STUDIO_MAP_ASSETS = {
  mirage: '/src/assets/images/map_mirage_tactical_1795548949780.jpg',
  moba: '/src/assets/images/map_moba_battlefield_1795548949075.jpg',
  backdrop: '/src/assets/images/cs2_world_backdrop_1795601005197.jpg',
};

type Listener = () => void;

const listeners = new Set<Listener>();
const assetCache = new Map<string, ResolvedAsset>();
const inflightRequests = new Map<string, Promise<ResolvedAsset>>();
const imageElementCache = new Map<string, HTMLImageElement>();

export function subscribeAssetUpdates(fn: Listener): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function notifyAssetUpdate(): void {
  listeners.forEach((fn) => fn());
}

function loadLocalImage(url: string): Promise<HTMLImageElement | null> {
  if (typeof window === 'undefined' || !url) return Promise.resolve(null);
  const existing = imageElementCache.get(url);
  if (existing && existing.complete && existing.naturalWidth > 0) {
    return Promise.resolve(existing);
  }
  return new Promise((resolve) => {
    const img = new Image();
    img.decoding = 'async';
    img.referrerPolicy = 'no-referrer';
    img.onload = () => {
      if (img.naturalWidth > 0) {
        imageElementCache.set(url, img);
        resolve(img);
      } else {
        resolve(null);
      }
    };
    img.onerror = () => resolve(null);
    img.src = url;
  });
}

function resolveStudioAsset(
  key: string,
  url: string,
  source: string,
  flipX = false,
): ResolvedAsset {
  const cached = assetCache.get(key);
  if (cached) return cached;

  const existingImg = imageElementCache.get(url) ?? null;
  const initial: ResolvedAsset = {
    url,
    source,
    image: existingImg,
    status: existingImg ? 'ready' : 'loading',
    flipX,
  };
  assetCache.set(key, initial);

  if (!existingImg && !inflightRequests.has(key)) {
    const task = loadLocalImage(url).then((img) => {
      const next: ResolvedAsset = {
        url,
        source,
        image: img,
        status: img ? 'ready' : 'fallback',
        flipX,
      };
      assetCache.set(key, next);
      notifyAssetUpdate();
      return next;
    });
    inflightRequests.set(key, task);
    task.finally(() => inflightRequests.delete(key));
  }

  return assetCache.get(key) ?? initial;
}

export function getPlayerPortraitAsset(_name: string): ResolvedAsset | null {
  return null;
}

export function getFootballPlayerPortrait(_name: string): ResolvedAsset | null {
  return null;
}

export function getWeaponRenderAsset(
  chassis: WeaponChassisId,
  _wikiQuery?: string,
  _wikiSite?: 'callofduty' | 'counterstrike' | 'valorant' | 'wikimedia',
): ResolvedAsset {
  const studio = STUDIO_WEAPON_ASSETS[chassis] ?? STUDIO_WEAPON_ASSETS.m4a1;
  return resolveStudioAsset(
    `weapon:${chassis}`,
    studio.url,
    'Studio Armory',
    studio.flipX,
  );
}

export function getTacticalMapAsset(
  mapId: 'mirage' | 'warzone' | 'harbor' = 'mirage',
  _wikiQuery?: string,
  _wikiSite?: 'counterstrike' | 'callofduty' | 'valorant' | 'wikimedia',
): ResolvedAsset {
  return resolveStudioAsset(
    `map:${mapId}`,
    STUDIO_MAP_ASSETS.mirage,
    'Tactical Overview',
    false,
  );
}

export function getStrategyMapAsset(game: StrategyGameId): ResolvedAsset {
  return resolveStudioAsset(
    `strategy-map:${game}`,
    STUDIO_MAP_ASSETS.moba,
    'MOBA Battlefield',
    false,
  );
}

export function getStrategyHeroAsset(
  _game: StrategyGameId,
  _heroKey: string,
  _displayName: string,
): ResolvedAsset | null {
  return null;
}
