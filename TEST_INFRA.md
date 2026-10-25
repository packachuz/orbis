# E2E Test Infra: ORBIS Predictive Astrology Upgrade

## Test Philosophy
- Opaque-box, requirement-driven testing derived from `ORIGINAL_REQUEST.md` and user-facing astrological specifications.
- Pure-TypeScript test suite executed via `npx tsx test_prediction.ts` across all 5 chart presets (`bangkok`, `london`, `new-york`, `perth`, `tokyo`).
- Methodology: Category-Partition + Boundary Value Analysis + Pairwise Combinatorial + Multi-Preset Workload Testing.

## Feature Inventory & Test Coverage
| # | Feature | Source (Requirement) | Tier 1 (Coverage) | Tier 2 (Boundary) | Tier 3 (Cross-Clock) | Tier 4 (Presets) |
|---|---------|---------------------|:-----------------:|:-----------------:|:--------------------:|:----------------:|
| 1 | Secondary Progressions ($1\text{d} = 1\text{yr}$, Sun/Moon motion, 8-fold phase, $\le 1.5^\circ$ aspects) | ORIGINAL_REQUEST §R1.2 | 5 | 5 | ✓ | 5 presets |
| 2 | Exact Solar Return (Newton-Raphson Sun match $< 0.001^\circ$, SR Asc/MC, rising house, $\le 3^\circ$ conjunctions) | ORIGINAL_REQUEST §R1.3 | 5 | 5 | ✓ | 5 presets |
| 3 | Hellenistic Lots & Profections (Fortune/Spirit diurnal reversal, 12-month sequential advance $1\dots12$, peak periods) | ORIGINAL_REQUEST §R1.1 | 5 | 5 | ✓ | 5 presets |
| 4 | Lunar Nodes & Eclipses (Mean/True nodes, $\le 18^\circ$ solar/lunar eclipse flags, $\le 10^\circ$ total, planetary returns) | ORIGINAL_REQUEST §R1.4 | 5 | 5 | ✓ | 5 presets |
| 5 | Convergence Engine (Multi-clock testimonies, distinct clock layers $\ge 2$, badges, date windows, plain English) | ORIGINAL_REQUEST §R2 | 5 | 5 | ✓ | 5 presets |

## Test Architecture
- Test runner: `npx tsx test_prediction.ts`
- Pass/Fail semantics: Throws on assertion failure, prints pass summary, exits with code 0 on complete pass.
- Strict Typecheck: Evaluated under `astro check` (`tsconfig.json` strict include `**/*`), requiring 0 errors, 0 warnings, 0 hints.

## Real-World Application Scenarios (Tier 4)
| # | Scenario | Features Exercised | Presets |
|---|----------|--------------------|---------|
| 1 | Bangkok Equinox Diurnal Chart | Lots reversal, Solar Return Sun match, 12-month profection cycle | Bangkok |
| 2 | London High-Latitude Chart | Secondary Progressions aspect orb, Solar Return MC/Asc quadrant cusps | London |
| 3 | New York Nocturnal Chart | Inverted Fortune/Spirit formulas, occidental Mercury in-sect, monthly time-lord | New York |
| 4 | Perth Southern Hemisphere Chart | Negative latitude angles, profection progression, nodal eclipse classification | Perth |
| 5 | Tokyo Solar Noon Diurnal Chart | Convergence engine multi-clock badges, date window resolution, return cycles | Tokyo |

## Coverage Thresholds
- Tier 1: >= 5 test cases per feature
- Tier 2: >= 5 boundary test cases per feature (tolerance checks: $\pm 0.01\text{d}$, $< 0.001^\circ$, $\le 1.5^\circ$, $\le 18^\circ$, $\ge 2$ clocks)
- Tier 3: Cross-feature combinations and multi-clock testimonies
- Tier 4: All 5 real-world chart presets verified
- Total: >= 55 test cases across 5 dedicated test suites.
