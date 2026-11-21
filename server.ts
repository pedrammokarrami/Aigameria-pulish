import 'dotenv/config';
import express from 'express';
import fs from 'fs';
import path from 'path';
import {
  runCoachSymbioteAgent,
  runHighCourtProsecutorAgent,
  runHighlightCopyAgent,
  runScoreboardVisionAgent,
  runTacticalDrillAgent,
} from './src/agents/internalAgents.ts';
import { INITIAL_ECOSYSTEM_STATE } from './src/data/seedData.ts';
import type {
  ChaosTournament,
  EcosystemState,
  EscrowContract,
  HighCourtCase,
  MatchRecord,
  SupportedGame,
} from './src/types/aigameria.ts';
import {
  advanceEscrowMilestone,
  applyChessRatingsToDNA,
  castJuryVote,
  claimMissionReward,
  computeDeterministicProofId,
  deriveAvatarTier,
  markMissionProgress,
} from './src/utils/aigameriaRules.ts';
import { resolveCoachTopic } from './src/utils/coachSearchRules.ts';
import { runAdkMultiAgentConsultation } from './src/agents/adkCoachSystem.ts';
import {
  COACH_GAME_ORDER,
  fetchRealGameMediaBundle,
  normalizeCoachGameId,
  searchAllPcGames,
  syncLatestGameMeta,
} from './src/services/liveMetaSyncService.ts';
import { discoverRealCoachClips } from './src/services/realClipAgentService.ts';
import { runProClipAnalyzerAgent } from './src/agents/proClipAnalyzerAgent.ts';
import { runMotionCoachAgent } from './src/agents/motionCoachAgent.ts';
import {
  type HologramPersonaContext,
  runHologramLiveAgent,
} from './src/agents/hologramLiveAgent.ts';
import type { RealmId } from './src/types/spatial.ts';
import {
  extractKhinsiderMp3Url,
  MAX_PAYNE_DIRECT_MP3_FALLBACK_URL,
  MAX_PAYNE_KHINSIDER_PAGE_URL,
  parseByteRangeHeader,
} from './src/utils/khinsiderTrackResolver.ts';

const PORT = Number(process.env.PORT) || 3000;
const DATA_DIR = path.resolve(process.cwd(), '.data');
const STATE_FILE = path.join(DATA_DIR, 'aigameria-state.json');
const PUBLIC_MEDIA_DIR = path.resolve(process.cwd(), 'public/media');

function loadState(): EcosystemState {
  try {
    if (fs.existsSync(STATE_FILE)) {
      const raw = fs.readFileSync(STATE_FILE, 'utf-8');
      const parsed = JSON.parse(raw) as EcosystemState;
      if (parsed?.profile?.missions) {
        parsed.profile.missions = parsed.profile.missions.map((ms) => ({
          ...ms,
          claimed: Boolean(ms.claimed),
        }));
      }
      return parsed;
    }
  } catch (err) {
    console.warn('Failed to load persisted state, using seed:', err);
  }
  return structuredClone(INITIAL_ECOSYSTEM_STATE);
}

function saveState(state: EcosystemState): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2), 'utf-8');
  } catch (err) {
    console.warn('Failed to persist state:', err);
  }
}

let state: EcosystemState = loadState();

