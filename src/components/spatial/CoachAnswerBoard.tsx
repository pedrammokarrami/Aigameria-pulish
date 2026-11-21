import React, { useState } from 'react';
import { Crosshair, Package, MapPin, Coins, ListChecks, Users } from 'lucide-react';
import type { CoachAnswerBlock } from '../../utils/coachSearchRules';

interface CoachAnswerBoardProps {
  answerBlock: CoachAnswerBlock;
  accentHex: string;
}

/** Player dot positions per formation (xPct, yPct from top). */
const FORMATION_LAYOUTS: Record<string, Array<{ x: number; y: number; role: 'gk' | 'def' | 'mid' | 'att' }>> = {
  '4-2-3-1': [
    { x: 50, y: 90, role: 'gk' },
    { x: 15, y: 70, role: 'def' }, { x: 37, y: 74, role: 'def' }, { x: 63, y: 74, role: 'def' }, { x: 85, y: 70, role: 'def' },
    { x: 36, y: 54, role: 'mid' }, { x: 64, y: 54, role: 'mid' },
    { x: 24, y: 36, role: 'att' }, { x: 50, y: 32, role: 'att' }, { x: 76, y: 36, role: 'att' },
    { x: 50, y: 13, role: 'att' },
  ],
  '4-3-3 (2)': [
    { x: 50, y: 90, role: 'gk' },
    { x: 15, y: 70, role: 'def' }, { x: 37, y: 74, role: 'def' }, { x: 63, y: 74, role: 'def' }, { x: 85, y: 70, role: 'def' },
    { x: 28, y: 54, role: 'mid' }, { x: 50, y: 60, role: 'mid' }, { x: 72, y: 54, role: 'mid' },
    { x: 15, y: 28, role: 'att' }, { x: 50, y: 14, role: 'att' }, { x: 85, y: 28, role: 'att' },
  ],
  '4-2-1-3': [
    { x: 50, y: 90, role: 'gk' },
    { x: 15, y: 70, role: 'def' }, { x: 37, y: 74, role: 'def' }, { x: 63, y: 74, role: 'def' }, { x: 85, y: 70, role: 'def' },
    { x: 38, y: 58, role: 'mid' }, { x: 62, y: 58, role: 'mid' },
    { x: 50, y: 42, role: 'att' },
    { x: 14, y: 24, role: 'att' }, { x: 50, y: 12, role: 'att' }, { x: 86, y: 24, role: 'att' },
  ],
  '3-5-2': [
    { x: 50, y: 90, role: 'gk' },
    { x: 30, y: 72, role: 'def' }, { x: 50, y: 76, role: 'def' }, { x: 70, y: 72, role: 'def' },
    { x: 10, y: 52, role: 'mid' }, { x: 30, y: 50, role: 'mid' }, { x: 50, y: 56, role: 'mid' }, { x: 70, y: 50, role: 'mid' }, { x: 90, y: 52, role: 'mid' },
    { x: 40, y: 18, role: 'att' }, { x: 60, y: 18, role: 'att' },
  ],
};

const ROLE_STYLE: Record<string, { bg: string; label: string }> = {
  gk: { bg: '#F5C542', label: 'GK' },
  def: { bg: '#38BDF8', label: '' },
  mid: { bg: '#34D399', label: '' },
  att: { bg: '#EF4444', label: '' },
};

const INTENT_ICON: Record<string, React.ComponentType<{ className?: string }>> = {
  formation: Users,
  loadout: Crosshair,
  item: Package,
  map: MapPin,
  economy: Coins,
  tactic: ListChecks,
};

/** Pick a formation layout from the answer text (falls back to first option). */
function resolveFormationFromText(lines: string[], options: string[]): { key: string; layout: Array<{ x: number; y: number; role: string }> } {
  const candidates = options.filter((o) => FORMATION_LAYOUTS[o]);
  const key = candidates[0] ?? '4-2-3-1';
  const found = lines
    .map((l) => candidates.find((o) => l.includes(o)))
    .find(Boolean);
  const chosen = found ?? key;
  return { key: chosen, layout: FORMATION_LAYOUTS[chosen] ?? FORMATION_LAYOUTS['4-2-3-1'] };
}

