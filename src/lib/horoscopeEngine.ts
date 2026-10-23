/**
 * ORBIS — Graph-driven Horoscope & Orbis Alignment engine.
 * Every sentence is selected from computed placements: signs, houses,
 * rulers, aspect orbs, element/modality balance and live transits.
 */
import {
  ASPECT_BY_TYPE, SIGN_ELEMENTS, SIGN_MODALITIES, SIGN_NAMES, SIGN_RULERS,
  computeMonthTransits, formatLon, formatOrb, ordinal, signOf,
  type Aspect, type Element, type Modality, type MonthTransits, type NatalChart, type PlanetId, type PlanetPosition, type PointId, type TransitHit,
} from './astroEngine';
import {
  ASPECT_LORE, ELEMENT_LORE, HOUSE_LORE, MODALITY_LORE, PLANET_LORE, POINT_NAMES, SHADOW_PROMPTS, SIGN_LORE, TRANSIT_THEMES,
} from './zodiacData';
import {
  type AstroSynthesis,
  synthesizeChart,
} from './astroSynthesis';

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

export const planetOf = (chart: NatalChart, id: PlanetId) => chart.planets.find((p) => p.id === id)!;
export const houseLabel = (h: number) => `${ordinal(h)} House`;
export const housePhrase = (h: number) => `${ordinal(h)} house of ${HOUSE_LORE[h - 1].domain}`;
export const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

const POINT_PRINCIPLE: Record<PointId, string> = {
  ...Object.fromEntries(Object.entries(PLANET_LORE).map(([k, v]) => [k, v.principle])),
  asc: 'your self-image and personal direction',
  mc: 'your career path and public reputation',
} as Record<PointId, string>;

export function aspectLabel(a: Aspect) {
  return `${PLANET_LORE[a.a].name} ${ASPECT_BY_TYPE[a.type].label} ${PLANET_LORE[a.b].name}`;
}

export function aspectExplanation(a: Aspect) {
  const lore = ASPECT_LORE[a.type];
  const body = lore.template.replace('{A}', cap(PLANET_LORE[a.a].principle)).replace('{B}', PLANET_LORE[a.b].principle).replace('{A}', PLANET_LORE[a.a].principle);
  const strength =
    a.strength === 'Exact Resonance'
      ? 'At this near-exact orb, the influence is a defining signature of your chart.'
      : a.strength === 'Strong Influence'
        ? 'At this orb the influence is strong and regularly felt.'
        : 'At this wider orb the influence is ambient — present in the background, surfacing under transits.';
  return `${body} ${strength} ${a.applying ? 'Applying: the energy is building and future-oriented.' : 'Separating: the energy is integrated and instinctive.'}`;
}

export function planetExplanation(chart: NatalChart, p: PlanetPosition) {
  const lore = SIGN_LORE[p.sign];
  const key: Record<PlanetId, keyof typeof lore> = { sun: 'sun', moon: 'moon', mercury: 'mercury', venus: 'venus', mars: 'mars', jupiter: 'gift', saturn: 'saturn' };
  let text = String(lore[key[p.id]]);
  if (p.id === 'jupiter') text = `Jupiter amplifies your ${lore.gift}; growth and luck arrive through ${lore.keywords.join(', ').toLowerCase()}.`;
  const house = chart.solarChart ? `solar ${housePhrase(p.house)}` : housePhrase(p.house);
  return `${text} Placed in your ${house}.${p.retrograde ? ' Retrograde: this energy turns inward, maturing through reflection and revision.' : ''}`;
}

const WEEKDAY_RULER: Record<PlanetId, number> = { sun: 0, moon: 1, mars: 2, mercury: 3, jupiter: 4, venus: 5, saturn: 6 };
const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function nextWeekday(day: number, from = new Date()) {
  const d = new Date(from);
  d.setHours(12, 0, 0, 0);
  const delta = (day - d.getDay() + 7) % 7 || 7;
  d.setDate(d.getDate() + delta);
  return d;
}

