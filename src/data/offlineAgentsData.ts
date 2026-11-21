export type AgentSyncStatus = 'Verified' | 'Synced' | 'Offline Ready' | 'Local Queue';

export type CrossGameKey =
  | 'unified'
  | 'fc27'
  | 'nba2k'
  | 'fortnite'
  | 'dota2'
  | 'f1'
  | 'warzone'
  | 'cs2'
  | 'gta'
  | 'rdr2'
  | 'apex'
  | 'valorant'
  | 'chess';

export type SpatialViewMode = 'overview' | 'agents' | 'highlights';

export interface CrossGameHandleProfile {
  key: CrossGameKey;
  gameTitle: string;
  handle: string;
  regionTag: string;
  tierLabel: string;
  tierProgress: number; // 0..100
  accentHex: string;
  winRatePct: number;
  tacticalConsistencyPct: number;
  competitiveRating: number;
  ratingLabel: string;
  verifiedMatchesCount: number;
  presenceStatus: 'Online · In-Ecosystem' | 'Offline Ready · Cached';
}

export interface VerifiedMatchRecord {
  id: string;
  gameKey: Exclude<CrossGameKey, 'unified'>;
  gameTitle: string;
  opponentOrMode: string;
  finalScore: string;
  playedAt: string;
  status: 'Verified' | 'Local Queue' | 'Disputed';
  integrityHash: string | null;
  highlightClipId?: string;
}

export interface TacticalTakeawayItem {
  id: string;
  gameKey: Exclude<CrossGameKey, 'unified'>;
  gameTitle: string;
  postMatchSummary: string;
  recurringPattern: string;
  microAdjustment: string;
  applied: boolean;
  recordedAt: string;
}

export interface RapidDrillRecord {
  id: string;
  discipline: 'Chess 10s Tactics' | 'FC 27 Passing Lane';
  promptTitle: string;
  reactionSec: number;
  accuracyPct: number;
  recordedAt: string;
}

export interface RapidDrillChallenge {
  id: string;
  discipline: 'Chess 10s Tactics' | 'FC 27 Passing Lane';
  scenario: string;
  options: { id: string; label: string; isBest: boolean; explanation: string }[];
}

export interface DisputeCheckpoint {
  timestampLabel: string;
  eventNote: string;
  telemetryDelta: string;
}

export interface DisputeEvidenceCase {
  id: string;
  matchId: string;
  gameTitle: string;
  title: string;
  claimSummary: string;
  status: 'Open Review' | 'Resolved · Verified';
  evidenceScorePct: number;
  openedAt: string;
  checkpoints: DisputeCheckpoint[];
}

export interface HighlightClipItem {
  id: string;
  matchId: string;
  gameKey: Exclude<CrossGameKey, 'unified'>;
  gameTitle: string;
  title: string;
  durationLabel: string;
  timestampLabel: string;
  momentTag: string;
  summary: string;
  keyframeNotes: { timeLabel: string; note: string; intensityPct: number }[];
  accentHex: string;
}

export interface OfflineAgentsState {
  unifiedId: string;
  displayName: string;
  primaryHandle: string;
  activeGameKey: CrossGameKey;
  lastLocalSyncAt: string;
  isOfflineCapable: boolean;
  profiles: Record<CrossGameKey, CrossGameHandleProfile>;
  scoreboardAgent: {
    status: AgentSyncStatus;
    latestHash: string;
    verifiedCount: number;
    queuedCount: number;
  };
  coachingAgent: {
    status: AgentSyncStatus;
    takeaways: TacticalTakeawayItem[];
  };
  rapidDrillsAgent: {
    status: AgentSyncStatus;
    targetMaxSec: number;
    avgReactionSec: number;
    records: RapidDrillRecord[];
  };
  disputeAgent: {
    status: AgentSyncStatus;
    cases: DisputeEvidenceCase[];
  };
  highlightAgent: {
    status: AgentSyncStatus;
    clips: HighlightClipItem[];
  };
  matches: VerifiedMatchRecord[];
}

