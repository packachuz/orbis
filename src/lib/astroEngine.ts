/**
 * ORBIS — Deterministic Astronomical & Astrological Engine
 * ---------------------------------------------------------
 * Pure TypeScript ephemeris based on Keplerian orbital elements of date
 * (after Paul Schlyter's "Computing planetary positions"), including the
 * principal lunar and Jupiter/Saturn perturbation terms. Accuracy is roughly
 * 1–2 arc-minutes for the Sun and planets and a few arc-minutes for the Moon
 * across the 20th–21st centuries — more than sufficient for natal charting.
 *
 * All longitudes are tropical, geocentric ecliptic longitudes (0°–360°).
 */

export const RAD = Math.PI / 180;
export const norm360 = (x: number) => ((x % 360) + 360) % 360;
const sind = (x: number) => Math.sin(x * RAD);
const cosd = (x: number) => Math.cos(x * RAD);
const tand = (x: number) => Math.tan(x * RAD);
const atan2d = (y: number, x: number) => Math.atan2(y, x) / RAD;

/** Signed smallest difference b − a in the range (−180, 180]. */
export const angDiff = (a: number, b: number) => {
  let d = norm360(b - a);
  if (d > 180) d -= 360;
  return d;
};

/** Unsigned separation between two longitudes in [0, 180]. */
export const separation = (a: number, b: number) => Math.abs(angDiff(a, b));

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export type PlanetId = 'sun' | 'moon' | 'mercury' | 'venus' | 'mars' | 'jupiter' | 'saturn';
export type PointId = PlanetId | 'asc' | 'mc';
export type AspectType = 'conjunction' | 'sextile' | 'square' | 'trine' | 'opposition';
export type Element = 'fire' | 'earth' | 'air' | 'water';
export type Modality = 'cardinal' | 'fixed' | 'mutable';
export type OrbStrength = 'Exact Resonance' | 'Strong Influence' | 'Ambient Pull';

export const PLANET_IDS: PlanetId[] = ['sun', 'moon', 'mercury', 'venus', 'mars', 'jupiter', 'saturn'];

export const SIGN_NAMES = [
  'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
  'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces',
] as const;

export const SIGN_ELEMENTS: Element[] = ['fire', 'earth', 'air', 'water', 'fire', 'earth', 'air', 'water', 'fire', 'earth', 'air', 'water'];
export const SIGN_MODALITIES: Modality[] = ['cardinal', 'fixed', 'mutable', 'cardinal', 'fixed', 'mutable', 'cardinal', 'fixed', 'mutable', 'cardinal', 'fixed', 'mutable'];
/** Traditional (classical) rulerships — kept within the seven computed bodies. */
export const SIGN_RULERS: PlanetId[] = ['mars', 'venus', 'mercury', 'moon', 'sun', 'mercury', 'venus', 'mars', 'jupiter', 'saturn', 'saturn', 'jupiter'];

export interface BirthInput {
  name: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM (local civil time)
  unknownTime: boolean;
  lat: number; // +N / −S
  lng: number; // +E / −W
  utcOffset: number; // hours, e.g. 7 for UTC+7
  locationLabel: string;
  timezone?: string; // IANA zone (informational)
}

export interface PlanetPosition {
  id: PlanetId;
  lon: number;
  speed: number; // degrees per day
  retrograde: boolean;
  sign: number; // 0–11
  degInSign: number;
  house: number; // 1–12
}

export interface Aspect {
  a: PlanetId;
  b: PlanetId;
  type: AspectType;
  exactAngle: number;
  separation: number;
  orb: number;
  maxOrb: number;
  applying: boolean;
  strength: OrbStrength;
}

export interface NatalChart {
  input: BirthInput;
  jd: number;
  utc: Date;
  lst: number;
  obliquity: number;
  asc: number;
  mc: number;
  cusps: number[]; // 12 house cusps, index 0 = 1st house
  solarChart: boolean;
  planets: PlanetPosition[];
  aspects: Aspect[];
  elements: Record<Element, number>; // percentages
  modalities: Record<Modality, number>; // percentages
}

