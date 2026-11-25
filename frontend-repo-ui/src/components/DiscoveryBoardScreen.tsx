import { useMemo } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  ArrowRight,
  ChevronRight,
  Gamepad2,
  Map as MapIcon,
  Play,
  RotateCcw,
  Search,
  X,
} from 'lucide-react';
import {
  resolveLocalizedText,
  type CategoryDefinition,
  type GameCategory,
  type GameDefinition,
  type GameId,
  type Language,
  type SkillSummary,
} from '../types/api';
import { getUiCopy } from '../data/i18n';
import { formatTimecode } from '../modules/projector/utils/media';
import type { StageTabId } from '../state/appMachine';
import {
  ENTER_FROM_BOTTOM,
  ENTER_FROM_RIGHT,
  ENTER_FROM_TOP,
  REVEAL_BEHIND_MENU,
  SCREEN_VARIANTS,
  SPRINGS,
} from '../motion/transitions';
import { WorldLanguagePicker } from './WorldLanguagePicker';

interface DiscoveryBoardScreenProps {
  language: Language;
  games: GameDefinition[];
  categories: CategoryDefinition[];
  allSkills: SkillSummary[];
  visibleNodes: SkillSummary[];
  gamesReady: boolean;
  skillsReady: boolean;
  selectedGameId: GameId | 'all';
  selectedCategory: GameCategory | 'all';
  searchQuery: string;
  selectedNodeId: string | null;
  onSetLanguage: (lang: Language) => void;
  onSelectGame: (gameId: GameId | 'all') => void;
  onSelectCategory: (category: GameCategory | 'all') => void;
  onSetSearch: (query: string) => void;
  onResetFilters: () => void;
  onSelectNode: (nodeId: string | null) => void;
  onEnterCoachingRoom: (skillId: string, stageTab?: StageTabId) => void;
}

