import {
  calculateSect,
  evaluatePlanetDignity,
  evaluateDignities,
  calculateLunarPhase,
  detectAspectPatterns,
  calculateAnnualProfection,
  synthesizeChart,
} from './src/lib/astroSynthesis';
import {
  calculateNatalChart,
  computeAspects,
  ordinal,
  zoneOffsetHours,
  type NatalChart,
  type PlanetPosition,
  norm360,
} from './src/lib/astroEngine';
import { PRESETS, cityById } from './src/lib/cities';
import {
  buildTriad,
  buildLove,
  buildCareer,
  buildProfectionReading,
  buildRemedies,
  buildForecast,
} from './src/lib/horoscopeEngine';

function assert(condition: unknown, msg = 'Assertion failed'): asserts condition {
  if (!condition) throw new Error(msg);
}

function assertEqual<T>(actual: T, expected: T, msg?: string) {
  if (actual !== expected) {
    throw new Error(msg ?? `Expected ${String(expected)}, got ${String(actual)}`);
  }
}

function makePos(id: PlanetPosition['id'], lon: number, house: number, sign: number): PlanetPosition {
  return {
    id,
    lon,
    degInSign: norm360(lon) % 30,
    speed: 1,
    retrograde: false,
    sign,
    house,
  };
}

function makeChart(planets: PlanetPosition[], cusps: number[]): NatalChart {
  return {
    input: {
      name: 'Test',
      date: '2000-01-01',
      time: '12:00',
      unknownTime: false,
      lat: 0,
      lng: 0,
      utcOffset: 0,
      locationLabel: 'Test',
    },
    jd: 2451545,
    utc: new Date('2000-01-01T12:00:00Z'),
    lst: 0,
    obliquity: 23.44,
    asc: 0,
    mc: 270,
    cusps,
    solarChart: false,
    planets,
    aspects: computeAspects(planets),
    elements: { fire: 25, earth: 25, air: 25, water: 25 },
    modalities: { cardinal: 100, fixed: 0, mutable: 0 },
  };
}

console.log('🧪 Starting ORBIS Astrological Deepening Verification Suite...');

// ─────────────────────────────────────────────────────────────────────────────
// 1. GRAND CROSS DETECTION
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n--- 1. Testing Grand Cross Detection ---');