// ─────────────────────────────────────────────────────────────────────────────
// Aspect definitions
// ─────────────────────────────────────────────────────────────────────────────

export interface AspectDef {
  type: AspectType;
  angle: number;
  orb: number;
  color: string;
  label: string;
  symbol: string;
  nature: 'fusion' | 'harmonious' | 'dynamic';
}

export const ASPECT_DEFS: AspectDef[] = [
  { type: 'conjunction', angle: 0, orb: 8, color: '#E5C158', label: 'Conjunction', symbol: '☌', nature: 'fusion' },
  { type: 'sextile', angle: 60, orb: 6, color: '#38BDF8', label: 'Sextile', symbol: '⚹', nature: 'harmonious' },
  { type: 'square', angle: 90, orb: 7, color: '#F43F5E', label: 'Square', symbol: '□', nature: 'dynamic' },
  { type: 'trine', angle: 120, orb: 8, color: '#34D399', label: 'Trine', symbol: '△', nature: 'harmonious' },
  { type: 'opposition', angle: 180, orb: 8, color: '#A78BFA', label: 'Opposition', symbol: '☍', nature: 'dynamic' },
];

export const ASPECT_BY_TYPE = Object.fromEntries(ASPECT_DEFS.map((a) => [a.type, a])) as Record<AspectType, AspectDef>;

export const orbStrength = (orb: number): OrbStrength =>
  orb < 1.5 ? 'Exact Resonance' : orb < 4 ? 'Strong Influence' : 'Ambient Pull';

// ─────────────────────────────────────────────────────────────────────────────
// Time
// ─────────────────────────────────────────────────────────────────────────────

/** Julian Day from a JS Date (UTC). */
export const jdFromDate = (d: Date) => d.getTime() / 86400000 + 2440587.5;
export const dateFromJd = (jd: number) => new Date((jd - 2440587.5) * 86400000);
/** Schlyter day number (epoch 2000 Jan 0.0 TT ≈ UT). */
const dayNumber = (jd: number) => jd - 2451543.5;

/** Convert local civil date/time + UTC offset into a UTC Date. */
export function localToUtc(date: string, time: string, utcOffset: number): Date {
  const [y, mo, da] = date.split('-').map(Number);
  const [hh, mm] = time.split(':').map(Number);
  const d = new Date(Date.UTC(2000, 0, 1));
  d.setUTCFullYear(y, (mo || 1) - 1, da || 1);
  d.setUTCHours(hh || 0, mm || 0, 0, 0);
  return new Date(d.getTime() - utcOffset * 3600000);
}

/**
 * Historical UTC offset (DST-aware) for an IANA zone at a given local wall time,
 * using the browser's built-in tz database.
 */
