import { useMemo, useState } from 'react';
import {
  ASPECT_BY_TYPE,
  ASPECT_DEFS,
  SIGN_NAMES,
  formatLon,
  formatOrb,
  norm360,
  type Aspect,
  type AspectType,
  type NatalChart,
  type PlanetId,
} from '@/lib/astroEngine';
import { aspectExplanation, aspectLabel, planetExplanation } from '@/lib/horoscopeEngine';
import { PLANET_LORE } from '@/lib/zodiacData';
import { PLANET_SHAPES, SvgGlyph, ZODIAC_SHAPES, ZodiacGlyph } from './svg/AstroGlyphs';
import type { Selection } from './OrbisApp';
import { ArrowUp, Eye, Orbit, Sparkles, X } from 'lucide-react';

interface Props {
  chart: NatalChart;
  selection: Selection;
  onSelect: (sel: Selection) => void;
  filter: AspectType | 'all';
  onFilter: (f: AspectType | 'all') => void;
  calculating?: boolean;
}

const CX = 400;
const CY = 400;
const R_OUTER = 385;
const R_ZODIAC_OUTER = 375;
const R_ZODIAC_INNER = 320;
const R_HOUSES_CENTER = 70;

/** Chaldean Classical Order from innermost (Moon) to outermost (Saturn) */
export const CHALDEAN_ORBIT_RADII: Record<PlanetId, number> = {
  moon: 100,
  mercury: 130,
  venus: 160,
  sun: 190,
  mars: 220,
  jupiter: 250,
  saturn: 282,
};

const CHALDEAN_ORDER: PlanetId[] = ['moon', 'mercury', 'venus', 'sun', 'mars', 'jupiter', 'saturn'];

/** Default orb radii in degrees for each planet */
export const PLANETARY_ORBS: Record<PlanetId, number> = {
  sun: 8,
  moon: 8,
  mercury: 6,
  venus: 7,
  mars: 7,
  jupiter: 7,
  saturn: 6,
};

/** Converts ecliptic longitude to SVG screen angle (Ascendant locked at 9 o'clock = 180°, counter-clockwise zodiac order) */
export function lonToAngleDeg(lon: number, asc: number): number {
  return norm360(180 - (lon - asc));
}

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = (angleDeg * Math.PI) / 180;
  return {
    x: cx + r * Math.cos(rad),
    y: cy + r * Math.sin(rad),
  };
}

function describeOrbitalArc(cx: number, cy: number, r: number, centerAngleDeg: number, spanDeg: number) {
  const startA = ((centerAngleDeg - spanDeg) * Math.PI) / 180;
  const endA = ((centerAngleDeg + spanDeg) * Math.PI) / 180;
  const x1 = cx + r * Math.cos(startA);
  const y1 = cy + r * Math.sin(startA);
  const x2 = cx + r * Math.cos(endA);
  const y2 = cy + r * Math.sin(endA);
  return `M ${x1} ${y1} A ${r} ${r} 0 0 1 ${x2} ${y2}`;
}

