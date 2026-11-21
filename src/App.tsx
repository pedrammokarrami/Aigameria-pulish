import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CoachStage3D } from './components/spatial/CoachStage3D';
import { CrossGameSpatialProfilePage } from './components/identity/CrossGameSpatialProfilePage';
import { GameNativeTournamentHub } from './components/spatial/GameNativeTournamentHub';
import { GameSwitcherBar } from './components/spatial/GameSwitcherBar';
import { GtaSocialWorld } from './components/spatial/GtaSocialWorld';
import { LobbyBottomDock } from './components/spatial/LobbyBottomDock';
import {
  RealClipCoachRoom,
  type UploadedCoachMedia,
} from './components/spatial/RealClipCoachRoom';
import { SkillCardList } from './components/spatial/SkillCardList';
import { SkillSearchHeader } from './components/spatial/SkillSearchHeader';
import {
  type TournamentGameId,
  resolveTournamentGameFromLobby,
} from './data/gameTournamentThemes';
import { REALM_CONFIGS } from './data/realmsData';
import {
  type MotionCoachPayload,
  getInstantMotionCoachPayload,
} from './agents/motionCoachAgent';
import type { ProClipAnalyzerResponse } from './agents/proClipAnalyzerAgent';
import {
  buildDynamicGameEntry,
  findCatalogGameById,
  inferRealmFromGameTitle,
} from './services/gameMediaCatalog';
import {
  mapRealmToGameId,
  normalizeCoachGameId,
} from './services/liveMetaSyncService';
import type { MediaManifest, RealmId } from './types/spatial';
import {
  type CoachConsultationTopic,
  REALM_CONSULTATION_TOPICS,
  recomputeTelestratorFromTap,
  resolveCoachTopic,
} from './utils/coachSearchRules';
import {
  type GtaChatMessage,
  type GtaSocialState,
  type GtaSocialTabId,
  INITIAL_GTA_SOCIAL_STATE,
  type LivePredictionMarketId,
  addPostComment,
  appendSocialChatMessage,
  backRivalryFaction,
  buildAutoCrewReply,
  createGtaClub,
  createGtaHighlightClip,
  createGtaSquadLobby,
  createScrimChallenge,
  createSocialPost,
  joinOrLeaveGtaSquad,
  postClubAnnouncement,
  postFanClubMessage,
  registerForWeeklyTournament,
  shareSocialPost,
  submitLiveArenaPrediction,
  toggleClipFireReaction,
  toggleClubMembership,
  toggleCommentLike,
  toggleGamerFriendship,
  togglePostReaction,
} from './utils/gtaSocialRules';
import {
  LOBBY_CATEGORIES_BY_GAME,
  type LobbyGameId,
  type LobbySkillCardItem,
  filterLobbySkills,
  getLobbyGameTab,
  resolveLobbyGameFromAppState,
} from './utils/lobbySkillCatalog';

const STORAGE_REALM_KEY = 'aigameria-coach-realm-v5';
const STORAGE_SOCIAL_KEY = 'aigameria-gta-social-v5';