export const RAPID_DRILL_CHALLENGES: RapidDrillChallenge[] = [
  {
    id: 'drill-chess-fork',
    discipline: 'Chess 10s Tactics',
    scenario: 'Blitz Endgame (6.4s left on clock): Opponent king on g8, rook on d8, pawn on f7. White knight sits on e5.',
    options: [
      {
        id: 'nxf7',
        label: 'Nxf7 (Royal Fork on d8 Rook & h8 Corner)',
        isBest: true,
        explanation: 'Wins the exchange cleanly while forcing the black king away from the f-file.',
      },
      {
        id: 'nc6',
        label: 'Nc6 (Attack d8 Rook)',
        isBest: false,
        explanation: 'Allows Rd6 escape with tempo and loses initiative.',
      },
      {
        id: 'qd4',
        label: 'Qd4 (Centralize Queen)',
        isBest: false,
        explanation: 'Too slow under 10-second blitz pressure; misses immediate tactical material gain.',
      },
    ],
  },
  {
    id: 'drill-fc27-lane',
    discipline: 'FC 27 Passing Lane',
    scenario: '84th min counter: Fullback steps up high leaving a 12m half-space channel behind the right-center back.',
    options: [
      {
        id: 'driven-through',
        label: 'First-Time Driven Through Ball to Inverted Winger',
        isBest: true,
        explanation: 'Splits the backline before the pivot recovers, creating a 1v1 angled finish.',
      },
      {
        id: 'back-pass',
        label: 'Recycle Back to Deep-Lying Playmaker',
        isBest: false,
        explanation: 'Surrenders the transition window and lets the defensive block reset.',
      },
      {
        id: 'long-shot',
        label: 'Early Finesse Attempt from 28 Yards',
        isBest: false,
        explanation: 'Low xG (0.04) with two defenders still screening the near post.',
      },
    ],
  },
];

