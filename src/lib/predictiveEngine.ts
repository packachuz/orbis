/**
 * ORBIS — Four-Clock Deterministic Predictive Astrology Engine
 * -------------------------------------------------------------
 * Pure TypeScript deterministic predictive engine providing:
 * 1. Hellenistic Lots (Fortune & Spirit with diurnal/nocturnal formula reversal & peak periods)
 *    and Profections (birthday-aware annual + sequential 12-month monthly profections).
 * 2. Secondary Progressions ("Day-for-a-Year" ephemeris, progressed Sun/Moon/planets, 8-fold phase, <=1.5° aspects).
 * 3. Exact Solar Return (Newton-Raphson Sun match <0.001°, SR Asc/MC, rising/culminating natal house, <=3° conjunctions).
 * 4. Lunar Nodes (Mean/True), Eclipse classification (<=18° / <=10° total), and planetary cycle returns.
 * 5. Rule of Three Multi-Clock Predictive Convergence Synthesis.
 *
 * Zero external runtime dependencies. All calculations are pure mathematics and celestial mechanics.
 */

import {
  type AspectType,
  type NatalChart,
  type PlanetId,
  type PointId,
  ASPECT_DEFS,
  PLANET_IDS,
  SIGN_NAMES,
  SIGN_RULERS,
  angles,
  angDiff,
  bodyState,
  computeMonthTransits,
  dateFromJd,
  houseOf,
  jdFromDate,
  lunarNodes,
  norm360,
  ordinal,
  porphyryCusps,
  separation,
  signOf,
  type Lunation,
  type LunarNodes,
} from './astroEngine';

import {
  calculateSect,
  evaluateDignities,
  type EssentialDignity,
  type LunarPhaseKey,
} from './astroSynthesis';

import { HOUSE_LORE, PLANET_LORE, POINT_NAMES } from './zodiacData';

// ─────────────────────────────────────────────────────────────────────────────
// Type Definitions
// ─────────────────────────────────────────────────────────────────────────────

// ── Clock 1: Hellenistic Lots & Profections ──

export interface HellenisticLot {
  id: 'fortune' | 'spirit';
  name: string;
  greekName: string;
  symbol: string;
  lon: number;
  sign: number;
  signName: string;
  degInSign: number;
  house: number;
  ruler: PlanetId;
  rulerName: string;
  isDiurnalFormula: boolean;
  formulaDescription: string;
  isPeakPeriod: boolean;
  peakAngle?: '1st' | '4th' | '7th' | '10th';
}

export interface HellenisticLotsResult {
  fortune: HellenisticLot;
  spirit: HellenisticLot;
  lots: HellenisticLot[];
}

export interface PredictiveProfection {
  year: number;
  month: number; // 0–11
  age: number;
  annualHouse: number;
  annualSign: number;
  annualSignName: string;
  annualTimeLord: PlanetId;
  annualTimeLordName: string;
  annualInSect: boolean;
  annualDignity: EssentialDignity;
  monthlyHouse: number;
  monthlySign: number;
  monthlySignName: string;
  monthlyTimeLord: PlanetId;
  monthlyTimeLordName: string;
  monthlyInSect: boolean;
  monthlyDignity: EssentialDignity;
  annualPeakStatus?: { isPeak: boolean; angle: string; lot: 'fortune' | 'spirit' };
  monthlyPeakStatus?: { isPeak: boolean; angle: string; lot: 'fortune' | 'spirit' };
  theme?: string;
  guidance?: string;
  transitContext?: string;
}

// ── Clock 2: Secondary Progressions ──

export interface ProgressedPlanet {
  id: PlanetId;
  lon: number;
  speed: number;
  retrograde: boolean;
  sign: number;
  degInSign: number;
  natalHouse: number;
  monthlyMotion?: number;
}

export interface ProgressedAspect {
  progressedPlanet: PlanetId;
  natalPoint: PointId;
  type: AspectType;
  exactAngle: number;
  separation: number;
  orb: number;
  applying: boolean;
  interpretation: string;
}

export interface SecondaryProgressions {
  targetYear: number;
  targetMonth: number;
  elapsedYears: number;
  progressedJd: number;
  progressedDate: Date;
  planets: ProgressedPlanet[];
  progressedMoon: ProgressedPlanet & { monthlyMotion: number };
  progressedSun: ProgressedPlanet;
  lunarPhase: {
    phaseKey: LunarPhaseKey;
    name: string;
    elongation: number;
    archetype: string;
    lifePulse: string;
  };
  tightAspects: ProgressedAspect[]; // orb <= 1.5 deg
}

// ── Clock 3: Exact Solar Return ──

export interface SolarReturnConjunction {
  srPlanet: PlanetId;
  natalPoint: PointId;
  orb: number;
  srLon: number;
  natalLon: number;
  description: string;
}

export interface SolarReturnChart {
  targetYear: number;
  exactJd: number;
  exactDate: Date;
  sunLonDiff: number; // must be < 0.001 deg
  srAsc: number;
  srMc: number;
  srCusps: number[];
  natalHouseRising: number;
  natalHouseCulminating: number;
  srMoon: {
    lon: number;
    sign: number;
    srHouse: number;
    natalHouse: number;
  };
  planets: { id: PlanetId; lon: number; sign: number; house: number; retrograde: boolean }[];
  conjunctions: SolarReturnConjunction[]; // orb <= 3.0 deg
}

// ── Clock 4: Lunar Nodes, Eclipse Seasons & Life-Cycle Returns ──

export { type LunarNodes } from './astroEngine';

export interface EclipseClassification {
  isEclipse: boolean;
  eclipseType?: 'Solar Eclipse' | 'Lunar Eclipse';
  category?: 'Total / Central' | 'Partial / Nodal';
  nodeDistance?: number;
  nearNode?: 'North Node' | 'South Node';
  date?: Date;
  lon?: number;
  house?: number;
}

export interface PlanetaryReturnMilestone {
  type:
    | 'saturn-return'
    | 'saturn-square'
    | 'saturn-opposition'
    | 'jupiter-return'
    | 'nodal-return'
    | 'nodal-reversal'
    | 'mars-return';
  title: string;
  targetDate: Date;
  age: number;
  orb: number;
  description: string;
  guidance: string;
}

