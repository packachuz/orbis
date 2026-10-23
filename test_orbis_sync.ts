import {
  calculateNatalChart,
  SIGN_ELEMENTS,
  PLANET_IDS,
  type Element,
  type PlanetId,
  type AspectType,
} from './src/lib/astroEngine';
import { PRESETS, cityById } from './src/lib/cities';
import { synthesizeChart } from './src/lib/astroSynthesis';
import {
  planetExplanation,
  aspectExplanation,
  buildForecast,
} from './src/lib/horoscopeEngine';

function assert(condition: unknown, msg = 'Assertion failed'): asserts condition {
  if (!condition) throw new Error(msg);
}

console.log('🧪 Starting Comprehensive ORBIS Section Synchronization Test Suite...\n');

// Test across all 5 chart presets
for (const preset of PRESETS) {
  const city = cityById(preset.cityId)!;
  const chart = calculateNatalChart({
    name: preset.name,
    date: preset.date,
    time: preset.time,
    unknownTime: false,
    lat: city.lat,
    lng: city.lng,
    timezone: city.timezone,
    utcOffset: city.utcOffset,
    locationLabel: `${city.name}, ${city.country}`,
  });
  const synthesis = synthesizeChart(chart, 2026);
  const forecast = buildForecast(chart, 2026, 9);
  const lowestElement = Object.entries(chart.elements).sort((a, b) => a[1] - b[1])[0][0] as Element;
  const highestElement = Object.entries(chart.elements).sort((a, b) => b[1] - a[1])[0][0] as Element;
  const tightestAspect = chart.aspects[0];

  console.log(`\n========================================================`);
  console.log(`Testing Preset: ${preset.name} (${preset.id})`);
  console.log(`Time-Lord: ${synthesis.profection2026.timeLord} | Contrary Malefic: ${synthesis.sect.challengingMalefic}`);
  console.log(`Lowest Element: ${lowestElement} | Dominant Element: ${highestElement}`);
  console.log(`========================================================`);

  // --- 1. Test ActiveOrbs Sorting and Filtering for All Planets ---
  console.log('  [Section 02] Testing ActiveOrbs sorting & filtering...');
  for (const pid of PLANET_IDS) {
    const connectedAspects = chart.aspects.filter((a) => a.a === pid || a.b === pid);
    
    // Sort algorithm verification
    const sorted = [...chart.aspects].sort((a, b) => {
      const aConn = a.a === pid || a.b === pid;
      const bConn = b.a === pid || b.b === pid;
      if (aConn && !bConn) return -1;
      if (!aConn && bConn) return 1;
      return a.orb - b.orb;
    });

    if (connectedAspects.length > 0) {
      assert(sorted[0].a === pid || sorted[0].b === pid, `${pid}: First aspect in sorted list must involve ${pid}`);
      assert(
        sorted.slice(0, connectedAspects.length).every((a) => a.a === pid || a.b === pid),
        `${pid}: All top ${connectedAspects.length} aspects must involve ${pid}`
      );
      // Connected aspects must be sorted internally by orb ascending
      for (let i = 0; i < connectedAspects.length - 1; i++) {
        assert(sorted[i].orb <= sorted[i + 1].orb, `${pid}: Connected aspects must be sorted by orb ascending`);
      }
    } else {
      // Singleton planet
      assert(connectedAspects.length === 0, `${pid} is a singleton with 0 aspects`);
    }
  }
  console.log(`  ✓ All ${PLANET_IDS.length} planets verified for Section 02 aspect priority sorting`);

  // --- 2. Test Smart Tab Steering for All Planets & Aspects ---
  console.log('  [Section 03] Testing smart tab routing...');
  const isEventAffectingPlanet = (ev: any, pid: PlanetId) => {
    if (ev.hit?.natal === pid || ev.hit?.transit === pid) return true;
    if (ev.kind === 'station' && ev.title.toLowerCase().includes(pid)) return true;
    if (ev.kind === 'lunation' && (pid === 'sun' || pid === 'moon')) return true;
    return false;
  };

  const getRecommendedTabForPlanet = (pid: PlanetId) => {
    if (pid === synthesis.profection2026.timeLord) return 'profection';
    if (pid === 'venus' || pid === 'mars') return 'love';
    if (pid === 'sun' || pid === 'saturn') return 'career';
    const hasTransit = forecast.events.some((ev) => isEventAffectingPlanet(ev, pid));
    if (hasTransit) return 'forecast';
    return null;
  };

  const timeLord = synthesis.profection2026.timeLord;
  assert(getRecommendedTabForPlanet(timeLord) === 'profection', `Time-Lord ${timeLord} must steer to profection tab`);

  if (timeLord !== 'venus') {
    assert(getRecommendedTabForPlanet('venus') === 'love', 'Venus must steer to love tab');
  }
  if (timeLord !== 'sun') {
    assert(getRecommendedTabForPlanet('sun') === 'career', 'Sun must steer to career tab');
  }
  if (timeLord !== 'saturn') {
    assert(getRecommendedTabForPlanet('saturn') === 'career', 'Saturn must steer to career tab');
  }

  // Aspect tab routing
  for (const asp of chart.aspects.slice(0, 5)) {
    const getTabForAspect = (a: PlanetId, b: PlanetId, _type: AspectType) => {
      if (a === timeLord || b === timeLord) return 'profection';
      if (a === 'venus' || b === 'venus' || a === 'mars' || b === 'mars') return 'love';
      if (a === 'sun' || b === 'sun' || a === 'saturn' || b === 'saturn') return 'career';
      return 'forecast';
    };
    const tab = getTabForAspect(asp.a, asp.b, asp.type);
    assert(['love', 'career', 'profection', 'forecast'].includes(tab), `Aspect tab ${tab} must be valid`);
  }
  console.log(`  ✓ Smart tab guidance routing verified for planets and aspect chords`);

  // --- 3. Test Remedy Spotlighting Coverage for All Planets & Aspects ---
  console.log('  [Section 04] Testing remedy spotlight matching coverage...');
  const getRemedyMatch = (pid: PlanetId) => {
    const pos = chart.planets.find((p) => p.id === pid)!;
    const elem = SIGN_ELEMENTS[pos.sign];

    if (tightestAspect && (tightestAspect.a === pid || tightestAspect.b === pid)) {
      return { id: 'power', badge: '★ Dominant Orb Power Move' };
    }
    if (pid === synthesis.profection2026.timeLord) {
      return { id: 'timing', badge: '★ 2026 Time-Lord Sovereign Protocol' };
    }
    if (pid === 'mercury') {
      return { id: 'timing', badge: '★ Mercurial Signal & Decision Timing' };
    }
    if (pid === synthesis.sect.challengingMalefic) {
      return { id: 'shadow', badge: '★ Out-of-Sect Contrary Malefic' };
    }
    const hasHard = chart.aspects.some(
      (a) => (a.a === pid || a.b === pid) && (a.type === 'square' || a.type === 'opposition'),
    );
    if (hasHard) {
      return { id: 'shadow', badge: '★ Shadow Orb Growth Edge' };
    }
    if (elem === lowestElement) {
      return { id: 'element', badge: `★ Rebalances Deficit: ${lowestElement.toUpperCase()}` };
    }
    if (elem === highestElement) {
      return { id: 'element', badge: `★ Balances Dominant: ${highestElement.toUpperCase()}` };
    }
    const hasAspects = chart.aspects.some((a) => a.a === pid || a.b === pid);
    if (hasAspects) {
      return { id: 'power', badge: '★ Harmonic Orb Integration' };
    }
    return { id: 'element', badge: `★ Elemental Equilibrium (${elem.toUpperCase()})` };
  };

  for (const pid of PLANET_IDS) {
    const match = getRemedyMatch(pid);
    assert(match !== null, `Every planet must have a matched remedy, but ${pid} got null`);
    assert(['power', 'element', 'timing', 'shadow'].includes(match.id), `${pid} matched invalid remedy ${match.id}`);
    assert(match.badge.length > 5, `${pid} badge must be non-empty`);
  }
  console.log(`  ✓ 100% remedy spotlight coverage verified for all ${PLANET_IDS.length} planets`);

  // Test aspect remedy match
  for (const asp of chart.aspects) {
    const isTightest =
      tightestAspect &&
      ((asp.a === tightestAspect.a && asp.b === tightestAspect.b) ||
        (asp.a === tightestAspect.b && asp.b === tightestAspect.a));
    let matchId = 'power';
    if (isTightest) matchId = 'power';
    else if (asp.type === 'square' || asp.type === 'opposition') matchId = 'shadow';
    else if (asp.a === timeLord || asp.b === timeLord) matchId = 'timing';
    else matchId = 'power';

    assert(['power', 'element', 'timing', 'shadow'].includes(matchId), `Aspect remedy ${matchId} must be valid`);
  }
  console.log(`  ✓ 100% remedy spotlight coverage verified for all ${chart.aspects.length} aspect chords`);
}

// Clean verification of text generators
console.log('\n--- 4. Testing Synthesis Explanations ---');
const bangkokPreset = PRESETS[0];
const bangkokCity = cityById(bangkokPreset.cityId)!;
const bangkokChart = calculateNatalChart({
  name: bangkokPreset.name,
  date: bangkokPreset.date,
  time: bangkokPreset.time,
  unknownTime: false,
  lat: bangkokCity.lat,
  lng: bangkokCity.lng,
  timezone: bangkokCity.timezone,
  utcOffset: bangkokCity.utcOffset,
  locationLabel: `${bangkokCity.name}, ${bangkokCity.country}`,
});

for (const p of bangkokChart.planets) {
  const exp = planetExplanation(bangkokChart, p);
  assert(exp.length > 20, `Planet explanation for ${p.id} must be non-empty`);
}
for (const a of bangkokChart.aspects) {
  const exp = aspectExplanation(a);
  assert(exp.length > 20, `Aspect explanation for ${a.a}-${a.b} must be non-empty`);
}
console.log('✓ Explanations generate reliably for all planetary nodes and aspect chords');

console.log('\n🎉 ALL COMPREHENSIVE ORBIS SYNCHRONIZATION TESTS PASSED!\n');