export const fmtDate = (d: Date, opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' }) =>
  d.toLocaleDateString('en-US', { ...opts, timeZone: 'UTC' });

const ELEMENT_PAIR: Record<string, string> = {
  'fire-fire': 'reinforce each other into a blazing, unmistakable signature',
  'earth-earth': 'reinforce each other into a deeply grounded, enduring signature',
  'air-air': 'reinforce each other into a brilliant, idea-driven signature',
  'water-water': 'reinforce each other into a profoundly intuitive, feeling signature',
  'air-fire': 'fan each other — ideas feed passion and passion animates ideas',
  'earth-water': 'nourish each other — feeling gives your ambitions meaning, structure gives your feelings a home',
  'fire-water': 'create steam — passion and sensitivity alternate, giving you rare emotional courage',
  'earth-fire': 'meet as vision and pragmatism — you dream big and know how to build it',
  'air-water': 'balance head and heart — you can feel deeply and still see clearly',
  'air-earth': 'pair ideas with form — you turn concepts into practical, workable systems',
};
const pairKey = (a: Element, b: Element) => [a, b].sort().join('-');

// ─────────────────────────────────────────────────────────────────────────────
// Core Triad
// ─────────────────────────────────────────────────────────────────────────────

export interface TriadCard {
  key: 'sun' | 'moon' | 'rising';
  title: string;
  label: string;
  sign: number;
  degree: string;
  house?: number;
  body: string;
  gift: string;
  shadow: string;
  keywords: string[];
  element: Element;
  modality: Modality;
  note?: string;
}

export function buildTriad(chart: NatalChart, synInput?: AstroSynthesis) {
  const syn = synInput ?? synthesizeChart(chart);
  const sun = planetOf(chart, 'sun');
  const moon = planetOf(chart, 'moon');
  const ascSign = signOf(chart.asc);

  const card = (key: TriadCard['key'], title: string, label: string, sign: number, lon: number, body: string, house?: number, note?: string): TriadCard => ({
    key, title, label, sign, degree: formatLon(lon), house, body,
    gift: SIGN_LORE[sign].gift, shadow: SIGN_LORE[sign].shadow, keywords: SIGN_LORE[sign].keywords,
    element: SIGN_ELEMENTS[sign], modality: SIGN_MODALITIES[sign], note,
  });

  const ascRuler = SIGN_RULERS[ascSign];
  const ascRulerPos = planetOf(chart, ascRuler);
  const sunDignity = syn.dignities.sun;
  const moonDignity = syn.dignities.moon;
  const ascRulerDignity = syn.dignities[ascRuler];

  const sunSectNote = syn.sect.sectLight === 'sun' ? 'Primary Sect Light (Day Chart)' : 'Secondary Light (Night Chart)';
  const moonSectNote = syn.sect.sectLight === 'moon' ? 'Primary Sect Light (Night Chart)' : 'Secondary Light (Day Chart)';

  const cards: TriadCard[] = [
    card(
      'sun',
      'Core Gravity',
      `Sun · ${sunDignity.label} ${sunDignity.symbol}`,
      sun.sign,
      sun.lon,
      `${SIGN_LORE[sun.sign].sun} In your ${housePhrase(sun.house)}, this is where you shine brightest. ${sunDignity.description}`,
      sun.house,
      sunSectNote,
    ),
    card(
      'moon',
      'Emotional Tide',
      `Moon · ${moonDignity.label} ${moonDignity.symbol}`,
      moon.sign,
      moon.lon,
      `${SIGN_LORE[moon.sign].moon} Anchored in your ${housePhrase(moon.house)}. ${moonDignity.description}`,
      moon.house,
      moonSectNote,
    ),
    chart.solarChart
      ? card('rising', 'Outer Orbit', 'Solar Ascendant', ascSign, chart.asc, `Birth time unknown — ORBIS anchors your 1st house to the Sun's exact degree (Solar Chart). ${SIGN_LORE[ascSign].rising}`, 1, 'Solar Chart approximation')
      : card('rising', 'Outer Orbit', 'Ascendant', ascSign, chart.asc, `${SIGN_LORE[ascSign].rising} Your chart ruler, ${PLANET_LORE[ascRuler].name} (${ascRulerDignity.label}), sits in ${SIGN_NAMES[ascRulerPos.sign]} in your ${housePhrase(ascRulerPos.house)} — the life arena that steers your whole path.`, 1, `${PLANET_LORE[ascRuler].name} Chart Ruler`),
  ];

  const eS = SIGN_ELEMENTS[sun.sign];
  const eM = SIGN_ELEMENTS[moon.sign];
  const eA = SIGN_ELEMENTS[ascSign];
  const sunMoon = chart.aspects.find((a) => (a.a === 'sun' && a.b === 'moon') || (a.a === 'moon' && a.b === 'sun'));

  const parts: string[] = [];
  parts.push(
    `With your Sun in ${SIGN_NAMES[sun.sign]}, Moon in ${SIGN_NAMES[moon.sign]} and ${SIGN_NAMES[ascSign]} ${chart.solarChart ? 'on the solar Ascendant' : 'rising'}, your ${ELEMENT_LORE[eS].label.toLowerCase()} core and ${ELEMENT_LORE[eM].label.toLowerCase()} emotional tide ${ELEMENT_PAIR[pairKey(eS, eM)]}.`,
  );
  parts.push(
    syn.sect.isDayChart
      ? `As a Diurnal native (Day Chart), your solar core leads: conscious intention, outward vitality, and purposeful sovereign will guide your path, while your ${SIGN_NAMES[moon.sign]} Moon provides internal emotional grounding.`
      : `As a Nocturnal native (Night Chart), your lunar light leads: intuitive resonance, emotional sanctuary, and relational wisdom guide your choices, while your ${SIGN_NAMES[sun.sign]} Sun supplies enduring vital fuel.`
  );
  parts.push(
    `Born under the ${syn.lunarPhase.name} phase (${syn.lunarPhase.archetype}, Sun–Moon elongation ${syn.lunarPhase.formattedElongation}), your psychological pulse is ${syn.lunarPhase.lifePulse.toLowerCase()}`
  );
  if (syn.mutualReceptions.length > 0) {
    parts.push(
      `Special Astrological Reception: ${syn.mutualReceptions.map((r) => r.label).join(' and ')} creates a bridge of reciprocal hospitality, allowing these energies to cooperate smoothly.`
    );
  }
  if (syn.patterns.length > 0) {
    parts.push(
      `Geometric Aspect Pattern: Your chart forms a ${syn.patterns.map((p) => p.name).join(', ')}, creating a powerful focal architecture in your life path.`
    );
  }
  if (eS === eM && eM === eA) {
    parts.push(`A rare triple-${ELEMENT_LORE[eS].label.toLowerCase()} triad makes your ${ELEMENT_LORE[eS].quality} concentrated and unmistakable — what you see is exactly what you are.`);
  } else {
    parts.push(`Your ${SIGN_NAMES[ascSign]} outer orbit is the interface: people first meet your ${SIGN_LORE[ascSign].gift}, and only later discover your ${SIGN_LORE[sun.sign].gift} and the ${SIGN_LORE[moon.sign].gift} beneath it.`);
  }
  if (sunMoon) {
    const def = ASPECT_BY_TYPE[sunMoon.type];
    parts.push(
      def.nature === 'dynamic'
        ? `Your Sun and Moon form a ${def.label.toLowerCase()} (orb ${formatOrb(sunMoon.orb)}), so what you want and what you need sometimes compete — the creative tension that drives your ambition.`
        : `Your Sun and Moon form a ${def.label.toLowerCase()} (orb ${formatOrb(sunMoon.orb)}), aligning will and feeling — you tend to want what you genuinely need.`,
    );
  } else if (SIGN_MODALITIES[sun.sign] === SIGN_MODALITIES[moon.sign]) {
    parts.push(`Sharing a ${SIGN_MODALITIES[sun.sign]} modality, your Sun and Moon move at the same tempo — when you commit, your whole being commits.`);
  } else {
    parts.push(`Your ${SIGN_MODALITIES[sun.sign]} Sun and ${SIGN_MODALITIES[moon.sign]} Moon move at different tempos — honour both your drive to ${SIGN_MODALITIES[sun.sign] === 'cardinal' ? 'start' : SIGN_MODALITIES[sun.sign] === 'fixed' ? 'sustain' : 'adapt'} and your need to ${SIGN_MODALITIES[moon.sign] === 'cardinal' ? 'initiate' : SIGN_MODALITIES[moon.sign] === 'fixed' ? 'stabilise' : 'flow'}.`);
  }

  return { cards, synthesis: parts.join(' ') };
}

// ─────────────────────────────────────────────────────────────────────────────
// Forecast (transit overlay)
// ─────────────────────────────────────────────────────────────────────────────

export type ForecastKind = 'opportunity' | 'reflection' | 'activation' | 'lunation' | 'station';

export interface ForecastEvent {
  date: Date;
  kind: ForecastKind;
  title: string;
  meta: string;
  body: string;
  hit?: TransitHit;
}

function classifyHit(h: TransitHit): ForecastKind {
  const nature = ASPECT_BY_TYPE[h.type].nature;
  if (nature === 'harmonious') return 'opportunity';
  if (nature === 'dynamic') return 'reflection';
  if (h.transit === 'saturn') return 'reflection';
  if (h.transit === 'venus' || h.transit === 'jupiter' || h.transit === 'sun') return 'opportunity';
  return 'activation';
}

const KIND_ADVICE: Record<'opportunity' | 'reflection' | 'activation', string> = {
  opportunity: 'Act on it: initiate, ask, apply and say yes.',
  reflection: 'Slow down, review and restructure before committing.',
  activation: 'Expect momentum — channel it into one focused priority.',
};

export function hitText(h: TransitHit) {
  return `Transiting ${POINT_NAMES[h.transit]} ${ASPECT_LORE[h.type].transitTone} your natal ${POINT_NAMES[h.natal]} (${formatLon(h.natalLon)}). This ${TRANSIT_THEMES[h.transit]} ${POINT_PRINCIPLE[h.natal]}.`;
}

export interface Forecast {
  monthLabel: string;
  intro: string;
  events: ForecastEvent[];
  data: MonthTransits;
}

export function buildForecast(chart: NatalChart, year: number, month: number): Forecast {
  const data = computeMonthTransits(chart, year, month);
  const monthLabel = new Date(Date.UTC(year, month, 15)).toLocaleDateString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' });
  const s1 = signOf(data.sunStart);
  const s2 = signOf(data.sunEnd);
  const sunPos = data.positions.find((p) => p.id === 'sun')!;
  const jup = data.positions.find((p) => p.id === 'jupiter')!;
  const sat = data.positions.find((p) => p.id === 'saturn')!;

  const intro =
    `This month the Sun travels from ${SIGN_NAMES[s1]}${s1 !== s2 ? ` into ${SIGN_NAMES[s2]}` : ''}, illuminating your ${housePhrase(sunPos.house)}. ` +
    `Jupiter in ${SIGN_NAMES[signOf(jup.lon)]}${jup.retrograde ? ' (retrograde)' : ''} is expanding your ${housePhrase(jup.house)}, while Saturn in ${SIGN_NAMES[signOf(sat.lon)]}${sat.retrograde ? ' (retrograde)' : ''} asks for maturity in your ${housePhrase(sat.house)}.`;

  // De-duplicate repeating transit/natal pairs, keep strongest.
  const seen = new Set<string>();
  const top: TransitHit[] = [];
  for (const h of data.hits) {
    const k = `${h.transit}-${h.natal}`;
    if (seen.has(k)) continue;
    seen.add(k);
    top.push(h);
    if (top.length >= 7) break;
  }

  const events: ForecastEvent[] = top.map((h) => {
    const kind = classifyHit(h) as 'opportunity' | 'reflection' | 'activation';
    return {
      date: h.date, kind, hit: h,
      title: `${POINT_NAMES[h.transit]} ${ASPECT_BY_TYPE[h.type].label} natal ${POINT_NAMES[h.natal]}`,
      meta: `Orb ${formatOrb(h.orb)}`,
      body: `${hitText(h)} ${KIND_ADVICE[kind]}`,
    };
  });

  for (const l of data.lunations) {
    const sign = signOf(l.lon);
    events.push({
      date: l.date, kind: 'lunation',
      title: `${l.kind === 'new' ? 'New Moon' : 'Full Moon'} in ${SIGN_NAMES[sign]}`,
      meta: formatLon(l.lon),
      body: l.kind === 'new'
        ? `A seed point in your ${housePhrase(l.house)}. Set one clear intention here — ${SIGN_LORE[sign].keywords[0].toLowerCase()} is the energy to plant.`
        : `A culmination in your ${housePhrase(l.house)}. Celebrate what has ripened and release what no longer fits — illumination favours ${SIGN_LORE[sign].keywords[1].toLowerCase()}.`,
    });
  }

  for (const s of data.stations) {
    events.push({
      date: s.date, kind: 'station',
      title: `${POINT_NAMES[s.body]} stations ${s.direction}`,
      meta: formatLon(s.lon),
      body: s.direction === 'retrograde'
        ? `${POINT_NAMES[s.body]} turns retrograde in your ${housePhrase(s.house)}. Review, revise and reconnect here rather than launching brand-new initiatives.`
        : `${POINT_NAMES[s.body]} turns direct in your ${housePhrase(s.house)}. Delayed matters begin moving again — implement what you revised.`,
    });
  }

  events.sort((a, b) => a.date.getTime() - b.date.getTime());
  return { monthLabel, intro, events, data };
}

// ─────────────────────────────────────────────────────────────────────────────
// Love & Career
// ─────────────────────────────────────────────────────────────────────────────

export interface ReadingSection {
  title: string;
  meta: string;
  body: string;
}

export interface TopicReading {
  headline: string;
  sections: ReadingSection[];
  forecastTitle: string;
  forecast: string;
}

function forecastFor(fc: Forecast, natalIds: PointId[], transitIds: string[], fallback: string) {
  const hits = fc.data.hits.filter((h) => natalIds.includes(h.natal) || transitIds.includes(h.transit)).slice(0, 2);
  if (!hits.length) return fallback;
  return hits
    .map((h) => `${fmtDate(h.date)}: ${hitText(h)} ${KIND_ADVICE[classifyHit(h) as 'opportunity' | 'reflection' | 'activation']}`)
    .join(' ');
}

export function buildLove(chart: NatalChart, fc: Forecast, synInput?: AstroSynthesis): TopicReading {
  const syn = synInput ?? synthesizeChart(chart);
  const venus = planetOf(chart, 'venus');
  const mars = planetOf(chart, 'mars');
  const dscSign = signOf(chart.cusps[6]);
  const ruler = SIGN_RULERS[dscSign];
  const rulerPos = planetOf(chart, ruler);
  const venusAspects = chart.aspects.filter((a) => a.a === 'venus' || a.b === 'venus');
  const tight = venusAspects[0];
  const vm = chart.aspects.find((a) => [a.a, a.b].includes('venus') && [a.a, a.b].includes('mars'));
  const transitVenus = fc.data.positions.find((p) => p.id === 'venus')!;

  const venusEl = SIGN_ELEMENTS[venus.sign];
  const marsEl = SIGN_ELEMENTS[mars.sign];

  const venusDignity = syn.dignities.venus;
  const marsDignity = syn.dignities.mars;
  const isVenusBeneficOfSect = syn.sect.beneficOfSect === 'venus';
  const isMarsChallenging = syn.sect.challengingMalefic === 'mars';

  // Check mutual receptions involving relationship bodies
  const relReception = syn.mutualReceptions.find(
    (r) =>
      (r.planetA === 'venus' || r.planetB === 'venus' || r.planetA === 'mars' || r.planetB === 'mars') ||
      (r.planetA === ruler || r.planetB === ruler),
  );

  return {
    headline: `Venus in ${SIGN_NAMES[venus.sign]} (${venusDignity.label}) × Mars in ${SIGN_NAMES[mars.sign]} (${marsDignity.label}): your ${ELEMENT_LORE[venusEl].label.toLowerCase()} heart and ${ELEMENT_LORE[marsEl].label.toLowerCase()} desire ${ELEMENT_PAIR[pairKey(venusEl, marsEl)]}.`,
    sections: [
      {
        title: 'Relationship Pattern — Venus',
        meta: `${formatLon(venus.lon)} · ${houseLabel(venus.house)} · ${venusDignity.label} ${venusDignity.symbol}${venus.retrograde ? ' · Rx' : ''}`,
        body: `${SIGN_LORE[venus.sign].venus} ${venusDignity.description} ${
          isVenusBeneficOfSect
            ? 'As your Nocturnal Benefic of Sect, Venus is your primary planetary ally for intimacy, drawing harmony and genuine affection effortlessly.'
            : 'In your diurnal chart, Venus acts as a gracious diplomat, softening boundaries and cultivating mutual appreciation.'
        } Love most naturally finds you through your ${housePhrase(venus.house)}.${venus.retrograde ? ' Natal Venus retrograde suggests you revisit past loves and refine your values slowly before committing.' : ''}`,
      },
      {
        title: 'Attraction Style — Mars',
        meta: `${formatLon(mars.lon)} · ${houseLabel(mars.house)} · ${marsDignity.label} ${marsDignity.symbol}${mars.retrograde ? ' · Rx' : ''}`,
        body: `${SIGN_LORE[mars.sign].mars} ${marsDignity.description} ${
          isMarsChallenging
            ? 'Operating as your contrary malefic in a day chart, Mars brings fiery, restless passion that can flare into hasty impatience or friction if boundaries are unclear.'
            : 'Operating as your constructive nocturnal malefic, Mars supplies courageous devotion, healthy protection, and clear-eyed passion.'
        } ${vm ? `Your Venus and Mars form a ${ASPECT_BY_TYPE[vm.type].label.toLowerCase()} (orb ${formatOrb(vm.orb)}), so ${ASPECT_BY_TYPE[vm.type].nature === 'dynamic' ? 'what you desire and what you value can pull in different directions — that friction is magnetic.' : 'what attracts you and what you value are closely aligned.'}` : 'Your Venus and Mars operate independently, so the qualities you desire and the ones you cherish may differ — notice which one you lead with.'}`,
      },
      {
        title: `Partnership Axis — 7th House in ${SIGN_NAMES[dscSign]}`,
        meta: `Ruler ${PLANET_LORE[ruler].name} in ${SIGN_NAMES[rulerPos.sign]} · ${houseLabel(rulerPos.house)} · ${syn.dignities[ruler].label}`,
        body: `${chart.solarChart ? 'In your solar chart, the' : 'With'} ${SIGN_NAMES[dscSign]} on your Descendant, you are drawn to ${SIGN_LORE[dscSign].partner}. Its ruler ${PLANET_LORE[ruler].name} sits in your ${housePhrase(rulerPos.house)}, so significant partners often enter through ${HOUSE_LORE[rulerPos.house - 1].domain}.${
          relReception ? ` Note: ${relReception.label} creates a mutual reception that supports your relational sphere.` : ''
        }`,
      },
      {
        title: 'Tightest Venusian Orb',
        meta: tight ? `${aspectLabel(tight)} · Orb ${formatOrb(tight.orb)} [${tight.strength}]` : 'Venus unaspected',
        body: tight
          ? aspectExplanation(tight)
          : 'With no major aspects, Venus expresses her sign in its pure form — your love nature is distinctive and self-directed, unfiltered by other drives.',
      },
    ],
    forecastTitle: `Romantic Forecast · ${fc.monthLabel}`,
    forecast: forecastFor(
      fc, ['venus', 'mars'], ['venus'],
      `Transiting Venus moves through ${SIGN_NAMES[signOf(transitVenus.lon)]}${transitVenus.retrograde ? ' (retrograde)' : ''} in your ${housePhrase(transitVenus.house)} — ${transitVenus.retrograde ? 'a month to revisit, reconcile and redefine what you truly value in love.' : 'connection blossoms through this area of life this month.'}`,
    ),
  };
}

const LEADERSHIP: Record<Element, string> = {
  fire: 'Inspirational and front-line — you lead by example, energy and bold vision.',
  earth: 'Steady and results-driven — you lead through reliability, competence and tangible outcomes.',
  air: 'Collaborative and strategic — you lead through ideas, networks and clear communication.',
  water: 'Empathic and protective — you lead by reading people and creating loyal, safe teams.',
};

const ENVIRONMENT: Record<Element, string> = {
  fire: 'fast-paced, autonomous environments with visible wins and room to pioneer',
  earth: 'structured environments with clear metrics, quality standards and long-term stability',
  air: 'idea-rich, collaborative environments with variety, flexibility and intellectual stimulation',
  water: 'purpose-driven, emotionally intelligent environments where care and intuition are valued',
};

export function dominant<T extends string>(rec: Record<T, number>): T {
  return (Object.keys(rec) as T[]).reduce((a, b) => (rec[b] > rec[a] ? b : a));
}
export function weakest<T extends string>(rec: Record<T, number>): T {
  return (Object.keys(rec) as T[]).reduce((a, b) => (rec[b] < rec[a] ? b : a));
}

export function buildCareer(chart: NatalChart, fc: Forecast, synInput?: AstroSynthesis): TopicReading {
  const syn = synInput ?? synthesizeChart(chart);
  const sun = planetOf(chart, 'sun');
  const saturn = planetOf(chart, 'saturn');
  const mcSign = signOf(chart.mc);
  const mcRuler = SIGN_RULERS[mcSign];
  const mcRulerPos = planetOf(chart, mcRuler);
  const domEl = dominant(chart.elements);
  const sunSat = chart.aspects.find((a) => [a.a, a.b].includes('sun') && [a.a, a.b].includes('saturn'));
  const saturnDignity = syn.dignities.saturn;
  const mcRulerDignity = syn.dignities[mcRuler];
  const isSaturnConstructive = syn.sect.maleficOfSect === 'saturn';

  return {
    headline: `${SIGN_NAMES[sun.sign]} Sun, Saturn in ${SIGN_NAMES[saturn.sign]} (${saturnDignity.label}) and ${SIGN_NAMES[mcSign]} ${chart.solarChart ? 'on the solar 10th' : 'Midheaven'}: your vocational signature blends ${SIGN_LORE[sun.sign].gift} with ${SIGN_LORE[mcSign].gift}.`,
    sections: [
      {
        title: 'Professional Strengths — Sun',
        meta: `${formatLon(sun.lon)} · ${houseLabel(sun.house)} · ${syn.dignities.sun.label}`,
        body: `${SIGN_LORE[sun.sign].career} With the Sun in your ${housePhrase(sun.house)}, your vitality grows when work touches ${HOUSE_LORE[sun.house - 1].domain}. ${syn.dignities.sun.description}`,
      },
      {
        title: 'Leadership Style & Sect Light',
        meta: `${ELEMENT_LORE[SIGN_ELEMENTS[sun.sign]].label} Sun · ${MODALITY_LORE[SIGN_MODALITIES[sun.sign]].label} · ${syn.sect.sectName}`,
        body: `${LEADERSHIP[SIGN_ELEMENTS[sun.sign]]} ${MODALITY_LORE[SIGN_MODALITIES[sun.sign]].style} ${
          syn.sect.isDayChart
            ? 'Operating with diurnal authority, your solar leadership is direct, radiant, and visionary.'
            : 'Operating with nocturnal acumen, you lead through psychological perception, trusted rapport, and tactical insight.'
        }`,
      },
      {
        title: 'Mastery Path — Saturn',
        meta: `${formatLon(saturn.lon)} · ${houseLabel(saturn.house)} · ${saturnDignity.label} ${saturnDignity.symbol}${saturn.retrograde ? ' · Rx' : ''}`,
        body: `${SIGN_LORE[saturn.sign].saturn} ${saturnDignity.description} ${
          isSaturnConstructive
            ? 'In your day chart, Saturn operates constructively as your architectural malefic: discipline, patience, and rigorous standards compound over time into unassailable authority.'
            : 'In your night chart, Saturn acts as your contrary malefic: beware of debilitating self-doubt or imposter syndrome. Build authority from internal benchmarks rather than seeking impossible external validation.'
        } Placed in your ${housePhrase(saturn.house)}, sustained labor here yields lifelong credibility${saturn.retrograde ? ', with retrograde Saturn building inner standards before outer recognition' : ''}.${sunSat ? ` Your Sun–Saturn ${ASPECT_BY_TYPE[sunSat.type].label.toLowerCase()} (orb ${formatOrb(sunSat.orb)}) ${ASPECT_BY_TYPE[sunSat.type].nature === 'dynamic' ? 'forges resilience through early tests — success arrives later and lasts longer.' : 'lends natural discipline and credibility to your ambitions.'}` : ''}`,
      },
      {
        title: `Midheaven Calling — ${SIGN_NAMES[mcSign]}`,
        meta: `${chart.solarChart ? 'Solar 10th cusp' : 'MC'} ${formatLon(chart.mc)} · Ruler ${PLANET_LORE[mcRuler].name} (${mcRulerDignity.label}) in ${houseLabel(mcRulerPos.house)}`,
        body: `Your public calling resonates with ${SIGN_LORE[mcSign].vocation}. ${PLANET_LORE[mcRuler].name}, your career ruler (${mcRulerDignity.label} in ${SIGN_NAMES[mcRulerPos.sign]}), sits in your ${housePhrase(mcRulerPos.house)} — your reputation is built through ${HOUSE_LORE[mcRulerPos.house - 1].domain}. Ideal environment: ${ENVIRONMENT[domEl]}.`,
      },
    ],
    forecastTitle: `Career Forecast · ${fc.monthLabel}`,
    forecast: forecastFor(
      fc, ['sun', 'saturn', 'mc'], ['saturn', 'jupiter'],
      `No major career transits are exact this month — an ideal window to refine systems and build quietly toward ${SIGN_LORE[mcSign].vocation.split(',')[0]}.`,
    ),
  };
}

export function buildProfectionReading(
  chart: NatalChart,
  fc: Forecast,
  synInput?: AstroSynthesis,
): TopicReading {
  const syn = synInput ?? synthesizeChart(chart);
  const prof = syn.profection2026;
  const timeLordPlanet = planetOf(chart, prof.timeLord);

  return {
    headline: `${prof.theme}`,
    sections: [
      {
        title: `Active Life Arena — ${ordinal(prof.profectedHouse)} House in ${prof.profectedSignName}`,
        meta: `Age ${prof.age} · Hellenistic Annual Profection`,
        body: `At age ${prof.age}, the cosmic spotlight shifts into your ${ordinal(prof.profectedHouse)} house of ${prof.houseDomain}. In Hellenistic astrology, every year activates one house of the zodiac in unbroken succession. The themes of ${prof.houseDomain} will command your energy, decision-making, and growth opportunities throughout ${prof.year}.`,
      },
      {
        title: `Governing Time-Lord — ${prof.timeLordName}`,
        meta: `Natal ${SIGN_NAMES[timeLordPlanet.sign]} (${ordinal(timeLordPlanet.house)}H) · ${prof.timeLordDignity.label} ${prof.timeLordDignity.symbol}`,
        body: `${prof.timeLordName} is the planetary steward of your ${prof.year} chapter. In your natal chart, ${prof.timeLordName} is placed in ${SIGN_NAMES[timeLordPlanet.sign]} in your ${housePhrase(timeLordPlanet.house)} with ${prof.timeLordDignity.label} status. ${prof.timeLordDignity.description} ${
          prof.inSect
            ? `Because ${prof.timeLordName} is in sect for your chart, its lessons unfold with supportive momentum and constructive clarity.`
            : `Because ${prof.timeLordName} is contrary to sect, this year asks for disciplined patience and conscious emotional mastery.`
        }`,
      },
      {
        title: '2026 Sky Movement & Transit Activation',
        meta: `Live Transit Horizon · ${fc.monthLabel}`,
        body: `${prof.transitContext} Transits involving ${prof.timeLordName} throughout ${prof.year} will trigger pivotal turning points. When the Moon or inner planets aspect your Time-Lord, anticipate windows of accelerated manifestation.`,
      },
      {
        title: 'Strategic Directive & Chapter Protocol',
        meta: `Core Directive · ${prof.houseDomain}`,
        body: `${prof.guidance} Ground your daily choices in the reality of your ${ordinal(prof.profectedHouse)} house. By working deliberately with ${prof.timeLordName}'s archetypal principles, you convert this chapter's potential into enduring accomplishment.`,
      },
    ],
    forecastTitle: `Time-Lord Transit Windows · ${fc.monthLabel}`,
    forecast: forecastFor(
      fc,
      [prof.timeLord],
      [prof.timeLord],
      `Your Time-Lord ${prof.timeLordName} moves steadily through your chart this month — focus on building structural integrity in ${prof.houseDomain}.`,
    ),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Orbis Alignment — 4 actionable suggestions
// ─────────────────────────────────────────────────────────────────────────────

export interface Remedy {
  id: 'power' | 'element' | 'timing' | 'shadow';
  title: string;
  telemetry: string;
  headline: string;
  body: string;
  steps: string[];
  footer: string;
  accent: string;
}

export function buildRemedies(chart: NatalChart, now = new Date(), synInput?: AstroSynthesis): Remedy[] {
  const syn = synInput ?? synthesizeChart(chart);
  const remedies: Remedy[] = [];

  // 1 — Dominant Orb Power Move
  const tight = chart.aspects[0];
  if (tight) {
    const A = PLANET_LORE[tight.a];
    const B = PLANET_LORE[tight.b];
    const def = ASPECT_BY_TYPE[tight.type];
    const day = WEEKDAY_RULER[tight.a];
    const date = nextWeekday(day, now);
    const framing =
      def.nature === 'fusion' ? 'Concentrate this fused power on a single decisive move.'
        : def.nature === 'harmonious' ? 'This is effortless talent — use it deliberately instead of passively.'
          : 'This is pressurised power — channel the tension into decisive breakthrough action.';
    const beneficBonus = syn.sect.beneficOfSect === tight.a || syn.sect.beneficOfSect === tight.b
      ? ` Blessed by your Sect Benefic ${PLANET_LORE[syn.sect.beneficOfSect].name}, this channel carries magnified grace.`
      : '';
    remedies.push({
      id: 'power', title: 'Dominant Orb Power Move', accent: def.color,
      telemetry: `${aspectLabel(tight)} · Orb ${formatOrb(tight.orb)}`,
      headline: `Your tightest orb links ${A.principle} with ${B.principle}.`,
      body: `At just ${formatOrb(tight.orb)}, this ${def.label.toLowerCase()} is the most concentrated energy channel in your chart — your superpower.${beneficBonus} ${framing}`,
      steps: [`${cap(A.action)}.`, `Then let ${B.name} amplify it: ${B.action}.`, `Review the result on ${WEEKDAYS[(day + 3) % 7]} and note what felt effortless.`],
      footer: `Power day: ${WEEKDAYS[day]} ${fmtDate(date, { month: 'short', day: 'numeric' })} (${A.name}'s day)`,
    });
  }

  // 2 — Elemental Equilibrium Ritual
  const low = weakest(chart.elements);
  const high = dominant(chart.elements);
  const L = ELEMENT_LORE[low];
  remedies.push({
    id: 'element', title: 'Elemental Equilibrium Ritual', accent: L.color,
    telemetry: `${L.label} ${chart.elements[low]}% · ${ELEMENT_LORE[high].label} ${chart.elements[high]}%`,
    headline: `${L.ritualTitle}: restore your ${L.label.toLowerCase()} to balance your dominant ${ELEMENT_LORE[high].label.toLowerCase()}.`,
    body: `${L.label} is your lowest-scoring element at ${chart.elements[low]}%. ${L.why} A small daily dose of ${L.quality} rebalances your orbit.`,
    steps: L.ritual,
    footer: 'Practise daily for 21 days · ~20 minutes',
  });

  // 3 — Annual Time-Lord Strategic Alignment (2026 Chapter)
  const prof = syn.profection2026;
  const tlPlanet = PLANET_LORE[prof.timeLord];
  const tlDignity = prof.timeLordDignity;
  const tlDay = WEEKDAY_RULER[prof.timeLord];
  const tlDate = nextWeekday(tlDay, now);
  remedies.push({
    id: 'timing',
    title: `Time-Lord Strategic Ritual (${prof.year})`,
    accent: '#38BDF8',
    telemetry: `${tlPlanet.name} · ${ordinal(prof.profectedHouse)}H (${prof.profectedSignName})`,
    headline: `Align with your ${prof.year} Time-Lord: ${tlPlanet.name} in the ${ordinal(prof.profectedHouse)} House.`,
    body: `In your age-${prof.age} profection, ${tlPlanet.name} holds the temporal keys. Natal dignity: ${tlDignity.label} in ${tlDignity.signName} (${tlDignity.symbol}). Focus on ${prof.houseDomain} to maximize cosmic resonance.`,
    steps: [
      `Dedicate your key weekly planning to ${WEEKDAYS[tlDay]} (${tlPlanet.name}'s classical day).`,
      `Audit and advance your ${ordinal(prof.profectedHouse)} house priorities (${prof.houseDomain}).`,
      `Practice ${tlPlanet.action.toLowerCase()} with deliberate focus.`,
    ],
    footer: `Active Time-Lord Day: ${WEEKDAYS[tlDay]} ${fmtDate(tlDate, { month: 'short', day: 'numeric' })} · ${prof.year} Chapter`,
  });

  // 4 — Shadow Orb & Sect Malefic Check-In
  const challengingMaleficId = syn.sect.challengingMalefic;
  const maleficLore = PLANET_LORE[challengingMaleficId];
  const maleficPos = planetOf(chart, challengingMaleficId);
  const hardAspects = chart.aspects
    .filter((a) => (a.type === 'square' || a.type === 'opposition') && (a.a === challengingMaleficId || a.b === challengingMaleficId))
    .sort((a, b) => a.orb - b.orb);
  const generalHard = chart.aspects
    .filter((a) => a.type === 'square' || a.type === 'opposition')
    .sort((a, b) => a.orb - b.orb)[0];
  const shadowAspect = hardAspects[0] ?? generalHard;

  if (shadowAspect) {
    const kind: 'square' | 'opposition' = shadowAspect.type === 'opposition' ? 'opposition' : 'square';
    const sp = SHADOW_PROMPTS[kind];
    const A = PLANET_LORE[shadowAspect.a];
    const B = PLANET_LORE[shadowAspect.b];
    const maleficInvolved = shadowAspect.a === challengingMaleficId || shadowAspect.b === challengingMaleficId;
    const headline = maleficInvolved
      ? `Ground your out-of-sect ${maleficLore.name}: tension between ${A.name} and ${B.name}.`
      : `Out-of-Sect ${maleficLore.name} & Focal Chart Tension (${A.name}–${B.name}).`;
    remedies.push({
      id: 'shadow',
      title: 'Shadow Orb & Sect Malefic Check-In',
      accent: ASPECT_BY_TYPE[shadowAspect.type].color,
      telemetry: `${aspectLabel(shadowAspect)} · ${maleficLore.name} [Contrary Malefic]`,
      headline,
      body: `As a ${syn.sect.sectName.toLowerCase()} native, ${maleficLore.name} in ${SIGN_NAMES[maleficPos.sign]} (${houseLabel(maleficPos.house)}) operates contrary to sect, presenting your sharpest growth edge. ${sp.shift}`,
      steps: [
        `Journal prompt: ${sp.prompt.replace('{needA}', A.need).replace('{needB}', B.need)}`,
        `Mindset shift: replace “either ${A.need} or ${B.need}” with “${A.need} through ${B.need}.”`,
        `Honor ${maleficLore.name}'s gift: cultivate ${maleficLore.principle} without succumbing to ${challengingMaleficId === 'mars' ? 'hasty anger or burnout' : 'isolation or rigid pessimism'}.`,
      ],
      footer: `Contrary Malefic: ${maleficLore.name} in ${SIGN_NAMES[maleficPos.sign]} · Practise during waning moon`,
    });
  } else {
    remedies.push({
      id: 'shadow',
      title: 'Shadow Orb & Sect Malefic Check-In',
      accent: '#A78BFA',
      telemetry: `${maleficLore.name} [Contrary Malefic] · ${formatLon(maleficPos.lon)}`,
      headline: `Mindful Alignment with your Out-of-Sect ${maleficLore.name}.`,
      body: `With no major hard aspects in your chart, your primary growth edge lives in moderating your contrary malefic ${maleficLore.name} in ${SIGN_NAMES[maleficPos.sign]} (${housePhrase(maleficPos.house)}).`,
      steps: [
        `Check in with your ${housePhrase(maleficPos.house)} whenever you feel tension.`,
        `Practice balancing ${maleficLore.principle} with intentional calm.`,
      ],
      footer: `Contrary Malefic: ${maleficLore.name} · Waning Moon check-in`,
    });
  }

  return remedies;
}