export interface EclipsesAndReturns {
  nodes: LunarNodes;
  eclipses: (Lunation & EclipseClassification)[];
  returns: PlanetaryReturnMilestone[];
}

// ── R2: Multi-Clock Convergence Engine ──

export type ClockId = 'time-lords' | 'progressions' | 'solar-return' | 'transits';

export interface ClockTestimony {
  clock: ClockId;
  clockName: string;
  targetType: 'planet' | 'house';
  targetPlanet?: PlanetId;
  targetHouse?: number;
  summary: string;
  detail: string;
  weight: number;
  dateWindow?: string;
}

export type ConvergenceBadge =
  | '4-Clock Sovereign Convergence'
  | '3-Clock Major Convergence'
  | 'Dual Testimony Alignment'
  | '4-Clock Quad Convergence'
  | '3-Clock Triple Convergence'
  | '2-Clock Dual Convergence';

export interface ConvergenceItem {
  id: string;
  targetType: 'planet' | 'house';
  targetPlanet?: PlanetId;
  targetHouse?: number;
  title: string;
  clockCount: number; // 2, 3, or 4
  badge: ConvergenceBadge;
  clocksInvolved: ClockId[];
  totalScore: number;
  testimonies: ClockTestimony[];
  synthesis: string;
  dateWindow: string;
}