export function zoneOffsetHours(timeZone: string, date: string, time: string, fallback: number): number {
  try {
    const probe = (utcMs: number) => {
      const parts = new Intl.DateTimeFormat('en-US', { timeZone, timeZoneName: 'longOffset' }).formatToParts(new Date(utcMs));
      const tzn = parts.find((p) => p.type === 'timeZoneName')?.value ?? 'GMT';
      const m = tzn.match(/GMT([+-])(\d{1,2})(?::?(\d{2}))?/);
      if (!m) return 0;
      const sign = m[1] === '-' ? -1 : 1;
      return sign * (Number(m[2]) + Number(m[3] ?? 0) / 60);
    };
    const wall = localToUtc(date, time, 0).getTime();
    let off = probe(wall - fallback * 3600000);
    off = probe(wall - off * 3600000); // refine around DST transitions
    return Number.isFinite(off) ? off : fallback;
  } catch {
    return fallback;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Orbital mechanics
// ─────────────────────────────────────────────────────────────────────────────

interface Elements { N: number; i: number; w: number; a: number; e: number; M: number }

function orbitalElements(id: PlanetId, d: number): Elements {
  switch (id) {
    case 'sun':
      return { N: 0, i: 0, w: 282.9404 + 4.70935e-5 * d, a: 1, e: 0.016709 - 1.151e-9 * d, M: 356.047 + 0.9856002585 * d };
    case 'moon':
      return { N: 125.1228 - 0.0529538083 * d, i: 5.1454, w: 318.0634 + 0.1643573223 * d, a: 60.2666, e: 0.0549, M: 115.3654 + 13.0649929509 * d };
    case 'mercury':
      return { N: 48.3313 + 3.24587e-5 * d, i: 7.0047 + 5e-8 * d, w: 29.1241 + 1.01444e-5 * d, a: 0.387098, e: 0.205635 + 5.59e-10 * d, M: 168.6562 + 4.0923344368 * d };
    case 'venus':
      return { N: 76.6799 + 2.4659e-5 * d, i: 3.3946 + 2.75e-8 * d, w: 54.891 + 1.38374e-5 * d, a: 0.72333, e: 0.006773 - 1.302e-9 * d, M: 48.0052 + 1.6021302244 * d };
    case 'mars':
      return { N: 49.5574 + 2.11081e-5 * d, i: 1.8497 - 1.78e-8 * d, w: 286.5016 + 2.92961e-5 * d, a: 1.523688, e: 0.093405 + 2.516e-9 * d, M: 18.6021 + 0.5240207766 * d };
    case 'jupiter':
      return { N: 100.4542 + 2.76854e-5 * d, i: 1.303 - 1.557e-7 * d, w: 273.8777 + 1.64505e-5 * d, a: 5.20256, e: 0.048498 + 4.469e-9 * d, M: 19.895 + 0.0830853001 * d };
    case 'saturn':
      return { N: 113.6634 + 2.3898e-5 * d, i: 2.4886 - 1.081e-7 * d, w: 339.3939 + 2.97661e-5 * d, a: 9.55475, e: 0.055546 - 9.499e-9 * d, M: 316.967 + 0.0334442282 * d };
  }
}

function solveKepler(Mdeg: number, e: number): number {
  const M = norm360(Mdeg);
  let E = M + (e / RAD) * sind(M) * (1 + e * cosd(M));
  for (let k = 0; k < 12; k++) {
    const dE = (E - (e / RAD) * sind(E) - M) / (1 - e * cosd(E));
    E -= dE;
    if (Math.abs(dE) < 1e-7) break;
  }
  return E;
}

/** Position in the orbital frame → ecliptic rectangular coordinates. */
function orbitPosition(el: Elements) {
  const E = solveKepler(el.M, el.e);
  const xv = el.a * (cosd(E) - el.e);
  const yv = el.a * Math.sqrt(1 - el.e * el.e) * sind(E);
  const v = atan2d(yv, xv);
  const r = Math.hypot(xv, yv);
  const vw = v + el.w;
  const x = r * (cosd(el.N) * cosd(vw) - sind(el.N) * sind(vw) * cosd(el.i));
  const y = r * (sind(el.N) * cosd(vw) + cosd(el.N) * sind(vw) * cosd(el.i));
  const z = r * sind(vw) * sind(el.i);
  return { x, y, z, r, v };
}

function sunState(d: number) {
  const el = orbitalElements('sun', d);
  const E = solveKepler(el.M, el.e);
  const xv = cosd(E) - el.e;
  const yv = Math.sqrt(1 - el.e * el.e) * sind(E);
  const v = atan2d(yv, xv);
  const r = Math.hypot(xv, yv);
  const lon = norm360(v + el.w);
  return { lon, r, x: r * cosd(lon), y: r * sind(lon), M: el.M, w: el.w };
}

/** Geocentric tropical ecliptic longitude of a body at day number d. */
function geocentricLongitude(id: PlanetId, d: number): number {
  const sun = sunState(d);
  if (id === 'sun') return sun.lon;

  if (id === 'moon') {
    const el = orbitalElements('moon', d);
    const p = orbitPosition(el);
    let lon = atan2d(p.y, p.x);
    const Ms = sun.M;
    const Mm = el.M;
    const Ls = Ms + sun.w;
    const Lm = el.M + el.w + el.N;
    const D = Lm - Ls;
    const F = Lm - el.N;
    lon +=
      -1.274 * sind(Mm - 2 * D) +
      0.658 * sind(2 * D) -
      0.186 * sind(Ms) -
      0.059 * sind(2 * Mm - 2 * D) -
      0.057 * sind(Mm - 2 * D + Ms) +
      0.053 * sind(Mm + 2 * D) +
      0.046 * sind(2 * D - Ms) +
      0.041 * sind(Mm - Ms) -
      0.035 * sind(D) -
      0.031 * sind(Mm + Ms) -
      0.015 * sind(2 * F - 2 * D) +
      0.011 * sind(Mm - 4 * D);
    return norm360(lon);
  }

  const el = orbitalElements(id, d);
  const p = orbitPosition(el);
  let x = p.x;
  let y = p.y;
  const z = p.z;

  if (id === 'jupiter' || id === 'saturn') {
    const Mj = orbitalElements('jupiter', d).M;
    const Msat = orbitalElements('saturn', d).M;
    let lon = atan2d(y, x);
    const lat = atan2d(z, Math.hypot(x, y));
    const r = Math.hypot(x, y, z);
    if (id === 'jupiter') {
      lon +=
        -0.332 * sind(2 * Mj - 5 * Msat - 67.6) -
        0.056 * sind(2 * Mj - 2 * Msat + 21) +
        0.042 * sind(3 * Mj - 5 * Msat + 21) -
        0.036 * sind(Mj - 2 * Msat) +
        0.022 * cosd(Mj - Msat) +
        0.023 * sind(2 * Mj - 3 * Msat + 52) -
        0.016 * sind(Mj - 5 * Msat - 69);
    } else {
      lon +=
        0.812 * sind(2 * Mj - 5 * Msat - 67.6) -
        0.229 * cosd(2 * Mj - 4 * Msat - 2) +
        0.119 * sind(Mj - 2 * Msat - 3) +
        0.046 * sind(2 * Mj - 6 * Msat - 69) +
        0.014 * sind(Mj - 3 * Msat + 32);
    }
    x = r * cosd(lon) * cosd(lat);
    y = r * sind(lon) * cosd(lat);
  }

  return norm360(atan2d(y + sun.y, x + sun.x));
}

/** Longitude + daily motion for a body at a Julian Day. */
export function bodyState(id: PlanetId, jd: number) {
  const d = dayNumber(jd);
  const lon = geocentricLongitude(id, d);
  const speed = angDiff(geocentricLongitude(id, d - 0.5), geocentricLongitude(id, d + 0.5));
  return { lon, speed, retrograde: speed < 0 };
}

// ─────────────────────────────────────────────────────────────────────────────
// Angles & houses
// ─────────────────────────────────────────────────────────────────────────────

export function siderealTime(jd: number, lng: number) {
  const T = (jd - 2451545) / 36525;
  const gmst = norm360(280.46061837 + 360.98564736629 * (jd - 2451545) + 0.000387933 * T * T - (T * T * T) / 38710000);
  return norm360(gmst + lng);
}

export function obliquity(jd: number) {
  return 23.4393 - 3.563e-7 * dayNumber(jd);
}

export function angles(jd: number, lat: number, lng: number) {
  const ramc = siderealTime(jd, lng);
  const eps = obliquity(jd);
  const safeLat = Math.max(-66, Math.min(66, lat)); // avoid polar singularities
  const mc = norm360(atan2d(sind(ramc), cosd(ramc) * cosd(eps)));
  const asc = norm360(atan2d(cosd(ramc), -(sind(ramc) * cosd(eps) + tand(safeLat) * sind(eps))));
  return { ramc, eps, mc, asc };
}

/** Porphyry quadrant houses: each quadrant between the angles is trisected. */
export function porphyryCusps(asc: number, mc: number): number[] {
  const ic = norm360(mc + 180);
  const dsc = norm360(asc + 180);
  const q1 = norm360(ic - asc); // ASC → IC
  const q2 = norm360(dsc - ic); // IC → DSC
  return [
    asc, norm360(asc + q1 / 3), norm360(asc + (2 * q1) / 3),
    ic, norm360(ic + q2 / 3), norm360(ic + (2 * q2) / 3),
    dsc, norm360(dsc + q1 / 3), norm360(dsc + (2 * q1) / 3),
    mc, norm360(mc + q2 / 3), norm360(mc + (2 * q2) / 3),
  ];
}

export function houseOf(lon: number, cusps: number[]): number {
  for (let i = 0; i < 12; i++) {
    const start = cusps[i];
    const end = cusps[(i + 1) % 12];
    if (norm360(lon - start) < norm360(end - start)) return i + 1;
  }
  return 1;
}

// ─────────────────────────────────────────────────────────────────────────────
// Aspects
// ─────────────────────────────────────────────────────────────────────────────

const isLuminary = (id: PlanetId) => id === 'sun' || id === 'moon';

export function findAspect(lonA: number, lonB: number, bonusOrb = 0) {
  const sep = separation(lonA, lonB);
  for (const def of ASPECT_DEFS) {
    const orb = Math.abs(sep - def.angle);
    if (orb <= def.orb + bonusOrb) return { def, orb, sep };
  }
  return null;
}

export function computeAspects(planets: PlanetPosition[]): Aspect[] {
  const out: Aspect[] = [];
  for (let i = 0; i < planets.length; i++) {
    for (let j = i + 1; j < planets.length; j++) {
      const A = planets[i];
      const B = planets[j];
      const bonus = isLuminary(A.id) || isLuminary(B.id) ? 1.5 : 0;
      const hit = findAspect(A.lon, B.lon, bonus);
      if (!hit) continue;
      // Applying if the orb shrinks over the next few hours.
      const dt = 0.1;
      const future = findAspectOrb(A.lon + A.speed * dt, B.lon + B.speed * dt, hit.def.angle);
      out.push({
        a: A.id,
        b: B.id,
        type: hit.def.type,
        exactAngle: hit.def.angle,
        separation: hit.sep,
        orb: hit.orb,
        maxOrb: hit.def.orb + bonus,
        applying: future < hit.orb,
        strength: orbStrength(hit.orb),
      });
    }
  }
  return out.sort((x, y) => x.orb - y.orb);
}

const findAspectOrb = (a: number, b: number, angle: number) => Math.abs(separation(a, b) - angle);

// ─────────────────────────────────────────────────────────────────────────────
// Natal chart
// ─────────────────────────────────────────────────────────────────────────────

const ELEMENT_WEIGHTS: Record<PointId, number> = { sun: 3, moon: 3, asc: 2, mercury: 2, venus: 2, mars: 2, jupiter: 1, saturn: 1, mc: 1 };

export const signOf = (lon: number) => Math.floor(norm360(lon) / 30);

export function calculateNatalChart(input: BirthInput): NatalChart {
  const solarChart = input.unknownTime;
  const time = solarChart ? '12:00' : input.time;
  const utc = localToUtc(input.date, time, input.utcOffset);
  const jd = jdFromDate(utc);
  const ang = angles(jd, input.lat, input.lng);

  const raw = PLANET_IDS.map((id) => ({ id, ...bodyState(id, jd) }));
  const sunLon = raw[0].lon;

  let asc = ang.asc;
  let mc = ang.mc;
  let cusps: number[];
  if (solarChart) {
    // Solar chart: the Sun's degree becomes the 1st-house cusp; equal 30° houses.
    asc = sunLon;
    cusps = Array.from({ length: 12 }, (_, k) => norm360(sunLon + 30 * k));
    mc = cusps[9];
  } else {
    cusps = porphyryCusps(asc, mc);
  }

  const planets: PlanetPosition[] = raw.map((p) => ({
    id: p.id,
    lon: p.lon,
    speed: p.speed,
    retrograde: p.retrograde,
    sign: signOf(p.lon),
    degInSign: norm360(p.lon) % 30,
    house: houseOf(p.lon, cusps),
  }));

  // Elemental & modality balance (weighted by planetary significance).
  const elements: Record<Element, number> = { fire: 0, earth: 0, air: 0, water: 0 };
  const modalities: Record<Modality, number> = { cardinal: 0, fixed: 0, mutable: 0 };
  const points: { id: PointId; lon: number }[] = [...planets.map((p) => ({ id: p.id as PointId, lon: p.lon }))];
  if (!solarChart) points.push({ id: 'asc', lon: asc }, { id: 'mc', lon: mc });
  let total = 0;
  for (const pt of points) {
    const w = ELEMENT_WEIGHTS[pt.id];
    const s = signOf(pt.lon);
    elements[SIGN_ELEMENTS[s]] += w;
    modalities[SIGN_MODALITIES[s]] += w;
    total += w;
  }
  (Object.keys(elements) as Element[]).forEach((k) => (elements[k] = Math.round((elements[k] / total) * 1000) / 10));
  (Object.keys(modalities) as Modality[]).forEach((k) => (modalities[k] = Math.round((modalities[k] / total) * 1000) / 10));

  return {
    input,
    jd,
    utc,
    lst: ang.ramc,
    obliquity: ang.eps,
    asc,
    mc,
    cusps,
    solarChart,
    planets,
    aspects: computeAspects(planets),
    elements,
    modalities,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Transits, stations & lunations (forecast overlay)
// ─────────────────────────────────────────────────────────────────────────────

export type TransitBody = 'sun' | 'mercury' | 'venus' | 'mars' | 'jupiter' | 'saturn';
export const TRANSIT_BODIES: TransitBody[] = ['sun', 'mercury', 'venus', 'mars', 'jupiter', 'saturn'];

export interface TransitHit {
  date: Date;
  transit: TransitBody;
  natal: PointId;
  type: AspectType;
  orb: number;
  transitLon: number;
  natalLon: number;
  score: number;
}

export interface Lunation {
  kind: 'new' | 'full';
  date: Date;
  lon: number;
  house: number;
}

export interface Station {
  body: TransitBody;
  date: Date;
  direction: 'retrograde' | 'direct';
  lon: number;
  house: number;
}

export interface MonthTransits {
  year: number;
  month: number; // 0–11
  hits: TransitHit[];
  lunations: Lunation[];
  stations: Station[];
  sunStart: number;
  sunEnd: number;
  positions: { id: TransitBody; lon: number; retrograde: boolean; house: number }[];
}

const TRANSIT_WEIGHT: Record<TransitBody, number> = { sun: 1.2, mercury: 1, venus: 1.3, mars: 1.6, jupiter: 2.4, saturn: 2.6 };
const NATAL_WEIGHT: Record<PointId, number> = { sun: 2, moon: 2, asc: 1.8, mc: 1.8, venus: 1.4, mars: 1.3, mercury: 1.1, jupiter: 1, saturn: 1.1 };

export function computeMonthTransits(chart: NatalChart, year: number, month: number): MonthTransits {
  const days = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const jd0 = jdFromDate(new Date(Date.UTC(year, month, 1, 12)));

  const natalPoints: { id: PointId; lon: number }[] = chart.planets.map((p) => ({ id: p.id as PointId, lon: p.lon }));
  if (!chart.solarChart) natalPoints.push({ id: 'asc', lon: chart.asc }, { id: 'mc', lon: chart.mc });

  // Daily samples (one extra day either side for minima detection).
  const samples: Record<TransitBody, { lon: number; speed: number }[]> = {} as never;
  for (const b of TRANSIT_BODIES) {
    samples[b] = [];
    for (let k = -1; k <= days; k++) samples[b].push(bodyState(b, jd0 + k));
  }

  const hits: TransitHit[] = [];
  for (const b of TRANSIT_BODIES) {
    const slow = b === 'jupiter' || b === 'saturn';
    const threshold = slow ? 1.5 : 1.2;
    for (const np of natalPoints) {
      for (const def of ASPECT_DEFS) {
        const orbs = samples[b].map((s) => findAspectOrb(s.lon, np.lon, def.angle));
        for (let k = 1; k <= days; k++) {
          const o = orbs[k];
          if (o > threshold) continue;
          if (o <= orbs[k - 1] && o <= orbs[k + 1]) {
            const tightness = 1 - o / threshold;
            hits.push({
              date: new Date(Date.UTC(year, month, k, 12)),
              transit: b,
              natal: np.id,
              type: def.type,
              orb: o,
              transitLon: samples[b][k].lon,
              natalLon: np.lon,
              score: TRANSIT_WEIGHT[b] * NATAL_WEIGHT[np.id] * (0.6 + tightness),
            });
          }
        }
      }
    }
  }

  // Stations (retrograde / direct turns).
  const stations: Station[] = [];
  for (const b of ['mercury', 'venus', 'mars', 'jupiter', 'saturn'] as TransitBody[]) {
    for (let k = 1; k <= days; k++) {
      const prev = samples[b][k - 1].speed;
      const cur = samples[b][k].speed;
      if (Math.sign(prev) !== Math.sign(cur) && prev !== 0) {
        stations.push({
          body: b,
          date: new Date(Date.UTC(year, month, k, 12)),
          direction: cur < 0 ? 'retrograde' : 'direct',
          lon: samples[b][k].lon,
          house: houseOf(samples[b][k].lon, chart.cusps),
        });
      }
    }
  }

  // Lunations — 3-hour stepping on Sun–Moon elongation, linear interpolation.
  const lunations: Lunation[] = [];
  const jdStart = jdFromDate(new Date(Date.UTC(year, month, 1)));
  const jdEnd = jdFromDate(new Date(Date.UTC(year, month + 1, 1)));
  const step = 0.125;
  const elong = (jd: number) => norm360(bodyState('moon', jd).lon - bodyState('sun', jd).lon);
  let prevE = elong(jdStart);
  for (let jd = jdStart + step; jd <= jdEnd; jd += step) {
    const e = elong(jd);
    const crossNew = prevE > 300 && e < 60;
    const crossFull = prevE < 180 && e >= 180;
    if (crossNew || crossFull) {
      const target = crossNew ? 360 : 180;
      const e1 = crossNew ? e + 360 : e;
      const frac = (target - prevE) / (e1 - prevE);
      const jdx = jd - step + frac * step;
      const lon = crossNew ? bodyState('sun', jdx).lon : bodyState('moon', jdx).lon;
      lunations.push({ kind: crossNew ? 'new' : 'full', date: dateFromJd(jdx), lon, house: houseOf(lon, chart.cusps) });
    }
    prevE = e;
  }

  const mid = jd0 + Math.floor(days / 2);
  const positions = TRANSIT_BODIES.map((id) => {
    const s = bodyState(id, mid);
    return { id, lon: s.lon, retrograde: s.retrograde, house: houseOf(s.lon, chart.cusps) };
  });

  return {
    year,
    month,
    hits: hits.sort((a, b) => b.score - a.score),
    lunations,
    stations,
    sunStart: samples.sun[1].lon,
    sunEnd: samples.sun[days].lon,
    positions,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Formatting helpers
// ─────────────────────────────────────────────────────────────────────────────

/** 1.7 → "1°42'" */
export function formatOrb(deg: number): string {
  const total = Math.round(Math.abs(deg) * 60);
  const d = Math.floor(total / 60);
  const m = total % 60;
  return `${d}°${String(m).padStart(2, '0')}'`;
}

/** Longitude → "14°22' Leo" */
export function formatLon(lon: number, withSign = true): string {
  const s = signOf(lon);
  const within = norm360(lon) % 30;
  return `${formatOrb(within)}${withSign ? ` ${SIGN_NAMES[s]}` : ''}`;
}

export function formatCoord(value: number, pos: string, neg: string): string {
  return `${Math.abs(value).toFixed(4)}° ${value >= 0 ? pos : neg}`;
}

export function formatUtcOffset(h: number): string {
  const sign = h >= 0 ? '+' : '−';
  const a = Math.abs(h);
  const hh = Math.floor(a);
  const mm = Math.round((a - hh) * 60);
  return `UTC${sign}${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
}

export const ordinal = (n: number) => {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return `${n}${s[(v - 20) % 10] || s[v] || s[0]}`;
};
