/**
 * ORBIS — Deep Astrological Synthesis Engine
 * ---------------------------------------------------------
 * Classical & Hellenistic Synthesis Layers:
 * 1. Chart Sect (Diurnal vs. Nocturnal), Sect Light, Benefic/Malefic of Sect.
 * 2. Ptolemaic Essential Dignities (Domicile, Exaltation, Detriment, Fall) & Mutual Reception.
 * 3. 8-fold Natal Lunar Phase Family & Psychodynamic Archetypes.
 * 4. Closed Aspect Pattern Detection (Grand Trine, T-Square, Grand Cross, Stellium, Yod).
 * 5. Hellenistic Annual Profections & Time-Lord Engine (2026 Active Chapter).
 */

import {
  type Aspect,
  type Element,
  type Modality,
  type NatalChart,
  type PlanetId,
  type PlanetPosition,
  SIGN_ELEMENTS,
  SIGN_MODALITIES,
  SIGN_NAMES,
  SIGN_RULERS,
  bodyState,
  formatLon,
  houseOf,
  jdFromDate,
  norm360,
  ordinal,
  separation,
  signOf,
} from './astroEngine';
import { HOUSE_LORE, PLANET_LORE } from './zodiacData';

// ─────────────────────────────────────────────────────────────────────────────
// 1. Chart Sect (Diurnal vs. Nocturnal)
// ─────────────────────────────────────────────────────────────────────────────

export interface SectInfo {
  isDayChart: boolean;
  sectName: 'Diurnal (Day Chart)' | 'Nocturnal (Night Chart)';
  sectLight: 'sun' | 'moon';
  beneficOfSect: 'jupiter' | 'venus';
  maleficOfSect: 'saturn' | 'mars';
  challengingMalefic: 'mars' | 'saturn';
  title: string;
  summary: string;
  sectLightExplanation: string;
  beneficExplanation: string;
  maleficExplanation: string;
}

