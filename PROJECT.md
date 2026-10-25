# Project: ORBIS Predictive Astrology System Upgrade

## Architecture
ORBIS is an interactive astrology web application built on Astro and React 19, operating on pure TypeScript astronomical calculation engines with zero external ephemeris packages.
The predictive upgrade establishes a multi-layer architecture:
- **Calculation Layer (`src/lib/predictiveEngine.ts`, `src/lib/astroEngine.ts`)**:
  - Implements the Four-Clock Deterministic Predictive Astrology Engine:
    1. Hellenistic Lots (Fortune & Spirit with diurnal/nocturnal formula reversal) and birthday-aware Annual + sequential Monthly Profections.
    2. Secondary Progressions ("Day-for-a-Year" Julian Day ephemeris, progressed Sun/Moon coordinates, 8-fold progressed lunar phase, and tight <=1.5° aspects).
    3. Exact Solar Return annual revolution solver (Newton-Raphson Sun longitude match <0.001°, SR Asc/MC angles, rising/culminating natal house overlays, and tight <=3.0° conjunctions).
    4. Lunar Nodes (Mean/True nodes), Eclipse classification (<=18° nodal proximity for New/Full Moons, <=10° total), and planetary return cycles (Saturn, Jupiter, Mars, Nodes).
  - Implements R2 "Rule of Three" Predictive Convergence Scoring: collects testimonies across all 4 clocks, clusters by target planet and house, enforces distinct clock threshold $N_{\text{clocks}} \ge 2$, computes weighted scores, assigns badges, and synthesizes plain-English explanations.
- **Synthesis Layer (`src/lib/astroSynthesis.ts`)**:
  - Enhances `synthesizeChart` and `calculateAnnualProfection` with dynamic year/month parameters and links into the predictive engine while maintaining 100% backward compatibility for existing synthesis suites.
- **Presentation & Interaction Layer (`src/components/OrbisApp.tsx`, `HoroscopeDashboard.tsx`, `OrbisAlignmentRemedies.tsx`)**:
  - Lifts temporal state (`targetYear`: 2024–2032, `targetMonth`: 0–11, default October 2026) to root.
  - Implements interactive Time-Machine Scrubber with month/year steppers, month pills, reset button, and live telemetry strip.
  - Renders dedicated predictive panels: Convergence Cards, Secondary Progressions HUD, Solar Return Annual Snapshot, Hellenistic Lots & Profection Clock, Eclipse & Return Badges.
  - Updates Section 04 Cosmic Remedies to dynamically synchronize with the active Time-Lord of the scrubbed date.
  - Maintains seamless bi-directional reactivity with global `selection` state across all sections and the Orbis SVG Wheel.
- **Testing & Verification Layer (`test_prediction.ts`, `TEST_INFRA.md`, `TEST_READY.md`)**:
  - Standalone automated test suite verifying all acceptance criteria across all 5 chart presets.
  - Validates production build (`astro check && astro build`) with 0 errors, 0 warnings, 0 hints.

