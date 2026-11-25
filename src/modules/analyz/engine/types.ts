export type StageMode = 'football' | 'basketball' | 'weapon' | 'map' | 'strategy';

/* ─── Football Mode Schema ─────────────────────────────────────────────── */
export interface FootballPlayer {
  id: string;
  number: number;
  role: string;
  /** Optional real player full name for live portrait resolution (TheSportsDB / Wikimedia) */
  name?: string;
  /** Short pitch display surname (e.g. "Mbappé", "Bellingham") */
  displayName?: string;
  team: 'home' | 'away';
  /** Normalized pitch X (0 = left goal line, 100 = right goal line) */
  x: number;
  /** Normalized pitch Y (0 = top touchline, 100 = bottom touchline) */
  y: number;
  hasBall?: boolean;
}

export interface FootballVector {
  id: string;
  type: 'pass' | 'run' | 'press';
  from: [number, number];
  to: [number, number];
  curve?: number;
  label?: string;
}

export interface FootballZone {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  tone: 'attack' | 'press' | 'cover';
  label?: string;
}

export interface FootballPayload {
  formation: string;
  tacticalStyle: string;
  teamColor: string;
  awayColor: string;
  players: FootballPlayer[];
  vectors: FootballVector[];
  zones?: FootballZone[];
  ballPath?: [number, number][];
}

/* ─── Basketball Mode Schema ───────────────────────────────────────────── */
export interface BasketballPlayer {
  id: string;
  number: number;
  position: 'PG' | 'SG' | 'SF' | 'PF' | 'C';
  team: 'offense' | 'defense';
  /** Normalized court X (0 = left baseline, 100 = right baseline) */
  x: number;
  /** Normalized court Y (0 = top sideline, 100 = bottom sideline) */
  y: number;
  /** Target position at end of play phase */
  targetX?: number;
  targetY?: number;
  hasBall?: boolean;
}

export interface BasketballAction {
  id: string;
  type: 'pass' | 'cut' | 'screen' | 'dribble';
  from: [number, number];
  to: [number, number];
  curve?: number;
  phase?: number;
  label?: string;
}

export interface BasketballZone {
  id: string;
  x: number;
  y: number;
  radius: number;
  label: string;
  tone: 'spacing' | 'paint' | 'shooter';
}

export interface BasketballPayload {
  playName: string;
  courtTheme: 'hardwood' | 'midnight' | 'arena';
  setType: string;
  players: BasketballPlayer[];
  actions: BasketballAction[];
  zones?: BasketballZone[];
  ballSequence?: [number, number][];
}

/* ─── Weapon Loadout Mode Schema ───────────────────────────────────────── */
export type WeaponChassisId = 'm4a1' | 'vx9' | 'm200';
export type AttachmentSlot = 'optic' | 'muzzle' | 'barrel' | 'underbarrel' | 'magazine' | 'stock';

export interface WeaponStats {
  damage: number;
  accuracy: number;
  fireRate: number;
  mobility: number;
  control: number;
}

export interface WeaponAttachment {
  id: string;
  name: string;
  slot: AttachmentSlot;
  variant: string;
  statDelta: Partial<WeaponStats>;
  calloutNote: string;
}

export interface WeaponPayload {
  chassis: WeaponChassisId;
  weaponName: string;
  gameTitle?: string;
  caliber: string;
  blueprintAccent: string;
  /** Public wiki page title / Wikimedia query for live weapon render resolution */
  wikiQuery?: string;
  wikiSite?: 'callofduty' | 'counterstrike' | 'valorant' | 'wikimedia';
  highlightedSlot?: AttachmentSlot;
  attachments: Record<AttachmentSlot, WeaponAttachment>;
  stats: WeaponStats;
}

/* ─── Tactical Game Map Mode Schema ────────────────────────────────────── */
export interface MapPoi {
  id: string;
  name: string;
  x: number;
  y: number;
  grid: string;
  tier: 'major' | 'minor';
}

export interface MapZone {
  id: string;
  type: 'safe' | 'danger' | 'gas' | 'smoke';
  x: number;
  y: number;
  radius: number;
  label?: string;
}

export interface MapMarker {
  id: string;
  type: 'squad' | 'objective' | 'extract' | 'hostile';
  label: string;
  x: number;
  y: number;
  heading?: number;
  color?: string;
}

export interface MapRoute {
  id: string;
  type: 'flank' | 'extract' | 'patrol';
  points: [number, number][];
  label?: string;
}

export interface MapPayload {
  mapId?: 'mirage' | 'warzone' | 'harbor';
  gameTitle?: string;
  sectorName: string;
  operationPhase: string;
  wikiQuery?: string;
  wikiSite?: 'counterstrike' | 'callofduty' | 'valorant' | 'wikimedia';
  pois: MapPoi[];
  zones: MapZone[];
  markers: MapMarker[];
  routes: MapRoute[];
}

/* ─── Strategy / MOBA / RTS Mode Schema ────────────────────────────────── */
export type StrategyGameId = 'dota2' | 'lol' | 'rts';

export interface StrategyUnit {
  id: string;
  name: string;
  /** Official hero/champion CDN key (e.g., "earthshaker", "LeeSin") */
  heroKey: string;
  role: string;
  team: 'radiant' | 'dire';
  x: number;
  y: number;
  targetX?: number;
  targetY?: number;
  level?: number;
  ultimateReady?: boolean;
}

export interface StrategyObjective {
  id: string;
  type: 'roshan' | 'baron' | 'tower' | 'base';
  label: string;
  timer?: string;
  x: number;
  y: number;
  team?: 'radiant' | 'dire' | 'neutral';
}

export interface StrategyWard {
  id: string;
  type: 'observer' | 'sentry' | 'control';
  x: number;
  y: number;
  radius: number;
  team: 'radiant' | 'dire';
}

export interface StrategyAction {
  id: string;
  type: 'gank' | 'push' | 'tp' | 'combo';
  from: [number, number];
  to: [number, number];
  curve?: number;
  radius?: number;
  label?: string;
}

export interface StrategyPayload {
  game: StrategyGameId;
  gameLabel: string;
  mapTitle: string;
  matchClock: string;
  units: StrategyUnit[];
  objectives: StrategyObjective[];
  wards: StrategyWard[];
  actions: StrategyAction[];
}

/* ─── Unified Command Schema ───────────────────────────────────────────── */
export type StageCommand =
  | {
      mode: 'football';
      title: string;
      subtitle: string;
      payload: FootballPayload;
    }
  | {
      mode: 'basketball';
      title: string;
      subtitle: string;
      payload: BasketballPayload;
    }
  | {
      mode: 'weapon';
      title: string;
      subtitle: string;
      payload: WeaponPayload;
    }
  | {
      mode: 'map';
      title: string;
      subtitle: string;
      payload: MapPayload;
    }
  | {
      mode: 'strategy';
      title: string;
      subtitle: string;
      payload: StrategyPayload;
    };

export type CommandSource = 'preset' | 'json' | 'prompt' | 'api';

export interface CommandHistoryEntry {
  id: string;
  timestamp: string;
  source: CommandSource;
  mode: StageMode;
  title: string;
  summary: string;
  command: StageCommand;
}

export interface StageState {
  activeCommand: StageCommand;
  previousWeaponStats: WeaponStats | null;
  weaponStatDeltas: WeaponStats | null;
  commandSequence: number;
  lastUpdatedAt: number;
  history: CommandHistoryEntry[];
}

export type ValidationResult =
  | { ok: true; command: StageCommand }
  | { ok: false; error: string };
