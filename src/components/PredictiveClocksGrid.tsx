import {
  type EclipsesAndReturns,
  type HellenisticLotsResult,
  type PredictiveProfection,
  type SecondaryProgressions,
  type SolarReturnChart,
} from '@/lib/predictiveEngine';
import {
  type NatalChart,
  type PlanetId,
  ASPECT_BY_TYPE,
  ordinal,
  SIGN_NAMES,
} from '@/lib/astroEngine';
import { HOUSE_LORE, PLANET_LORE, POINT_NAMES } from '@/lib/zodiacData';
import { PlanetGlyph } from './svg/AstroGlyphs';
import { LunarPhaseIcon } from './HoroscopeDashboard';
import type { Selection } from './OrbisApp';
import {
  CheckCircle2,
  Clock,
  Crosshair,
  Hourglass,
  Moon,
  Orbit,
  Sun,
} from 'lucide-react';

interface PredictiveClocksGridProps {
  chart: NatalChart;
  progressions: SecondaryProgressions;
  solarReturn: SolarReturnChart;
  lots: HellenisticLotsResult;
  profection: PredictiveProfection;
  eclipsesAndReturns: EclipsesAndReturns;
  selection?: Selection;
  onSelect?: (sel: Selection) => void;
  focusOnWheel?: (sel: Selection) => void;
}

