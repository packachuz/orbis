import { useMemo } from 'react';
import {
  ASPECT_BY_TYPE,
  SIGN_ELEMENTS,
  SIGN_NAMES,
  formatOrb,
  ordinal,
  type Element,
  type NatalChart,
  type PlanetId,
} from '@/lib/astroEngine';
import { buildRemedies } from '@/lib/horoscopeEngine';
import { synthesizeChart } from '@/lib/astroSynthesis';
import { PLANET_LORE } from '@/lib/zodiacData';
import { PlanetGlyph } from './svg/AstroGlyphs';
import type { Selection } from './OrbisApp';
import {
  CheckCircle2,
  Compass,
  Flame,
  Hourglass,
  ShieldAlert,
  Sparkles,
  X,
  Zap,
} from 'lucide-react';

interface Props {
  chart: NatalChart;
  selection?: Selection;
  onSelect?: (sel: Selection) => void;
  onFocus?: (sel: Selection) => void;
  focusOnWheel?: (sel: Selection) => void;
}

const REMEDY_ICONS: Record<string, React.ReactNode> = {
  power: <Zap size={18} className="text-gold" />,
  element: <Flame size={18} className="text-[#F97316]" />,
  timing: <Hourglass size={18} className="text-[#38BDF8]" />,
  shadow: <ShieldAlert size={18} className="text-[#A78BFA]" />,
};

const PLANET_ACTION_PROTOCOLS: Record<
  PlanetId,
  { title: string; directive: string; steps: [string, string, string] }
> = {
  sun: {
    title: 'Solar Sovereignty & Creative Authority Protocol',
    directive:
      'Radiate deliberate creative authority. Your core willpower is not meant to ask for permission — align your schedule around your sovereign focus.',
    steps: [
      'Block the first 90 minutes of your day for high-impact solo creative or strategic execution.',
      'Put your signature or name visibly on one decision or deliverable without dilution.',
      'Honor Sunday (Solar Day) with intentional rest, direct sunlight exposure, and life audit.',
    ],
  },
  moon: {
    title: 'Lunar Somatic Sanctuary & Intuitive Boundary Protocol',
    directive:
      'Protect your nervous system and somatic rhythm. Trust internal instinctual wisdom before intellectualizing emotional signals.',
    steps: [
      'Conduct a sensory reset: eliminate artificial cognitive noise 60 minutes before sleep.',
      'Audit your physical sanctuary and personal boundaries — decline non-essential demands.',
      'Honor Monday (Lunar Day) for reflective journaling, somatic movement, and nourishing foods.',
    ],
  },
  mercury: {
    title: 'Mercurial Signal Clarity & Cognitive Architecture Protocol',
    directive:
      'Refine your mental bandwidth and communication aperture. Eliminate verbal fluff and deliver crisp, truthful signals.',
    steps: [
      'Draft the difficult memo, proposal, or conversation you have delayed with radical clarity.',
      'Cleanse your information diet: unsubscribe, mute distractions, and capture ideas in writing.',
      'Honor Wednesday (Mercury Day) for contract reviews, correspondence, and technical synthesis.',
    ],
  },
  venus: {
    title: 'Venusian Value Magnetism & Aesthetic Recalibration Protocol',
    directive:
      'Awaken your magnetic receptivity and relational standards. Value is not chased; it is attracted through refined discernment.',
    steps: [
      'Curate your physical and sensory environment with intentional beauty and harmony.',
      'State your financial or relational standard clearly without apologetic preamble.',
      'Honor Friday (Venus Day) for celebratory connection, aesthetic craft, and gratitude.',
    ],
  },
  mars: {
    title: 'Martian Vital Agency & Sovereign Assertiveness Protocol',
    directive:
      'Channel pure vital drive into clean, courageous action. Convert internal restlessness into decisive forward momentum.',
    steps: [
      'Engage in vigorous physical exertion or somatic release early in the morning.',
      'Make the high-stakes, uncomfortable decision first before checking peripheral inboxes.',
      'Honor Tuesday (Mars Day) to confront pending roadblocks and execute decisive cuts.',
    ],
  },
  jupiter: {
    title: 'Jupiterian Expansion & Philosophical Audacity Protocol',
    directive:
      'Expand your horizon and invest in higher wisdom. Break out of small operational thinking and back your long-term thesis.',
    steps: [
      'Say yes to one expansive learning, travel, or intellectual risk that challenges you.',
      'Practice generous mentorship or magnanimous contribution without transactional expectation.',
      'Honor Thursday (Jupiter Day) for high-level philosophical planning and vision mapping.',
    ],
  },
  saturn: {
    title: 'Saturnian Mastery & Architectural Endurance Protocol',
    directive:
      'Build lasting structures through deliberate patience. Respect reality, accept natural limits, and erect unshakeable foundations.',
    steps: [
      'Define one non-negotiable professional discipline and commit to a 21-day consecutive streak.',
      'Eliminate energy leaks and frivolous promises to protect your primary legacy work.',
      'Honor Saturday (Saturn Day) for rigorous accountability, budget audits, and structural maintenance.',
    ],
  },
};

