import { useMemo } from 'react';
import {
  SIGN_NAMES,
  formatLon,
  formatOrb,
  type Element,
  type Modality,
  type NatalChart,
} from '@/lib/astroEngine';
import { ELEMENT_LORE, MODALITY_LORE, PLANET_LORE } from '@/lib/zodiacData';
import { PlanetGlyph, ZodiacGlyph } from './svg/AstroGlyphs';
import type { Selection } from './OrbisApp';
import { BarChart3, Compass, Flame, Wind, Droplets, Mountain } from 'lucide-react';

interface Props {
  chart: NatalChart;
  selection: Selection;
  onSelect: (sel: Selection) => void;
}

const ELEMENT_ICONS: Record<Element, React.ReactNode> = {
  fire: <Flame size={14} className="text-[#F97316]" />,
  earth: <Mountain size={14} className="text-[#10B981]" />,
  air: <Wind size={14} className="text-[#38BDF8]" />,
  water: <Droplets size={14} className="text-[#818CF8]" />,
};

export default function TelemetryPanel({ chart, selection, onSelect }: Props) {
  const elements = chart.elements;
  const modalities = chart.modalities;

  // Find highest element
  const dominantElement = useMemo(() => {
    return (Object.keys(elements) as Element[]).reduce((a, b) =>
      elements[b] > elements[a] ? b : a
    );
  }, [elements]);

  const dominantModality = useMemo(() => {
    return (Object.keys(modalities) as Modality[]).reduce((a, b) =>
      modalities[b] > modalities[a] ? b : a
    );
  }, [modalities]);

  return (
    <div className="flex flex-col gap-6">
      {/* 1. ELEMENTAL & MODALITY BALANCE METRICS */}
      <div className="glass p-5">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <BarChart3 size={15} className="text-gold" />
            <h3 className="font-serif text-lg font-semibold text-silver">Cosmic Telemetry</h3>
          </div>
          <span className="font-mono text-[10px] uppercase tracking-wider text-gold">
            Weighted Balance
          </span>
        </div>

        {/* Elemental Breakdown */}
        <div className="mt-4">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[11px] uppercase tracking-wider text-slate-400">
              Elemental Distribution
            </span>
            <span className="font-mono text-[10px] text-slate-400">
              Dominant: <span className="font-semibold text-gold capitalize">{dominantElement}</span>
            </span>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {(Object.keys(elements) as Element[]).map((el) => {
              const lore = ELEMENT_LORE[el];
              const pct = elements[el];
              return (
                <div
                  key={el}
                  className="rounded-xl border border-white/5 bg-obsidian/40 p-3 transition hover:border-white/15"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      {ELEMENT_ICONS[el]}
                      <span className="font-medium text-xs text-silver capitalize">{lore.label}</span>
                    </div>
                    <span className="font-mono text-xs font-semibold text-silver">{pct}%</span>
                  </div>
                  {/* Progress track */}
                  <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${Math.min(100, Math.max(8, pct))}%`,
                        backgroundColor: lore.color,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Modality Breakdown */}
        <div className="mt-5 border-t border-white/10 pt-4">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[11px] uppercase tracking-wider text-slate-400">
              Modality Ratios
            </span>
            <span className="font-mono text-[10px] text-slate-400">
              Dominant: <span className="font-semibold text-astral capitalize">{dominantModality}</span>
            </span>
          </div>

          <div className="mt-3 grid grid-cols-3 gap-3">
            {(Object.keys(modalities) as Modality[]).map((mod) => {
              const lore = MODALITY_LORE[mod];
              const pct = modalities[mod];
              return (
                <div
                  key={mod}
                  className="rounded-xl border border-white/5 bg-obsidian/40 p-3 transition hover:border-white/15"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-xs text-silver capitalize">{lore.label}</span>
                    <span className="font-mono text-xs font-semibold text-silver">{pct}%</span>
                  </div>
                  <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${Math.min(100, Math.max(8, pct))}%`,
                        backgroundColor: lore.color,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 2. PLANETARY COORDINATE TABLE */}
      <div className="glass overflow-hidden p-5">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <Compass size={15} className="text-gold" />
            <h3 className="font-serif text-lg font-semibold text-silver">Planetary Coordinates</h3>
          </div>
          <span className="font-mono text-[10px] uppercase tracking-wider text-slate-400">
            Click row to inspect
          </span>
        </div>

        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-left font-mono text-xs">
            <thead>
              <tr className="border-b border-white/5 text-[10px] uppercase tracking-wider text-slate-500">
                <th className="py-2.5 pl-2">Planet</th>
                <th className="py-2.5">Sign</th>
                <th className="py-2.5">Exact Deg</th>
                <th className="py-2.5">House</th>
                <th className="py-2.5 pr-2 text-right">Motion</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {chart.planets.map((p) => {
                const lore = PLANET_LORE[p.id];
                const isSelected = selection?.kind === 'planet' && selection.id === p.id;

                return (
                  <tr
                    key={p.id}
                    onClick={() => onSelect({ kind: 'planet', id: p.id })}
                    className={`cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-gold/15 text-gold'
                        : 'text-slate-300 hover:bg-white/5 hover:text-silver'
                    }`}
                  >
                    <td className="py-2.5 pl-2 font-sans font-medium">
                      <div className="flex items-center gap-2">
                        <PlanetGlyph planet={p.id} size={15} color={lore.color} />
                        <span className="text-silver">{lore.name}</span>
                      </div>
                    </td>
                    <td className="py-2.5">
                      <div className="flex items-center gap-1.5">
                        <ZodiacGlyph sign={p.sign} size={13} color="#E5C158" />
                        <span>{SIGN_NAMES[p.sign]}</span>
                      </div>
                    </td>
                    <td className="py-2.5 text-slate-300">
                      {formatOrb(p.degInSign)}
                    </td>
                    <td className="py-2.5 text-slate-400">
                      H{p.house}
                    </td>
                    <td className="py-2.5 pr-2 text-right">
                      {p.retrograde ? (
                        <span className="rounded bg-rose-500/20 px-1.5 py-0.5 text-[9.5px] font-semibold text-rose-300">
                          ℞ Retrograde
                        </span>
                      ) : (
                        <span className="rounded bg-emerald-500/10 px-1.5 py-0.5 text-[9.5px] text-emerald-400">
                          Direct
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}

              {/* Angles rows: Ascendant and Midheaven */}
              <tr className="text-slate-400">
                <td className="py-2 pl-2 font-sans text-xs">
                  <span className="font-semibold text-gold">Ascendant</span>
                </td>
                <td className="py-2">
                  <div className="flex items-center gap-1.5">
                    <ZodiacGlyph sign={chart.planets[0].sign} size={12} color="#E5C158" />
                    <span>{formatLon(chart.asc)}</span>
                  </div>
                </td>
                <td className="py-2 text-slate-400">1st Cusp</td>
                <td className="py-2">H1</td>
                <td className="py-2 pr-2 text-right text-slate-500">Angle</td>
              </tr>
              <tr className="text-slate-400">
                <td className="py-2 pl-2 font-sans text-xs">
                  <span className="font-semibold text-gold">Midheaven (MC)</span>
                </td>
                <td className="py-2">
                  <div className="flex items-center gap-1.5">
                    <ZodiacGlyph sign={chart.planets[0].sign} size={12} color="#E5C158" />
                    <span>{formatLon(chart.mc)}</span>
                  </div>
                </td>
                <td className="py-2 text-slate-400">10th Cusp</td>
                <td className="py-2">H10</td>
                <td className="py-2 pr-2 text-right text-slate-500">Angle</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
