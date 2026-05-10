'use strict';

const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const M = require('../../source/beach-volleyball/map-data.js');

function loadVenues(relPath, mapper) {
  const text = fs.readFileSync(path.resolve(__dirname, '../..', relPath), 'utf8');
  return M.parseCsv(text).map(mapper);
}

describe('indoor CSV data sanity', () => {
  const venues = loadVenues('source/beach-volleyball/nordic_indoor_beach_volleyball_facilities.csv', M.rowToVenue);

  test('produces at least 30 indoor halls', () => {
    assert.ok(venues.length >= 30, `only ${venues.length} venues`);
  });

  test('all rows have finite lat/lng inside Nordic + Baltic bounds', () => {
    // Iceland ~ -25/63, Finland east 32, Lithuania south 54, Norway north 71
    for (const v of venues) {
      assert.ok(Number.isFinite(v.lat), `${v.name}: lat is not finite (${v.lat})`);
      assert.ok(Number.isFinite(v.lng), `${v.name}: lng is not finite (${v.lng})`);
      assert.ok(v.lat >= 53 && v.lat <= 72, `${v.name}: lat=${v.lat} out of bounds`);
      assert.ok(v.lng >= -26 && v.lng <= 32, `${v.name}: lng=${v.lng} out of bounds`);
    }
  });

  test('venue ids are unique', () => {
    const seen = new Map();
    for (const v of venues) {
      const prev = seen.get(v.id);
      assert.ok(!prev, `duplicate id ${v.id} between "${prev}" and "${v.name}"`);
      seen.set(v.id, v.name);
    }
  });

  test('country code is one of the eight Nordic + Baltic codes', () => {
    const valid = new Set(Object.keys(M.COUNTRIES));
    for (const v of venues) {
      assert.ok(valid.has(v.country), `${v.name}: country=${v.country} not in COUNTRIES`);
    }
  });
});

describe('outdoor CSV data sanity', () => {
  const venues = loadVenues('source/beach-volleyball/nordic_outdoor_beach_volleyball_courts.csv', M.rowToOutdoor);

  test('produces at least 900 outdoor courts across all countries', () => {
    assert.ok(venues.length >= 900, `only ${venues.length} venues`);
  });

  test('all rows have finite lat/lng inside Nordic + Baltic bounds', () => {
    // Norway north ~71, Iceland west ~-25, Lithuania south ~54, Finland east ~32
    for (const v of venues) {
      assert.ok(Number.isFinite(v.lat), `${v.name}: lat is not finite (${v.lat})`);
      assert.ok(Number.isFinite(v.lng), `${v.name}: lng is not finite (${v.lng})`);
      assert.ok(v.lat >= 53 && v.lat <= 72, `${v.name}: lat=${v.lat} out of bounds`);
      assert.ok(v.lng >= -26 && v.lng <= 32, `${v.name}: lng=${v.lng} out of bounds`);
    }
  });

  test('venue ids are unique', () => {
    const seen = new Map();
    for (const v of venues) {
      const prev = seen.get(v.id);
      assert.ok(!prev, `duplicate id ${v.id} between "${prev}" and "${v.name}"`);
      seen.set(v.id, v.name);
    }
  });

  test('LIPAS ids (when present) are unique within Finland rows', () => {
    // rowToOutdoor synthesizes idx-N when no lipas_id; only check the real ones.
    const real = venues
      .filter((v) => v.country === 'FI')
      .map((v) => v.lipasId)
      .filter((id) => !/^idx-/.test(id));
    assert.equal(new Set(real).size, real.length, 'duplicate lipas_id detected in Finland rows');
  });

  test('country codes are valid Nordic + Baltic codes', () => {
    const valid = new Set(Object.keys(M.COUNTRIES));
    for (const v of venues) {
      assert.ok(valid.has(v.country), `${v.name}: country=${v.country} not in COUNTRIES`);
    }
  });
});
