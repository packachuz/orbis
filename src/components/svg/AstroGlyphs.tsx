/**
 * ORBIS — Custom geometric zodiac & planetary glyphs (24×24 grid, stroke-based).
 * Each glyph is defined as primitive shapes so it can be rendered either as a
 * standalone <svg> icon or nested inside the natal wheel SVG.
 */
import type { PlanetId } from '@/lib/astroEngine';

type Shape = { d: string } | { c: [number, number, number]; fill?: boolean };

export const ZODIAC_SHAPES: Shape[][] = [
  // Aries
  [{ d: 'M12 20V10M12 10C12 6 10.2 4 7.6 4S4 5.8 4 8s1.4 3 2.8 3M12 10c0-4 1.8-6 4.4-6S20 5.8 20 8s-1.4 3-2.8 3' }],
  // Taurus
  [{ c: [12, 15, 5] }, { d: 'M4.5 4c0 3.6 3.2 6 7.5 6s7.5-2.4 7.5-6' }],
  // Gemini
  [{ d: 'M5 4.5c4.4 1.6 9.6 1.6 14 0M5 19.5c4.4-1.6 9.6-1.6 14 0M9 5.6v12.8M15 5.6v12.8' }],
  // Cancer
  [{ c: [7, 9.5, 2.6] }, { d: 'M7 6.9C10.5 4.6 16 4.8 20 7.6' }, { c: [17, 14.5, 2.6] }, { d: 'M17 17.1C13.5 19.4 8 19.2 4 16.4' }],
  // Leo
  [{ c: [7.5, 15.5, 3] }, { d: 'M10.5 15.5C10.5 12 8.5 10.5 8.5 7.5a4 4 0 0 1 8 0c0 4-3.2 6.5-3.2 10.5a2.6 2.6 0 0 0 5.2 0' }],
  // Virgo
  [{ d: 'M4 6.5c1.4 0 2 .8 2 2.2V18M6 9c0-1.8 1-3 2.5-3S11 7.2 11 9v9M11 9c0-1.8 1-3 2.5-3S16 7.2 16 9v7.5c0 1.8 1.2 3.5 4 3.5M16 13.5c1.6-1.8 4-1.4 4 .6s-2.4 4-5.8 5.4' }],
  // Libra
  [{ d: 'M4 19.5h16M4 15.5h5.2a3.6 3.6 0 1 1 5.6 0H20' }],
  // Scorpio
  [{ d: 'M4 6.5c1.4 0 2 .8 2 2.2V18M6 9c0-1.8 1-3 2.5-3S11 7.2 11 9v9M11 9c0-1.8 1-3 2.5-3S16 7.2 16 9v8c0 1.4.8 2 2.2 2H21M19 17l2 2-2 2' }],
  // Sagittarius
  [{ d: 'M5 19L19 5M12.5 5H19v6.5M7.5 11.5l5 5' }],
  // Capricorn
  [{ d: 'M3.5 6.5c1.2 0 2 .8 2.4 2L8 16l2.6-9.5v8c0 3 1.6 5 4.2 5a3 3 0 1 0-3-3' }],
  // Aquarius
  [{ d: 'M3 10.5l3-3 3 3 3-3 3 3 3-3 3 3M3 17l3-3 3 3 3-3 3 3 3-3 3 3' }],
  // Pisces
  [{ d: 'M6.5 4c3.2 4.4 3.2 11.6 0 16M17.5 4c-3.2 4.4-3.2 11.6 0 16M5 12h14' }],
];