export interface PredictiveConvergence {
  year: number;
  month: number;
  topConvergences: ConvergenceItem[];
  allConvergences: ConvergenceItem[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Constants & Astronomical Helpers
// ─────────────────────────────────────────────────────────────────────────────

export const TROPICAL_YEAR_DAYS = 365.24219;

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
] as const;

export function isPlanetInSect(planet: PlanetId, chart: NatalChart, isDayChart: boolean): boolean {
  if (planet === 'mercury') {
    const sunPos = chart.planets.find((p) => p.id === 'sun')!;
    const mercPos = chart.planets.find((p) => p.id === 'mercury')!;
    const isMercuryOriental = norm360(sunPos.lon - mercPos.lon) > 0 && norm360(sunPos.lon - mercPos.lon) <= 180;
    return isMercuryOriental ? isDayChart : !isDayChart;
  }
  const dayPlanets: PlanetId[] = ['sun', 'jupiter', 'saturn'];
  const nightPlanets: PlanetId[] = ['moon', 'venus', 'mars'];
  return isDayChart ? dayPlanets.includes(planet) : nightPlanets.includes(planet);
}

function checkLotAngularity(house: number): { isPeak: boolean; angle?: '1st' | '4th' | '7th' | '10th' } {
  if (house === 1) return { isPeak: true, angle: '1st' };
  if (house === 4) return { isPeak: true, angle: '4th' };
  if (house === 7) return { isPeak: true, angle: '7th' };
  if (house === 10) return { isPeak: true, angle: '10th' };
  return { isPeak: false, angle: undefined };
}

function getPeakStatusForSign(
  targetSign: number,
  lotSign: number,
  lotId: 'fortune' | 'spirit',
): { isPeak: boolean; angle: string; lot: 'fortune' | 'spirit' } | undefined {
  const diff = (targetSign - lotSign + 12) % 12;
  if (diff === 0) return { isPeak: true, angle: '1st', lot: lotId };
  if (diff === 3) return { isPeak: true, angle: '4th', lot: lotId };
  if (diff === 6) return { isPeak: true, angle: '7th', lot: lotId };
  if (diff === 9) return { isPeak: true, angle: '10th', lot: lotId };
  return undefined;
}

// ─────────────────────────────────────────────────────────────────────────────
// Clock 1: Hellenistic Lots & Profections
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Computes sect-adjusted Lot of Fortune and Lot of Spirit.
 *
 * Diurnal:
 *   Fortune = ASC + Moon − Sun
 *   Spirit  = ASC + Sun − Moon
 *
 * Nocturnal:
 *   Fortune = ASC − Moon + Sun = ASC − (Moon − Sun)
 *   Spirit  = ASC − Sun + Moon = ASC + (Moon − Sun)
 *
 * Solar Chart (unknownTime: true):
 *   Fortune = Moon
 *   Spirit  = 2*Sun − Moon
 */
export function computeHellenisticLots(chart: NatalChart): HellenisticLotsResult {
  const sect = calculateSect(chart);
  const isDay = sect.isDayChart;
  const sun = chart.planets.find((p) => p.id === 'sun')!;
  const moon = chart.planets.find((p) => p.id === 'moon')!;

  let fortuneLon: number;
  let spiritLon: number;

  if (chart.solarChart) {
    fortuneLon = norm360(moon.lon);
    spiritLon = norm360(2 * sun.lon - moon.lon);
  } else if (isDay) {
    fortuneLon = norm360(chart.asc + moon.lon - sun.lon);
    spiritLon = norm360(chart.asc + sun.lon - moon.lon);
  } else {
    fortuneLon = norm360(chart.asc - moon.lon + sun.lon);
    spiritLon = norm360(chart.asc - sun.lon + moon.lon);
  }

  const fortuneSign = signOf(fortuneLon);
  const spiritSign = signOf(spiritLon);

  const fortuneHouse = chart.solarChart
    ? ((fortuneSign - signOf(chart.asc) + 12) % 12) + 1
    : houseOf(fortuneLon, chart.cusps);

  const spiritHouse = chart.solarChart
    ? ((spiritSign - signOf(chart.asc) + 12) % 12) + 1
    : houseOf(spiritLon, chart.cusps);

  const fortuneRuler = SIGN_RULERS[fortuneSign];
  const spiritRuler = SIGN_RULERS[spiritSign];

  const fortunePeak = checkLotAngularity(fortuneHouse);
  const spiritPeak = checkLotAngularity(spiritHouse);

  const fortune: HellenisticLot = {
    id: 'fortune',
    name: 'Lot of Fortune',
    greekName: 'Klēros Tychēs',
    symbol: '⊕',
    lon: fortuneLon,
    sign: fortuneSign,
    signName: SIGN_NAMES[fortuneSign],
    degInSign: norm360(fortuneLon) % 30,
    house: fortuneHouse,
    ruler: fortuneRuler,
    rulerName: PLANET_LORE[fortuneRuler].name,
    isDiurnalFormula: isDay,
    formulaDescription: chart.solarChart
      ? 'Moon (Solar Chart)'
      : isDay
      ? 'ASC + Moon − Sun (Diurnal)'
      : 'ASC − Moon + Sun (Nocturnal)',
    isPeakPeriod: fortunePeak.isPeak,
    peakAngle: fortunePeak.angle,
  };

  const spirit: HellenisticLot = {
    id: 'spirit',
    name: 'Lot of Spirit',
    greekName: 'Klēros Daimonos',
    symbol: '☉',
    lon: spiritLon,
    sign: spiritSign,
    signName: SIGN_NAMES[spiritSign],
    degInSign: norm360(spiritLon) % 30,
    house: spiritHouse,
    ruler: spiritRuler,
    rulerName: PLANET_LORE[spiritRuler].name,
    isDiurnalFormula: isDay,
    formulaDescription: chart.solarChart
      ? '2×Sun − Moon (Solar Chart)'
      : isDay
      ? 'ASC + Sun − Moon (Diurnal)'
      : 'ASC − Sun + Moon (Nocturnal)',
    isPeakPeriod: spiritPeak.isPeak,
    peakAngle: spiritPeak.angle,
  };

  return {
    fortune,
    spirit,
    lots: [fortune, spirit],
  };
}

/**
 * Computes birthday-aware Annual Profections and sequential 12-month Monthly Profections.
 *
 * Annual: Turns on the native's birthday month in targetYear.
 * Monthly: Advances 1 Whole-Sign house/month starting from the birthday month.
 */
export function computePredictiveProfection(
  chart: NatalChart,
  targetYear: number,
  targetMonth?: number,
): PredictiveProfection {
  const [birthY, birthM] = chart.input.date.split('-').map(Number);
  const m0 = targetMonth !== undefined ? targetMonth : 9; // 0-indexed month, default October (9)
  const targetMonth1 = m0 + 1; // 1-indexed

  // Birthday-aware age calculation
  let age: number;
  if (targetMonth !== undefined) {
    age = targetMonth1 >= birthM ? targetYear - birthY : targetYear - birthY - 1;
  } else {
    age = targetYear - birthY;
  }
  if (age < 0) age = 0;

  // Annual Profection (Whole-Sign from Ascendant sign)
  const houseOffset = ((age % 12) + 12) % 12;
  const annualHouse = houseOffset + 1;
  const ascSign = signOf(chart.asc);
  const annualSign = (ascSign + houseOffset) % 12;
  const annualSignName = SIGN_NAMES[annualSign];
  const annualTimeLord = SIGN_RULERS[annualSign];
  const annualTimeLordName = PLANET_LORE[annualTimeLord].name;

  const sect = calculateSect(chart);
  const dignities = evaluateDignities(chart);
  const annualInSect = isPlanetInSect(annualTimeLord, chart, sect.isDayChart);
  const annualDignity = dignities[annualTimeLord];

  // Monthly Profection: 1 house/month from birth month sequentially
  const birthM0 = birthM - 1; // 0-indexed birth month
  const deltaM = ((m0 - birthM0) % 12 + 12) % 12;
  const monthlyHouseOffset = ((houseOffset + deltaM) % 12 + 12) % 12;
  const monthlyHouse = monthlyHouseOffset + 1;
  const monthlySign = (ascSign + monthlyHouseOffset) % 12;
  const monthlySignName = SIGN_NAMES[monthlySign];
  const monthlyTimeLord = SIGN_RULERS[monthlySign];
  const monthlyTimeLordName = PLANET_LORE[monthlyTimeLord].name;
  const monthlyInSect = isPlanetInSect(monthlyTimeLord, chart, sect.isDayChart);
  const monthlyDignity = dignities[monthlyTimeLord];

  // Peak period detection relative to Lots
  const lots = computeHellenisticLots(chart);
  const annualPeakStatus =
    getPeakStatusForSign(annualSign, lots.fortune.sign, 'fortune') ||
    getPeakStatusForSign(annualSign, lots.spirit.sign, 'spirit');

  const monthlyPeakStatus =
    getPeakStatusForSign(monthlySign, lots.fortune.sign, 'fortune') ||
    getPeakStatusForSign(monthlySign, lots.spirit.sign, 'spirit');

  const domain = HOUSE_LORE[annualHouse - 1].domain;
  const theme = `In ${targetYear} (age ${age}), your life activates the ${ordinal(annualHouse)} House of ${domain}. ${annualTimeLordName} rules as your Annual Time-Lord, while ${monthlyTimeLordName} commands the ${MONTH_NAMES[m0]} monthly chapter in your ${ordinal(monthlyHouse)} House.`;

  const guidance = annualInSect
    ? `${annualTimeLordName} is in-sect for your ${sect.sectName.toLowerCase()}, offering constructive momentum. Operating from ${annualDignity.label} in ${annualDignity.signName}, channel your strategic agency into ${domain}.`
    : `${annualTimeLordName} operates contrary to sect, presenting rigorous growth tests in ${domain}. Build resilience through patience and deliberate discipline.`;

  return {
    year: targetYear,
    month: m0,
    age,
    annualHouse,
    annualSign,
    annualSignName,
    annualTimeLord,
    annualTimeLordName,
    annualInSect,
    annualDignity,
    monthlyHouse,
    monthlySign,
    monthlySignName,
    monthlyTimeLord,
    monthlyTimeLordName,
    monthlyInSect,
    monthlyDignity,
    annualPeakStatus,
    monthlyPeakStatus,
    theme,
    guidance,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Clock 2: Secondary Progressions ("Day-for-a-Year")
// ─────────────────────────────────────────────────────────────────────────────

const PROGRESSION_PHASES: {
  key: LunarPhaseKey;
  name: string;
  archetype: string;
  lifePulse: string;
}[] = [
  {
    key: 'new',
    name: 'Progressed New Moon',
    archetype: 'Emergence & Germination',
    lifePulse: 'A new ~30-year subjective cycle commences. Seed intentions in the dark; focus inward on authentic identity.',
  },
  {
    key: 'waxing-crescent',
    name: 'Progressed Waxing Crescent',
    archetype: 'Early Cultivation',
    lifePulse: 'Taking tentative outward steps. Overcome gravitational pull of past patterns with daily commitment.',
  },
  {
    key: 'first-quarter',
    name: 'Progressed First Quarter',
    archetype: 'Action & Structural Overhaul',
    lifePulse: 'Crisis in action. Decisive commitments and structural decisions establish the framework of this 30-year arc.',
  },
  {
    key: 'gibbous',
    name: 'Progressed Gibbous',
    archetype: 'Refinement & Apprenticeship',
    lifePulse: 'Honing techniques and integrating skills. Preparing the vessel for full illumination.',
  },
  {
    key: 'full',
    name: 'Progressed Full Moon',
    archetype: 'Culmination & Illumination',
    lifePulse: 'Peak biographical visibility and fruition. Internal intentions meet objective social reality.',
  },
  {
    key: 'disseminating',
    name: 'Progressed Disseminating',
    archetype: 'Distribution & Mentorship',
    lifePulse: 'Sharing wisdom harvested during culmination. Teaching, writing, and contributing to the collective.',
  },
  {
    key: 'last-quarter',
    name: 'Progressed Last Quarter',
    archetype: 'Reorientation & Letting Go',
    lifePulse: 'Crisis in consciousness. Discarding outmoded societal expectations; clearing away non-essential commitments.',
  },
  {
    key: 'balsamic',
    name: 'Progressed Balsamic',
    archetype: 'Closure & Incubation',
    lifePulse: 'Consummation, rest, and surrender. Releasing the dying cycle to prepare the psychic ground for rebirth.',
  },
];

/**
 * Computes Secondary Progressions where 1 solar day after birth = 1 tropical year of life.
 */
export function computeSecondaryProgressions(
  chart: NatalChart,
  targetYear: number,
  targetMonth?: number,
): SecondaryProgressions {
  const m = targetMonth !== undefined ? targetMonth : 9;
  const targetDate = new Date(Date.UTC(targetYear, m, 15, 12, 0, 0));
  const targetJd = jdFromDate(targetDate);

  const elapsedYears = (targetJd - chart.jd) / TROPICAL_YEAR_DAYS;
  const progressedJd = chart.jd + elapsedYears;
  const progressedDate = dateFromJd(progressedJd);

  const planets: ProgressedPlanet[] = PLANET_IDS.map((id) => {
    const st = bodyState(id, progressedJd);
    const sign = signOf(st.lon);
    const degInSign = norm360(st.lon) % 30;
    const natalHouse = houseOf(st.lon, chart.cusps);
    return {
      id,
      lon: st.lon,
      speed: st.speed,
      retrograde: st.retrograde,
      sign,
      degInSign,
      natalHouse,
    };
  });

  const progSun = planets.find((p) => p.id === 'sun')!;
  const rawMoon = planets.find((p) => p.id === 'moon')!;
  const monthlyMotion = rawMoon.speed / 12;

  const progressedMoon: ProgressedPlanet & { monthlyMotion: number } = {
    ...rawMoon,
    monthlyMotion,
  };

  // 8-Fold Progressed Lunar Phase
  const elongation = norm360(progressedMoon.lon - progSun.lon);
  const phaseIdx = Math.floor(elongation / 45) % 8;
  const phaseDef = PROGRESSION_PHASES[phaseIdx];
  const lunarPhase = {
    phaseKey: phaseDef.key,
    name: phaseDef.name,
    elongation,
    archetype: phaseDef.archetype,
    lifePulse: phaseDef.lifePulse,
  };

  // Tight Progressed-to-Natal Ptolemaic aspects (orb <= 1.5°)
  const natalPoints: { id: PointId; lon: number }[] = chart.planets.map((p) => ({
    id: p.id as PointId,
    lon: p.lon,
  }));
  if (!chart.solarChart) {
    natalPoints.push({ id: 'asc', lon: chart.asc }, { id: 'mc', lon: chart.mc });
  }

  const tightAspects: ProgressedAspect[] = [];
  const futureJd = progressedJd + 0.02; // ~1 week in ephemeris time to check applying motion

  for (const progP of planets) {
    for (const natPt of natalPoints) {
      const sep = separation(progP.lon, natPt.lon);
      for (const def of ASPECT_DEFS) {
        const orb = Math.abs(sep - def.angle);
        if (orb <= 1.5) {
          const futureProgLon = bodyState(progP.id, futureJd).lon;
          const futureSep = separation(futureProgLon, natPt.lon);
          const futureOrb = Math.abs(futureSep - def.angle);
          const applying = futureOrb < orb;

          const pName = PLANET_LORE[progP.id].name;
          const nName = POINT_NAMES[natPt.id];
          const interpretation = `Progressed ${pName} forms an exact ${def.label.toLowerCase()} (${orb.toFixed(2)}° orb, ${applying ? 'applying' : 'separating'}) to your natal ${nName}, marking a pivotal biographical developmental threshold.`;

          tightAspects.push({
            progressedPlanet: progP.id,
            natalPoint: natPt.id,
            type: def.type,
            exactAngle: def.angle,
            separation: sep,
            orb,
            applying,
            interpretation,
          });
        }
      }
    }
  }

  tightAspects.sort((a, b) => a.orb - b.orb);

  return {
    targetYear,
    targetMonth: m,
    elapsedYears,
    progressedJd,
    progressedDate,
    planets,
    progressedMoon,
    progressedSun: progSun,
    lunarPhase,
    tightAspects,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Clock 3: Exact Solar Return (Annual Revolution)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Computes the exact timestamp in targetYear when the transiting Sun returns
 * to the exact natal Sun ecliptic longitude (solved via Newton-Raphson to <0.001°).
 */
export function computeExactSolarReturn(chart: NatalChart, targetYear: number): SolarReturnChart {
  const natalSun = chart.planets.find((p) => p.id === 'sun')!;
  const natalSunLon = natalSun.lon;
  const [birthY] = chart.input.date.split('-').map(Number);

  // Initial estimate: natalJd + deltaYears * 365.24219
  const deltaYears = targetYear - birthY;
  let jd = chart.jd + deltaYears * TROPICAL_YEAR_DAYS;

  // Newton-Raphson root finding: Sun(jd) - natalSunLon = 0
  let diff = angDiff(bodyState('sun', jd).lon, natalSunLon);
  let iter = 0;
  while (Math.abs(diff) >= 0.00005 && iter < 30) {
    const speed = bodyState('sun', jd).speed; // deg/day (~0.9856)
    jd += diff / speed;
    diff = angDiff(bodyState('sun', jd).lon, natalSunLon);
    iter++;
  }

  const exactSunLon = bodyState('sun', jd).lon;
  const sunLonDiff = Math.abs(angDiff(exactSunLon, natalSunLon));
  const exactDate = dateFromJd(jd);

  // Solar Return Angles and House Cusps
  let srAsc: number;
  let srMc: number;
  let srCusps: number[];

  if (chart.solarChart) {
    srAsc = exactSunLon;
    srMc = norm360(srAsc + 270);
    srCusps = Array.from({ length: 12 }, (_, i) => norm360(srAsc + i * 30));
  } else {
    const ang = angles(jd, chart.input.lat, chart.input.lng);
    srAsc = ang.asc;
    srMc = ang.mc;
    srCusps = porphyryCusps(srAsc, srMc);
  }

  const natalHouseRising = houseOf(srAsc, chart.cusps);
  const natalHouseCulminating = houseOf(srMc, chart.cusps);

  const srMoonSt = bodyState('moon', jd);
  const srMoon = {
    lon: srMoonSt.lon,
    sign: signOf(srMoonSt.lon),
    srHouse: houseOf(srMoonSt.lon, srCusps),
    natalHouse: houseOf(srMoonSt.lon, chart.cusps),
  };

  const srPlanets = PLANET_IDS.map((id) => {
    const st = bodyState(id, jd);
    return {
      id,
      lon: st.lon,
      sign: signOf(st.lon),
      house: houseOf(st.lon, srCusps),
      retrograde: st.retrograde,
    };
  });

  // Tight SR-to-Natal Conjunctions (orb <= 3.0°)
  const natalPoints: { id: PointId; lon: number }[] = chart.planets.map((p) => ({
    id: p.id as PointId,
    lon: p.lon,
  }));
  if (!chart.solarChart) {
    natalPoints.push({ id: 'asc', lon: chart.asc }, { id: 'mc', lon: chart.mc });
  }

  const conjunctions: SolarReturnConjunction[] = [];
  for (const srp of srPlanets) {
    for (const natPt of natalPoints) {
      const sep = separation(srp.lon, natPt.lon);
      if (sep <= 3.0) {
        conjunctions.push({
          srPlanet: srp.id,
          natalPoint: natPt.id,
          orb: sep,
          srLon: srp.lon,
          natalLon: natPt.lon,
          description: `Solar Return ${PLANET_LORE[srp.id].name} conjoins natal ${POINT_NAMES[natPt.id]} (orb ${sep.toFixed(2)}°), activating this placement for the entire solar year.`,
        });
      }
    }
  }

  conjunctions.sort((a, b) => a.orb - b.orb);

  return {
    targetYear,
    exactJd: jd,
    exactDate,
    sunLonDiff,
    srAsc,
    srMc,
    srCusps,
    natalHouseRising,
    natalHouseCulminating,
    srMoon,
    planets: srPlanets,
    conjunctions,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Clock 4: Lunar Nodes, Eclipse Seasons & Life-Cycle Returns
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Classifies eclipses for the target month (<=18° of nodes) and detects
 * major planetary returns/squares/oppositions across the target year.
 */
export function classifyEclipsesAndReturns(
  chart: NatalChart,
  targetYear: number,
  targetMonth?: number,
): EclipsesAndReturns {
  const m = targetMonth !== undefined ? targetMonth : 9;
  const monthTransits = computeMonthTransits(chart, targetYear, m);
  const targetDate = new Date(Date.UTC(targetYear, m, 15, 12, 0, 0));
  const nodes = lunarNodes(jdFromDate(targetDate));

  // Classify lunations in the target month
  const eclipses: (Lunation & EclipseClassification)[] = monthTransits.lunations.map((lun) => {
    const distN = separation(lun.lon, nodes.meanNorth);
    const distS = separation(lun.lon, nodes.meanSouth);
    const nodeDistance = Math.min(distN, distS);
    const isEclipse = nodeDistance <= 18.0;
    const eclipseType = isEclipse
      ? (lun.kind === 'new' ? 'Solar Eclipse' : 'Lunar Eclipse')
      : undefined;
    const category = isEclipse
      ? (nodeDistance <= 10.0 ? 'Total / Central' : 'Partial / Nodal')
      : undefined;
    const nearNode = distN < distS ? 'North Node' : 'South Node';

    return {
      ...lun,
      isEclipse,
      eclipseType,
      category,
      nodeDistance,
      nearNode,
    };
  });

  // Detect major life-cycle returns across the target year
  const returns: PlanetaryReturnMilestone[] = [];
  const [birthY] = chart.input.date.split('-').map(Number);
  const currentAge = targetYear - birthY;

  const natalSat = chart.planets.find((p) => p.id === 'saturn')!;
  const natalJup = chart.planets.find((p) => p.id === 'jupiter')!;
  const natalMars = chart.planets.find((p) => p.id === 'mars')!;
  const natalNodes = lunarNodes(chart.jd);

  // Sample monthly through the target year to detect exact hits
  for (let mo = 0; mo < 12; mo++) {
    const jdMid = jdFromDate(new Date(Date.UTC(targetYear, mo, 15, 12)));
    const dateMid = new Date(Date.UTC(targetYear, mo, 15));

    // Saturn Return (conjunction <= 6°)
    const satSt = bodyState('saturn', jdMid);
    const satSep = separation(satSt.lon, natalSat.lon);
    if (satSep <= 6.0) {
      if (!returns.some((r) => r.type === 'saturn-return')) {
        returns.push({
          type: 'saturn-return',
          title: 'Saturn Return',
          targetDate: dateMid,
          age: currentAge,
          orb: satSep,
          description: `Transiting Saturn returns to natal Saturn in ${SIGN_NAMES[natalSat.sign]} (orb ${satSep.toFixed(1)}°). A major developmental threshold of architectural restructuring and adult maturity.`,
          guidance: 'Take radical ownership of your vocational foundations, discipline, and long-term commitments.',
        });
      }
    }

    // Saturn Square (90° <= 6°)
    const satSqOrb = Math.abs(satSep - 90);
    if (satSqOrb <= 6.0) {
      if (!returns.some((r) => r.type === 'saturn-square')) {
        returns.push({
          type: 'saturn-square',
          title: 'Saturn Square',
          targetDate: dateMid,
          age: currentAge,
          orb: satSqOrb,
          description: `Transiting Saturn forms a friction square to natal Saturn (orb ${satSqOrb.toFixed(1)}°), testing structural integrity.`,
          guidance: 'Patience and pragmatic adjustment will resolve points of friction.',
        });
      }
    }

    // Saturn Opposition (180° <= 6°)
    const satOppOrb = Math.abs(satSep - 180);
    if (satOppOrb <= 6.0) {
      if (!returns.some((r) => r.type === 'saturn-opposition')) {
        returns.push({
          type: 'saturn-opposition',
          title: 'Saturn Opposition',
          targetDate: dateMid,
          age: currentAge,
          orb: satOppOrb,
          description: `Transiting Saturn opposes natal Saturn (orb ${satOppOrb.toFixed(1)}°), bringing a 14-year cycle climax.`,
          guidance: 'Evaluate relationships, external obligations, and public commitments with objectivity.',
        });
      }
    }

    // Jupiter Return (conjunction <= 6°)
    const jupSt = bodyState('jupiter', jdMid);
    const jupSep = separation(jupSt.lon, natalJup.lon);
    if (jupSep <= 6.0) {
      if (!returns.some((r) => r.type === 'jupiter-return')) {
        returns.push({
          type: 'jupiter-return',
          title: 'Jupiter Return',
          targetDate: dateMid,
          age: currentAge,
          orb: jupSep,
          description: `Transiting Jupiter returns to natal Jupiter in ${SIGN_NAMES[natalJup.sign]} (orb ${jupSep.toFixed(1)}°), initiating a new 12-year expansion cycle.`,
          guidance: 'Embrace visionary expansion, philosophical growth, and high-leverage opportunities.',
        });
      }
    }

    // Mars Return (conjunction <= 5°)
    const marsSt = bodyState('mars', jdMid);
    const marsSep = separation(marsSt.lon, natalMars.lon);
    if (marsSep <= 5.0) {
      if (!returns.some((r) => r.type === 'mars-return')) {
        returns.push({
          type: 'mars-return',
          title: 'Mars Return',
          targetDate: dateMid,
          age: currentAge,
          orb: marsSep,
          description: `Transiting Mars returns to natal Mars in ${SIGN_NAMES[natalMars.sign]} (orb ${marsSep.toFixed(1)}°), rebooting your physical vitality and ambition.`,
          guidance: 'Direct your ambition boldly into clear priority projects.',
        });
      }
    }

    // Nodal Return & Reversal
    const yearNodes = lunarNodes(jdMid);
    const nodeReturnSep = separation(yearNodes.meanNorth, natalNodes.meanNorth);
    if (nodeReturnSep <= 6.0) {
      if (!returns.some((r) => r.type === 'nodal-return')) {
        returns.push({
          type: 'nodal-return',
          title: 'Nodal Return',
          targetDate: dateMid,
          age: currentAge,
          orb: nodeReturnSep,
          description: `Transiting Lunar Nodes return to their natal axis (orb ${nodeReturnSep.toFixed(1)}°). A karmic realignment of life path and destiny.`,
          guidance: 'Lean boldly toward your North Node calling while releasing outworn South Node habits.',
        });
      }
    }

    const nodeReverseSep = separation(yearNodes.meanNorth, natalNodes.meanSouth);
    if (nodeReverseSep <= 6.0) {
      if (!returns.some((r) => r.type === 'nodal-reversal')) {
        returns.push({
          type: 'nodal-reversal',
          title: 'Nodal Reversal (Inverted Nodes)',
          targetDate: dateMid,
          age: currentAge,
          orb: nodeReverseSep,
          description: `Transiting North Node conjoins natal South Node (orb ${nodeReverseSep.toFixed(1)}°), prompting integration of past wisdom.`,
          guidance: 'Integrate past mastery to open up fresh pathways forward.',
        });
      }
    }
  }

  return {
    nodes,
    eclipses,
    returns,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// R2: Rule of Three Predictive Convergence Engine
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Synthesizes testimonies across all four predictive clocks (Time-Lords, Progressions,
 * Solar Return, Transits/Eclipses). Groups by target planet/house and filters for
 * multi-clock convergences (>=2 distinct clocks).
 */
export function computePredictiveConvergence(
  chart: NatalChart,
  targetYear: number,
  targetMonth: number,
): PredictiveConvergence {
  const m = targetMonth;
  const monthName = MONTH_NAMES[m];
  const dateWindow = `${monthName} ${targetYear}`;

  const testimonies: ClockTestimony[] = [];

  // 1. Clock 1 Testimonies (Time-Lords & Lots)
  const profection = computePredictiveProfection(chart, targetYear, m);
  const lots = computeHellenisticLots(chart);

  testimonies.push({
    clock: 'time-lords',
    clockName: 'Hellenistic Time-Lords & Profections',
    targetType: 'planet',
    targetPlanet: profection.annualTimeLord,
    summary: `Annual Time-Lord: ${profection.annualTimeLordName}`,
    detail: `Governing Annual Time-Lord presiding over the ${ordinal(profection.annualHouse)} House (${profection.annualSignName}).`,
    weight: 3.5,
    dateWindow,
  });

  testimonies.push({
    clock: 'time-lords',
    clockName: 'Hellenistic Time-Lords & Profections',
    targetType: 'house',
    targetHouse: profection.annualHouse,
    summary: `Annual Profected House: ${ordinal(profection.annualHouse)} House`,
    detail: `The ${ordinal(profection.annualHouse)} House of ${HOUSE_LORE[profection.annualHouse - 1].domain} is active as your primary annual chapter.`,
    weight: 3.5,
    dateWindow,
  });

  testimonies.push({
    clock: 'time-lords',
    clockName: 'Hellenistic Time-Lords & Profections',
    targetType: 'planet',
    targetPlanet: profection.monthlyTimeLord,
    summary: `Monthly Time-Lord: ${profection.monthlyTimeLordName}`,
    detail: `Monthly Time-Lord directing ${monthName} ${targetYear} in your ${ordinal(profection.monthlyHouse)} House.`,
    weight: 2.5,
    dateWindow,
  });

  testimonies.push({
    clock: 'time-lords',
    clockName: 'Hellenistic Time-Lords & Profections',
    targetType: 'house',
    targetHouse: profection.monthlyHouse,
    summary: `Monthly Profected House: ${ordinal(profection.monthlyHouse)} House`,
    detail: `Monthly focus lands on the ${ordinal(profection.monthlyHouse)} House of ${HOUSE_LORE[profection.monthlyHouse - 1].domain}.`,
    weight: 2.5,
    dateWindow,
  });

  testimonies.push({
    clock: 'time-lords',
    clockName: 'Hellenistic Time-Lords & Profections',
    targetType: 'house',
    targetHouse: lots.fortune.house,
    summary: `Lot of Fortune in ${ordinal(lots.fortune.house)} House`,
    detail: `Lot of Fortune (${lots.fortune.signName} ${lots.fortune.degInSign.toFixed(1)}°) anchors material circumstances in the ${ordinal(lots.fortune.house)} House of ${HOUSE_LORE[lots.fortune.house - 1].domain}.`,
    weight: 2.2,
    dateWindow,
  });

  testimonies.push({
    clock: 'time-lords',
    clockName: 'Hellenistic Time-Lords & Profections',
    targetType: 'house',
    targetHouse: lots.spirit.house,
    summary: `Lot of Spirit in ${ordinal(lots.spirit.house)} House`,
    detail: `Lot of Spirit (${lots.spirit.signName} ${lots.spirit.degInSign.toFixed(1)}°) directs vocational initiative into the ${ordinal(lots.spirit.house)} House of ${HOUSE_LORE[lots.spirit.house - 1].domain}.`,
    weight: 2.0,
    dateWindow,
  });

  if (profection.annualPeakStatus?.isPeak) {
    testimonies.push({
      clock: 'time-lords',
      clockName: 'Hellenistic Time-Lords & Profections',
      targetType: 'house',
      targetHouse: profection.annualHouse,
      summary: `Angular Peak Pivot (${profection.annualPeakStatus.angle} from Lot of ${profection.annualPeakStatus.lot === 'fortune' ? 'Fortune' : 'Spirit'})`,
      detail: `Your annual profection reaches an Angular Peak pivot relative to the Lot of ${profection.annualPeakStatus.lot === 'fortune' ? 'Fortune' : 'Spirit'}.`,
      weight: 4.0,
      dateWindow,
    });
  }

  // 2. Clock 2 Testimonies (Secondary Progressions)
  const progressions = computeSecondaryProgressions(chart, targetYear, m);

  testimonies.push({
    clock: 'progressions',
    clockName: 'Secondary Progressions',
    targetType: 'house',
    targetHouse: progressions.progressedMoon.natalHouse,
    summary: `Progressed Moon in Natal ${ordinal(progressions.progressedMoon.natalHouse)} House`,
    detail: `Progressed Moon traverses your natal ${ordinal(progressions.progressedMoon.natalHouse)} House in ${SIGN_NAMES[progressions.progressedMoon.sign]} (${progressions.progressedMoon.monthlyMotion.toFixed(2)}°/mo).`,
    weight: 2.8,
    dateWindow,
  });

  testimonies.push({
    clock: 'progressions',
    clockName: 'Secondary Progressions',
    targetType: 'planet',
    targetPlanet: 'moon',
    summary: `${progressions.lunarPhase.name}`,
    detail: `${progressions.lunarPhase.archetype}: ${progressions.lunarPhase.lifePulse}`,
    weight: 2.5,
    dateWindow,
  });

  for (const aspect of progressions.tightAspects) {
    if (aspect.natalPoint !== 'asc' && aspect.natalPoint !== 'mc') {
      testimonies.push({
        clock: 'progressions',
        clockName: 'Secondary Progressions',
        targetType: 'planet',
        targetPlanet: aspect.natalPoint as PlanetId,
        summary: `Progressed ${PLANET_LORE[aspect.progressedPlanet].name} ${aspect.type} Natal ${POINT_NAMES[aspect.natalPoint]}`,
        detail: aspect.interpretation,
        weight: 3.5 * (1 - aspect.orb / 1.5),
        dateWindow,
      });
    }
  }

  // 3. Clock 3 Testimonies (Exact Solar Return)
  const sr = computeExactSolarReturn(chart, targetYear);

  testimonies.push({
    clock: 'solar-return',
    clockName: 'Exact Solar Return',
    targetType: 'house',
    targetHouse: sr.natalHouseRising,
    summary: `Solar Return Ascendant in Natal ${ordinal(sr.natalHouseRising)} House`,
    detail: `Solar Return Ascendant rises in your natal ${ordinal(sr.natalHouseRising)} House of ${HOUSE_LORE[sr.natalHouseRising - 1].domain}, anchoring your annual theme.`,
    weight: 3.2,
    dateWindow: `Solar Return ${sr.exactDate.toISOString().slice(0, 10)}`,
  });

  testimonies.push({
    clock: 'solar-return',
    clockName: 'Exact Solar Return',
    targetType: 'house',
    targetHouse: sr.natalHouseCulminating,
    summary: `Solar Return Midheaven in Natal ${ordinal(sr.natalHouseCulminating)} House`,
    detail: `Solar Return Midheaven culminates in your natal ${ordinal(sr.natalHouseCulminating)} House of ${HOUSE_LORE[sr.natalHouseCulminating - 1].domain}.`,
    weight: 2.8,
    dateWindow: `Solar Return ${sr.exactDate.toISOString().slice(0, 10)}`,
  });

  for (const conj of sr.conjunctions) {
    if (conj.natalPoint !== 'asc' && conj.natalPoint !== 'mc') {
      testimonies.push({
        clock: 'solar-return',
        clockName: 'Exact Solar Return',
        targetType: 'planet',
        targetPlanet: conj.natalPoint as PlanetId,
        summary: `SR ${PLANET_LORE[conj.srPlanet].name} conjoins natal ${POINT_NAMES[conj.natalPoint]}`,
        detail: conj.description,
        weight: 3.0 * (1 - conj.orb / 3.0),
        dateWindow: `Annual Solar Year ${targetYear}`,
      });
    }
  }

  // 4. Clock 4 Testimonies (Transits, Eclipses & Returns)
  const eclipsesAndReturns = classifyEclipsesAndReturns(chart, targetYear, m);
  const monthTransits = computeMonthTransits(chart, targetYear, m);

  // Eclipses in month
  for (const ecl of eclipsesAndReturns.eclipses) {
    if (ecl.isEclipse) {
      testimonies.push({
        clock: 'transits',
        clockName: 'Transits, Eclipses & Returns',
        targetType: 'house',
        targetHouse: ecl.house,
        summary: `${ecl.category} ${ecl.eclipseType} in ${ordinal(ecl.house)} House`,
        detail: `${ecl.category} ${ecl.eclipseType} falls at ${ecl.lon.toFixed(1)}° in your ${ordinal(ecl.house)} House of ${HOUSE_LORE[ecl.house - 1].domain}.`,
        weight: 4.5,
        dateWindow: ecl.date ? ecl.date.toISOString().slice(0, 10) : dateWindow,
      });
    }
  }

  // Major Returns in year
  for (const ret of eclipsesAndReturns.returns) {
    let targetPlanet: PlanetId | undefined;
    if (ret.type.startsWith('saturn')) targetPlanet = 'saturn';
    else if (ret.type.startsWith('jupiter')) targetPlanet = 'jupiter';
    else if (ret.type.startsWith('mars')) targetPlanet = 'mars';

    if (targetPlanet) {
      testimonies.push({
        clock: 'transits',
        clockName: 'Transits, Eclipses & Returns',
        targetType: 'planet',
        targetPlanet,
        summary: ret.title,
        detail: ret.description,
        weight: 4.0,
        dateWindow: `${ret.targetDate.toISOString().slice(0, 7)}`,
      });
    }
  }

  // Monthly transit aspect hits to natal planets
  for (const hit of monthTransits.hits.slice(0, 8)) {
    if (hit.natal !== 'asc' && hit.natal !== 'mc') {
      testimonies.push({
        clock: 'transits',
        clockName: 'Transits, Eclipses & Returns',
        targetType: 'planet',
        targetPlanet: hit.natal as PlanetId,
        summary: `Transiting ${PLANET_LORE[hit.transit].name} ${hit.type} natal ${POINT_NAMES[hit.natal]}`,
        detail: `Exact transit hit on ${hit.date.toISOString().slice(0, 10)} (orb ${hit.orb.toFixed(2)}°).`,
        weight: hit.score,
        dateWindow: hit.date.toISOString().slice(0, 10),
      });
    }
  }

  // Group testimonies by target entity
  const groups = new Map<string, ClockTestimony[]>();
  for (const t of testimonies) {
    const key = t.targetType === 'planet' ? `planet:${t.targetPlanet}` : `house:${t.targetHouse}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(t);
  }

  const items: ConvergenceItem[] = [];

  for (const [key, tList] of groups.entries()) {
    const clocksInvolved = Array.from(new Set(tList.map((t) => t.clock))) as ClockId[];
    const clockCount = clocksInvolved.length;

    // "Rule of Three": Require testimonies from at least 2 distinct clocks
    if (clockCount >= 2) {
      const isPlanet = key.startsWith('planet:');
      const targetPlanet = isPlanet ? (key.split(':')[1] as PlanetId) : undefined;
      const targetHouse = !isPlanet ? parseInt(key.split(':')[1], 10) : undefined;

      const title = isPlanet
        ? `Celestial Focus: Natal ${PLANET_LORE[targetPlanet!].name}`
        : `Domain Convergence: ${ordinal(targetHouse!)} House of ${HOUSE_LORE[targetHouse! - 1].name}`;

      const badge: ConvergenceBadge =
        clockCount >= 4
          ? '4-Clock Sovereign Convergence'
          : clockCount === 3
          ? '3-Clock Major Convergence'
          : 'Dual Testimony Alignment';

      const totalScore =
        clockCount * 25 + tList.reduce((acc, cur) => acc + cur.weight, 0);

      const synthesis = isPlanet
        ? `Natal ${PLANET_LORE[targetPlanet!].name} is simultaneously activated by ${clockCount} independent predictive clocks (${clocksInvolved.join(', ')}). This convergence signals a concentrated biographical breakthrough requiring your utmost strategic focus.`
        : `Your ${ordinal(targetHouse!)} House of ${HOUSE_LORE[targetHouse! - 1].domain} receives ${clockCount} converging predictive testimonies. Events during ${dateWindow} directly manifest through this life sector.`;

      items.push({
        id: `conv-${key}-${targetYear}-${m}`,
        targetType: isPlanet ? 'planet' : 'house',
        targetPlanet,
        targetHouse,
        title,
        clockCount,
        badge,
        clocksInvolved,
        totalScore,
        testimonies: tList,
        synthesis,
        dateWindow,
      });
    }
  }

  // Sort descending by clock count first, then total score
  items.sort((a, b) => {
    if (b.clockCount !== a.clockCount) return b.clockCount - a.clockCount;
    return b.totalScore - a.totalScore;
  });

  return {
    year: targetYear,
    month: m,
    topConvergences: items.slice(0, 5),
    allConvergences: items,
  };
}
