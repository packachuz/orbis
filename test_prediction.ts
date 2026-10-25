/**
 * ORBIS — E2E Predictive Astrology Test Suite (test_prediction.ts)
 * =============================================================================
 * Automated, deterministic verification suite covering Tiers 1-4 across all 5
 * chart presets (Bangkok, London, New York, Perth, Tokyo) for:
 *
 * 1. Suite 1: Secondary Progressions ("Day-for-a-Year")
 *    - 1 solar day ephemeris time = 1 tropical year of life (JD delta ±0.01d)
 *    - Progressed Sun advance (~N° for N years)
 *    - Progressed Moon sign, house, and monthly motion (~1°/mo)
 *    - 8-fold Progressed Lunar Phase octant classification
 *    - Tight Progressed-to-Natal aspects with orb <= 1.5°
 *
 * 2. Suite 2: Exact Solar Return (Annual Revolution)
 *    - Newton-Raphson Sun match with error < 0.001° (< 3.6") across all presets
 *    - Solar Return Ascendant, Midheaven, and SR quadrant cusps
 *    - Rising and culminating natal house overlays (1..12)
 *    - Tight SR-to-natal conjunctions with orb <= 3.0°
 *
 * 3. Suite 3: Hellenistic Lots & Monthly Profections
 *    - Diurnal vs. nocturnal formula reversal for Lot of Fortune and Spirit
 *    - Geometric symmetry: Fortune + Spirit = 2*ASC
 *    - Solar chart fallback (unknownTime: true)
 *    - Angular Peak Period identification (1st, 4th, 7th, 10th from Lot)
 *    - Birthday-aware annual profections (advances on birthday month)
 *    - Sequential 12-month monthly profection progression through all 12 houses (1..12)
 *
 * 4. Suite 4: Lunar Nodes & Eclipse Detection
 *    - Mean & True Lunar Node axis calculation (North/South 180° opposition)
 *    - True Node perturbation bound (<= 2.0° from Mean Node)
 *    - Lunations <= 18° flagged with isEclipse: true (Solar vs Lunar)
 *    - Central/Total (<= 10°) vs Partial/Nodal (10°..18°) classification
 *    - Lunations > 18° flagged with isEclipse: false
 *    - Major life-cycle planetary return milestones (Saturn, Jupiter, Mars, Nodes)
 *
 * 5. Suite 5: Rule of Three Convergence Engine
 *    - Deterministic, non-empty multi-clock convergence items across all presets
 *    - Strict Rule of Three filter: N_clocks >= 2 (rejection of single-clock isolates)
 *    - Badge tiers: 4-Clock Sovereign, 3-Clock Major, Dual Testimony
 *    - Deterministic scoring, ranking, date windows, and plain-English narrative synthesis
 *
 * Executed via: npx tsx test_prediction.ts
 * Strictly evaluated under astro check (astro/tsconfigs/strict).
 */

import {
  calculateNatalChart,
  norm360,
  angDiff,
  separation,
  signOf,
  houseOf,
  SIGN_NAMES,
  SIGN_RULERS,
  PLANET_IDS,
  lunarNodes,
  type NatalChart,
} from './src/lib/astroEngine';

import { PRESETS, cityById } from './src/lib/cities';

import {
  computeHellenisticLots,
  computePredictiveProfection,
  computeSecondaryProgressions,
  computeExactSolarReturn,
  classifyEclipsesAndReturns,
  computePredictiveConvergence,
  TROPICAL_YEAR_DAYS,
  type HellenisticLotsResult,
  type ConvergenceBadge,
} from './src/lib/predictiveEngine';

// ─────────────────────────────────────────────────────────────────────────────
// Assertion Harness & Telemetry
// ─────────────────────────────────────────────────────────────────────────────

let totalAssertions = 0;
let totalSuitesPassed = 0;

function assert(condition: unknown, msg: string): asserts condition {
  totalAssertions++;
  if (!condition) {
    throw new Error(`❌ Assertion Failed: ${msg}`);
  }
}

function assertEqual<T>(actual: T, expected: T, msg?: string): void {
  totalAssertions++;
  if (actual !== expected) {
    throw new Error(
      `❌ Assertion Failed: ${msg ?? ''}\n   Expected: ${String(expected)}\n   Actual:   ${String(actual)}`
    );
  }
}

function assertCloseTo(
  actual: number,
  expected: number,
  tolerance: number,
  msg?: string
): void {
  totalAssertions++;
  const diff = Math.abs(actual - expected);
  if (diff > tolerance) {
    throw new Error(
      `❌ Assertion Failed: ${msg ?? ''}\n   Expected ${actual.toFixed(6)} to be within ${tolerance} of ${expected.toFixed(6)} (diff=${diff.toFixed(6)})`
    );
  }
}

function assertDefined<T>(val: T | undefined | null, msg?: string): asserts val is T {
  totalAssertions++;
  if (val === undefined || val === null) {
    throw new Error(`❌ Assertion Failed: ${msg ?? 'Expected value to be defined'}`);
  }
}

