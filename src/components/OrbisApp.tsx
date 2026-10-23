import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  calculateNatalChart,
  zoneOffsetHours,
  ASPECT_BY_TYPE,
  SIGN_NAMES,
  formatOrb,
  type AspectType,
  type BirthInput,
  type NatalChart,
  type PlanetId,
} from '@/lib/astroEngine';
import { CITIES, PRESETS, cityById, type ChartPreset } from '@/lib/cities';
import { PLANET_LORE } from '@/lib/zodiacData';
import { PlanetGlyph } from './svg/AstroGlyphs';
import { Crosshair, X } from 'lucide-react';
import Header from './Header';
import BirthCommandCenter, { type BirthFormState } from './BirthCommandCenter';
import NatalWheelSVG from './NatalWheelSVG';
import TelemetryPanel from './TelemetryPanel';
import ActiveOrbs from './ActiveOrbs';
import HoroscopeDashboard from './HoroscopeDashboard';
import OrbisAlignmentRemedies from './OrbisAlignmentRemedies';
import Footer from './Footer';

export type Selection = { kind: 'planet'; id: PlanetId } | { kind: 'aspect'; a: PlanetId; b: PlanetId; type: AspectType } | null;
export type Phase = 'ambient' | 'calculating' | 'locked';

export const sameSelection = (x: Selection, y: Selection) => {
  if (!x || !y || x.kind !== y.kind) return false;
  if (x.kind === 'planet' && y.kind === 'planet') return x.id === y.id;
  if (x.kind === 'aspect' && y.kind === 'aspect') {
    return (x.a === y.a && x.b === y.b) || (x.a === y.b && x.b === y.a);
  }
  return false;
};

const formFromPreset = (p: ChartPreset): BirthFormState => {
  const city = cityById(p.cityId) ?? CITIES[0];
  return {
    name: p.name, date: p.date, time: p.time, unknownTime: false, cityId: city.id,
    customLat: String(city.lat), customLng: String(city.lng), customOffset: String(city.utcOffset),
  };
};

export function formToInput(f: BirthFormState): BirthInput {
  if (f.cityId === 'custom') {
    return {
      name: f.name.trim() || 'Untitled Chart', date: f.date, time: f.time, unknownTime: f.unknownTime,
      lat: Number(f.customLat), lng: Number(f.customLng), utcOffset: Number(f.customOffset),
      locationLabel: `Custom · ${Number(f.customLat).toFixed(2)}, ${Number(f.customLng).toFixed(2)}`,
    };
  }
  const city = cityById(f.cityId) ?? CITIES[0];
  const time = f.unknownTime ? '12:00' : f.time;
  return {
    name: f.name.trim() || 'Untitled Chart', date: f.date, time: f.time, unknownTime: f.unknownTime,
    lat: city.lat, lng: city.lng, timezone: city.timezone,
    utcOffset: zoneOffsetHours(city.timezone, f.date, time, city.utcOffset),
    locationLabel: `${city.name}, ${city.country}`,
  };
}