export default function NatalWheelSVG({
  chart,
  selection,
  onSelect,
  filter,
  onFilter,
  calculating,
}: Props) {
  const [hoveredPlanet, setHoveredPlanet] = useState<PlanetId | null>(null);
  const [hoveredAspect, setHoveredAspect] = useState<Aspect | null>(null);
  const [gravitationalPull, setGravitationalPull] = useState(() => {
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return false;
    }
    return true;
  });

  const jumpToHero = () => {
    const el = document.getElementById('orbital-preview') ?? document.getElementById('command-center');
    el?.scrollIntoView({ behavior: 'smooth' });
  };

  // Exact coordinates for each planet on its distinct concentric orbital radius
  const planetCoords = useMemo(() => {
    const coords = new Map<PlanetId, { x: number; y: number; angle: number; r: number }>();
    for (const p of chart.planets) {
      const r = CHALDEAN_ORBIT_RADII[p.id];
      const angle = lonToAngleDeg(p.lon, chart.asc);
      const pt = polarToCartesian(CX, CY, r, angle);
      coords.set(p.id, { ...pt, angle, r });
    }
    return coords;
  }, [chart]);

  // Filtered aspects
  const visibleAspects = useMemo(() => {
    return chart.aspects.filter((a) => {
      if (filter !== 'all' && a.type !== filter) return false;
      return true;
    });
  }, [chart.aspects, filter]);

  // Active highlights: hover has immediate inspection priority, falling back to selection
  const activeAspect = hoveredAspect ?? (selection?.kind === 'aspect' ? selection : null);
  const activePlanetId = hoveredPlanet ?? (selection?.kind === 'planet' ? selection.id : null);

  const connectedPlanetsToActive = useMemo(() => {
    if (activePlanetId) {
      const set = new Set<PlanetId>([activePlanetId]);
      for (const a of chart.aspects) {
        if (a.a === activePlanetId) set.add(a.b);
        if (a.b === activePlanetId) set.add(a.a);
      }
      return set;
    }
    if (activeAspect) {
      return new Set<PlanetId>([activeAspect.a, activeAspect.b]);
    }
    return new Set<PlanetId>();
  }, [activePlanetId, activeAspect, chart.aspects]);

  // Selected planet or aspect details for tooltip HUD
  const inspectedData = useMemo(() => {
    // 1. Direct hover preview
    if (hoveredPlanet) {
      const p = chart.planets.find((pl) => pl.id === hoveredPlanet);
      if (p) {
        return {
          type: 'planet' as const,
          planet: p,
          lore: PLANET_LORE[p.id],
          text: planetExplanation(chart, p),
          aspects: chart.aspects.filter((a) => a.a === p.id || a.b === p.id),
        };
      }
    }
    if (hoveredAspect) {
      return {
        type: 'aspect' as const,
        aspect: hoveredAspect,
        lore: ASPECT_BY_TYPE[hoveredAspect.type],
        text: aspectExplanation(hoveredAspect),
      };
    }
    // 2. Persistent selection
    if (selection?.kind === 'planet') {
      const p = chart.planets.find((pl) => pl.id === selection.id);
      if (p) {
        return {
          type: 'planet' as const,
          planet: p,
          lore: PLANET_LORE[p.id],
          text: planetExplanation(chart, p),
          aspects: chart.aspects.filter((a) => a.a === p.id || a.b === p.id),
        };
      }
    }
    if (selection?.kind === 'aspect') {
      const asp = chart.aspects.find(
        (a) =>
          (a.a === selection.a && a.b === selection.b) ||
          (a.a === selection.b && a.b === selection.a)
      );
      if (asp) {
        return {
          type: 'aspect' as const,
          aspect: asp,
          lore: ASPECT_BY_TYPE[asp.type],
          text: aspectExplanation(asp),
        };
      }
    }
    return null;
  }, [selection, hoveredPlanet, hoveredAspect, chart]);

  return (
    <div className="glass relative flex flex-col items-center overflow-hidden p-4 sm:p-6">
      {/* Top Controls Bar */}
      <div className="flex w-full flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
        <div className="flex flex-wrap items-center gap-2">
          <Orbit size={16} className="text-gold" />
          <span className="font-mono text-xs uppercase tracking-wider text-slate-300">
            Concentric Orbis Natal Wheel
          </span>
          <span className="rounded-full border border-gold/40 bg-gold/10 px-2 py-0.5 font-mono text-[9px] uppercase tracking-wide text-gold">
            Chaldean Radii
          </span>
          {chart.solarChart && (
            <span className="rounded-full border border-astral/40 bg-astral/10 px-2 py-0.5 font-mono text-[9px] uppercase tracking-wide text-astral">
              Solar Houses
            </span>
          )}

          {/* Gravitational Pull Resonance Mode Toggle */}
          <button
            type="button"
            onClick={() => setGravitationalPull((g) => !g)}
            className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 font-mono text-[10px] tracking-wider transition cursor-pointer ${
              gravitationalPull
                ? 'border border-gold/70 bg-gold/20 text-gold shadow-sm shadow-gold/20 ring-1 ring-gold/40'
                : 'border border-white/10 text-slate-500 hover:text-slate-300'
            }`}
            title="Toggle Gravitational Pull Resonance: animates gravitational waves and magnetic tether pulses"
          >
            <Sparkles size={11} className={gravitationalPull ? 'animate-pulse text-gold' : ''} />
            <span>Gravitational Pull: {gravitationalPull ? 'ON' : 'OFF'}</span>
          </button>

          {/* Quick jump to Hero Pulls Your Orbit graph */}
          <button
            type="button"
            onClick={jumpToHero}
            className="flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 font-mono text-[10px] tracking-wider text-slate-400 transition hover:border-gold/40 hover:text-gold cursor-pointer"
            title="Compare with Hero Pulls Your Orbit Graph"
          >
            <ArrowUp size={11} className="text-gold" />
            <span>Pulls Your Orbit</span>
          </button>
        </div>

        {/* Aspect Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => onFilter('all')}
            className={`rounded-full px-2.5 py-1 font-mono text-[10px] tracking-wider transition ${
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
                className={`flex items-center gap-1 rounded-full px-2.5 py-1 font-mono text-[10px] tracking-wider transition ${
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

      {/* SVG Canvas */}
      <div className="relative mt-4 flex w-full max-w-[760px] items-center justify-center">
        {/* Connection badge when Gravitational Pull is active and a planet is selected */}
        {gravitationalPull && activePlanetId && (
          <div className="animate-fade-up absolute left-3 top-3 z-10 flex items-center gap-2 rounded-full border border-gold/30 bg-obsidian/90 px-3 py-1 font-mono text-[10px] text-gold shadow-lg shadow-black/50 backdrop-blur-md">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-gold/70" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-gold" />
            </span>
            <span>Synchronized with Pulls Your Orbit Ephemeris</span>
          </div>
        )}
        <svg
          viewBox="0 0 800 800"
          className={`h-auto w-full select-none transition-opacity duration-700 ${
            calculating ? 'opacity-30' : 'opacity-100'
          }`}
          role="img"
          aria-label="Concentric Orbis Natal Wheel"
        >
          <defs>
            <radialGradient id="concentric-bg" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#0E121E" stopOpacity="0.95" />
              <stop offset="55%" stopColor="#080910" stopOpacity="0.98" />
              <stop offset="100%" stopColor="#05060A" stopOpacity="1" />
            </radialGradient>

            <filter id="glow-gold-strong" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            <filter id="soft-aspect-glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="3" />
              <feMerge>
                <feMergeNode />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Deep celestial canvas */}
          <circle
            cx={CX}
            cy={CY}
            r={R_OUTER}
            fill="url(#concentric-bg)"
            onClick={() => onSelect(null)}
            className="cursor-pointer"
          />

          {/* 1. OUTER RING: 12 ZODIAC SIGNS */}
          <circle
            cx={CX}
            cy={CY}
            r={R_ZODIAC_OUTER}
            fill="none"
            stroke="#E5C158"
            strokeOpacity="0.35"
            strokeWidth="1.5"
          />
          <circle
            cx={CX}
            cy={CY}
            r={R_ZODIAC_INNER}
            fill="none"
            stroke="#E5C158"
            strokeOpacity="0.25"
            strokeWidth="1"
          />

          {/* 360 Degree Ticks: 1° fine, 5° mid, 30° major sign borders */}
          {Array.from({ length: 360 }).map((_, i) => {
            const angle = lonToAngleDeg(i, chart.asc);
            const isSignBorder = i % 30 === 0;
            const isFiveDeg = i % 5 === 0;

            const r1 = R_ZODIAC_OUTER;
            const r2 = isSignBorder
              ? R_ZODIAC_INNER
              : isFiveDeg
              ? R_ZODIAC_OUTER - 8
              : R_ZODIAC_OUTER - 4;

            const p1 = polarToCartesian(CX, CY, r1, angle);
            const p2 = polarToCartesian(CX, CY, r2, angle);

            return (
              <line
                key={`tick-${i}`}
                x1={p1.x}
                y1={p1.y}
                x2={p2.x}
                y2={p2.y}
                stroke={isSignBorder ? '#E5C158' : '#E2E8F0'}
                strokeOpacity={isSignBorder ? 0.65 : isFiveDeg ? 0.3 : 0.12}
                strokeWidth={isSignBorder ? 1.5 : 0.75}
              />
            );
          })}

          {/* Zodiac Sign Glyphs in Outer Band */}
          {Array.from({ length: 12 }).map((_, s) => {
            const signMidLon = s * 30 + 15;
            const midAngle = lonToAngleDeg(signMidLon, chart.asc);
            const glyphPos = polarToCartesian(
              CX,
              CY,
              (R_ZODIAC_OUTER + R_ZODIAC_INNER) / 2,
              midAngle
            );

            return (
              <g key={`sign-${s}`}>
                <SvgGlyph
                  shapes={ZODIAC_SHAPES[s]}
                  x={glyphPos.x}
                  y={glyphPos.y}
                  size={20}
                  color="#E5C158"
                  strokeWidth={1.8}
                />
              </g>
            );
          })}

          {/* 2. ASTROLOGICAL HOUSES: Dynamic Cusp Rays from Central Hub to Zodiac Inner Rim */}
          {chart.cusps.map((cuspLon, hIndex) => {
            const houseNum = hIndex + 1;
            const nextCuspLon = chart.cusps[(hIndex + 1) % 12];
            const cuspAngle = lonToAngleDeg(cuspLon, chart.asc);

            const isAsc = houseNum === 1;
            const isDsc = houseNum === 7;
            const isMc = houseNum === 10;
            const isIc = houseNum === 4;
            const isCardinalAxis = isAsc || isDsc || isMc || isIc;

            const pOuter = polarToCartesian(CX, CY, R_ZODIAC_INNER, cuspAngle);
            const pInner = polarToCartesian(CX, CY, R_HOUSES_CENTER, cuspAngle);

            const houseSpan = norm360(nextCuspLon - cuspLon);
            const midLon = norm360(cuspLon + houseSpan / 2);
            const midAngle = lonToAngleDeg(midLon, chart.asc);
            const labelPos = polarToCartesian(CX, CY, R_ZODIAC_INNER - 16, midAngle);

            return (
              <g key={`house-${houseNum}`}>
                {/* Radial cusp ray */}
                <line
                  x1={pOuter.x}
                  y1={pOuter.y}
                  x2={pInner.x}
                  y2={pInner.y}
                  stroke={isCardinalAxis ? '#E5C158' : '#E2E8F0'}
                  strokeOpacity={isCardinalAxis ? 0.6 : 0.12}
                  strokeWidth={isCardinalAxis ? 1.8 : 0.8}
                  strokeDasharray={isCardinalAxis ? undefined : '2 5'}
                />

                {/* Subtle house number watermark */}
                <text
                  x={labelPos.x}
                  y={labelPos.y}
                  fill="#94A3B8"
                  fontSize="9.5"
                  fontFamily="JetBrains Mono"
                  textAnchor="middle"
                  dominantBaseline="central"
                  opacity={0.5}
                >
                  {houseNum}
                </text>
              </g>
            );
          })}

          {/* Major Axes Labels: ASC/DSC (Horizontal) & MC/IC */}
          <g>
            <rect
              x={CX - R_ZODIAC_OUTER - 4}
              y={CY - 10}
              width={28}
              height={20}
              rx={4}
              fill="#07080D"
              stroke="#E5C158"
              strokeWidth="1.3"
            />
            <text
              x={CX - R_ZODIAC_OUTER + 10}
              y={CY + 1}
              fill="#E5C158"
              fontSize="9"
              fontFamily="JetBrains Mono"
              fontWeight="bold"
              textAnchor="middle"
              dominantBaseline="central"
            >
              ASC
            </text>

            <rect
              x={CX + R_ZODIAC_OUTER - 24}
              y={CY - 10}
              width={28}
              height={20}
              rx={4}
              fill="#07080D"
              stroke="#E5C158"
              strokeOpacity="0.5"
              strokeWidth="1"
            />
            <text
              x={CX + R_ZODIAC_OUTER - 10}
              y={CY + 1}
              fill="#E5C158"
              fontSize="9"
              fontFamily="JetBrains Mono"
              textAnchor="middle"
              dominantBaseline="central"
              opacity="0.75"
            >
              DSC
            </text>

            {(() => {
              const mcAngle = lonToAngleDeg(chart.mc, chart.asc);
              const pMc = polarToCartesian(CX, CY, R_ZODIAC_OUTER + 13, mcAngle);
              return (
                <text
                  x={pMc.x}
                  y={pMc.y}
                  fill="#E5C158"
                  fontSize="9.5"
                  fontFamily="JetBrains Mono"
                  fontWeight="bold"
                  textAnchor="middle"
                  dominantBaseline="central"
                >
                  MC
                </text>
              );
            })()}

            {(() => {
              const ic = norm360(chart.mc + 180);
              const icAngle = lonToAngleDeg(ic, chart.asc);
              const pIc = polarToCartesian(CX, CY, R_ZODIAC_OUTER + 13, icAngle);
              return (
                <text
                  x={pIc.x}
                  y={pIc.y}
                  fill="#E5C158"
                  fontSize="9.5"
                  fontFamily="JetBrains Mono"
                  fontWeight="bold"
                  textAnchor="middle"
                  dominantBaseline="central"
                  opacity="0.75"
                >
                  IC
                </text>
              );
            })()}
          </g>

          {/* 3. CONCENTRIC PLANETARY ORBITAL RINGS ("PULLS YOUR ORBIT" HIERARCHY) */}
          <g id="concentric-orbit-tracks">
            {CHALDEAN_ORDER.map((id) => {
              const r = CHALDEAN_ORBIT_RADII[id];
              const lore = PLANET_LORE[id];
              const coord = planetCoords.get(id);
              const isOrbitActive =
                activePlanetId === id ||
                (activeAspect !== null && (activeAspect.a === id || activeAspect.b === id));
              const isConnected = connectedPlanetsToActive.has(id);

              return (
                <g key={`track-${id}`}>
                  {/* Circular Orbit Track */}
                  <circle
                    cx={CX}
                    cy={CY}
                    r={r}
                    fill="none"
                    stroke={isOrbitActive ? lore.color : isConnected ? lore.color : '#E2E8F0'}
                    strokeOpacity={isOrbitActive ? 0.75 : isConnected ? 0.35 : 0.12}
                    strokeWidth={isOrbitActive ? 1.8 : 0.9}
                    strokeDasharray={isOrbitActive ? undefined : '2 6'}
                    className="transition-all duration-300"
                  />

                  {/* Gravitational Wave Resonance Pulse when active and enabled */}
                  {isOrbitActive && gravitationalPull && (
                    <circle
                      cx={CX}
                      cy={CY}
                      r={r}
                      fill="none"
                      stroke={lore.color}
                      strokeWidth="3.2"
                      strokeOpacity="0.45"
                      strokeDasharray="10 14"
                      filter="url(#glow-gold-strong)"
                      pointerEvents="none"
                    >
                      <animate
                        attributeName="stroke-dashoffset"
                        from="0"
                        to="96"
                        dur="3.6s"
                        repeatCount="indefinite"
                      />
                      <animate
                        attributeName="stroke-opacity"
                        values="0.25;0.85;0.25"
                        dur="2.4s"
                        repeatCount="indefinite"
                      />
                    </circle>
                  )}

                  {/* Active Orb Radius Arc Swath when Planet or its aspect is active */}
                  {isOrbitActive && coord && (
                    <path
                      d={describeOrbitalArc(
                        CX,
                        CY,
                        r,
                        coord.angle,
                        PLANETARY_ORBS[id]
                      )}
                      fill="none"
                      stroke={lore.color}
                      strokeWidth="5"
                      strokeOpacity="0.8"
                      strokeLinecap="round"
                      filter="url(#glow-gold-strong)"
                    />
                  )}

                  {/* Faint orbit label at 12 o'clock / top quadrant */}
                  <text
                    x={CX}
                    y={CY - r + 9}
                    fill={lore.color}
                    fontSize="7.5"
                    fontFamily="JetBrains Mono"
                    textAnchor="middle"
                    opacity={isOrbitActive ? 0.9 : 0.3}
                  >
                    {lore.name.toUpperCase()} · {r}px
                  </text>
                </g>
              );
            })}
          </g>

          {/* Central Celestial Core Hub */}
          <circle cx={CX} cy={CY} r={R_HOUSES_CENTER} fill="#06080F" stroke="#E5C158" strokeOpacity="0.25" strokeWidth="1" />
          <circle cx={CX} cy={CY} r={8} fill="#E5C158" opacity="0.85" filter="url(#glow-gold-strong)" />
          <circle cx={CX} cy={CY} r={22} fill="none" stroke="#E5C158" strokeOpacity="0.3" strokeDasharray="2 4" />

          {/* 4. "ORBS OF INFLUENCE" DEPTH-WEB ASPECT CHORDS ACROSS CONCENTRIC ORBITS */}
          <g id="aspect-chords">
            {visibleAspects.map((asp) => {
              const ptA = planetCoords.get(asp.a);
              const ptB = planetCoords.get(asp.b);
              if (!ptA || !ptB) return null;

              const isSelectedAspect =
                selection?.kind === 'aspect' &&
                ((selection.a === asp.a && selection.b === asp.b) ||
                  (selection.a === asp.b && selection.b === asp.a));
              const isHoveredThisAspect =
                hoveredAspect !== null &&
                ((hoveredAspect.a === asp.a && hoveredAspect.b === asp.b) ||
                  (hoveredAspect.a === asp.b && hoveredAspect.b === asp.a));
              const isConnectedToActive =
                (activePlanetId && (activePlanetId === asp.a || activePlanetId === asp.b)) ||
                (activeAspect &&
                  ((activeAspect.a === asp.a && activeAspect.b === asp.b) ||
                    (activeAspect.a === asp.b && activeAspect.b === asp.a)));

              const isHighlighted =
                isSelectedAspect || isHoveredThisAspect || isConnectedToActive;
              const def = ASPECT_BY_TYPE[asp.type];

              const baseOpacity = Math.max(0.18, 0.88 - asp.orb / 10);
              const hasFocus = !!activePlanetId || !!activeAspect;
              const opacity = isHighlighted
                ? 1
                : hasFocus
                ? 0.06 // Dim unrelated chords when a planet/aspect is active
                : baseOpacity;

              const strokeWidth = isHighlighted ? 2.8 : asp.orb < 1.5 ? 2 : 1.2;

              return (
                <g key={`chord-${asp.a}-${asp.b}`} className="aspect-line cursor-pointer">
                  {/* Invisible wide hit area for effortless hover/click */}
                  <line
                    x1={ptA.x}
                    y1={ptA.y}
                    x2={ptB.x}
                    y2={ptB.y}
                    stroke="transparent"
                    strokeWidth="14"
                    onMouseEnter={() => setHoveredAspect(asp)}
                    onMouseLeave={() => setHoveredAspect(null)}
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelect({ kind: 'aspect', a: asp.a, b: asp.b, type: asp.type });
                    }}
                  />

                  {/* Luminous aspect chord across distance layers */}
                  <line
                    x1={ptA.x}
                    y1={ptA.y}
                    x2={ptB.x}
                    y2={ptB.y}
                    stroke={def.color}
                    strokeOpacity={opacity}
                    strokeWidth={strokeWidth}
                    filter={isHighlighted ? 'url(#soft-aspect-glow)' : undefined}
                  />

                  {/* Subtle magnetic tether pulse between selected planet and aspected body */}
                  {gravitationalPull && (() => {
                    const isTetherActive =
                      (activePlanetId && (activePlanetId === asp.a || activePlanetId === asp.b)) ||
                      (activeAspect &&
                        ((activeAspect.a === asp.a && activeAspect.b === asp.b) ||
                          (activeAspect.a === asp.b && activeAspect.b === asp.a)));

                    if (!isTetherActive) return null;

                    // Anchor tether origin to the active body so the pulse radiates outward consistently
                    const originIsB = activePlanetId === asp.b || (activeAspect && activeAspect.b === asp.b);
                    const pOrigin = originIsB ? ptB : ptA;
                    const pTarget = originIsB ? ptA : ptB;

                    return (
                      <line
                        x1={pOrigin.x}
                        y1={pOrigin.y}
                        x2={pTarget.x}
                        y2={pTarget.y}
                        stroke={def.color}
                        strokeWidth="2.4"
                        strokeDasharray="6 8"
                        strokeOpacity="0.85"
                        filter="url(#soft-aspect-glow)"
                        pointerEvents="none"
                      >
                        <animate
                          attributeName="stroke-dashoffset"
                          from="0"
                          to="-28"
                          dur="1.2s"
                          repeatCount="indefinite"
                        />
                      </line>
                    );
                  })()}
                </g>
              );
            })}
          </g>

          {/* 5. PLANETARY NODES ON THEIR CONCENTRIC RADIUS TRACKS */}
          <g id="planetary-nodes">
            {chart.planets.map((p) => {
              const coord = planetCoords.get(p.id);
              if (!coord) return null;

              const lore = PLANET_LORE[p.id];
              const isSelected = selection?.kind === 'planet' && selection.id === p.id;
              const isHovered = hoveredPlanet === p.id;
              const isConnected = connectedPlanetsToActive.has(p.id);
              const hasFocus = !!activePlanetId || !!activeAspect;
              const isDimmed = hasFocus && !isConnected;

              const nodeRadius = isSelected || isHovered ? 18 : 15;

              // Radial ray projecting out to Zodiac degree tick on outer ring
              const tickOuter = polarToCartesian(CX, CY, R_ZODIAC_INNER, coord.angle);

              return (
                <g
                  key={`node-${p.id}`}
                  className="wheel-planet cursor-pointer transition-transform duration-500"
                  style={{ opacity: isDimmed ? 0.3 : 1 }}
                  onMouseEnter={() => setHoveredPlanet(p.id)}
                  onMouseLeave={() => setHoveredPlanet(null)}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelect({ kind: 'planet', id: p.id });
                  }}
                >
                  {/* Radial Projection Ray connecting concentric node to outer Zodiac wheel */}
                  <line
                    x1={coord.x}
                    y1={coord.y}
                    x2={tickOuter.x}
                    y2={tickOuter.y}
                    stroke={lore.color}
                    strokeOpacity={isSelected || isHovered ? 0.85 : 0.35}
                    strokeWidth={isSelected || isHovered ? 1.5 : 0.8}
                    strokeDasharray={isSelected || isHovered ? undefined : '1 3'}
                  />

                  {/* Outer degree pointer tick on zodiac inner rim */}
                  <circle
                    cx={tickOuter.x}
                    cy={tickOuter.y}
                    r={isSelected || isHovered ? 3.5 : 2}
                    fill={lore.color}
                  />

                  {/* Pulsing selection aura */}
                  {(isSelected || isHovered) && (
                    <circle
                      cx={coord.x}
                      cy={coord.y}
                      r={nodeRadius + 7}
                      fill="none"
                      stroke={lore.color}
                      strokeOpacity="0.5"
                      strokeWidth="1.8"
                      className="animate-pulse"
                    />
                  )}

                  {/* Magnetic pulse aura on aspected bodies during Gravitational Pull mode */}
                  {gravitationalPull && activePlanetId && isConnected && !isSelected && (
                    <circle
                      cx={coord.x}
                      cy={coord.y}
                      r={nodeRadius + 6}
                      fill="none"
                      stroke={PLANET_LORE[activePlanetId].color}
                      strokeWidth="1.6"
                      strokeDasharray="3 3"
                      opacity="0.8"
                      pointerEvents="none"
                    >
                      <animate
                        attributeName="r"
                        values={`${nodeRadius + 3};${nodeRadius + 9};${nodeRadius + 3}`}
                        dur="2s"
                        repeatCount="indefinite"
                      />
                      <animate
                        attributeName="stroke-opacity"
                        values="0.2;0.85;0.2"
                        dur="2s"
                        repeatCount="indefinite"
                      />
                    </circle>
                  )}

                  {/* Node circular background plate */}
                  <circle
                    cx={coord.x}
                    cy={coord.y}
                    r={nodeRadius}
                    fill="#07080D"
                    stroke={lore.color}
                    strokeWidth={isSelected || isHovered ? 2.2 : 1.4}
                    filter={isSelected || isHovered ? 'url(#glow-gold-strong)' : undefined}
                  />

                  {/* Planet Glyph */}
                  <SvgGlyph
                    shapes={PLANET_SHAPES[p.id]}
                    x={coord.x}
                    y={coord.y}
                    size={isSelected || isHovered ? 18 : 16}
                    color={lore.color}
                    strokeWidth={1.8}
                  />

                  {/* Degree readout badge */}
                  {(() => {
                    const degLabel = `${Math.floor(p.degInSign)}°`;
                    const labelPt = polarToCartesian(
                      CX,
                      CY,
                      coord.r + (coord.r > 200 ? -22 : 22),
                      coord.angle
                    );
                    return (
                      <g pointerEvents="none">
                        <text
                          x={labelPt.x}
                          y={labelPt.y}
                          fill="#E2E8F0"
                          fontSize="8.5"
                          fontFamily="JetBrains Mono"
                          textAnchor="middle"
                          dominantBaseline="central"
                          opacity={isSelected || isHovered ? 1 : 0.8}
                        >
                          {degLabel}
                          {p.retrograde ? ' ℞' : ''}
                        </text>
                      </g>
                    );
                  })()}
                </g>
              );
            })}
          </g>
        </svg>

        {/* Floating Glassmorphic Inspection HUD */}
        {inspectedData && (
          <div className="glass-strong animate-fade-up absolute bottom-3 left-3 right-3 z-20 max-w-lg rounded-xl border border-white/15 p-4 shadow-2xl backdrop-blur-xl sm:left-auto sm:right-4 sm:w-96">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                {inspectedData.type === 'planet' ? (
                  <>
                    <div
                      className="flex h-7 w-7 items-center justify-center rounded-lg border"
                      style={{
                        borderColor: `${inspectedData.lore.color}60`,
                        backgroundColor: `${inspectedData.lore.color}15`,
                      }}
                    >
                      <ZodiacGlyph
                        sign={inspectedData.planet.sign}
                        size={15}
                        color={inspectedData.lore.color}
                      />
                    </div>
                    <div>
                      <h4 className="font-serif text-base font-semibold text-silver">
                        {inspectedData.lore.name} in {SIGN_NAMES[inspectedData.planet.sign]}
                      </h4>
                      <p className="font-mono text-[10px] text-slate-400">
                        {formatLon(inspectedData.planet.lon)} · House {inspectedData.planet.house}
                        {inspectedData.planet.retrograde && ' · Retrograde (℞)'}
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <div
                      className="flex h-7 w-7 items-center justify-center rounded-lg border font-mono text-sm font-bold"
                      style={{
                        borderColor: `${inspectedData.lore.color}60`,
                        backgroundColor: `${inspectedData.lore.color}15`,
                        color: inspectedData.lore.color,
                      }}
                    >
                      {inspectedData.lore.symbol}
                    </div>
                    <div>
                      <h4 className="font-serif text-base font-semibold text-silver">
                        {aspectLabel(inspectedData.aspect)}
                      </h4>
                      <p className="font-mono text-[10px]" style={{ color: inspectedData.lore.color }}>
                        Orb: {formatOrb(inspectedData.aspect.orb)} [{inspectedData.aspect.strength}]
                      </p>
                    </div>
                  </>
                )}
              </div>

              <button
                type="button"
                onClick={() => {
                  onSelect(null);
                  setHoveredPlanet(null);
                  setHoveredAspect(null);
                }}
                className="rounded-lg p-1 text-slate-400 hover:bg-white/10 hover:text-silver cursor-pointer"
                aria-label="Dismiss inspector"
              >
                <X size={14} />
              </button>
            </div>

            <p className="mt-2.5 text-xs leading-relaxed text-slate-300">
              {inspectedData.text}
            </p>

            {inspectedData.type === 'planet' && inspectedData.aspects.length > 0 && (
              <div className="mt-3 border-t border-white/10 pt-2.5">
                <span className="font-mono text-[9.5px] uppercase tracking-wider text-slate-400">
                  Active Concentric Aspect Orbs:
                </span>
                <div className="mt-1.5 flex flex-wrap gap-1">
                  {inspectedData.aspects.map((a) => {
                    const otherId = a.a === inspectedData.planet.id ? a.b : a.a;
                    const def = ASPECT_BY_TYPE[a.type];
                    return (
                      <button
                        key={`${a.a}-${a.b}`}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelect({ kind: 'aspect', a: a.a, b: a.b, type: a.type });
                        }}
                        className="inline-flex items-center gap-1 rounded-md border border-white/10 bg-white/5 px-2 py-0.5 font-mono text-[9px] text-slate-300 hover:border-gold/50 cursor-pointer"
                      >
                        <span style={{ color: def.color }}>{def.symbol}</span>
                        <span>{PLANET_LORE[otherId].name}</span>
                        <span className="text-slate-500">({formatOrb(a.orb)})</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Quick jump to Hero Pulls Your Orbit graph */}
            <button
              type="button"
              onClick={jumpToHero}
              className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg border border-white/10 bg-white/5 py-1.5 font-mono text-[10px] text-slate-300 transition hover:border-gold/40 hover:text-gold cursor-pointer"
            >
              <ArrowUp size={11} className="text-gold" />
              <span>Compare in "Pulls Your Orbit" Ephemeris Graph</span>
            </button>
          </div>
        )}
      </div>

      {/* Footer guidance note */}
      <div className="mt-4 flex items-center justify-between gap-4 text-center font-mono text-[11px] text-slate-500">
        <span className="flex items-center gap-1.5">
          <Eye size={12} className="text-gold" />
          Click any planet node or aspect chord to isolate its orbital radius and orb arc
        </span>
        {selection && (
          <button
            type="button"
            onClick={() => onSelect(null)}
            className="text-gold hover:underline"
          >
            Clear selection
          </button>
        )}
      </div>
    </div>
  );
}
