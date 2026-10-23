import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowDown, Crosshair, Lock, Orbit, X } from 'lucide-react';
import {
  ASPECT_BY_TYPE,
  SIGN_NAMES,
  SIGN_RULERS,
  formatLon,
  formatOrb,
  norm360,
  signOf,
  type Aspect,
  type NatalChart,
  type PlanetId,
} from '@/lib/astroEngine';
import { aspectExplanation, aspectLabel, planetExplanation } from '@/lib/horoscopeEngine';
import { PLANET_LORE } from '@/lib/zodiacData';
import { PLANET_SHAPES, SvgGlyph, ZODIAC_SHAPES, ZodiacGlyph } from './svg/AstroGlyphs';
import type { Phase, Selection } from './OrbisApp';

const C = 300;
const ORBITS: Record<PlanetId, { r: number; speed: number }> = {
  moon: { r: 72, speed: 34 },
  mercury: { r: 96, speed: 24 },
  venus: { r: 120, speed: 17 },
  sun: { r: 144, speed: 13 },
  mars: { r: 168, speed: 9 },
  jupiter: { r: 192, speed: 5.5 },
  saturn: { r: 216, speed: 3.5 },
};
const ORDER = Object.keys(ORBITS) as PlanetId[];
const LOCK_MS = 1900;
const easeOut = (t: number) => 1 - Math.pow(1 - t, 4);

export const PLANETARY_ORBS: Record<PlanetId, number> = {
  sun: 8,
  moon: 8,
  mercury: 6,
  venus: 7,
  mars: 7,
  jupiter: 7,
  saturn: 6,
};

const lstToHms = (lst: number) => {
  const h = lst / 15;
  const hh = Math.floor(h);
  const mm = Math.floor((h - hh) * 60);
  const ss = Math.floor(((h - hh) * 60 - mm) * 60);
  return `${String(hh).padStart(2, '0')}h${String(mm).padStart(2, '0')}m${String(ss).padStart(2, '0')}s`;
};

function describeOrbitalArc(cx: number, cy: number, r: number, centerAngleDeg: number, spanDeg: number) {
  const startA = ((centerAngleDeg - spanDeg) * Math.PI) / 180;
  const endA = ((centerAngleDeg + spanDeg) * Math.PI) / 180;
  const x1 = cx + r * Math.cos(startA);
  const y1 = cy + r * Math.sin(startA);
  const x2 = cx + r * Math.cos(endA);
  const y2 = cy + r * Math.sin(endA);
  return `M ${x1} ${y1} A ${r} ${r} 0 0 1 ${x2} ${y2}`;
}

interface Props {
  chart: NatalChart;
  phase: Phase;
  selection: Selection;
  onSelect: (sel: Selection) => void;
  focusOnWheel?: (sel: Selection) => void;
}