export function calculateSect(chart: NatalChart): SectInfo {
  const sun = chart.planets.find((p) => p.id === 'sun')!;

  // In Hellenistic astrology, a chart is Diurnal if the Sun is above the horizon (Houses 7–12),
  // or within 6° below the Ascendant at dawn (Ptolemaic 5° horizon orb rule).
  // Solar charts default to diurnal (solar-anchored horizon).
  const distFromAsc = norm360(sun.lon - chart.asc);
  const isRisingDawn = !chart.solarChart && distFromAsc >= 0 && distFromAsc <= 6;
  const isDayChart = (sun.house >= 7 && sun.house <= 12) || isRisingDawn || chart.solarChart;

  if (isDayChart) {
    return {
      isDayChart: true,
      sectName: 'Diurnal (Day Chart)',
      sectLight: 'sun',
      beneficOfSect: 'jupiter',
      maleficOfSect: 'saturn',
      challengingMalefic: 'mars',
      title: 'Diurnal Chart · Solar Primary Light',
      summary:
        'Born under the Sun’s daylight. Your chart operates with solar lucidity: conscious intent, outward vitality, and purposeful action drive your growth.',
      sectLightExplanation:
        'As a Day chart native, the Sun is your primary Sect Light. You lead with conscious will, personal sovereignty, and clear purpose rather than reacting to emotional tides.',
      beneficExplanation:
        'Jupiter is your constructive Benefic of Sect. Opportunities, wisdom, and expansion compound most smoothly through philosophical vision and principled risk-taking.',
      maleficExplanation:
        'Saturn serves as your constructive malefic (cooler, measured, providing necessary architecture), while Mars is your contrary malefic — watch for impatience, rash friction, or burnout when provoked.',
    };
  }

  return {
    isDayChart: false,
    sectName: 'Nocturnal (Night Chart)',
    sectLight: 'moon',
    beneficOfSect: 'venus',
    maleficOfSect: 'mars',
    challengingMalefic: 'saturn',
    title: 'Nocturnal Chart · Lunar Primary Light',
    summary:
      'Born beneath the horizon under the stars. Your chart operates with nocturnal intelligence: intuition, emotional depth, and relational resonance steer your path.',
    sectLightExplanation:
      'As a Night chart native, the Moon is your primary Sect Light. Your emotional sanctuary, psychic rhythm, and felt instincts are your most reliable compass.',
    beneficExplanation:
      'Venus is your constructive Benefic of Sect. Harmonious alliances, aesthetic pleasure, and empathetic diplomacy are your most magnetic avenues of abundance.',
    maleficExplanation:
      'Mars operates constructively as your night malefic (providing courage, protective boundaries, and sharp drive), while Saturn is your contrary malefic — watch for self-isolation, rigid perfectionism, or unyielding doubt.',
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. Ptolemaic Essential Dignities & Mutual Reception
// ─────────────────────────────────────────────────────────────────────────────

export type DignityStatus = 'domicile' | 'exaltation' | 'detriment' | 'fall' | 'peregrine';

export interface EssentialDignity {
  planet: PlanetId;
  status: DignityStatus;
  score: number; // Domicile +5, Exaltation +4, Detriment -5, Fall -4, Peregrine 0
  label: string;
  symbol: string;
  sign: number;
  signName: string;
  description: string;
}

export interface MutualReception {
  planetA: PlanetId;
  planetB: PlanetId;
  signA: number;
  signB: number;
  type: 'domicile';
  label: string;
  description: string;
}

// Classical Domiciles (0: Aries .. 11: Pisces)
const DOMICILES: Record<PlanetId, number[]> = {
  sun: [4], // Leo
  moon: [3], // Cancer
  mercury: [2, 5], // Gemini, Virgo
  venus: [1, 6], // Taurus, Libra
  mars: [0, 7], // Aries, Scorpio
  jupiter: [8, 11], // Sagittarius, Pisces
  saturn: [9, 10], // Capricorn, Aquarius
};

// Classical Exaltations
const EXALTATIONS: Record<PlanetId, number> = {
  sun: 0, // Aries
  moon: 1, // Taurus
  mercury: 5, // Virgo
  venus: 11, // Pisces
  mars: 9, // Capricorn
  jupiter: 3, // Cancer
  saturn: 6, // Libra
};

// Classical Detriments (opposite sign of domicile)
const DETRIMENTS: Record<PlanetId, number[]> = {
  sun: [10], // Aquarius
  moon: [9], // Capricorn
  mercury: [8, 11], // Sagittarius, Pisces
  venus: [0, 7], // Aries, Scorpio
  mars: [1, 6], // Taurus, Libra
  jupiter: [2, 5], // Gemini, Virgo
  saturn: [3, 4], // Cancer, Leo
};

// Classical Falls (opposite sign of exaltation)
const FALLS: Record<PlanetId, number> = {
  sun: 6, // Libra
  moon: 7, // Scorpio
  mercury: 11, // Pisces
  venus: 5, // Virgo
  mars: 3, // Cancer
  jupiter: 9, // Capricorn
  saturn: 0, // Aries
};

export function evaluatePlanetDignity(p: PlanetPosition): EssentialDignity {
  const { id, sign } = p;
  const signName = SIGN_NAMES[sign];
  const planetName = PLANET_LORE[id].name;

  const isDom = DOMICILES[id]?.includes(sign) ?? false;
  const isExalt = EXALTATIONS[id] === sign;
  const isDet = DETRIMENTS[id]?.includes(sign) ?? false;
  const isFall = FALLS[id] === sign;

  if (isDom && isExalt) {
    // Mercury in Virgo
    return {
      planet: id,
      status: 'domicile',
      score: 9, // Domicile +5 and Exaltation +4 = +9
      label: 'Domicile & Exaltation',
      symbol: '👑🌟',
      sign,
      signName,
      description: `${planetName} is in its own home and exaltation in ${signName}. Peak sovereign strength, sovereign clarity, and unhampered efficacy.`,
    };
  }

  if (isDom) {
    return {
      planet: id,
      status: 'domicile',
      score: 5,
      label: 'Domicile',
      symbol: '👑',
      sign,
      signName,
      description: `${planetName} is at home in ${signName}. It possesses all natural resources and agency to manifest its core archetypal promise effortlessly.`,
    };
  }

  if (isExalt) {
    return {
      planet: id,
      status: 'exaltation',
      score: 4,
      label: 'Exaltation',
      symbol: '🌟',
      sign,
      signName,
      description: `${planetName} is exalted in ${signName}. Treated as an honoured guest of distinction, its highest ideals and virtue are magnified.`,
    };
  }

  if (isDet && isFall) {
    // Mercury in Pisces
    return {
      planet: id,
      status: 'detriment',
      score: -9, // Detriment -5 and Fall -4 = -9
      label: 'Detriment & Fall',
      symbol: '⚠️⚡',
      sign,
      signName,
      description: `${planetName} sits in both detriment and fall in ${signName}. Conventional expression faces friction, necessitating non-linear, intuitive mastery.`,
    };
  }

  if (isDet) {
    return {
      planet: id,
      status: 'detriment',
      score: -5,
      label: 'Detriment',
      symbol: '⚠️',
      sign,
      signName,
      description: `${planetName} is in exile in ${signName} (opposite its home). It must operate through unfamiliar customs, developing ingenious, unconventional resilience.`,
    };
  }

  if (isFall) {
    return {
      planet: id,
      status: 'fall',
      score: -4,
      label: 'Fall',
      symbol: '⚡',
      sign,
      signName,
      description: `${planetName} is in fall in ${signName}. It feels humble or unseated, requiring inner spiritual grounding rather than worldly vanity.`,
    };
  }

  return {
    planet: id,
    status: 'peregrine',
    score: 0,
    label: 'Peregrine',
    symbol: '○',
    sign,
    signName,
    description: `${planetName} is peregrine in ${signName}. It relies on house position, aspects, and its dispositor to direct its expression.`,
  };
}

export function evaluateDignities(chart: NatalChart): Record<PlanetId, EssentialDignity> {
  const result = {} as Record<PlanetId, EssentialDignity>;
  for (const p of chart.planets) {
    result[p.id] = evaluatePlanetDignity(p);
  }
  return result;
}

export function detectMutualReceptions(chart: NatalChart): MutualReception[] {
  const receptions: MutualReception[] = [];
  const planets = chart.planets;

  for (let i = 0; i < planets.length; i++) {
    for (let j = i + 1; j < planets.length; j++) {
      const pA = planets[i];
      const pB = planets[j];

      const rulerA = SIGN_RULERS[pA.sign];
      const rulerB = SIGN_RULERS[pB.sign];

      // Mutual Reception by Domicile
      if (rulerA === pB.id && rulerB === pA.id) {
        const nameA = PLANET_LORE[pA.id].name;
        const nameB = PLANET_LORE[pB.id].name;
        const signA = SIGN_NAMES[pA.sign];
        const signB = SIGN_NAMES[pB.sign];

        receptions.push({
          planetA: pA.id,
          planetB: pB.id,
          signA: pA.sign,
          signB: pB.sign,
          type: 'domicile',
          label: `${nameA} in ${signA} ⇄ ${nameB} in ${signB}`,
          description: `${nameA} sits in ${signA} (ruled by ${nameB}), while ${nameB} sits in ${signB} (ruled by ${nameA}). These two planetary rulers host each other, creating an energetic alliance that mitigates debility and unlocks reciprocal collaboration.`,
        });
      }
    }
  }

  return receptions;
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. 8-fold Natal Lunar Phase Family
// ─────────────────────────────────────────────────────────────────────────────

export type LunarPhaseKey =
  | 'new'
  | 'waxing-crescent'
  | 'first-quarter'
  | 'gibbous'
  | 'full'
  | 'disseminating'
  | 'last-quarter'
  | 'balsamic';

export interface NatalLunarPhase {
  phaseKey: LunarPhaseKey;
  name: string;
  elongation: number;
  formattedElongation: string;
  archetype: string;
  lifePulse: string;
  growthRhythm: string;
  sunLon: number;
  moonLon: number;
  sunSign: number;
  moonSign: number;
}

const LUNAR_PHASE_DEFS: Record<
  LunarPhaseKey,
  {
    name: string;
    archetype: string;
    lifePulse: string;
    growthRhythm: string;
  }
> = {
  new: {
    name: 'New Moon',
    archetype: 'The Emergent Seed',
    lifePulse: 'Instinctive, subjective, and pioneering — you initiate new cycles with raw creative courage and spontaneous enthusiasm.',
    growthRhythm: 'Initiate without hesitation; trust internal promptings and plant bold intentions before demanding external applause.',
  },
  'waxing-crescent': {
    name: 'Waxing Crescent',
    archetype: 'The Builder of Form',
    lifePulse: 'Mobilizing, persistent, and determined — you push nascent visions past inertia and resistance to establish physical foundations.',
    growthRhythm: 'Gather resources, protect developing projects from early doubt, and turn fleeting inspiration into disciplined daily rhythm.',
  },
  'first-quarter': {
    name: 'First Quarter',
    archetype: 'The Action Hero',
    lifePulse: 'Crisis in action, decisive, and structural — you thrive under constructive tension, converting inner will into tangible worldly reality.',
    growthRhythm: 'Break decisively with outdated legacy models; step forward as a builder and establish original frameworks under pressure.',
  },
  gibbous: {
    name: 'Gibbous Moon',
    archetype: 'The Master Craftsman',
    lifePulse: 'Refining, analytical, and devotion-driven — you question "why" and rigorously polish raw instinct into high-order mastery.',
    growthRhythm: 'Devote yourself to iterative refinement and mentorship; your breakthrough emerges through dedication to technical craftsmanship.',
  },
  full: {
    name: 'Full Moon',
    archetype: 'The Illuminated Seer',
    lifePulse: 'Objective, relational, and clear-sighted — you operate at peak illumination, bridging complementary polarities with profound awareness.',
    growthRhythm: 'Seek synthesis across human relationships; translate your heightened perspective into works that harmonize mind and feeling.',
  },
  disseminating: {
    name: 'Disseminating Moon',
    archetype: 'The Philosopher-Teacher',
    lifePulse: 'Communicative, demonstrative, and socially purposeful — you harvest the fruits of wisdom to share, teach, and uplift others.',
    growthRhythm: 'Distribute your hard-won insights freely; mentor your community and translate deep personal understanding into collective progress.',
  },
  'last-quarter': {
    name: 'Last Quarter',
    archetype: 'The Revolutionary Reformer',
    lifePulse: 'Crisis in consciousness, philosophical, and uncompromising — you dismantle hollow dogmas to clear clean space for future generations.',
    growthRhythm: 'Re-evaluate inherited orthodoxies; follow your internal moral compass and fearlessly restructure systems that have lost their soul.',
  },
  balsamic: {
    name: 'Balsamic Moon',
    archetype: 'The Mystic Wayfinder',
    lifePulse: 'Visionary, prophetic, and karmic — you distill the essence of entire cycles, releasing attachments to prepare fertile soil for tomorrow.',
    growthRhythm: 'Honour intentional retreat and closure; trust that endings are sacred seedbeds and that your quiet intuition anticipates the future.',
  },
};

export function calculateLunarPhase(chart: NatalChart): NatalLunarPhase {
  const sun = chart.planets.find((p) => p.id === 'sun')!;
  const moon = chart.planets.find((p) => p.id === 'moon')!;

  const elongation = norm360(moon.lon - sun.lon);

  let phaseKey: LunarPhaseKey;
  if (elongation < 45) phaseKey = 'new';
  else if (elongation < 90) phaseKey = 'waxing-crescent';
  else if (elongation < 135) phaseKey = 'first-quarter';
  else if (elongation < 180) phaseKey = 'gibbous';
  else if (elongation < 225) phaseKey = 'full';
  else if (elongation < 270) phaseKey = 'disseminating';
  else if (elongation < 315) phaseKey = 'last-quarter';
  else phaseKey = 'balsamic';

  const def = LUNAR_PHASE_DEFS[phaseKey];

  return {
    phaseKey,
    name: def.name,
    elongation,
    formattedElongation: `${elongation.toFixed(1)}°`,
    archetype: def.archetype,
    lifePulse: def.lifePulse,
    growthRhythm: def.growthRhythm,
    sunLon: sun.lon,
    moonLon: moon.lon,
    sunSign: sun.sign,
    moonSign: moon.sign,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. Aspect Pattern Detection Engine
// ─────────────────────────────────────────────────────────────────────────────

export type AspectPatternType = 'grand-trine' | 't-square' | 'grand-cross' | 'stellium' | 'yod';

export interface AspectPattern {
  id: string;
  type: AspectPatternType;
  name: string;
  planets: PlanetId[];
  apexPlanet?: PlanetId;
  element?: Element;
  modality?: Modality;
  releasePoint?: {
    lon: number;
    sign: number;
    house: number;
    formattedLon: string;
    description: string;
  };
  headline: string;
  description: string;
}

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export function detectAspectPatterns(chart: NatalChart): AspectPattern[] {
  const patterns: AspectPattern[] = [];
  const planets = chart.planets;

  // Helper to find aspect pair in chart
  const findPairAspect = (id1: PlanetId, id2: PlanetId): Aspect | undefined => {
    return chart.aspects.find(
      (a) => (a.a === id1 && a.b === id2) || (a.a === id2 && a.b === id1),
    );
  };

  // 4.1 Grand Trine Detection (3 planets mutually trine ~120° ± 8.5°)
  for (let i = 0; i < planets.length; i++) {
    for (let j = i + 1; j < planets.length; j++) {
      for (let k = j + 1; k < planets.length; k++) {
        const pA = planets[i];
        const pB = planets[j];
        const pC = planets[k];

        const ab = findPairAspect(pA.id, pB.id);
        const bc = findPairAspect(pB.id, pC.id);
        const ca = findPairAspect(pC.id, pA.id);

        if (ab?.type === 'trine' && bc?.type === 'trine' && ca?.type === 'trine') {
          const elA = SIGN_ELEMENTS[pA.sign];
          const elB = SIGN_ELEMENTS[pB.sign];
          const elC = SIGN_ELEMENTS[pC.sign];
          const isPureElement = elA === elB && elB === elC;
          const element = isPureElement ? elA : undefined;

          const elName = element ? `${cap(element)} ` : '';
          const pNames = [PLANET_LORE[pA.id].name, PLANET_LORE[pB.id].name, PLANET_LORE[pC.id].name].join(', ');

          patterns.push({
            id: `grand-trine-${pA.id}-${pB.id}-${pC.id}`,
            type: 'grand-trine',
            name: `${elName}Grand Trine`,
            planets: [pA.id, pB.id, pC.id],
            element,
            headline: `Closed Circuit of Fluid Harmony: ${pNames}`,
            description: `A rare equilateral triangle linking ${pNames}. This creates an effortless, self-sustaining circuit of natural gifts, deep talent, and psychic ease in ${element ? `${element} signs` : 'the chart'}. Deliberate effort is required to channel this flow outward so it does not settle into passive complacency.`,
          });
        }
      }
    }
  }

  // 4.2 T-Square Detection (Opposition A-B, both square Apex C)
  for (let i = 0; i < planets.length; i++) {
    for (let j = i + 1; j < planets.length; j++) {
      const pA = planets[i];
      const pB = planets[j];
      const opp = findPairAspect(pA.id, pB.id);

      if (opp?.type === 'opposition') {
        // Look for 3rd planet squaring both
        for (const pC of planets) {
          if (pC.id === pA.id || pC.id === pB.id) continue;
          const sqA = findPairAspect(pC.id, pA.id);
          const sqB = findPairAspect(pC.id, pB.id);

          if (sqA?.type === 'square' && sqB?.type === 'square') {
            // Apex is pC
            const releaseLon = norm360(pC.lon + 180);
            const releaseSign = signOf(releaseLon);
            const releaseHouse = houseOf(releaseLon, chart.cusps);
            const apexName = PLANET_LORE[pC.id].name;
            const baseNames = `${PLANET_LORE[pA.id].name} and ${PLANET_LORE[pB.id].name}`;

            const modA = SIGN_MODALITIES[pA.sign];
            const modB = SIGN_MODALITIES[pB.sign];
            const modC = SIGN_MODALITIES[pC.sign];
            const modality = modA === modB && modB === modC ? modA : undefined;

            patterns.push({
              id: `t-square-${pC.id}-${pA.id}-${pB.id}`,
              type: 't-square',
              name: `${modality ? `${cap(modality)} ` : ''}T-Square (Apex: ${apexName})`,
              planets: [pC.id, pA.id, pB.id],
              apexPlanet: pC.id,
              modality,
              releasePoint: {
                lon: releaseLon,
                sign: releaseSign,
                house: releaseHouse,
                formattedLon: formatLon(releaseLon),
                description: `Release point in ${SIGN_NAMES[releaseSign]} (${ordinal(releaseHouse)} House).`,
              },
              headline: `Dynamic Engine of Achievement: ${apexName} at the Apex`,
              description: `High-voltage structural tension between ${baseNames} is concentrated directly into ${apexName}. This is one of the most powerful engines of ambition in astrology — the relentless drive to resolve friction forges monumental accomplishments. Release and master this pressure by consciously investing in the empty leg: ${SIGN_NAMES[releaseSign]} in your ${ordinal(releaseHouse)} house.`,
            });
          }
        }
      }
    }
  }

  // 4.3 Grand Cross Detection (2 oppositions, 4 squares across 4 distinct planets)
  const oppositions = chart.aspects.filter((a) => a.type === 'opposition');
  for (let i = 0; i < oppositions.length; i++) {
    for (let j = i + 1; j < oppositions.length; j++) {
      const opp1 = oppositions[i];
      const opp2 = oppositions[j];

      // All 4 planets must be distinct
      const pIdSet = new Set([opp1.a, opp1.b, opp2.a, opp2.b]);
      if (pIdSet.size !== 4) continue;

      const p1 = planets.find((p) => p.id === opp1.a)!;
      const p2 = planets.find((p) => p.id === opp1.b)!;
      const p3 = planets.find((p) => p.id === opp2.a)!;
      const p4 = planets.find((p) => p.id === opp2.b)!;

      const s13 = findPairAspect(p1.id, p3.id)?.type === 'square';
      const s14 = findPairAspect(p1.id, p4.id)?.type === 'square';
      const s23 = findPairAspect(p2.id, p3.id)?.type === 'square';
      const s24 = findPairAspect(p2.id, p4.id)?.type === 'square';

      if (s13 && s14 && s23 && s24) {
        const pGroup = [p1, p2, p3, p4];
        const sortedIds = [p1.id, p2.id, p3.id, p4.id].sort();
        const mod = SIGN_MODALITIES[p1.sign];
        const allMod = pGroup.every((p) => SIGN_MODALITIES[p.sign] === mod);
        const modality = allMod ? mod : undefined;
        const names = pGroup.map((p) => PLANET_LORE[p.id].name).join(', ');

        patterns.push({
          id: `grand-cross-${sortedIds.join('-')}`,
          type: 'grand-cross',
          name: `${modality ? `${cap(modality)} ` : ''}Grand Cross`,
          planets: [p1.id, p2.id, p3.id, p4.id],
          modality,
          headline: `Monumental Crucible of Endurance: ${names}`,
          description: `Four planets locked in a total geometric cross. This rare formation creates unrelenting internal pressure and tests of character, producing immense stamina and an unshakeable capacity to manifest enduring changes in the world.`,
        });
      }
    }
  }

  // 4.4 Stellium Detection (3+ planets in the same sign or house)
  // 4.4.1 Sign Stelliums
  const signBuckets = new Map<number, PlanetPosition[]>();
  for (const p of planets) {
    const list = signBuckets.get(p.sign) || [];
    list.push(p);
    signBuckets.set(p.sign, list);
  }

  for (const [sign, members] of signBuckets.entries()) {
    if (members.length >= 3) {
      const pIds = members.map((m) => m.id);
      const names = members.map((m) => PLANET_LORE[m.id].name).join(', ');
      const signName = SIGN_NAMES[sign];
      const houses = Array.from(new Set(members.map((m) => m.house)));
      const houseStr = houses.map((h) => `${ordinal(h)} House`).join(' & ');

      patterns.push({
        id: `stellium-sign-${sign}`,
        type: 'stellium',
        name: `${signName} Stellium`,
        planets: pIds,
        element: SIGN_ELEMENTS[sign],
        modality: SIGN_MODALITIES[sign],
        headline: `Intense Planetary Concentration in ${signName}: ${names}`,
        description: `A profound nexus of ${members.length} celestial bodies converging in ${signName} (${houseStr}). This sign acts as your personal gravitational super-center — a focal area where your psychological energy, lessons, and life drama repeatedly crystallize.`,
      });
    }
  }

  // 4.4.2 House Stelliums (3+ planets in the same house spanning multiple signs)
  const houseBuckets = new Map<number, PlanetPosition[]>();
  for (const p of planets) {
    const list = houseBuckets.get(p.house) || [];
    list.push(p);
    houseBuckets.set(p.house, list);
  }

  for (const [house, members] of houseBuckets.entries()) {
    if (members.length >= 3) {
      const distinctSigns = new Set(members.map((m) => m.sign));
      // Only emit separate house stellium if it spans across signs (otherwise sign stellium covers it)
      if (distinctSigns.size > 1) {
        const pIds = members.map((m) => m.id);
        const names = members.map((m) => PLANET_LORE[m.id].name).join(', ');
        const houseName = `${ordinal(house)} House`;
        const signNames = Array.from(distinctSigns).map((s) => SIGN_NAMES[s]).join(' & ');

        patterns.push({
          id: `stellium-house-${house}`,
          type: 'stellium',
          name: `${houseName} Stellium`,
          planets: pIds,
          headline: `Intense Planetary Concentration in your ${houseName}: ${names}`,
          description: `A concentrated gathering of ${members.length} celestial bodies spanning ${signNames} within your ${houseName} of ${HOUSE_LORE[house - 1].domain}. This house acts as a major focal arena where your vocational and psychological life energy continually concentrates.`,
        });
      }
    }
  }

  // 4.5 Yod ("Finger of God") Detection: Base sextile (60° ± 6°), two quincunxes (150° ± 3.5°) to Apex
  for (let i = 0; i < planets.length; i++) {
    for (let j = i + 1; j < planets.length; j++) {
      const pA = planets[i];
      const pB = planets[j];
      const sext = findPairAspect(pA.id, pB.id);

      if (sext?.type === 'sextile') {
        for (const pC of planets) {
          if (pC.id === pA.id || pC.id === pB.id) continue;
          const sepA = separation(pC.lon, pA.lon);
          const sepB = separation(pC.lon, pB.lon);

          // Quincunx is 150° with orb <= 3.5°
          const isQuinA = Math.abs(sepA - 150) <= 3.5;
          const isQuinB = Math.abs(sepB - 150) <= 3.5;

          if (isQuinA && isQuinB) {
            const apexName = PLANET_LORE[pC.id].name;
            const baseNames = `${PLANET_LORE[pA.id].name} and ${PLANET_LORE[pB.id].name}`;
            const triggerLon = norm360(pC.lon + 180);
            const triggerSign = signOf(triggerLon);
            const triggerHouse = houseOf(triggerLon, chart.cusps);

            patterns.push({
              id: `yod-${pC.id}-${pA.id}-${pB.id}`,
              type: 'yod',
              name: `Yod "Finger of God" (Apex: ${apexName})`,
              planets: [pC.id, pA.id, pB.id],
              apexPlanet: pC.id,
              releasePoint: {
                lon: triggerLon,
                sign: triggerSign,
                house: triggerHouse,
                formattedLon: formatLon(triggerLon),
                description: `Activation trigger in ${SIGN_NAMES[triggerSign]} (${ordinal(triggerHouse)} House).`,
              },
              headline: `Fated Evolutionary Catalyst: ${apexName} as Divine Apex`,
              description: `A profound Yod pointing with laser precision at ${apexName}, anchored by a sextile between ${baseNames}. Known as the "Finger of God", this configuration signals an inescapable sense of vocational destiny that demands continuous internal adjustments until you master its unique calling.`,
            });
          }
        }
      }
    }
  }

  // Deduplicate patterns with identical id
  const seen = new Set<string>();
  return patterns.filter((p) => {
    if (seen.has(p.id)) return false;
    seen.add(p.id);
    return true;
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. Hellenistic Annual Profections & Time-Lord Engine (2026 Chapter)
// ─────────────────────────────────────────────────────────────────────────────

export interface AnnualProfection {
  year: number;
  age: number;
  profectedHouse: number;
  profectedSign: number;
  profectedSignName: string;
  timeLord: PlanetId;
  timeLordName: string;
  timeLordDignity: EssentialDignity;
  inSect: boolean;
  houseDomain: string;
  theme: string;
  guidance: string;
  transitContext?: string;
}

const SECT_PLANETS: Record<'day' | 'night', PlanetId[]> = {
  day: ['sun', 'jupiter', 'saturn'],
  night: ['moon', 'venus', 'mars'],
};

export function calculateAnnualProfection(
  chart: NatalChart,
  sect: SectInfo,
  dignities: Record<PlanetId, EssentialDignity>,
  targetYear = 2026,
): AnnualProfection {
  const birthYear = parseInt(chart.input.date.split('-')[0], 10);
  const age = targetYear - birthYear;

  // Hellenistic formula: Age mod 12 determines the house (0-indexed offset from 1st house)
  const houseOffset = ((age % 12) + 12) % 12;
  const profectedHouse = houseOffset + 1;

  // Whole Sign profection from Ascendant sign
  const ascSign = signOf(chart.asc);
  const profectedSign = (ascSign + houseOffset) % 12;
  const profectedSignName = SIGN_NAMES[profectedSign];

  const timeLord = SIGN_RULERS[profectedSign];
  const timeLordName = PLANET_LORE[timeLord].name;
  const timeLordDignity = dignities[timeLord];

  // In-sect evaluation (Hellenistic sect: Sun/Jupiter/Saturn by day, Moon/Venus/Mars by night;
  // Mercury is common: joins day sect if oriental/morning star, joins night sect if occidental/evening star)
  let inSect: boolean;
  if (timeLord === 'mercury') {
    const sunPos = chart.planets.find((p) => p.id === 'sun')!;
    const mercPos = chart.planets.find((p) => p.id === 'mercury')!;
    const isMercuryOriental = norm360(sunPos.lon - mercPos.lon) > 0 && norm360(sunPos.lon - mercPos.lon) <= 180;
    inSect = isMercuryOriental ? sect.isDayChart : !sect.isDayChart;
  } else {
    inSect = sect.isDayChart
      ? SECT_PLANETS.day.includes(timeLord)
      : SECT_PLANETS.night.includes(timeLord);
  }

  const houseLore = HOUSE_LORE[profectedHouse - 1];
  const domain = houseLore.domain;

  // 2026 Transit overlay for the Time-Lord
  const mid2026Jd = jdFromDate(new Date(Date.UTC(targetYear, 9, 15)));
  const tlTransit = bodyState(timeLord, mid2026Jd);
  const tlTransitSign = signOf(tlTransit.lon);
  const tlTransitHouse = houseOf(tlTransit.lon, chart.cusps);

  const transitContext = `During ${targetYear}, your active Time-Lord ${timeLordName} transits through ${SIGN_NAMES[tlTransitSign]} in your ${ordinal(tlTransitHouse)} house${tlTransit.retrograde ? ' (retrograde)' : ''}, directly connecting your ${ordinal(profectedHouse)} house chapter with ${HOUSE_LORE[tlTransitHouse - 1].domain}.`;

  const theme = `In ${targetYear} at age ${age}, your life story activates the ${ordinal(profectedHouse)} House of ${domain}. ${timeLordName} ascends as your governing Time-Lord.`;

  const guidance = inSect
    ? `${timeLordName} is in sect for your ${sect.sectName.toLowerCase()}, giving this year's developmental themes constructive momentum. Operating from ${timeLordDignity.label} in your natal chart (${timeLordDignity.signName}), focus your highest strategic agency on ${domain}.`
    : `${timeLordName} operates contrary to sect, presenting rigorous, character-building growth tests around ${domain}. Ground yourself through patience and deliberate discipline.`;

  return {
    year: targetYear,
    age,
    profectedHouse,
    profectedSign,
    profectedSignName,
    timeLord,
    timeLordName,
    timeLordDignity,
    inSect,
    houseDomain: domain,
    theme,
    guidance,
    transitContext,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// 6. Complete Master Synthesis
// ─────────────────────────────────────────────────────────────────────────────

export interface AstroSynthesis {
  sect: SectInfo;
  dignities: Record<PlanetId, EssentialDignity>;
  dignityList: EssentialDignity[];
  mutualReceptions: MutualReception[];
  lunarPhase: NatalLunarPhase;
  patterns: AspectPattern[];
  profection2026: AnnualProfection;
}

export function synthesizeChart(chart: NatalChart, targetYear = 2026): AstroSynthesis {
  const sect = calculateSect(chart);
  const dignities = evaluateDignities(chart);
  const dignityList = Object.values(dignities);
  const mutualReceptions = detectMutualReceptions(chart);
  const lunarPhase = calculateLunarPhase(chart);
  const patterns = detectAspectPatterns(chart);
  const profection2026 = calculateAnnualProfection(chart, sect, dignities, targetYear);

  return {
    sect,
    dignities,
    dignityList,
    mutualReceptions,
    lunarPhase,
    patterns,
    profection2026,
  };
}
