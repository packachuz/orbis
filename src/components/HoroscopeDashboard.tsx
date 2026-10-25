import { useEffect, useMemo, useState } from 'react';
import {
  ASPECT_BY_TYPE,
  PLANET_IDS,
  SIGN_NAMES,
  SIGN_RULERS,
  formatOrb,
  ordinal,
  type NatalChart,
} from '@/lib/astroEngine';
import {
  aspectExplanation,
  buildCareer,
  buildForecast,
  buildLove,
  buildProfectionReading,
  buildTriad,
  fmtDate,
  housePhrase,
  planetExplanation,
  type ForecastEvent,
} from '@/lib/horoscopeEngine';
import {
  type AstroSynthesis,
  type LunarPhaseKey,
  synthesizeChart,
} from '@/lib/astroSynthesis';
import {
  computeExactSolarReturn,
  computeHellenisticLots,
  computePredictiveConvergence,
  computePredictiveProfection,
  computeSecondaryProgressions,
  classifyEclipsesAndReturns,
} from '@/lib/predictiveEngine';
import { PLANET_LORE } from '@/lib/zodiacData';
import { PlanetGlyph, ZodiacGlyph } from './svg/AstroGlyphs';
import type { Selection } from './OrbisApp';
import TimeMachineScrubber from './TimeMachineScrubber';
import ConvergencePanel from './ConvergencePanel';
import PredictiveClocksGrid from './PredictiveClocksGrid';
import {
  ArrowRightLeft,
  Briefcase,
  Calendar,
  Compass,
  Crown,
  Heart,
  Hourglass,
  Moon,
  Orbit,
  Sparkles,
  Sun,
  UserCheck,
  X,
} from 'lucide-react';

interface Props {
  chart: NatalChart;
  selection?: Selection;
  onSelect?: (sel: Selection) => void;
  onFocus?: (sel: Selection) => void;
  focusOnWheel?: (sel: Selection) => void;
  targetYear?: number;
  targetMonth?: number;
  onDateChange?: (year: number, month: number) => void;
  onResetDate?: () => void;
}

type TabKey = 'love' | 'career' | 'profection' | 'forecast';

export function LunarPhaseIcon({ phase, size = 26 }: { phase: LunarPhaseKey; size?: number }) {
  switch (phase) {
    case 'new':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" className="shrink-0" aria-label="New Moon">
          <circle cx="12" cy="12" r="9.5" fill="#0A0E17" stroke="#E5C158" strokeWidth="1.2" strokeDasharray="2 2" />
        </svg>
      );
    case 'waxing-crescent':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" className="shrink-0" aria-label="Waxing Crescent">
          <circle cx="12" cy="12" r="9.5" fill="#0A0E17" stroke="#475569" strokeWidth="1" />
          <path d="M12 2.5 A9.5 9.5 0 0 1 12 21.5 A5 9.5 0 0 0 12 2.5 Z" fill="#E5C158" />
        </svg>
      );
    case 'first-quarter':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" className="shrink-0" aria-label="First Quarter">
          <circle cx="12" cy="12" r="9.5" fill="#0A0E17" stroke="#475569" strokeWidth="1" />
          <path d="M12 2.5 A9.5 9.5 0 0 1 12 21.5 Z" fill="#E5C158" />
        </svg>
      );
    case 'gibbous':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" className="shrink-0" aria-label="Gibbous Moon">
          <circle cx="12" cy="12" r="9.5" fill="#E5C158" />
          <path d="M12 2.5 A9.5 9.5 0 0 0 12 21.5 A5 9.5 0 0 1 12 2.5 Z" fill="#0A0E17" />
        </svg>
      );
    case 'full':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" className="shrink-0" aria-label="Full Moon">
          <circle cx="12" cy="12" r="9.5" fill="#F8E7B0" stroke="#E5C158" strokeWidth="1.5" />
          <circle cx="12" cy="12" r="7" fill="none" stroke="#E5C158" strokeOpacity="0.3" strokeDasharray="2 2" />
        </svg>
      );
    case 'disseminating':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" className="shrink-0" aria-label="Disseminating Moon">
          <circle cx="12" cy="12" r="9.5" fill="#E5C158" />
          <path d="M12 2.5 A9.5 9.5 0 0 1 12 21.5 A5 9.5 0 0 0 12 2.5 Z" fill="#0A0E17" />
        </svg>
      );
    case 'last-quarter':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" className="shrink-0" aria-label="Last Quarter">
          <circle cx="12" cy="12" r="9.5" fill="#0A0E17" stroke="#475569" strokeWidth="1" />
          <path d="M12 2.5 A9.5 9.5 0 0 0 12 21.5 Z" fill="#E5C158" />
        </svg>
      );
    case 'balsamic':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" className="shrink-0" aria-label="Balsamic Moon">
          <circle cx="12" cy="12" r="9.5" fill="#0A0E17" stroke="#475569" strokeWidth="1" />
          <path d="M12 2.5 A9.5 9.5 0 0 0 12 21.5 A5 9.5 0 0 1 12 2.5 Z" fill="#E5C158" />
        </svg>
      );
  }
}

