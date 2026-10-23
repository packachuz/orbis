import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateNatalChart, norm360 } from '../src/lib/astroEngine.ts';
import { PRESETS, cityById } from '../src/lib/cities.ts';

// Replicate exact projection formula from NatalWheelSVG
const lonToAngleDeg = (lon, asc) => norm360(180 - (lon - asc));

// Replicate exact target angle formula from OrbitalPreview
const orbitalPreviewTargetAngle = (lon, asc) => norm360(-(180 + lon - asc));

test('Projection formulas in OrbitalPreview and NatalWheelSVG are mathematically identical', () => {
  for (let asc = 0; asc < 360; asc += 15) {
    for (let lon = 0; lon < 360; lon += 15) {
      const a = lonToAngleDeg(lon, asc);
      const b = orbitalPreviewTargetAngle(lon, asc);
      assert.ok(
        Math.abs(a - b) < 1e-9,
        `Mismatch at lon=${lon}, asc=${asc}: NatalWheel=${a}, OrbitalPreview=${b}`
      );
    }
  }
});

test('Ascendant (East) is strictly positioned at 9 oclock (180 degrees)', () => {
  for (let asc = 0; asc < 360; asc += 22.5) {
    const angle = lonToAngleDeg(asc, asc);
    assert.equal(angle, 180, `ASC angle should be 180° at asc=${asc}`);
  }
});

test('Descendant (West) is strictly positioned at 3 oclock (0 degrees)', () => {
  for (let asc = 0; asc < 360; asc += 22.5) {
    const dsc = norm360(asc + 180);
    const angle = lonToAngleDeg(dsc, asc);
    assert.equal(angle, 0, `DSC angle should be 0° at asc=${asc}`);
  }
});

test('Zodiac signs and longitudes proceed counter-clockwise from 9 oclock', () => {
  const asc = 0; // 0° Aries rising
  // In SVG screen coordinates:
  // 180° = 9 o'clock (left)
  // 90° = 6 o'clock (bottom, y > cy)
  // 0° = 3 o'clock (right)
  // 270° = 12 o'clock (top, y < cy)
  // Counter-clockwise motion means decreasing SVG angle: 180° -> 90° -> 0° -> 270° -> 180°
  
  const aries = lonToAngleDeg(15, asc); // 15° Aries
  const taurus = lonToAngleDeg(45, asc); // 15° Taurus
  const gemini = lonToAngleDeg(75, asc); // 15° Gemini
  const cancer = lonToAngleDeg(105, asc); // 15° Cancer (near IC)
  const capricorn = lonToAngleDeg(285, asc); // 15° Capricorn (near MC)

  assert.equal(aries, 165);
  assert.equal(taurus, 135);
  assert.equal(gemini, 105);
  assert.equal(cancer, 75);
  assert.equal(capricorn, 255);

  // In SVG, sin(angle) gives y direction:
  // positive sin means below horizon (night, houses 1-6)
  // negative sin means above horizon (day, houses 7-12)
  assert.ok(Math.sin((taurus * Math.PI) / 180) > 0, 'Taurus is below horizon');
  assert.ok(Math.sin((cancer * Math.PI) / 180) > 0, 'Cancer is below horizon at IC');
  assert.ok(Math.sin((capricorn * Math.PI) / 180) < 0, 'Capricorn is above horizon at MC');
});

test('Midheaven (MC) is positioned at the top quadrant and IC at the bottom quadrant for all presets', () => {
  for (const p of PRESETS) {
    const city = cityById(p.cityId);
    const input = {
      name: p.name,
      date: p.date,
      time: p.time,
      unknownTime: false,
      lat: city.lat,
      lng: city.lng,
      utcOffset: city.utcOffset,
      locationLabel: city.name,
    };
    const chart = calculateNatalChart(input);
    const mcAngle = lonToAngleDeg(chart.mc, chart.asc);
    const icAngle = lonToAngleDeg(norm360(chart.mc + 180), chart.asc);

    // MC must be in top half: y < cy in SVG, so sin(mcAngle) < 0
    const sinMc = Math.sin((mcAngle * Math.PI) / 180);
    assert.ok(
      sinMc < 0,
      `${p.id}: MC angle (${mcAngle.toFixed(1)}°) must have negative sin (in top hemisphere, near 270°)`
    );

    // IC must be in bottom half: y > cy in SVG, so sin(icAngle) > 0
    const sinIc = Math.sin((icAngle * Math.PI) / 180);
    assert.ok(
      sinIc > 0,
      `${p.id}: IC angle (${icAngle.toFixed(1)}°) must have positive sin (in bottom hemisphere, near 90°)`
    );

    // MC angle should be within ±45° of 270° (top of wheel)
    const diffFromTop = Math.abs(norm360(mcAngle - 270 + 180) - 180);
    assert.ok(
      diffFromTop <= 45,
      `${p.id}: MC angle (${mcAngle.toFixed(1)}°) should be within 45° of 12 o'clock (270°), diff=${diffFromTop}°`
    );
  }
});