export default function OrbisApp() {
  const [form, setForm] = useState<BirthFormState>(() => formFromPreset(PRESETS[0]));
  const [chart, setChart] = useState<NatalChart>(() => calculateNatalChart(formToInput(formFromPreset(PRESETS[0]))));
  const [activePreset, setActivePreset] = useState<string | null>(PRESETS[0].id);
  const [phase, setPhase] = useState<Phase>('ambient');
  const [selection, setSelection] = useState<Selection>(null);
  const [aspectFilter, setAspectFilter] = useState<AspectType | 'all'>('all');
  const timer = useRef<number | undefined>(undefined);

  // First-load ritual: ambient orbit, then lock into the default chart.
  useEffect(() => {
    timer.current = window.setTimeout(() => setPhase('locked'), 1600);
    return () => window.clearTimeout(timer.current);
  }, []);

  const runCalculation = useCallback((input: BirthInput) => {
    window.clearTimeout(timer.current);
    setPhase('calculating');
    setSelection(null);
    timer.current = window.setTimeout(() => {
      setChart(calculateNatalChart(input));
      setPhase('locked');
    }, 1100);
  }, []);

  const handleSubmit = useCallback(() => runCalculation(formToInput(form)), [form, runCalculation]);

  const handlePreset = useCallback(
    (p: ChartPreset) => {
      const f = formFromPreset(p);
      setForm(f);
      setActivePreset(p.id);
      runCalculation(formToInput(f));
    },
    [runCalculation],
  );

  const updateForm = useCallback((patch: Partial<BirthFormState>) => {
    setForm((f) => ({ ...f, ...patch }));
    setActivePreset(null);
  }, []);

  const handleNewChart = useCallback(() => {
    setForm((f) => ({ ...f, name: '' }));
    setActivePreset(null);
    document.getElementById('command-center')?.scrollIntoView({ behavior: 'smooth' });
    window.setTimeout(() => document.getElementById('chart-name')?.focus(), 500);
  }, []);

  const focusOnWheel = useCallback((sel: Selection) => {
    setSelection(sel);
    document.getElementById('natal-graph')?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  const chartKey = useMemo(() => `${chart.jd}-${chart.input.lat}-${chart.input.lng}-${chart.solarChart}`, [chart]);

  return (
    <div className="relative min-h-screen overflow-x-hidden">
      <Header onNewChart={handleNewChart} chart={chart} />
      <main className={`transition-all duration-300 ${selection ? 'pb-24 sm:pb-28' : ''}`}>
        <BirthCommandCenter
          form={form}
          onChange={updateForm}
          onSubmit={handleSubmit}
          onPreset={handlePreset}
          activePreset={activePreset}
          chart={chart}
          phase={phase}
          selection={selection}
          onSelect={setSelection}
          focusOnWheel={focusOnWheel}
        />

        <section id="natal-graph" className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 scroll-mt-16 sm:scroll-mt-20">
          <SectionHeading
            eyebrow="01 · Natal Graph"
            title="The Orbis Wheel"
            subtitle="Your exact sky at the moment of birth — zodiac, houses, planetary nodes and the web of orbs that binds them. Hover or tap any planet or aspect line to inspect its orb of influence."
          />
          <div className="mt-12 grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
            <NatalWheelSVG
              key={chartKey}
              chart={chart}
              selection={selection}
              onSelect={setSelection}
              filter={aspectFilter}
              onFilter={setAspectFilter}
              calculating={phase === 'calculating'}
            />
            <TelemetryPanel chart={chart} selection={selection} onSelect={setSelection} />
          </div>
        </section>

        <section id="active-orbs" className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 scroll-mt-16 sm:scroll-mt-20">
          <SectionHeading
            eyebrow="02 · Active Orbs"
            title="Orbs of Influence"
            subtitle="Every major aspect in your chart, ranked by orb. The tighter the orb, the stronger the gravitational pull between two planetary energies."
          />
          <ActiveOrbs
            key={chartKey}
            chart={chart}
            selection={selection}
            onSelect={setSelection}
            onFocus={focusOnWheel}
            focusOnWheel={focusOnWheel}
            filter={aspectFilter}
            onFilter={setAspectFilter}
          />
        </section>

        <section id="horoscope" className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 scroll-mt-16 sm:scroll-mt-20">
          <SectionHeading
            eyebrow="03 · Horoscope & Forecasts"
            title="Your Graph, Decoded"
            subtitle="Readings composed strictly from your calculated placements — signs, houses, rulers, orbs and the live transits crossing your chart."
          />
          <HoroscopeDashboard
            key={chartKey}
            chart={chart}
            selection={selection}
            onSelect={setSelection}
            onFocus={focusOnWheel}
            focusOnWheel={focusOnWheel}
          />
        </section>

        <section id="remedies" className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 scroll-mt-16 sm:scroll-mt-20">
          <SectionHeading
            eyebrow="04 · Cosmic Remedies"
            title="Orbis Alignment"
            subtitle="Four concrete moves derived from your tightest orbs, elemental imbalance, Mercury signature and sharpest tension."
          />
          <OrbisAlignmentRemedies
            key={chartKey}
            chart={chart}
            selection={selection}
            onSelect={setSelection}
            onFocus={focusOnWheel}
            focusOnWheel={focusOnWheel}
          />
        </section>
      </main>

      {/* Floating Global Orbis Focus Controller Bar */}
      {selection && (
        <aside
          aria-label="Orbit Focus Controller"
          className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 w-[calc(100%-2rem)] max-w-4xl"
        >
          <div className="glass-strong flex flex-wrap sm:flex-nowrap items-center justify-between gap-3 sm:gap-4 rounded-2xl border border-gold/50 bg-[#0B0F19]/90 px-4 py-2.5 shadow-[0_10px_40px_rgba(0,0,0,0.8),0_0_30px_rgba(229,193,88,0.25)] backdrop-blur-xl">
            {/* Active Planet or Aspect Info */}
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-gold/40 bg-gold/10">
                <Crosshair size={14} className="text-gold animate-pulse" />
              </div>
              <div className="min-w-0 text-left">
                <div className="flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-widest text-gold/80">
                  <span>Orbit Focus Active</span>
                  <span className="hidden sm:inline">· Synchronized 01–04</span>
                </div>
                <div className="truncate font-serif text-xs sm:text-sm font-semibold text-silver">
                  {selection.kind === 'planet' ? (
                    (() => {
                      const lore = PLANET_LORE[selection.id];
                      const pos = chart.planets.find((p) => p.id === selection.id);
                      return (
                        <span className="flex items-center gap-1.5">
                          <PlanetGlyph planet={selection.id} size={14} color={lore.color} />
                          <span className="text-gold font-bold">{lore.name}</span>
                          {pos && (
                            <span className="text-slate-300 font-sans text-xs">
                              in {SIGN_NAMES[pos.sign]} (H{pos.house} · {pos.degInSign.toFixed(1)}°)
                            </span>
                          )}
                        </span>
                      );
                    })()
                  ) : (
                    (() => {
                      const loreA = PLANET_LORE[selection.a];
                      const loreB = PLANET_LORE[selection.b];
                      const def = ASPECT_BY_TYPE[selection.type];
                      const asp = chart.aspects.find(
                        (a) =>
                          ((a.a === selection.a && a.b === selection.b) || (a.a === selection.b && a.b === selection.a)) &&
                          a.type === selection.type,
                      );
                      return (
                        <span className="flex items-center gap-1.5">
                          <span style={{ color: def.color }}>{def.symbol}</span>
                          <span className="text-gold font-bold">{loreA.name}</span>
                          <span className="text-slate-300 font-sans text-xs">{def.label}</span>
                          <span className="text-gold font-bold">{loreB.name}</span>
                          {asp && <span className="text-slate-400 font-mono text-[10px]">({formatOrb(asp.orb)})</span>}
                        </span>
                      );
                    })()
                  )}
                </div>
              </div>
            </div>

            {/* Jump Pills 01, 02, 03, 04 & Clear Focus */}
            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              <button
                type="button"
                onClick={() => document.getElementById('natal-graph')?.scrollIntoView({ behavior: 'smooth' })}
                className="flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 font-mono text-[10.5px] text-slate-300 transition hover:border-gold/50 hover:bg-gold/15 hover:text-gold"
                title="Jump to 01 · Natal Graph"
              >
                <span className="text-gold font-bold">[01]</span>
                <span className="hidden md:inline">Graph</span>
              </button>
              <button
                type="button"
                onClick={() => document.getElementById('active-orbs')?.scrollIntoView({ behavior: 'smooth' })}
                className="flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 font-mono text-[10.5px] text-slate-300 transition hover:border-gold/50 hover:bg-gold/15 hover:text-gold"
                title="Jump to 02 · Active Orbs"
              >
                <span className="text-gold font-bold">[02]</span>
                <span className="hidden md:inline">Orbs</span>
              </button>
              <button
                type="button"
                onClick={() => document.getElementById('horoscope')?.scrollIntoView({ behavior: 'smooth' })}
                className="flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 font-mono text-[10.5px] text-slate-300 transition hover:border-gold/50 hover:bg-gold/15 hover:text-gold"
                title="Jump to 03 · Horoscope & Forecasts"
              >
                <span className="text-gold font-bold">[03]</span>
                <span className="hidden md:inline">Forecasts</span>
              </button>
              <button
                type="button"
                onClick={() => document.getElementById('remedies')?.scrollIntoView({ behavior: 'smooth' })}
                className="flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 font-mono text-[10.5px] text-slate-300 transition hover:border-gold/50 hover:bg-gold/15 hover:text-gold"
                title="Jump to 04 · Cosmic Remedies"
              >
                <span className="text-gold font-bold">[04]</span>
                <span className="hidden md:inline">Remedies</span>
              </button>

              <div className="h-4 w-px bg-white/15 mx-0.5" />

              <button
                type="button"
                onClick={() => setSelection(null)}
                className="flex items-center gap-1 rounded-full border border-rose-500/30 bg-rose-500/10 px-2.5 py-1 font-mono text-[10.5px] text-rose-300 transition hover:border-rose-400 hover:bg-rose-500/20"
                title="Clear Focus / View Full Chart"
              >
                <X size={12} />
                <span>Clear Focus</span>
              </button>
            </div>
          </div>
        </aside>
      )}

      <Footer />
    </div>
  );
}

export function SectionHeading({ eyebrow, title, subtitle }: { eyebrow: string; title: string; subtitle: string }) {
  return (
    <div className="mx-auto max-w-3xl text-center">
      <p className="eyebrow">{eyebrow}</p>
      <h2 className="section-title mt-3">{title}</h2>
      <div className="hairline mx-auto mt-5 w-40" />
      <p className="mt-5 text-sm leading-relaxed text-slate-400 md:text-base">{subtitle}</p>
    </div>
  );
}