export default function OrbisAlignmentRemedies({ chart, selection, onSelect, onFocus, focusOnWheel }: Props) {
  const synthesis = useMemo(() => synthesizeChart(chart, 2026), [chart]);
  const remedies = useMemo(() => buildRemedies(chart, new Date(), synthesis), [chart, synthesis]);
  const handleFocus = focusOnWheel ?? onFocus;

  // Determine the weakest and strongest elements in the chart
  const lowestElement = useMemo<Element>(() => {
    return Object.entries(chart.elements).sort((a, b) => a[1] - b[1])[0][0] as Element;
  }, [chart.elements]);

  const highestElement = useMemo<Element>(() => {
    return Object.entries(chart.elements).sort((a, b) => b[1] - a[1])[0][0] as Element;
  }, [chart.elements]);

  const tightestAspect = chart.aspects[0];

  const activeRemedyMatch = useMemo<{ id: string; badge: string } | null>(() => {
    if (!selection) return null;

    if (selection.kind === 'planet') {
      const pid = selection.id;
      const pos = chart.planets.find((p) => p.id === pid);
      const elem = pos ? SIGN_ELEMENTS[pos.sign] : null;

      // 1. Dominant Orb (tightest aspect)
      if (tightestAspect && (tightestAspect.a === pid || tightestAspect.b === pid)) {
        return { id: 'power', badge: '★ Dominant Orb Power Move' };
      }
      // 2. Time-Lord Sovereign Protocol
      if (pid === synthesis.profection2026.timeLord) {
        return { id: 'timing', badge: '★ 2026 Time-Lord Sovereign Protocol' };
      }
      // 3. Mercury Signal Timing
      if (pid === 'mercury') {
        return { id: 'timing', badge: '★ Mercurial Signal & Decision Timing' };
      }
      // 4. Out-of-Sect Contrary Malefic
      if (pid === synthesis.sect.challengingMalefic) {
        return { id: 'shadow', badge: '★ Out-of-Sect Contrary Malefic' };
      }
      // 5. Square or Opposition Tension
      const hasHard = chart.aspects.some(
        (a) => (a.a === pid || a.b === pid) && (a.type === 'square' || a.type === 'opposition'),
      );
      if (hasHard) {
        return { id: 'shadow', badge: '★ Shadow Orb Growth Edge' };
      }
      // 6. Element Deficit Rebalancing
      if (elem === lowestElement) {
        return { id: 'element', badge: `★ Rebalances Deficit: ${lowestElement.toUpperCase()}` };
      }
      // 7. Element Dominant Rebalancing
      if (elem === highestElement) {
        return { id: 'element', badge: `★ Balances Dominant: ${highestElement.toUpperCase()}` };
      }
      // 8. Planet with other harmonious aspects
      const hasAspects = chart.aspects.some((a) => a.a === pid || a.b === pid);
      if (hasAspects) {
        return { id: 'power', badge: '★ Harmonic Orb Integration' };
      }
      // 9. Singleton planet
      return { id: 'element', badge: `★ Elemental Equilibrium (${elem ? elem.toUpperCase() : 'ORBIT'})` };
    }

    if (selection.kind === 'aspect') {
      const isTightest =
        tightestAspect &&
        ((selection.a === tightestAspect.a && selection.b === tightestAspect.b) ||
          (selection.a === tightestAspect.b && selection.b === tightestAspect.a));
      if (isTightest) {
        return { id: 'power', badge: '★ Active Dominant Aspect' };
      }
      if (selection.type === 'square' || selection.type === 'opposition') {
        return { id: 'shadow', badge: '★ Active Tension Resolution' };
      }
      if (selection.a === synthesis.profection2026.timeLord || selection.b === synthesis.profection2026.timeLord) {
        return { id: 'timing', badge: '★ Time-Lord Aligned Chord' };
      }
      if (selection.type === 'trine' || selection.type === 'sextile' || selection.type === 'conjunction') {
        return { id: 'power', badge: '★ Harmonic Aspect Resonance' };
      }
      return { id: 'power', badge: '★ Active Aspect Resonance' };
    }

    return null;
  }, [selection, tightestAspect, synthesis, chart.aspects, chart.planets, lowestElement, highestElement]);

  const getRemedySpotlight = (remId: string): { isSpotlighted: boolean; badge: string } => {
    if (!activeRemedyMatch) return { isSpotlighted: false, badge: '' };
    if (activeRemedyMatch.id === remId) {
      return { isSpotlighted: true, badge: activeRemedyMatch.badge };
    }
    return { isSpotlighted: false, badge: '' };
  };

  return (
    <div className="mt-10 space-y-8">
      {/* ───────────────────────────────────────────────────────────── */}
      {/* TAILORED ACTION PROTOCOL FOR ACTIVE ORBIT                     */}
      {/* ───────────────────────────────────────────────────────────── */}
      {selection && (
        <div className="glass-strong rounded-3xl border border-gold/50 bg-gradient-to-br from-[#0F1628]/95 via-[#0B0F19]/95 to-[#161208]/95 p-6 sm:p-8 shadow-[0_0_40px_rgba(229,193,88,0.22)] backdrop-blur-2xl animate-fade-in">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-gold/40 bg-gold/15">
                <Sparkles size={18} className="text-gold" />
              </div>
              <div>
                <span className="font-mono text-[10px] uppercase tracking-[0.24em] text-gold">
                  Active Orbit Action Protocol
                </span>
                <h4 className="font-serif text-lg sm:text-xl font-semibold text-silver">
                  {selection.kind === 'planet'
                    ? `Action Protocol for ${PLANET_LORE[selection.id].name}`
                    : `Integration Protocol: ${PLANET_LORE[selection.a].name} ${ASPECT_BY_TYPE[selection.type].label} ${PLANET_LORE[selection.b].name}`}
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

          {/* Planet Protocol Content */}
          {selection.kind === 'planet' && (() => {
            const proto = PLANET_ACTION_PROTOCOLS[selection.id];
            const p = chart.planets.find((item) => item.id === selection.id);
            const lore = PLANET_LORE[selection.id];

            return (
              <div className="mt-6 space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-gold/40 bg-obsidian">
                      <PlanetGlyph planet={selection.id} size={20} color={lore.color} />
                    </div>
                    <div>
                      <h5 className="font-serif text-xl font-semibold text-silver">
                        {proto.title}
                      </h5>
                      {p && (
                        <p className="font-mono text-xs text-slate-400">
                          {lore.name} in {SIGN_NAMES[p.sign]} ({ordinal(p.house)} House · {p.degInSign.toFixed(1)}°)
                        </p>
                      )}
                    </div>
                  </div>

                  <span className="rounded-full border border-gold/40 bg-gold/15 px-3 py-1 font-mono text-[10px] uppercase tracking-wider text-gold">
                    Principle: {lore.principle}
                  </span>
                </div>

                <p className="text-sm leading-relaxed text-slate-200">
                  {proto.directive}
                </p>

                <div className="space-y-3 rounded-2xl border border-white/10 bg-obsidian/50 p-5">
                  <span className="font-mono text-[10.5px] uppercase tracking-wider text-gold block">
                    Three-Step Cosmic Alignment Sequence:
                  </span>
                  {proto.steps.map((st, i) => (
                    <div key={i} className="flex items-start gap-3 text-xs sm:text-sm text-slate-200">
                      <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-gold" />
                      <span className="leading-relaxed">{st}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}

          {/* Aspect Protocol Content */}
          {selection.kind === 'aspect' && (() => {
            const def = ASPECT_BY_TYPE[selection.type];
            const loreA = PLANET_LORE[selection.a];
            const loreB = PLANET_LORE[selection.b];
            const asp = chart.aspects.find(
              (a) =>
                ((a.a === selection.a && a.b === selection.b) || (a.a === selection.b && a.b === selection.a)) &&
                a.type === selection.type,
            );

            return (
              <div className="mt-6 space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="flex h-10 w-10 items-center justify-center rounded-xl border font-mono text-lg font-bold"
                      style={{
                        borderColor: `${def.color}60`,
                        backgroundColor: `${def.color}20`,
                        color: def.color,
                      }}
                    >
                      {def.symbol}
                    </div>
                    <div>
                      <h5 className="font-serif text-xl font-semibold text-silver">
                        {loreA.name} {def.label} {loreB.name} Synchronization
                      </h5>
                      {asp && (
                        <p className="font-mono text-xs text-slate-400">
                          Exact Orb {formatOrb(asp.orb)} · {def.angle}° Separation · {asp.strength}
                        </p>
                      )}
                    </div>
                  </div>

                  <span
                    className="rounded-full px-3 py-1 font-mono text-[10px] uppercase tracking-wider"
                    style={{
                      border: `1px solid ${def.color}40`,
                      backgroundColor: `${def.color}15`,
                      color: def.color,
                    }}
                  >
                    {def.nature} Dynamic
                  </span>
                </div>

                <div className="space-y-3 rounded-2xl border border-white/10 bg-obsidian/50 p-5">
                  <span className="font-mono text-[10.5px] uppercase tracking-wider text-gold block">
                    Three-Step Integration Sequence:
                  </span>
                  <div className="flex items-start gap-3 text-xs sm:text-sm text-slate-200">
                    <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-gold" />
                    <span className="leading-relaxed">
                      <strong>Honor {loreA.name}:</strong> Give deliberate space to its core imperative for {loreA.need} without guilt.
                    </span>
                  </div>
                  <div className="flex items-start gap-3 text-xs sm:text-sm text-slate-200">
                    <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-gold" />
                    <span className="leading-relaxed">
                      <strong>Channel {loreB.name}:</strong> Allow its drive for {loreB.need} to support, rather than override, the partnership.
                    </span>
                  </div>
                  <div className="flex items-start gap-3 text-xs sm:text-sm text-slate-200">
                    <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-gold" />
                    <span className="leading-relaxed">
                      <strong>Harmonize Geometry:</strong> Practice conscious synthesis whenever friction or complacency arises in your daily routine.
                    </span>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* CORE 4 REMEDY CARDS                                           */}
      {/* ───────────────────────────────────────────────────────────── */}
      <div className="grid gap-6 md:grid-cols-2">
        {remedies.map((rem, idx) => {
          const { isSpotlighted, badge } = getRemedySpotlight(rem.id);

          return (
            <div
              key={rem.id}
              className={`glass relative flex flex-col justify-between overflow-hidden p-6 transition-all duration-300 ${
                isSpotlighted
                  ? 'border-2 border-gold/90 bg-gold/15 shadow-[0_0_35px_rgba(229,193,88,0.3)] ring-1 ring-gold/40'
                  : 'hover:border-gold/40 hover:bg-white/[0.07]'
              }`}
              style={{
                boxShadow: isSpotlighted ? undefined : `0 10px 40px -20px ${rem.accent}30`,
              }}
            >
              <div>
                {/* Header: Title + Monospace Telemetry */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div
                      className="flex h-8 w-8 items-center justify-center rounded-lg border"
                      style={{
                        borderColor: `${rem.accent}50`,
                        backgroundColor: `${rem.accent}15`,
                      }}
                    >
                      {REMEDY_ICONS[rem.id]}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-slate-400">
                          0{idx + 1} · Protocol
                        </span>
                        {isSpotlighted && (
                          <span className="rounded-full bg-gold/20 px-2 py-0.5 font-mono text-[9px] font-bold text-gold border border-gold/40 animate-pulse">
                            {badge}
                          </span>
                        )}
                      </div>
                      <h4 className="font-serif text-lg font-semibold text-silver">
                        {rem.title}
                      </h4>
                    </div>
                  </div>

                  <span
                    className="rounded-full px-2.5 py-0.5 font-mono text-[9.5px] uppercase tracking-wider"
                    style={{
                      backgroundColor: `${rem.accent}15`,
                      color: rem.accent,
                      border: `1px solid ${rem.accent}40`,
                    }}
                  >
                    {rem.telemetry}
                  </span>
                </div>

                {/* Headline */}
                <h5 className="mt-4 font-serif text-xl font-medium text-silver">
                  {rem.headline}
                </h5>

                {/* Body Explanation */}
                <p className="mt-2 text-xs leading-relaxed text-slate-300">
                  {rem.body}
                </p>

                {/* Actionable Steps / Ritual Protocol */}
                <div className="mt-5 space-y-2.5 rounded-xl border border-white/5 bg-obsidian/50 p-4">
                  <div className="font-mono text-[10px] uppercase tracking-wider text-gold">
                    Prescribed Actions:
                  </div>
                  {rem.steps.map((st, sIdx) => (
                    <div key={sIdx} className="flex items-start gap-2.5 text-xs text-slate-200">
                      <CheckCircle2
                        size={14}
                        className="mt-0.5 shrink-0"
                        style={{ color: rem.accent }}
                      />
                      <span className="leading-relaxed">{st}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Card Footer Readout */}
              <div className="mt-6 border-t border-white/10 pt-3.5">
                <p className="font-mono text-[10.5px] text-slate-400">
                  ⚡ {rem.footer}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
