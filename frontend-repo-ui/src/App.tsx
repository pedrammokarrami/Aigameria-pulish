/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { AnimatePresence, MotionConfig } from 'motion/react';
import { getUiCopy } from './data/i18n';
import { isRtlLanguageCode } from './data/worldLanguages';
import {
  resolveLocalizedText,
  type MediaAnalysisResponse,
  type SkillSummary,
} from './types/api';
import {
  fetchCoachTopic,
  fetchGameDetail,
  fetchGamepad,
  fetchGamesCatalog,
  fetchMediaStream,
  fetchStage,
  postCoachPrompt,
} from './services/aigameriaApi';
import {
  getPresetTimingProfile,
  parseTimingSimulationFromSearch,
  type TimingEndpointKey,
  type TimingPresetId,
  type TimingSimulationProfile,
} from './services/timingSimulator';
import {
  appReducer,
  createInitialAppState,
  selectActiveGame,
  selectActiveSkill,
  selectActiveStageCommand,
  selectAllSkills,
  selectGames,
  selectReadyStageTabs,
  selectVisibleNodes,
  type AvaStatus,
} from './state/appMachine';
import { DiscoveryBoardScreen } from './components/DiscoveryBoardScreen';
import { CoachingRoomScreen } from './components/CoachingRoomScreen';
import { BottomActionDock } from './components/BottomActionDock';
import { AvaHologramDrawer } from './components/AvaHologramDrawer';
import { MediaUploadModal } from './components/MediaUploadModal';
import { TimingSimulatorDrawer } from './components/TimingSimulatorDrawer';

declare global {
  interface Window {
    __AIGAMERIA_TIMING__?: {
      getProfile: () => TimingSimulationProfile;
      setPreset: (presetId: Exclude<TimingPresetId, 'custom'>) => void;
      replay: () => void;
      openPanel: (open?: boolean) => void;
    };
  }
}