## Code Layout
- `src/lib/astroEngine.ts`: Core Keplerian ephemeris, house calculations, aspects, transits, and lunar nodes export.
- `src/lib/predictiveEngine.ts`: Four-clock calculations, lots, profections, progressions, solar return, eclipse classification, and Rule of Three convergence engine.
- `src/lib/astroSynthesis.ts`: Sect, dignities, lunar phase, patterns, and profection synthesis.
- `src/lib/cities.ts`: Chart presets (Bangkok, London, New York, Perth, Tokyo).
- `src/components/OrbisApp.tsx`: App root, lifted temporal state (`targetYear`, `targetMonth`), global selection state, section composition.
- `src/components/HoroscopeDashboard.tsx`: Section 03 dashboard, Time-Machine Scrubber, Convergence panel, 4-clock HUD cards.
- `src/components/OrbisAlignmentRemedies.tsx`: Section 04 remedies, dynamic Time-Lord synchronization.
- `test_prediction.ts`: Automated E2E predictive test suite covering all acceptance criteria across all 5 presets.
- `TEST_INFRA.md`: E2E test suite architecture and coverage specification.
- `TEST_READY.md`: Signal publication when test suite is fully specified and ready.

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| 1 | Lot of Fortune Diurnal/Nocturnal Formula | Sect-adjusted Lot of Fortune: ASC + Moon - Sun (Day) vs ASC + Sun - Moon (Night) | M1 | Survey |
| 2 | Lot of Spirit Diurnal/Nocturnal Formula | Sect-adjusted Lot of Spirit: ASC + Sun - Moon (Day) vs ASC + Moon - Sun (Night) | M1 | Survey |
| 3 | Angular Peak Periods from Lots | 1st, 4th, 7th, 10th whole-sign signs from Lots identified as major peak periods | M1 | Survey |
| 4 | Birthday-Aware Annual Profections | Advances whole-sign house on native's birthday (age = targetYear - birthYear [- 1]) | M1 | Survey |
| 5 | Monthly Profections (1 House/Month) | Advances whole-sign house 1 house/month from birth month sequentially (1..12) | M1 | Survey |
| 6 | Day-for-a-Year Progression Ephemeris | Progresses chart Julian Day by 1 solar day per tropical year of life (±0.01d) | M1 | Survey |
| 7 | Progressed Sun & Moon Ephemeris | Computes Progressed Sun (~1°/yr) and Moon (~1°/mo) longitudes, signs, and houses | M1 | Survey |
| 8 | 8-Fold Progressed Lunar Phase | Elongation between Progressed Moon and Sun classified into 8 developmental phases | M1 | Survey |
| 9 | Tight Progressed-to-Natal Aspects | Ptolemaic aspects between progressed planets and natal points with orb <= 1.5° | M1 | Survey |
| 10 | Exact Solar Return Solver | Newton-Raphson solver matching natal Sun longitude within < 0.001° in target year | M1 | Survey |
| 11 | Solar Return Chart Angles & Overlays | SR Asc, SR MC, SR Moon, and rising/culminating natal house identification | M1 | Survey |
| 12 | Tight SR-to-Natal Conjunctions | Detects SR planets conjunct natal planets or angles within <= 3.0° orb | M1 | Survey |
| 13 | Mean & True Lunar Node Calculation | Computes Mean and True Lunar Node axis (North ☊ and South ☋) | M1 | Survey |
| 14 | Lunation & Eclipse Classification | Flags New/Full Moons within <= 18° of nodes as Eclipses (Total <=10°, Partial 10°–18°) | M1 | Survey |
| 15 | Life-Cycle Planetary Return Engine | Detects Saturn Return, Saturn Square/Opp, Jupiter Return, Nodal, and Mars Return | M1 | Survey |
| 16 | Multi-Clock Testimony Collector | Harvests predictive activations across all 4 clocks targeting planets and houses | M2 | Survey |
| 17 | Target Entity Clustering & Clock Deduplication | Clusters activations by target entity and counts distinct testifying clocks | M2 | Survey |
| 18 | Rule of Three Threshold Filter | Filters clusters requiring >= 2 distinct testifying clocks (rejects isolates) | M2 | Survey |
| 19 | Convergence Badge Classification | Assigns 4-Clock Sovereign, 3-Clock Major, and Dual Testimony badges | M2 | Survey |
| 20 | Predictive Convergence Scoring & Ranking | Computes quantitative score and sorts predictions descending | M2 | Survey |
| 21 | Date Window Resolution | Computes active month window and acute peak date ranges | M2 | Survey |
| 22 | Plain-English Narrative Synthesis | Synthesizes inter-clock testimonies into clear astrological explanations | M2 | Survey |
| 23 | Time-Machine Scrubber UI Controls | Interactive month/year steppers, month pills, year buttons, reset Oct 2026, telemetry | M3 | Survey |
| 24 | Dedicated Predictive Clocks HUD Grid | Dedicated cards for Convergence, Progressions, Solar Return, Lots, and Eclipses | M3 | Survey |
| 25 | Section 04 Dynamic Time-Lord Remedies | Synchronizes Remedy #3 to active Time-Lord of the selected target date | M3 | Survey |
| 26 | Bi-Directional Orbis Graph Selection Reactivity | Spotlights matching predictive testimonies; clicking cards inspects on wheel | M3 | Survey |
| 27 | E2E Test Suite (`test_prediction.ts`) | Automated tests for all 5 acceptance criteria across all 5 chart presets | M_TEST | Survey |
| 28 | Strict TypeScript & Production Build Cleanliness | Validates `astro check && astro build` with 0 errors, 0 warnings, 0 hints | M4 | Survey |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M_TEST | E2E Testing Suite Track | Implement `test_prediction.ts` covering Tiers 1-4 across all 5 presets; publish `TEST_INFRA.md` & `TEST_READY.md` | none | DONE |
| M1 | Four-Clock Deterministic Engine | Create `src/lib/predictiveEngine.ts` (Lots, Profections, Progressions, Solar Return, Nodes/Eclipses, Returns) and export `lunarNodes` from `astroEngine.ts` | none | DONE |
| M2 | Rule of Three Convergence Scoring | Implement multi-clock clustering, deduplication, scoring, badges, date windows, narrative synthesis, and `astroSynthesis.ts` integration | M1 | PLANNED |
| M3 | Time-Machine Scrubber & Graph Sync | Lift temporal state in `OrbisApp.tsx`, build Scrubber UI, 4-clock HUD cards in `HoroscopeDashboard.tsx`, sync remedies in `OrbisAlignmentRemedies.tsx`, bi-directional selection | M1, M2 | PLANNED |
| M4 | Final Milestone & Build Verification | Run full verification (`npm test`, `test_synthesis.ts`, `test_orbis_sync.ts`, `test_prediction.ts`, `npm run build`), resolve any regressions, harden coverage | M_TEST, M3 | PLANNED |