function resolveImageToBuffer(imageInput: string): { mimeType: string; buffer: Buffer } {
  if (imageInput.startsWith('data:')) {
    const match = imageInput.match(/^data:(image\/[a-zA-Z0-9+.-]+);base64,(.+)$/);
    if (!match) {
      throw new Error('Invalid base64 data URL image payload.');
    }
    return { mimeType: match[1], buffer: Buffer.from(match[2], 'base64') };
  }

  if (imageInput.startsWith('/src/assets/images/')) {
    const safeRel = path.normalize(imageInput).replace(/^(\.\.(\/|\\|$))+/, '').replace(/^\/+/, '');
    const fullPath = path.resolve(process.cwd(), safeRel);
    const allowedRoot = path.resolve(process.cwd(), 'src/assets/images');
    if (!fullPath.startsWith(allowedRoot) || !fs.existsSync(fullPath)) {
      throw new Error('Referenced local image asset was not found.');
    }
    const buffer = fs.readFileSync(fullPath);
    const ext = path.extname(fullPath).toLowerCase();
    const mimeType = ext === '.png' ? 'image/png' : 'image/jpeg';
    return { mimeType, buffer };
  }

  throw new Error('Unsupported image format. Upload a PNG/JPEG or select a sample capture.');
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '12mb' }));

  // Fast health probe route
  app.get('/api/health', (_req, res) => {
    res.json({ ok: true });
  });

  // Serve generated assets and user-dropped /media (.mp4 / .glb) cleanly
  // Skip Vite dev module queries (?import / ?url) so Vite can transform ES asset imports if used
  const srcAssetsStatic = express.static(path.resolve(process.cwd(), 'src/assets'));
  app.use('/src/assets', (req, res, next) => {
    if ('import' in req.query || 'url' in req.query || 'raw' in req.query) {
      return next();
    }
    return srcAssetsStatic(req, res, next);
  });
  app.use('/media', express.static(PUBLIC_MEDIA_DIR));

  // Always serve the latest public/fc27-stadium.mp4 directly (supports byte-range scrubbing & instant replacement)
  const FC27_STADIUM_MP4 = path.resolve(process.cwd(), 'public/fc27-stadium.mp4');
  app.get('/fc27-stadium.mp4', (_req, res, next) => {
    if (!fs.existsSync(FC27_STADIUM_MP4)) {
      return next();
    }
    res.setHeader('Cache-Control', 'no-store');
    return res.sendFile(FC27_STADIUM_MP4);
  });

  // Upload & persist user's own FC 27 turntable .mp4 directly to public/fc27-stadium.mp4
  app.post(
    '/api/media/fc27-stadium',
    express.raw({
      type: ['video/mp4', 'video/quicktime', 'video/webm', 'application/octet-stream'],
      limit: '80mb',
    }),
    (req, res) => {
      try {
        const buf = req.body;
        if (!Buffer.isBuffer(buf) || buf.length < 1024) {
          return res.status(400).json({ error: 'فایل ویدیویی معتبر ارسال نشده است.' });
        }
        fs.mkdirSync(path.dirname(FC27_STADIUM_MP4), { recursive: true });
        fs.writeFileSync(FC27_STADIUM_MP4, buf);
        const distMp4 = path.resolve(process.cwd(), 'dist/fc27-stadium.mp4');
        if (fs.existsSync(path.dirname(distMp4))) {
          fs.writeFileSync(distMp4, buf);
        }
        return res.json({
          ok: true,
          bytes: buf.length,
          src: `/fc27-stadium.mp4?v=${Date.now()}`,
        });
      } catch (err) {
        return res.status(500).json({
          error: err instanceof Error ? err.message : 'ذخیره ویدیو با خطا مواجه شد.',
        });
      }
    }
  );

  // Media presence manifest so client activates /media/lobby-bg.mp4 & coach/avatar .glb files cleanly without 404 console errors
  app.get('/api/media/manifest', (_req, res) => {
    const hasLobbyVideo = fs.existsSync(path.join(PUBLIC_MEDIA_DIR, 'lobby-bg.mp4'));
    const hasAvatarGlb = fs.existsSync(path.join(PUBLIC_MEDIA_DIR, 'avatar.glb'));
    const coachGlbs = {
      shooter: fs.existsSync(path.join(PUBLIC_MEDIA_DIR, 'coach-shooter.glb')) ? '/media/coach-shooter.glb' : null,
      sports: fs.existsSync(path.join(PUBLIC_MEDIA_DIR, 'coach-sports.glb')) ? '/media/coach-sports.glb' : null,
      strategy: fs.existsSync(path.join(PUBLIC_MEDIA_DIR, 'coach-strategy.glb')) ? '/media/coach-strategy.glb' : null,
      story: fs.existsSync(path.join(PUBLIC_MEDIA_DIR, 'coach-story.glb')) ? '/media/coach-story.glb' : null,
    };
    res.json({
      lobbyVideoUrl: hasLobbyVideo ? '/media/lobby-bg.mp4' : null,
      avatarGlbUrl: hasAvatarGlb ? '/media/avatar.glb' : null,
      coachGlbs,
    });
  });

  // 1. Read full ecosystem state
  app.get('/api/state', (_req, res) => {
    res.json(state);
  });

  // 2. Sync live Chess.com or Lichess player profile via real public API
  app.post('/api/telemetry/chess', async (req, res) => {
    try {
      const provider = req.body?.provider === 'lichess' ? 'lichess' : 'chesscom';
      const rawUsername = String(req.body?.username ?? '').trim();
      if (!rawUsername) {
        return res.status(400).json({ error: 'Please provide a valid Chess.com or Lichess username.' });
      }
      const username = encodeURIComponent(rawUsername.toLowerCase());

      let rapidRating = 1500;
      let blitzRating = 1480;
      let displayHandle = rawUsername;
      let recentMatches: MatchRecord[] = [];

      if (provider === 'chesscom') {
        const statsResp = await fetch(`https://api.chess.com/pub/player/${username}/stats`, {
          headers: { 'User-Agent': 'AIGAMERIA/1.0 (https://aigameria.app)' },
        });
        if (!statsResp.ok) {
          return res.status(statsResp.status === 404 ? 404 : 502).json({
            error:
              statsResp.status === 404
                ? `Chess.com player "${rawUsername}" was not found.`
                : `Chess.com API returned status ${statsResp.status}.`,
          });
        }
        const statsData = (await statsResp.json()) as {
          chess_rapid?: { last?: { rating?: number } };
          chess_blitz?: { last?: { rating?: number } };
        };
        rapidRating = statsData.chess_rapid?.last?.rating ?? 1500;
        blitzRating = statsData.chess_blitz?.last?.rating ?? 1480;

        // Fetch latest monthly archives if available
        const archivesResp = await fetch(`https://api.chess.com/pub/player/${username}/games/archives`, {
          headers: { 'User-Agent': 'AIGAMERIA/1.0' },
        });
        if (archivesResp.ok) {
          const archData = (await archivesResp.json()) as { archives?: string[] };
          const latestUrl = archData.archives?.at(-1);
          if (latestUrl) {
            const gamesResp = await fetch(latestUrl, {
              headers: { 'User-Agent': 'AIGAMERIA/1.0' },
            });
            if (gamesResp.ok) {
              const gamesData = (await gamesResp.json()) as {
                games?: Array<{
                  white?: { username?: string; result?: string; rating?: number };
                  black?: { username?: string; result?: string; rating?: number };
                  time_class?: string;
                  end_time?: number;
                }>;
              };
              const lastTwo = (gamesData.games ?? []).slice(-2).reverse();
              recentMatches = lastTwo.map((g, idx) => {
                const isWhite = (g.white?.username ?? '').toLowerCase() === rawUsername.toLowerCase();
                const userSide = isWhite ? g.white : g.black;
                const oppSide = isWhite ? g.black : g.white;
                const result =
                  userSide?.result === 'win'
                    ? 'win'
                    : userSide?.result === 'agreed' ||
                        userSide?.result === 'stalemate' ||
                        userSide?.result === 'repetition'
                      ? 'draw'
                      : 'loss';
                return {
                  id: `chesscom-${Date.now()}-${idx}`,
                  game: 'Chess',
                  opponent: oppSide?.username ?? 'Chess.com Opponent',
                  result,
                  scoreDisplay: result === 'win' ? '1 - 0' : result === 'draw' ? '½ - ½' : '0 - 1',
                  metricsSummary: `${(g.time_class ?? 'rapid').toUpperCase()} · Opp ${oppSide?.rating ?? '?'} · Verified Chess.com API`,
                  verificationStatus: 'verified_api',
                  c2paSigned: true,
                  proofHash: computeDeterministicProofId(`${rawUsername}-${g.end_time ?? idx}`),
                  timestamp: 'Synced via Chess.com API',
                };
              });
            }
          }
        }
      } else {
        const lichessResp = await fetch(`https://lichess.org/api/user/${username}`, {
          headers: { Accept: 'application/json' },
        });
        if (!lichessResp.ok) {
          return res.status(lichessResp.status === 404 ? 404 : 502).json({
            error:
              lichessResp.status === 404
                ? `Lichess player "${rawUsername}" was not found.`
                : `Lichess API returned status ${lichessResp.status}.`,
          });
        }
        const lichessData = (await lichessResp.json()) as {
          username?: string;
          perfs?: { rapid?: { rating?: number }; blitz?: { rating?: number } };
        };
        displayHandle = lichessData.username ?? rawUsername;
        rapidRating = lichessData.perfs?.rapid?.rating ?? 1500;
        blitzRating = lichessData.perfs?.blitz?.rating ?? 1480;
      }

      // Update linked account + Skill DNA
      const nextDNA = applyChessRatingsToDNA(state.profile.skillDNA, rapidRating, blitzRating);
      const updatedAccounts = state.profile.linkedAccounts.map((acc) =>
        acc.game === 'Chess'
          ? {
              ...acc,
              handle: displayHandle,
              platform: provider === 'chesscom' ? 'Chess.com Public API' : 'Lichess Public API',
              ratingValue: `${rapidRating} · ${blitzRating}`,
              lastSyncedAt: 'Just now',
            }
          : acc
      );

      state = {
        ...state,
        profile: {
          ...state.profile,
          skillDNA: nextDNA,
          linkedAccounts: updatedAccounts,
          wallet: {
            ...state.profile.wallet,
            xp: state.profile.wallet.xp + 75,
          },
        },
        matches: [...recentMatches, ...state.matches].slice(0, 14),
      };
      saveState(state);

      res.json({
        syncedHandle: displayHandle,
        provider,
        rapidRating,
        blitzRating,
        state,
      });
    } catch (err) {
      res.status(500).json({
        error: err instanceof Error ? err.message : 'Failed to sync Chess telemetry.',
      });
    }
  });

  // 3. Internal Vision & Integrity Agent: Inspect scoreboard screenshot locally
  app.post('/api/ai/extract-match', (req, res) => {
    try {
      const imageInput = String(req.body?.image ?? '');
      const game = String(req.body?.game ?? 'EA SPORTS FC Pro Clubs') as SupportedGame;
      if (!imageInput) {
        return res.status(400).json({ error: 'Screenshot image is required for scoreboard inspection.' });
      }

      const { mimeType, buffer } = resolveImageToBuffer(imageInput);
      const parsed = runScoreboardVisionAgent({
        buffer,
        mimeType,
        game,
        imageRef: imageInput,
        clubName: state.profile.clubName,
      });

      if (!parsed.tamperingSuspected) {
        state = {
          ...state,
          profile: {
            ...state.profile,
            missions: markMissionProgress(state.profile.missions, 'm-1'),
          },
        };
        saveState(state);
      }

      res.json({ ...parsed, state });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Internal scoreboard agent failed.';
      res.status(500).json({ error: message });
    }
  });

  // 4. Submit match with C2PA proof hash -> goes to Opponent Captain Verification Queue
  app.post('/api/matches', (req, res) => {
    const {
      game = 'EA SPORTS FC Pro Clubs',
      opponent = 'Madrid Titans',
      result = 'win',
      scoreDisplay = '3 - 1',
      metricsSummary = '58% Poss · 89% Pass · 2.4 xG',
      screenshotUrl,
      aiConfidence = 96,
      territoryId,
    } = req.body ?? {};

    if (!String(opponent).trim() || !String(scoreDisplay).trim()) {
      return res.status(400).json({ error: 'Opponent club and scoreline are required.' });
    }

    const newMatch: MatchRecord = {
      id: `match-${Date.now()}`,
      game,
      opponent: String(opponent).trim(),
      result,
      scoreDisplay: String(scoreDisplay).trim(),
      metricsSummary: String(metricsSummary).trim(),
      verificationStatus: 'pending_captain',
      c2paSigned: Boolean(screenshotUrl),
      proofHash: computeDeterministicProofId(`${opponent}-${scoreDisplay}-${Date.now()}`),
      screenshotUrl,
      aiConfidence,
      timestamp: 'Just now · Awaiting Captain',
      territoryId,
    };

    state = {
      ...state,
      profile: {
        ...state.profile,
        missions: markMissionProgress(state.profile.missions, 'm-1'),
      },
      matches: [newMatch, ...state.matches],
    };
    saveState(state);
    res.json({ match: newMatch, state });
  });

  // 5. Opponent Captain Decision: Approve (updates Wallet, Territory, Escrow) OR Dispute (opens High Court Case)
  app.post('/api/matches/:id/captain-decision', (req, res) => {
    const { id } = req.params;
    const decision = req.body?.decision === 'dispute' ? 'dispute' : 'approve';
    const target = state.matches.find((m) => m.id === id);
    if (!target) {
      return res.status(404).json({ error: 'Match record not found.' });
    }

    if (decision === 'approve') {
      const updatedMatches = state.matches.map((m) =>
        m.id === id
          ? { ...m, verificationStatus: 'verified_dual' as const, timestamp: 'Verified · Dual Proof' }
          : m
      );

      let nextWallet = {
        ...state.profile.wallet,
        xp: state.profile.wallet.xp + (target.result === 'win' ? 350 : 120),
        platformPoints: state.profile.wallet.platformPoints + (target.result === 'win' ? 180 : 40),
        reputation: Math.min(1000, state.profile.wallet.reputation + 8),
      };

      // Advance any active escrow if win
      let updatedEscrows = state.escrows;
      if (target.result === 'win') {
        updatedEscrows = state.escrows.map((esc) => {
          if (esc.status === 'active_locked' && esc.game === target.game) {
            const adv = advanceEscrowMilestone(esc, nextWallet);
            nextWallet = adv.wallet;
            return adv.contract;
          }
          return esc;
        });
      }

      // Flip territory if linked & win
      let updatedTerritories = state.territories;
      if (target.territoryId && target.result === 'win') {
        updatedTerritories = state.territories.map((t) =>
          t.id === target.territoryId
            ? {
                ...t,
                controllingClub: state.profile.clubName,
                controllingTag: state.profile.clubTag,
                colorHex: '#38bdf8',
                defenseStrength: Math.min(99, t.defenseStrength + 4),
              }
            : t
        );
      }

      // Complete mission m-1 if territory matched
      const updatedMissions = state.profile.missions.map((ms) => {
        if (ms.id === 'm-1' && target.result === 'win' && !ms.completed) {
          nextWallet.xp += ms.rewardXp;
          nextWallet.platformPoints += ms.rewardPoints;
          return { ...ms, progress: ms.target, completed: true };
        }
        return ms;
      });

      state = {
        ...state,
        profile: {
          ...state.profile,
          avatarTier: deriveAvatarTier(nextWallet.reputation),
          wallet: nextWallet,
          missions: updatedMissions,
        },
        matches: updatedMatches,
        escrows: updatedEscrows,
        territories: updatedTerritories,
      };
      saveState(state);
      return res.json({ status: 'approved', state });
    }

    // Dispute -> escalate to AI-Human High Court
    const updatedMatches = state.matches.map((m) =>
      m.id === id
        ? { ...m, verificationStatus: 'disputed_court' as const, timestamp: 'Escalated to High Court' }
        : m
    );
    const newCase: HighCourtCase = {
      id: `hc-${Date.now().toString().slice(-4)}`,
      title: `${state.profile.clubName} vs. ${target.opponent} — Disputed ${target.scoreDisplay}`,
      game: target.game,
      accusedHandle: state.profile.handle,
      claimantClub: target.opponent,
      summary: `Opponent captain contested submitted ${target.game} scoreline (${target.scoreDisplay}). Proof hash ${target.proofHash} queued for AI Prosecutor & Community Jury.`,
      evidenceImageUrl: target.screenshotUrl,
      c2paStatus: target.c2paSigned ? 'Valid Hardware Sign' : 'Tampered / Missing Manifest',
      votesUphold: 0,
      votesAcquit: 1,
      quorumTarget: 10,
      status: 'open_deliberation',
    };

    state = {
      ...state,
      matches: updatedMatches,
      highCourtCases: [newCase, ...state.highCourtCases],
    };
    saveState(state);
    return res.json({ status: 'disputed', newCase, state });
  });

  // 6. Meta-World Territory Capture Challenge Action
  app.post('/api/territories/:id/capture', (req, res) => {
    const { id } = req.params;
    const territory = state.territories.find((t) => t.id === id);
    if (!territory) {
      return res.status(404).json({ error: 'Territory sector not found.' });
    }

    const updatedTerritories = state.territories.map((t) =>
      t.id === id
        ? {
            ...t,
            controllingClub: state.profile.clubName,
            controllingTag: state.profile.clubTag,
            colorHex: '#38bdf8',
            defenseStrength: Math.min(99, t.defenseStrength + 5),
          }
        : t
    );

    const nextWallet = {
      ...state.profile.wallet,
      xp: state.profile.wallet.xp + 400,
      platformPoints: state.profile.wallet.platformPoints + territory.bonusPointsPerDay,
      reputation: Math.min(1000, state.profile.wallet.reputation + 10),
    };

    const updatedMissions = state.profile.missions.map((ms) =>
      ms.id === 'm-1' && !ms.completed ? { ...ms, progress: ms.target, completed: true } : ms
    );

    state = {
      ...state,
      profile: {
        ...state.profile,
        avatarTier: deriveAvatarTier(nextWallet.reputation),
        wallet: nextWallet,
        missions: updatedMissions,
      },
      territories: updatedTerritories,
    };
    saveState(state);
    res.json({ territory: updatedTerritories.find((t) => t.id === id), state });
  });

  // 7. Create or Advance Smart Scouting Escrow
  app.post('/api/escrow', (req, res) => {
    const { playerHandle, role, game, lockedPoints, winsRequired } = req.body ?? {};
    const points = Number(lockedPoints);
    const wins = Number(winsRequired);
    if (!playerHandle || !Number.isFinite(points) || points <= 0 || !Number.isFinite(wins) || wins < 1) {
      return res.status(400).json({ error: 'Valid player handle, point stake, and win target are required.' });
    }
    if (points > state.profile.wallet.platformPoints) {
      return res.status(400).json({ error: 'Insufficient Platform Points for this Escrow contract.' });
    }

    const contract: EscrowContract = {
      id: `esc-${Date.now().toString().slice(-4)}`,
      playerHandle: String(playerHandle).trim(),
      role: String(role || 'Flex Tactician').trim(),
      clubName: state.profile.clubName,
      game: game || 'EA SPORTS FC Pro Clubs',
      lockedPoints: Math.round(points),
      winsRequired: Math.round(wins),
      winsCompleted: 0,
      status: 'active_locked',
      createdAt: 'Today',
    };

    state = {
      ...state,
      profile: {
        ...state.profile,
        wallet: {
          ...state.profile.wallet,
          platformPoints: state.profile.wallet.platformPoints - Math.round(points),
        },
      },
      escrows: [contract, ...state.escrows],
    };
    saveState(state);
    res.json({ contract, state });
  });

  app.post('/api/escrow/:id/advance', (req, res) => {
    const { id } = req.params;
    const target = state.escrows.find((e) => e.id === id);
    if (!target) {
      return res.status(404).json({ error: 'Escrow contract not found.' });
    }
    let nextWallet = state.profile.wallet;
    let releasedNow = false;
    const updatedEscrows = state.escrows.map((e) => {
      if (e.id === id) {
        const resAdv = advanceEscrowMilestone(e, nextWallet);
        nextWallet = resAdv.wallet;
        releasedNow = resAdv.releasedNow;
        return resAdv.contract;
      }
      return e;
    });

    state = {
      ...state,
      profile: {
        ...state.profile,
        avatarTier: deriveAvatarTier(nextWallet.reputation),
        wallet: nextWallet,
      },
      escrows: updatedEscrows,
    };
    saveState(state);
    res.json({ releasedNow, state });
  });

  // 8. Join Chaos Tournament
  app.post('/api/tournaments/:id/join', (req, res) => {
    const { id } = req.params;
    const updated: ChaosTournament[] = state.tournaments.map((t) =>
      t.id === id && !t.joined
        ? { ...t, joined: true, participantsCount: Math.min(t.maxParticipants, t.participantsCount + 1) }
        : t
    );
    state = { ...state, tournaments: updated };
    saveState(state);
    res.json({ state });
  });

  // 9. Complete 10s Micro-Game Drill -> awards XP & improves Skill DNA
  app.post('/api/drills/complete', (req, res) => {
    const { mode, won } = req.body ?? {};
    const xpGain = won ? 180 : 60;
    const ptsGain = won ? 90 : 20;
    const dna = { ...state.profile.skillDNA };
    if (won) {
      if (mode === '2d-chess') {
        dna.trapAnticipation = Math.min(99, dna.trapAnticipation + 1);
        dna.endgameComposure = Math.min(99, dna.endgameComposure + 1);
      } else {
        dna.spatialPassing = Math.min(99, dna.spatialPassing + 1);
        dna.tempoControl = Math.min(99, dna.tempoControl + 1);
      }
    }

    const nextWallet = {
      ...state.profile.wallet,
      xp: state.profile.wallet.xp + xpGain,
      platformPoints: state.profile.wallet.platformPoints + ptsGain,
    };

    const updatedMissions = markMissionProgress(state.profile.missions, 'm-2');

    state = {
      ...state,
      profile: {
        ...state.profile,
        skillDNA: dna,
        wallet: nextWallet,
        missions: updatedMissions,
      },
    };
    saveState(state);
    res.json({ xpGain, ptsGain, state });
  });

  // 10. Internal Tactical Micro-Game Generator Agent
  app.post('/api/ai/microgame', (req, res) => {
    try {
      const mode = req.body?.mode === '3d-pitch' ? '3d-pitch' : '2d-chess';
      const currentDrillId = req.body?.currentDrillId ? String(req.body.currentDrillId) : undefined;
      const drill = runTacticalDrillAgent({ mode, state, currentDrillId });
      res.json({ drill });
    } catch (err) {
      res.status(500).json({
        error: err instanceof Error ? err.message : 'Failed to generate tactical micro-game.',
      });
    }
  });

  // 11. High Court: Internal Forensic Prosecutor Agent + Community Jury Vote
  app.post('/api/ai/prosecutor', (req, res) => {
    try {
      const caseId = String(req.body?.caseId ?? '');
      const courtCase = state.highCourtCases.find((c) => c.id === caseId);
      if (!courtCase) {
        return res.status(404).json({ error: 'High Court case not found.' });
      }

      let evidenceBuffer: Buffer | null = null;
      let evidenceMimeType: string | undefined;
      if (courtCase.evidenceImageUrl) {
        try {
          const resolved = resolveImageToBuffer(courtCase.evidenceImageUrl);
          evidenceBuffer = resolved.buffer;
          evidenceMimeType = resolved.mimeType;
        } catch {
          evidenceBuffer = null;
        }
      }

      const brief = runHighCourtProsecutorAgent({
        courtCase,
        state,
        evidenceBuffer,
        evidenceMimeType,
      });

      state = {
        ...state,
        highCourtCases: state.highCourtCases.map((c) =>
          c.id === caseId ? { ...c, aiProsecutorBrief: brief } : c
        ),
      };
      saveState(state);
      res.json({ brief, state });
    } catch (err) {
      res.status(500).json({
        error: err instanceof Error ? err.message : 'Internal forensic check failed.',
      });
    }
  });

  app.post('/api/high-court/:id/vote', (req, res) => {
    const { id } = req.params;
    const decision = req.body?.decision === 'acquit' ? 'acquit' : 'uphold';
    const target = state.highCourtCases.find((c) => c.id === id);
    if (!target) {
      return res.status(404).json({ error: 'Case not found.' });
    }

    const updatedCase = castJuryVote(target, decision);
    let nextWallet = state.profile.wallet;
    let updatedMissions = state.profile.missions;

    // Mark Juror participation mission ready to claim
    if (!target.userVoted) {
      nextWallet = {
        ...nextWallet,
        reputation: Math.min(1000, nextWallet.reputation + 10),
      };
      updatedMissions = markMissionProgress(state.profile.missions, 'm-3');
    }

    state = {
      ...state,
      profile: {
        ...state.profile,
        avatarTier: deriveAvatarTier(nextWallet.reputation),
        wallet: nextWallet,
        missions: updatedMissions,
      },
      highCourtCases: state.highCourtCases.map((c) => (c.id === id ? updatedCase : c)),
    };
    saveState(state);
    res.json({ courtCase: updatedCase, state });
  });

  // 11b. Claim completed daily mission reward and persist to ledger
  app.post('/api/missions/:id/claim', (req, res) => {
    const { id } = req.params;
    const claimed = claimMissionReward(state.profile.missions, state.profile.wallet, id);
    if (!claimed.claimedNow) {
      return res.status(400).json({ error: 'Mission is not ready to claim or has already been claimed.' });
    }

    state = {
      ...state,
      profile: {
        ...state.profile,
        missions: claimed.missions,
        wallet: claimed.wallet,
      },
    };
    saveState(state);
    res.json({
      mission: claimed.missions.find((m) => m.id === id),
      state,
    });
  });

  // 12. Internal AI Coach Symbiote Agent
  app.post('/api/ai/symbiote', (req, res) => {
    try {
      const message = String(req.body?.message ?? '').trim();
      const activeSection = String(req.body?.activeSection ?? 'gamer-id');
      if (!message) {
        return res.status(400).json({ error: 'Message is required.' });
      }
      const reply = runCoachSymbioteAgent({ message, activeSection, state });
      res.json({ reply });
    } catch (err) {
      res.status(500).json({
        error: err instanceof Error ? err.message : 'Internal coach response failed.',
      });
    }
  });

  // 13. Internal Highlight Copywriter Agent
  app.post('/api/ai/highlight-copy', (req, res) => {
    try {
      const matchId = String(req.body?.matchId ?? state.matches[0]?.id ?? '');
      const match = state.matches.find((m) => m.id === matchId) ?? state.matches[0];
      res.json(runHighlightCopyAgent({ match, clubName: state.profile.clubName }));
    } catch (err) {
      res.status(500).json({
        error: err instanceof Error ? err.message : 'Failed to generate highlight copy.',
      });
    }
  });

  // 14. Google ADK (adk.dev) Multi-Agent Coach Consultation + Live Web Media Search
  app.get('/api/coach/search', async (req, res) => {
    try {
      const rawRealm = String(req.query.realm ?? 'shooter');
      const realm: RealmId =
        rawRealm === 'sports' || rawRealm === 'strategy' || rawRealm === 'story'
          ? rawRealm
          : 'shooter';
      const q = String(req.query.q ?? '').trim();
      const tapX = req.query.tapX !== undefined ? Number(req.query.tapX) : undefined;
      const tapY = req.query.tapY !== undefined ? Number(req.query.tapY) : undefined;

      const topic = await runAdkMultiAgentConsultation({
        realm,
        query: q,
        tapX: Number.isFinite(tapX) ? tapX : undefined,
        tapY: Number.isFinite(tapY) ? tapY : undefined,
      });

      // Perform a fast live public web image search via Wikimedia Commons API (with 1500ms timeout & resilient local fallback)
      try {
        const searchTerm = encodeURIComponent(topic.searchQuery);
        const wikiUrl = `https://en.wikipedia.org/w/api.php?action=query&generator=search&gsrsearch=${searchTerm}&gsrlimit=3&prop=pageimages&piprop=thumbnail&pithumbsize=960&format=json&origin=*`;
        const resp = await fetch(wikiUrl, {
          headers: { 'User-Agent': 'AIGAMERIA-ADK-Coach/3.0' },
          signal: AbortSignal.timeout(1500),
        });
        if (resp.ok) {
          const data = (await resp.json()) as {
            query?: {
              pages?: Record<
                string,
                { pageid?: number; title?: string; thumbnail?: { source?: string } }
              >;
            };
          };
          const pages = Object.values(data.query?.pages ?? {});
          const webImages = pages
            .filter((p) => {
              const src = (p.thumbnail?.source ?? '').toLowerCase();
              return Boolean(src) && !src.includes('.pdf') && !src.includes('.svg');
            })
            .map((p, idx) => ({
              id: `web-img-${p.pageid ?? idx}`,
              title: `${topic.titleFa} · ${p.title ?? 'Web Tactical Capture'}`,
              imageUrl: String(p.thumbnail?.source),
              fallbackUrl: topic.images[0]?.fallbackUrl ?? '/src/assets/images/coach_arena_backdrop_1794943636026.jpg',
              sourceLabel: 'Internet Search · Live Web',
            }));
          if (webImages.length > 0) {
            topic.images = [...topic.images.slice(0, 1), ...webImages, ...topic.images.slice(1)].slice(0, 3);
          }
        }
      } catch {
        // Resilient fallback to pre-verified local tactical images
      }

      res.json({ topic });
    } catch (err) {
      res.status(500).json({
        error: err instanceof Error ? err.message : 'ADK Coach search failed.',
      });
    }
  });

  // 15. POST /api/adk/consult — Multimodal ADK Agent Pipeline for Uploaded Gameplay Screenshots & Deep-Dive Questions
  app.post('/api/adk/consult', async (req, res) => {
    try {
      const rawRealm = String(req.body?.realm ?? 'shooter');
      const realm: RealmId =
        rawRealm === 'sports' || rawRealm === 'strategy' || rawRealm === 'story'
          ? rawRealm
          : 'shooter';
      const query = String(req.body?.query ?? '').trim();
      const tapX = req.body?.tapX !== undefined ? Number(req.body.tapX) : undefined;
      const tapY = req.body?.tapY !== undefined ? Number(req.body.tapY) : undefined;
      const rawDataUrl = typeof req.body?.imageDataUrl === 'string' ? req.body.imageDataUrl : '';

      let imageBase64: string | undefined;
      let imageMimeType: string | undefined;
      if (rawDataUrl.startsWith('data:image/')) {
        const match = rawDataUrl.match(/^data:(image\/[a-zA-Z0-9+.-]+);base64,(.+)$/);
        if (match) {
          imageMimeType = match[1];
          imageBase64 = match[2];
        }
      }

      const topic = await runAdkMultiAgentConsultation({
        realm,
        query,
        tapX: Number.isFinite(tapX) ? tapX : undefined,
        tapY: Number.isFinite(tapY) ? tapY : undefined,
        imageBase64,
        imageMimeType,
      });

      if (rawDataUrl.startsWith('data:image/')) {
        topic.images = [
          {
            id: `up-adk-${Date.now()}`,
            title: query || 'صحنه بازی آپلود شده شما',
            imageUrl: rawDataUrl,
            fallbackUrl: topic.images[0]?.fallbackUrl ?? '/src/assets/images/coach_arena_backdrop_1794943636026.jpg',
            sourceLabel: 'ADK Vision Agent · Analyzed',
          },
          ...topic.images,
        ].slice(0, 3);
      }

      res.json({ topic });
    } catch (err) {
      res.status(500).json({
        error: err instanceof Error ? err.message : 'ADK multi-agent consultation failed.',
      });
    }
  });

  // 16. POST /api/social/chat — Rockstar / GTA VI Social Club Crew Radio & Direct Message Reply Agent
  app.post('/api/social/chat', (req, res) => {
    try {
      const text = String(req.body?.text ?? '').trim();
      const channelId = String(req.body?.channelId ?? 'global-vice');
      const userHandle = String(req.body?.userHandle ?? 'Vortex_IR');
      if (!text) {
        return res.status(400).json({ error: 'Message text is required.' });
      }
      const lower = text.toLowerCase();
      let senderHandle = 'parsa_vice27';
      let senderTag = 'FC27';
      let replyText = `ایول ${userHandle}! پیامتو توی رادیو کلاب وایس‌سیتی گرفتم. امشب اسکواد پرو کلابز و CS2 هر دو فعاله، آماده‌ای؟`;

      if (channelId === 'dm-g-2' || lower.includes('cs') || lower.includes('شوتر') || lower.includes('ام')) {
        senderHandle = 'nima_headshot';
        senderTag = 'SAS';
        replyText = `حله ${userHandle}! من توی لابی Mirage منتظرم. میکروفون روشنه، کانتر-استریف ۶۵ میلی‌ثانیه یادت نره!`;
      } else if (channelId === 'dm-g-3' || lower.includes('dota') || lower.includes('روشان') || lower.includes('شطرنج')) {
        senderHandle = 'artin_roshan';
        senderTag = 'DOTA';
        replyText = `ایول! تایمینگ اسموک روشان رو ست کردم. بیا توی اسکواد تا درفت رو ببندیم.`;
      } else if (channelId === 'dm-g-4' || lower.includes('gta') || lower.includes('هایست') || lower.includes('وایس')) {
        senderHandle = 'tara_outlaw';
        senderTag = 'VICE';
        replyText = `هایست پنت‌هاوس Ocean Drive آماده‌ست ${userHandle}! ماشین فرار رو آوردم جلوی کلاب، بپر بالا!`;
      }

      const now = new Date();
      const hh = String(now.getHours()).padStart(2, '0');
      const mm = String(now.getMinutes()).padStart(2, '0');

      res.json({
        reply: {
          id: `srv-reply-${Date.now()}`,
          channelId,
          senderHandle,
          senderTag,
          text: replyText,
          timestamp: `${hh}:${mm}`,
          isSelf: false,
          accentHex: '#FF2E93',
        },
      });
    } catch (err) {
      res.status(500).json({
        error: err instanceof Error ? err.message : 'Social chat agent failed.',
      });
    }
  });

  // 17. Self-Updating Live Game Meta & Real Gameplay Media Routes (All PC Games across 4 Genres)
  app.get('/api/meta/live', async (req, res) => {
    try {
      const gameId = normalizeCoachGameId(req.query.gameId);
      const force = req.query.force === '1' || req.query.force === 'true';
      const gameName = typeof req.query.name === 'string' ? req.query.name.trim() : undefined;
      const rawRealm = String(req.query.realm ?? '');
      const realm: RealmId | undefined =
        rawRealm === 'sports' || rawRealm === 'shooter' || rawRealm === 'strategy' || rawRealm === 'story'
          ? rawRealm
          : undefined;
      const steamAppId = req.query.steamAppId ? Number(req.query.steamAppId) : undefined;
      const meta = await syncLatestGameMeta(gameId, {
        force,
        geminiApiKey: process.env.GEMINI_API_KEY,
        gameName,
        realm,
        steamAppId: Number.isFinite(steamAppId) ? steamAppId : undefined,
      });
      res.json({ meta });
    } catch (err) {
      res.status(500).json({
        error: err instanceof Error ? err.message : 'Failed to load live game meta.',
      });
    }
  });

  app.post('/api/meta/sync', async (req, res) => {
    try {
      const gameId = normalizeCoachGameId(req.body?.gameId);
      const gameName = typeof req.body?.gameName === 'string' ? req.body.gameName.trim() : undefined;
      const rawRealm = String(req.body?.realm ?? '');
      const realm: RealmId | undefined =
        rawRealm === 'sports' || rawRealm === 'shooter' || rawRealm === 'strategy' || rawRealm === 'story'
          ? rawRealm
          : undefined;
      const steamAppId = req.body?.steamAppId ? Number(req.body.steamAppId) : undefined;
      const meta = await syncLatestGameMeta(gameId, {
        force: true,
        geminiApiKey: process.env.GEMINI_API_KEY,
        gameName,
        realm,
        steamAppId: Number.isFinite(steamAppId) ? steamAppId : undefined,
      });
      res.json({ meta });
    } catch (err) {
      res.status(500).json({
        error: err instanceof Error ? err.message : 'Failed to sync live game meta.',
      });
    }
  });

  // 18. Search ALL PC Games (Curated 4-Genre Catalog + Live Steam Store Search)
  app.get('/api/games/search', async (req, res) => {
    try {
      const q = String(req.query.q ?? '').trim();
      const rawRealm = String(req.query.realm ?? '');
      const realm: RealmId | undefined =
        rawRealm === 'sports' || rawRealm === 'shooter' || rawRealm === 'strategy' || rawRealm === 'story'
          ? rawRealm
          : undefined;
      const games = await searchAllPcGames(q, { realm });
      res.json({ games });
    } catch (err) {
      res.status(500).json({
        error: err instanceof Error ? err.message : 'Failed to search PC games.',
      });
    }
  });

  // 19. Fetch Real Official Gameplay Videos (HLS/MP4) & 1080p Gameplay Screenshots for ANY PC Game
  app.get('/api/games/media', async (req, res) => {
    try {
      const gameId = normalizeCoachGameId(req.query.gameId);
      const gameName = typeof req.query.name === 'string' ? req.query.name.trim() : undefined;
      const rawRealm = String(req.query.realm ?? '');
      const realm: RealmId | undefined =
        rawRealm === 'sports' || rawRealm === 'shooter' || rawRealm === 'strategy' || rawRealm === 'story'
          ? rawRealm
          : undefined;
      const steamAppId = req.query.steamAppId ? Number(req.query.steamAppId) : undefined;
      const media = await fetchRealGameMediaBundle({
        gameId,
        gameName,
        realm,
        steamAppId: Number.isFinite(steamAppId) ? steamAppId : undefined,
      });
      res.json({ media });
    } catch (err) {
      res.status(500).json({
        error: err instanceof Error ? err.message : 'Failed to fetch real game media.',
      });
    }
  });

  // 20. Automatic Real YouTube Pro/Influencer & Reddit Gameplay Clip Discovery Agent
  app.get('/api/games/clips', async (req, res) => {
    try {
      const gameId = normalizeCoachGameId(req.query.gameId);
      const gameName = typeof req.query.name === 'string' ? req.query.name.trim() : undefined;
      const userQuery = typeof req.query.q === 'string' ? req.query.q.trim() : undefined;
      const force = req.query.force === '1' || req.query.force === 'true';
      const rawRealm = String(req.query.realm ?? '');
      const realm: RealmId | undefined =
        rawRealm === 'sports' || rawRealm === 'shooter' || rawRealm === 'strategy' || rawRealm === 'story'
          ? rawRealm
          : undefined;

      const discovery = await discoverRealCoachClips(
        {
          gameId,
          gameName,
          realm,
          userQuery,
        },
        { force }
      );
      res.json({ discovery });
    } catch (err) {
      res.status(500).json({
        error: err instanceof Error ? err.message : 'Failed to discover real gameplay clips.',
      });
    }
  });

  // 21. Agent 1 — ProClipAnalyzerAgent (Real YouTube/Reddit Clips + 3 Scrubber Chapters)
  app.get('/api/agents/pro-clips', async (req, res) => {
    try {
      const gameId = normalizeCoachGameId(req.query.gameId);
      const gameName = typeof req.query.name === 'string' ? req.query.name.trim() : undefined;
      const userQuery = typeof req.query.q === 'string' ? req.query.q.trim() : undefined;
      const force = req.query.force === '1' || req.query.force === 'true';
      const rawRealm = String(req.query.realm ?? '');
      const realm: RealmId | undefined =
        rawRealm === 'sports' || rawRealm === 'shooter' || rawRealm === 'strategy' || rawRealm === 'story'
          ? rawRealm
          : undefined;

      const result = await runProClipAnalyzerAgent(
        { gameId, gameName, realm, userQuery },
        { force }
      );
      res.json(result);
    } catch (err) {
      res.status(500).json({
        error: err instanceof Error ? err.message : 'ProClipAnalyzerAgent failed.',
      });
    }
  });

  // 22. Agent 2 — MotionCoachAgent (Per-Game Animated Motion Graphics & Live Patch Coaching)
  app.get('/api/agents/motion-coach', async (req, res) => {
    try {
      const gameId = normalizeCoachGameId(req.query.gameId);
      const gameName = typeof req.query.name === 'string' ? req.query.name.trim() : undefined;
      const force = req.query.force === '1' || req.query.force === 'true';
      const steamAppId = req.query.steamAppId ? Number(req.query.steamAppId) : undefined;
      const rawRealm = String(req.query.realm ?? '');
      const realm: RealmId | undefined =
        rawRealm === 'sports' || rawRealm === 'shooter' || rawRealm === 'strategy' || rawRealm === 'story'
          ? rawRealm
          : undefined;

      const payload = await runMotionCoachAgent(
        {
          gameId,
          gameName,
          realm,
          steamAppId: Number.isFinite(steamAppId) ? steamAppId : undefined,
        },
        {
          force,
          geminiApiKey: process.env.GEMINI_API_KEY,
        }
      );
      res.json(payload);
    } catch (err) {
      res.status(500).json({
        error: err instanceof Error ? err.message : 'MotionCoachAgent failed.',
      });
    }
  });

  // 23. Live Point-Cloud Hologram AI Agent (Gemini Flash low-latency + Emotion/Gesture + TTS WAV)
  app.post('/api/hologram/interact', async (req, res) => {
    try {
      const body = req.body as {
        message?: string;
        personaContext?: Partial<HologramPersonaContext>;
        includeVoice?: boolean;
      };
      const message = String(body?.message ?? '').trim();
      if (!message) {
        return res.status(400).json({ error: 'Message is required.' });
      }
      const p = body?.personaContext ?? {};
      const personaContext: HologramPersonaContext = {
        displayName: String(p.displayName ?? 'Kian Rostami'),
        handle: String(p.handle ?? '@kian.spatial'),
        unifiedId: String(p.unifiedId ?? 'AGM-8841-IR'),
        activeGameTitle: String(p.activeGameTitle ?? 'All Linked Titles'),
        tierLabel: String(p.tierLabel ?? 'Apex Tier II'),
        winRatePct: Number.isFinite(Number(p.winRatePct)) ? Number(p.winRatePct) : 68.4,
        tacticalConsistencyPct: Number.isFinite(Number(p.tacticalConsistencyPct))
          ? Number(p.tacticalConsistencyPct)
          : 91.2,
        competitiveRating: Number.isFinite(Number(p.competitiveRating))
          ? Number(p.competitiveRating)
          : 2480,
        verifiedMatchesCount: Number.isFinite(Number(p.verifiedMatchesCount))
          ? Number(p.verifiedMatchesCount)
          : 142,
        queuedMatchesCount: Number.isFinite(Number(p.queuedMatchesCount))
          ? Number(p.queuedMatchesCount)
          : 2,
        openDisputesCount: Number.isFinite(Number(p.openDisputesCount))
          ? Number(p.openDisputesCount)
          : 1,
        gender: p.gender === 'female' ? 'female' : 'male',
        age: Number.isFinite(Number(p.age)) ? Math.max(8, Math.min(99, Math.round(Number(p.age)))) : 36,
        matchedCharacterName: typeof p.matchedCharacterName === 'string' ? p.matchedCharacterName : undefined,
        matchedCharacterFranchise:
          typeof p.matchedCharacterFranchise === 'string' ? p.matchedCharacterFranchise : undefined,
        matchedCharacterArchetype:
          typeof p.matchedCharacterArchetype === 'string' ? p.matchedCharacterArchetype : undefined,
      };

      const result = await runHologramLiveAgent({
        message,
        personaContext,
        includeVoice: Boolean(body?.includeVoice),
      });
      return res.json(result);
    } catch (err) {
      const statusCode =
        typeof (err as { statusCode?: number })?.statusCode === 'number'
          ? (err as { statusCode: number }).statusCode
          : 500;
      return res.status(statusCode).json({
        error: err instanceof Error ? err.message : 'Hologram AI Agent request failed.',
        code: (err as { code?: string })?.code ?? 'HOLOGRAM_AGENT_ERROR',
      });
    }
  });

  // 24. Max Payne (2001) — "23. Max Theme Short.mp3" same-origin streaming endpoint (resolved from khinsider)
  let cachedMaxPayneMp3: Buffer | null = null;
  let pendingMaxPayneFetch: Promise<Buffer> | null = null;

  const downloadMp3FromUrl = async (url: string): Promise<Buffer> => {
    const resp = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; AIGAMERIA-Audio/1.0)',
        Accept: 'audio/mpeg,audio/*;q=0.9,*/*;q=0.8',
      },
      signal: AbortSignal.timeout(15000),
    });
    if (!resp.ok) {
      throw new Error(`MP3 fetch failed with HTTP ${resp.status}`);
    }
    const contentType = (resp.headers.get('content-type') ?? '').toLowerCase();
    if (contentType.includes('text/html')) {
      throw new Error('Upstream returned HTML instead of audio/mpeg.');
    }
    const arrayBuf = await resp.arrayBuffer();
    const buf = Buffer.from(arrayBuf);
    if (buf.length < 16_384) {
      throw new Error('Downloaded MP3 payload is unexpectedly small.');
    }
    return buf;
  };

  const fetchMaxPayneThemeBuffer = async (): Promise<Buffer> => {
    if (cachedMaxPayneMp3) return cachedMaxPayneMp3;
    if (pendingMaxPayneFetch) return pendingMaxPayneFetch;

    pendingMaxPayneFetch = (async () => {
      let resolvedUrl: string | null = null;
      try {
        const pageResp = await fetch(MAX_PAYNE_KHINSIDER_PAGE_URL, {
          headers: { 'User-Agent': 'Mozilla/5.0 (compatible; AIGAMERIA-Audio/1.0)' },
          signal: AbortSignal.timeout(10000),
        });
        if (pageResp.ok) {
          const html = await pageResp.text();
          resolvedUrl = extractKhinsiderMp3Url(html);
        }
      } catch {
        resolvedUrl = null;
      }

      const candidates = [resolvedUrl, MAX_PAYNE_DIRECT_MP3_FALLBACK_URL].filter(
        (u, idx, arr): u is string => Boolean(u) && arr.indexOf(u) === idx
      );

      let lastErr: unknown = null;
      for (const candidateUrl of candidates) {
        try {
          const buf = await downloadMp3FromUrl(candidateUrl);
          cachedMaxPayneMp3 = buf;
          return buf;
        } catch (err) {
          lastErr = err;
        }
      }
      throw lastErr instanceof Error ? lastErr : new Error('Failed to load Max Payne soundtrack.');
    })().finally(() => {
      pendingMaxPayneFetch = null;
    });

    return pendingMaxPayneFetch;
  };

  app.get('/api/audio/max-payne-theme', async (req, res) => {
    try {
      const mp3Buffer = await fetchMaxPayneThemeBuffer();
      const totalBytes = mp3Buffer.length;
      const slice = parseByteRangeHeader(req.headers.range, totalBytes);

      if (!slice) {
        res.setHeader('Content-Range', `bytes */${totalBytes}`);
        return res.status(416).end();
      }

      res.setHeader('Content-Type', 'audio/mpeg');
      res.setHeader('Accept-Ranges', 'bytes');
      res.setHeader('Cache-Control', 'public, max-age=3600');
      res.setHeader('Content-Length', String(slice.length));

      if (slice.isPartial) {
        res.status(206);
        res.setHeader('Content-Range', `bytes ${slice.start}-${slice.end}/${totalBytes}`);
      } else {
        res.status(200);
      }

      return res.end(mp3Buffer.subarray(slice.start, slice.end + 1));
    } catch (err) {
      return res.status(502).json({
        error: err instanceof Error ? err.message : 'Unable to stream Max Payne soundtrack.',
      });
    }
  });

  // Bind port 3000 immediately so health probes never time out during Vite cold start
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`AIGAMERIA server running at http://localhost:${PORT}`);
    // Pre-warm the Max Payne theme buffer so clicking Account Settings plays instantaneously
    setTimeout(() => {
      fetchMaxPayneThemeBuffer().catch(() => undefined);
    }, 1200);
    // Non-blocking periodic background meta sync every 30 minutes
    const refreshAllGames = () => {
      for (const gid of COACH_GAME_ORDER) {
        syncLatestGameMeta(gid).catch(() => undefined);
      }
    };
    setTimeout(refreshAllGames, 4000);
    setInterval(refreshAllGames, 30 * 60 * 1000).unref();
  });

  // Vite dev middleware vs static production serving
  if (process.env.NODE_ENV !== 'production') {
    // HMR and WebSockets are disabled in AI Studio; serve a clean zero-WebSocket
    // /@vite/client module so Vite 8 never opens a failing wss://...:24678 socket.
    const NO_WS_VITE_CLIENT_JS = `
const sheetsMap = new Map();
const linkSheetsMap = new Map();
if ("document" in globalThis) {
  document.querySelectorAll("style[data-vite-dev-id]").forEach((el) => {
    sheetsMap.set(el.getAttribute("data-vite-dev-id"), el);
  });
  document.querySelectorAll('link[rel="stylesheet"][data-vite-dev-id]').forEach((el) => {
    linkSheetsMap.set(el.getAttribute("data-vite-dev-id"), el);
  });
}
let lastInsertedStyle;
export function updateStyle(id, content) {
  if (linkSheetsMap.has(id)) return;
  let style = sheetsMap.get(id);
  if (!style) {
    style = document.createElement("style");
    style.setAttribute("type", "text/css");
    style.setAttribute("data-vite-dev-id", id);
    style.textContent = content;
    if (!lastInsertedStyle) {
      document.head.appendChild(style);
      setTimeout(() => {
        lastInsertedStyle = undefined;
      }, 0);
    } else {
      lastInsertedStyle.insertAdjacentElement("afterend", style);
    }
    lastInsertedStyle = style;
  } else if (style.textContent !== content) {
    style.textContent = content;
  }
  sheetsMap.set(id, style);
}
export function removeStyle(id) {
  if (linkSheetsMap.has(id)) {
    document
      .querySelectorAll(\`link[rel="stylesheet"][data-vite-dev-id="\${CSS.escape(id)}"]\`)
      .forEach((el) => el.remove());
    linkSheetsMap.delete(id);
  }
  const style = sheetsMap.get(id);
  if (style) {
    document.head.removeChild(style);
    sheetsMap.delete(id);
  }
}
export function createHotContext() {
  const noop = () => {};
  return {
    data: {},
    accept: noop,
    acceptDeps: noop,
    acceptExports: noop,
    dispose: noop,
    prune: noop,
    decline: noop,
    invalidate: noop,
    on: noop,
    off: noop,
    send: noop,
  };
}
export function injectQuery(url, queryToInject) {
  if (url[0] !== "." && url[0] !== "/") return url;
  const pathname = url.replace(/[?#].*$/, "");
  const { search, hash } = new URL(url, "http://vite.dev");
  return \`\${pathname}?\${queryToInject}\${search ? "&" + search.slice(1) : ""}\${hash || ""}\`;
}
export class ErrorOverlay {
  close() {}
}
`;

    app.get('/@vite/client', (_req, res) => {
      res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
      res.setHeader('Cache-Control', 'no-cache');
      return res.status(200).send(NO_WS_VITE_CLIENT_JS);
    });

    const vitePromise = import('vite').then(({ createServer: createViteServer }) =>
      createViteServer({
        server: {
          middlewareMode: true,
          hmr: false,
          ws: false,
          watch: null,
        },
        appType: 'spa',
      })
    );
    vitePromise.catch((err) => {
      console.error('Failed to initialize Vite dev middleware:', err);
    });
    app.use(async (req, res, next) => {
      try {
        const vite = await vitePromise;
        vite.middlewares(req, res, next);
      } catch (err) {
        next(err);
      }
    });
  } else {
    const distDir = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }
}

startServer();