export function DiscoveryBoardScreen({
  language,
  games,
  categories,
  allSkills,
  visibleNodes,
  gamesReady,
  skillsReady,
  selectedGameId,
  selectedCategory,
  searchQuery,
  selectedNodeId,
  onSetLanguage,
  onSelectGame,
  onSelectCategory,
  onSetSearch,
  onResetFilters,
  onSelectNode,
  onEnterCoachingRoom,
}: DiscoveryBoardScreenProps) {
  const copy = getUiCopy(language);

  const gamesById = useMemo(
    () => new Map<GameId, GameDefinition>(games.map((g) => [g.id, g])),
    [games],
  );
  const skillsById = useMemo(
    () => new Map<string, SkillSummary>(allSkills.map((s) => [s.id, s])),
    [allSkills],
  );
  const visibleIds = useMemo(() => new Set(visibleNodes.map((n) => n.id)), [visibleNodes]);

  const selectedGame =
    selectedGameId === 'all' ? null : (gamesById.get(selectedGameId) ?? null);

  const selectedNode = useMemo(() => {
    if (!selectedNodeId) return null;
    return visibleNodes.find((n) => n.id === selectedNodeId) ?? null;
  }, [selectedNodeId, visibleNodes]);

  const activePathwayIds = useMemo(() => {
    const ids = new Set<string>();
    if (!selectedNode) return ids;
    ids.add(selectedNode.id);
    selectedNode.connectedTo.forEach((id) => ids.add(id));
    allSkills.forEach((node) => {
      if (node.connectedTo.includes(selectedNode.id)) ids.add(node.id);
    });
    return ids;
  }, [selectedNode, allSkills]);

  const edges = useMemo(() => {
    const seen = new Set<string>();
    const list: Array<{ from: SkillSummary; to: SkillSummary; key: string }> = [];
    for (const node of allSkills) {
      for (const targetId of node.connectedTo) {
        const pairKey = [node.id, targetId].sort().join('--');
        if (seen.has(pairKey)) continue;
        seen.add(pairKey);
        const target = skillsById.get(targetId);
        if (target) {
          list.push({ from: node, to: target, key: pairKey });
        }
      }
    }
    return list;
  }, [allSkills, skillsById]);

  const showGameMenuRow = gamesReady && games.length > 0;
  const showBoardSection = skillsReady && allSkills.length > 0;

  return (
    <motion.div
      key="screen-discovery"
      variants={SCREEN_VARIANTS}
      initial="initial"
      animate="animate"
      exit="exit"
      className="flex min-h-screen flex-col bg-[#07090D] pb-24"
    >
      {/* Top Command Strip — clean production header: Brand + Search (when API ready) + Searchable World Language Picker */}
      <motion.header
        layout
        transition={SPRINGS.layout}
        variants={ENTER_FROM_TOP}
        initial="initial"
        animate="animate"
        className="sticky top-0 z-20 border-b border-white/10 bg-[#090C12]/90 backdrop-blur-xl safe-top"
      >
        <div className="mx-auto flex max-w-7xl flex-col gap-2.5 px-4 py-2.5 sm:px-6">
          {/* Row 1: Wordmark + Search (revealed once skills ready) + Searchable World Language Picker */}
          <div className="flex items-center justify-between gap-3">
            <h1 className="font-display text-lg font-bold tracking-tight text-white whitespace-nowrap shrink-0">
              {copy.brand}
            </h1>

            {/* Desktop Search Input — hidden until skills API resolves */}
            <AnimatePresence>
              {showBoardSection && (
                <motion.div
                  key="desktop-search"
                  variants={ENTER_FROM_TOP}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  className="relative hidden flex-1 max-w-md md:block"
                >
                  <Search className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="search"
                    value={searchQuery}
                    onChange={(e) => onSetSearch(e.target.value)}
                    placeholder={copy.searchPlaceholder}
                    aria-label={copy.searchPlaceholder}
                    className="min-h-[40px] w-full rounded-xl border border-white/10 bg-white/[0.04] py-1.5 pr-9 pl-10 text-sm text-white placeholder:text-slate-500 focus:border-sky-400 focus:outline-none"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => onSetSearch('')}
                      aria-label={copy.clearSearch}
                      className="absolute top-1/2 right-2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-lg text-slate-400 hover:bg-white/10 hover:text-white"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Searchable All World Languages Picker */}
            <WorldLanguagePicker
              language={language}
              onSelectLanguage={onSetLanguage}
            />
          </div>

          {/* Mobile Search Input — hidden until skills API resolves */}
          <AnimatePresence>
            {showBoardSection && (
              <motion.div
                key="mobile-search"
                variants={REVEAL_BEHIND_MENU}
                initial="initial"
                animate="animate"
                exit="exit"
                className="relative md:hidden"
              >
                <Search className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => onSetSearch(e.target.value)}
                  placeholder={copy.searchPlaceholder}
                  aria-label={copy.searchPlaceholder}
                  className="min-h-[42px] w-full rounded-xl border border-white/10 bg-white/[0.04] py-1.5 pr-9 pl-10 text-sm text-white placeholder:text-slate-500 focus:border-sky-400 focus:outline-none"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => onSetSearch('')}
                    aria-label={copy.clearSearch}
                    className="absolute top-1/2 right-2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-lg text-slate-400 hover:bg-white/10 hover:text-white"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Row 2: API-Driven Game Selector + Category Filter Controls
              Strictly hidden until games API arrives, then emerges smoothly from behind Row 1 */}
          <AnimatePresence>
            {showGameMenuRow && (
              <motion.div
                key="api-games-menu-row"
                layout
                variants={REVEAL_BEHIND_MENU}
                initial="initial"
                animate="animate"
                exit="exit"
                data-testid="api-game-selector-row"
                className="flex flex-wrap items-center justify-between gap-2"
              >
                <div
                  role="group"
                  aria-label="Game selector"
                  className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5"
                >
                  <motion.button
                    layout
                    type="button"
                    onClick={() => onSelectGame('all')}
                    aria-pressed={selectedGameId === 'all'}
                    className={`relative min-h-[38px] rounded-xl px-3 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                      selectedGameId === 'all'
                        ? 'text-slate-950'
                        : 'text-slate-300 hover:bg-white/6 hover:text-white'
                    }`}
                  >
                    {selectedGameId === 'all' && (
                      <motion.span
                        layoutId="active-game-pill"
                        transition={SPRINGS.snappy}
                        className="absolute inset-0 rounded-xl bg-sky-400"
                      />
                    )}
                    <span className="relative z-10">{copy.allGames}</span>
                  </motion.button>

                  {games.map((game, idx) => {
                    const active = selectedGameId === game.id;
                    return (
                      <motion.button
                        key={game.id}
                        layout
                        type="button"
                        initial={{ opacity: 0, y: -10, scale: 0.94 }}
                        animate={{
                          opacity: 1,
                          y: 0,
                          scale: 1,
                          transition: { ...SPRINGS.layout, delay: Math.min(idx * 0.035, 0.2) },
                        }}
                        onClick={() => onSelectGame(game.id)}
                        aria-pressed={active}
                        className={`relative min-h-[38px] rounded-xl px-3 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                          active
                            ? 'text-slate-950'
                            : 'text-slate-300 hover:bg-white/6 hover:text-white'
                        }`}
                      >
                        {active && (
                          <motion.span
                            layoutId="active-game-pill"
                            transition={SPRINGS.snappy}
                            className="absolute inset-0 rounded-xl bg-sky-400"
                          />
                        )}
                        <span className="relative z-10">{game.shortName}</span>
                      </motion.button>
                    );
                  })}
                </div>

                {categories.length > 0 && (
                  <motion.div
                    layout
                    role="group"
                    aria-label="Category filter"
                    className="flex items-center gap-1 rounded-xl border border-white/10 bg-white/[0.03] p-0.5"
                  >
                    <button
                      type="button"
                      onClick={() => onSelectCategory('all')}
                      aria-pressed={selectedCategory === 'all'}
                      className={`relative min-h-[34px] rounded-lg px-2.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                        selectedCategory === 'all'
                          ? 'text-white'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {selectedCategory === 'all' && (
                        <motion.span
                          layoutId="active-category-pill"
                          transition={SPRINGS.snappy}
                          className="absolute inset-0 rounded-lg bg-white/12"
                        />
                      )}
                      <span className="relative z-10">{copy.allCategories}</span>
                    </button>

                    {categories.map((cat) => {
                      const active = selectedCategory === cat.id;
                      return (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => onSelectCategory(cat.id)}
                          aria-pressed={active}
                          className={`relative min-h-[34px] rounded-lg px-2.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                            active ? 'text-white' : 'text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          {active && (
                            <motion.span
                              layoutId="active-category-pill"
                              transition={SPRINGS.snappy}
                              className="absolute inset-0 rounded-lg bg-white/12"
                            />
                          )}
                          <span className="relative z-10">
                            {resolveLocalizedText(cat.label, language)}
                          </span>
                        </button>
                      );
                    })}
                  </motion.div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.header>

      {/* Main Tactical Board + Inline Expandable Coaching Piece
          Strictly hidden until API skills arrive — zero fake placeholders */}
      <motion.main
        layout
        transition={SPRINGS.layout}
        className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-5 px-4 pt-5 sm:px-6 lg:grid lg:grid-cols-[1.45fr_0.95fr] lg:items-start"
      >
        <AnimatePresence mode="popLayout">
          {showBoardSection && (
            <motion.section
              key="tactical-board-surface"
              layout
              variants={ENTER_FROM_BOTTOM}
              initial="initial"
              animate="animate"
              exit="exit"
              aria-label={copy.gameBoardAria}
              className="relative flex flex-col overflow-hidden rounded-3xl border border-white/10 bg-[#0B0E15] obsidian-grid shadow-2xl"
            >
              <div className="flex items-center justify-between gap-3 border-b border-white/8 px-5 py-3.5">
                <div className="min-w-0">
                  <h2 className="font-display text-sm font-semibold text-white">
                    {selectedGame
                      ? resolveLocalizedText(selectedGame.name, language)
                      : copy.allGames}
                  </h2>
                  <p className="truncate text-xs text-slate-400">
                    {selectedGame
                      ? resolveLocalizedText(selectedGame.tagline, language)
                      : copy.boardHint}
                  </p>
                </div>
                <span className="font-mono text-xs tabular-nums text-slate-400 whitespace-nowrap shrink-0">
                  {visibleNodes.length} / {allSkills.length}
                </span>
              </div>

              {visibleNodes.length === 0 ? (
                <div className="flex min-h-[380px] flex-col items-center justify-center gap-3 px-6 py-12 text-center">
                  <h3 className="font-display text-base font-semibold text-white">
                    {copy.emptyBoardTitle}
                  </h3>
                  <p className="max-w-sm text-xs leading-relaxed text-slate-400">
                    {copy.emptyBoardBody}
                  </p>
                  <button
                    type="button"
                    onClick={onResetFilters}
                    className="mt-1 flex min-h-[44px] items-center gap-2 rounded-xl bg-sky-500 px-4 text-xs font-semibold text-slate-950 transition-colors hover:bg-sky-400"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    <span>{copy.resetFilters}</span>
                  </button>
                </div>
              ) : (
                <div data-testid="tactical-discovery-board" className="relative w-full">
                  <div className="grid grid-cols-2 gap-2.5 p-3.5 sm:hidden">
                    {visibleNodes.map((node, idx) => {
                      const isSelected = selectedNode?.id === node.id;
                      const isConnected = activePathwayIds.has(node.id) && !isSelected;
                      const game = gamesById.get(node.gameId);
                      const nodeTitle = resolveLocalizedText(node.title, language);

                      return (
                        <motion.button
                          key={node.id}
                          layout
                          type="button"
                          onClick={() => onSelectNode(node.id)}
                          aria-label={`${game?.shortName ?? node.gameId} ${nodeTitle}`}
                          aria-pressed={isSelected}
                          initial={{ opacity: 0, y: 14, scale: 0.96 }}
                          animate={{
                            opacity: 1,
                            y: 0,
                            scale: 1,
                            transition: { ...SPRINGS.sheet, delay: Math.min(idx * 0.03, 0.18) },
                          }}
                          whileTap={{ scale: 0.96 }}
                          className={`flex min-h-[68px] flex-col justify-between rounded-2xl border p-3 text-start transition-colors focus-visible:outline-2 focus-visible:outline-sky-400 ${
                            isSelected
                              ? 'border-sky-300/80 bg-[#141C2B] shadow-[0_0_22px_rgba(56,189,248,0.24)]'
                              : isConnected
                                ? 'border-sky-400/35 bg-[#121824]'
                                : 'border-white/10 bg-[#0F141E]/90 hover:border-white/20'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-1.5 font-mono text-[10px] tabular-nums">
                            <span style={{ color: game?.accentHex ?? '#38BDF8' }}>
                              {game?.shortName ?? node.gameId.toUpperCase()}
                            </span>
                            <span className="text-slate-400">{node.code}</span>
                          </div>
                          <div className="mt-1.5 line-clamp-2 font-display text-xs font-semibold leading-snug text-white">
                            {nodeTitle}
                          </div>
                        </motion.button>
                      );
                    })}
                  </div>

                  <div className="relative hidden h-[470px] w-full sm:block lg:h-[520px]">
                    <svg
                      viewBox="0 0 100 100"
                      preserveAspectRatio="none"
                      aria-hidden="true"
                      className="pointer-events-none absolute inset-0 h-full w-full"
                    >
                      <defs>
                        <filter id="conduitGlow" x="-20%" y="-20%" width="140%" height="140%">
                          <feGaussianBlur stdDeviation="0.9" result="blur" />
                          <feMerge>
                            <feMergeNode in="blur" />
                            <feMergeNode in="SourceGraphic" />
                          </feMerge>
                        </filter>
                      </defs>
                      {edges.map(({ from, to, key }) => {
                        const bothVisible = visibleIds.has(from.id) && visibleIds.has(to.id);
                        const isHighlighted =
                          selectedNode !== null &&
                          (from.id === selectedNode.id || to.id === selectedNode.id) &&
                          bothVisible;

                        const selectedAccent =
                          (selectedNode ? gamesById.get(selectedNode.gameId)?.accentHex : null) ??
                          '#38BDF8';
                        const midX = (from.boardPos.x + to.boardPos.x) / 2;
                        const midY = (from.boardPos.y + to.boardPos.y) / 2 - 4;
                        const d = `M ${from.boardPos.x} ${from.boardPos.y} Q ${midX} ${midY} ${to.boardPos.x} ${to.boardPos.y}`;

                        return (
                          <g key={key}>
                            <path
                              d={d}
                              fill="none"
                              stroke={
                                isHighlighted
                                  ? selectedAccent
                                  : bothVisible
                                    ? 'rgba(148, 163, 184, 0.25)'
                                    : 'rgba(148, 163, 184, 0.08)'
                              }
                              strokeWidth={isHighlighted ? 0.65 : 0.35}
                              strokeDasharray={isHighlighted ? 'none' : '1.4 1.2'}
                              filter={isHighlighted ? 'url(#conduitGlow)' : undefined}
                            />
                          </g>
                        );
                      })}
                    </svg>

                    {allSkills.map((node, idx) => {
                      const isVisible = visibleIds.has(node.id);
                      const isSelected = selectedNode?.id === node.id;
                      const isConnected = activePathwayIds.has(node.id) && !isSelected;
                      const game = gamesById.get(node.gameId);
                      const nodeTitle = resolveLocalizedText(node.title, language);

                      return (
                        <motion.button
                          key={node.id}
                          type="button"
                          disabled={!isVisible}
                          onClick={() => onSelectNode(node.id)}
                          aria-label={`${game?.shortName ?? node.gameId} ${nodeTitle}`}
                          aria-pressed={isSelected}
                          initial={{ opacity: 0, scale: 0.88, y: 8 }}
                          animate={{
                            opacity: isVisible ? 1 : 0.14,
                            scale: isSelected ? 1.06 : isVisible ? 1 : 0.9,
                            y: 0,
                            transition: {
                              ...SPRINGS.snappy,
                              delay: Math.min(idx * 0.03, 0.22),
                            },
                          }}
                          whileHover={isVisible ? { scale: isSelected ? 1.08 : 1.04 } : undefined}
                          whileTap={isVisible ? { scale: 0.96 } : undefined}
                          className={`group absolute -translate-x-1/2 -translate-y-1/2 rounded-2xl border px-3.5 py-2.5 text-start backdrop-blur-md transition-colors focus-visible:outline-2 focus-visible:outline-sky-400 ${
                            isSelected
                              ? 'z-20 border-sky-300/80 bg-[#141C2B]/95 shadow-[0_0_28px_rgba(56,189,248,0.28)]'
                              : isConnected
                                ? 'z-10 border-white/25 bg-[#121824]/92'
                                : 'z-10 border-white/10 bg-[#0F141E]/88 hover:border-white/25'
                          }`}
                          style={{
                            left: `${node.boardPos.x}%`,
                            top: `${node.boardPos.y}%`,
                            width: '176px',
                            minHeight: '54px',
                          }}
                        >
                          <div className="flex items-center justify-between gap-2 text-[10px] font-mono tabular-nums">
                            <span style={{ color: game?.accentHex ?? '#38BDF8' }}>
                              {game?.shortName ?? node.gameId.toUpperCase()}
                            </span>
                            <span className="text-slate-400">{node.code}</span>
                          </div>
                          <div className="mt-0.5 truncate font-display text-xs font-semibold text-white">
                            {nodeTitle}
                          </div>
                        </motion.button>
                      );
                    })}
                  </div>
                </div>
              )}
            </motion.section>
          )}
        </AnimatePresence>

        <AnimatePresence mode="popLayout">
          {selectedNode && (
            <motion.aside
              key={`inline-skill-card-${selectedNode.id}`}
              layout
              layoutId="active-skill-shell"
              variants={ENTER_FROM_RIGHT}
              initial="initial"
              animate="animate"
              exit="exit"
              data-testid="inline-skill-preview"
              data-skill-id={selectedNode.id}
              className="flex flex-col justify-between rounded-3xl border border-white/14 bg-[#111621] p-5 shadow-2xl brushed-titanium"
            >
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
                      <span
                        className="font-semibold"
                        style={{
                          color: gamesById.get(selectedNode.gameId)?.accentHex ?? '#38BDF8',
                        }}
                      >
                        {gamesById.get(selectedNode.gameId)
                          ? resolveLocalizedText(
                              gamesById.get(selectedNode.gameId)!.name,
                              language,
                            )
                          : selectedNode.gameId.toUpperCase()}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>{resolveLocalizedText(selectedNode.difficulty, language)}</span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono tabular-nums">
                        {formatTimecode(selectedNode.durationSec)}
                      </span>
                    </div>
                    <h2 className="mt-1.5 font-display text-xl font-bold text-white text-balance">
                      {resolveLocalizedText(selectedNode.title, language)}
                    </h2>
                    <p className="mt-1 text-xs text-slate-400">
                      {resolveLocalizedText(selectedNode.subtitle, language)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onSelectNode(null)}
                    aria-label={copy.collapsePreview}
                    className="titanium-btn flex min-h-[38px] min-w-[38px] items-center justify-center rounded-xl text-slate-400 hover:text-white"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <p className="text-sm leading-relaxed text-slate-200">
                  {resolveLocalizedText(selectedNode.summary, language)}
                </p>

                <div className="grid grid-cols-3 gap-2 border-y border-white/8 py-3">
                  <button
                    type="button"
                    onClick={() => onEnterCoachingRoom(selectedNode.id, 'tactical')}
                    className="titanium-btn flex min-h-[48px] flex-col items-center justify-center gap-1 rounded-xl px-2 py-2 text-[11px] font-medium text-slate-100"
                  >
                    <MapIcon className="h-4 w-4 text-sky-400" />
                    <span className="truncate">{copy.stageTabs.tactical}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onEnterCoachingRoom(selectedNode.id, 'video')}
                    className="titanium-btn flex min-h-[48px] flex-col items-center justify-center gap-1 rounded-xl px-2 py-2 text-[11px] font-medium text-slate-100"
                  >
                    <Play className="h-4 w-4 text-amber-400" />
                    <span className="truncate">{copy.stageTabs.video}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onEnterCoachingRoom(selectedNode.id, 'controller')}
                    className="titanium-btn flex min-h-[48px] flex-col items-center justify-center gap-1 rounded-xl px-2 py-2 text-[11px] font-medium text-slate-100"
                  >
                    <Gamepad2 className="h-4 w-4 text-emerald-400" />
                    <span className="truncate">{copy.stageTabs.controller}</span>
                  </button>
                </div>

                {selectedNode.connectedTo.length > 0 && (
                  <div className="space-y-2">
                    <div className="text-xs font-medium text-slate-400">
                      {copy.connectedSkills}
                    </div>
                    <div className="space-y-1.5">
                      {selectedNode.connectedTo.map((targetId) => {
                        const linked = skillsById.get(targetId);
                        if (!linked) return null;
                        const linkedGame = gamesById.get(linked.gameId);
                        return (
                          <button
                            key={targetId}
                            type="button"
                            onClick={() => onSelectNode(linked.id)}
                            className="titanium-btn flex min-h-[46px] w-full items-center justify-between gap-2 rounded-xl px-3 py-2 text-start"
                          >
                            <div className="min-w-0">
                              <div className="truncate text-xs font-medium text-white">
                                {resolveLocalizedText(linked.title, language)}
                              </div>
                              <div className="text-[11px] text-slate-400">
                                {linkedGame?.shortName ?? linked.gameId.toUpperCase()} · {linked.code}
                              </div>
                            </div>
                            <ChevronRight className="h-4 w-4 shrink-0 text-slate-400" />
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              <motion.button
                type="button"
                whileTap={{ scale: 0.98 }}
                transition={SPRINGS.tap}
                onClick={() => onEnterCoachingRoom(selectedNode.id, 'tactical')}
                className="titanium-btn-primary mt-5 flex min-h-[48px] w-full items-center justify-center gap-2 rounded-2xl px-5 text-sm font-semibold text-slate-950"
              >
                <span>{copy.enterCoachingRoom}</span>
                <ArrowRight className="h-4 w-4" />
              </motion.button>
            </motion.aside>
          )}
        </AnimatePresence>
      </motion.main>
    </motion.div>
  );
}
