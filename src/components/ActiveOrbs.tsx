import { useEffect, useMemo, useState } from 'react';
import {
  ASPECT_BY_TYPE,
  ASPECT_DEFS,
  formatOrb,
  type AspectType,
  type NatalChart,
} from '@/lib/astroEngine';
import { aspectExplanation } from '@/lib/horoscopeEngine';
import { PLANET_LORE } from '@/lib/zodiacData';
import { PlanetGlyph } from './svg/AstroGlyphs';
import type { Selection } from './OrbisApp';
import { ArrowUpRight, Compass, Sparkles, X } from 'lucide-react';

interface Props {
  chart: NatalChart;
  selection: Selection;
  onSelect?: (sel: Selection) => void;
  onFocus?: (sel: Selection) => void;
  focusOnWheel?: (sel: Selection) => void;
  filter: AspectType | 'all';
  onFilter: (f: AspectType | 'all') => void;
}

export default function ActiveOrbs({ chart, selection, onSelect, onFocus, focusOnWheel, filter, onFilter }: Props) {
  const [onlyFocused, setOnlyFocused] = useState(false);
  const dispatchSelect = onSelect ?? onFocus ?? focusOnWheel ?? (() => {});
  const dispatchFocus = focusOnWheel ?? onFocus ?? onSelect ?? (() => {});

  // Reset focused-only toggle whenever selection is cleared
  useEffect(() => {
    if (!selection) {
      setOnlyFocused(false);
    }
  }, [selection]);

  const planetAspects = useMemo(() => {
    if (selection?.kind !== 'planet') return [];
    return chart.aspects.filter((a) => a.a === selection.id || a.b === selection.id);
  }, [chart.aspects, selection]);

  const aspects = useMemo(() => {
    let list = chart.aspects.filter((a) => {
      const isConnectedToPlanet = selection?.kind === 'planet' && (a.a === selection.id || a.b === selection.id);
      const isSelectedAspect =
        selection?.kind === 'aspect' &&
        ((selection.a === a.a && selection.b === a.b) || (selection.a === a.b && selection.b === a.a)) &&
        selection.type === a.type;

      if (filter !== 'all' && a.type !== filter) {
        // Keep active aspect or focused planet connections visible so user never gets a hidden active selection
        if (onlyFocused && isConnectedToPlanet) {
          // keep
        } else if (isSelectedAspect) {
          // keep
        } else {
          return false;
        }
      }
      if (selection?.kind === 'planet' && onlyFocused) {
        return isConnectedToPlanet;
      }
      return true;
    });

    if (selection?.kind === 'planet') {
      list = [...list].sort((a, b) => {
        const aConn = a.a === selection.id || a.b === selection.id;
        const bConn = b.a === selection.id || b.b === selection.id;
        if (aConn && !bConn) return -1;
        if (!aConn && bConn) return 1;
        return a.orb - b.orb;
      });
    } else if (selection?.kind === 'aspect') {
      list = [...list].sort((a, b) => {
        const aExact =
          ((a.a === selection.a && a.b === selection.b) || (a.a === selection.b && a.b === selection.a)) &&
          a.type === selection.type;
        const bExact =
          ((b.a === selection.a && b.b === selection.b) || (b.a === selection.b && b.b === selection.a)) &&
          b.type === selection.type;
        if (aExact && !bExact) return -1;
        if (!aExact && bExact) return 1;
        return a.orb - b.orb;
      });
    }

    return list;
  }, [chart.aspects, filter, selection, onlyFocused]);

  const handleSelectAspect = (a: string, b: string, type: AspectType) => {
    const isSelected =
      selection?.kind === 'aspect' &&
      ((selection.a === a && selection.b === b) || (selection.a === b && selection.b === a)) &&
      selection.type === type;
    if (isSelected) {
      dispatchSelect(null);
    } else {
      dispatchSelect({ kind: 'aspect', a: a as any, b: b as any, type });
    }
  };

  const handleSelectPlanet = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (selection?.kind === 'planet' && selection.id === id) {
      dispatchSelect(null);
    } else {
      dispatchSelect({ kind: 'planet', id: id as any });
    }
  };

  return (
    <div className="mt-10">
      {/* Active Focus Banner for Planet */}
      {selection?.kind === 'planet' && (
        <div className="glass-strong mb-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-gold/50 bg-gradient-to-r from-gold/15 via-[#0E1526] to-[#0A0E17] p-5 shadow-[0_0_30px_rgba(229,193,88,0.18)] animate-fade-in">
          <div className="flex items-center gap-3.5">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-gold/40 bg-obsidian shadow-inner">
              <PlanetGlyph planet={selection.id} size={22} color={PLANET_LORE[selection.id].color} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-[10px] uppercase tracking-widest text-gold">
                  Active Orbit Resonance
                </span>
                <span className="rounded-full border border-gold/30 bg-gold/10 px-2 py-0.5 font-mono text-[9px] text-gold">
                  {planetAspects.length > 0 ? `${planetAspects.length} Orbs Connected` : 'Singleton Orbit (0 Orbs)'}
                </span>
              </div>
              <h4 className="mt-0.5 font-serif text-xl font-semibold text-silver">
                {planetAspects.length > 0
                  ? `Focusing ${planetAspects.length} Orbs for ${PLANET_LORE[selection.id].name}`
                  : `${PLANET_LORE[selection.id].name} (Unaspected Singleton Orbit)`}
              </h4>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {planetAspects.length > 0 ? (
              <button
                type="button"
                onClick={() => setOnlyFocused(!onlyFocused)}
                className={`rounded-full px-3.5 py-1.5 font-mono text-xs transition ${
                  onlyFocused
                    ? 'border border-gold bg-gold text-obsidian font-semibold shadow-md'
                    : 'border border-gold/40 bg-gold/10 text-gold hover:bg-gold/20'
                }`}
              >
                {onlyFocused ? 'Showing Focused Only' : `Filter to Focused (${planetAspects.length})`}
              </button>
            ) : (
              <span className="font-mono text-xs text-slate-400 italic">Pure Archetype Expression</span>
            )}
            <button
              type="button"
              onClick={() => dispatchSelect(null)}
              className="flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 font-mono text-xs text-slate-400 transition hover:border-rose-400 hover:text-rose-300"
            >
              <X size={12} />
              <span>Clear Focus</span>
            </button>
          </div>
        </div>
      )}

      {/* Active Focus Banner for Aspect */}
      {selection?.kind === 'aspect' && (
        <div className="glass-strong mb-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-gold/50 bg-gradient-to-r from-gold/20 via-[#0E1526] to-[#0A0E17] p-5 shadow-[0_0_35px_rgba(229,193,88,0.22)] animate-fade-in">
          <div className="flex items-center gap-3.5">
            <div
              className="flex h-11 w-11 items-center justify-center rounded-xl border font-mono text-xl font-bold shadow-inner"
              style={{
                borderColor: `${ASPECT_BY_TYPE[selection.type].color}60`,
                backgroundColor: `${ASPECT_BY_TYPE[selection.type].color}25`,
                color: ASPECT_BY_TYPE[selection.type].color,
              }}
            >
              {ASPECT_BY_TYPE[selection.type].symbol}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-[10px] uppercase tracking-widest text-gold">
                  Primary Aspect Chord Resonance
                </span>
                <span className="rounded-full border border-gold/40 bg-gold/15 px-2 py-0.5 font-mono text-[9px] text-gold">
                  Active Resonance
                </span>
              </div>
              <h4 className="mt-0.5 font-serif text-xl font-semibold text-silver">
                {PLANET_LORE[selection.a].name} {ASPECT_BY_TYPE[selection.type].label} {PLANET_LORE[selection.b].name}
              </h4>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => dispatchSelect(null)}
              className="flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 font-mono text-xs text-slate-400 transition hover:border-rose-400 hover:text-rose-300"
            >
              <X size={12} />
              <span>Clear Focus</span>
            </button>
          </div>
        </div>
      )}

      {/* Aspect Filter Pills */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-5">
        <div className="flex items-center gap-2">
          <Sparkles size={16} className="text-gold" />
          <span className="font-mono text-xs uppercase tracking-wider text-slate-300">
            Detected Aspect Geometry ({aspects.length} Orbs)
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => onFilter('all')}
            className={`rounded-full px-3 py-1 font-mono text-[11px] tracking-wider transition ${
              filter === 'all'
                ? 'border border-gold/60 bg-gold/20 text-gold'
                : 'border border-white/10 text-slate-400 hover:text-silver'
            }`}
          >
            All Orbs ({chart.aspects.length})
          </button>
          {ASPECT_DEFS.map((def) => {
            const count = chart.aspects.filter((a) => a.type === def.type).length;
            if (count === 0) return null;
            return (
              <button
                key={def.type}
                type="button"
                onClick={() => onFilter(def.type)}
                className={`flex items-center gap-1.5 rounded-full px-3 py-1 font-mono text-[11px] tracking-wider transition ${
                  filter === def.type
                    ? 'border font-medium'
                    : 'border border-white/10 text-slate-400 hover:text-silver'
                }`}
                style={{
                  borderColor: filter === def.type ? def.color : undefined,
                  backgroundColor: filter === def.type ? `${def.color}25` : undefined,
                  color: filter === def.type ? def.color : undefined,
                }}
              >
                <span>{def.symbol}</span>
                <span>{def.label}</span>
                <span className="opacity-70">({count})</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Grid of Aspect Cards */}
      {aspects.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-white/10 bg-obsidian/40 p-8 text-center animate-fade-in">
          <p className="font-serif text-lg font-semibold text-silver">
            {selection?.kind === 'planet' && planetAspects.length === 0
              ? `${PLANET_LORE[selection.id].name} has no aspect chords in this chart.`
              : 'No aspects match the current filter criteria.'}
          </p>
          <p className="mt-2 text-xs text-slate-400 max-w-md mx-auto">
            {selection?.kind === 'planet' && planetAspects.length === 0
              ? 'Operating as a planetary singleton, its archetype expresses purely through its zodiac sign and house placement without geometric chord interference.'
              : 'Clear or reset your filter to view all chart aspects.'}
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-3">
            {onlyFocused && (
              <button
                type="button"
                onClick={() => setOnlyFocused(false)}
                className="rounded-full border border-gold/40 bg-gold/10 px-4 py-1.5 font-mono text-xs text-gold hover:bg-gold/20"
              >
                Show All Orbs ({chart.aspects.length})
              </button>
            )}
            {filter !== 'all' && (
              <button
                type="button"
                onClick={() => onFilter('all')}
                className="rounded-full border border-white/10 bg-white/5 px-4 py-1.5 font-mono text-xs text-slate-300 hover:border-gold/40 hover:text-gold"
              >
                Reset Aspect Filter
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {aspects.map((asp) => {
            const def = ASPECT_BY_TYPE[asp.type];
            const loreA = PLANET_LORE[asp.a];
            const loreB = PLANET_LORE[asp.b];
            const isSelected =
              selection?.kind === 'aspect' &&
              ((selection.a === asp.a && selection.b === asp.b) ||
                (selection.a === asp.b && selection.b === asp.a)) &&
              selection.type === asp.type;
            const isConnectedToSelectedPlanet =
              selection?.kind === 'planet' &&
              (selection.id === asp.a || selection.id === asp.b);

            return (
              <div
                key={`${asp.a}-${asp.b}-${asp.type}`}
                onClick={() => handleSelectAspect(asp.a, asp.b, asp.type)}
                className={`glass group relative flex flex-col justify-between p-5 transition-all duration-300 cursor-pointer ${
                  isSelected
                    ? 'border-2 border-gold/90 bg-gold/15 shadow-[0_0_35px_rgba(229,193,88,0.35)] ring-1 ring-gold/40'
                    : isConnectedToSelectedPlanet
                    ? 'border-gold/50 bg-gold/[0.06] shadow-[0_0_22px_rgba(229,193,88,0.18)] hover:border-gold'
                    : 'hover:border-white/20 hover:bg-white/[0.07]'
                }`}
              >
                <div>
                  {/* Header row: Symbols + Type + Orb strength */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="flex items-center -space-x-1">
                        <button
                          type="button"
                          onClick={(e) => handleSelectPlanet(asp.a, e)}
                          title={`Focus on ${loreA.name}`}
                          className="flex h-7 w-7 items-center justify-center rounded-full border border-white/10 bg-obsidian transition hover:scale-110 hover:border-gold"
                        >
                          <PlanetGlyph planet={asp.a} size={14} color={loreA.color} />
                        </button>
                        <div
                          className="flex h-7 w-7 items-center justify-center rounded-full border font-mono text-xs font-bold"
                          style={{
                            borderColor: `${def.color}60`,
                            backgroundColor: `${def.color}20`,
                            color: def.color,
                          }}
                        >
                          {def.symbol}
                        </div>
                        <button
                          type="button"
                          onClick={(e) => handleSelectPlanet(asp.b, e)}
                          title={`Focus on ${loreB.name}`}
                          className="flex h-7 w-7 items-center justify-center rounded-full border border-white/10 bg-obsidian transition hover:scale-110 hover:border-gold"
                        >
                          <PlanetGlyph planet={asp.b} size={14} color={loreB.color} />
                        </button>
                      </div>
                      <span className="font-serif text-base font-semibold text-silver">
                        {loreA.name} {def.label} {loreB.name}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {isSelected && (
                        <span className="rounded-full bg-gold/25 px-2 py-0.5 font-mono text-[9px] font-bold text-gold border border-gold/50">
                          ★ Primary
                        </span>
                      )}
                      {isConnectedToSelectedPlanet && !isSelected && (
                        <span className="rounded-full bg-gold/15 px-2 py-0.5 font-mono text-[9px] font-medium text-gold border border-gold/30">
                          ✦ Focused
                        </span>
                      )}
                      <span
                        className="rounded-full px-2 py-0.5 font-mono text-[9.5px] uppercase tracking-wider"
                        style={{
                          backgroundColor: `${def.color}15`,
                          color: def.color,
                          border: `1px solid ${def.color}40`,
                        }}
                      >
                        {asp.strength}
                      </span>
                    </div>
                  </div>

                  {/* Orb telemetry readout */}
                  <div className="mt-3.5 flex items-center gap-3 rounded-lg border border-white/5 bg-obsidian/50 px-3 py-2 font-mono text-xs">
                    <div>
                      <span className="text-[10px] text-slate-500">EXACT ORB:</span>{' '}
                      <span className="font-semibold text-gold">{formatOrb(asp.orb)}</span>
                    </div>
                    <span className="text-slate-600">|</span>
                    <div>
                      <span className="text-[10px] text-slate-500">ANGLE:</span>{' '}
                      <span className="text-slate-300">{asp.separation.toFixed(1)}° / {def.angle}°</span>
                    </div>
                    <span className="text-slate-600">|</span>
                    <div>
                      <span className="text-[10px] text-slate-500">FLOW:</span>{' '}
                      <span className={asp.applying ? 'text-emerald-400' : 'text-slate-400'}>
                        {asp.applying ? 'Applying ↑' : 'Separating ↓'}
                      </span>
                    </div>
                  </div>

                  {/* Plain-English Interpretation */}
                  <p className="mt-3.5 text-xs leading-relaxed text-slate-300">
                    {aspectExplanation(asp)}
                  </p>
                </div>

                {/* Action: Focus on wheel */}
                <div className="mt-4 border-t border-white/10 pt-3">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      dispatchFocus({ kind: 'aspect', a: asp.a, b: asp.b, type: asp.type });
                    }}
                    className="flex w-full items-center justify-between text-xs font-medium text-slate-400 transition hover:text-gold"
                  >
                    <span className="flex items-center gap-1.5">
                      <Compass size={13} className="text-gold" />
                      Inspect Alignment on Natal Wheel
                    </span>
                    <ArrowUpRight size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