test('Houses 1 through 12 proceed strictly counter-clockwise with House 1 below Ascendant', () => {
  for (const p of PRESETS) {
    const city = cityById(p.cityId);
    const input = {
      name: p.name,
      date: p.date,
      time: p.time,
      unknownTime: false,
      lat: city.lat,
      lng: city.lng,
      utcOffset: city.utcOffset,
      locationLabel: city.name,
    };
    const chart = calculateNatalChart(input);
    
    // House 1 cusp is ASC (180°)
    const cusp1Angle = lonToAngleDeg(chart.cusps[0], chart.asc);
    assert.equal(cusp1Angle, 180, 'House 1 cusp is 180°');

    // House 1 interior midpoint:
    const house1Span = norm360(chart.cusps[1] - chart.cusps[0]);
    const house1MidLon = norm360(chart.cusps[0] + house1Span / 2);
    const house1MidAngle = lonToAngleDeg(house1MidLon, chart.asc);
    const sinHouse1 = Math.sin((house1MidAngle * Math.PI) / 180);
    
    // House 1 must be BELOW the horizon in SVG (y > cy, sin > 0)
    assert.ok(
      sinHouse1 > 0,
      `${p.id}: House 1 midpoint (${house1MidAngle.toFixed(1)}°) must be below horizon (positive sin)`
    );

    // House 12 interior midpoint:
    const house12Span = norm360(chart.cusps[0] - chart.cusps[11]);
    const house12MidLon = norm360(chart.cusps[11] + house12Span / 2);
    const house12MidAngle = lonToAngleDeg(house12MidLon, chart.asc);
    const sinHouse12 = Math.sin((house12MidAngle * Math.PI) / 180);

    // House 12 must be ABOVE the horizon in SVG (y < cy, sin < 0)
    assert.ok(
      sinHouse12 < 0,
      `${p.id}: House 12 midpoint (${house12MidAngle.toFixed(1)}°) must be above horizon (negative sin)`
    );
  }
});

test('All 7 planetary positions are identically projected in both graphs for every preset', () => {
  for (const p of PRESETS) {
    const city = cityById(p.cityId);
    const input = {
      name: p.name,
      date: p.date,
      time: p.time,
      unknownTime: false,
      lat: city.lat,
      lng: city.lng,
      utcOffset: city.utcOffset,
      locationLabel: city.name,
    };
    const chart = calculateNatalChart(input);

    for (const pl of chart.planets) {
      const angleNatal = lonToAngleDeg(pl.lon, chart.asc);
      const angleHero = orbitalPreviewTargetAngle(pl.lon, chart.asc);
      assert.ok(
        Math.abs(angleNatal - angleHero) < 1e-9,
        `${p.id} ${pl.id}: NatalWheel (${angleNatal}°) and OrbitalPreview (${angleHero}°) must match exactly`
      );
    }
  }
});

