import React, { useRef, useState } from 'react';
import { Camera, Film, Menu, Mic, PlayCircle, ShieldCheck, Sparkles, Trophy, Users, X } from 'lucide-react';

interface LobbyBottomDockProps {
  isListeningVoice: boolean;
  hasVideoBackdrop: boolean;
  useVideoBackdrop: boolean;
  onUploadFile: (file: File) => void;
  onToggleVoice: () => void;
  onOpenQuickDemo: () => void;
  onOpenTournamentHub: () => void;
  onOpenSocialClub: () => void;
  onOpenIdentityProfile?: () => void;
  onToggleBackdropMode: () => void;
}

export const LobbyBottomDock: React.FC<LobbyBottomDockProps> = ({
  isListeningVoice,
  hasVideoBackdrop,
  useVideoBackdrop,
  onUploadFile,
  onToggleVoice,
  onOpenQuickDemo,
  onOpenTournamentHub,
  onOpenSocialClub,
  onOpenIdentityProfile,
  onToggleBackdropMode,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <footer
      aria-label="نوار ارسال صحنه بازی"
      data-testid="lobby-bottom-dock"
      className="relative w-full shrink-0 pt-1"
    >
      {/* Hidden native file input for gameplay photo / video clip upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,video/*"
        data-testid="lobby-scene-file-input"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) {
            onUploadFile(file);
            e.target.value = '';
          }
        }}
      />

      {/* Compact Quick-Actions Popover when menu icon is tapped */}
      {menuOpen && (
        <div
          dir="rtl"
          data-testid="lobby-quick-menu-popover"
          className="absolute bottom-full mb-2.5 left-0 w-56 rounded-2xl bg-slate-950/85 backdrop-blur-2xl border border-white/15 p-2 shadow-[0_16px_44px_rgba(2,6,23,0.75)] flex flex-col gap-1 z-30"
        >
          <button
            type="button"
            data-testid="quick-menu-demo-btn"
            onClick={() => {
              setMenuOpen(false);
              onOpenQuickDemo();
            }}
            className="w-full min-h-[40px] px-3 rounded-xl text-right text-[13px] font-bold text-white hover:bg-emerald-500/20 hover:text-emerald-200 transition flex items-center gap-2.5 cursor-pointer"
          >
            <PlayCircle className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>شروع سریع تحلیل مربی</span>
          </button>

          <button
            type="button"
            data-testid="quick-menu-tournament-btn"
            onClick={() => {
              setMenuOpen(false);
              onOpenTournamentHub();
            }}
            className="w-full min-h-[40px] px-3 rounded-xl text-right text-[13px] font-bold text-white hover:bg-amber-500/20 hover:text-amber-200 transition flex items-center gap-2.5 cursor-pointer"
          >
            <Trophy className="w-4 h-4 text-amber-400 shrink-0" />
            <span>هاب تورنمنت ۳بعدی</span>
          </button>

          <button
            type="button"
            data-testid="quick-menu-social-btn"
            onClick={() => {
              setMenuOpen(false);
              onOpenSocialClub();
            }}
            className="w-full min-h-[40px] px-3 rounded-xl text-right text-[13px] font-bold text-white hover:bg-cyan-500/20 hover:text-cyan-200 transition flex items-center gap-2.5 cursor-pointer"
          >
            <Users className="w-4 h-4 text-cyan-400 shrink-0" />
            <span>ورود به سوشال کلاب</span>
          </button>

          {onOpenIdentityProfile && (
            <button
              type="button"
              data-testid="quick-menu-identity-btn"
              onClick={() => {
                setMenuOpen(false);
                onOpenIdentityProfile();
              }}
              className="w-full min-h-[40px] px-3 rounded-xl text-right text-[13px] font-bold text-white hover:bg-sky-500/20 hover:text-sky-200 transition flex items-center gap-2.5 cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4 text-sky-400 shrink-0" />
              <span>پروفایل هویت (Spatial ID)</span>
            </button>
          )}

          {hasVideoBackdrop && (
            <button
              type="button"
              data-testid="toggle-backdrop-mode"
              onClick={() => {
                setMenuOpen(false);
                onToggleBackdropMode();
              }}
              className="w-full min-h-[40px] px-3 rounded-xl text-right text-[13px] font-bold text-white/90 hover:bg-white/10 transition flex items-center gap-2.5 cursor-pointer"
            >
              {useVideoBackdrop ? (
                <Sparkles className="w-4 h-4 text-emerald-300 shrink-0" />
              ) : (
                <Film className="w-4 h-4 text-emerald-300 shrink-0" />
              )}
              <span>{useVideoBackdrop ? 'حالت صحنه UE 5.8' : 'حالت پس‌زمینه ویدیویی'}</span>
            </button>
          )}
        </div>
      )}

      {/* Sleek Floating Dark-Glass Dock */}
      <div
        dir="ltr"
        className="w-full rounded-full bg-slate-950/60 backdrop-blur-2xl border border-white/15 p-1.5 shadow-[0_12px_36px_rgba(2,6,23,0.65)] flex items-center gap-2"
      >
        {/* Clean Quick-Menu Button */}
        <button
          type="button"
          onClick={() => setMenuOpen((prev) => !prev)}
          aria-expanded={menuOpen}
          aria-label="منوی سریع"
          data-testid="lobby-quick-menu-btn"
          className={`w-11 h-11 rounded-full flex items-center justify-center border transition cursor-pointer shrink-0 ${
            menuOpen
              ? 'bg-white/15 border-white/30 text-white'
              : 'bg-white/5 border-white/12 text-white/80 hover:bg-white/10 hover:text-white'
          }`}
        >
          {menuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
        </button>

        {/* Emerald-Rimmed Primary CTA Pill: ارسال صحنه بازی */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          data-testid="lobby-upload-scene-btn"
          dir="rtl"
          className="flex-1 min-h-[44px] px-4 rounded-full bg-slate-950/75 border border-emerald-400/55 shadow-[0_0_20px_rgba(16,185,129,0.25)] hover:bg-emerald-500/15 hover:border-emerald-300/80 active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          <Camera className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="text-[13.5px] font-extrabold text-white whitespace-nowrap">
            ارسال صحنه بازی
          </span>
        </button>

        {/* Dedicated Voice Mic Button */}
        <button
          type="button"
          onClick={onToggleVoice}
          aria-label={isListeningVoice ? 'توقف میکروفون مربی' : 'سوال صوتی از مربی'}
          data-testid="lobby-voice-btn"
          className={`w-11 h-11 rounded-full flex items-center justify-center border transition cursor-pointer shrink-0 ${
            isListeningVoice
              ? 'bg-emerald-500/25 border-emerald-400/70 text-emerald-200 shadow-[0_0_16px_rgba(16,185,129,0.35)]'
              : 'bg-white/5 border-white/12 text-emerald-300 hover:bg-emerald-500/15 hover:border-emerald-400/45'
          }`}
        >
          <Mic className="w-4 h-4" />
        </button>
      </div>
    </footer>
  );
};