export default function PredictiveClocksGrid({
  chart,
  progressions,
  solarReturn,
  lots,
  profection,
  eclipsesAndReturns,
  selection,
  onSelect,
  focusOnWheel,
}: PredictiveClocksGridProps) {
  const isSelectedPlanet = (id: PlanetId): boolean => {
    if (!selection) return false;
    if (selection.kind === 'planet') return selection.id === id;
    if (selection.kind === 'aspect') return selection.a === id || selection.b === id;
    return false;
  };

  const selectPlanet = (id: PlanetId) => {
    onSelect?.({ kind: 'planet', id });
    focusOnWheel?.({ kind: 'planet', id });
  };

  return (
    <div className="space-y-8">
      {/* Grid Title */}
      <div className="border-b border-white/10 pb-4">
        <div className="flex items-center gap-2">
          <Clock size={16} className="text-gold" />
          <span className="font-mono text-[10.5px] uppercase tracking-[0.24em] text-gold">
            Four-Clock Deterministic Astronomical Framework
          </span>
        </div>
        <h3 className="mt-1 font-serif text-2xl font-bold text-silver">
          Active Predictive Clocks HUD
        </h3>
        <p className="mt-1 text-xs text-slate-400">
          Independent astronomical timekeepers evaluating your astrological trajectory for {chart.input.locationLabel} from classical and modern paradigms.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* ───────────────────────────────────────────────────────────── */}
        {/* CLOCK 1: HELLENISTIC LOTS & PROFECTION CLOCK                  */}
        {/* ───────────────────────────────────────────────────────────── */}
        <div className="glass flex flex-col justify-between rounded-3xl p-6 sm:p-7 border border-white/10 hover:border-gold/30 transition-all">
          <div>
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-sky-400/40 bg-sky-400/10 text-sky-300">
                  <Hourglass size={16} />
                </div>
                <div>
                  <span className="font-mono text-[9.5px] uppercase tracking-[0.2em] text-sky-400">
                    Clock 01 · Hellenistic Chronocrators
                  </span>
                  <h4 className="font-serif text-lg font-bold text-silver">
                    Lots & Profection Clock
                  </h4>
                </div>
              </div>
              <span className="rounded-full border border-sky-400/30 bg-sky-400/10 px-2.5 py-0.5 font-mono text-[9px] text-sky-300">
                Whole-Sign Engine
              </span>
            </div>

            {/* Annual & Monthly Profection Chapter */}
            <div className="mt-5 space-y-3">
              <div className="rounded-2xl border border-sky-400/20 bg-sky-950/20 p-4">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] uppercase text-sky-300 font-semibold">
                    Annual Profection ({profection.year})
                  </span>
                  <span className="font-mono text-[10px] text-slate-400">
                    Age {profection.age} · {ordinal(profection.annualHouse)} House ({profection.annualSignName})
                  </span>
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <PlanetGlyph
                      planet={profection.annualTimeLord}
                      size={18}
                      color={PLANET_LORE[profection.annualTimeLord].color}
                    />
                    <div>
                      <span className="font-serif text-sm font-bold text-silver">
                        {profection.annualTimeLordName}
                      </span>
                      <span className="ml-2 font-mono text-[10px] text-slate-400">
                        ({profection.annualDignity.label})
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => selectPlanet(profection.annualTimeLord)}
                    className="flex items-center gap-1 rounded-full border border-sky-400/40 bg-sky-400/10 px-2.5 py-0.5 font-mono text-[9.5px] text-sky-300 hover:bg-sky-400/20"
                  >
                    <Crosshair size={11} />
                    <span>Annual Lord</span>
                  </button>
                </div>
              </div>

              {/* Monthly Profection */}
              <div className="rounded-2xl border border-white/10 bg-obsidian/40 p-4">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] uppercase text-slate-300 font-semibold">
                    Monthly Profection Sub-Chapter
                  </span>
                  <span className="font-mono text-[10px] text-slate-400">
                    {ordinal(profection.monthlyHouse)} House ({profection.monthlySignName})
                  </span>
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <PlanetGlyph
                      planet={profection.monthlyTimeLord}
                      size={18}
                      color={PLANET_LORE[profection.monthlyTimeLord].color}
                    />
                    <div>
                      <span className="font-serif text-sm font-bold text-silver">
                        {profection.monthlyTimeLordName}
                      </span>
                      <span className="ml-2 font-mono text-[10px] text-slate-400">
                        ({profection.monthlyDignity.label})
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => selectPlanet(profection.monthlyTimeLord)}
                    className="flex items-center gap-1 rounded-full border border-white/20 bg-white/5 px-2.5 py-0.5 font-mono text-[9.5px] text-slate-300 hover:border-gold hover:text-gold"
                  >
                    <Crosshair size={11} />
                    <span>Monthly Lord</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Hellenistic Lots: Fortune & Spirit */}
            <div className="mt-5 space-y-3">
              <span className="font-mono text-[10px] uppercase tracking-wider text-slate-400 block">
                Sect-Adjusted Arabic / Hermetic Lots:
              </span>

              {/* Lot of Fortune */}
              <div className="rounded-xl border border-white/5 bg-white/[0.02] p-3.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-base font-bold text-gold">⊕</span>
                    <div>
                      <span className="font-serif text-sm font-semibold text-silver">
                        Lot of Fortune ({lots.fortune.greekName})
                      </span>
                      <span className="font-mono text-[10px] text-slate-400 block">
                        {lots.fortune.degInSign.toFixed(1)}° {lots.fortune.signName} (Natal {ordinal(lots.fortune.house)} House)
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => selectPlanet(lots.fortune.ruler)}
                    className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 font-mono text-[9px] text-slate-300 hover:text-gold hover:border-gold/40"
                  >
                    Ruler: {lots.fortune.rulerName}
                  </button>
                </div>
                <div className="mt-2 text-[10.5px] font-mono text-slate-400 flex items-center justify-between border-t border-white/5 pt-1.5">
                  <span>Formula: {lots.fortune.formulaDescription}</span>
                  {lots.fortune.isPeakPeriod && (
                    <span className="text-gold font-bold">★ Angular Peak ({lots.fortune.peakAngle})</span>
                  )}
                </div>
              </div>

              {/* Lot of Spirit */}
              <div className="rounded-xl border border-white/5 bg-white/[0.02] p-3.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-base font-bold text-astral">☉</span>
                    <div>
                      <span className="font-serif text-sm font-semibold text-silver">
                        Lot of Spirit ({lots.spirit.greekName})
                      </span>
                      <span className="font-mono text-[10px] text-slate-400 block">
                        {lots.spirit.degInSign.toFixed(1)}° {lots.spirit.signName} (Natal {ordinal(lots.spirit.house)} House)
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => selectPlanet(lots.spirit.ruler)}
                    className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 font-mono text-[9px] text-slate-300 hover:text-astral hover:border-astral/40"
                  >
                    Ruler: {lots.spirit.rulerName}
                  </button>
                </div>
                <div className="mt-2 text-[10.5px] font-mono text-slate-400 flex items-center justify-between border-t border-white/5 pt-1.5">
                  <span>Formula: {lots.spirit.formulaDescription}</span>
                  {lots.spirit.isPeakPeriod && (
                    <span className="text-astral font-bold">★ Angular Peak ({lots.spirit.peakAngle})</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ───────────────────────────────────────────────────────────── */}
        {/* CLOCK 2: SECONDARY PROGRESSIONS HUD                           */}
        {/* ───────────────────────────────────────────────────────────── */}
        <div className="glass flex flex-col justify-between rounded-3xl p-6 sm:p-7 border border-white/10 hover:border-gold/30 transition-all">
          <div>
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-purple-400/40 bg-purple-400/10 text-purple-300">
                  <Moon size={16} />
                </div>
                <div>
                  <span className="font-mono text-[9.5px] uppercase tracking-[0.2em] text-purple-400">
                    Clock 02 · Internal Symbolic Pulse
                  </span>
                  <h4 className="font-serif text-lg font-bold text-silver">
                    Secondary Progressions HUD
                  </h4>
                </div>
              </div>
              <span className="rounded-full border border-purple-400/30 bg-purple-400/10 px-2.5 py-0.5 font-mono text-[9px] text-purple-300">
                1 Day = 1 Year
              </span>
            </div>

            {/* 8-Fold Progressed Lunar Phase */}
            <div className="mt-5 rounded-2xl border border-purple-400/20 bg-purple-950/20 p-4">
              <div className="flex items-center gap-3">
                <LunarPhaseIcon phase={progressions.lunarPhase.phaseKey} size={30} />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-serif text-base font-bold text-silver">
                      {progressions.lunarPhase.name}
                    </span>
                    <span className="rounded-full border border-purple-400/40 bg-purple-400/10 px-2 py-0.2 font-mono text-[9px] text-purple-300">
                      {progressions.lunarPhase.elongation.toFixed(1)}°
                    </span>
                  </div>
                  <span className="font-mono text-[10px] text-gold/90 block">
                    Archetype: {progressions.lunarPhase.archetype}
                  </span>
                </div>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-slate-300">
                {progressions.lunarPhase.lifePulse}
              </p>
            </div>

            {/* Progressed Sun & Progressed Moon Status */}
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-white/5 bg-white/[0.02] p-3">
                <span className="font-mono text-[9.5px] uppercase text-amber-400 block">Progressed Sun</span>
                <span className="font-serif text-sm font-semibold text-silver block mt-0.5">
                  {progressions.progressedSun.degInSign.toFixed(1)}° {SIGN_NAMES[progressions.progressedSun.sign]}
                </span>
                <span className="font-mono text-[9.5px] text-slate-400">
                  Natal {ordinal(progressions.progressedSun.natalHouse)} House
                </span>
              </div>

              <div className="rounded-xl border border-white/5 bg-white/[0.02] p-3">
                <span className="font-mono text-[9.5px] uppercase text-purple-300 block">Progressed Moon</span>
                <span className="font-serif text-sm font-semibold text-silver block mt-0.5">
                  {progressions.progressedMoon.degInSign.toFixed(1)}° {SIGN_NAMES[progressions.progressedMoon.sign]}
                </span>
                <span className="font-mono text-[9.5px] text-slate-400">
                  Natal {ordinal(progressions.progressedMoon.natalHouse)}H · {progressions.progressedMoon.monthlyMotion.toFixed(2)}°/mo
                </span>
              </div>
            </div>

            {/* Tight Progressed-to-Natal Aspects (<= 1.5° orb) */}
            <div className="mt-4 space-y-2">
              <span className="font-mono text-[10px] uppercase tracking-wider text-slate-400 block">
                Tight Progressed Aspects (≤ 1.5° Orb):
              </span>
              {progressions.tightAspects.length === 0 ? (
                <div className="rounded-xl border border-white/5 bg-obsidian/40 p-3 text-center text-xs text-slate-400">
                  No progressed aspects within 1.5° orb this month.
                </div>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {progressions.tightAspects.map((asp, idx) => {
                    const isMatching = isSelectedPlanet(asp.progressedPlanet) || (typeof asp.natalPoint === 'string' && isSelectedPlanet(asp.natalPoint as PlanetId));
                    const def = ASPECT_BY_TYPE[asp.type];
                    return (
                      <div
                        key={idx}
                        className={`rounded-xl border p-2.5 text-xs transition ${
                          isMatching
                            ? 'border-gold bg-gold/10'
                            : 'border-white/5 bg-white/[0.02]'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5 font-semibold text-silver">
                            <span style={{ color: def.color }}>{def.symbol}</span>
                            <span>P.{PLANET_LORE[asp.progressedPlanet].name} {def.label} Natal {POINT_NAMES[asp.natalPoint]}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span className={`rounded-full px-1.5 py-0.2 font-mono text-[8.5px] uppercase ${asp.applying ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-500/20 text-slate-300'}`}>
                              {asp.applying ? 'Applying' : 'Separating'}
                            </span>
                            <span className="font-mono text-[10px] text-gold">{asp.orb.toFixed(2)}°</span>
                          </div>
                        </div>
                        <p className="mt-1 text-[11px] text-slate-300 leading-relaxed">
                          {asp.interpretation}
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ───────────────────────────────────────────────────────────── */}
        {/* CLOCK 3: EXACT SOLAR RETURN (ANNUAL REVOLUTION)               */}
        {/* ───────────────────────────────────────────────────────────── */}
        <div className="glass flex flex-col justify-between rounded-3xl p-6 sm:p-7 border border-white/10 hover:border-gold/30 transition-all">
          <div>
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-amber-400/40 bg-amber-400/10 text-amber-300">
                  <Sun size={16} />
                </div>
                <div>
                  <span className="font-mono text-[9.5px] uppercase tracking-[0.2em] text-amber-400">
                    Clock 03 · Annual Revolution
                  </span>
                  <h4 className="font-serif text-lg font-bold text-silver">
                    Solar Return Snapshot ({solarReturn.targetYear})
                  </h4>
                </div>
              </div>
              <div className="flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 font-mono text-[9px] text-emerald-300">
                <CheckCircle2 size={10} />
                <span>Δλ &lt; 0.001°</span>
              </div>
            </div>

            {/* Exact Timestamp & Angles */}
            <div className="mt-5 rounded-2xl border border-amber-400/20 bg-amber-950/20 p-4">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] uppercase text-amber-300 font-semibold">
                  Exact Return Moment
                </span>
                <span className="font-mono text-[10px] text-slate-300">
                  {solarReturn.exactDate.toUTCString().replace('GMT', 'UTC')}
                </span>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2 text-xs font-mono">
                <div className="rounded-xl border border-white/5 bg-white/[0.02] p-2.5">
                  <span className="text-[9.5px] uppercase text-slate-400 block">SR Ascendant</span>
                  <span className="text-silver font-bold">{solarReturn.srAsc.toFixed(1)}° {SIGN_NAMES[(solarReturn.srAsc / 30) | 0]}</span>
                  <span className="text-gold text-[9px] block">Natal {ordinal(solarReturn.natalHouseRising)}H Rising</span>
                </div>
                <div className="rounded-xl border border-white/5 bg-white/[0.02] p-2.5">
                  <span className="text-[9.5px] uppercase text-slate-400 block">SR Midheaven</span>
                  <span className="text-silver font-bold">{solarReturn.srMc.toFixed(1)}° {SIGN_NAMES[(solarReturn.srMc / 30) | 0]}</span>
                  <span className="text-gold text-[9px] block">Natal {ordinal(solarReturn.natalHouseCulminating)}H Culminating</span>
                </div>
              </div>
            </div>

            {/* SR Moon Placement */}
            <div className="mt-4 rounded-xl border border-white/5 bg-white/[0.02] p-3 flex items-center justify-between">
              <div>
                <span className="font-mono text-[9.5px] uppercase text-slate-400 block">Solar Return Moon</span>
                <span className="font-serif text-sm font-semibold text-silver">
                  {solarReturn.srMoon.lon.toFixed(1)}° {SIGN_NAMES[solarReturn.srMoon.sign]}
                </span>
              </div>
              <span className="font-mono text-[10px] text-gold">
                SR House {solarReturn.srMoon.srHouse} · Natal House {solarReturn.srMoon.natalHouse}
              </span>
            </div>

            {/* Tight SR-to-Natal Conjunctions (<= 3.0°) */}
            <div className="mt-4 space-y-2">
              <span className="font-mono text-[10px] uppercase tracking-wider text-slate-400 block">
                Annual Conjunction Anchors (≤ 3.0° Orb):
              </span>
              {solarReturn.conjunctions.length === 0 ? (
                <div className="rounded-xl border border-white/5 bg-obsidian/40 p-3 text-center text-xs text-slate-400">
                  No SR-to-natal conjunctions under 3.0° orb this year.
                </div>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {solarReturn.conjunctions.map((conj, idx) => {
                    const isMatching = isSelectedPlanet(conj.srPlanet) || (typeof conj.natalPoint === 'string' && isSelectedPlanet(conj.natalPoint as PlanetId));
                    return (
                      <div
                        key={idx}
                        className={`rounded-xl border p-2.5 text-xs transition ${
                          isMatching
                            ? 'border-gold bg-gold/10'
                            : 'border-white/5 bg-white/[0.02]'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-silver">
                            SR {PLANET_LORE[conj.srPlanet].name} ☌ Natal {POINT_NAMES[conj.natalPoint]}
                          </span>
                          <span className="font-mono text-[10px] text-amber-300 font-bold">
                            {conj.orb.toFixed(2)}°
                          </span>
                        </div>
                        <p className="mt-1 text-[11px] text-slate-300 leading-relaxed">
                          {conj.description}
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ───────────────────────────────────────────────────────────── */}
        {/* CLOCK 4: LUNAR NODES, ECLIPSES & CYCLE RETURNS               */}
        {/* ───────────────────────────────────────────────────────────── */}
        <div className="glass flex flex-col justify-between rounded-3xl p-6 sm:p-7 border border-white/10 hover:border-gold/30 transition-all">
          <div>
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-emerald-400/40 bg-emerald-400/10 text-emerald-300">
                  <Orbit size={16} />
                </div>
                <div>
                  <span className="font-mono text-[9.5px] uppercase tracking-[0.2em] text-emerald-400">
                    Clock 04 · Nodal Axis & Macro Cycles
                  </span>
                  <h4 className="font-serif text-lg font-bold text-silver">
                    Eclipses & Return Milestones
                  </h4>
                </div>
              </div>
              <span className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-2.5 py-0.5 font-mono text-[9px] text-emerald-300">
                18.6-Yr Axis
              </span>
            </div>

            {/* Lunar Node Axis */}
            <div className="mt-5 rounded-2xl border border-emerald-400/20 bg-emerald-950/20 p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono text-[10px] uppercase text-emerald-300 font-semibold">
                  Mean / True Lunar Node Axis
                </span>
                <span className="font-mono text-[10px] text-slate-400">
                  Ecliptic Intersections
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                <div className="rounded-xl border border-white/5 bg-white/[0.02] p-2.5">
                  <span className="text-[9.5px] uppercase text-emerald-400 block">☊ North Node</span>
                  <span className="text-silver font-bold">
                    {eclipsesAndReturns.nodes.meanNorth.toFixed(1)}° {SIGN_NAMES[eclipsesAndReturns.nodes.signNorth]}
                  </span>
                </div>
                <div className="rounded-xl border border-white/5 bg-white/[0.02] p-2.5">
                  <span className="text-[9.5px] uppercase text-rose-400 block">☋ South Node</span>
                  <span className="text-silver font-bold">
                    {eclipsesAndReturns.nodes.meanSouth.toFixed(1)}° {SIGN_NAMES[eclipsesAndReturns.nodes.signSouth]}
                  </span>
                </div>
              </div>
            </div>

            {/* Eclipses in Target Month */}
            <div className="mt-4 space-y-2">
              <span className="font-mono text-[10px] uppercase tracking-wider text-slate-400 block">
                Eclipse Classifications in Period:
              </span>
              {eclipsesAndReturns.eclipses.filter((e) => e.isEclipse).length === 0 ? (
                <div className="rounded-xl border border-white/5 bg-obsidian/40 p-3 text-center text-xs text-slate-400">
                  No solar or lunar eclipses fall within 18° of nodes during this month.
                </div>
              ) : (
                <div className="space-y-2">
                  {eclipsesAndReturns.eclipses
                    .filter((e) => e.isEclipse)
                    .map((ecl, idx) => (
                      <div
                        key={idx}
                        className="rounded-xl border border-gold/40 bg-gold/10 p-3 text-xs"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-serif font-bold text-silver">
                            {ecl.category} {ecl.eclipseType}
                          </span>
                          <span className="font-mono text-[9px] text-gold uppercase">
                            Node Dist: {ecl.nodeDistance?.toFixed(1)}° ({ecl.nearNode})
                          </span>
                        </div>
                        <p className="mt-1 text-[11px] text-slate-300">
                          Occurs in your natal {ordinal(ecl.house ?? 1)} House ({HOUSE_LORE[(ecl.house ?? 1) - 1].domain}) at {ecl.lon.toFixed(1)}°.
                        </p>
                      </div>
                    ))}
                </div>
              )}
            </div>

            {/* Major Planetary Life-Cycle Returns */}
            <div className="mt-4 space-y-2">
              <span className="font-mono text-[10px] uppercase tracking-wider text-slate-400 block">
                Annual Planetary Milestones ({solarReturn.targetYear}):
              </span>
              {eclipsesAndReturns.returns.length === 0 ? (
                <div className="rounded-xl border border-white/5 bg-obsidian/40 p-3 text-center text-xs text-slate-400">
                  No major return milestones (Saturn/Jupiter/Mars/Nodal) active in this annual window.
                </div>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {eclipsesAndReturns.returns.map((ret, idx) => (
                    <div
                      key={idx}
                      className="rounded-xl border border-white/5 bg-white/[0.02] p-2.5 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-silver font-serif">
                          {ret.title} (Age {ret.age})
                        </span>
                        <span className="font-mono text-[10px] text-emerald-300">
                          Orb {ret.orb.toFixed(1)}°
                        </span>
                      </div>
                      <p className="mt-1 text-[11px] text-slate-300 leading-relaxed">
                        {ret.description}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