export const PLANET_SHAPES: Record<PlanetId | 'asc' | 'mc', Shape[]> = {
  sun: [{ c: [12, 12, 8] }, { c: [12, 12, 1.8], fill: true }],
  moon: [{ d: 'M15 3.6A8.6 8.6 0 1 0 20.4 15 7 7 0 0 1 15 3.6z' }],
  mercury: [{ d: 'M8.4 3.5a3.6 3.6 0 0 0 7.2 0' }, { c: [12, 10.5, 4] }, { d: 'M12 14.5v6.5M9 17.8h6' }],
  venus: [{ c: [12, 9, 5] }, { d: 'M12 14v7.5M8.8 18h6.4' }],
  mars: [{ c: [10, 14, 5.5] }, { d: 'M14 10l6-6M14.8 4H20v5.2' }],
  jupiter: [{ d: 'M5 16h14.5M15.5 4v17M4.5 7.2C6 4.6 9.6 4.4 10.6 7c1 2.8-1 6.4-5.6 9' }],
  saturn: [{ d: 'M8 3v13M5 6h6M8 11.2c2-2.6 7-2.4 7 1.4 0 3-3 4.2-3 6.6 0 1.4 1.4 2 2.8 1.2' }],
  asc: [{ d: 'M4 18L9 6l5 12M5.8 14h6.4M20 9.5a3.5 3.5 0 1 0 0 5' }],
  mc: [{ d: 'M3 18V6l4.5 7L12 6v12M21 9.5a3.5 3.5 0 1 0 0 5' }],
};

export function GlyphShapes({ shapes, color, strokeWidth = 1.6 }: { shapes: Shape[]; color: string; strokeWidth?: number }) {
  return (
    <>
      {shapes.map((s, i) =>
        'd' in s ? (
          <path key={i} d={s.d} fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
        ) : (
          <circle key={i} cx={s.c[0]} cy={s.c[1]} r={s.c[2]} fill={s.fill ? color : 'none'} stroke={color} strokeWidth={strokeWidth} />
        ),
      )}
    </>
  );
}

interface IconProps {
  size?: number;
  color?: string;
  className?: string;
  strokeWidth?: number;
}

export function ZodiacGlyph({ sign, size = 20, color = 'currentColor', className, strokeWidth = 1.6 }: IconProps & { sign: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} aria-hidden="true">
      <GlyphShapes shapes={ZODIAC_SHAPES[sign]} color={color} strokeWidth={strokeWidth} />
    </svg>
  );
}

export function PlanetGlyph({ planet, size = 20, color = 'currentColor', className, strokeWidth = 1.6 }: IconProps & { planet: PlanetId | 'asc' | 'mc' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} aria-hidden="true">
      <GlyphShapes shapes={PLANET_SHAPES[planet]} color={color} strokeWidth={strokeWidth} />
    </svg>
  );
}

/** Nested glyph for use inside another SVG, centred on (x, y). */
export function SvgGlyph({ shapes, x, y, size, color, strokeWidth = 1.6 }: { shapes: Shape[]; x: number; y: number; size: number; color: string; strokeWidth?: number }) {
  const s = size / 24;
  return (
    <g transform={`translate(${x - size / 2} ${y - size / 2}) scale(${s})`} pointerEvents="none">
      <GlyphShapes shapes={shapes} color={color} strokeWidth={strokeWidth} />
    </g>
  );
}

export function OrbisLogo({ size = 36, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" className={className} aria-label="ORBIS logo">
      <defs>
        <linearGradient id="orbis-logo-g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#F8E7B0" />
          <stop offset="1" stopColor="#B8902F" />
        </linearGradient>
      </defs>
      <circle cx="24" cy="24" r="14" fill="none" stroke="url(#orbis-logo-g)" strokeWidth="1.8" />
      <circle cx="24" cy="24" r="21" fill="none" stroke="#E2E8F0" strokeOpacity="0.25" strokeWidth="0.8" strokeDasharray="1 3" />
      <ellipse cx="24" cy="24" rx="20" ry="7.5" fill="none" stroke="#A78BFA" strokeWidth="1.4" transform="rotate(-32 24 24)" />
      <ellipse cx="24" cy="24" rx="20" ry="7.5" fill="none" stroke="#E5C158" strokeOpacity="0.55" strokeWidth="1" transform="rotate(32 24 24)" />
      <circle cx="24" cy="24" r="3.2" fill="#E5C158" />
      <circle cx="40.6" cy="13.6" r="2.2" fill="#E2E8F0" />
    </svg>
  );
}