test('User screenshot chart (2001-06-25 Bangkok) orientation and hemisphere verification', () => {
  const chart = calculateNatalChart({
    name: 'User Bug Screenshot Chart',
    date: '2001-06-25',
    time: '01:14',
    unknownTime: false,
    lat: 13.7563,
    lng: 100.5018,
    utcOffset: 7,
    locationLabel: 'Bangkok',
  });

  // Verify ASC is Aries (~20°48') and MC is Capricorn (~15°52')
  assert.equal(Math.floor(chart.asc / 30), 0, 'ASC is in Aries');
  assert.equal(Math.floor(chart.mc / 30), 9, 'MC is in Capricorn');

  // Ascendant angle in both projections must be 180° (9 o'clock)
  const ascAngleNatal = lonToAngleDeg(chart.asc, chart.asc);
  const ascAngleHero = orbitalPreviewTargetAngle(chart.asc, chart.asc);
  assert.equal(ascAngleNatal, 180);
  assert.equal(ascAngleHero, 180);

  // MC angle must be in top hemisphere (~275°) in both projections
  const mcAngleNatal = lonToAngleDeg(chart.mc, chart.asc);
  const mcAngleHero = orbitalPreviewTargetAngle(chart.mc, chart.asc);
  assert.ok(Math.abs(mcAngleNatal - mcAngleHero) < 1e-9);
  assert.ok(Math.sin((mcAngleNatal * Math.PI) / 180) < 0, 'MC must be in top hemisphere (negative sin)');
  assert.ok(Math.abs(mcAngleNatal - 275) < 15, 'MC is near 12 oclock (~275°)');

  // IC angle must be in bottom hemisphere (~95°) in both projections
  const icLon = norm360(chart.mc + 180);
  const icAngleNatal = lonToAngleDeg(icLon, chart.asc);
  const icAngleHero = orbitalPreviewTargetAngle(icLon, chart.asc);
  assert.ok(Math.abs(icAngleNatal - icAngleHero) < 1e-9);
  assert.ok(Math.sin((icAngleNatal * Math.PI) / 180) > 0, 'IC must be in bottom hemisphere (positive sin)');

  // Sun (3° Cancer) at 01:14 AM is underground / subterranean (night hemisphere, positive sin)
  const sun = chart.planets.find((pl) => pl.id === 'sun');
  const sunAngle = lonToAngleDeg(sun.lon, chart.asc);
  assert.ok(Math.sin((sunAngle * Math.PI) / 180) > 0, 'Sun at 01:14 AM is below horizon (bottom half)');

  // Mars (19° Sagittarius) is in diurnal hemisphere (day sky, negative sin)
  const mars = chart.planets.find((pl) => pl.id === 'mars');
  const marsAngle = lonToAngleDeg(mars.lon, chart.asc);
  assert.ok(Math.sin((marsAngle * Math.PI) / 180) < 0, 'Mars is above horizon in the sky (top half)');

  // Gemini planets (Jupiter, Saturn, Mercury) and Taurus (Venus) are all below horizon
  for (const pid of ['jupiter', 'saturn', 'mercury', 'venus']) {
    const pl = chart.planets.find((p) => p.id === pid);
    const angle = lonToAngleDeg(pl.lon, chart.asc);
    assert.ok(
      Math.sin((angle * Math.PI) / 180) > 0,
      `${pid} (${pl.degInSign.toFixed(1)}° in sign ${pl.sign}) must be below horizon`
    );
  }
});

test('Solar chart (unknownTime: true) equal-house orientation across multiple locations', () => {
  for (const p of PRESETS) {
    const city = cityById(p.cityId);
    const chart = calculateNatalChart({
      name: p.name,
      date: p.date,
      time: '12:00',
      unknownTime: true,
      lat: city.lat,
      lng: city.lng,
      utcOffset: city.utcOffset,
      locationLabel: city.name,
    });

    // Sun is Ascendant
    const sun = chart.planets.find((pl) => pl.id === 'sun');
    assert.equal(chart.asc, sun.lon);
    assert.equal(lonToAngleDeg(chart.asc, chart.asc), 180);

    // MC is equal-house 10th cusp: Sun + 270° -> SVG angle 270° (strictly 12 o'clock)
    const mcAngle = lonToAngleDeg(chart.mc, chart.asc);
    assert.equal(mcAngle, 270, 'In solar chart, MC is strictly 270° (12 oclock)');

    // IC is equal-house 4th cusp: Sun + 90° -> SVG angle 90° (strictly 6 o'clock)
    const icLon = norm360(chart.mc + 180);
    const icAngle = lonToAngleDeg(icLon, chart.asc);
    assert.equal(icAngle, 90, 'In solar chart, IC is strictly 90° (6 oclock)');
  }
});

test('Meridian integrity across safe planetary latitudes (-66° to +66°) and diurnal cycle', () => {
  for (let lat = -66; lat <= 66; lat += 22) {
    for (let hour = 0; hour < 24; hour += 4) {
      const chart = calculateNatalChart({
        name: 'Latitude sweep',
        date: '2024-03-21',
        time: `${String(hour).padStart(2, '0')}:00`,
        unknownTime: false,
        lat,
        lng: 0,
        utcOffset: 0,
        locationLabel: 'Greenwich meridian',
      });

      const mcAngle = lonToAngleDeg(chart.mc, chart.asc);
      const icLon = norm360(chart.mc + 180);
      const icAngle = lonToAngleDeg(icLon, chart.asc);

      // MC must always be in top hemisphere (y < cy, sin < 0)
      const sinMc = Math.sin((mcAngle * Math.PI) / 180);
      assert.ok(
        sinMc < 0,
        `lat=${lat}, hour=${hour}: MC (${mcAngle.toFixed(1)}°) must have negative sin (in sky)`
      );

      // IC must always be in bottom hemisphere (y > cy, sin > 0)
      const sinIc = Math.sin((icAngle * Math.PI) / 180);
      assert.ok(
        sinIc > 0,
        `lat=${lat}, hour=${hour}: IC (${icAngle.toFixed(1)}°) must have positive sin (underground)`
      );
    }
  }
});