export default function App() {
  const initialTiming = useMemo(
    () =>
      parseTimingSimulationFromSearch(
        typeof window !== 'undefined' ? window.location.search : '',
      ),
    [],
  );

  const [state, dispatch] = useReducer(appReducer, undefined, createInitialAppState);
  const [timingProfile, setTimingProfile] = useState<TimingSimulationProfile>(
    initialTiming.profile,
  );
  const [timingPanelOpen, setTimingPanelOpen] = useState<boolean>(
    initialTiming.panelInitiallyOpen,
  );
  const [reloadNonce, setReloadNonce] = useState<number>(0);
  const [avaApiStatus, setAvaApiStatus] = useState<string>('idle');
  const [glbAssetStatus, setGlbAssetStatus] = useState<string>('idle');
  const [coachError, setCoachError] = useState<string | null>(null);
  const [pendingAvaSpeech, setPendingAvaSpeech] = useState<string | null>(null);
  const autoStartHandledRef = useRef(false);

  const isRtl = isRtlLanguageCode(state.language);

  // Alt+T shortcut for Multi-Latency Timing Simulator
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.altKey && event.key.toLowerCase() === 't') {
        event.preventDefault();
        setTimingPanelOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const triggerReplayLoad = useCallback(() => {
    dispatch({ type: 'RESET_API_RESOURCES' });
    setAvaApiStatus('loading');
    setGlbAssetStatus('idle');
    setReloadNonce((n) => n + 1);
  }, []);

  // Expose clean programmatic timing handle for multi-latency QA automation
  useEffect(() => {
    window.__AIGAMERIA_TIMING__ = {
      getProfile: () => timingProfile,
      setPreset: (presetId) => {
        setTimingProfile(getPresetTimingProfile(presetId));
        triggerReplayLoad();
      },
      replay: () => triggerReplayLoad(),
      openPanel: (open = true) => setTimingPanelOpen(open),
    };
    return () => {
      delete window.__AIGAMERIA_TIMING__;
    };
  }, [timingProfile, triggerReplayLoad]);

  // Keep document lang & RTL/LTR direction synchronized with selected language
  useEffect(() => {
    document.documentElement.lang = state.language;
    document.documentElement.dir = isRtl ? 'rtl' : 'ltr';
  }, [state.language, isRtl]);

  // 1. Independent Fetch: GET /api/v1/games
  useEffect(() => {
    const controller = new AbortController();
    dispatch({ type: 'GAMES_LOADING' });

    fetchGamesCatalog(state.language, timingProfile, controller.signal)
      .then((res) => {
        if (controller.signal.aborted) return;
        if (!res || res.games.length === 0) {
          dispatch({ type: 'GAMES_EMPTY' });
        } else {
          dispatch({
            type: 'GAMES_LOADED',
            games: res.games,
            categories: res.categories ?? [],
          });
        }
      })
      .catch((err) => {
        if (controller.signal.aborted) return;
        dispatch({
          type: 'GAMES_ERROR',
          error: err instanceof Error ? err.message : 'Failed to load /api/v1/games.',
        });
      });

    return () => controller.abort();
  }, [state.language, timingProfile, reloadNonce]);

  const games = useMemo(
    () =>
      state.gamesResource.status === 'ready' && state.gamesResource.data
        ? state.gamesResource.data
        : [],
    [state.gamesResource],
  );

  // 2. Independent Fetch: GET /api/v1/games/{id} for returned catalog games on Discovery screen
  useEffect(() => {
    if (state.screen !== 'discovery' || state.mediaAnalyzing) {
      return;
    }
    if (state.gamesResource.status !== 'ready' || games.length === 0) {
      if (state.gamesResource.status === 'empty') {
        dispatch({ type: 'SKILLS_EMPTY' });
      }
      return;
    }

    const controller = new AbortController();
    dispatch({ type: 'SKILLS_LOADING' });

    const targetGames =
      state.selectedGameId !== 'all'
        ? games.filter((g) => g.id === state.selectedGameId)
        : games;

    Promise.allSettled(
      targetGames.map((game) =>
        fetchGameDetail(game.id, state.language, timingProfile, controller.signal, game),
      ),
    )
      .then((results) => {
        if (controller.signal.aborted) return;
        const collected: SkillSummary[] = [];
        for (const outcome of results) {
          if (outcome.status === 'fulfilled' && outcome.value?.skills?.length) {
            collected.push(...outcome.value.skills);
          }
        }
        if (collected.length === 0) {
          dispatch({ type: 'SKILLS_EMPTY' });
        } else {
          dispatch({ type: 'SKILLS_LOADED', skills: collected });
        }
      })
      .catch((err) => {
        if (controller.signal.aborted) return;
        dispatch({
          type: 'SKILLS_ERROR',
          error: err instanceof Error ? err.message : 'Failed to load /api/v1/games/{id}.',
        });
      });

    return () => controller.abort();
  }, [
    state.screen,
    state.mediaAnalyzing,
    state.gamesResource,
    games,
    state.selectedGameId,
    state.language,
    timingProfile,
    reloadNonce,
  ]);

  const allSkills = useMemo(() => selectAllSkills(state), [state]);
  const visibleNodes = useMemo(() => selectVisibleNodes(state), [state]);
  const activeSkill = useMemo(() => selectActiveSkill(state), [state]);
  const activeGame = useMemo(() => selectActiveGame(state), [state]);
  const activeStageCommand = useMemo(() => selectActiveStageCommand(state), [state]);
  const readyStageTabs = useMemo(
    () => selectReadyStageTabs(state, state.activeSkillId),
    [state],
  );

  // Determine the strictly isolated gameId for GET /api/v1/ava/{gameId}
  // Never preload or reuse a previous game's .GLB while TV screen detection is running
  const avaGameId = useMemo(() => {
    if (state.mediaAnalyzing) return null;
    if (activeSkill?.gameId) return activeSkill.gameId;
    if (state.selectedGameId !== 'all') return state.selectedGameId;
    if (games.length > 0) return games[0].id;
    return null;
  }, [state.mediaAnalyzing, activeSkill?.gameId, state.selectedGameId, games]);

  // Support ?autostart=1 once live API skills have arrived
  useEffect(() => {
    if (autoStartHandledRef.current || allSkills.length === 0) return;
    const params = new URLSearchParams(window.location.search);
    if (params.get('autostart') === '1') {
      autoStartHandledRef.current = true;
      const requestedSkill = params.get('skillId') ?? undefined;
      dispatch({ type: 'ENTER_COACHING_ROOM', skillId: requestedSkill });
    }
  }, [allSkills.length]);

  // 3. Independent Parallel Per-Topic Fetches on Coaching Room:
  //    /api/v1/stage/{id}, /api/v1/media/stream/{id}, /api/v1/gamepad/{id}, /api/v1/coach/{id}/topics/{topic}
  const activeSkillId = state.activeSkillId;
  const activeSkillGameId = activeSkill?.gameId ?? state.activeGameId;
  const shouldFetchSkillPayloads = Boolean(
    activeSkillId && activeSkillGameId && state.screen === 'coaching',
  );

  useEffect(() => {
    if (!shouldFetchSkillPayloads || !activeSkillId || !activeSkillGameId) return;
    const controller = new AbortController();

    // 3a. Tactical / Puzzle Stage — GET /api/v1/stage/{gameId}?topic={topicId}
    const existingStage = state.stageBySkill[activeSkillId];
    if (!existingStage || existingStage.status === 'idle') {
      dispatch({ type: 'SKILL_STAGE_LOADING', skillId: activeSkillId });
      fetchStage(activeSkillGameId, activeSkillId, state.language, timingProfile, controller.signal)
        .then((payload) => {
          if (controller.signal.aborted) return;
          dispatch({ type: 'SKILL_STAGE_LOADED', skillId: activeSkillId, payload });
        })
        .catch((err) => {
          if (controller.signal.aborted) return;
          dispatch({
            type: 'SKILL_STAGE_ERROR',
            skillId: activeSkillId,
            error: err instanceof Error ? err.message : 'Failed to load /api/v1/stage/{gameId}.',
          });
        });
    }

    // 3b. Free-Stream Video (8h TTL) — GET /api/v1/media/stream/{gameId}?topic={topicId}
    const existingVideo = state.videoBySkill[activeSkillId];
    if (!existingVideo || existingVideo.status === 'idle') {
      dispatch({ type: 'SKILL_VIDEO_LOADING', skillId: activeSkillId });
      fetchMediaStream(
        activeSkillGameId,
        activeSkillId,
        state.language,
        timingProfile,
        controller.signal,
      )
        .then((payload) => {
          if (controller.signal.aborted) return;
          dispatch({ type: 'SKILL_VIDEO_LOADED', skillId: activeSkillId, payload });
        })
        .catch((err) => {
          if (controller.signal.aborted) return;
          dispatch({
            type: 'SKILL_VIDEO_ERROR',
            skillId: activeSkillId,
            error:
              err instanceof Error
                ? err.message
                : 'Failed to load /api/v1/media/stream/{gameId}.',
          });
        });
    }

    // 3c. Platform Controller Sequences — GET /api/v1/gamepad/{gameId}?topic={topicId}
    const existingCtrl = state.controllerBySkill[activeSkillId];
    if (!existingCtrl || existingCtrl.status === 'idle') {
      dispatch({ type: 'SKILL_CONTROLLER_LOADING', skillId: activeSkillId });
      fetchGamepad(
        activeSkillGameId,
        activeSkillId,
        state.language,
        timingProfile,
        controller.signal,
      )
        .then((payload) => {
          if (controller.signal.aborted) return;
          dispatch({ type: 'SKILL_CONTROLLER_LOADED', skillId: activeSkillId, payload });
        })
        .catch((err) => {
          if (controller.signal.aborted) return;
          dispatch({
            type: 'SKILL_CONTROLLER_ERROR',
            skillId: activeSkillId,
            error:
              err instanceof Error ? err.message : 'Failed to load /api/v1/gamepad/{gameId}.',
          });
        });
    }

    // 3d. Focused Coaching Brief — GET /api/v1/coach/{id}/topics/{topic}
    const existingCoaching = state.coachingBySkill[activeSkillId];
    if (!existingCoaching || existingCoaching.status === 'idle') {
      dispatch({ type: 'SKILL_COACHING_LOADING', skillId: activeSkillId });
      fetchCoachTopic(
        activeSkillGameId,
        activeSkillId,
        state.language,
        timingProfile,
        controller.signal,
      )
        .then((payload) => {
          if (controller.signal.aborted) return;
          dispatch({ type: 'SKILL_COACHING_LOADED', skillId: activeSkillId, payload });
        })
        .catch((err) => {
          if (controller.signal.aborted) return;
          dispatch({
            type: 'SKILL_COACHING_ERROR',
            skillId: activeSkillId,
            error:
              err instanceof Error
                ? err.message
                : 'Failed to load /api/v1/coach/{id}/topics/{topic}.',
          });
        });
    }

    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shouldFetchSkillPayloads, activeSkillId, activeSkillGameId, state.language, timingProfile, reloadNonce]);

  const activeStageRes = activeSkillId ? state.stageBySkill[activeSkillId] : undefined;
  const activeVideoRes = activeSkillId ? state.videoBySkill[activeSkillId] : undefined;
  const activeControllerRes = activeSkillId ? state.controllerBySkill[activeSkillId] : undefined;
  const activeCoachingRes = activeSkillId ? state.coachingBySkill[activeSkillId] : undefined;

  const customVideoKey = activeSkill ? `${activeSkill.gameId}::${activeSkill.id}` : '';
  const activeCustomVideo = customVideoKey ? state.customVideos[customVideoKey] : undefined;

  const resourceStatuses: Record<TimingEndpointKey, string> = useMemo(
    () => ({
      games: state.gamesResource.status,
      gameDetail: state.skillsResource.status,
      stage: activeStageRes?.status ?? 'idle',
      media: activeVideoRes?.status ?? 'idle',
      gamepad: activeControllerRes?.status ?? 'idle',
      coach: activeCoachingRes?.status ?? 'idle',
      ava: avaApiStatus,
      glbLoad: glbAssetStatus,
    }),
    [
      state.gamesResource.status,
      state.skillsResource.status,
      activeStageRes?.status,
      activeVideoRes?.status,
      activeControllerRes?.status,
      activeCoachingRes?.status,
      avaApiStatus,
      glbAssetStatus,
    ],
  );

  const handleSendCoachPrompt = useCallback(
    async (prompt: string) => {
      const trimmed = prompt.trim();
      if (!trimmed || !activeSkill) return;
      const lang = state.language;

      setCoachError(null);
      dispatch({
        type: 'APPEND_COACH_MESSAGE',
        message: {
          id: `u-${Date.now()}`,
          role: 'user',
          text: trimmed,
          gameId: activeSkill.gameId,
          skillId: activeSkill.id,
          timestamp: Date.now(),
        },
      });
      dispatch({ type: 'SET_AVA_STATUS', status: 'thinking' });

      try {
        const data = await postCoachPrompt({
          prompt: trimmed,
          gameId: activeSkill.gameId,
          topicId: activeSkill.id,
          gameName: activeGame
            ? resolveLocalizedText(activeGame.name, lang)
            : activeSkill.gameId,
          skillTitle: resolveLocalizedText(activeSkill.title, lang),
          language: lang,
        });

        dispatch({
          type: 'APPEND_COACH_MESSAGE',
          message: {
            id: `a-${Date.now()}`,
            role: 'ava',
            text: data.reply ?? '',
            gameId: activeSkill.gameId,
            skillId: activeSkill.id,
            timestamp: Date.now(),
          },
        });
        dispatch({ type: 'SET_AVA_STATUS', status: 'speaking' });
        window.setTimeout(() => {
          dispatch({ type: 'SET_AVA_STATUS', status: 'idle' });
        }, 2800);
      } catch (err) {
        const msg = err instanceof Error ? err.message : getUiCopy(lang).coachErrorFallback;
        setCoachError(msg);
        dispatch({ type: 'SET_AVA_STATUS', status: 'idle' });
      }
    },
    [activeSkill, activeGame, state.language],
  );

  const handleCloseAva = useCallback(() => {
    dispatch({ type: 'TOGGLE_AVA', open: false });
  }, []);

  const handleAvaStatusChange = useCallback((status: AvaStatus) => {
    dispatch({ type: 'SET_AVA_STATUS', status });
  }, []);

  const handleHologramReadyChange = useCallback(
    (ready: boolean, nextAvaStatus: string, nextGlbStatus: string) => {
      setAvaApiStatus(nextAvaStatus);
      setGlbAssetStatus(nextGlbStatus);
      dispatch({ type: 'SET_HOLOGRAM_READY', ready });
    },
    [],
  );

  const handleRecordAvaMessages = useCallback(
    (userText: string, avaReply: string) => {
      if (!activeSkill) return;
      const now = Date.now();
      dispatch({
        type: 'APPEND_COACH_MESSAGE',
        message: {
          id: `u-${now}`,
          role: 'user',
          text: userText,
          gameId: activeSkill.gameId,
          skillId: activeSkill.id,
          timestamp: now,
        },
      });
      dispatch({
        type: 'APPEND_COACH_MESSAGE',
        message: {
          id: `a-${now + 1}`,
          role: 'ava',
          text: avaReply,
          gameId: activeSkill.gameId,
          skillId: activeSkill.id,
          timestamp: now + 1,
        },
      });
    },
    [activeSkill],
  );

  const handleLaunchAvaVoiceExplanation = useCallback((text: string) => {
    setPendingAvaSpeech(text);
    dispatch({ type: 'TOGGLE_AVA', open: true });
  }, []);

  const handleAutoSpeakConsumed = useCallback(() => {
    setPendingAvaSpeech(null);
  }, []);

  const handleBeginMediaAnalysis = useCallback(() => {
    setPendingAvaSpeech(null);
    dispatch({ type: 'BEGIN_MEDIA_ANALYSIS' });
  }, []);

  const handleMediaAnalysisResolved = useCallback((result: MediaAnalysisResponse) => {
    dispatch({ type: 'MEDIA_ANALYSIS_RESOLVED', result });
  }, []);

  const handleMediaAnalysisFailed = useCallback(() => {
    dispatch({ type: 'MEDIA_ANALYSIS_FAILED' });
  }, []);

  const sameGameSkills = useMemo(() => {
    if (!activeSkill) return [];
    return allSkills.filter((s) => s.gameId === activeSkill.gameId);
  }, [allSkills, activeSkill]);

  return (
    <MotionConfig reducedMotion="user">
      <div
        dir={isRtl ? 'rtl' : 'ltr'}
        data-screen={state.screen}
        data-language={state.language}
        data-game-id={activeSkill?.gameId ?? 'none'}
        data-timing-preset={timingProfile.presetId}
        className="min-h-screen bg-[#07090D] text-slate-100"
      >
        <AnimatePresence mode="wait">
          {state.screen === 'discovery' || !activeSkill || state.mediaAnalyzing ? (
            <DiscoveryBoardScreen
              key="discovery"
              language={state.language}
              games={games}
              categories={state.categories}
              allSkills={allSkills}
              visibleNodes={visibleNodes}
              gamesReady={state.gamesResource.status === 'ready'}
              skillsReady={state.skillsResource.status === 'ready'}
              selectedGameId={state.selectedGameId}
              selectedCategory={state.selectedCategory}
              searchQuery={state.searchQuery}
              selectedNodeId={state.selectedNodeId}
              onSetLanguage={(language) => dispatch({ type: 'SET_LANGUAGE', language })}
              onSelectGame={(gameId) => dispatch({ type: 'SELECT_GAME', gameId })}
              onSelectCategory={(category) => dispatch({ type: 'SELECT_CATEGORY', category })}
              onSetSearch={(query) => dispatch({ type: 'SET_SEARCH', query })}
              onResetFilters={() => dispatch({ type: 'RESET_FILTERS' })}
              onSelectNode={(nodeId) => dispatch({ type: 'SELECT_BOARD_NODE', nodeId })}
              onEnterCoachingRoom={(skillId, stageTab) =>
                dispatch({ type: 'ENTER_COACHING_ROOM', skillId, stageTab })
              }
            />
          ) : (
            <CoachingRoomScreen
              key="coaching"
              language={state.language}
              skill={activeSkill}
              game={activeGame}
              sameGameSkills={sameGameSkills}
              readyStageTabs={readyStageTabs}
              stageCommand={activeStageCommand}
              baseStageCommand={
                activeStageRes?.status === 'ready'
                  ? (activeStageRes.data?.stageCommand ?? null)
                  : null
              }
              videoPayload={
                activeVideoRes?.status === 'ready' ? activeVideoRes.data : null
              }
              controllerPayload={
                activeControllerRes?.status === 'ready' ? activeControllerRes.data : null
              }
              coachingPayload={
                activeCoachingRes?.status === 'ready' ? activeCoachingRes.data : null
              }
              stageTab={state.stageTab}
              controllerDevice={state.controllerDevice}
              controllerMode={state.controllerMode}
              avaStatus={state.avaStatus}
              hologramReady={state.hologramReady}
              customVideo={activeCustomVideo}
              messages={state.coachMessages}
              coachError={coachError}
              onBack={() => dispatch({ type: 'EXIT_COACHING_ROOM' })}
              onSelectSkill={(skillId) => dispatch({ type: 'ENTER_COACHING_ROOM', skillId })}
              onSetLanguage={(language) => dispatch({ type: 'SET_LANGUAGE', language })}
              onSetStageTab={(tab) => dispatch({ type: 'SET_STAGE_TAB', tab })}
              onSetControllerDevice={(device) =>
                dispatch({ type: 'SET_CONTROLLER_DEVICE', device })
              }
              onSetControllerMode={(mode) => dispatch({ type: 'SET_CONTROLLER_MODE', mode })}
              onCycleWeaponSlot={(slot) =>
                dispatch({
                  type: 'CYCLE_WEAPON_ATTACHMENT',
                  skillId: activeSkill.id,
                  slot,
                })
              }
              onOpenUpload={() => dispatch({ type: 'TOGGLE_UPLOAD_MODAL', open: true })}
              onLaunchAvaVoiceExplanation={handleLaunchAvaVoiceExplanation}
              onSendPrompt={handleSendCoachPrompt}
            />
          )}
        </AnimatePresence>

        {/* Shared Bottom Action Dock (rises from bottom, strictly hidden until API-ready) */}
        <BottomActionDock
          screen={state.screen}
          language={state.language}
          avaStatus={state.avaStatus}
          hasActiveSkill={Boolean(activeSkill)}
          voiceReady={state.hologramReady}
          onPrimaryLeftAction={() => {
            if (state.screen === 'discovery') {
              dispatch({ type: 'ENTER_COACHING_ROOM' });
            } else {
              dispatch({ type: 'EXIT_COACHING_ROOM' });
            }
          }}
          onVoicePress={() => dispatch({ type: 'TOGGLE_AVA', open: true })}
          onUploadPress={() => dispatch({ type: 'TOGGLE_UPLOAD_MODAL', open: true })}
        />

        {/* Style-Matched 3D .GLB Holographic Voice Overlay (/api/v1/ava/{gameId}) */}
        <AvaHologramDrawer
          open={state.avaOpen}
          status={state.avaStatus}
          language={state.language}
          activeGame={activeGame}
          activeSkill={activeSkill}
          avaGameId={avaGameId}
          messages={state.coachMessages}
          timingProfile={timingProfile}
          reloadNonce={reloadNonce}
          autoSpeakText={pendingAvaSpeech}
          onAutoSpeakConsumed={handleAutoSpeakConsumed}
          onClose={handleCloseAva}
          onStatusChange={handleAvaStatusChange}
          onHologramReadyChange={handleHologramReadyChange}
          onRecordMessages={handleRecordAvaMessages}
        />

        {/* Client-Side TV Pre-Pass Scanner (/api/v1/media/analyze) & 8h Free-Stream Link Modal */}
        <MediaUploadModal
          open={state.uploadModalOpen}
          language={state.language}
          activeGame={activeGame}
          activeSkill={activeSkill}
          timingProfile={timingProfile}
          onClose={() => dispatch({ type: 'TOGGLE_UPLOAD_MODAL', open: false })}
          onBeginAnalysis={handleBeginMediaAnalysis}
          onAnalysisResolved={handleMediaAnalysisResolved}
          onAnalysisFailed={handleMediaAnalysisFailed}
          onAttachSource={(source) => {
            if (!activeSkill) return;
            dispatch({
              type: 'ATTACH_VIDEO_SOURCE',
              gameId: activeSkill.gameId,
              skillId: activeSkill.id,
              source,
            });
          }}
        />

        {/* Modular Multi-Latency Timing Simulator Drawer (Alt+T or floating corner button) */}
        <TimingSimulatorDrawer
          open={timingPanelOpen}
          profile={timingProfile}
          resourceStatuses={resourceStatuses}
          onOpen={() => setTimingPanelOpen(true)}
          onClose={() => setTimingPanelOpen(false)}
          onChangeProfile={(next, shouldReplay) => {
            setTimingProfile(next);
            if (shouldReplay) {
              triggerReplayLoad();
            }
          }}
          onReplayLoad={() => {
            setTimingPanelOpen(false);
            triggerReplayLoad();
          }}
        />
      </div>
    </MotionConfig>
  );
}