interface BrowserSpeechRecognition {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  onresult: ((event: { results?: ArrayLike<ArrayLike<{ transcript?: string }>> }) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
}

interface SelectedCoachGame {
  id: string;
  name?: string;
  realm: RealmId;
  steamAppId?: number;
}

export function App() {
  const [activeRealm, setActiveRealm] = useState<RealmId>(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_REALM_KEY) as RealmId | null;
      if (saved && saved in REALM_CONFIGS) return saved;
    } catch {
      // ignore
    }
    return 'sports';
  });

  const [isGtaSocialOpen, setIsGtaSocialOpen] = useState<boolean>(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      return params.get('social') === '1';
    } catch {
      return false;
    }
  });

  const [isTournamentHubOpen, setIsTournamentHubOpen] = useState<boolean>(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      return Boolean(params.get('tournament'));
    } catch {
      return false;
    }
  });

  const [isIdentityProfileOpen, setIsIdentityProfileOpen] = useState<boolean>(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      return params.get('identity') === '1' || params.get('profile') === '1';
    } catch {
      return false;
    }
  });

  const [tournamentInitialGame, setTournamentInitialGame] = useState<TournamentGameId>(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const tParam = params.get('tournament');
      if (tParam && tParam !== '1') {
        return resolveTournamentGameFromLobby(tParam);
      }
    } catch {
      // ignore
    }
    return 'FC27';
  });

  const [socialState, setSocialState] = useState<GtaSocialState>(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_SOCIAL_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as GtaSocialState;
        if (parsed?.gamers && parsed?.rivalries) {
          const validTabs: GtaSocialTabId[] = ['feed', 'chat', 'friends', 'clubs'];
          return {
            ...INITIAL_GTA_SOCIAL_STATE,
            ...parsed,
            activeTab: validTabs.includes(parsed.activeTab) ? parsed.activeTab : 'feed',
            posts:
              Array.isArray(parsed.posts) && parsed.posts.length > 0
                ? parsed.posts
                : INITIAL_GTA_SOCIAL_STATE.posts,
            clubs:
              Array.isArray(parsed.clubs) && parsed.clubs.length > 0
                ? parsed.clubs
                : INITIAL_GTA_SOCIAL_STATE.clubs,
          };
        }
      }
    } catch {
      // ignore
    }
    return {
      ...INITIAL_GTA_SOCIAL_STATE,
      activeTab: 'feed',
    };
  });
  const [isSendingSocialChat, setIsSendingSocialChat] = useState(false);

  const [manifest, setManifest] = useState<MediaManifest>({
    lobbyVideoUrl: null,
    avatarGlbUrl: null,
    coachGlbs: { shooter: null, sports: null, strategy: null, story: null },
  });

  // Active Coach Topic — when non-null, activates the dedicated Real-Gameplay AR Coach screen
  const [activeTopic, setActiveTopic] = useState<CoachConsultationTopic | null>(null);
  const [useVideoBackdrop, setUseVideoBackdrop] = useState<boolean>(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Selected PC Game & Independent Agent 1 (ProClipAnalyzerAgent) + Agent 2 (MotionCoachAgent) state
  const [selectedGame, setSelectedGame] = useState<SelectedCoachGame>(() => ({
    id: mapRealmToGameId('sports'),
    realm: 'sports',
  }));
  const [lobbyGameId, setLobbyGameId] = useState<LobbyGameId>(() =>
    resolveLobbyGameFromAppState(mapRealmToGameId(activeRealm), activeRealm)
  );
  const [lobbyCategoryId, setLobbyCategoryId] = useState<string>('all');
  const [lobbySearchQuery, setLobbySearchQuery] = useState<string>('');
  const [isListeningSearchVoice, setIsListeningSearchVoice] = useState<boolean>(false);

  const [motionPayloadMap, setMotionPayloadMap] = useState<Record<string, MotionCoachPayload>>({});
  const [proClipsMap, setProClipsMap] = useState<Record<string, ProClipAnalyzerResponse>>({});
  const [isLoadingClips, setIsLoadingClips] = useState(false);
  const [isSyncingMotion, setIsSyncingMotion] = useState(false);
  const [clipProblemQuery, setClipProblemQuery] = useState<string>('');

  const [uploadedMedia, setUploadedMedia] = useState<UploadedCoachMedia | null>(null);
  const [isAnalyzingUpload, setIsAnalyzingUpload] = useState<boolean>(false);
  const [isListeningVoice, setIsListeningVoice] = useState<boolean>(false);

  const speakTimerRef = useRef<number | null>(null);
  const recognitionRef = useRef<BrowserSpeechRecognition | null>(null);

  const realmCfg = REALM_CONFIGS[activeRealm];
  const realmTopics = REALM_CONSULTATION_TOPICS[activeRealm];

  const lobbyCategories = LOBBY_CATEGORIES_BY_GAME[lobbyGameId];
  const filteredLobbySkills = useMemo(
    () => filterLobbySkills(lobbyGameId, lobbyCategoryId, lobbySearchQuery),
    [lobbyGameId, lobbyCategoryId, lobbySearchQuery]
  );

  const activeMotionPayload: MotionCoachPayload =
    motionPayloadMap[selectedGame.id] ??
    getInstantMotionCoachPayload({
      gameId: selectedGame.id,
      gameName: selectedGame.name,
      realm: selectedGame.realm,
      steamAppId: selectedGame.steamAppId,
    });

  const clipCacheKey = `${selectedGame.id}:${clipProblemQuery.trim().toLowerCase()}`;
  const activeProClipsData = proClipsMap[clipCacheKey] ?? proClipsMap[`${selectedGame.id}:`] ?? null;

  useEffect(() => {
    document.documentElement.setAttribute('data-realm', activeRealm);
    document.body.dataset.state = isIdentityProfileOpen
      ? 'spatial-identity'
      : isTournamentHubOpen
        ? 'tournament-hub'
        : isGtaSocialOpen
          ? 'gta-social'
          : activeTopic
            ? 'coach-ar'
            : 'playing';
    try {
      window.localStorage.setItem(STORAGE_REALM_KEY, activeRealm);
    } catch {
      // ignore
    }
  }, [activeRealm, isIdentityProfileOpen, isTournamentHubOpen, isGtaSocialOpen, activeTopic]);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_SOCIAL_KEY, JSON.stringify(socialState));
    } catch {
      // ignore
    }
  }, [socialState]);

  useEffect(() => {
    let mounted = true;
    fetch('/api/media/manifest')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (mounted && data) {
          setManifest({
            lobbyVideoUrl: data.lobbyVideoUrl ?? null,
            avatarGlbUrl: data.avatarGlbUrl ?? null,
            coachGlbs: {
              shooter: data.coachGlbs?.shooter ?? null,
              sports: data.coachGlbs?.sports ?? null,
              strategy: data.coachGlbs?.strategy ?? null,
              story: data.coachGlbs?.story ?? null,
            },
          });
        }
      })
      .catch(() => undefined);
    return () => {
      mounted = false;
    };
  }, []);

  // Agent 1 — ProClipAnalyzerAgent (Real YouTube/Reddit Clips + 3 Interactive Scrubber Chapters)
  const fetchProClipsAgent = useCallback(
    (game: SelectedCoachGame, queryText: string, force = false) => {
      setIsLoadingClips(true);
      const qTrim = queryText.trim();
      const params = new URLSearchParams({ gameId: game.id, realm: game.realm });
      if (game.name) params.set('name', game.name);
      if (qTrim) params.set('q', qTrim);
      if (force) params.set('force', '1');

      const key = `${game.id}:${qTrim.toLowerCase()}`;

      fetch(`/api/agents/pro-clips?${params.toString()}`)
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data?.clips) {
            setProClipsMap((prev) => ({
              ...prev,
              [key]: data as ProClipAnalyzerResponse,
            }));
          }
        })
        .catch(() => undefined)
        .finally(() => {
          setIsLoadingClips(false);
        });
    },
    []
  );

  // Agent 2 — MotionCoachAgent (Per-Game Animated Motion Graphic & Synchronized Voice Coaching)
  const fetchMotionCoachAgent = useCallback((game: SelectedCoachGame, force = false) => {
    setIsSyncingMotion(true);
    const params = new URLSearchParams({ gameId: game.id, realm: game.realm });
    if (game.name) params.set('name', game.name);
    if (game.steamAppId) params.set('steamAppId', String(game.steamAppId));
    if (force) params.set('force', '1');

    fetch(`/api/agents/motion-coach?${params.toString()}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.archetype) {
          setMotionPayloadMap((prev) => ({
            ...prev,
            [game.id]: data as MotionCoachPayload,
          }));
        }
      })
      .catch(() => undefined)
      .finally(() => {
        setIsSyncingMotion(false);
      });
  }, []);

  // Trigger both specialized agents independently whenever Coach section opens or game/problem changes
  useEffect(() => {
    if (activeTopic && !isGtaSocialOpen) {
      fetchMotionCoachAgent(selectedGame, false);
      fetchProClipsAgent(selectedGame, clipProblemQuery, false);
    }
  }, [activeTopic, isGtaSocialOpen, selectedGame, clipProblemQuery, fetchMotionCoachAgent, fetchProClipsAgent]);

  const stopSpeaking = useCallback(() => {
    if (speakTimerRef.current) {
      window.clearTimeout(speakTimerRef.current);
      speakTimerRef.current = null;
    }
    try {
      window.speechSynthesis?.cancel();
    } catch {
      // ignore
    }
    setIsSpeaking(false);
  }, []);

  const triggerCoachSpeech = useCallback(
    (text: string) => {
      stopSpeaking();
      setIsSpeaking(true);

      try {
        const AudioCtx =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
        if (AudioCtx) {
          const ctx = new AudioCtx();
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(
            activeRealm === 'shooter' ? 320 : activeRealm === 'sports' ? 440 : 380,
            ctx.currentTime
          );
          gain.gain.setValueAtTime(0.03, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.25);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start();
          osc.stop(ctx.currentTime + 0.28);
          setTimeout(() => ctx.close().catch(() => undefined), 350);
        }
      } catch {
        // ignore
      }

      let usedSpeech = false;
      try {
        if ('speechSynthesis' in window && typeof SpeechSynthesisUtterance !== 'undefined') {
          const utterance = new SpeechSynthesisUtterance(text);
          utterance.pitch = realmCfg.coachVoicePitch;
          utterance.rate = realmCfg.coachVoiceRate;
          utterance.onend = () => setIsSpeaking(false);
          utterance.onerror = () => setIsSpeaking(false);
          window.speechSynthesis.speak(utterance);
          usedSpeech = true;
        }
      } catch {
        usedSpeech = false;
      }

      speakTimerRef.current = window.setTimeout(
        () => setIsSpeaking(false),
        usedSpeech ? 5500 : 3400
      );
    },
    [activeRealm, realmCfg.coachVoicePitch, realmCfg.coachVoiceRate, stopSpeaking]
  );

  useEffect(() => {
    return () => {
      stopSpeaking();
      try {
        recognitionRef.current?.stop();
      } catch {
        // ignore
      }
    };
  }, [stopSpeaking]);

  const handleSelectCoachGame = useCallback(
    (game: { id: string; name?: string; realm?: RealmId; steamAppId?: number }) => {
      stopSpeaking();
      const catalogHit = findCatalogGameById(game.id) || (game.name ? findCatalogGameById(game.name) : undefined);
      const nextRealm: RealmId =
        game.realm ?? catalogHit?.realm ?? inferRealmFromGameTitle(game.name || game.id, activeRealm);
      const normId = catalogHit?.id ?? normalizeCoachGameId(game.id);
      const resolvedName = game.name || catalogHit?.name || game.id;
      const resolvedSteamId = game.steamAppId ?? catalogHit?.steamAppId;

      if (!motionPayloadMap[normId]) {
        const dynEntry = buildDynamicGameEntry({
          id: normId,
          name: resolvedName,
          realm: nextRealm,
          steamAppId: resolvedSteamId,
        });
        setMotionPayloadMap((prev) => ({
          ...prev,
          [normId]: getInstantMotionCoachPayload({
            gameId: dynEntry.id,
            gameName: dynEntry.name,
            realm: dynEntry.realm,
            steamAppId: dynEntry.steamAppId,
          }),
        }));
      }

      setActiveRealm(nextRealm);
      setLobbyGameId(resolveLobbyGameFromAppState(normId, nextRealm));
      setSelectedGame({
        id: normId,
        name: resolvedName,
        realm: nextRealm,
        steamAppId: resolvedSteamId,
      });
      setClipProblemQuery('');
      setUploadedMedia(null);

      const firstTopic = REALM_CONSULTATION_TOPICS[nextRealm][0];
      setActiveTopic(resolveCoachTopic(nextRealm, firstTopic.id));
    },
    [activeRealm, motionPayloadMap, stopSpeaking]
  );

  const launchTopicSearch = useCallback(
    (queryOrTopicId: string, tapX?: number, tapY?: number) => {
      setIsGtaSocialOpen(false);
      const directCatalogMatch = findCatalogGameById(queryOrTopicId);
      const targetRealm = directCatalogMatch?.realm ?? activeRealm;
      const targetGameId =
        directCatalogMatch?.id ??
        (selectedGame.realm === targetRealm ? selectedGame.id : mapRealmToGameId(targetRealm));
      const targetCatalogHit = directCatalogMatch ?? findCatalogGameById(targetGameId);
      const isPresetTopicId = REALM_CONSULTATION_TOPICS[targetRealm].some(
        (t) => t.id === queryOrTopicId
      );

      setActiveRealm(targetRealm);
      setSelectedGame({
        id: targetGameId,
        name: targetCatalogHit?.name ?? selectedGame.name,
        realm: targetRealm,
        steamAppId: targetCatalogHit?.steamAppId ?? selectedGame.steamAppId,
      });
      setClipProblemQuery(directCatalogMatch || isPresetTopicId ? '' : queryOrTopicId.trim());
      setUploadedMedia(null);

      const baseTopic = resolveCoachTopic(targetRealm, queryOrTopicId);
      const initialTopic =
        typeof tapX === 'number' && typeof tapY === 'number'
          ? recomputeTelestratorFromTap(baseTopic, tapX, tapY)
          : baseTopic;
      setActiveTopic(initialTopic);
      if (typeof tapX !== 'number') {
        triggerCoachSpeech(initialTopic.coachVoiceEn);
      }

      const tapParams =
        typeof tapX === 'number' && typeof tapY === 'number'
          ? `&tapX=${encodeURIComponent(Math.round(tapX))}&tapY=${encodeURIComponent(Math.round(tapY))}`
          : '';

      fetch(
        `/api/coach/search?realm=${encodeURIComponent(targetRealm)}&q=${encodeURIComponent(
          queryOrTopicId
        )}${tapParams}`
      )
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data?.topic) {
            setActiveTopic(data.topic as CoachConsultationTopic);
          }
        })
        .catch(() => undefined);
    },
    [activeRealm, selectedGame, triggerCoachSpeech]
  );

  const handleLobbyGameSwitch = useCallback(
    (nextGameId: LobbyGameId) => {
      stopSpeaking();
      setIsGtaSocialOpen(false);
      const tab = getLobbyGameTab(nextGameId);
      const catalogHit = findCatalogGameById(tab.catalogGameId);
      setLobbyGameId(nextGameId);
      setLobbyCategoryId('all');
      setLobbySearchQuery('');
      setActiveRealm(tab.realm);
      setSelectedGame({
        id: tab.catalogGameId,
        name: catalogHit?.name ?? tab.catalogGameName,
        realm: tab.realm,
        steamAppId: catalogHit?.steamAppId,
      });
      setClipProblemQuery('');
    },
    [stopSpeaking]
  );

  const handleSelectLobbySkill = useCallback(
    (skill: LobbySkillCardItem) => {
      setIsGtaSocialOpen(false);
      const tab = getLobbyGameTab(skill.gameId);
      const catalogHit = findCatalogGameById(tab.catalogGameId);
      setActiveRealm(tab.realm);
      setSelectedGame({
        id: tab.catalogGameId,
        name: catalogHit?.name ?? tab.catalogGameName,
        realm: tab.realm,
        steamAppId: catalogHit?.steamAppId,
      });
      setClipProblemQuery(skill.problemQuery);
      setUploadedMedia(null);

      const baseTopic = resolveCoachTopic(tab.realm, skill.topicId);
      const resolvedTopic: CoachConsultationTopic = {
        ...baseTopic,
        titleFa: skill.titleFa,
      };
      setActiveTopic(resolvedTopic);
      triggerCoachSpeech(resolvedTopic.coachVoiceEn);

      fetch(
        `/api/coach/search?realm=${encodeURIComponent(tab.realm)}&q=${encodeURIComponent(
          skill.problemQuery
        )}`
      )
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data?.topic) {
            setActiveTopic({
              ...(data.topic as CoachConsultationTopic),
              titleFa: skill.titleFa,
            });
          }
        })
        .catch(() => undefined);
    },
    [triggerCoachSpeech]
  );

  const handleToggleLobbyVoiceSearch = useCallback(() => {
    if (isListeningSearchVoice) {
      try {
        recognitionRef.current?.stop();
      } catch {
        // ignore
      }
      setIsListeningSearchVoice(false);
      return;
    }

    const SpeechRecCtor =
      (
        window as unknown as {
          SpeechRecognition?: new () => BrowserSpeechRecognition;
          webkitSpeechRecognition?: new () => BrowserSpeechRecognition;
        }
      ).SpeechRecognition ||
      (
        window as unknown as {
          webkitSpeechRecognition?: new () => BrowserSpeechRecognition;
        }
      ).webkitSpeechRecognition;

    if (!SpeechRecCtor) {
      setLobbySearchQuery((prev) => (prev ? '' : 'L1'));
      return;
    }

    try {
      const rec = new SpeechRecCtor();
      rec.lang = 'fa-IR';
      rec.interimResults = false;
      rec.maxAlternatives = 1;
      rec.onresult = (event) => {
        const transcript = event.results?.[0]?.[0]?.transcript?.trim() ?? '';
        setIsListeningSearchVoice(false);
        if (transcript) {
          setLobbySearchQuery(transcript);
        }
      };
      rec.onerror = () => {
        setIsListeningSearchVoice(false);
      };
      rec.onend = () => {
        setIsListeningSearchVoice(false);
      };
      recognitionRef.current = rec;
      setIsListeningSearchVoice(true);
      rec.start();
    } catch {
      setIsListeningSearchVoice(false);
    }
  }, [isListeningSearchVoice]);

  const handleUploadFile = (file: File) => {
    setIsGtaSocialOpen(false);
    const nextGameId = selectedGame.id || mapRealmToGameId(activeRealm);
    const isVideo = file.type.startsWith('video/');
    const reader = new FileReader();
    reader.onload = () => {
      const resultUrl = typeof reader.result === 'string' ? reader.result : undefined;
      if (!resultUrl) return;

      const base = resolveCoachTopic(activeRealm, realmTopics[0].id);
      const uploadedTopic: CoachConsultationTopic = {
        ...base,
        id: `upload-${Date.now()}`,
        titleFa: `صحنه بازی من: ${file.name}`,
        titleEn: `My Gameplay Scene · ${file.name}`,
      };
      setActiveTopic(uploadedTopic);
      setUploadedMedia({
        url: resultUrl,
        isVideo,
        fileName: file.name,
      });
      triggerCoachSpeech(activeMotionPayload.voiceExplanationEn);

      if (!isVideo) {
        setIsAnalyzingUpload(true);
        fetch('/api/adk/consult', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            realm: activeRealm,
            query: file.name,
            imageDataUrl: resultUrl,
          }),
        })
          .then((res) => (res.ok ? res.json() : null))
          .then((data) => {
            if (data?.topic) {
              setActiveTopic(data.topic as CoachConsultationTopic);
              if (data.topic.coachVoiceEn) {
                setMotionPayloadMap((prev) => ({
                  ...prev,
                  [nextGameId]: {
                    ...(prev[nextGameId] ?? activeMotionPayload),
                    voiceExplanationEn: String(data.topic.coachVoiceEn),
                  },
                }));
              }
            }
          })
          .catch(() => undefined)
          .finally(() => {
            setIsAnalyzingUpload(false);
          });
      }
    };
    reader.readAsDataURL(file);
  };

  const handleToggleVoiceQa = () => {
    if (isListeningVoice) {
      try {
        recognitionRef.current?.stop();
      } catch {
        // ignore
      }
      setIsListeningVoice(false);
      return;
    }

    const SpeechRecCtor =
      (
        window as unknown as {
          SpeechRecognition?: new () => BrowserSpeechRecognition;
          webkitSpeechRecognition?: new () => BrowserSpeechRecognition;
        }
      ).SpeechRecognition ||
      (
        window as unknown as {
          webkitSpeechRecognition?: new () => BrowserSpeechRecognition;
        }
      ).webkitSpeechRecognition;

    if (!SpeechRecCtor) {
      triggerCoachSpeech(activeMotionPayload.voiceExplanationEn);
      return;
    }

    try {
      const rec = new SpeechRecCtor();
      rec.lang = 'fa-IR';
      rec.interimResults = false;
      rec.maxAlternatives = 1;
      rec.onresult = (event) => {
        const transcript = event.results?.[0]?.[0]?.transcript?.trim() ?? '';
        setIsListeningVoice(false);
        if (transcript) {
          fetch(
            `/api/coach/search?realm=${encodeURIComponent(activeRealm)}&q=${encodeURIComponent(
              transcript
            )}`
          )
            .then((r) => (r.ok ? r.json() : null))
            .then((data) => {
              triggerCoachSpeech(
                data?.topic?.coachVoiceEn ?? activeMotionPayload.voiceExplanationEn
              );
            })
            .catch(() => triggerCoachSpeech(activeMotionPayload.voiceExplanationEn));
        } else {
          triggerCoachSpeech(activeMotionPayload.voiceExplanationEn);
        }
      };
      rec.onerror = () => {
        setIsListeningVoice(false);
        triggerCoachSpeech(activeMotionPayload.voiceExplanationEn);
      };
      rec.onend = () => {
        setIsListeningVoice(false);
      };
      recognitionRef.current = rec;
      setIsListeningVoice(true);
      rec.start();
    } catch {
      setIsListeningVoice(false);
      triggerCoachSpeech(activeMotionPayload.voiceExplanationEn);
    }
  };

  // GTA Social Club Handlers
  const handleSelectSocialTab = (tab: GtaSocialTabId) => {
    setSocialState((prev) => ({ ...prev, activeTab: tab }));
  };

  const handleToggleFriend = (gamerId: string) => {
    setSocialState((prev) => toggleGamerFriendship(prev, gamerId));
  };

  const handleSendSocialChat = (channelId: string, text: string) => {
    if (!text.trim()) return;
    setSocialState((prev) =>
      appendSocialChatMessage(prev, {
        channelId,
        text,
        isSelf: true,
        accentHex: '#22D3EE',
      })
    );
    setIsSendingSocialChat(true);

    fetch('/api/social/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        channelId,
        text,
        userHandle: socialState.userHandle,
      }),
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.reply) {
          const srvReply = data.reply as GtaChatMessage;
          setSocialState((prev) => ({
            ...prev,
            messages: [...prev.messages, srvReply].slice(-30),
          }));
        } else {
          setSocialState((prev) => {
            const fallbackReply = buildAutoCrewReply(prev, text, channelId);
            return {
              ...prev,
              messages: [...prev.messages, fallbackReply].slice(-30),
            };
          });
        }
      })
      .catch(() => {
        setSocialState((prev) => {
          const fallbackReply = buildAutoCrewReply(prev, text, channelId);
          return {
            ...prev,
            messages: [...prev.messages, fallbackReply].slice(-30),
          };
        });
      })
      .finally(() => {
        setIsSendingSocialChat(false);
      });
  };

  const handleToggleSquadJoin = (squadId: string) => {
    setSocialState((prev) => joinOrLeaveGtaSquad(prev, squadId));
  };

  const handleCreateSquad = (input: {
    titleFa: string;
    gameTitle: string;
    realm: RealmId;
    neededRoleFa: string;
    micRequired?: boolean;
    requiredRank?: string;
  }) => {
    setSocialState((prev) => createGtaSquadLobby(prev, input));
  };

  const handleCreateHighlightClip = (input: {
    gameTag: string;
    captionFa: string;
    thumbnailUrl?: string;
  }) => {
    setSocialState((prev) => createGtaHighlightClip(prev, input));
  };

  const handleToggleClipLike = (clipId: string) => {
    setSocialState((prev) => toggleClipFireReaction(prev, clipId));
  };

  const handleRegisterTournament = (tournamentId: string) => {
    setSocialState((prev) => registerForWeeklyTournament(prev, tournamentId));
  };

  const handleCreateChallenge = (input: {
    mode: '1v1' | '5v5';
    gameTitle: string;
    targetClanOrHandle: string;
    stakeRep: number;
    noteFa: string;
  }) => {
    setSocialState((prev) => createScrimChallenge(prev, input));
  };

  const handleSubmitLivePrediction = (input: {
    market: LivePredictionMarketId;
    contenderId: 'nima' | 'parsa';
    stakeRep: number;
  }) => {
    setSocialState((prev) => submitLiveArenaPrediction(prev, input));
  };

  const handlePostFanClubMessage = (gamerId: string, text: string) => {
    setSocialState((prev) => postFanClubMessage(prev, gamerId, text));
  };

  const handleBackFaction = (
    rivalryId: string,
    factionId: string,
    chantText?: string
  ) => {
    setSocialState((prev) =>
      backRivalryFaction(prev, rivalryId, factionId, chantText)
    );
  };

  const handleTogglePostReaction = (postId: string, reaction: 'like' | 'dislike') => {
    setSocialState((prev) => togglePostReaction(prev, postId, reaction));
  };

  const handleAddPostComment = (postId: string, text: string) => {
    setSocialState((prev) => addPostComment(prev, postId, text));
  };

  const handleToggleCommentLike = (postId: string, commentId: string) => {
    setSocialState((prev) => toggleCommentLike(prev, postId, commentId));
  };

  const handleSharePost = (postId: string, targetChannelId?: string) => {
    setSocialState((prev) => shareSocialPost(prev, postId, targetChannelId));
  };

  const handleCreatePost = (input: {
    captionFa: string;
    gameTag?: string;
    districtFa?: string;
    mediaUrl?: string;
  }) => {
    setSocialState((prev) => createSocialPost(prev, input));
  };

  const handleToggleClubJoin = (clubId: string) => {
    setSocialState((prev) => toggleClubMembership(prev, clubId));
  };

  const handleCreateClub = (input: {
    name: string;
    tag: string;
    districtFa?: string;
    mottoFa?: string;
    gameFocus?: string;
  }) => {
    setSocialState((prev) => createGtaClub(prev, input));
  };

  const handlePostClubAnnouncement = (clubId: string, text: string) => {
    setSocialState((prev) => postClubAnnouncement(prev, clubId, text));
  };

  return (
    <div
      data-realm={activeRealm}
      data-testid="aigameria-spatial-root"
      className="relative w-full h-dvh min-h-dvh overflow-hidden select-none"
      style={{ backgroundColor: 'var(--realm-bg)', color: 'var(--realm-text)' }}
    >
      {/* 0. Cross-Game Spatial Identity & 5 Offline Agents Profile */}
      {isIdentityProfileOpen ? (
        <CrossGameSpatialProfilePage
          onBackToLobby={() => setIsIdentityProfileOpen(false)}
        />
      ) : isTournamentHubOpen ? (
        <GameNativeTournamentHub
          initialGameId={tournamentInitialGame}
          onBack={() => setIsTournamentHubOpen(false)}
        />
      ) : isGtaSocialOpen ? (
        /* 1. Dedicated GTA VI Vice City Social Media & Club World */
        <GtaSocialWorld
          socialState={socialState}
          isSendingChat={isSendingSocialChat}
          onSelectTab={handleSelectSocialTab}
          onToggleFriend={handleToggleFriend}
          onSendChat={handleSendSocialChat}
          onTogglePostReaction={handleTogglePostReaction}
          onAddPostComment={handleAddPostComment}
          onToggleCommentLike={handleToggleCommentLike}
          onSharePost={handleSharePost}
          onCreatePost={handleCreatePost}
          onToggleClubJoin={handleToggleClubJoin}
          onCreateClub={handleCreateClub}
          onPostClubAnnouncement={handlePostClubAnnouncement}
          onToggleSquadJoin={handleToggleSquadJoin}
          onCreateSquad={handleCreateSquad}
          onCreateHighlightClip={handleCreateHighlightClip}
          onToggleClipLike={handleToggleClipLike}
          onRegisterTournament={handleRegisterTournament}
          onCreateChallenge={handleCreateChallenge}
          onSubmitLivePrediction={handleSubmitLivePrediction}
          onPostFanClubMessage={handlePostFanClubMessage}
          onBackFaction={handleBackFaction}
          onExitToCoach={() => setIsGtaSocialOpen(false)}
          onOpenTournamentHub={() => {
            setTournamentInitialGame(resolveTournamentGameFromLobby(lobbyGameId));
            setIsTournamentHubOpen(true);
          }}
          onUploadSceneFile={handleUploadFile}
          onToggleSpeak={() =>
            isSpeaking
              ? stopSpeaking()
              : triggerCoachSpeech(
                  activeTopic?.coachVoiceEn ?? realmTopics[0].coachVoiceEn
                )
          }
          isSpeaking={isSpeaking}
        />
      ) : activeTopic ? (
        /* 2. Unreal 5.8 3D + Dual-Agent (ProClipAnalyzerAgent & MotionCoachAgent) AI Coach Screen */
        <RealClipCoachRoom
          activeRealm={activeRealm}
          motionPayload={activeMotionPayload}
          proClipsData={activeProClipsData}
          isLoadingClips={isLoadingClips}
          isSyncingMotion={isSyncingMotion}
          problemQuery={clipProblemQuery}
          uploadedMedia={uploadedMedia}
          isSpeaking={isSpeaking}
          isListeningVoice={isListeningVoice}
          isAnalyzingUpload={isAnalyzingUpload}
          onSelectGame={handleSelectCoachGame}
          onSubmitProblemQuery={(q) => {
            setClipProblemQuery(q);
            fetchProClipsAgent(selectedGame, q, false);
          }}
          onRefreshAgents={() => {
            fetchMotionCoachAgent(selectedGame, true);
            fetchProClipsAgent(selectedGame, clipProblemQuery, true);
          }}
          onUploadFile={handleUploadFile}
          onClearUploadedMedia={() => setUploadedMedia(null)}
          onToggleSpeak={(voiceText) =>
            isSpeaking ? stopSpeaking() : triggerCoachSpeech(voiceText)
          }
          onToggleVoiceQa={handleToggleVoiceQa}
          onOpenSocialWorld={() => setIsGtaSocialOpen(true)}
          onBackToMenu={() => {
            stopSpeaking();
            setUploadedMedia(null);
            setClipProblemQuery('');
            setActiveTopic(null);
          }}
        />
      ) : (
        /* 3. Clean Frosted-Glass Mobile-First Lobby Over Unreal Engine 5.8 Stadium-Tunnel Backdrop */
        <>
          <CoachStage3D
            realm={activeRealm}
            manifest={manifest}
            isSpeaking={isSpeaking}
            useVideoBackdrop={useVideoBackdrop}
            customBackdropUrl={null}
            customAccentHex={null}
            customSecondaryHex={null}
          />

          <div
            data-testid="lobby-foreground-shell"
            className="relative z-20 max-w-md mx-auto w-full h-dvh min-h-dvh overflow-x-hidden px-4 pt-3 pb-4 flex flex-col justify-between gap-2.5"
          >
            <div className="w-full flex flex-col gap-2.5 shrink-0">
              <GameSwitcherBar
                activeGameId={lobbyGameId}
                onSelectGame={handleLobbyGameSwitch}
                onOpenTournamentHub={() => {
                  setTournamentInitialGame(resolveTournamentGameFromLobby(lobbyGameId));
                  setIsTournamentHubOpen(true);
                }}
                onOpenSocialClub={() => setIsGtaSocialOpen(true)}
                onOpenIdentityProfile={() => setIsIdentityProfileOpen(true)}
              />

              <SkillSearchHeader
                searchQuery={lobbySearchQuery}
                onSearchChange={setLobbySearchQuery}
                categories={lobbyCategories}
                activeCategoryId={lobbyCategoryId}
                onSelectCategory={setLobbyCategoryId}
                isListeningVoice={isListeningSearchVoice}
                onToggleVoiceSearch={handleToggleLobbyVoiceSearch}
              />
            </div>

            <SkillCardList
              skills={filteredLobbySkills}
              onSelectSkill={handleSelectLobbySkill}
              onResetFilters={() => {
                setLobbyCategoryId('all');
                setLobbySearchQuery('');
              }}
            />

            <LobbyBottomDock
              isListeningVoice={isListeningVoice}
              hasVideoBackdrop={Boolean(manifest.lobbyVideoUrl)}
              useVideoBackdrop={useVideoBackdrop}
              onUploadFile={handleUploadFile}
              onToggleVoice={handleToggleVoiceQa}
              onOpenQuickDemo={() => {
                const firstSkill = filteredLobbySkills[0];
                if (firstSkill) {
                  handleSelectLobbySkill(firstSkill);
                } else {
                  launchTopicSearch(realmTopics[0].id, 22, 74);
                }
              }}
              onOpenTournamentHub={() => {
                setTournamentInitialGame(resolveTournamentGameFromLobby(lobbyGameId));
                setIsTournamentHubOpen(true);
              }}
              onOpenSocialClub={() => setIsGtaSocialOpen(true)}
              onOpenIdentityProfile={() => setIsIdentityProfileOpen(true)}
              onToggleBackdropMode={() => setUseVideoBackdrop((v) => !v)}
            />
          </div>
        </>
      )}
    </div>
  );
}

export default App;