export const INITIAL_OFFLINE_PROFILE_STATE: OfflineAgentsState = {
  unifiedId: 'AGM-8841-IR',
  displayName: 'Kian Rostami',
  primaryHandle: '@kian.spatial',
  activeGameKey: 'unified',
  lastLocalSyncAt: '2026-11-19 19:24',
  isOfflineCapable: true,
  profiles: {
    unified: {
      key: 'unified',
      gameTitle: 'All Linked Titles',
      handle: '@kian.spatial',
      regionTag: 'EU-CENTRAL · LOCAL EDGE',
      tierLabel: 'Apex Tier II',
      tierProgress: 84,
      accentHex: '#0071E3',
      winRatePct: 68.4,
      tacticalConsistencyPct: 91.2,
      competitiveRating: 2480,
      ratingLabel: 'Cross-Title MMR',
      verifiedMatchesCount: 142,
      presenceStatus: 'Online · In-Ecosystem',
    },
    fc27: {
      key: 'fc27',
      gameTitle: 'EA SPORTS FC 27',
      handle: 'KianFC_Pro',
      regionTag: 'FUT CHAMPIONS · DIV 1',
      tierLabel: 'Elite Division',
      tierProgress: 88,
      accentHex: '#16A34A',
      winRatePct: 72.1,
      tacticalConsistencyPct: 89.5,
      competitiveRating: 2145,
      ratingLabel: 'Skill Rating',
      verifiedMatchesCount: 54,
      presenceStatus: 'Online · In-Ecosystem',
    },
    cs2: {
      key: 'cs2',
      gameTitle: 'Counter-Strike 2',
      handle: 'kian_mirage',
      regionTag: 'PREMIER · FACEIT LVL 9',
      tierLabel: 'Tactical Master',
      tierProgress: 79,
      accentHex: '#D97706',
      winRatePct: 64.8,
      tacticalConsistencyPct: 92.6,
      competitiveRating: 23180,
      ratingLabel: 'Premier CS Rating',
      verifiedMatchesCount: 41,
      presenceStatus: 'Online · In-Ecosystem',
    },
    chess: {
      key: 'chess',
      gameTitle: 'Chess 10s Blitz',
      handle: 'RostamiBlitz',
      regionTag: 'RAPID / BULLET',
      tierLabel: 'Candidate Tier',
      tierProgress: 86,
      accentHex: '#0284C7',
      winRatePct: 69.2,
      tacticalConsistencyPct: 94.0,
      competitiveRating: 2294,
      ratingLabel: 'Blitz ELO',
      verifiedMatchesCount: 33,
      presenceStatus: 'Offline Ready · Cached',
    },
    valorant: {
      key: 'valorant',
      gameTitle: 'VALORANT',
      handle: 'Kian#IR99',
      regionTag: 'ASCENDANT III',
      tierLabel: 'Controller Lead',
      tierProgress: 76,
      accentHex: '#FF4655',
      winRatePct: 63.5,
      tacticalConsistencyPct: 88.7,
      competitiveRating: 1960,
      ratingLabel: 'Tracker Score',
      verifiedMatchesCount: 14,
      presenceStatus: 'Offline Ready · Cached',
    },
    nba2k: {
      key: 'nba2k',
      gameTitle: 'NBA 2K',
      handle: 'Kian_PG10',
      regionTag: 'PRO-AM · CONF #2',
      tierLabel: 'Hall of Fame PG',
      tierProgress: 91,
      accentHex: '#F97316',
      winRatePct: 81.8,
      tacticalConsistencyPct: 93.4,
      competitiveRating: 96,
      ratingLabel: 'MyPLAYER OVR',
      verifiedMatchesCount: 22,
      presenceStatus: 'Online · In-Ecosystem',
    },
    fortnite: {
      key: 'fortnite',
      gameTitle: 'FORTNITE',
      handle: 'KianBuilds_IR',
      regionTag: 'FNCS · EU UNREAL',
      tierLabel: 'Unreal Rank',
      tierProgress: 94,
      accentHex: '#3B82F6',
      winRatePct: 31.4,
      tacticalConsistencyPct: 90.2,
      competitiveRating: 2840,
      ratingLabel: 'FNCS PR',
      verifiedMatchesCount: 48,
      presenceStatus: 'Online · In-Ecosystem',
    },
    dota2: {
      key: 'dota2',
      gameTitle: 'DOTA 2',
      handle: 'Kian.Midlane',
      regionTag: 'IMMORTAL · EU WEST',
      tierLabel: 'Immortal #1,420',
      tierProgress: 87,
      accentHex: '#0EA5E9',
      winRatePct: 61.5,
      tacticalConsistencyPct: 91.8,
      competitiveRating: 7420,
      ratingLabel: 'Immortal MMR',
      verifiedMatchesCount: 64,
      presenceStatus: 'Online · In-Ecosystem',
    },
    f1: {
      key: 'f1',
      gameTitle: 'F1',
      handle: 'K. ROSTAMI #10',
      regionTag: 'SUPER LICENCE · S+',
      tierLabel: 'Grand Prix P1',
      tierProgress: 92,
      accentHex: '#FF1E00',
      winRatePct: 74.0,
      tacticalConsistencyPct: 95.6,
      competitiveRating: 412,
      ratingLabel: 'Championship Pts',
      verifiedMatchesCount: 19,
      presenceStatus: 'Online · In-Ecosystem',
    },
    warzone: {
      key: 'warzone',
      gameTitle: 'WARZONE',
      handle: 'KianOps#441',
      regionTag: 'CRIMSON III · URZIKSTAN',
      tierLabel: 'Task Force Lead',
      tierProgress: 83,
      accentHex: '#F59E0B',
      winRatePct: 28.6,
      tacticalConsistencyPct: 89.1,
      competitiveRating: 8940,
      ratingLabel: 'Ranked SR',
      verifiedMatchesCount: 37,
      presenceStatus: 'Online · In-Ecosystem',
    },
    gta: {
      key: 'gta',
      gameTitle: 'GTA',
      handle: 'Kian_Vice',
      regionTag: 'VICE PHANTOMS [VPH]',
      tierLabel: 'Heist Mastermind',
      tierProgress: 89,
      accentHex: '#EC4899',
      winRatePct: 79.0,
      tacticalConsistencyPct: 90.5,
      competitiveRating: 17450,
      ratingLabel: 'Crew REP',
      verifiedMatchesCount: 29,
      presenceStatus: 'Online · In-Ecosystem',
    },
    rdr2: {
      key: 'rdr2',
      gameTitle: 'RDR2',
      handle: 'Kian_Morgan',
      regionTag: 'VALENTINE · RED EAGLE',
      tierLabel: 'Honorable Gunslinger',
      tierProgress: 85,
      accentHex: '#D97706',
      winRatePct: 76.2,
      tacticalConsistencyPct: 92.1,
      competitiveRating: 890,
      ratingLabel: 'Posse Territory',
      verifiedMatchesCount: 24,
      presenceStatus: 'Offline Ready · Cached',
    },
    apex: {
      key: 'apex',
      gameTitle: 'APEX',
      handle: 'KianWraith_IR',
      regionTag: 'MASTER · SPLIT 2',
      tierLabel: 'Apex Master',
      tierProgress: 82,
      accentHex: '#DA292A',
      winRatePct: 24.8,
      tacticalConsistencyPct: 88.9,
      competitiveRating: 14820,
      ratingLabel: 'Ranked RP',
      verifiedMatchesCount: 51,
      presenceStatus: 'Online · In-Ecosystem',
    },
  },
  scoreboardAgent: {
    status: 'Verified',
    latestHash: 'sha256:9f4c...e28a',
    verifiedCount: 142,
    queuedCount: 2,
  },
  coachingAgent: {
    status: 'Synced',
    takeaways: [
      {
        id: 'coach-fc27-1',
        gameKey: 'fc27',
        gameTitle: 'EA SPORTS FC 27',
        postMatchSummary: '74% final-third pass completion under high press; two late counter exposures on weak-side fullback overlap.',
        recurringPattern: 'Triggers L1 sprint 0.4s early when receiving inside own half.',
        microAdjustment: 'Hold R1 close-control for 1 beat before releasing through ball to ST.',
        applied: false,
        recordedAt: '18 mins ago',
      },
      {
        id: 'coach-cs2-1',
        gameKey: 'cs2',
        gameTitle: 'Counter-Strike 2',
        postMatchSummary: 'Mirage CT Mid anchor held 82% survival across 11 gun rounds; utility timing slipped twice on late B splits.',
        recurringPattern: 'Peeks Window smoke 0.6s prior to flash pop on eco retakes.',
        microAdjustment: 'Delay step-out until teammate flashbang audio cue peaks.',
        applied: true,
        recordedAt: '2 hours ago',
      },
      {
        id: 'coach-chess-1',
        gameKey: 'chess',
        gameTitle: 'Chess 10s Blitz',
        postMatchSummary: 'Zero tactical blunders in moves 12–28; minor time bleed during rook pawn endgame transitions.',
        recurringPattern: 'Spends >7.5s verifying obvious recaptures in forced lines.',
        microAdjustment: 'Pre-calculate recapture branch while opponent hand moves.',
        applied: false,
        recordedAt: 'Yesterday',
      },
      {
        id: 'coach-val-1',
        gameKey: 'valorant',
        gameTitle: 'VALORANT',
        postMatchSummary: 'Strong post-plant smoke discipline on Ascent A-Main; over-rotated twice on fake mid pressure.',
        recurringPattern: 'Drops second smoke immediately upon first footstep audio.',
        microAdjustment: 'Hold second controller orb until minimap confirms two threats.',
        applied: false,
        recordedAt: '2 days ago',
      },
    ],
  },
  rapidDrillsAgent: {
    status: 'Offline Ready',
    targetMaxSec: 10.0,
    avgReactionSec: 4.6,
    records: [
      {
        id: 'rec-1',
        discipline: 'Chess 10s Tactics',
        promptTitle: 'Knight Fork & Pin Conversion',
        reactionSec: 4.1,
        accuracyPct: 96,
        recordedAt: 'Today · 19:10',
      },
      {
        id: 'rec-2',
        discipline: 'FC 27 Passing Lane',
        promptTitle: 'Half-Space Driven Split Pass',
        reactionSec: 5.2,
        accuracyPct: 91,
        recordedAt: 'Today · 18:45',
      },
      {
        id: 'rec-3',
        discipline: 'Chess 10s Tactics',
        promptTitle: 'Back-Rank Deflection Under 6s',
        reactionSec: 3.8,
        accuracyPct: 100,
        recordedAt: 'Yesterday',
      },
      {
        id: 'rec-4',
        discipline: 'FC 27 Passing Lane',
        promptTitle: 'Switch-of-Play Cutback Timing',
        reactionSec: 5.3,
        accuracyPct: 88,
        recordedAt: 'Yesterday',
      },
    ],
  },
  disputeAgent: {
    status: 'Local Queue',
    cases: [
      {
        id: 'case-104',
        matchId: 'match-fc27-902',
        gameTitle: 'EA SPORTS FC 27',
        title: '90+2’ Goal-Line Desync Claim',
        claimSummary: 'Opponent flagged late stoppage-time winner as packet rollback desync.',
        status: 'Open Review',
        evidenceScorePct: 98,
        openedAt: '42 mins ago',
        checkpoints: [
          {
            timestampLabel: '89:48',
            eventNote: 'Local tick hash matched server scoreboard packet (0ms drift).',
            telemetryDelta: '0.0% variance',
          },
          {
            timestampLabel: '91:14',
            eventNote: 'Driven cross entered box; ball crossed goal plane cleanly inside 60Hz tick.',
            telemetryDelta: '+14ms RTT',
          },
          {
            timestampLabel: '91:19',
            eventNote: 'Scoreboard state sealed 3–2 prior to opponent disconnect signal.',
            telemetryDelta: 'Hash Confirmed',
          },
        ],
      },
      {
        id: 'case-099',
        matchId: 'match-cs2-887',
        gameTitle: 'Counter-Strike 2',
        title: 'Round 22 Demo Checksum Mismatch',
        claimSummary: 'Automatic cross-check resolved demo tick offset in Mirage OT.',
        status: 'Resolved · Verified',
        evidenceScorePct: 100,
        openedAt: 'Yesterday',
        checkpoints: [
          {
            timestampLabel: 'R22 · 00:44',
            eventNote: 'Smoke bloom frame synchronized with local GOTV buffer.',
            telemetryDelta: 'Verified',
          },
          {
            timestampLabel: 'R22 · 01:12',
            eventNote: 'Final round 13–11 scoreboard digest signed locally.',
            telemetryDelta: 'Confirmed',
          },
        ],
      },
    ],
  },
  highlightAgent: {
    status: 'Synced',
    clips: [
      {
        id: 'clip-fc27-01',
        matchId: 'match-fc27-904',
        gameKey: 'fc27',
        gameTitle: 'EA SPORTS FC 27',
        title: '87’ Half-Space One-Touch Volley Winner',
        durationLabel: '0:24',
        timestampLabel: 'Today · 19:02',
        momentTag: 'Clutch Goal · Verified',
        summary: 'First-time driven pass split two center backs before an angled far-post finish sealed 4–2.',
        accentHex: '#16A34A',
        keyframeNotes: [
          { timeLabel: '0:04', note: 'Deep pivot wins clean possession on touchline', intensityPct: 48 },
          { timeLabel: '0:12', note: 'Driven through ball breaks defensive press', intensityPct: 82 },
          { timeLabel: '0:19', note: 'Far-post top-corner strike (0.64 xG)', intensityPct: 98 },
        ],
      },
      {
        id: 'clip-cs2-02',
        matchId: 'match-cs2-891',
        gameKey: 'cs2',
        gameTitle: 'Counter-Strike 2',
        title: 'Mirage A-Site 1v3 Post-Plant Clutch',
        durationLabel: '0:31',
        timestampLabel: 'Today · 16:40',
        momentTag: '1v3 Clutch · Verified',
        summary: 'Isolated triple duel around Firebox using one-way stair smoke and crisp counter-strafes.',
        accentHex: '#D97706',
        keyframeNotes: [
          { timeLabel: '0:06', note: 'CT smoke blocks sniper sightline cleanly', intensityPct: 60 },
          { timeLabel: '0:18', note: 'Double tap isolates ramp flanker', intensityPct: 88 },
          { timeLabel: '0:27', note: 'Final defuse stick punish at 0:04 remaining', intensityPct: 99 },
        ],
      },
      {
        id: 'clip-chess-03',
        matchId: 'match-chess-875',
        gameKey: 'chess',
        gameTitle: 'Chess 10s Blitz',
        title: '3.8s Queen Sacrifice Mate-in-3',
        durationLabel: '0:18',
        timestampLabel: 'Yesterday · 22:15',
        momentTag: 'Sub-4s Tactical Spot',
        summary: 'Spotted forced Qg7+ deflection under extreme clock pressure to close match with 2.1s left.',
        accentHex: '#0284C7',
        keyframeNotes: [
          { timeLabel: '0:03', note: 'Opponent drops knight defense of g7', intensityPct: 54 },
          { timeLabel: '0:09', note: 'Qg7+ deflection played in 3.8 seconds', intensityPct: 95 },
          { timeLabel: '0:15', note: 'Rook delivers forced back-rank checkmate', intensityPct: 100 },
        ],
      },
    ],
  },
  matches: [
    {
      id: 'match-fc27-904',
      gameKey: 'fc27',
      gameTitle: 'EA SPORTS FC 27',
      opponentOrMode: 'FUT Champs vs @Alireza_99',
      finalScore: '4 – 2',
      playedAt: 'Today · 19:02',
      status: 'Verified',
      integrityHash: 'sha256:9f4c...e28a',
      highlightClipId: 'clip-fc27-01',
    },
    {
      id: 'match-fc27-902',
      gameKey: 'fc27',
      gameTitle: 'EA SPORTS FC 27',
      opponentOrMode: 'Div 1 Rivals vs @SoroushPro',
      finalScore: '3 – 2',
      playedAt: 'Today · 18:18',
      status: 'Disputed',
      integrityHash: 'sha256:3b1d...910f',
    },
    {
      id: 'match-cs2-891',
      gameKey: 'cs2',
      gameTitle: 'Counter-Strike 2',
      opponentOrMode: 'Premier · Mirage vs Stack-EU',
      finalScore: '13 – 9',
      playedAt: 'Today · 16:40',
      status: 'Verified',
      integrityHash: 'sha256:7d2a...441b',
      highlightClipId: 'clip-cs2-02',
    },
    {
      id: 'match-chess-889',
      gameKey: 'chess',
      gameTitle: 'Chess 10s Blitz',
      opponentOrMode: '10s Bullet Arena vs @GM_Vahid',
      finalScore: '1 – 0',
      playedAt: 'Today · 15:52',
      status: 'Local Queue',
      integrityHash: null,
    },
    {
      id: 'match-val-882',
      gameKey: 'valorant',
      gameTitle: 'VALORANT',
      opponentOrMode: 'Ascendant · Ascent SoloQ',
      finalScore: '13 – 11',
      playedAt: 'Yesterday · 23:10',
      status: 'Local Queue',
      integrityHash: null,
    },
    {
      id: 'match-chess-875',
      gameKey: 'chess',
      gameTitle: 'Chess 10s Blitz',
      opponentOrMode: 'Blitz Qualifier vs @Tactician_7',
      finalScore: '1 – 0',
      playedAt: 'Yesterday · 22:15',
      status: 'Verified',
      integrityHash: 'sha256:c10e...62f9',
      highlightClipId: 'clip-chess-03',
    },
  ],
};
