import React from 'react';
import { ShieldCheck, Trophy, Users } from 'lucide-react';
import { LOBBY_GAME_TABS, type LobbyGameId } from '../../utils/lobbySkillCatalog';

interface GameSwitcherBarProps {
  activeGameId: LobbyGameId;
  onSelectGame: (gameId: LobbyGameId) => void;
  onOpenTournamentHub: () => void;
  onOpenSocialClub: () => void;
  onOpenIdentityProfile?: () => void;
}

export const GameSwitcherBar: React.FC<GameSwitcherBarProps> = ({
  activeGameId,
  onSelectGame,
  onOpenTournamentHub,
  onOpenSocialClub,
  onOpenIdentityProfile,
}) => {
  return (
    <header className="w-full shrink-0">
      <nav
        aria-label="انتخاب بازی، تورنمنت و سوشال کلاب"
        data-testid="game-switcher-bar"
        dir="ltr"
        className="flex items-center justify-between gap-1.5 overflow-x-auto no-scrollbar py-1"
      >
        {LOBBY_GAME_TABS.map((tab) => {
          const isActive = tab.id === activeGameId;
          return (
            <button
              key={tab.id}
              type="button"
              data-testid={`game-pill-${tab.id}`}
              aria-pressed={isActive}
              onClick={() => onSelectGame(tab.id)}
              className={`shrink-0 whitespace-nowrap min-h-[38px] px-2.5 sm:px-3.5 rounded-full text-[12px] font-bold tracking-wide backdrop-blur-xl transition-all duration-200 cursor-pointer border ${
                isActive
                  ? 'border-emerald-400/70 bg-emerald-500/20 text-white shadow-[0_0_16px_rgba(16,185,129,0.3)]'
                  : 'border-white/15 bg-slate-950/45 text-white/80 hover:bg-slate-900/65 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          );
        })}

        {onOpenIdentityProfile && (
          <button
            key="spatial-identity"
            type="button"
            data-testid="open-spatial-identity-top-btn"
            onClick={onOpenIdentityProfile}
            className="shrink-0 whitespace-nowrap min-h-[38px] px-2.5 sm:px-3.5 rounded-full text-[11.5px] font-bold backdrop-blur-xl transition-all duration-200 cursor-pointer border border-sky-300/45 bg-slate-950/55 text-sky-100 hover:border-sky-300/80 hover:bg-sky-500/20 hover:text-white inline-flex items-center gap-1"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-sky-300 shrink-0" />
            <span>Spatial ID</span>
          </button>
        )}

        <button
          key="tournament-hub"
          type="button"
          data-testid="open-tournament-hub-top-btn"
          onClick={onOpenTournamentHub}
          dir="rtl"
          className="shrink-0 whitespace-nowrap min-h-[38px] px-2.5 sm:px-3.5 rounded-full text-[11.5px] font-bold backdrop-blur-xl transition-all duration-200 cursor-pointer border border-amber-400/40 bg-slate-950/55 text-amber-200 hover:border-amber-300/70 hover:bg-amber-500/15 hover:text-white inline-flex items-center gap-1"
        >
          <Trophy className="w-3.5 h-3.5 text-amber-300 shrink-0" />
          <span>تورنمنت</span>
        </button>

        <button
          key="social-club"
          type="button"
          data-testid="open-gta-social-top-btn"
          onClick={onOpenSocialClub}
          dir="rtl"
          className="shrink-0 whitespace-nowrap min-h-[38px] px-2.5 sm:px-3.5 rounded-full text-[11.5px] font-bold backdrop-blur-xl transition-all duration-200 cursor-pointer border border-white/15 bg-slate-950/45 text-cyan-200 hover:border-cyan-400/50 hover:bg-cyan-500/15 hover:text-white inline-flex items-center gap-1"
        >
          <Users className="w-3.5 h-3.5 text-cyan-300 shrink-0" />
          <span>سوشال کلاب</span>
        </button>
      </nav>
    </header>
  );
};