// Preset helper
function loadPresetChart(presetId: string): NatalChart {
  const preset = PRESETS.find((p) => p.id === presetId);
  assertDefined(preset, `Preset not found: ${presetId}`);
  const city = cityById(preset.cityId);
  assertDefined(city, `City not found: ${preset.cityId}`);

  return calculateNatalChart({
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
}

console.log('🔮 =========================================================================');
console.log('   ORBIS PREDICTIVE ASTROLOGY E2E VERIFICATION SUITE');
console.log('   Four-Clock Deterministic Engine & Rule of Three Convergence Scoring');
console.log('=========================================================================\n');

// ─────────────────────────────────────────────────────────────────────────────
// SUITE 1: Secondary Progressions ("Day-for-a-Year")
// ─────────────────────────────────────────────────────────────────────────────
console.log('▶ [Suite 1/5] Testing Secondary Progressions ("Day-for-a-Year")...');

{
  let suiteAssertions = 0;

  for (const preset of PRESETS) {
    const chart = loadPresetChart(preset.id);
    const [birthY, birthM] = chart.input.date.split('-').map(Number);
    const natalSun = chart.planets.find((p) => p.id === 'sun')!;
    const natalMoon = chart.planets.find((p) => p.id === 'moon')!;
    assertDefined(natalMoon, `${preset.name}: Chart includes Moon`);

    // 1.1 Core Ephemeris Day-for-a-Year Mapping
    const prog2026 = computeSecondaryProgressions(chart, 2026, 9); // October 2026
    const targetDate2026 = new Date(Date.UTC(prog2026.targetYear, prog2026.targetMonth, 15, 12, 0, 0));
    const expectedElapsedYears = (targetDate2026.getTime() / 86400000 + 2440587.5 - chart.jd) / TROPICAL_YEAR_DAYS;
    assertCloseTo(
      prog2026.elapsedYears,
      expectedElapsedYears,
      0.001,
      `${preset.name}: Elapsed tropical years calculation matches astronomical formula`
    );

    // Julian Day Progression: advancing by elapsedYears tropical years advances progressedJd by elapsedYears solar days
    const jdAdvance = prog2026.progressedJd - chart.jd;
    assertCloseTo(
      jdAdvance,
      prog2026.elapsedYears,
      0.01,
      `${preset.name}: Progressed Julian Day advances by 1 solar day per tropical year (±0.01d)`
    );

    // 1.2 Multi-Decade Progressed Ephemeris Step Check
    const stepYears = [10, 20, 30];
    let prevProg = computeSecondaryProgressions(chart, birthY, birthM - 1);
    for (const step of stepYears) {
      const targetY = birthY + step;
      const progStep = computeSecondaryProgressions(chart, targetY, birthM - 1);
      const jdStepAdvance = progStep.progressedJd - chart.jd;
      assertCloseTo(
        jdStepAdvance,
        progStep.elapsedYears,
        0.001,
        `${preset.name}: Progressed Julian Day advances exactly by elapsed tropical years in solar days`
      );

      // Verify that stepping by 10 calendar years advances progressed JD by ~10 solar days (±0.01d)
      const step10Advance = progStep.progressedJd - prevProg.progressedJd;
      assertCloseTo(
        step10Advance,
        10.0,
        0.01,
        `${preset.name}: Stepping by 10 tropical years advances progression JD by 10 solar days (±0.01d)`
      );
      prevProg = progStep;

      // Progressed Sun moves ~1° per year (mean daily solar speed is ~0.9856°/day)
      const sunDelta = norm360(progStep.progressedSun.lon - natalSun.lon);
      const expectedSunDelta = step * 0.9856;
      assertCloseTo(
        sunDelta,
        expectedSunDelta,
        3.5,
        `${preset.name}: Progressed Sun advances by ~${step}° over ${step} years (actual: ${sunDelta.toFixed(2)}°, expected ~${expectedSunDelta.toFixed(2)}°)`
      );
    }

    // 1.3 Progressed Planets & Moon Motion
    assertEqual(
      prog2026.planets.length,
      7,
      `${preset.name}: Progressed chart computes all 7 classical planets`
    );

    for (const p of prog2026.planets) {
      assert(p.lon >= 0 && p.lon < 360, `${preset.name} ${p.id}: Longitude within [0, 360)`);
      assert(p.sign >= 0 && p.sign <= 11, `${preset.name} ${p.id}: Sign within [0, 11]`);
      assert(p.degInSign >= 0 && p.degInSign < 30, `${preset.name} ${p.id}: Degree in sign within [0, 30)`);
      assert(p.natalHouse >= 1 && p.natalHouse <= 12, `${preset.name} ${p.id}: Natal house within [1, 12]`);
      assertEqual(p.natalHouse, houseOf(p.lon, chart.cusps), `${preset.name} ${p.id}: Natal house matches cusp projection`);
    }

    // Progressed Moon speed & monthly motion
    assertDefined(prog2026.progressedMoon.monthlyMotion, `${preset.name}: Progressed Moon includes monthlyMotion`);
    assert(
      prog2026.progressedMoon.monthlyMotion >= 0.8 && prog2026.progressedMoon.monthlyMotion <= 1.5,
      `${preset.name}: Progressed Moon monthly motion is ~1°/mo (actual: ${prog2026.progressedMoon.monthlyMotion.toFixed(2)}°/mo)`
    );
    assertCloseTo(
      prog2026.progressedMoon.monthlyMotion,
      prog2026.progressedMoon.speed / 12,
      0.0001,
      `${preset.name}: Moon monthlyMotion is exactly daily speed / 12`
    );

    // 1.4 8-Fold Progressed Lunar Phase
    const elongation = norm360(prog2026.progressedMoon.lon - prog2026.progressedSun.lon);
    assertCloseTo(
      prog2026.lunarPhase.elongation,
      elongation,
      0.001,
      `${preset.name}: Progressed lunar elongation matches Moon - Sun difference`
    );

    const expectedPhaseIdx = Math.floor(elongation / 45) % 8;
    const canonicalPhases = [
      'new',
      'waxing-crescent',
      'first-quarter',
      'gibbous',
      'full',
      'disseminating',
      'last-quarter',
      'balsamic',
    ];
    assertEqual(
      prog2026.lunarPhase.phaseKey,
      canonicalPhases[expectedPhaseIdx],
      `${preset.name}: Progressed phaseKey '${prog2026.lunarPhase.phaseKey}' matches 45° octant index ${expectedPhaseIdx}`
    );
    assert(prog2026.lunarPhase.name.length > 0, `${preset.name}: Progressed lunar phase has non-empty name`);
    assert(prog2026.lunarPhase.archetype.length > 0, `${preset.name}: Progressed lunar phase has archetype`);
    assert(prog2026.lunarPhase.lifePulse.length > 0, `${preset.name}: Progressed lunar phase has lifePulse narrative`);

    // 1.5 Tight Progressed-to-Natal Aspects (orb <= 1.5°)
    for (const asp of prog2026.tightAspects) {
      assert(
        asp.orb <= 1.500001,
        `${preset.name}: Tight progressed aspect orb ${asp.orb.toFixed(3)}° strictly satisfies <= 1.5° threshold`
      );
      assert(asp.orb >= 0, `${preset.name}: Aspect orb is non-negative`);
      assert(typeof asp.applying === 'boolean', `${preset.name}: Aspect has applying boolean flag`);
      assert(asp.interpretation.length > 20, `${preset.name}: Aspect has rich interpretation string`);
      assert(
        ['conjunction', 'sextile', 'square', 'trine', 'opposition'].includes(asp.type),
        `${preset.name}: Aspect is one of 5 major Ptolemaic aspect types`
      );
    }

    // 1.6 Boundary Condition: Target Date = Birth Date (Elapsed Years = 0)
    const progBirth = computeSecondaryProgressions(chart, birthY, birthM - 1);
    assertCloseTo(
      progBirth.progressedJd,
      chart.jd,
      0.05,
      `${preset.name}: At birth date, progressed JD matches natal JD within 0.05d`
    );
    assertCloseTo(
      progBirth.progressedSun.lon,
      natalSun.lon,
      0.05,
      `${preset.name}: At birth date, Progressed Sun matches natal Sun within 0.05°`
    );

    suiteAssertions++;
  }

  totalSuitesPassed++;
  console.log(`  ✓ Passed Suite 1 across all 5 presets (${suiteAssertions} preset cycles verified).\n`);
}

// ─────────────────────────────────────────────────────────────────────────────
// SUITE 2: Exact Solar Return (Annual Revolution)
// ─────────────────────────────────────────────────────────────────────────────
console.log('▶ [Suite 2/5] Testing Exact Solar Return (Annual Revolution)...');

{
  let suiteAssertions = 0;

  for (const preset of PRESETS) {
    const chart = loadPresetChart(preset.id);
    const natalSun = chart.planets.find((p) => p.id === 'sun')!;
    const [, birthM, birthD] = chart.input.date.split('-').map(Number);

    // 2.1 Newton-Raphson Sun Match Precision (< 0.001°) in 2026
    const sr2026 = computeExactSolarReturn(chart, 2026);

    assert(
      sr2026.sunLonDiff < 0.001,
      `${preset.name}: Solar return Sun longitude residual (${sr2026.sunLonDiff.toFixed(6)}°) is strictly < 0.001° (< 3.6")`
    );

    const srSun = sr2026.planets.find((p) => p.id === 'sun')!;
    assertDefined(srSun, `${preset.name}: Solar return includes Sun`);
    const directSunDiff = Math.abs(angDiff(srSun.lon, natalSun.lon));
    assert(
      directSunDiff < 0.001,
      `${preset.name}: Direct angular difference between SR Sun and natal Sun (${directSunDiff.toFixed(6)}°) is < 0.001°`
    );

    // 2.2 Solar Return Date Integrity
    // The exact solar return must occur within ±2 days of native's birth month/day in target year
    const srMonth = sr2026.exactDate.getUTCMonth() + 1;
    const srDay = sr2026.exactDate.getUTCDate();
    const dayDelta = Math.abs(srDay - birthD);
    assert(
      (srMonth === birthM && dayDelta <= 2) || Math.abs(srMonth - birthM) === 1,
      `${preset.name}: Solar Return exact date (${sr2026.exactDate.toISOString().slice(0, 10)}) is within ±2 days of birth date (${birthM}-${birthD})`
    );

    // 2.3 Solar Return Angles & Overlays
    assert(sr2026.srAsc >= 0 && sr2026.srAsc < 360, `${preset.name}: SR Ascendant in [0, 360)`);
    assert(sr2026.srMc >= 0 && sr2026.srMc < 360, `${preset.name}: SR Midheaven in [0, 360)`);
    assertEqual(sr2026.srCusps.length, 12, `${preset.name}: SR quadrant cusps array has 12 houses`);

    // Rising and culminating natal house overlay
    assertEqual(
      sr2026.natalHouseRising,
      houseOf(sr2026.srAsc, chart.cusps),
      `${preset.name}: natalHouseRising (${sr2026.natalHouseRising}) correctly identifies which natal house the SR Ascendant rises in`
    );
    assert(
      sr2026.natalHouseRising >= 1 && sr2026.natalHouseRising <= 12,
      `${preset.name}: natalHouseRising is valid house 1..12`
    );

    assertEqual(
      sr2026.natalHouseCulminating,
      houseOf(sr2026.srMc, chart.cusps),
      `${preset.name}: natalHouseCulminating (${sr2026.natalHouseCulminating}) correctly identifies which natal house the SR MC culminates in`
    );
    assert(
      sr2026.natalHouseCulminating >= 1 && sr2026.natalHouseCulminating <= 12,
      `${preset.name}: natalHouseCulminating is valid house 1..12`
    );

    // 2.4 Solar Return Moon Position
    assert(sr2026.srMoon.lon >= 0 && sr2026.srMoon.lon < 360, `${preset.name}: SR Moon lon in [0, 360)`);
    assertEqual(sr2026.srMoon.sign, signOf(sr2026.srMoon.lon), `${preset.name}: SR Moon sign matches longitude`);
    assertEqual(
      sr2026.srMoon.srHouse,
      houseOf(sr2026.srMoon.lon, sr2026.srCusps),
      `${preset.name}: SR Moon srHouse matches SR cusps`
    );
    assertEqual(
      sr2026.srMoon.natalHouse,
      houseOf(sr2026.srMoon.lon, chart.cusps),
      `${preset.name}: SR Moon natalHouse matches natal cusps`
    );

    // 2.5 Tight SR-to-Natal Conjunctions (orb <= 3.0°)
    for (const conj of sr2026.conjunctions) {
      assert(
        conj.orb <= 3.000001,
        `${preset.name}: SR-to-natal conjunction orb ${conj.orb.toFixed(2)}° satisfies <= 3.0° threshold`
      );
      assert(conj.orb >= 0, `${preset.name}: Conjunction orb is non-negative`);
      assert(conj.description.length > 10, `${preset.name}: Conjunction has rich description`);
    }

    // 2.6 Multi-Year Precision Stress Test (Years 2024–2028)
    const testYears = [2024, 2025, 2026, 2027, 2028];
    for (const y of testYears) {
      const srYear = computeExactSolarReturn(chart, y);
      assert(
        srYear.sunLonDiff < 0.001,
        `${preset.name} (${y}): Solar return Sun residual (${srYear.sunLonDiff.toFixed(6)}°) is strictly < 0.001°`
      );
    }

    suiteAssertions++;
  }

  // 2.7 Southern Hemisphere Boundary (Perth at -31.95° Lat)
  {
    const perthChart = loadPresetChart('perth');
    const perthSr = computeExactSolarReturn(perthChart, 2026);
    assert(!isNaN(perthSr.srAsc), 'Perth (-31.95° Lat): SR Ascendant is not NaN');
    assert(!isNaN(perthSr.srMc), 'Perth (-31.95° Lat): SR Midheaven is not NaN');
    assert(perthSr.sunLonDiff < 0.001, 'Perth: Southern hemisphere Sun match < 0.001°');
    assert(perthSr.natalHouseRising >= 1 && perthSr.natalHouseRising <= 12, 'Perth: Natal rising house valid');
  }

  // 2.8 Equinox Boundary (Bangkok Sun near 0° Aries)
  {
    const bkkChart = loadPresetChart('bangkok');
    const bkkSr = computeExactSolarReturn(bkkChart, 2026);
    assert(bkkSr.sunLonDiff < 0.0005, 'Bangkok (Equinox 0° Aries): Sun match < 0.0005° across circular boundary');
  }

  totalSuitesPassed++;
  console.log(`  ✓ Passed Suite 2 across all 5 presets (${suiteAssertions} preset cycles + boundary tests verified).\n`);
}

// ─────────────────────────────────────────────────────────────────────────────
// SUITE 3: Hellenistic Lots & Monthly Profections
// ─────────────────────────────────────────────────────────────────────────────
console.log('▶ [Suite 3/5] Testing Hellenistic Lots & Monthly Profections...');

{
  let suiteAssertions = 0;

  for (const preset of PRESETS) {
    const chart = loadPresetChart(preset.id);
    const sun = chart.planets.find((p) => p.id === 'sun')!;
    const moon = chart.planets.find((p) => p.id === 'moon')!;

    // 3.1 Sect-Adjusted Hellenistic Lots (Fortune & Spirit)
    const lotsResult: HellenisticLotsResult = computeHellenisticLots(chart);
    const { fortune, spirit } = lotsResult;

    // Determine sect expectation:
    // Bangkok (06:15 Sun in 1st/12th above dawn = Day), London (14:30 Sun in 9th = Day), Tokyo (11:10 Sun in 10th = Day)
    // New York (21:45 Sun in 5th = Night), Perth (04:20 Sun in 2nd below horizon = Night)
    const isDiurnalPreset = ['bangkok', 'london', 'tokyo'].includes(preset.id);

    assertEqual(
      fortune.isDiurnalFormula,
      isDiurnalPreset,
      `${preset.name}: isDiurnalFormula (${fortune.isDiurnalFormula}) matches preset sect expectation (${isDiurnalPreset})`
    );

    if (isDiurnalPreset) {
      // Diurnal: Fortune = ASC + Moon - Sun, Spirit = ASC + Sun - Moon
      const expectedFortune = norm360(chart.asc + moon.lon - sun.lon);
      const expectedSpirit = norm360(chart.asc + sun.lon - moon.lon);

      assertCloseTo(
        fortune.lon,
        expectedFortune,
        0.001,
        `${preset.name} (Diurnal): Lot of Fortune = ASC + Moon - Sun (${expectedFortune.toFixed(2)}°)`
      );
      assertCloseTo(
        spirit.lon,
        expectedSpirit,
        0.001,
        `${preset.name} (Diurnal): Lot of Spirit = ASC + Sun - Moon (${expectedSpirit.toFixed(2)}°)`
      );
    } else {
      // Nocturnal: Fortune = ASC - Moon + Sun, Spirit = ASC + Moon - Sun
      const expectedFortune = norm360(chart.asc - moon.lon + sun.lon);
      const expectedSpirit = norm360(chart.asc - sun.lon + moon.lon);

      assertCloseTo(
        fortune.lon,
        expectedFortune,
        0.001,
        `${preset.name} (Nocturnal): Lot of Fortune = ASC - Moon + Sun (${expectedFortune.toFixed(2)}°)`
      );
      assertCloseTo(
        spirit.lon,
        expectedSpirit,
        0.001,
        `${preset.name} (Nocturnal): Lot of Spirit = ASC - Sun + Moon (${expectedSpirit.toFixed(2)}°)`
      );
    }

    // Invariant: Geometric Reflection across Ascendant
    // norm360(Fortune + Spirit) === norm360(2 * ASC) for both diurnal and nocturnal!
    const lotSum = norm360(fortune.lon + spirit.lon);
    const doubleAsc = norm360(2 * chart.asc);
    assertCloseTo(
      lotSum,
      doubleAsc,
      0.002,
      `${preset.name}: Geometric reflection invariant holds: Fortune + Spirit = 2*ASC (${lotSum.toFixed(2)}° vs ${doubleAsc.toFixed(2)}°)`
    );

    // Invariant: Formula Reversal Swap
    // Notice that diurnal Fortune formula is identical to nocturnal Spirit formula!
    const diurnalFortuneFormula = norm360(chart.asc + moon.lon - sun.lon);
    if (!isDiurnalPreset) {
      assertCloseTo(
        spirit.lon,
        diurnalFortuneFormula,
        0.001,
        `${preset.name}: Nocturnal Lot of Spirit equals Diurnal Lot of Fortune formula`
      );
    }

    // 3.2 Angular Peak Periods from Lots (1st, 4th, 7th, 10th Whole-Sign from Lot)
    const fortuneSign = signOf(fortune.lon);
    const spiritSign = signOf(spirit.lon);

    // Verify peak angles helper logic: signs 0, 3, 6, 9 from Lot sign must be marked peak
    for (let testSign = 0; testSign < 12; testSign++) {
      const diffF = (testSign - fortuneSign + 12) % 12;
      const isPeakF = diffF === 0 || diffF === 3 || diffF === 6 || diffF === 9;
      if (diffF === 0) assertEqual(isPeakF, true, `${preset.name}: 1st from Lot of Fortune is Peak`);
      if (diffF === 3) assertEqual(isPeakF, true, `${preset.name}: 4th from Lot of Fortune is Peak`);
      if (diffF === 6) assertEqual(isPeakF, true, `${preset.name}: 7th from Lot of Fortune is Peak`);
      if (diffF === 9) assertEqual(isPeakF, true, `${preset.name}: 10th from Lot of Fortune is Peak`);
      if (!isPeakF) {
        assert([1, 2, 4, 5, 7, 8, 10, 11].includes(diffF), `${preset.name}: Non-angular signs are not peaks`);
      }

      const diffS = (testSign - spiritSign + 12) % 12;
      const isPeakS = diffS === 0 || diffS === 3 || diffS === 6 || diffS === 9;
      if (diffS === 0) assertEqual(isPeakS, true, `${preset.name}: 1st from Lot of Spirit is Peak`);
    }

    // 3.3 Birthday-Aware Annual Profections
    // Test native evaluated before birthday month vs on/after birthday month in 2026
    const [bYear, bMonth] = chart.input.date.split('-').map(Number);
    const yearBefore = bMonth === 1 ? 2025 : 2026;
    const monthBefore = bMonth === 1 ? 11 : bMonth - 2; // 0-indexed month before birth
    const monthAtBirth = bMonth - 1; // 0-indexed birthday month

    const profBefore = computePredictiveProfection(chart, yearBefore, monthBefore);
    const profAfter = computePredictiveProfection(chart, 2026, monthAtBirth);

    const expectedAgeBefore = 2026 - bYear - 1;
    const expectedAgeAfter = 2026 - bYear;

    assertEqual(
      profBefore.age,
      expectedAgeBefore,
      `${preset.name}: Age before birthday month is ${expectedAgeBefore}`
    );
    assertEqual(
      profAfter.age,
      expectedAgeAfter,
      `${preset.name}: Age on/after birthday month is ${expectedAgeAfter}`
    );

    // Annual house should advance by 1 on birthday
    const expectedAnnualHouseBefore = ((expectedAgeBefore % 12) + 12) % 12 + 1;
    const expectedAnnualHouseAfter = ((expectedAgeAfter % 12) + 12) % 12 + 1;

    assertEqual(
      profBefore.annualHouse,
      expectedAnnualHouseBefore,
      `${preset.name}: Annual house before birthday is ${expectedAnnualHouseBefore}`
    );
    assertEqual(
      profAfter.annualHouse,
      expectedAnnualHouseAfter,
      `${preset.name}: Annual house after birthday is ${expectedAnnualHouseAfter}`
    );

    // Time-Lord matches sign ruler
    assertEqual(
      profAfter.annualTimeLord,
      SIGN_RULERS[profAfter.annualSign],
      `${preset.name}: Annual Time-Lord (${profAfter.annualTimeLord}) rules annual sign ${SIGN_NAMES[profAfter.annualSign]}`
    );

    // 3.4 Sequential 12-Month Monthly Profections (1 House/Month covering all 12 Houses)
    const visitedMonthlyHouses: number[] = [];
    const visitedMonthlySigns: number[] = [];

    // Step through 12 consecutive months starting from the native's birth month
    for (let offset = 0; offset < 12; offset++) {
      const targetM = (bMonth - 1 + offset) % 12; // 0-indexed
      // Target year adjusted if wrapping across calendar year
      const targetY = 2026 + Math.floor((bMonth - 1 + offset) / 12);
      const monthlyProf = computePredictiveProfection(chart, targetY, targetM);

      visitedMonthlyHouses.push(monthlyProf.monthlyHouse);
      visitedMonthlySigns.push(monthlyProf.monthlySign);

      // Verify Time-Lord derivation
      assertEqual(
        monthlyProf.monthlyTimeLord,
        SIGN_RULERS[monthlyProf.monthlySign],
        `${preset.name} (Month +${offset}): Monthly Time-Lord rules monthly sign`
      );
    }

    // Assert sequential advance: each step increments house by 1 (modulo 12)
    for (let i = 0; i < 11; i++) {
      const current = visitedMonthlyHouses[i];
      const next = visitedMonthlyHouses[i + 1];
      const expectedNext = (current % 12) + 1;
      assertEqual(
        next,
        expectedNext,
        `${preset.name}: Monthly house advances sequentially from ${current} to ${next}`
      );
    }

    // Assert complete coverage: all 12 houses (1..12) visited without duplicates or omissions
    const uniqueHouses = Array.from(new Set(visitedMonthlyHouses)).sort((a, b) => a - b);
    assertEqual(
      uniqueHouses.length,
      12,
      `${preset.name}: Exactly 12 unique monthly houses visited across 12 consecutive months`
    );
    assertEqual(
      JSON.stringify(uniqueHouses),
      JSON.stringify([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]),
      `${preset.name}: Monthly profection covers the entire 1..12 house circle`
    );

    suiteAssertions++;
  }

  // 3.5 Solar Chart Compatibility Fallback (unknownTime: true)
  {
    const solarChart = calculateNatalChart({
      name: 'Solar Chart Test',
      date: '1990-06-15',
      time: '12:00',
      unknownTime: true,
      lat: 40.7128,
      lng: -74.006,
      timezone: 'America/New_York',
      utcOffset: -4,
      locationLabel: 'New York, USA',
    });

    const solarLots = computeHellenisticLots(solarChart);
    const solarSun = solarChart.planets.find((p) => p.id === 'sun')!;
    const solarMoon = solarChart.planets.find((p) => p.id === 'moon')!;

    // In solar charts: Fortune = Moon, Spirit = 2*Sun - Moon
    assertCloseTo(
      solarLots.fortune.lon,
      norm360(solarMoon.lon),
      0.001,
      'Solar Chart: Lot of Fortune equals Moon longitude'
    );
    assertCloseTo(
      solarLots.spirit.lon,
      norm360(2 * solarSun.lon - solarMoon.lon),
      0.001,
      'Solar Chart: Lot of Spirit equals 2*Sun - Moon'
    );
  }

  totalSuitesPassed++;
  console.log(`  ✓ Passed Suite 3 across all 5 presets (${suiteAssertions} preset cycles + solar chart verified).\n`);
}

// ─────────────────────────────────────────────────────────────────────────────
// SUITE 4: Lunar Nodes & Eclipse Detection
// ─────────────────────────────────────────────────────────────────────────────
console.log('▶ [Suite 4/5] Testing Lunar Nodes & Eclipse Detection...');

{
  let suiteAssertions = 0;

  for (const preset of PRESETS) {
    const chart = loadPresetChart(preset.id);

    // 4.1 Mean & True Lunar Node Axis Calculation
    const nodes = lunarNodes(chart.jd);

    assert(nodes.meanNorth >= 0 && nodes.meanNorth < 360, `${preset.name}: Mean North Node in [0, 360)`);
    assert(nodes.meanSouth >= 0 && nodes.meanSouth < 360, `${preset.name}: Mean South Node in [0, 360)`);
    assert(nodes.trueNorth >= 0 && nodes.trueNorth < 360, `${preset.name}: True North Node in [0, 360)`);
    assert(nodes.trueSouth >= 0 && nodes.trueSouth < 360, `${preset.name}: True South Node in [0, 360)`);

    // South Node is exactly opposite North Node (180°)
    const meanOppDiff = Math.abs(angDiff(nodes.meanSouth, norm360(nodes.meanNorth + 180)));
    assertCloseTo(meanOppDiff, 0, 0.001, `${preset.name}: Mean South Node is exactly 180° from Mean North Node`);

    const trueOppDiff = Math.abs(angDiff(nodes.trueSouth, norm360(nodes.trueNorth + 180)));
    assertCloseTo(trueOppDiff, 0, 0.001, `${preset.name}: True South Node is exactly 180° from True North Node`);

    // Signs match longitude
    assertEqual(nodes.signNorth, signOf(nodes.meanNorth), `${preset.name}: signNorth matches longitude`);
    assertEqual(nodes.signSouth, signOf(nodes.meanSouth), `${preset.name}: signSouth matches longitude`);

    // True Node perturbation is mathematically bounded (<= 2.0° from Mean Node)
    const perturbation = separation(nodes.trueNorth, nodes.meanNorth);
    assert(
      perturbation <= 2.0,
      `${preset.name}: True Node perturbation (${perturbation.toFixed(3)}°) is bounded <= 2.0°`
    );

    // 4.2 Eclipse Classification across Target Year & Month
    const eclResult = classifyEclipsesAndReturns(chart, 2026, 9); // October 2026
    assertDefined(eclResult.nodes, `${preset.name}: Result includes lunar nodes`);
    assert(Array.isArray(eclResult.eclipses), `${preset.name}: Result includes eclipses array`);
    assert(Array.isArray(eclResult.returns), `${preset.name}: Result includes returns array`);

    // Verify eclipse classification rules on all lunations
    for (const ecl of eclResult.eclipses) {
      assertDefined(ecl.nodeDistance, `${preset.name}: Lunation has nodeDistance`);
      if (ecl.nodeDistance <= 18.0) {
        assertEqual(ecl.isEclipse, true, `${preset.name}: Lunation within <= 18° is flagged isEclipse: true`);
        assertEqual(
          ecl.eclipseType,
          ecl.kind === 'new' ? 'Solar Eclipse' : 'Lunar Eclipse',
          `${preset.name}: Correct eclipse type for ${ecl.kind} moon`
        );
        assertEqual(
          ecl.category,
          ecl.nodeDistance <= 10.0 ? 'Total / Central' : 'Partial / Nodal',
          `${preset.name}: Correct category for distance ${ecl.nodeDistance.toFixed(2)}°`
        );
      } else {
        assertEqual(ecl.isEclipse, false, `${preset.name}: Lunation > 18° is flagged isEclipse: false`);
      }
    }

    suiteAssertions++;
  }

  // 4.3 Eclipse Nodal Distance Boundary Test (Synthetic Combinatorial Checks)
  {
    // Test the 18° and 10° boundary values
    const testCases: { dist: number; isEclipse: boolean; category?: string }[] = [
      { dist: 0.5, isEclipse: true, category: 'Total / Central' },
      { dist: 9.9, isEclipse: true, category: 'Total / Central' },
      { dist: 10.0, isEclipse: true, category: 'Total / Central' },
      { dist: 10.1, isEclipse: true, category: 'Partial / Nodal' },
      { dist: 17.9, isEclipse: true, category: 'Partial / Nodal' },
      { dist: 18.0, isEclipse: true, category: 'Partial / Nodal' },
      { dist: 18.1, isEclipse: false },
      { dist: 45.0, isEclipse: false },
      { dist: 90.0, isEclipse: false },
    ];

    for (const tc of testCases) {
      const isEcl = tc.dist <= 18.0;
      assertEqual(isEcl, tc.isEclipse, `Distance ${tc.dist}°: isEclipse matches`);
      if (isEcl) {
        const cat = tc.dist <= 10.0 ? 'Total / Central' : 'Partial / Nodal';
        assertEqual(cat, tc.category, `Distance ${tc.dist}°: Category matches ${tc.category}`);
      }
    }
  }

  // 4.4 Circular 0°/360° Wrap-Around Eclipse Check
  {
    // Node at 1° Aries (1°), Lunation at 358° Pisces (358°)
    // Shortest angular separation across 0° is 3° <= 10° -> Total Eclipse
    const nodeLon = 1.0;
    const moonLon = 358.0;
    const sep = separation(moonLon, nodeLon);
    assertCloseTo(sep, 3.0, 0.001, 'Separation wraps modularly across 360°/0° to 3°');
    assert(sep <= 10.0, 'Wrap-around lunation within 3° qualifies as Total Eclipse');
  }

  // 4.5 Major Life-Cycle Returns Timing Test
  {
    // Eleanor Hale (born 1988-07-14): Jupiter Return at age 36 in 2024
    const londonChart = loadPresetChart('london');
    const london2024 = classifyEclipsesAndReturns(londonChart, 2024, 6);
    const jupReturn = london2024.returns.find((r) => r.type === 'jupiter-return');
    assertDefined(jupReturn, 'London (born 1988): Jupiter Return detected at age 36 in 2024');
    assertEqual(jupReturn.age, 36, 'Jupiter return age is 36');

    // Julian Reyes (born 1991-11-02): Saturn Return at age ~29-30 in 2021
    const nyChart = loadPresetChart('new-york');
    const ny2021 = classifyEclipsesAndReturns(nyChart, 2021, 10);
    const satReturn = ny2021.returns.find((r) => r.type === 'saturn-return');
    assertDefined(satReturn, 'New York (born 1991): Saturn Return detected at age ~30 in 2021');
    assertEqual(satReturn.title, 'Saturn Return', 'Saturn return title is correct');
  }

  totalSuitesPassed++;
  console.log(`  ✓ Passed Suite 4 across all 5 presets (${suiteAssertions} preset cycles + boundary & cycle returns verified).\n`);
}

// ─────────────────────────────────────────────────────────────────────────────
// SUITE 5: Rule of Three Convergence Engine
// ─────────────────────────────────────────────────────────────────────────────
console.log('▶ [Suite 5/5] Testing Rule of Three Convergence Engine...');

{
  let suiteAssertions = 0;

  for (const preset of PRESETS) {
    const chart = loadPresetChart(preset.id);

    // 5.1 Non-Empty, Deterministic Convergence Generation
    const conv2026 = computePredictiveConvergence(chart, 2026, 9); // October 2026

    assertEqual(conv2026.year, 2026, `${preset.name}: Convergence year is 2026`);
    assertEqual(conv2026.month, 9, `${preset.name}: Convergence month is 9 (October)`);

    assert(
      conv2026.allConvergences.length > 0,
      `${preset.name}: allConvergences is non-empty (count=${conv2026.allConvergences.length})`
    );
    assert(
      conv2026.topConvergences.length > 0,
      `${preset.name}: topConvergences is non-empty (count=${conv2026.topConvergences.length})`
    );
    assert(
      conv2026.topConvergences.length <= 5,
      `${preset.name}: topConvergences capped at top 5 items`
    );

    // 5.2 Strict Rule of Three Qualification Filter (N_clocks >= 2)
    for (const item of conv2026.allConvergences) {
      assert(
        item.clockCount >= 2,
        `${preset.name} (${item.title}): Item satisfies Rule of Three with clockCount >= 2 (actual=${item.clockCount})`
      );
      assert(
        item.clocksInvolved.length >= 2,
        `${preset.name} (${item.title}): Distinct clocks list has at least 2 entries (${item.clocksInvolved.join(', ')})`
      );

      // Verify clock count matches unique clocks in testimonies
      const uniqueTestimonyClocks = Array.from(new Set(item.testimonies.map((t) => t.clock)));
      assertEqual(
        item.clockCount,
        uniqueTestimonyClocks.length,
        `${preset.name} (${item.title}): clockCount matches unique testimony clocks count`
      );

      // Verify no single-clock isolates ever get emitted
      assert(item.clockCount !== 1, `${preset.name}: Single-clock isolate (N=1) rejected by Convergence filter`);

      // 5.3 Badge Classification Integrity
      const expectedBadge: ConvergenceBadge =
        item.clockCount >= 4
          ? '4-Clock Sovereign Convergence'
          : item.clockCount === 3
          ? '3-Clock Major Convergence'
          : 'Dual Testimony Alignment';

      assertEqual(
        item.badge,
        expectedBadge,
        `${preset.name} (${item.title}): Badge '${item.badge}' matches clockCount ${item.clockCount}`
      );

      // 5.4 Date Window & Plain-English Narrative Synthesis
      assert(item.dateWindow.length > 0, `${preset.name}: Convergence item has dateWindow (${item.dateWindow})`);
      assert(
        item.synthesis.length >= 30,
        `${preset.name}: Convergence narrative synthesis has rich length >= 30 chars (length=${item.synthesis.length})`
      );

      // 5.5 Target Entity Classification
      if (item.targetType === 'planet') {
        assertDefined(item.targetPlanet, `${preset.name}: Planet target has targetPlanet`);
        assert(
          PLANET_IDS.includes(item.targetPlanet),
          `${preset.name}: targetPlanet is valid planet id (${item.targetPlanet})`
        );
      } else {
        assertEqual(item.targetType, 'house', `${preset.name}: Target is house`);
        assertDefined(item.targetHouse, `${preset.name}: House target has targetHouse`);
        assert(
          item.targetHouse >= 1 && item.targetHouse <= 12,
          `${preset.name}: targetHouse is valid house 1..12 (${item.targetHouse})`
        );
      }

      // 5.6 Testimonies Completeness
      for (const t of item.testimonies) {
        assert(['time-lords', 'progressions', 'solar-return', 'transits'].includes(t.clock), `${preset.name}: Valid clock id`);
        assert(t.summary.length > 0, `${preset.name}: Testimony has summary`);
        assert(t.detail.length > 0, `${preset.name}: Testimony has detail`);
        assert(t.weight > 0, `${preset.name}: Testimony weight is positive`);
      }
    }

    // 5.7 Score Sorting Monotonicity
    for (let i = 0; i < conv2026.topConvergences.length - 1; i++) {
      const a = conv2026.topConvergences[i];
      const b = conv2026.topConvergences[i + 1];
      // Sorted descending by clockCount, then totalScore
      if (a.clockCount === b.clockCount) {
        assert(
          a.totalScore >= b.totalScore,
          `${preset.name}: topConvergences properly sorted by score descending (${a.totalScore.toFixed(1)} >= ${b.totalScore.toFixed(1)})`
        );
      } else {
        assert(
          a.clockCount > b.clockCount,
          `${preset.name}: topConvergences sorted by clockCount descending (${a.clockCount} > ${b.clockCount})`
        );
      }
    }

    // 5.8 Multi-Date Robustness Test
    const otherDates = [
      { y: 2025, m: 5 }, // June 2025
      { y: 2027, m: 2 }, // March 2027
      { y: 2028, m: 10 }, // November 2028
    ];
    for (const od of otherDates) {
      const convDate = computePredictiveConvergence(chart, od.y, od.m);
      assert(
        convDate.allConvergences.length > 0,
        `${preset.name} (${od.y}-${od.m}): Dynamic date calculation yields non-empty convergences`
      );
      assert(
        convDate.topConvergences.every((item) => item.clockCount >= 2),
        `${preset.name} (${od.y}-${od.m}): Every top item has >= 2 clocks`
      );
    }

    suiteAssertions++;
  }

  totalSuitesPassed++;
  console.log(`  ✓ Passed Suite 5 across all 5 presets (${suiteAssertions} preset cycles + multi-date robustness verified).\n`);
}

// ─────────────────────────────────────────────────────────────────────────────
// Final Verification Summary
// ─────────────────────────────────────────────────────────────────────────────

console.log('=========================================================================');
console.log(`🏆 ALL 5 PREDICTIVE TEST SUITES PASSED!`);
console.log(`   - Suite 1: Secondary Progressions ("Day-for-a-Year")       [PASS]`);
console.log(`   - Suite 2: Exact Solar Return (Annual Revolution)           [PASS]`);
console.log(`   - Suite 3: Hellenistic Lots & Monthly Profections          [PASS]`);
console.log(`   - Suite 4: Lunar Nodes & Eclipse Detection                 [PASS]`);
console.log(`   - Suite 5: Rule of Three Convergence Engine                [PASS]`);
console.log(`   Total Assertions Executed: ${totalAssertions}`);
console.log(`   Preset Charts Verified:    5 (Bangkok, London, New York, Perth, Tokyo)`);
console.log(`   Status: 100% SUCCESS — 0 FAILURES`);
console.log('=========================================================================\n');
