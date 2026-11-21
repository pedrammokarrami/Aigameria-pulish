import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'motion/react';
import {
  Check,
  Compass,
  MapPin,
  Music,
  Navigation,
  Search,
  ShoppingBag,
  Sparkles,
  Store,
  UserCheck,
  Users,
  X,
} from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import {
  type MapEntityKind,
  type PlatformMapEntity,
  filterMapEntities,
  formatDistanceLabel,
} from '../../utils/platformMapEngine';
import type { MasterHubId } from './MasterHubSwitcher';

interface PlatformMapModalProps {
  open: boolean;
  activeHub: MasterHubId;
  onClose: () => void;
  onJumpToStoreCollection: (collectionId?: string) => void;
}

const RADIUS_STEPS: Array<{ labelEn: string; labelFa: string; meters: number | null }> = [
  { labelEn: '500m', labelFa: '۵۰۰ متر', meters: 500 },
  { labelEn: '1km', labelFa: '۱ کیلومتر', meters: 1000 },
  { labelEn: '2km', labelFa: '۲ کیلومتر', meters: 2000 },
  { labelEn: 'All Area', labelFa: 'کل محدوده', meters: null },
];

export const PlatformMapModal: React.FC<PlatformMapModalProps> = ({
  open,
  activeHub,
  onClose,
  onJumpToStoreCollection,
}) => {
  const { isRtl, copy } = useLanguage();
  const [query, setQuery] = useState('');
  const [kindFilter, setKindFilter] = useState<'all' | MapEntityKind>('all');
  const [radiusMeters, setRadiusMeters] = useState<number | null>(null);
  const [selectedEntityId, setSelectedEntityId] = useState<string | null>(null);
  const [pingedIds, setPingedIds] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  const entities = useMemo(
    () =>
      filterMapEntities({
        hub: activeHub,
        query,
        kind: kindFilter,
        maxDistanceMeters: radiusMeters,
      }),
    [activeHub, query, kindFilter, radiusMeters]
  );

  useEffect(() => {
    setSelectedEntityId(entities[0]?.id ?? null);
  }, [activeHub, open]);

  const selectedEntity: PlatformMapEntity | null = useMemo(() => {
    if (selectedEntityId) {
      const hit = entities.find((e) => e.id === selectedEntityId);
      if (hit) return hit;
    }
    return entities[0] ?? null;
  }, [entities, selectedEntityId]);

  if (typeof document === 'undefined') return null;

  const isGame = activeHub === 'game';
  const isCinema = activeHub === 'cinema';
  const isAudio = activeHub === 'audio';

  const headerTitle = isGame
    ? copy.mapTitleGame
    : isCinema
      ? copy.mapTitleCinema
      : copy.mapTitleAudio;

  const headerSubtitle = isGame
    ? copy.mapSubtitleGame
    : isCinema
      ? copy.mapSubtitleCinema
      : copy.mapSubtitleAudio;

  const filterTabs: Array<{ id: 'all' | MapEntityKind; label: string }> = [
    { id: 'all', label: copy.mapFilterAll },
    { id: 'user', label: copy.mapFilterUsers },
    { id: 'club', label: copy.mapFilterClubs },
    { id: 'store', label: copy.mapFilterStores },
    { id: 'drop', label: copy.mapFilterDrops },
  ];

  const getPinIcon = (kind: MapEntityKind) => {
    if (kind === 'user') return <Users className="w-3.5 h-3.5" />;
    if (kind === 'club') return <Sparkles className="w-3.5 h-3.5" />;
    if (kind === 'store') return <Store className="w-3.5 h-3.5" />;
    return <MapPin className="w-3.5 h-3.5" />;
  };

  const togglePing = (id: string) => {
    setPingedIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Theme tokens cleanly separated per hub
  const modalSurfaceClass = isGame
    ? 'bg-[#070A12] border-[#00F0FF]/45 text-slate-100 shadow-[0_24px_80px_rgba(0,240,255,0.18)]'
    : isCinema
      ? 'bg-[#EEDBB8] border-[#78512A]/60 text-[#2D1B0B] shadow-[0_28px_84px_rgba(40,20,5,0.75)]'
      : 'bg-[#100D0B] border-[#D4AF37]/45 text-[#F6EFE2] shadow-[0_24px_80px_rgba(212,175,55,0.18)]';

  const mutedTextClass = isCinema ? 'text-[#5C3A1B]/85' : 'text-white/65';
  const controlBgClass = isCinema
    ? 'bg-[#DFC69C]/75 border-[#7A5127]/35 text-[#2D1B0B] placeholder:text-[#5C3A1B]/65'
    : 'bg-black/45 border-white/15 text-white placeholder:text-white/45';

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          key="platform-map-backdrop"
          dir={isRtl ? 'rtl' : 'ltr'}
          role="dialog"
          aria-modal="true"
          aria-label={headerTitle}
          data-testid={`platform-map-modal-${activeHub}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={onClose}
          className="fixed inset-0 z-[95] bg-black/80 backdrop-blur-md flex items-center justify-center p-2.5 sm:p-5 select-none"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
            onClick={(e) => e.stopPropagation()}
            style={
              isCinema
                ? {
                    fontFamily: "'Cormorant Garamond', 'Amiri', Georgia, serif",
                    backgroundImage:
                      'radial-gradient(circle at 20% 15%, rgba(255,248,230,0.45) 0%, transparent 55%), radial-gradient(circle at 80% 85%, rgba(168,120,62,0.28) 0%, transparent 60%)',
                  }
                : undefined
            }
            className={`relative w-full max-w-6xl max-h-[92dvh] rounded-2xl border overflow-hidden flex flex-col ${modalSurfaceClass}`}
          >
            {/* Header Bar */}
            <header
              className={`px-4 sm:px-6 py-3.5 border-b flex items-center justify-between gap-3 shrink-0 ${
                isCinema ? 'border-[#78512A]/25 bg-[#DFC597]/65' : 'border-white/12 bg-black/35'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
                    isGame
                      ? 'bg-[#FCEE0A]/15 border-[#FCEE0A]/50 text-[#FCEE0A]'
                      : isCinema
                        ? 'bg-[#8B1E1E]/15 border-[#8B1E1E]/45 text-[#8B1E1E]'
                        : 'bg-[#D4AF37]/15 border-[#D4AF37]/50 text-[#D4AF37]'
                  }`}
                >
                  {isAudio ? <Music className="w-5 h-5" /> : <Compass className="w-5 h-5" />}
                </div>
                <div className="min-w-0">
                  <h2 className="text-[16px] sm:text-[19px] font-black truncate leading-tight">
                    {headerTitle}
                  </h2>
                  <p className={`text-[11.5px] sm:text-[12px] truncate ${mutedTextClass}`}>
                    {headerSubtitle}
                  </p>
                </div>
              </div>

              <button
                type="button"
                data-testid="map-modal-close-btn"
                onClick={onClose}
                aria-label={copy.back}
                className={`w-10 h-10 rounded-full border flex items-center justify-center cursor-pointer transition shrink-0 ${
                  isCinema
                    ? 'border-[#78512A]/40 bg-[#CBB07F]/70 text-[#2D1B0B] hover:bg-[#8B1E1E] hover:text-white'
                    : 'border-white/15 bg-white/8 text-white hover:bg-white/20'
                }`}
              >
                <X className="w-4 h-4" />
              </button>
            </header>

            {/* Search & Filters Toolbar */}
            <div
              className={`px-4 sm:px-6 py-3 border-b flex flex-col lg:flex-row lg:items-center gap-2.5 shrink-0 ${
                isCinema ? 'border-[#78512A]/20 bg-[#E6CFA5]/65' : 'border-white/10 bg-black/25'
              }`}
            >
              <div className={`flex items-center gap-2 flex-1 min-h-[42px] px-3.5 rounded-xl border ${controlBgClass}`}>
                <Search className="w-4 h-4 shrink-0 opacity-70" />
                <input
                  type="search"
                  data-testid="map-search-input"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={copy.mapSearchPlaceholder}
                  className="w-full bg-transparent text-[13px] font-semibold focus:outline-none py-1.5"
                />
                {query.trim().length > 0 && (
                  <button
                    type="button"
                    onClick={() => setQuery('')}
                    aria-label={copy.showAll}
                    className="p-1 rounded-full hover:bg-black/15 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-1.5">
                {filterTabs.map((tab) => {
                  const active = kindFilter === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      data-testid={`map-filter-${tab.id}`}
                      onClick={() => setKindFilter(tab.id)}
                      className={`min-h-[34px] px-3 rounded-lg text-[11.5px] font-bold border transition cursor-pointer whitespace-nowrap ${
                        active
                          ? isGame
                            ? 'bg-[#00F0FF] text-slate-950 border-[#00F0FF]'
                            : isCinema
                              ? 'bg-[#8B1E1E] text-[#FDF6E9] border-[#8B1E1E]'
                              : 'bg-[#D4AF37] text-slate-950 border-[#D4AF37]'
                          : isCinema
                            ? 'bg-[#D8BF92]/65 text-[#3A220E] border-[#78512A]/30 hover:bg-[#CEB17E]'
                            : 'bg-white/6 text-white/80 border-white/12 hover:bg-white/12'
                      }`}
                    >
                      {tab.label}
                    </button>
                  );
                })}
              </div>

              <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
                {RADIUS_STEPS.map((step) => {
                  const active = radiusMeters === step.meters;
                  return (
                    <button
                      key={step.labelEn}
                      type="button"
                      onClick={() => setRadiusMeters(step.meters)}
                      className={`min-h-[32px] px-2.5 rounded-lg text-[11px] font-mono tabular-nums font-bold border transition cursor-pointer whitespace-nowrap ${
                        active
                          ? isGame
                            ? 'bg-[#FCEE0A] text-slate-950 border-[#FCEE0A]'
                            : isCinema
                              ? 'bg-[#3D2510] text-[#F4E4C8] border-[#3D2510]'
                              : 'bg-[#FA243C] text-white border-[#FA243C]'
                          : isCinema
                            ? 'bg-transparent text-[#4E3117] border-[#78512A]/35'
                            : 'bg-white/5 text-white/65 border-white/12'
                      }`}
                    >
                      {isRtl ? step.labelFa : step.labelEn}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Body: Interactive Domain Map Canvas + Nearby List & Inspector */}
            <div className="flex-1 min-h-0 overflow-y-auto lg:overflow-hidden grid grid-cols-1 lg:grid-cols-12">
              {/* Interactive Spatial Map Canvas */}
              <div className="lg:col-span-7 relative min-h-[320px] sm:min-h-[390px] lg:h-full overflow-hidden border-b lg:border-b-0 lg:border-e border-black/15">
                {/* 1. CYBERPUNK CITY GRID SVG (GAME HUB) */}
                {isGame && (
                  <svg
                    viewBox="0 0 800 500"
                    preserveAspectRatio="xMidYMid slice"
                    aria-hidden="true"
                    className="absolute inset-0 w-full h-full pointer-events-none"
                  >
                    <defs>
                      <radialGradient id="cyberRadarGlow" cx="50%" cy="50%" r="50%">
                        <stop offset="0%" stopColor="rgba(0,240,255,0.22)" />
                        <stop offset="60%" stopColor="rgba(0,240,255,0.05)" />
                        <stop offset="100%" stopColor="rgba(7,10,18,0)" />
                      </radialGradient>
                      <pattern id="cyberGrid" width="40" height="40" patternUnits="userSpaceOnUse">
                        <path
                          d="M 40 0 L 0 0 0 40"
                          fill="none"
                          stroke="rgba(0, 240, 255, 0.14)"
                          strokeWidth="1"
                        />
                      </pattern>
                    </defs>
                    <rect width="800" height="500" fill="#060911" />
                    <rect width="800" height="500" fill="url(#cyberGrid)" />
                    <circle cx="400" cy="250" r="220" fill="url(#cyberRadarGlow)" />
                    {/* Cyber city district polygon blocks */}
                    <polygon points="70,45 255,45 235,165 55,165" fill="#0D1628" stroke="#00F0FF" strokeOpacity="0.35" strokeWidth="1.5" />
                    <polygon points="310,40 530,40 545,150 295,150" fill="#131024" stroke="#FF2A6D" strokeOpacity="0.4" strokeWidth="1.5" />
                    <polygon points="585,48 745,62 725,215 565,195" fill="#0D1826" stroke="#FCEE0A" strokeOpacity="0.45" strokeWidth="1.5" />
                    <polygon points="80,220 270,210 250,430 65,415" fill="#121426" stroke="#FCEE0A" strokeOpacity="0.3" strokeWidth="1.5" />
                    <polygon points="320,295 570,280 550,455 305,445" fill="#0B1829" stroke="#00F0FF" strokeOpacity="0.4" strokeWidth="1.5" />
                    {/* Neon Tactical Expressways */}
                    <path d="M0 190 L800 225" stroke="#FCEE0A" strokeWidth="2.4" strokeOpacity="0.6" strokeDasharray="10 6" />
                    <path d="M275 0 L260 500" stroke="#00F0FF" strokeWidth="2.2" strokeOpacity="0.55" />
                    <path d="M560 0 L585 500" stroke="#FF2A6D" strokeWidth="2" strokeOpacity="0.45" />
                    {/* Radar Range Rings */}
                    <circle cx="400" cy="250" r="90" fill="none" stroke="#00F0FF" strokeOpacity="0.28" strokeDasharray="5 5" />
                    <circle cx="400" cy="250" r="185" fill="none" stroke="#FCEE0A" strokeOpacity="0.22" strokeDasharray="8 6" />
                  </svg>
                )}

                {/* 2. ANTIQUE TREASURE MAP SVG (CINEMA HUB) */}
                {isCinema && (
                  <svg
                    viewBox="0 0 800 500"
                    preserveAspectRatio="xMidYMid slice"
                    aria-hidden="true"
                    className="absolute inset-0 w-full h-full pointer-events-none"
                  >
                    <defs>
                      <radialGradient id="parchmentShade" cx="50%" cy="50%" r="65%">
                        <stop offset="0%" stopColor="#F2DFC0" />
                        <stop offset="72%" stopColor="#DEC08F" />
                        <stop offset="100%" stopColor="#B88E56" />
                      </radialGradient>
                    </defs>
                    <rect width="800" height="500" fill="url(#parchmentShade)" />
                    {/* Rhumb compass grid lines */}
                    <g stroke="#6B4423" strokeOpacity="0.22" strokeWidth="1">
                      <line x1="0" y1="250" x2="800" y2="250" />
                      <line x1="400" y1="0" x2="400" y2="500" />
                      <line x1="120" y1="0" x2="680" y2="500" />
                      <line x1="680" y1="0" x2="120" y2="500" />
                      <circle cx="400" cy="250" r="160" fill="none" />
                    </g>
                    {/* Hand-drawn landmass contours */}
                    <path
                      d="M90,95 C160,55 270,80 300,155 C330,220 265,305 180,290 C105,275 55,155 90,95 Z"
                      fill="#D2AF7A"
                      fillOpacity="0.45"
                      stroke="#5D3A1A"
                      strokeWidth="2"
                    />
                    <path
                      d="M475,75 C575,55 710,95 725,195 C738,295 645,420 520,395 C430,375 415,165 475,75 Z"
                      fill="#CFA872"
                      fillOpacity="0.45"
                      stroke="#5D3A1A"
                      strokeWidth="2"
                    />
                    {/* Dashed red treasure trail across islands */}
                    <path
                      d="M190,140 Q330,210 400,250 T575,140 T465,320"
                      fill="none"
                      stroke="#8B1E1E"
                      strokeWidth="3"
                      strokeDasharray="10 8"
                      strokeLinecap="round"
                    />
                    {/* Ornate Compass Rose bottom-right */}
                    <g transform="translate(715, 425)" stroke="#4B2E14" fill="none">
                      <circle r="36" strokeOpacity="0.55" strokeWidth="1.5" />
                      <polygon points="0,-34 7,-7 34,0 7,7 0,34 -7,7 -34,0 -7,-7" fill="#8B1E1E" fillOpacity="0.72" />
                      <text x="-4" y="-40" fontSize="11" fontWeight="bold" fill="#4B2E14">N</text>
                    </g>
                  </svg>
                )}

                {/* 3. MUSICAL SCORE & VINYL SOUNDWAVE MAP SVG (AUDIO HUB) */}
                {isAudio && (
                  <svg
                    viewBox="0 0 800 500"
                    preserveAspectRatio="xMidYMid slice"
                    aria-hidden="true"
                    className="absolute inset-0 w-full h-full pointer-events-none"
                  >
                    <defs>
                      <radialGradient id="vinylGrooveBg" cx="50%" cy="50%" r="55%">
                        <stop offset="0%" stopColor="#1D1610" />
                        <stop offset="65%" stopColor="#110D0A" />
                        <stop offset="100%" stopColor="#080605" />
                      </radialGradient>
                    </defs>
                    <rect width="800" height="500" fill="url(#vinylGrooveBg)" />
                    {/* Concentric Vinyl Acoustic Grooves */}
                    {[75, 130, 185, 240, 305].map((r) => (
                      <circle
                        key={r}
                        cx="400"
                        cy="250"
                        r={r}
                        fill="none"
                        stroke="#D4AF37"
                        strokeOpacity={r === 185 ? 0.34 : 0.14}
                        strokeWidth={r === 185 ? 1.5 : 1}
                        strokeDasharray={r === 130 ? '6 6' : undefined}
                      />
                    ))}
                    {/* 5-Line Flowing Musical Staff across stage */}
                    {[-16, -8, 0, 8, 16].map((offset) => (
                      <path
                        key={offset}
                        d={`M0 ${250 + offset} Q 200 ${175 + offset}, 400 ${250 + offset} T 800 ${240 + offset}`}
                        fill="none"
                        stroke="#D4AF37"
                        strokeOpacity="0.28"
                        strokeWidth="1.2"
                      />
                    ))}
                    {/* Decorative Brass Treble Clef & Notes */}
                    <text x="58" y="255" fontSize="64" fill="#D4AF37" fillOpacity="0.45">𝄞</text>
                    <text x="690" y="220" fontSize="34" fill="#FA243C" fillOpacity="0.5">♫</text>
                  </svg>
                )}

                {/* User's Current Center Location Beacon */}
                <div
                  className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 pointer-events-none flex flex-col items-center"
                >
                  <span
                    className={`w-10 h-10 rounded-full animate-ping opacity-30 ${
                      isGame
                        ? 'bg-[#00F0FF]'
                        : isCinema
                          ? 'bg-[#8B1E1E]'
                          : 'bg-[#1ED760]'
                    }`}
                  />
                  <div
                    className={`absolute top-2 w-6 h-6 rounded-full border-2 flex items-center justify-center shadow-lg ${
                      isGame
                        ? 'bg-[#070A12] border-[#00F0FF] text-[#00F0FF]'
                        : isCinema
                          ? 'bg-[#8B1E1E] border-[#FDF6E9] text-[#FDF6E9]'
                          : 'bg-[#100D0B] border-[#1ED760] text-[#1ED760]'
                    }`}
                  >
                    <Navigation className="w-3 h-3" />
                  </div>
                  <span
                    className={`mt-1 px-2 py-0.5 rounded text-[10px] font-black tracking-wide shadow ${
                      isCinema
                        ? 'bg-[#3D2510] text-[#F9E8CA]'
                        : 'bg-black/80 text-white border border-white/15'
                    }`}
                  >
                    {copy.mapYouAreHere}
                  </span>
                </div>

                {/* Clickable Platform Entities Positioned on Map */}
                {entities.map((entity) => {
                  const isSelected = selectedEntity?.id === entity.id;
                  const pinColors = isGame
                    ? entity.kind === 'store'
                      ? 'bg-[#FCEE0A] text-slate-950 border-white'
                      : entity.kind === 'club'
                        ? 'bg-[#FF2A6D] text-white border-white'
                        : 'bg-[#00F0FF] text-slate-950 border-white'
                    : isCinema
                      ? entity.kind === 'drop' || entity.kind === 'store'
                        ? 'bg-[#8B1E1E] text-[#FDF6E9] border-[#F4DFB8]'
                        : 'bg-[#3B230F] text-[#F4DFB8] border-[#C99A5B]'
                      : entity.kind === 'store'
                        ? 'bg-[#D4AF37] text-slate-950 border-white'
                        : entity.kind === 'club'
                          ? 'bg-[#FA243C] text-white border-white'
                          : 'bg-[#1DB954] text-slate-950 border-white';

                  return (
                    <button
                      key={entity.id}
                      type="button"
                      data-testid={`map-pin-${entity.id}`}
                      onClick={() => setSelectedEntityId(entity.id)}
                      aria-label={isRtl ? entity.nameFa : entity.nameEn}
                      style={{ left: `${entity.xPct}%`, top: `${entity.yPct}%` }}
                      className={`absolute -translate-x-1/2 -translate-y-1/2 z-20 group cursor-pointer transition-transform ${
                        isSelected ? 'scale-115 z-30' : 'hover:scale-110'
                      }`}
                    >
                      <span
                        className={`w-9 h-9 rounded-full border-2 shadow-xl flex items-center justify-center ${pinColors} ${
                          isSelected ? 'ring-4 ring-white/45' : ''
                        }`}
                      >
                        {isCinema && entity.kind === 'drop' ? (
                          <span className="font-black text-[14px]">✕</span>
                        ) : (
                          getPinIcon(entity.kind)
                        )}
                      </span>
                      <span
                        className={`mt-1 block max-w-[116px] truncate px-1.5 py-0.5 rounded text-[10px] font-bold shadow-md ${
                          isCinema
                            ? 'bg-[#F5E5C8]/95 text-[#2D1B0B] border border-[#78512A]/45'
                            : 'bg-black/85 text-white border border-white/15'
                        }`}
                      >
                        {isRtl ? entity.nameFa : entity.nameEn}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Right Sidebar: Selected Entity Inspector + Scrollable Nearby List */}
              <div className="lg:col-span-5 flex flex-col min-h-0 max-h-full overflow-hidden">
                {/* Active Pin Inspector */}
                {selectedEntity && (
                  <div
                    data-testid="map-inspector-card"
                    className={`p-4 border-b shrink-0 flex flex-col gap-2.5 ${
                      isCinema
                        ? 'bg-[#E3C99D]/80 border-[#78512A]/25'
                        : 'bg-white/[0.04] border-white/12'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className={`text-[11px] font-bold flex items-center gap-1.5 ${mutedTextClass}`}>
                          <span>{isRtl ? selectedEntity.districtFa : selectedEntity.districtEn}</span>
                          <span aria-hidden="true">·</span>
                          <span className="font-mono tabular-nums">
                            {formatDistanceLabel(selectedEntity.distanceMeters, isRtl)}
                          </span>
                        </div>
                        <h3 className="text-[15.5px] font-black leading-snug mt-0.5">
                          {isRtl ? selectedEntity.nameFa : selectedEntity.nameEn}
                        </h3>
                      </div>

                      <span
                        className={`px-2 py-1 rounded-md text-[11px] font-mono tabular-nums font-bold shrink-0 ${
                          isCinema
                            ? 'bg-[#8B1E1E] text-[#FDF6E9]'
                            : 'bg-white/10 text-white'
                        }`}
                      >
                        ★ {selectedEntity.rating.toFixed(1)}
                      </span>
                    </div>

                    <p className={`text-[12.5px] leading-relaxed ${mutedTextClass}`}>
                      {isRtl ? selectedEntity.subtitleFa : selectedEntity.subtitleEn}
                    </p>

                    <div className="flex flex-wrap items-center gap-2 pt-0.5">
                      <button
                        type="button"
                        data-testid="map-ping-entity-btn"
                        onClick={() => togglePing(selectedEntity.id)}
                        className={`min-h-[36px] px-3.5 rounded-xl text-[12px] font-extrabold border transition cursor-pointer inline-flex items-center gap-1.5 ${
                          pingedIds[selectedEntity.id]
                            ? 'bg-emerald-600 border-emerald-400 text-white'
                            : isGame
                              ? 'bg-[#00F0FF] border-[#00F0FF] text-slate-950'
                              : isCinema
                                ? 'bg-[#8B1E1E] border-[#8B1E1E] text-[#FDF6E9]'
                                : 'bg-[#1DB954] border-[#1DB954] text-slate-950'
                        }`}
                      >
                        {pingedIds[selectedEntity.id] ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>{copy.mapPingedDone}</span>
                          </>
                        ) : (
                          <>
                            <UserCheck className="w-3.5 h-3.5" />
                            <span>{copy.mapPingCta}</span>
                          </>
                        )}
                      </button>

                      {selectedEntity.kind === 'store' && (
                        <button
                          type="button"
                          data-testid="map-open-storefront-btn"
                          onClick={() => {
                            onClose();
                            onJumpToStoreCollection(selectedEntity.linkedStoreCollectionId);
                          }}
                          className={`min-h-[36px] px-3.5 rounded-xl text-[12px] font-extrabold border transition cursor-pointer inline-flex items-center gap-1.5 ${
                            isCinema
                              ? 'bg-[#3D2510] border-[#3D2510] text-[#F4E4C8]'
                              : 'bg-white/12 border-white/25 text-white hover:bg-white/20'
                          }`}
                        >
                          <ShoppingBag className="w-3.5 h-3.5" />
                          <span>{copy.mapOpenStoreCta}</span>
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* Nearby Directory List */}
                <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-2">
                  {entities.length === 0 ? (
                    <div className={`p-6 text-center text-[13px] font-bold ${mutedTextClass}`}>
                      {copy.mapNoResults}
                    </div>
                  ) : (
                    entities.map((item) => {
                      const active = selectedEntity?.id === item.id;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          data-testid={`map-list-item-${item.id}`}
                          onClick={() => setSelectedEntityId(item.id)}
                          className={`w-full text-start p-3 rounded-xl border transition cursor-pointer flex items-center justify-between gap-3 ${
                            active
                              ? isGame
                                ? 'bg-[#00F0FF]/12 border-[#00F0FF]'
                                : isCinema
                                  ? 'bg-[#DFC08E] border-[#8B1E1E]'
                                  : 'bg-[#D4AF37]/14 border-[#D4AF37]'
                              : isCinema
                                ? 'bg-[#E6CFA5]/55 border-[#78512A]/25 hover:bg-[#DFC394]'
                                : 'bg-white/[0.03] border-white/10 hover:bg-white/[0.08]'
                          }`}
                        >
                          <div className="min-w-0 flex-1">
                            <div className="text-[13px] font-extrabold truncate">
                              {isRtl ? item.nameFa : item.nameEn}
                            </div>
                            <div className={`text-[11px] truncate mt-0.5 ${mutedTextClass}`}>
                              {isRtl ? item.statusTextFa : item.statusTextEn} ·{' '}
                              {isRtl ? item.districtFa : item.districtEn}
                            </div>
                          </div>
                          <span className="text-[11px] font-mono tabular-nums font-bold shrink-0 opacity-85">
                            {formatDistanceLabel(item.distanceMeters, isRtl)}
                          </span>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
};