export default function HoroscopeDashboard({
  chart,
  selection,
  onSelect,
  onFocus,
  focusOnWheel,
  targetYear = 2026,
  targetMonth = 9,
  onDateChange,
  onResetDate,
}: Props) {
  const [activeTab, setActiveTab] = useState<TabKey>('love');
  const [transitFilterFocusedOnly, setTransitFilterFocusedOnly] = useState(false);
  const handleFocus = focusOnWheel ?? onFocus;

  const currentYear = targetYear;
  const currentMonth = targetMonth;

  // Master Astrological Synthesis (Sect, Dignities, Receptions, Phase, Patterns, Profection)
  const synthesis: AstroSynthesis = useMemo(() => synthesizeChart(chart, currentYear), [chart, currentYear]);

  // Compute dynamic transit overlay for target year and month
  const forecast = useMemo(() => {
    return buildForecast(chart, currentYear, currentMonth);
  }, [chart, currentYear, currentMonth]);

  // Four-Clock Deterministic Calculations & Rule of Three Convergence
  const convergence = useMemo(() => computePredictiveConvergence(chart, currentYear, currentMonth), [chart, currentYear, currentMonth]);
  const progressions = useMemo(() => computeSecondaryProgressions(chart, currentYear, currentMonth), [chart, currentYear, currentMonth]);
  const solarReturn = useMemo(() => computeExactSolarReturn(chart, currentYear), [chart, currentYear]);
  const lots = useMemo(() => computeHellenisticLots(chart), [chart]);
  const profection = useMemo(() => computePredictiveProfection(chart, currentYear, currentMonth), [chart, currentYear, currentMonth]);
  const eclipsesAndReturns = useMemo(() => classifyEclipsesAndReturns(chart, currentYear, currentMonth), [chart, currentYear, currentMonth]);

  const triad = useMemo(() => buildTriad(chart, synthesis), [chart, synthesis]);
  const loveReading = useMemo(() => buildLove(chart, forecast, synthesis), [chart, forecast, synthesis]);
  const careerReading = useMemo(() => buildCareer(chart, forecast, synthesis), [chart, forecast, synthesis]);
  const profectionReading = useMemo(() => buildProfectionReading(chart, forecast, synthesis), [chart, forecast, synthesis]);

  const { sect, lunarPhase, dignities, mutualReceptions, patterns } = synthesis;

  const isEventAffectingSelection = (ev: ForecastEvent) => {
    if (!selection) return false;
    if (selection.kind === 'planet') {
      if (ev.hit?.natal === selection.id || ev.hit?.transit === selection.id) return true;
      if (ev.kind === 'station' && ev.title.toLowerCase().includes(PLANET_LORE[selection.id].name.toLowerCase())) return true;
      if (ev.kind === 'lunation' && (selection.id === 'sun' || selection.id === 'moon')) return true;
      return false;
    }
    if (selection.kind === 'aspect') {
      if (
        ev.hit?.natal === selection.a ||
        ev.hit?.natal === selection.b ||
        ev.hit?.transit === selection.a ||
        ev.hit?.transit === selection.b
      )
        return true;
      if (
        ev.kind === 'station' &&
        (ev.title.toLowerCase().includes(PLANET_LORE[selection.a].name.toLowerCase()) ||
          ev.title.toLowerCase().includes(PLANET_LORE[selection.b].name.toLowerCase()))
      )
        return true;
      if (
        ev.kind === 'lunation' &&
        (selection.a === 'sun' || selection.b === 'sun' || selection.a === 'moon' || selection.b === 'moon')
      )
        return true;
      return false;
    }
    return false;
  };

  // Smart tab guidance: recommend tab matching the active selection
  const recommendedTab = useMemo<TabKey | null>(() => {
    if (!selection) return null;
    if (selection.kind === 'planet') {
      if (selection.id === profection.annualTimeLord || selection.id === profection.monthlyTimeLord) return 'profection';
      if (selection.id === 'venus' || selection.id === 'mars') return 'love';
      if (selection.id === 'sun' || selection.id === 'saturn') return 'career';
      const hasTransit = forecast.events.some(isEventAffectingSelection);
      if (hasTransit) return 'forecast';
      return null;
    }
    if (selection.kind === 'aspect') {
      if (
        selection.a === profection.annualTimeLord ||
        selection.b === profection.annualTimeLord ||
        selection.a === profection.monthlyTimeLord ||
        selection.b === profection.monthlyTimeLord
      )
        return 'profection';
      if (selection.a === 'venus' || selection.b === 'venus' || selection.a === 'mars' || selection.b === 'mars')
        return 'love';
      if (selection.a === 'sun' || selection.b === 'sun' || selection.a === 'saturn' || selection.b === 'saturn')
        return 'career';
      return 'forecast';
    }
    return null;
  }, [selection, profection.annualTimeLord, profection.monthlyTimeLord, forecast.events]);

  // Steer active tab automatically whenever selection changes
  useEffect(() => {
    if (recommendedTab) {
      setActiveTab(recommendedTab);
    }
  }, [selection, recommendedTab]);

  // Reset transit filter toggle when selection clears
  useEffect(() => {
    if (!selection) {
      setTransitFilterFocusedOnly(false);
    }
  }, [selection]);

  const displayedEvents = useMemo(() => {
    let list = forecast.events;
    if (selection && transitFilterFocusedOnly) {
      list = list.filter(isEventAffectingSelection);
    } else if (selection) {
      list = [...list].sort((a, b) => {
        const aAff = isEventAffectingSelection(a);
        const bAff = isEventAffectingSelection(b);
        if (aAff && !bAff) return -1;
        if (!aAff && bAff) return 1;
        return a.date.getTime() - b.date.getTime();
      });
    }
    return list;
  }, [forecast.events, selection, transitFilterFocusedOnly]);

  return (
    <div className="mt-12 space-y-16">
      {/* ───────────────────────────────────────────────────────────── */}
      {/* INTERACTIVE TIME-MACHINE SCRUBBER                             */}
      {/* ───────────────────────────────────────────────────────────── */}
      <TimeMachineScrubber
        targetYear={currentYear}
        targetMonth={currentMonth}
        onDateChange={onDateChange ?? (() => {})}
        onResetDate={onResetDate ?? (() => {})}
        age={profection.age}
        annualTimeLord={profection.annualTimeLordName}
        annualHouse={profection.annualHouse}
        monthlyTimeLord={profection.monthlyTimeLordName}
        monthlyHouse={profection.monthlyHouse}
        progressedMoonSignName={SIGN_NAMES[progressions.progressedMoon.sign]}
        progressedMoonDeg={progressions.progressedMoon.degInSign}
        progressedMoonPhaseName={progressions.lunarPhase.name}
        convergenceCount={convergence.topConvergences.length}
      />

      {/* ───────────────────────────────────────────────────────────── */}
      {/* ACTIVE ORBIS ALIGNMENT SPOTLIGHT HUD                          */}
      {/* ───────────────────────────────────────────────────────────── */}
      {selection && (
        <div className="glass-strong rounded-3xl border border-gold/50 bg-gradient-to-br from-[#0F1628]/95 via-[#0B0F19]/95 to-[#161208]/95 p-6 sm:p-8 shadow-[0_0_40px_rgba(229,193,88,0.22)] backdrop-blur-2xl animate-fade-in">
          {/* Top Bar: Spotlight Eyebrow + Actions */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-gold/40 bg-gold/15">
                <Orbit size={18} className="text-gold animate-spin-slow" />
              </div>
              <div>
                <span className="font-mono text-[10px] uppercase tracking-[0.24em] text-gold">
                  Active Orbis Alignment Spotlight HUD
                </span>
                <h4 className="font-serif text-lg sm:text-xl font-semibold text-silver">
                  {selection.kind === 'planet'
                    ? `Orbital Telemetry & Psychological Synthesis: ${PLANET_LORE[selection.id].name}`
                    : `Aspect Chord Resonance: ${PLANET_LORE[selection.a].name} ${ASPECT_BY_TYPE[selection.type].label} ${PLANET_LORE[selection.b].name}`}
                </h4>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {handleFocus && (
                <button
                  type="button"
                  onClick={() => handleFocus(selection)}
                  className="flex items-center gap-1.5 rounded-full border border-gold/40 bg-gold/10 px-3 py-1 font-mono text-xs text-gold transition hover:bg-gold/20"
                >
                  <Compass size={13} />
                  <span>Inspect on Wheel</span>
                </button>
              )}
              {onSelect && (
                <button
                  type="button"
                  onClick={() => onSelect(null)}
                  className="flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-3 py-1 font-mono text-xs text-slate-400 transition hover:border-rose-400 hover:text-rose-300"
                >
                  <X size={13} />
                  <span>Clear Focus</span>
                </button>
              )}
            </div>
          </div>

          {/* Planet Spotlight Body */}
          {selection.kind === 'planet' && (() => {
            const p = chart.planets.find((item) => item.id === selection.id);
            if (!p) return null;
            const lore = PLANET_LORE[selection.id];
            const dig = dignities[selection.id];
            const connectedAspects = chart.aspects.filter((a) => a.a === selection.id || a.b === selection.id);

            return (
              <div className="mt-6 space-y-6">
                {/* Key Metrics Chips */}
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6 font-mono text-xs">
                  <div className="rounded-xl border border-white/10 bg-obsidian/60 p-3">
                    <span className="text-[10px] uppercase tracking-wider text-slate-400 block">Zodiac Placement</span>
                    <div className="mt-1 flex items-center gap-1.5 font-semibold text-silver">
                      <ZodiacGlyph sign={p.sign} size={15} color="#E5C158" />
                      <span>{SIGN_NAMES[p.sign]} {p.degInSign.toFixed(1)}°</span>
                    </div>
                  </div>

                  <div className="rounded-xl border border-white/10 bg-obsidian/60 p-3">
                    <span className="text-[10px] uppercase tracking-wider text-slate-400 block">House Anchor</span>
                    <div className="mt-1 font-semibold text-gold">
                      {ordinal(p.house)} House
                    </div>
                  </div>

                  <div className="rounded-xl border border-white/10 bg-obsidian/60 p-3">
                    <span className="text-[10px] uppercase tracking-wider text-slate-400 block">Essential Dignity</span>
                    <div className="mt-1 font-semibold text-silver flex items-center gap-1">
                      <span>{dig.symbol}</span>
                      <span>{dig.label} ({dig.score > 0 ? `+${dig.score}` : dig.score})</span>
                    </div>
                  </div>

                  <div className="rounded-xl border border-white/10 bg-obsidian/60 p-3">
                    <span className="text-[10px] uppercase tracking-wider text-slate-400 block">Orbital Velocity</span>
                    <div className="mt-1 font-semibold text-slate-200">
                      {p.speed.toFixed(2)}°/day · {p.retrograde ? <span className="text-amber-400">Retrograde ℞</span> : <span className="text-emerald-400">Direct</span>}
                    </div>
                  </div>

                  <div className="rounded-xl border border-white/10 bg-obsidian/60 p-3">
                    <span className="text-[10px] uppercase tracking-wider text-slate-400 block">Active Orbs</span>
                    <div className="mt-1 font-semibold text-gold">
                      {connectedAspects.length} Chords Bonded
                    </div>
                  </div>

                  <div className="rounded-xl border border-white/10 bg-obsidian/60 p-3">
                    <span className="text-[10px] uppercase tracking-wider text-slate-400 block">Hellenistic Sect</span>
                    <div className="mt-1 font-semibold text-silver">
                      {sect.sectLight === p.id ? 'Sect Luminary ☉' : sect.beneficOfSect === p.id ? 'Sect Benefic ★' : sect.challengingMalefic === p.id ? 'Contrary Malefic ⚡' : 'Sect Member'}
                    </div>
                  </div>
                </div>

                {/* Deep Psychological Synthesis */}
                <div className="rounded-2xl border border-white/10 bg-obsidian/40 p-5 space-y-3">
                  <div className="flex items-center gap-2">
                    <Sparkles size={14} className="text-gold" />
                    <span className="font-mono text-[10.5px] uppercase tracking-wider text-gold">
                      Psychological Architecture & Archetypal Directive
                    </span>
                  </div>
                  <p className="text-sm leading-relaxed text-slate-200">
                    {planetExplanation(chart, p)}
                  </p>
                  <p className="text-xs leading-relaxed text-slate-400 font-sans border-t border-white/5 pt-2">
                    <strong className="text-gold font-medium">Evolutionary Integration:</strong> As {lore.principle}, this placement in the {housePhrase(p.house)} requires conscious cultivation: {lore.action}.
                  </p>
                </div>
              </div>
            );
          })()}

          {/* Aspect Spotlight Body */}
          {selection.kind === 'aspect' && (() => {
            const def = ASPECT_BY_TYPE[selection.type];
            const asp = chart.aspects.find(
              (a) =>
                ((a.a === selection.a && a.b === selection.b) || (a.a === selection.b && a.b === selection.a)) &&
                a.type === selection.type,
            );
            if (!asp) return null;

            return (
              <div className="mt-6 space-y-6">
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 font-mono text-xs">
                  <div className="rounded-xl border border-white/10 bg-obsidian/60 p-3">
                    <span className="text-[10px] uppercase tracking-wider text-slate-400 block">Resonance Type</span>
                    <div className="mt-1 font-semibold text-silver flex items-center gap-1.5">
                      <span style={{ color: def.color }}>{def.symbol}</span>
                      <span>{def.label} ({def.angle}°)</span>
                    </div>
                  </div>

                  <div className="rounded-xl border border-white/10 bg-obsidian/60 p-3">
                    <span className="text-[10px] uppercase tracking-wider text-slate-400 block">Exact Orb</span>
                    <div className="mt-1 font-semibold text-gold">
                      {formatOrb(asp.orb)} ({asp.strength})
                    </div>
                  </div>

                  <div className="rounded-xl border border-white/10 bg-obsidian/60 p-3">
                    <span className="text-[10px] uppercase tracking-wider text-slate-400 block">Energy Flow</span>
                    <div className="mt-1 font-semibold">
                      {asp.applying ? <span className="text-emerald-400">Applying ↑ (Gathering)</span> : <span className="text-slate-300">Separating ↓ (Integrated)</span>}
                    </div>
                  </div>

                  <div className="rounded-xl border border-white/10 bg-obsidian/60 p-3">
                    <span className="text-[10px] uppercase tracking-wider text-slate-400 block">Geometric Nature</span>
                    <div className="mt-1 font-semibold capitalize text-slate-200">
                      {def.nature} Resonance
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-obsidian/40 p-5 space-y-3">
                  <div className="flex items-center gap-2">
                    <Sparkles size={14} className="text-gold" />
                    <span className="font-mono text-[10.5px] uppercase tracking-wider text-gold">
                      Psychological Synthesis & Chord Harmony
                    </span>
                  </div>
                  <p className="text-sm leading-relaxed text-slate-200">
                    {aspectExplanation(asp)}
                  </p>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* RULE OF THREE CONVERGENCE SCORING PANEL                       */}
      {/* ───────────────────────────────────────────────────────────── */}
      <ConvergencePanel
        convergence={convergence}
        chart={chart}
        selection={selection}
        onSelect={onSelect}
        focusOnWheel={handleFocus}
      />

      {/* ───────────────────────────────────────────────────────────── */}
      {/* FOUR-CLOCK DEDICATED PREDICTIVE PANELS HUD                    */}
      {/* ───────────────────────────────────────────────────────────── */}
      <PredictiveClocksGrid
        chart={chart}
        progressions={progressions}
        solarReturn={solarReturn}
        lots={lots}
        profection={profection}
        eclipsesAndReturns={eclipsesAndReturns}
        selection={selection}
        onSelect={onSelect}
        focusOnWheel={handleFocus}
      />

      {/* ───────────────────────────────────────────────────────────── */}
      {/* PART A0: SECT LIGHT & NATAL LUNAR PHASE MODULE                */}
      {/* ───────────────────────────────────────────────────────────── */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Card 1: Chart Sect Engine */}
        <div className="glass relative overflow-hidden p-6 transition hover:border-gold/30">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-gold">
              Hellenistic Sect Engine
            </span>
            <div className="flex items-center gap-1.5 rounded-full border border-gold/30 bg-gold/10 px-2.5 py-0.5 font-mono text-[10px] font-semibold text-gold">
              {sect.isDayChart ? <Sun size={12} className="text-gold" /> : <Moon size={12} className="text-silver" />}
              <span>{sect.sectName}</span>
            </div>
          </div>

          <h4 className="mt-3 font-serif text-xl font-semibold text-silver">
            {sect.title}
          </h4>
          <p className="mt-2 text-xs leading-relaxed text-slate-300">
            {sect.summary}
          </p>

          <div className="mt-4 grid grid-cols-3 gap-2 border-t border-white/10 pt-3 font-mono text-[10px]">
            <div>
              <span className="text-slate-500 block uppercase tracking-wider text-[9px]">Sect Light</span>
              <span className="font-semibold text-gold capitalize flex items-center gap-1 mt-0.5">
                {sect.sectLight === 'sun' ? '☉ Sun' : '☽ Moon'}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block uppercase tracking-wider text-[9px]">Sect Benefic</span>
              <span className="font-semibold text-emerald-300 capitalize flex items-center gap-1 mt-0.5">
                {sect.beneficOfSect === 'jupiter' ? '♃ Jupiter' : '♀ Venus'}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block uppercase tracking-wider text-[9px]">Contrary Malefic</span>
              <span className="font-semibold text-rose-300 capitalize flex items-center gap-1 mt-0.5">
                {sect.challengingMalefic === 'mars' ? '♂ Mars' : '♄ Saturn'}
              </span>
            </div>
          </div>
        </div>

        {/* Card 2: 8-fold Natal Lunar Phase Family */}
        <div className="glass relative overflow-hidden p-6 transition hover:border-astral/30">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-astral">
              8-fold Natal Lunar Phase
            </span>
            <span className="rounded-full border border-astral/30 bg-astral/10 px-2.5 py-0.5 font-mono text-[10px] text-astral">
              Δ {lunarPhase.formattedElongation}
            </span>
          </div>

          <div className="mt-3 flex items-center gap-3">
            <LunarPhaseIcon phase={lunarPhase.phaseKey} size={32} />
            <div>
              <h4 className="font-serif text-xl font-semibold text-silver">
                {lunarPhase.name}
              </h4>
              <p className="font-mono text-xs text-gold">
                Archetype: {lunarPhase.archetype}
              </p>
            </div>
          </div>

          <p className="mt-3 text-xs leading-relaxed text-slate-300">
            {lunarPhase.lifePulse}
          </p>

          <div className="mt-4 border-t border-white/10 pt-3">
            <p className="font-mono text-[10px] text-slate-400">
              <span className="text-astral font-semibold">Growth Rhythm:</span> {lunarPhase.growthRhythm}
            </p>
          </div>
        </div>
      </div>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* PART A: THE CORE TRIAD                                       */}
      {/* ───────────────────────────────────────────────────────────── */}
      <div>
        <div className="flex items-center gap-2 border-b border-white/10 pb-3">
          <Sparkles size={16} className="text-gold" />
          <h3 className="font-serif text-2xl font-semibold text-silver">
            The Core Triad: Sun, Moon & Rising
          </h3>
        </div>
        <p className="mt-2 text-sm text-slate-400">
          Your fundamental trinity: the solar core will, lunar emotional sanctuary, and ascendant outer boundary.
        </p>

        {/* 3 Triad Cards */}
        <div className="mt-6 grid gap-6 md:grid-cols-3">
          {triad.cards.map((card) => {
            const isSun = card.key === 'sun';
            const isMoon = card.key === 'moon';
            const ascSign = Math.floor(chart.asc / 30);
            const ascRuler = SIGN_RULERS[ascSign];

            const isRisingMatch =
              card.key === 'rising' &&
              (selection?.kind === 'planet'
                ? selection.id === ascRuler || chart.planets.some((p) => p.house === 1 && p.id === selection.id)
                : selection?.kind === 'aspect'
                ? selection.a === ascRuler ||
                  selection.b === ascRuler ||
                  chart.planets.some((p) => p.house === 1 && (p.id === selection.a || p.id === selection.b))
                : false);

            const isTriadHighlighted =
              (selection?.kind === 'planet' && (selection.id === card.key || isRisingMatch)) ||
              (selection?.kind === 'aspect' && (selection.a === card.key || selection.b === card.key || isRisingMatch));

            return (
              <div
                key={card.key}
                className={`glass relative flex flex-col justify-between overflow-hidden p-6 transition-all duration-300 ${
                  isTriadHighlighted
                    ? 'border-2 border-gold/90 bg-gold/15 shadow-[0_0_35px_rgba(229,193,88,0.3)] ring-1 ring-gold/40'
                    : 'hover:border-gold/30 hover:bg-white/[0.07]'
                }`}
              >
                <div>
                  {/* Card Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-gold">
                        {card.title}
                      </span>
                      {isTriadHighlighted && (
                        <span className="rounded-full bg-gold/20 px-2 py-0.5 font-mono text-[9px] font-bold text-gold border border-gold/40 animate-pulse">
                          {card.key === 'rising' && selection?.kind === 'planet' && selection.id === ascRuler
                            ? '★ Chart Ruler'
                            : '★ Active Orbit'}
                        </span>
                      )}
                    </div>
                    <div className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/5">
                      {isSun && <Sun size={15} className="text-gold" />}
                      {isMoon && <Moon size={15} className="text-silver" />}
                      {!isSun && !isMoon && <UserCheck size={15} className="text-astral" />}
                    </div>
                  </div>

                  <div className="mt-3 flex items-center gap-3">
                    <ZodiacGlyph sign={card.sign} size={28} color="#E5C158" />
                    <div>
                      <h4 className="font-serif text-2xl font-semibold text-silver">
                        {SIGN_NAMES[card.sign]}
                      </h4>
                      <p className="font-mono text-xs text-slate-400">
                        {card.label} · {card.degree}
                      </p>
                    </div>
                  </div>

                  {/* Body text */}
                  <p className="mt-4 text-xs leading-relaxed text-slate-300">
                    {card.body}
                  </p>
                </div>

                {/* Footer tags */}
                <div className="mt-6 border-t border-white/10 pt-4">
                  {card.note && (
                    <div className="mb-2 font-mono text-[9.5px] text-gold font-medium">
                      ✦ {card.note}
                    </div>
                  )}
                  <div className="flex flex-wrap gap-1.5">
                    {card.keywords.map((kw) => (
                      <span
                        key={kw}
                        className="rounded-full border border-white/10 bg-obsidian/60 px-2.5 py-0.5 font-mono text-[9.5px] text-slate-300"
                      >
                        {kw}
                      </span>
                    ))}
                  </div>
                  <div className="mt-2.5 flex items-center justify-between font-mono text-[10px] text-slate-500">
                    <span className="capitalize">Element: {card.element}</span>
                    <span className="capitalize">Modality: {card.modality}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Unified Triad Alchemy Synthesis Box */}
        <div className="glass-strong mt-6 rounded-2xl border border-gold/30 p-6 shadow-2xl">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[10px] uppercase tracking-[0.24em] text-gold">
              Triad Alchemy & Synthesis
            </span>
          </div>
          <p className="mt-3 text-sm leading-relaxed text-slate-200">
            {triad.synthesis}
          </p>
        </div>

        {/* Modulating Resonance Box when another planet is selected */}
        {selection?.kind === 'planet' && selection.id !== 'sun' && selection.id !== 'moon' && (() => {
          const selPos = chart.planets.find((p) => p.id === selection.id);
          const selLore = PLANET_LORE[selection.id];
          return (
            <div className="glass-strong mt-6 rounded-2xl border border-gold/40 bg-gradient-to-r from-gold/10 via-[#0D1322] to-[#0A0E17] p-6 shadow-xl animate-fade-in">
              <div className="flex items-center gap-2">
                <Sparkles size={15} className="text-gold" />
                <span className="font-mono text-[10px] uppercase tracking-[0.24em] text-gold">
                  Modulating Influence: How {selLore.name} Modulates Your Core Triad
                </span>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-slate-200">
                While your Sun in {SIGN_NAMES[chart.planets.find((p) => p.id === 'sun')?.sign ?? 0]} anchors your solar purpose and your Moon in {SIGN_NAMES[chart.planets.find((p) => p.id === 'moon')?.sign ?? 0]} provides emotional sanctuary, active orbit <strong className="text-gold">{selLore.name} in {selPos ? SIGN_NAMES[selPos.sign] : ''}</strong> acts as a decisive modulating lens. In your {selPos ? housePhrase(selPos.house) : ''}, {selLore.name} dictates how your Core Triad converts internal purpose into concrete worldly expression: <span className="text-slate-300 italic">{selLore.action}</span>.
              </p>
            </div>
          );
        })()}

        {/* Modulating Resonance Box when an aspect chord is selected */}
        {selection?.kind === 'aspect' && (() => {
          const def = ASPECT_BY_TYPE[selection.type];
          const loreA = PLANET_LORE[selection.a];
          const loreB = PLANET_LORE[selection.b];
          return (
            <div className="glass-strong mt-6 rounded-2xl border border-gold/40 bg-gradient-to-r from-gold/10 via-[#0D1322] to-[#0A0E17] p-6 shadow-xl animate-fade-in">
              <div className="flex items-center gap-2">
                <Sparkles size={15} className="text-gold" />
                <span className="font-mono text-[10px] uppercase tracking-[0.24em] text-gold">
                  Aspect Geometry Resonance: How {loreA.name} {def.label} {loreB.name} Conditions Your Core Triad
                </span>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-slate-200">
                This active <strong className="text-gold">{loreA.name}–{loreB.name} {def.label.toLowerCase()}</strong> creates an energetic circuit between <span className="text-slate-200 font-medium">{loreA.principle}</span> and <span className="text-slate-200 font-medium">{loreB.principle}</span>. It acts as an internal tuning frequency that directly conditions how your Sun (will), Moon (needs), and Rising (outer agency) cooperate in your day-to-day choices.
              </p>
            </div>
          );
        })()}
      </div>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* PART A1: PTOLEMAIC ESSENTIAL DIGNITY & PATTERNS HUB           */}
      {/* ───────────────────────────────────────────────────────────── */}
      <div className="space-y-6">
        <div className="flex items-center gap-2 border-b border-white/10 pb-3">
          <Crown size={16} className="text-gold" />
          <h3 className="font-serif text-2xl font-semibold text-silver">
            Essential Dignities & Aspect Patterns
          </h3>
        </div>

        {/* Dignity Scorecard Chips */}
        <div className="glass p-6">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-gold">
              Ptolemaic Essential Dignity Scorecard
            </span>
            <span className="font-mono text-[10px] text-slate-400">
              Domicile (+5) · Exaltation (+4) · Detriment (−5) · Fall (−4)
            </span>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
            {PLANET_IDS.map((id) => {
              const dig = dignities[id];
              const pPos = chart.planets.find((p) => p.id === id)!;
              const isDom = dig.status === 'domicile';
              const isExalt = dig.status === 'exaltation';
              const isDet = dig.status === 'detriment';
              const isFall = dig.status === 'fall';

              const chipColor = isDom
                ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300'
                : isExalt
                ? 'border-amber-500/40 bg-amber-500/10 text-amber-300'
                : isDet
                ? 'border-rose-500/40 bg-rose-500/10 text-rose-300'
                : isFall
                ? 'border-orange-500/40 bg-orange-500/10 text-orange-300'
                : 'border-white/10 bg-white/5 text-slate-400';

              return (
                <div
                  key={id}
                  className={`rounded-xl border p-3 flex flex-col justify-between transition hover:border-gold/40 ${chipColor}`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-serif text-sm font-semibold text-silver">
                      {PLANET_LORE[id].name}
                    </span>
                    <span className="text-xs">{dig.symbol}</span>
                  </div>
                  <div className="mt-2 font-mono text-[10px]">
                    <div className="text-silver font-medium">{SIGN_NAMES[pPos.sign]}</div>
                    <div className="text-[9.5px] opacity-80 mt-0.5">{dig.label} ({dig.score > 0 ? `+${dig.score}` : dig.score})</div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Mutual Receptions Banner */}
          {mutualReceptions.length > 0 && (
            <div className="mt-5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4">
              <div className="flex items-center gap-2 text-emerald-300 font-mono text-xs font-semibold">
                <ArrowRightLeft size={14} />
                <span>Mutual Reception Detected:</span>
              </div>
              {mutualReceptions.map((mr, i) => (
                <div key={i} className="mt-2 text-xs leading-relaxed text-slate-200">
                  <span className="font-semibold text-emerald-300">{mr.label}: </span>
                  {mr.description}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Aspect Pattern Formations */}
        <div className="glass p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Orbit size={15} className="text-gold" />
              <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-gold">
                Geometric Aspect Pattern Formations
              </span>
            </div>
            <span className="font-mono text-[10px] text-slate-400">
              {patterns.length > 0 ? `${patterns.length} Pattern(s) Identified` : 'Open Geometry'}
            </span>
          </div>

          {patterns.length > 0 ? (
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              {patterns.map((pat) => (
                <div
                  key={pat.id}
                  className="glass-strong rounded-xl border border-white/10 p-5 transition hover:border-gold/40"
                >
                  <div className="flex items-center justify-between">
                    <h5 className="font-serif text-lg font-semibold text-silver">
                      {pat.name}
                    </h5>
                    <span className="rounded-full border border-gold/40 bg-gold/10 px-2.5 py-0.5 font-mono text-[9px] uppercase tracking-wider text-gold">
                      {pat.type}
                    </span>
                  </div>

                  <p className="mt-2 text-xs font-medium text-gold">
                    {pat.headline}
                  </p>

                  <p className="mt-2 text-xs leading-relaxed text-slate-300">
                    {pat.description}
                  </p>

                  {/* Release Point for T-Square or Yod */}
                  {pat.releasePoint && (
                    <div className="mt-3.5 rounded-lg border border-astral/30 bg-astral/10 p-2.5 font-mono text-[10px] text-astral">
                      <span className="font-semibold">✦ Focal Release Point: </span>
                      {pat.releasePoint.formattedLon} — {pat.releasePoint.description}
                    </div>
                  )}

                  <div className="mt-4 flex items-center gap-1.5 border-t border-white/10 pt-3">
                    <span className="font-mono text-[10px] text-slate-500 uppercase tracking-wider">Planets:</span>
                    <div className="flex flex-wrap gap-2">
                      {pat.planets.map((pId) => (
                        <span key={pId} className="flex items-center gap-1 rounded bg-white/5 px-2 py-0.5 font-mono text-[10px] text-slate-300">
                          <PlanetGlyph planet={pId} size={11} color="#E5C158" />
                          <span>{PLANET_LORE[pId].name}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-4 rounded-xl border border-white/5 bg-white/[0.02] p-5 text-center">
              <p className="font-serif text-base font-semibold text-silver">
                Free-Flowing Open Geometry
              </p>
              <p className="mt-1 text-xs text-slate-400 max-w-xl mx-auto">
                No rigid closed geometric traps (Grand Trines, T-Squares, Grand Crosses) lock your chart. Your placements communicate through flexible, fluid aspects, giving you high adaptive agency.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* PART B: PERSONALIZED HOROSCOPE TABS                           */}
      {/* ───────────────────────────────────────────────────────────── */}
      <div>
        {/* Navigation Tabs */}
        <div className="flex flex-wrap items-center gap-3 border-b border-white/10 pb-4">
          <button
            type="button"
            onClick={() => setActiveTab('love')}
            className={`flex items-center gap-2 rounded-xl px-5 py-2.5 font-sans text-sm font-medium transition ${
              activeTab === 'love'
                ? 'border border-gold/50 bg-gold/15 text-gold'
                : recommendedTab === 'love'
                ? 'border border-gold/40 bg-gold/5 text-slate-200'
                : 'border border-white/10 text-slate-400 hover:text-silver'
            }`}
          >
            <Heart size={15} />
            <span>1. Love & Magnetism</span>
            {recommendedTab === 'love' && (
              <span className="ml-1 rounded-full bg-gold/20 px-2 py-0.5 font-mono text-[9px] font-bold text-gold border border-gold/40 animate-pulse">
                ✦ Aligned
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('career')}
            className={`flex items-center gap-2 rounded-xl px-5 py-2.5 font-sans text-sm font-medium transition ${
              activeTab === 'career'
                ? 'border border-gold/50 bg-gold/15 text-gold'
                : recommendedTab === 'career'
                ? 'border border-gold/40 bg-gold/5 text-slate-200'
                : 'border border-white/10 text-slate-400 hover:text-silver'
            }`}
          >
            <Briefcase size={15} />
            <span>2. Career & Purpose</span>
            {recommendedTab === 'career' && (
              <span className="ml-1 rounded-full bg-gold/20 px-2 py-0.5 font-mono text-[9px] font-bold text-gold border border-gold/40 animate-pulse">
                ✦ Aligned
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('profection')}
            className={`flex items-center gap-2 rounded-xl px-5 py-2.5 font-sans text-sm font-medium transition ${
              activeTab === 'profection'
                ? 'border border-gold/50 bg-gold/15 text-gold'
                : recommendedTab === 'profection'
                ? 'border border-gold/40 bg-gold/5 text-slate-200'
                : 'border border-white/10 text-slate-400 hover:text-silver'
            }`}
          >
            <Hourglass size={15} />
            <span>3. Annual & Monthly Profections ({currentYear} Chapter)</span>
            {recommendedTab === 'profection' && (
              <span className="ml-1 rounded-full bg-gold/20 px-2 py-0.5 font-mono text-[9px] font-bold text-gold border border-gold/40 animate-pulse">
                ✦ Aligned
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('forecast')}
            className={`flex items-center gap-2 rounded-xl px-5 py-2.5 font-sans text-sm font-medium transition ${
              activeTab === 'forecast'
                ? 'border border-gold/50 bg-gold/15 text-gold'
                : recommendedTab === 'forecast'
                ? 'border border-gold/40 bg-gold/5 text-slate-200'
                : 'border border-white/10 text-slate-400 hover:text-silver'
            }`}
          >
            <Calendar size={15} />
            <span>4. Monthly Cosmic Forecast ({forecast.monthLabel} Overlay)</span>
            {recommendedTab === 'forecast' && (
              <span className="ml-1 rounded-full bg-gold/20 px-2 py-0.5 font-mono text-[9px] font-bold text-gold border border-gold/40 animate-pulse">
                ✦ Aligned
              </span>
            )}
          </button>
        </div>

        {/* Tab 1: Love & Magnetism */}
        {activeTab === 'love' && (
          <div className="animate-fade-up mt-8 space-y-6">
            <div className="glass p-6">
              <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-gold">
                Romantic Signature & Attraction Geometry
              </span>
              <h4 className="mt-2 font-serif text-2xl font-semibold text-silver">
                {loveReading.headline}
              </h4>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              {loveReading.sections.map((sec) => (
                <div key={sec.title} className="glass p-6">
                  <div className="flex items-center justify-between">
                    <h5 className="font-serif text-lg font-semibold text-silver">{sec.title}</h5>
                    <span className="font-mono text-[10.5px] text-gold">{sec.meta}</span>
                  </div>
                  <p className="mt-3 text-xs leading-relaxed text-slate-300">{sec.body}</p>
                </div>
              ))}
            </div>

            {/* Romance Transit Forecast Box */}
            <div className="glass-strong rounded-2xl border border-pink-500/30 p-6">
              <div className="flex items-center gap-2">
                <Heart size={15} className="text-pink-400" />
                <span className="font-mono text-[10.5px] uppercase tracking-[0.2em] text-pink-400">
                  {loveReading.forecastTitle}
                </span>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-slate-200">
                {loveReading.forecast}
              </p>
            </div>
          </div>
        )}

        {/* Tab 2: Career & Purpose */}
        {activeTab === 'career' && (
          <div className="animate-fade-up mt-8 space-y-6">
            <div className="glass p-6">
              <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-gold">
                Vocational Blueprint & Midheaven Mastery
              </span>
              <h4 className="mt-2 font-serif text-2xl font-semibold text-silver">
                {careerReading.headline}
              </h4>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              {careerReading.sections.map((sec) => (
                <div key={sec.title} className="glass p-6">
                  <div className="flex items-center justify-between">
                    <h5 className="font-serif text-lg font-semibold text-silver">{sec.title}</h5>
                    <span className="font-mono text-[10.5px] text-gold">{sec.meta}</span>
                  </div>
                  <p className="mt-3 text-xs leading-relaxed text-slate-300">{sec.body}</p>
                </div>
              ))}
            </div>

            {/* Career Transit Forecast Box */}
            <div className="glass-strong rounded-2xl border border-amber-500/30 p-6">
              <div className="flex items-center gap-2">
                <Briefcase size={15} className="text-gold" />
                <span className="font-mono text-[10.5px] uppercase tracking-[0.2em] text-gold">
                  {careerReading.forecastTitle}
                </span>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-slate-200">
                {careerReading.forecast}
              </p>
            </div>
          </div>
        )}

        {/* Tab 3: Annual Profection & Time-Lord (2026 Chapter) */}
        {activeTab === 'profection' && (
          <div className="animate-fade-up mt-8 space-y-6">
            <div className="glass p-6">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-gold">
                  Hellenistic Annual Profection Chapter · Year {currentYear}
                </span>
                <span className="rounded-full border border-gold/40 bg-gold/10 px-2.5 py-0.5 font-mono text-[10px] font-semibold text-gold">
                  Age {profection.age} · {ordinal(profection.annualHouse)} House ({profection.annualSignName})
                </span>
              </div>
              <h4 className="mt-2 font-serif text-2xl font-semibold text-silver">
                {profectionReading.headline}
              </h4>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              {profectionReading.sections.map((sec) => (
                <div key={sec.title} className="glass p-6">
                  <div className="flex items-center justify-between">
                    <h5 className="font-serif text-lg font-semibold text-silver">{sec.title}</h5>
                    <span className="font-mono text-[10.5px] text-gold">{sec.meta}</span>
                  </div>
                  <p className="mt-3 text-xs leading-relaxed text-slate-300">{sec.body}</p>
                </div>
              ))}
            </div>

            {/* Monthly Sub-Chapter Card */}
            <div className="glass-strong rounded-2xl border border-sky-400/30 p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Hourglass size={15} className="text-sky-400" />
                  <span className="font-mono text-[10.5px] uppercase tracking-[0.2em] text-sky-400">
                    Monthly Profection Sub-Chapter · {forecast.monthLabel}
                  </span>
                </div>
                <span className="rounded-full border border-sky-400/40 bg-sky-400/10 px-2.5 py-0.5 font-mono text-[10px] text-sky-300 font-semibold">
                  {ordinal(profection.monthlyHouse)} House · {profection.monthlySignName}
                </span>
              </div>
              <div className="mt-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <PlanetGlyph planet={profection.monthlyTimeLord} size={16} color={PLANET_LORE[profection.monthlyTimeLord].color} />
                  <span className="font-serif text-base font-bold text-silver">
                    Monthly Time-Lord: {profection.monthlyTimeLordName}
                  </span>
                  <span className="font-mono text-[10px] text-slate-400">
                    ({profection.monthlyDignity.label})
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    onSelect?.({ kind: 'planet', id: profection.monthlyTimeLord });
                    handleFocus?.({ kind: 'planet', id: profection.monthlyTimeLord });
                  }}
                  className="rounded-full border border-sky-400/40 bg-sky-400/10 px-2.5 py-0.5 font-mono text-[9px] text-sky-300 hover:bg-sky-400/20"
                >
                  Inspect on Wheel
                </button>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-slate-300">
                In Hellenistic astrology, profections advance sequentially by 1 Whole-Sign house per month from your solar return birthday. During {forecast.monthLabel}, {profection.monthlyTimeLordName} acts as your tactical Monthly Time-Lord directing the affairs of your {ordinal(profection.monthlyHouse)} House.
              </p>
            </div>

            {/* Annual Time-Lord Strategic Action Box */}
            <div className="glass-strong rounded-2xl border border-astral/40 p-6">
              <div className="flex items-center gap-2">
                <Hourglass size={15} className="text-astral" />
                <span className="font-mono text-[10.5px] uppercase tracking-[0.2em] text-astral">
                  {profectionReading.forecastTitle}
                </span>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-slate-200">
                {profectionReading.forecast}
              </p>
            </div>
          </div>
        )}

        {/* Tab 4: Monthly Cosmic Forecast (2026 Transit Overlay) */}
        {activeTab === 'forecast' && (
          <div className="animate-fade-up mt-8 space-y-6">
            <div className="glass p-6">
              <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-gold">
                Ephemeris Transit Overlay · {forecast.monthLabel}
              </span>
              <h4 className="mt-2 font-serif text-2xl font-semibold text-silver">
                Planetary Transit Interactions with Your Natal Graph
              </h4>
              <p className="mt-3 text-sm leading-relaxed text-slate-300">
                {forecast.intro}
              </p>
            </div>

            {/* Active Orbit Transit Focus Banner */}
            {selection && (
              <div className="glass-strong flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-gold/40 bg-gradient-to-r from-gold/15 via-[#0E1526] to-[#0A0E17] p-4 shadow-[0_0_20px_rgba(229,193,88,0.15)]">
                <div className="flex items-center gap-2.5">
                  <Sparkles size={16} className="text-gold" />
                  <div>
                    <span className="font-mono text-[10px] uppercase tracking-widest text-gold block">
                      Orbit Transit Filter Active
                    </span>
                    <span className="font-serif text-sm font-semibold text-silver">
                      {selection.kind === 'planet'
                        ? `Tracking ${forecast.events.filter(isEventAffectingSelection).length} Transit Windows for ${PLANET_LORE[selection.id].name}`
                        : `Tracking Transits Impacting ${PLANET_LORE[selection.a].name} & ${PLANET_LORE[selection.b].name}`}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setTransitFilterFocusedOnly(!transitFilterFocusedOnly)}
                  className={`rounded-full px-3 py-1 font-mono text-xs transition ${
                    transitFilterFocusedOnly
                      ? 'border border-gold bg-gold text-obsidian font-semibold shadow-md'
                      : 'border border-gold/40 bg-gold/10 text-gold hover:bg-gold/20'
                  }`}
                >
                  {transitFilterFocusedOnly ? 'Showing Matching Transits Only' : 'Filter to Matching Transits Only'}
                </button>
              </div>
            )}

            {/* Timeline of Transit Events */}
            <div className="space-y-4">
              <h5 className="font-mono text-xs uppercase tracking-wider text-slate-400">
                Key Astrological Windows & Opportunity Dates:
              </h5>

              <div className="grid gap-4 md:grid-cols-2">
                {displayedEvents.length === 0 ? (
                  <div className="col-span-full rounded-2xl border border-white/10 bg-obsidian/40 p-8 text-center animate-fade-in">
                    <p className="font-serif text-base font-semibold text-silver">
                      No direct transit windows intersect with this placement during {forecast.monthLabel}.
                    </p>
                    <p className="mt-1.5 text-xs text-slate-400 max-w-md mx-auto">
                      This orbit operates in steady background equilibrium this month without disruptive outer-planet trigger windows.
                    </p>
                    <button
                      type="button"
                      onClick={() => setTransitFilterFocusedOnly(false)}
                      className="mt-4 rounded-full border border-gold/40 bg-gold/10 px-4 py-1.5 font-mono text-xs text-gold hover:bg-gold/20"
                    >
                      View All {forecast.events.length} Monthly Transits
                    </button>
                  </div>
                ) : (
                  displayedEvents.map((ev, i) => {
                    const isOpportunity = ev.kind === 'opportunity';
                    const isLunation = ev.kind === 'lunation';
                    const isStation = ev.kind === 'station';
                    const isMatching = isEventAffectingSelection(ev);

                    const badgeColor = isOpportunity
                      ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300'
                      : isLunation
                      ? 'border-gold/40 bg-gold/10 text-gold'
                      : isStation
                      ? 'border-astral/40 bg-astral/10 text-astral'
                      : 'border-rose-500/40 bg-rose-500/10 text-rose-300';

                    return (
                      <div
                        key={`${ev.title}-${i}`}
                        className={`glass flex flex-col justify-between p-5 transition-all duration-300 ${
                          isMatching
                            ? 'border-gold/60 bg-gold/[0.06] shadow-[0_0_22px_rgba(229,193,88,0.18)] hover:border-gold'
                            : 'hover:border-white/20 hover:bg-white/[0.07]'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Calendar size={13} className="text-gold" />
                              <span className="font-mono text-xs font-semibold text-silver">
                                {fmtDate(ev.date, { month: 'short', day: 'numeric', year: 'numeric' })}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              {isMatching && (
                                <span className="rounded-full bg-gold/20 px-2 py-0.5 font-mono text-[9px] font-bold text-gold border border-gold/40">
                                  ★ Orbit Hit
                                </span>
                              )}
                              <span className={`rounded-full border px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider ${badgeColor}`}>
                                {ev.kind}
                              </span>
                            </div>
                          </div>

                          <h6 className="mt-3 font-serif text-lg font-semibold text-silver">
                            {ev.title}
                          </h6>
                          <p className="font-mono text-[10px] text-slate-400">{ev.meta}</p>

                          <p className="mt-2.5 text-xs leading-relaxed text-slate-300">
                            {ev.body}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