## Interface Contracts
### `src/lib/astroEngine.ts` -> `src/lib/predictiveEngine.ts`
- Imports: `bodyState(id, jd)`, `angles(jd, lat, lng)`, `porphyryCusps(asc, mc)`, `houseOf(lon, cusps)`, `signOf(lon)`, `separation(a, b)`, `angDiff(a, b)`, `norm360(deg)`, `jdFromDate(d)`, `dateFromJd(jd)`, `SIGN_NAMES`, `SIGN_RULERS`, `ASPECT_DEFS`.
- Exports: `lunarNodes(jd: number): { meanNorth: number; meanSouth: number; trueNorth: number; trueSouth: number; signNorth: number; signSouth: number }`.

### `src/lib/predictiveEngine.ts` -> `src/components/HoroscopeDashboard.tsx`
- Functions:
  - `computeHellenisticLots(chart: NatalChart): { fortune: HellenisticLot; spirit: HellenisticLot }`
  - `computePredictiveProfection(chart: NatalChart, targetYear: number, targetMonth: number): PredictiveProfection`
  - `computeSecondaryProgressions(chart: NatalChart, targetYear: number, targetMonth: number): SecondaryProgressions`
  - `computeExactSolarReturn(chart: NatalChart, targetYear: number): SolarReturnChart`
  - `classifyEclipsesAndReturns(chart: NatalChart, targetYear: number, targetMonth: number): { eclipses: EclipseClassification[]; milestones: PlanetaryReturnMilestone[]; nodes: LunarNodes }`
  - `computePredictiveConvergence(chart: NatalChart, targetYear: number, targetMonth: number): PredictiveConvergence`

### `src/components/OrbisApp.tsx` -> `src/components/HoroscopeDashboard.tsx` & `OrbisAlignmentRemedies.tsx`
- Props:
  - `targetYear: number` (2024..2032, default 2026)
  - `targetMonth: number` (0..11, default 9 [October])
  - `onDateChange: (year: number, month: number) => void`
  - `onResetDate: () => void`
  - `selection: Selection`
  - `onSelect: (selection: Selection) => void`
  - `focusOnWheel: (target: PointId | AspectType) => void`
