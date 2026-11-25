import type { WeaponStats } from '../engine/types';

interface WeaponStatsOverlayProps {
  stats: WeaponStats;
  deltas: WeaponStats | null;
  accent: string;
}

const STAT_ROWS: { key: keyof WeaponStats; label: string }[] = [
  { key: 'damage', label: 'Damage' },
  { key: 'accuracy', label: 'Accuracy' },
  { key: 'fireRate', label: 'Fire Rate' },
  { key: 'mobility', label: 'Mobility' },
  { key: 'control', label: 'Control' },
];

export function WeaponStatsOverlay({ stats, deltas, accent }: WeaponStatsOverlayProps) {
  return (
    <section
      aria-label="Weapon performance statistics"
      className="animate-stage-enter liquid-glass-subtle pointer-events-auto mx-auto w-full max-w-[780px] rounded-2xl px-4 py-3 sm:px-5"
    >
      <div className="grid grid-cols-2 gap-x-5 gap-y-2.5 sm:grid-cols-5">
        {STAT_ROWS.map(({ key, label }) => {
          const val = stats[key];
          const delta = deltas ? deltas[key] : 0;
          const baseVal = delta > 0 ? Math.max(0, val - delta) : val;

          return (
            <div key={key} className="flex flex-col gap-1.5">
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-[11px] font-medium text-slate-300">{label}</span>
                <div className="flex items-baseline gap-1 font-mono text-xs tabular-nums">
                  <span className="font-semibold text-white">{val}</span>
                  {delta !== 0 && (
                    <span
                      className={`text-[10px] font-semibold ${
                        delta > 0 ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {delta > 0 ? `+${delta}` : delta}
                    </span>
                  )}
                </div>
              </div>

              <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-white/[0.1]">
                {/* Base stat bar */}
                <div
                  className="absolute inset-y-0 left-0 rounded-full transition-all duration-300 ease-out"
                  style={{
                    width: `${baseVal}%`,
                    backgroundColor: accent,
                  }}
                />
                {/* Positive delta segment */}
                {delta > 0 && (
                  <div
                    className="absolute inset-y-0 rounded-r-full bg-emerald-400 transition-all duration-300 ease-out"
                    style={{
                      left: `${baseVal}%`,
                      width: `${Math.min(100 - baseVal, delta)}%`,
                    }}
                  />
                )}
                {/* Negative delta marker */}
                {delta < 0 && (
                  <div
                    className="absolute inset-y-0 rounded-r-full bg-rose-400/80 transition-all duration-300 ease-out"
                    style={{
                      left: `${val}%`,
                      width: `${Math.min(100 - val, Math.abs(delta))}%`,
                    }}
                  />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