export const CoachAnswerBoard: React.FC<CoachAnswerBoardProps> = ({ answerBlock, accentHex }) => {
  const [selectedFormation, setSelectedFormation] = useState<string | null>(null);
  const Icon = INTENT_ICON[answerBlock.intent] ?? ListChecks;
  const isFaLines = answerBlock.linesFa?.length > 0;
  const lines = isFaLines ? answerBlock.linesFa : answerBlock.linesEn;

  const formationState =
    answerBlock.intent === 'formation'
      ? resolveFormationFromText(lines, answerBlock.options ?? [])
      : null;
  const activeFormation = selectedFormation ?? formationState?.key ?? null;
  const formationDots = activeFormation ? FORMATION_LAYOUTS[activeFormation] : null;

  return (
    <div
      data-testid="coach-answer-board"
      className="fc27-card p-3 flex flex-col gap-2.5"
    >
      <div className="flex items-center justify-between gap-2 pb-1.5 border-b border-white/10">
        <span className="flex items-center gap-1.5 font-mono-tabular text-[10px] font-black" style={{ color: accentHex }}>
          <Icon className="w-3.5 h-3.5" />
          AnswerBoardAgent · {answerBlock.titleFa}
        </span>
        <span
          className="px-1.5 py-0.5 font-mono-tabular text-[9px] font-black"
          style={{ backgroundColor: accentHex, color: '#05070B' }}
        >
          {answerBlock.intent.toUpperCase()}
        </span>
      </div>

      {/* Formation pitch */}
      {answerBlock.intent === 'formation' && formationDots && (
        <div className="flex flex-col gap-2">
          <div
            data-testid="formation-pitch"
            className="relative w-full rounded-lg overflow-hidden border border-white/15"
            style={{
              aspectRatio: '16 / 10',
              background:
                'repeating-linear-gradient(90deg, #0e5c2f 0px, #0e5c2f 34px, #0f6433 34px, #0f6433 68px)',
            }}
          >
            {/* halfway line + center circle + boxes */}
            <div className="absolute inset-x-0 top-1/2 h-px bg-white/25" />
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[22%] aspect-square rounded-full border border-white/25" />
            <div className="absolute left-1/2 bottom-0 -translate-x-1/2 w-[36%] h-[13%] border border-white/25 border-b-0 rounded-t-sm" />
            <div className="absolute left-1/2 top-0 -translate-x-1/2 w-[36%] h-[13%] border border-white/25 border-t-0 rounded-b-sm" />
            {formationDots.map((dot, i) => {
              const style = ROLE_STYLE[dot.role] ?? ROLE_STYLE.mid;
              return (
                <div
                  key={i}
                  className="absolute -translate-x-1/2 -translate-y-1/2 flex items-center justify-center rounded-full border border-black/40 shadow-md"
                  style={{
                    left: `${dot.x}%`,
                    top: `${dot.y}%`,
                    width: '9.5%',
                    aspectRatio: '1',
                    backgroundColor: style.bg,
                    color: '#05070B',
                  }}
                >
                  <span className="font-mono-tabular text-[8px] font-black">{style.label}</span>
                </div>
              );
            })}
          </div>
          {answerBlock.options && answerBlock.options.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {answerBlock.options.map((opt) => {
                const active = opt === activeFormation;
                const known = Boolean(FORMATION_LAYOUTS[opt]);
                return (
                  <button
                    key={opt}
                    type="button"
                    data-testid={`formation-chip-${opt.replace(/[^0-9a-z-]/gi, '')}`}
                    onClick={() => known && setSelectedFormation(opt)}
                    className="px-2.5 py-1 rounded-full text-[11px] font-black transition cursor-pointer border"
                    style={{
                      backgroundColor: active ? accentHex : 'rgba(255,255,255,0.08)',
                      color: active ? '#05070B' : '#FFFFFF',
                      borderColor: active ? accentHex : 'rgba(255,255,255,0.2)',
                    }}
                  >
                    {opt}
                    {known ? '' : ' ℹ'}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Map board */}
      {answerBlock.intent === 'map' && (
        <div
          data-testid="answer-map-board"
          className="relative w-full rounded-lg overflow-hidden border border-white/15"
          style={{ aspectRatio: '16 / 9', background: 'linear-gradient(135deg, #101b26, #0a1118)' }}
        >
          <div className="absolute inset-0" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)', backgroundSize: '16.6% 25%' }} />
          <div className="absolute left-[18%] top-[38%] w-[18%] aspect-square rounded-full border-2 border-[#EF4444]/70 bg-[#EF4444]/10 flex items-center justify-center">
            <span className="font-mono-tabular text-[9px] font-black text-[#EF4444]">DANGER</span>
          </div>
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 56" preserveAspectRatio="none">
            <path d="M 42 38 L 62 24 L 84 18" stroke={accentHex} strokeWidth="1.6" fill="none" markerEnd="none" />
            <polygon points="84,18 78,16.4 80.4,21.4" fill={accentHex} />
          </svg>
          <div className="absolute right-[8%] top-[18%] w-[7%] aspect-square rounded-full border-2 border-[#10B981] bg-[#10B981]/20 flex items-center justify-center">
            <span className="font-mono-tabular text-[9px] font-black text-[#10B981]">GOAL</span>
          </div>
        </div>
      )}

      {/* Loadout slots */}
      {answerBlock.intent === 'loadout' && (
        <div data-testid="answer-loadout-board" className="flex flex-col gap-1.5">
          {lines.map((line, i) => (
            <div
              key={i}
              className="flex items-start gap-2 px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/10 text-[12px] text-white font-bold leading-relaxed"
            >
              <span
                className="w-5 h-5 shrink-0 flex items-center justify-center rounded font-mono-tabular text-[10px] font-black"
                style={{ backgroundColor: accentHex, color: '#05070B' }}
              >
                {i + 1}
              </span>
              <span>{line}</span>
            </div>
          ))}
        </div>
      )}

      {/* Generic structured lines (item / economy / tactic / fallback) */}
      {answerBlock.intent !== 'formation' && answerBlock.intent !== 'map' && answerBlock.intent !== 'loadout' && (
        <div className="flex flex-col gap-1.5">
          {lines.map((line, i) => (
            <p key={i} className="text-[12.5px] text-white/85 font-bold leading-relaxed flex items-start gap-1.5">
              <span style={{ color: accentHex }} className="shrink-0">▸</span>
              <span>{line}</span>
            </p>
          ))}
        </div>
      )}
    </div>
  );
};