{
  const planets: PlanetPosition[] = [
    makePos('sun', 0, 1, 0),
    makePos('moon', 90, 4, 3),
    makePos('mercury', 15, 1, 0),
    makePos('venus', 20, 1, 0),
    makePos('mars', 180, 7, 6),
    makePos('jupiter', 45, 2, 1),
    makePos('saturn', 270, 10, 9),
  ];
  const cusps = [0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330];
  const chart = makeChart(planets, cusps);

  const patterns = detectAspectPatterns(chart);
  const grandCross = patterns.find((p) => p.type === 'grand-cross');
  assert(grandCross, 'Grand Cross MUST be detected when 2 oppositions and 4 squares are present');
  assertEqual(grandCross.name, 'Cardinal Grand Cross');
  assertEqual(grandCross.planets.slice().sort().join(','), 'mars,moon,saturn,sun');
  console.log('✓ Cardinal Grand Cross detected correctly:', grandCross.name, grandCross.planets);

  // Incomplete cross: shift Mars
  const planetsNoCross = planets.map((p) => (p.id === 'mars' ? makePos('mars', 140, 5, 4) : p));
  const chartNoCross = makeChart(planetsNoCross, cusps);
  const patternsNoCross = detectAspectPatterns(chartNoCross);
  assert(!patternsNoCross.some((p) => p.type === 'grand-cross'), 'Incomplete cross must NOT be detected as Grand Cross');
  console.log('✓ Incomplete cross correctly rejected');
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. STELLIUM DETECTION (SIGN & HOUSE)
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n--- 2. Testing Stellium Detection ---');

{
  // 2.1 Sign Stellium
  const planetsSign: PlanetPosition[] = [
    makePos('sun', 5, 1, 0),
    makePos('mercury', 12, 1, 0),
    makePos('venus', 20, 1, 0),
    makePos('moon', 90, 4, 3),
    makePos('mars', 120, 5, 4),
    makePos('jupiter', 150, 6, 5),
    makePos('saturn', 180, 7, 6),
  ];
  const cusps = [0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330];
  const chartSign = makeChart(planetsSign, cusps);
  const patSign = detectAspectPatterns(chartSign);
  const signStellium = patSign.find((p) => p.id === 'stellium-sign-0');
  assert(signStellium, 'Sign stellium must be detected for 3 planets in Aries');
  assertEqual(signStellium.name, 'Aries Stellium');
  console.log('✓ Sign Stellium detected:', signStellium.name);

  // 2.2 House Stellium spanning distinct signs
  const planetsHouse: PlanetPosition[] = [
    makePos('sun', 135, 10, 4),
    makePos('venus', 140, 10, 4),
    makePos('mercury', 155, 10, 5), // Virgo, in House 10
    makePos('moon', 0, 5, 0),
    makePos('mars', 30, 6, 1),
    makePos('jupiter', 60, 7, 2),
    makePos('saturn', 90, 8, 3),
  ];
  const cuspsHouse = [0, 30, 60, 90, 120, 130, 160, 190, 220, 250, 280, 310];
  const chartHouse = makeChart(planetsHouse, cuspsHouse);
  const patHouse = detectAspectPatterns(chartHouse);
  const houseStellium = patHouse.find((p) => p.id === 'stellium-house-10');
  assert(houseStellium, 'House Stellium MUST be detected when 3+ planets converge in House 10 across signs');
  assertEqual(houseStellium.name, '10th House Stellium');
  console.log('✓ House Stellium across signs detected:', houseStellium.name, houseStellium.planets);
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. ESSENTIAL DIGNITY SCORING (DUAL DIGNITIES)
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n--- 3. Testing Ptolemaic Essential Dignities ---');

{
  const pVirgo = makePos('mercury', 165, 1, 5);
  const dVirgo = evaluatePlanetDignity(pVirgo);
  assertEqual(dVirgo.score, 9, 'Mercury in Virgo must score +9 (+5 Domicile + +4 Exaltation)');
  assertEqual(dVirgo.label, 'Domicile & Exaltation');
  console.log('✓ Mercury in Virgo score:', dVirgo.score, dVirgo.label);

  const pPisces = makePos('mercury', 345, 7, 11);
  const dPisces = evaluatePlanetDignity(pPisces);
  assertEqual(dPisces.score, -9, 'Mercury in Pisces must score -9 (-5 Detriment + -4 Fall)');
  assertEqual(dPisces.label, 'Detriment & Fall');
  console.log('✓ Mercury in Pisces score:', dPisces.score, dPisces.label);

  const sunLeo = evaluatePlanetDignity(makePos('sun', 135, 1, 4));
  assertEqual(sunLeo.score, 5);
  const sunAries = evaluatePlanetDignity(makePos('sun', 15, 1, 0));
  assertEqual(sunAries.score, 4);
  const saturnAries = evaluatePlanetDignity(makePos('saturn', 15, 1, 0));
  assertEqual(saturnAries.score, -4);
  console.log('✓ Classical dignities verified for Sun and Saturn');
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. HELLENISTIC SECT & TIME-LORD (MERCURY SECT COUPLING)
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n--- 4. Testing Hellenistic Sect & Time-Lord ---');

{
  const nyPreset = PRESETS.find((p) => p.id === 'new-york')!;
  const nyCity = cityById(nyPreset.cityId)!;
  const nyChart = calculateNatalChart({
    name: nyPreset.name,
    date: nyPreset.date,
    time: nyPreset.time,
    unknownTime: false,
    lat: nyCity.lat,
    lng: nyCity.lng,
    timezone: nyCity.timezone,
    utcOffset: zoneOffsetHours(nyCity.timezone, nyPreset.date, nyPreset.time, nyCity.utcOffset),
    locationLabel: nyCity.name,
  });

  const nySect = calculateSect(nyChart);
  assertEqual(nySect.isDayChart, false, 'New York preset born 21:45 must be Nocturnal');
  assertEqual(nySect.sectLight, 'moon');

  const nyDignities = evaluateDignities(nyChart);
  const nyProf = calculateAnnualProfection(nyChart, nySect, nyDignities, 2026);
  assertEqual(nyProf.profectedHouse, 12);
  assertEqual(nyProf.timeLord, 'mercury');
  assertEqual(nyProf.inSect, true, 'Occidental Mercury in night chart must be IN SECT');
  console.log('✓ New York occidental Mercury correctly evaluated as inSect: true for night chart');

  const bkkPreset = PRESETS.find((p) => p.id === 'bangkok')!;
  const bkkCity = cityById(bkkPreset.cityId)!;
  const bkkChart = calculateNatalChart({
    name: bkkPreset.name,
    date: bkkPreset.date,
    time: bkkPreset.time,
    unknownTime: false,
    lat: bkkCity.lat,
    lng: bkkCity.lng,
    timezone: bkkCity.timezone,
    utcOffset: zoneOffsetHours(bkkCity.timezone, bkkPreset.date, bkkPreset.time, bkkCity.utcOffset),
    locationLabel: bkkCity.name,
  });
  const bkkSect = calculateSect(bkkChart);
  assertEqual(bkkSect.isDayChart, true, 'Bangkok preset born 06:15 must be Diurnal');
  assertEqual(bkkSect.sectLight, 'sun');
  console.log('✓ Bangkok diurnal sect verified');
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. PROFECTION BADGE FORMATTING (ORDINAL)
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n--- 5. Testing Profection Badge Grammar ---');

{
  assertEqual(`${ordinal(1)} House`, '1st House');
  assertEqual(`${ordinal(2)} House`, '2nd House');
  assertEqual(`${ordinal(3)} House`, '3rd House');
  assertEqual(`${ordinal(9)} House`, '9th House');
  console.log('✓ Ordinal house grammar verified');
}

// ─────────────────────────────────────────────────────────────────────────────
// 6. ALL 8 LUNAR PHASES & BOUNDARIES
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n--- 6. Testing 8-fold Lunar Phase Calculation ---');

{
  const testAngles = [
    { angle: 0, expected: 'new' },
    { angle: 44.9, expected: 'new' },
    { angle: 45.0, expected: 'waxing-crescent' },
    { angle: 89.9, expected: 'waxing-crescent' },
    { angle: 90.0, expected: 'first-quarter' },
    { angle: 134.9, expected: 'first-quarter' },
    { angle: 135.0, expected: 'gibbous' },
    { angle: 179.9, expected: 'gibbous' },
    { angle: 180.0, expected: 'full' },
    { angle: 224.9, expected: 'full' },
    { angle: 225.0, expected: 'disseminating' },
    { angle: 269.9, expected: 'disseminating' },
    { angle: 270.0, expected: 'last-quarter' },
    { angle: 314.9, expected: 'last-quarter' },
    { angle: 315.0, expected: 'balsamic' },
    { angle: 359.9, expected: 'balsamic' },
  ];

  for (const { angle, expected } of testAngles) {
    const planets: PlanetPosition[] = [
      makePos('sun', 0, 1, 0),
      makePos('moon', angle, 1, 0),
    ];
    const mockChart: NatalChart = {
      ...makeChart(planets, [0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330]),
      planets,
    };
    const phase = calculateLunarPhase(mockChart);
    assertEqual(phase.phaseKey, expected, `Angle ${angle}° must yield phase ${expected}`);
  }
  console.log('✓ All 8 Lunar phase boundaries verified cleanly');
}

// ─────────────────────────────────────────────────────────────────────────────
// 7. COMPLETE SYNTHESIS RUN ACROSS ALL 5 PRESETS
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n--- 7. Testing Complete Synthesis Across All 5 Presets ---');

for (const p of PRESETS) {
  const city = cityById(p.cityId)!;
  const chart = calculateNatalChart({
    name: p.name,
    date: p.date,
    time: p.time,
    unknownTime: false,
    lat: city.lat,
    lng: city.lng,
    timezone: city.timezone,
    utcOffset: zoneOffsetHours(city.timezone, p.date, p.time, city.utcOffset),
    locationLabel: city.name,
  });

  const syn = synthesizeChart(chart, 2026);
  assert(syn.sect);
  assert(syn.dignities);
  assert(syn.lunarPhase);
  assert(syn.profection2026);

  const fc = buildForecast(chart, 2026, 9);
  const triad = buildTriad(chart, syn);
  assertEqual(triad.cards.length, 3);
  assert(triad.synthesis.length > 50);

  const love = buildLove(chart, fc, syn);
  assert(love.headline.length > 20);
  assertEqual(love.sections.length, 4);

  const career = buildCareer(chart, fc, syn);
  assert(career.headline.length > 20);
  assertEqual(career.sections.length, 4);

  const profReading = buildProfectionReading(chart, fc, syn);
  assert(profReading.headline.length > 20);
  assertEqual(profReading.sections.length, 4);

  const remedies = buildRemedies(chart, new Date(), syn);
  assertEqual(remedies.length, 4);
  console.log(
    `✓ Preset ${p.id.padEnd(9)} verified: ${syn.sect.sectName.padEnd(25)} | ${syn.lunarPhase.name.padEnd(18)} | Age ${syn.profection2026.age} (${ordinal(syn.profection2026.profectedHouse)}H)`,
  );
}

console.log('\n🎉 ALL 7 TEST SUITES PASSED FLAWLESSLY!');
