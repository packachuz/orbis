import { useMemo } from 'react';
import {
  type ConvergenceItem,
  type PredictiveConvergence,
  type ClockId,
} from '@/lib/predictiveEngine';
import {
  type NatalChart,
  ordinal,
  SIGN_NAMES,
  SIGN_RULERS,
} from '@/lib/astroEngine';
import { HOUSE_LORE, PLANET_LORE } from '@/lib/zodiacData';
import { PlanetGlyph } from './svg/AstroGlyphs';
import type { Selection } from './OrbisApp';
import {
  Calendar,
  Compass,
  Crosshair,
  ShieldAlert,
} from 'lucide-react';

interface ConvergencePanelProps {
  convergence: PredictiveConvergence;
  chart: NatalChart;
  selection?: Selection;
  onSelect?: (sel: Selection) => void;
  focusOnWheel?: (sel: Selection) => void;
}

export default function ConvergencePanel({
  convergence,
  chart,
  selection,
  onSelect,
  focusOnWheel,
}: ConvergencePanelProps) {
  const isCardMatchingSelection = (item: ConvergenceItem): boolean => {
    if (!selection) return false;
    if (selection.kind === 'planet') {
      if (item.targetType === 'planet' && item.targetPlanet === selection.id) return true;
      if (item.targetType === 'house' && item.targetHouse !== undefined) {
        const pPos = chart.planets.find((p) => p.id === selection.id);
        if (pPos && pPos.house === item.targetHouse) return true;
        // Check if selected planet rules this house
        const cuspSign = (chart.cusps[item.targetHouse - 1] / 30) | 0;
        if (SIGN_RULERS[cuspSign] === selection.id) return true;
      }
      return false;
    }
    if (selection.kind === 'aspect') {
      if (item.targetType === 'planet') {
        return item.targetPlanet === selection.a || item.targetPlanet === selection.b;
      }
      if (item.targetType === 'house' && item.targetHouse !== undefined) {
        const pA = chart.planets.find((p) => p.id === selection.a);
        const pB = chart.planets.find((p) => p.id === selection.b);
        return pA?.house === item.targetHouse || pB?.house === item.targetHouse;
      }
    }
    return false;
  };

  const sortedItems = useMemo(() => {
    const list = [...convergence.allConvergences];
    if (!selection) return list;
    return list.sort((a, b) => {
      const aMatch = isCardMatchingSelection(a);
      const bMatch = isCardMatchingSelection(b);
      if (aMatch && !bMatch) return -1;
      if (!aMatch && bMatch) return 1;
      if (b.clockCount !== a.clockCount) return b.clockCount - a.clockCount;
      return b.totalScore - a.totalScore;
    });
  }, [convergence.allConvergences, selection, chart]);

  const clockBadgeLabel = (clock: ClockId): string => {
    switch (clock) {
      case 'time-lords':
        return 'Time-Lord & Lots';
      case 'progressions':
        return 'Secondary Progressions';
      case 'solar-return':
        return 'Solar Return';
      case 'transits':
        return 'Transits & Eclipses';
    }
  };

  const clockBadgeColor = (clock: ClockId): string => {
    switch (clock) {
      case 'time-lords':
        return 'border-sky-500/40 bg-sky-500/10 text-sky-300';
      case 'progressions':
        return 'border-purple-500/40 bg-purple-500/10 text-purple-300';
      case 'solar-return':
        return 'border-amber-500/40 bg-amber-500/10 text-amber-300';
      case 'transits':
        return 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300';
    }
  };

  return (
    <div className="space-y-6">
      {/* Panel Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-gold/40 bg-gold/15">
            <ShieldAlert size={17} className="text-gold" />
          </div>
          <div>
            <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-gold block">
              Rule of Three Multi-Clock Convergence
            </span>
            <h4 className="font-serif text-xl font-bold text-silver">
              Predictive Convergence Testimonies ({sortedItems.length} Ranked Windows)
            </h4>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="rounded-full border border-gold/30 bg-gold/10 px-3 py-1 font-mono text-[10px] text-gold">
            {sortedItems.filter((i) => i.clockCount >= 3).length} Major (≥3 Clocks)
          </span>
          <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 font-mono text-[10px] text-emerald-300">
            {sortedItems.filter((i) => i.clockCount === 2).length} Dual Testimonies
          </span>
        </div>
      </div>

      {sortedItems.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-obsidian/40 p-8 text-center">
          <p className="font-serif text-base text-silver">
            No multi-clock convergences recorded for this window.
          </p>
          <p className="mt-1 text-xs text-slate-400">
            Clocks are operating independently without cross-domain geometric reinforcement.
          </p>
        </div>
      ) : (
        <div className="grid gap-5">
          {sortedItems.map((item) => {
            const isMatching = isCardMatchingSelection(item);
            const isFourClock = item.clockCount >= 4;
            const isThreeClock = item.clockCount === 3;

            let cardBorder = 'border-emerald-500/30 bg-emerald-500/[0.04]';
            let badgeBg = 'border-emerald-400/40 bg-emerald-400/10 text-emerald-300';

            if (isFourClock) {
              cardBorder = 'border-gold/80 bg-gradient-to-r from-gold/15 via-[#0F1628] to-[#0B0F19] shadow-[0_0_25px_rgba(229,193,88,0.2)]';
              badgeBg = 'border-gold bg-gold/25 text-gold font-bold animate-pulse';
            } else if (isThreeClock) {
              cardBorder = 'border-amber-400/50 bg-amber-400/[0.06] shadow-[0_0_20px_rgba(251,191,36,0.12)]';
              badgeBg = 'border-amber-400/50 bg-amber-400/15 text-amber-300 font-semibold';
            }

            return (
              <div
                key={item.id}
                className={`glass relative rounded-2xl p-6 transition-all duration-300 ${cardBorder} ${
                  isMatching
                    ? 'ring-2 ring-gold border-gold shadow-[0_0_35px_rgba(229,193,88,0.35)]'
                    : 'hover:border-white/20'
                }`}
              >
                {/* Header: Title + Badges */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
                  <div className="flex items-center gap-3">
                    {item.targetType === 'planet' && item.targetPlanet ? (
                      <div className="flex items-center gap-2">
                        <PlanetGlyph
                          planet={item.targetPlanet}
                          size={20}
                          color={PLANET_LORE[item.targetPlanet].color}
                        />
                        <div>
                          <h5 className="font-serif text-lg font-bold text-silver flex items-center gap-2">
                            <span>{PLANET_LORE[item.targetPlanet].name}</span>
                            <span className="font-sans text-xs text-slate-400 font-normal">
                              ({PLANET_LORE[item.targetPlanet].title})
                            </span>
                          </h5>
                          <span className="font-mono text-[10px] text-slate-400">
                            Natal Placement: {ordinal(chart.planets.find((p) => p.id === item.targetPlanet)?.house ?? 1)} House · {SIGN_NAMES[chart.planets.find((p) => p.id === item.targetPlanet)?.sign ?? 0]}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Compass size={20} className="text-gold" />
                        <div>
                          <h5 className="font-serif text-lg font-bold text-silver">
                            {ordinal(item.targetHouse ?? 1)} House of {HOUSE_LORE[(item.targetHouse ?? 1) - 1].domain}
                          </h5>
                          <span className="font-mono text-[10px] text-slate-400">
                            House Domain: {HOUSE_LORE[(item.targetHouse ?? 1) - 1].name}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    {isMatching && (
                      <span className="rounded-full bg-gold/25 px-2.5 py-0.5 font-mono text-[9px] font-bold text-gold border border-gold/50 shadow-sm animate-pulse">
                        ★ Orbit Convergence Hit
                      </span>
                    )}
                    <span className={`rounded-full border px-2.5 py-0.5 font-mono text-[9.5px] uppercase tracking-wider ${badgeBg}`}>
                      {item.badge}
                    </span>
                    <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 font-mono text-[9.5px] text-slate-300">
                      Score: {item.totalScore.toFixed(0)}
                    </span>
                  </div>
                </div>

                {/* Clock Testimony Badges */}
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <span className="font-mono text-[10px] uppercase text-slate-400">
                    Concurring Clocks ({item.clockCount}/4):
                  </span>
                  {item.clocksInvolved.map((clk) => (
                    <span
                      key={clk}
                      className={`rounded-full border px-2.5 py-0.5 font-mono text-[9.5px] uppercase tracking-wider ${clockBadgeColor(clk)}`}
                    >
                      {clockBadgeLabel(clk)}
                    </span>
                  ))}
                  <div className="ml-auto flex items-center gap-1 font-mono text-[10px] text-gold/80">
                    <Calendar size={12} />
                    <span>Window: {item.dateWindow}</span>
                  </div>
                </div>

                {/* Plain-English Astrological Synthesis */}
                <div className="mt-4 rounded-xl border border-white/5 bg-obsidian/50 p-4">
                  <p className="font-sans text-xs sm:text-sm leading-relaxed text-slate-200">
                    {item.synthesis}
                  </p>
                </div>

                {/* Detailed Testimonies List */}
                <div className="mt-4 space-y-2">
                  <span className="font-mono text-[10px] uppercase tracking-wider text-slate-400 block">
                    Individual Predictive Testimonies:
                  </span>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {item.testimonies.map((testimony, idx) => (
                      <div
                        key={idx}
                        className="rounded-xl border border-white/5 bg-white/[0.02] p-3 text-xs"
                      >
                        <div className="flex items-center justify-between text-[10px] font-mono text-gold/80">
                          <span className="font-semibold">{testimony.clockName}</span>
                          <span>Weight: {testimony.weight.toFixed(1)}</span>
                        </div>
                        <div className="mt-1 font-semibold text-silver">
                          {testimony.summary}
                        </div>
                        <p className="mt-1 text-[11px] leading-relaxed text-slate-400">
                          {testimony.detail}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Footer Action */}
                {item.targetPlanet && (
                  <div className="mt-4 flex items-center justify-end pt-3 border-t border-white/5">
                    <button
                      type="button"
                      onClick={() => {
                        onSelect?.({ kind: 'planet', id: item.targetPlanet! });
                        focusOnWheel?.({ kind: 'planet', id: item.targetPlanet! });
                      }}
                      className="flex items-center gap-1.5 rounded-full border border-gold/40 bg-gold/10 px-3 py-1 font-mono text-[10.5px] text-gold transition hover:bg-gold/20 hover:border-gold"
                    >
                      <Crosshair size={12} />
                      <span>Inspect {PLANET_LORE[item.targetPlanet].name} on Wheel</span>
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