export default function OrbitalPreview({ chart, phase, selection, onSelect, focusOnWheel }: Props) {
  const planetRefs = useRef<Record<string, SVGGElement | null>>({});
  const ringRef = useRef<SVGGElement | null>(null);
  const angles = useRef<Record<string, number>>(Object.fromEntries(ORDER.map((id, i) => [id, -i * 47])));
  const ring = useRef(0);
  const lock = useRef<{ start: number; from: Record<string, number>; to: Record<string, number>; ringFrom: number; ringTo: number } | null>(null);
  const phaseRef = useRef(phase);
  const [settled, setSettled] = useState(false);
  const [hoveredPlanet, setHoveredPlanet] = useState<PlanetId | null>(null);
  const [hoveredAspect, setHoveredAspect] = useState<Aspect | null>(null);

  const targets = useMemo(() => {
    const t: Record<string, number> = {};
    for (const p of chart.planets) t[p.id] = -(180 + p.lon - chart.asc);
    return { planets: t, ring: chart.asc };
  }, [chart]);

  // Phase transitions → schedule the lock easing.
  useEffect(() => {
    phaseRef.current = phase;
    settledRef.current = false;
    setSettled(false);
    if (phase === 'locked') {
      const from = { ...angles.current };
      const to: Record<string, number> = {};
      for (const id of ORDER) to[id] = from[id] - norm360(from[id] - targets.planets[id]) - (id === 'moon' ? 360 : 0);
      lock.current = { start: performance.now(), from, to, ringFrom: ring.current, ringTo: ring.current + norm360(targets.ring - ring.current) };
    } else {
      lock.current = null;
    }
  }, [phase, targets]);

  // Animation loop (direct DOM writes for 60fps without React re-renders).
  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const ph = phaseRef.current;
      const L = lock.current;
      if (ph !== 'locked' || !L) {
        const boost = ph === 'calculating' ? 9 : 1;
        for (const id of ORDER) angles.current[id] -= ORBITS[id].speed * dt * boost;
        ring.current += 2.2 * dt * boost;
      } else {
        const k = Math.min(1, (now - L.start) / LOCK_MS);
        const e = easeOut(k);
        for (const id of ORDER) angles.current[id] = L.from[id] + (L.to[id] - L.from[id]) * e;
        ring.current = L.ringFrom + (L.ringTo - L.ringFrom) * e;
        if (k >= 1 && !settledRef.current) {
          settledRef.current = true;
          setSettled(true);
        }
      }
      for (const id of ORDER) {
        const el = planetRefs.current[id];
        if (!el) continue;
        const th = (angles.current[id] * Math.PI) / 180;
        el.setAttribute('transform', `translate(${C + ORBITS[id].r * Math.cos(th)} ${C + ORBITS[id].r * Math.sin(th)})`);
      }
      ringRef.current?.setAttribute('transform', `rotate(${ring.current} ${C} ${C})`);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  const settledRef = useRef(false);
  useEffect(() => {
    if (phase !== 'locked') settledRef.current = false;
  }, [phase]);

  // Final planet coordinates for the aspect web overlay.
  const finalPos = useMemo(() => {
    const out: Record<string, { x: number; y: number }> = {};
    for (const p of chart.planets) {
      const th = (targets.planets[p.id] * Math.PI) / 180;
      out[p.id] = { x: C + ORBITS[p.id].r * Math.cos(th), y: C + ORBITS[p.id].r * Math.sin(th) };
    }
    return out;
  }, [chart, targets]);

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

  // Selected planet or aspect details for floating HUD inside OrbitalPreview
  const inspectedData = useMemo(() => {
    // 1. Direct hover preview
    if (hoveredPlanet) {
      const p = chart.planets.find((pl) => pl.id === hoveredPlanet);
      if (p) {
        return {
          type: 'planet' as const,
          planet: p,
          lore: PLANET_LORE[p.id],
          explanation: planetExplanation(chart, p),
          aspects: chart.aspects.filter((a) => a.a === p.id || a.b === p.id),
        };
      }
    }
    if (hoveredAspect) {
      return {
        type: 'aspect' as const,
        aspect: hoveredAspect,
        lore: ASPECT_BY_TYPE[hoveredAspect.type],
        explanation: aspectExplanation(hoveredAspect),
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
          explanation: planetExplanation(chart, p),
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
          explanation: aspectExplanation(asp),
        };
      }
    }
    return null;
  }, [selection, hoveredPlanet, hoveredAspect, chart]);

  const sun = chart.planets[0];
  const moon = chart.planets[1];
  const ascSign = signOf(chart.asc);
  const ascRuler = SIGN_RULERS[ascSign] ?? 'sun';
  const statusLabel = phase === 'ambient' ? 'Ambient Orbit' : phase === 'calculating' ? 'Calculating Ephemeris' : 'Resonance Locked';

  return (
    <div id="orbital-preview" className="relative animate-fade-up [animation-delay:150ms]">
      <div className="glass relative overflow-hidden p-3 sm:p-5">
        {/* HUD corners */}
        <div className="pointer-events-none absolute inset-x-4 top-4 z-10 flex justify-between font-mono text-[9.5px] uppercase tracking-[0.18em] text-slate-500 sm:inset-x-6 sm:top-6">
          <div>
            <div>LST</div>
            <div className="mt-0.5 text-silver">{lstToHms(chart.lst)}</div>
          </div>
          <div className="text-right">
            <div>{chart.solarChart ? 'Solar ASC' : 'Ascendant'}</div>
            <div className="mt-0.5 text-gold">{formatLon(chart.asc)}</div>
          </div>
        </div>
        <div className="pointer-events-none absolute inset-x-4 bottom-4 z-10 flex items-end justify-between font-mono text-[9.5px] uppercase tracking-[0.18em] text-slate-500 sm:inset-x-6 sm:bottom-6">
          <div className="flex items-center gap-1.5">
            <span className={`h-1.5 w-1.5 rounded-full ${phase === 'locked' ? 'bg-emerald-orb' : 'animate-pulse bg-gold'}`} />
            <span className={phase === 'locked' ? 'text-emerald-orb' : 'text-gold'}>{statusLabel}</span>
          </div>
          <div className="text-right">
            <div>{chart.solarChart ? 'Solar MC' : 'Midheaven'}</div>
            <div className="mt-0.5 text-silver">{formatLon(chart.mc)}</div>
          </div>
        </div>

        <svg
          viewBox="0 0 600 600"
          className="relative mx-auto block w-full max-w-[560px]"
          role="img"
          aria-label="Orbital preview of the natal chart"
          onClick={() => onSelect(null)}
        >
          <defs>
            <radialGradient id="pv-core" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#E5C158" stopOpacity="0.35" />
              <stop offset="0.5" stopColor="#A78BFA" stopOpacity="0.08" />
              <stop offset="1" stopColor="#07080D" stopOpacity="0" />
            </radialGradient>
            <filter id="pv-glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="4" result="b" />
              <feMerge>
                <feMergeNode in="b" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <filter id="pv-glow-strong" x="-60%" y="-60%" width="220%" height="220%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="6" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          <circle cx={C} cy={C} r={250} fill="url(#pv-core)" />

          {/* Zodiac ring */}
          <g ref={ringRef} transform={`rotate(${ring.current} ${C} ${C})`}>
            <circle cx={C} cy={C} r={284} fill="none" stroke="#E5C158" strokeOpacity="0.35" />
            <circle cx={C} cy={C} r={250} fill="none" stroke="#E5C158" strokeOpacity="0.2" />
            {Array.from({ length: 72 }).map((_, i) => {
              const a = (i * 5 * Math.PI) / 180;
              const long = i % 6 === 0;
              const r1 = 284;
              const r2 = long ? 250 : 277;
              return (
                <line
                  key={i}
                  x1={C + r1 * Math.cos(a)} y1={C + r1 * Math.sin(a)}
                  x2={C + r2 * Math.cos(a)} y2={C + r2 * Math.sin(a)}
                  stroke="#E5C158" strokeOpacity={long ? 0.4 : 0.18} strokeWidth={long ? 1 : 0.7}
                />
              );
            })}
            {ZODIAC_SHAPES.map((shapes, s) => {
              // sign midpoint drawn at math angle 180 + λ → SVG angle −(180 + λ)
              const a = (-(180 + s * 30 + 15) * Math.PI) / 180;
              return <SvgGlyph key={s} shapes={shapes} x={C + 266 * Math.cos(a)} y={C + 266 * Math.sin(a)} size={17} color="#E5C158" strokeWidth={1.5} />;
            })}
          </g>

          {/* Concentric Orbit tracks with selection resonance */}
          {ORDER.map((id) => {
            const isOrbitActive =
              activePlanetId === id ||
              (activeAspect !== null && (activeAspect.a === id || activeAspect.b === id));
            const isConnected = connectedPlanetsToActive.has(id);
            const lore = PLANET_LORE[id];
            const r = ORBITS[id].r;

            return (
              <g key={`orbit-${id}`}>
                <circle
                  cx={C}
                  cy={C}
                  r={r}
                  fill="none"
                  stroke={isOrbitActive ? lore.color : isConnected ? lore.color : '#E2E8F0'}
                  strokeOpacity={isOrbitActive ? 0.85 : isConnected ? 0.35 : 0.08}
                  strokeWidth={isOrbitActive ? 2.2 : isConnected ? 1.2 : 0.9}
                  strokeDasharray={isOrbitActive ? undefined : id === 'sun' ? '0' : '2 5'}
                  filter={isOrbitActive ? 'url(#pv-glow)' : undefined}
                  className="transition-all duration-300"
                />

                {/* Active Orb Arc Swath when Planet or its aspect is active */}
                {isOrbitActive && settled && (
                  <path
                    d={describeOrbitalArc(C, C, r, targets.planets[id], PLANETARY_ORBS[id] ?? 7)}
                    fill="none"
                    stroke={lore.color}
                    strokeWidth="5"
                    strokeOpacity="0.85"
                    strokeLinecap="round"
                    filter="url(#pv-glow-strong)"
                    className="transition-all duration-300"
                  />
                )}

                {/* Orbit radius label when active */}
                {isOrbitActive && (
                  <text
                    x={C}
                    y={C - r + 8}
                    fill={lore.color}
                    fontSize="7.5"
                    fontFamily="JetBrains Mono"
                    textAnchor="middle"
                    className="font-bold tracking-widest uppercase"
                    opacity="0.9"
                  >
                    {lore.name.toUpperCase()} · {r}px RADIUS
                  </text>
                )}
              </g>
            );
          })}

          {/* Horizon & Meridian cardinal axes once locked */}
          <g style={{ opacity: settled ? 1 : 0, transition: 'opacity 0.8s' }} className={settled ? '' : 'pointer-events-none'}>
            <line x1={C - 246} y1={C} x2={C + 246} y2={C} stroke="#E5C158" strokeOpacity="0.35" strokeDasharray="4 6" />
            <text x={C - 238} y={C - 8} fill="#E5C158" fontSize="11" fontFamily="JetBrains Mono" opacity="0.8">ASC</text>
            <text x={C + 214} y={C - 8} fill="#E5C158" fontSize="11" fontFamily="JetBrains Mono" opacity="0.5">DSC</text>

            {(() => {
              const mcAngle = -(180 + chart.mc - chart.asc);
              const mcRad = (mcAngle * Math.PI) / 180;
              const mcX = C + 236 * Math.cos(mcRad);
              const mcY = C + 236 * Math.sin(mcRad);
              return (
                <text
                  x={mcX}
                  y={mcY}
                  fill="#E5C158"
                  fontSize="11"
                  fontFamily="JetBrains Mono"
                  fontWeight="bold"
                  textAnchor="middle"
                  dominantBaseline="central"
                  opacity="0.8"
                >
                  MC
                </text>
              );
            })()}
          </g>

          {/* Interactive Aspect web after lock */}
          <g style={{ opacity: settled ? 1 : 0, transition: 'opacity 1s' }} className={settled ? '' : 'pointer-events-none'}>
            {chart.aspects.map((a) => {
              const isSelectedAspect =
                selection?.kind === 'aspect' &&
                ((selection.a === a.a && selection.b === a.b) ||
                  (selection.a === a.b && selection.b === a.a));
              const isHoveredThisAspect =
                hoveredAspect !== null &&
                ((hoveredAspect.a === a.a && hoveredAspect.b === a.b) ||
                  (hoveredAspect.a === a.b && hoveredAspect.b === a.a));
              const isConnectedToActive =
                (activePlanetId && (activePlanetId === a.a || activePlanetId === a.b)) ||
                (activeAspect &&
                  ((activeAspect.a === a.a && activeAspect.b === a.b) ||
                    (activeAspect.a === a.b && activeAspect.b === a.a)));
              const isHighlighted = isSelectedAspect || isHoveredThisAspect || isConnectedToActive;

              const baseOpacity = Math.max(0.25, 0.85 - a.orb / 10);
              const hasFocus = !!activePlanetId || !!activeAspect;
              const opacity = isHighlighted
                ? 1
                : hasFocus
                ? 0.08
                : baseOpacity;

              const strokeWidth = isHighlighted ? 2.8 : a.orb < 1.5 ? 1.8 : 1;
              const def = ASPECT_BY_TYPE[a.type];

              return (
                <g key={`${a.a}-${a.b}`} className="aspect-line cursor-pointer">
                  {/* Invisible hit line */}
                  <line
                    x1={finalPos[a.a].x}
                    y1={finalPos[a.a].y}
                    x2={finalPos[a.b].x}
                    y2={finalPos[a.b].y}
                    stroke="transparent"
                    strokeWidth="14"
                    onMouseEnter={() => setHoveredAspect(a)}
                    onMouseLeave={() => setHoveredAspect(null)}
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelect({ kind: 'aspect', a: a.a, b: a.b, type: a.type });
                    }}
                  />
                  {/* Visible aspect chord */}
                  <line
                    x1={finalPos[a.a].x}
                    y1={finalPos[a.a].y}
                    x2={finalPos[a.b].x}
                    y2={finalPos[a.b].y}
                    stroke={def.color}
                    strokeOpacity={opacity}
                    strokeWidth={strokeWidth}
                    filter={isHighlighted ? 'url(#pv-glow)' : undefined}
                    pointerEvents="none"
                  />
                </g>
              );
            })}
          </g>

          {/* Core */}
          <circle cx={C} cy={C} r={10} fill="#E5C158" filter="url(#pv-glow)" opacity="0.9" />
          <circle cx={C} cy={C} r={22} fill="none" stroke="#E5C158" strokeOpacity="0.3" />

          {/* Interactive Planet nodes */}
          {ORDER.map((id) => {
            const isSelected = selection?.kind === 'planet' && selection.id === id;
            const isHovered = hoveredPlanet === id;
            const isConnected = connectedPlanetsToActive.has(id);
            const hasFocus = !!activePlanetId || !!activeAspect;
            const isDimmed = hasFocus && !isConnected;
            const lore = PLANET_LORE[id];
            const rNode = isSelected || isHovered ? 16 : 13;

            const initialTh = (angles.current[id] * Math.PI) / 180;
            const initialX = C + ORBITS[id].r * Math.cos(initialTh);
            const initialY = C + ORBITS[id].r * Math.sin(initialTh);

            return (
              <g
                key={id}
                ref={(el) => {
                  planetRefs.current[id] = el;
                }}
                transform={`translate(${initialX} ${initialY})`}
                className="cursor-pointer transition-opacity duration-300"
                style={{ opacity: isDimmed ? 0.35 : 1 }}
                onMouseEnter={() => setHoveredPlanet(id)}
                onMouseLeave={() => setHoveredPlanet(null)}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelect({ kind: 'planet', id });
                }}
              >
                {/* Invisible larger hit target */}
                <circle r={24} fill="transparent" />

                {/* Pulsing selection aura */}
                {(isSelected || isHovered) && (
                  <circle
                    r={rNode + 8}
                    fill="none"
                    stroke={lore.color}
                    strokeOpacity={isSelected ? 0.8 : 0.45}
                    strokeWidth="1.8"
                    className="animate-pulse"
                    filter="url(#pv-glow)"
                  />
                )}

                {/* Base plate */}
                <circle
                  r={rNode}
                  fill="#07080D"
                  stroke={lore.color}
                  strokeWidth={isSelected || isHovered ? 2.2 : 1.3}
                  filter={isSelected || isHovered ? 'url(#pv-glow-strong)' : 'url(#pv-glow)'}
                />

                {/* Glyph */}
                <SvgGlyph
                  shapes={PLANET_SHAPES[id]}
                  x={0}
                  y={0}
                  size={isSelected || isHovered ? 17 : 15}
                  color={lore.color}
                  strokeWidth={1.8}
                />
              </g>
            );
          })}
        </svg>

        {/* Floating Glassmorphic Inspection HUD */}
        {inspectedData && (
          <div className="glass-strong animate-fade-up absolute bottom-14 left-3 right-3 z-30 mx-auto max-w-sm rounded-xl border border-white/20 p-3.5 shadow-2xl backdrop-blur-xl sm:bottom-16 sm:left-auto sm:right-4 sm:w-80">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                {inspectedData.type === 'planet' ? (
                  <>
                    <div
                      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border"
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
                    <div className="min-w-0">
                      <h4 className="truncate font-serif text-sm font-semibold text-silver">
                        {inspectedData.lore.name} in {SIGN_NAMES[inspectedData.planet.sign]}
                      </h4>
                      <p className="font-mono text-[9.5px] text-slate-400">
                        {formatLon(inspectedData.planet.lon)} · Orbit: {ORBITS[inspectedData.planet.id].r}px · Orb: ±{PLANETARY_ORBS[inspectedData.planet.id]}°
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <div
                      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border font-mono text-sm font-bold"
                      style={{
                        borderColor: `${inspectedData.lore.color}60`,
                        backgroundColor: `${inspectedData.lore.color}15`,
                        color: inspectedData.lore.color,
                      }}
                    >
                      {inspectedData.lore.symbol}
                    </div>
                    <div className="min-w-0">
                      <h4 className="truncate font-serif text-sm font-semibold text-silver">
                        {aspectLabel(inspectedData.aspect)}
                      </h4>
                      <p className="font-mono text-[9.5px]" style={{ color: inspectedData.lore.color }}>
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
                <X size={13} />
              </button>
            </div>

            <p className="mt-2 text-[11px] leading-relaxed text-slate-300 line-clamp-2">
              {inspectedData.explanation}
            </p>

            {/* Quick aspect buttons for active planet */}
            {inspectedData.type === 'planet' && inspectedData.aspects.length > 0 && (
              <div className="mt-2.5 border-t border-white/10 pt-2">
                <span className="font-mono text-[9px] uppercase tracking-wider text-slate-400">
                  Active Concentric Aspect Orbs:
                </span>
                <div className="mt-1 flex flex-wrap gap-1">
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
                        className="inline-flex items-center gap-1 rounded-md border border-white/10 bg-white/5 px-1.5 py-0.5 font-mono text-[8.5px] text-slate-300 hover:border-gold/50 cursor-pointer"
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

            <button
              type="button"
              onClick={() => {
                if (inspectedData.type === 'planet') {
                  focusOnWheel?.({ kind: 'planet', id: inspectedData.planet.id });
                } else {
                  focusOnWheel?.({
                    kind: 'aspect',
                    a: inspectedData.aspect.a,
                    b: inspectedData.aspect.b,
                    type: inspectedData.aspect.type,
                  });
                }
              }}
              className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg border border-gold/40 bg-gold/15 py-1.5 font-mono text-[11px] font-medium text-gold transition hover:border-gold hover:bg-gold/25 cursor-pointer"
            >
              <Crosshair size={12} />
              <span>Inspect Alignment on 360° Natal Wheel</span>
              <ArrowDown size={12} />
            </button>
          </div>
        )}
      </div>

      {/* Interactive Core Triad Pills (Sun, Moon, Rising) */}
      <div className="mt-4 grid grid-cols-3 gap-2 sm:gap-3">
        {[
          { id: 'sun' as PlanetId, label: 'Sun', sub: 'Core Gravity', sign: sun.sign },
          { id: 'moon' as PlanetId, label: 'Moon', sub: 'Emotional Tide', sign: moon.sign },
          {
            id: ascRuler,
            label: chart.solarChart ? 'Solar Rising' : 'Rising',
            sub: `Outer Orbit · ${PLANET_LORE[ascRuler].name}`,
            sign: ascSign,
          },
        ].map((t) => {
          const isSelected = selection?.kind === 'planet' && selection.id === t.id;
          return (
            <button
              key={t.label}
              type="button"
              onClick={() => onSelect({ kind: 'planet', id: t.id })}
              className={`glass flex items-center gap-2.5 px-3 py-2.5 text-left transition sm:px-4 cursor-pointer hover:border-gold/50 ${
                isSelected
                  ? 'border-gold/80 bg-gold/15 shadow-lg shadow-gold/10 ring-1 ring-gold/50'
                  : 'hover:bg-white/5'
              }`}
            >
              <ZodiacGlyph sign={t.sign} size={22} color={isSelected ? '#E5C158' : '#D1D5DB'} className="shrink-0" />
              <div className="min-w-0">
                <div className="truncate font-serif text-lg leading-tight text-silver">{SIGN_NAMES[t.sign]}</div>
                <div className="truncate font-mono text-[9px] uppercase tracking-[0.16em] text-slate-500">{t.label}</div>
              </div>
            </button>
          );
        })}
      </div>

      <a
        href="#natal-graph"
        onClick={(e) => {
          e.preventDefault();
          focusOnWheel?.(selection);
        }}
        className="mt-3 flex items-center justify-center gap-2 rounded-xl border border-white/10 py-2.5 text-[13px] text-slate-300 transition hover:border-gold/40 hover:text-gold cursor-pointer"
      >
        {phase === 'locked' ? <Lock size={14} /> : <Orbit size={14} className="animate-spin" />}
        {phase === 'locked'
          ? selection?.kind === 'planet'
            ? `Inspect ${PLANET_LORE[selection.id].name} on full Natal Wheel`
            : selection?.kind === 'aspect'
            ? `Inspect ${PLANET_LORE[selection.a].name} ${ASPECT_BY_TYPE[selection.type].label} ${PLANET_LORE[selection.b].name} on full Natal Wheel`
            : `Explore ${chart.input.name}'s full Natal Graph`
          : 'Aligning planetary radius…'}
        <ArrowDown size={14} />
      </a>
    </div>
  );
}
