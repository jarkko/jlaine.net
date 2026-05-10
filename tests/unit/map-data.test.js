'use strict';

const { test, describe, mock } = require('node:test');
const assert = require('node:assert/strict');

const M = require('../../source/beach-volleyball/map-data.js');

describe('escapeHtml', () => {
  test('escapes the five HTML entities', () => {
    assert.equal(
      M.escapeHtml(`<a href="x" data-x='y'>&</a>`),
      '&lt;a href=&quot;x&quot; data-x=&#39;y&#39;&gt;&amp;&lt;/a&gt;',
    );
  });

  test('passes through input without entities unchanged', () => {
    assert.equal(M.escapeHtml('Plain text 123'), 'Plain text 123');
  });

  test('coerces non-string input', () => {
    assert.equal(M.escapeHtml(42), '42');
    assert.equal(M.escapeHtml(null), 'null');
  });
});

describe('safeUrl', () => {
  test('returns null for empty / nullish input', () => {
    assert.equal(M.safeUrl(''), null);
    assert.equal(M.safeUrl(null), null);
    assert.equal(M.safeUrl(undefined), null);
  });

  test('accepts http and https URLs', () => {
    assert.equal(M.safeUrl('http://example.com/'), 'http://example.com/');
    assert.equal(M.safeUrl('https://example.com/path?q=1'), 'https://example.com/path?q=1');
  });

  test('rejects javascript:, data:, file:, vbscript: schemes', () => {
    assert.equal(M.safeUrl('javascript:alert(1)'), null);
    assert.equal(M.safeUrl('JAVASCRIPT:alert(1)'), null);
    assert.equal(M.safeUrl('data:text/html,<script>x</script>'), null);
    assert.equal(M.safeUrl('file:///etc/passwd'), null);
    assert.equal(M.safeUrl('vbscript:msgbox'), null);
  });

  test('rejects relative URLs without a base (Node has no document.baseURI)', () => {
    assert.equal(M.safeUrl('/foo/bar'), null);
    assert.equal(M.safeUrl('foo'), null);
  });

  test('trims surrounding whitespace before parsing', () => {
    assert.equal(M.safeUrl('  https://example.com/  '), 'https://example.com/');
  });

  describe('with document.baseURI stubbed (browser-like)', () => {
    const realDoc = globalThis.document;
    test.before(() => {
      globalThis.document = { baseURI: 'https://example.com/page/' };
    });
    test.after(() => {
      globalThis.document = realDoc;
    });

    test('resolves absolute-path URLs against document.baseURI', () => {
      assert.equal(M.safeUrl('/foo'), 'https://example.com/foo');
    });

    test('resolves relative URLs against document.baseURI', () => {
      assert.equal(M.safeUrl('bar.html'), 'https://example.com/page/bar.html');
    });
  });
});

describe('slug', () => {
  test('lowercases ASCII and collapses non-alphanumerics', () => {
    assert.equal(M.slug('Hello World!'), 'hello-world');
  });

  test('strips diacritics', () => {
    assert.equal(M.slug('Sandhallen på Gimle'), 'sandhallen-pa-gimle');
    assert.equal(M.slug('Äimäkuja Ölvi'), 'aimakuja-olvi');
  });

  test('strips leading and trailing dashes', () => {
    assert.equal(M.slug('!!!hi!!!'), 'hi');
    assert.equal(M.slug('---abc'), 'abc');
  });

  test('returns empty string for input with no alphanumerics', () => {
    assert.equal(M.slug('!!!'), '');
  });
});

describe('matchesQuery', () => {
  const indoorVenue = {
    category: 'indoor',
    country: 'FI',
    name: 'Hiekka Beach Club',
    town: 'Vantaa',
    address: 'Martinkyläntie 59',
    priceNote: '40 EUR/slot',
  };
  const outdoorVenue = {
    category: 'outdoor',
    country: 'FI',
    name: 'Pyynikin uimarannan kenttä',
    town: 'Tampere',
    address: 'Jalkasaarentie 7',
    surface: 'sand',
    access: 'public',
  };

  test('returns true for empty query', () => {
    assert.equal(M.matchesQuery(indoorVenue, ''), true);
  });

  test('matches venue name', () => {
    assert.equal(M.matchesQuery(indoorVenue, 'hiekka'), true);
  });

  test('matches town', () => {
    assert.equal(M.matchesQuery(indoorVenue, 'vantaa'), true);
  });

  test('matches address', () => {
    assert.equal(M.matchesQuery(indoorVenue, 'martinky'), true);
  });

  test('matches price note for indoor venues', () => {
    assert.equal(M.matchesQuery(indoorVenue, 'eur/slot'), true);
  });

  test('matches surface and access for outdoor venues', () => {
    assert.equal(M.matchesQuery(outdoorVenue, 'sand'), true);
    assert.equal(M.matchesQuery(outdoorVenue, 'public'), true);
  });

  test('matches country name', () => {
    assert.equal(M.matchesQuery(indoorVenue, 'finland'), true);
  });

  test('returns false when nothing matches', () => {
    assert.equal(M.matchesQuery(indoorVenue, 'reykjavik'), false);
  });

  test('handles missing optional fields', () => {
    const v = { category: 'indoor', country: 'XX', name: 'X', address: 'Y' };
    assert.equal(M.matchesQuery(v, 'x'), true);
    assert.equal(M.matchesQuery(v, 'z'), false);
  });

  test('outdoor venue without optional surface/access still searches name', () => {
    const v = { category: 'outdoor', country: 'FI', name: 'Foo', address: 'Bar' };
    assert.equal(M.matchesQuery(v, 'foo'), true);
  });
});

describe('parseCsv', () => {
  test('returns empty array for empty input', () => {
    assert.deepEqual(M.parseCsv(''), []);
  });

  test('returns empty array when only a header is present', () => {
    assert.deepEqual(M.parseCsv('a,b,c'), []);
  });

  test('parses a simple row to an object keyed by header', () => {
    assert.deepEqual(M.parseCsv('a,b\n1,2'), [{ a: '1', b: '2' }]);
  });

  test('handles quoted fields containing commas', () => {
    assert.deepEqual(M.parseCsv('name,address\nA,"Foo, Bar 7"'), [{ name: 'A', address: 'Foo, Bar 7' }]);
  });

  test('handles escaped double-quotes inside quoted fields', () => {
    assert.deepEqual(M.parseCsv('name,note\nA,"He said ""hi"""'), [{ name: 'A', note: 'He said "hi"' }]);
  });

  test('normalizes CRLF and CR line endings', () => {
    assert.deepEqual(M.parseCsv('a,b\r\n1,2\r3,4'), [
      { a: '1', b: '2' },
      { a: '3', b: '4' },
    ]);
  });

  test('strips leading and trailing blank rows', () => {
    assert.deepEqual(M.parseCsv('\n\na,b\n1,2\n\n'), [{ a: '1', b: '2' }]);
  });

  test('strips leading blank rows that contain only commas', () => {
    assert.deepEqual(M.parseCsv(',,\n,\nfoo,bar\n1,2'), [{ foo: '1', bar: '2' }]);
  });

  test('handles missing trailing fields with empty strings', () => {
    assert.deepEqual(M.parseCsv('a,b,c\n1,2'), [{ a: '1', b: '2', c: '' }]);
  });

  test('trims whitespace around field values', () => {
    assert.deepEqual(M.parseCsv('a,b\n  1  ,  2  '), [{ a: '1', b: '2' }]);
  });

  test('keeps a final row with no trailing newline', () => {
    assert.deepEqual(M.parseCsv('a\n1'), [{ a: '1' }]);
  });
});

describe('parseCourtValue', () => {
  test('null and empty input → unknown', () => {
    assert.deepEqual(M.parseCourtValue(null), { count: 0, pinLabel: '?', tagLabel: 'courts n/a', detail: null });
    assert.deepEqual(M.parseCourtValue(''), { count: 0, pinLabel: '?', tagLabel: 'courts n/a', detail: null });
  });

  test('numeric input', () => {
    assert.deepEqual(M.parseCourtValue(5), { count: 5, pinLabel: '5', tagLabel: '5 indoor', detail: null });
  });

  test('digit-only string', () => {
    assert.deepEqual(M.parseCourtValue('3'), { count: 3, pinLabel: '3', tagLabel: '3 indoor', detail: '3' });
  });

  test('range string with hyphen', () => {
    const r = M.parseCourtValue('3-5');
    assert.equal(r.pinLabel, '3-5');
    assert.equal(r.tagLabel, '3-5 indoor');
    assert.equal(r.count, 3);
    assert.equal(r.detail, '3-5');
  });

  test('range string with en-dash and em-dash', () => {
    assert.equal(M.parseCourtValue('3\u20135').pinLabel, '3\u20135');
    assert.equal(M.parseCourtValue('3\u20145').pinLabel, '3\u20145');
  });

  test('verbose string with leading number keeps full detail', () => {
    const r = M.parseCourtValue('3 training OR 2 match');
    assert.equal(r.pinLabel, '3');
    assert.equal(r.tagLabel, '3 indoor');
    assert.equal(r.detail, '3 training OR 2 match');
  });

  test('non-numeric string falls back to unknown label', () => {
    const r = M.parseCourtValue('reconfigurable');
    assert.equal(r.pinLabel, '?');
    assert.equal(r.tagLabel, 'indoor courts n/a');
    assert.equal(r.count, 0);
    assert.equal(r.detail, 'reconfigurable');
  });
});

describe('parseOutdoorValue', () => {
  test('null and empty → empty tag', () => {
    assert.deepEqual(M.parseOutdoorValue(null), { tagLabel: '', detail: null });
    assert.deepEqual(M.parseOutdoorValue(''), { tagLabel: '', detail: null });
  });

  test('numeric prefix → "+ N outdoor" with detail', () => {
    assert.deepEqual(M.parseOutdoorValue('5 outdoor at same site'), {
      tagLabel: '+ 5 outdoor',
      detail: '5 outdoor at same site',
    });
  });

  test('range prefix preserved', () => {
    assert.deepEqual(M.parseOutdoorValue('3-5 outdoor'), { tagLabel: '+ 3-5 outdoor', detail: '3-5 outdoor' });
  });

  test('non-numeric → "+ raw" with no detail', () => {
    assert.deepEqual(M.parseOutdoorValue('seasonal'), { tagLabel: '+ seasonal', detail: null });
  });
});

describe('rowToVenue', () => {
  function row(overrides = {}) {
    return {
      country: 'FINLAND',
      facility_name: 'Test Hall',
      town: 'Helsinki',
      address: 'Foo 1',
      latitude: '60.1',
      longitude: '24.9',
      coord_precision: 'address',
      facility_type: 'dedicated_indoor_sand_hall',
      indoor_sand_courts: '3',
      outdoor_courts_same_venue: '',
      currency: 'EUR',
      booking_or_info_url: 'https://example.com',
      price_notes: 'free',
      ...overrides,
    };
  }

  test('maps country name to ISO code', () => {
    assert.equal(M.rowToVenue(row(), 0).country, 'FI');
  });

  test('falls back to first two letters of unknown country name', () => {
    assert.equal(M.rowToVenue(row({ country: 'POLAND' }), 0).country, 'PO');
  });

  test('falls back to XX when country is missing', () => {
    assert.equal(M.rowToVenue(row({ country: '' }), 0).country, 'XX');
  });

  test('lat/lng parsed as floats', () => {
    const v = M.rowToVenue(row(), 0);
    assert.equal(v.lat, 60.1);
    assert.equal(v.lng, 24.9);
  });

  test('numeric indoor_sand_courts becomes integer', () => {
    assert.equal(M.rowToVenue(row({ indoor_sand_courts: '7' }), 0).courtsIndoor, 7);
  });

  test('non-numeric indoor_sand_courts stays as string', () => {
    assert.equal(
      M.rowToVenue(row({ indoor_sand_courts: '3 training OR 2 match' }), 0).courtsIndoor,
      '3 training OR 2 match',
    );
  });

  test('empty indoor_sand_courts → null', () => {
    assert.equal(M.rowToVenue(row({ indoor_sand_courts: '' }), 0).courtsIndoor, null);
  });

  test('"not_stated_publicly" indoor_sand_courts → null', () => {
    assert.equal(M.rowToVenue(row({ indoor_sand_courts: 'not_stated_publicly' }), 0).courtsIndoor, null);
  });

  test('id is slugified country-name', () => {
    assert.equal(M.rowToVenue(row({ facility_name: 'Sandhallen på Gimle' }), 0).id, 'fi-sandhallen-pa-gimle');
  });

  test('id falls back to idx when facility_name is missing', () => {
    assert.equal(M.rowToVenue(row({ facility_name: '' }), 7).id, 'fi-idx-7');
  });

  test('falls back to "address" precision when missing', () => {
    assert.equal(M.rowToVenue(row({ coord_precision: '' }), 0).precision, 'address');
  });

  test('maps known facility_type to label, passes through unknown', () => {
    assert.equal(M.rowToVenue(row(), 0).type, 'Dedicated indoor sand hall');
    assert.equal(M.rowToVenue(row({ facility_type: 'foo' }), 0).type, 'foo');
  });

  test('outdoor_courts_same_venue feeds outdoorTagLabel', () => {
    const v = M.rowToVenue(row({ outdoor_courts_same_venue: '5 outdoor at same site' }), 0);
    assert.equal(v.outdoorTagLabel, '+ 5 outdoor');
    assert.equal(v.courtsOutdoor, '5 outdoor at same site');
  });

  test('passes through booking url, price note and currency', () => {
    const v = M.rowToVenue(row(), 0);
    assert.equal(v.url, 'https://example.com');
    assert.equal(v.priceNote, 'free');
    assert.equal(v.currency, 'EUR');
  });

  test('category is always "indoor"', () => {
    assert.equal(M.rowToVenue(row(), 0).category, 'indoor');
  });
});

describe('rowToOutdoor', () => {
  function row(overrides = {}) {
    return {
      country: 'FINLAND',
      facility_name: 'Outdoor Court',
      town: 'Tampere',
      address: 'Foo 1',
      latitude: '61.5',
      longitude: '23.8',
      coord_precision: 'address',
      outdoor_courts: '2',
      surface: 'sand',
      lighting: 'yes',
      free_use: 'yes',
      access: 'public',
      owner: 'city',
      lipas_id: '12345',
      source_url: 'https://example.com',
      ...overrides,
    };
  }

  test('id includes lipas_id', () => {
    assert.equal(M.rowToOutdoor(row(), 0).id, 'fi-out-12345');
  });

  test('id falls back to idx-N when lipas_id missing', () => {
    assert.equal(M.rowToOutdoor(row({ lipas_id: '' }), 7).id, 'fi-out-idx-7');
  });

  test('outdoor_courts parses as integer with 0 fallback', () => {
    assert.equal(M.rowToOutdoor(row({ outdoor_courts: '5' }), 0).courts, 5);
    assert.equal(M.rowToOutdoor(row({ outdoor_courts: '' }), 0).courts, 0);
    assert.equal(M.rowToOutdoor(row({ outdoor_courts: 'abc' }), 0).courts, 0);
  });

  test('lighting and freeUse are boolean equality with "yes"', () => {
    const v = M.rowToOutdoor(row(), 0);
    assert.equal(v.lighting, true);
    assert.equal(v.freeUse, true);
    const v2 = M.rowToOutdoor(row({ lighting: 'no', free_use: '' }), 0);
    assert.equal(v2.lighting, false);
    assert.equal(v2.freeUse, false);
  });

  test('access defaults to "public" when missing', () => {
    assert.equal(M.rowToOutdoor(row({ access: '' }), 0).access, 'public');
  });

  test('precision defaults to "address" when missing', () => {
    assert.equal(M.rowToOutdoor(row({ coord_precision: '' }), 0).precision, 'address');
  });

  test('surface, owner, source_url default to empty string', () => {
    const v = M.rowToOutdoor(row({ surface: '', owner: '', source_url: '' }), 0);
    assert.equal(v.surface, '');
    assert.equal(v.owner, '');
    assert.equal(v.url, '');
  });

  test('country is always FI and category is always outdoor', () => {
    const v = M.rowToOutdoor(row(), 0);
    assert.equal(v.country, 'FI');
    assert.equal(v.category, 'outdoor');
  });

  test('courtsLabel is the raw outdoor_courts string', () => {
    assert.equal(M.rowToOutdoor(row({ outdoor_courts: '3' }), 0).courtsLabel, '3');
    assert.equal(M.rowToOutdoor(row({ outdoor_courts: '' }), 0).courtsLabel, '');
  });
});

describe('debounce', () => {
  test('fires once after the configured delay', () => {
    mock.timers.enable({ apis: ['setTimeout'] });
    try {
      const calls = [];
      const f = M.debounce((...args) => calls.push(args), 100);
      f('a');
      f('b');
      f('c');
      assert.equal(calls.length, 0, 'should not fire before delay');
      mock.timers.tick(99);
      assert.equal(calls.length, 0, 'should not fire just before delay');
      mock.timers.tick(1);
      assert.deepEqual(calls, [['c']], 'fires once with last call args');
    } finally {
      mock.timers.reset();
    }
  });

  test('separate burst after delay produces a second invocation', () => {
    mock.timers.enable({ apis: ['setTimeout'] });
    try {
      const calls = [];
      const f = M.debounce((...args) => calls.push(args), 50);
      f(1);
      mock.timers.tick(50);
      f(2);
      mock.timers.tick(50);
      assert.deepEqual(calls, [[1], [2]]);
    } finally {
      mock.timers.reset();
    }
  });
});

describe('ctaLabelFor', () => {
  test('returns null when there is no URL', () => {
    assert.equal(M.ctaLabelFor({ category: 'indoor', url: '' }), null);
    assert.equal(M.ctaLabelFor({ category: 'indoor' }), null);
    assert.equal(M.ctaLabelFor(null), null);
  });

  test('outdoor venues always get "More info ↗"', () => {
    assert.equal(M.ctaLabelFor({ category: 'outdoor', url: 'https://lipas.fi/x' }), 'More info ↗');
  });

  test('indoor URLs containing booking patterns get "Book ↗"', () => {
    const cases = [
      'https://hetkrannahall.ee/booking',
      'https://example.com/booking',
      'https://example.com/book',
      'https://www.bookup.no/utleie/Index/5774',
      'https://biitsille.fi/',
      'https://example.com/varaa',
      'https://example.com/varaukset',
      'https://example.com/boka-tider',
      'https://www.vuorovaraus.fi/x',
    ];
    for (const url of cases) {
      assert.equal(M.ctaLabelFor({ category: 'indoor', url }), 'Book ↗', `expected booking label for ${url}`);
    }
  });

  test('indoor URLs without booking patterns get "Visit site ↗"', () => {
    const cases = [
      'https://www.biitsihalli.fi/index_en.htm',
      'https://example.com/about',
      'https://example.com',
      'https://www.fbf.fi/foreign',
    ];
    for (const url of cases) {
      assert.equal(M.ctaLabelFor({ category: 'indoor', url }), 'Visit site ↗', `expected visit label for ${url}`);
    }
  });
});

describe('validateCsvSchema', () => {
  test('returns rows untouched when all required columns are present', () => {
    const rows = [{ a: '1', b: '2', c: '3' }];
    assert.equal(M.validateCsvSchema(rows, ['a', 'b']), rows);
  });

  test('throws on empty input', () => {
    assert.throws(() => M.validateCsvSchema([], ['a'], 'foo'), /foo: produced 0 rows/);
  });

  test('throws on non-array input', () => {
    assert.throws(() => M.validateCsvSchema(null, ['a'], 'bar'), /bar: produced 0 rows/);
  });

  test('throws on missing required columns and lists them', () => {
    const rows = [{ a: '1' }];
    assert.throws(() => M.validateCsvSchema(rows, ['a', 'b', 'c'], 'baz'), /baz: missing required column\(s\): b, c/);
  });

  test('default label is "CSV"', () => {
    assert.throws(() => M.validateCsvSchema([{}], ['x']), /^Error: CSV: missing/);
  });

  test('exposes column lists for indoor and outdoor', () => {
    assert.ok(M.INDOOR_REQUIRED_COLUMNS.includes('country'));
    assert.ok(M.INDOOR_REQUIRED_COLUMNS.includes('latitude'));
    assert.ok(M.OUTDOOR_REQUIRED_COLUMNS.includes('latitude'));
    assert.ok(M.OUTDOOR_REQUIRED_COLUMNS.includes('outdoor_courts'));
  });
});

describe('parseHash', () => {
  const D = { mode: 'indoor', country: 'all', q: '', venue: '' };

  test('empty hash returns defaults', () => {
    assert.deepEqual(M.parseHash(''), D);
    assert.deepEqual(M.parseHash('#'), D);
    assert.deepEqual(M.parseHash(), D);
  });

  test('legacy bare-mode form', () => {
    assert.deepEqual(M.parseHash('#indoor'), { ...D, mode: 'indoor' });
    assert.deepEqual(M.parseHash('#outdoor'), { ...D, mode: 'outdoor' });
    assert.deepEqual(M.parseHash('#both'), { ...D, mode: 'both' });
    assert.deepEqual(M.parseHash('#OUTDOOR'), { ...D, mode: 'outdoor' });
  });

  test('param form with mode, country, q, id', () => {
    assert.deepEqual(M.parseHash('#mode=outdoor&country=FI&q=helsinki&id=fi-out-123'), {
      mode: 'outdoor',
      country: 'FI',
      q: 'helsinki',
      venue: 'fi-out-123',
    });
  });

  test('decodes URI-encoded query and venue id', () => {
    assert.equal(M.parseHash('#mode=indoor&q=p%C3%A4').q, 'pä');
    assert.equal(M.parseHash('#mode=indoor&id=fi-bii%2Btsi').venue, 'fi-bii+tsi');
  });

  test('rejects unknown mode and falls back to indoor', () => {
    assert.equal(M.parseHash('#mode=galactic&country=FI').mode, 'indoor');
  });

  test('missing mode in param form falls back to indoor', () => {
    assert.equal(M.parseHash('#country=FI').mode, 'indoor');
  });

  test('non-string input falls back to defaults', () => {
    assert.deepEqual(M.parseHash(null), D);
    assert.deepEqual(M.parseHash(undefined), D);
    assert.deepEqual(M.parseHash(42), D);
  });
});

describe('serializeHash', () => {
  test('defaults serialize to bare mode', () => {
    assert.equal(M.serializeHash(), '#indoor');
    assert.equal(M.serializeHash({}), '#indoor');
    assert.equal(M.serializeHash({ mode: 'outdoor' }), '#outdoor');
  });

  test('country adds &country= and switches to param form', () => {
    assert.equal(M.serializeHash({ mode: 'indoor', country: 'FI' }), '#mode=indoor&country=FI');
  });

  test('venue id alone switches to param form', () => {
    assert.equal(M.serializeHash({ mode: 'outdoor', venue: 'fi-out-7' }), '#mode=outdoor&id=fi-out-7');
  });

  test('all four params combine in stable order', () => {
    assert.equal(
      M.serializeHash({ mode: 'outdoor', country: 'FI', q: 'helsinki', venue: 'fi-out-7' }),
      '#mode=outdoor&country=FI&q=helsinki&id=fi-out-7',
    );
  });

  test('query and venue id are URI-encoded', () => {
    assert.equal(M.serializeHash({ mode: 'indoor', q: 'pä', venue: 'fi+a' }), '#mode=indoor&q=p%C3%A4&id=fi%2Ba');
  });

  test('round-trips parseHash → serializeHash', () => {
    const cases = [
      '#indoor',
      '#outdoor',
      '#both',
      '#mode=outdoor&country=FI',
      '#mode=indoor&q=helsinki',
      '#mode=outdoor&country=FI&q=hetk',
      '#mode=indoor&id=fi-biitsi-pasila',
      '#mode=outdoor&country=FI&q=hetk&id=fi-out-42',
    ];
    for (const h of cases) {
      assert.equal(M.serializeHash(M.parseHash(h)), h, `round-trip failed for ${h}`);
    }
  });
});

describe('exported constants', () => {
  test('COUNTRIES contains all eight Nordic+Baltic codes', () => {
    assert.deepEqual(Object.keys(M.COUNTRIES).sort(), ['DK', 'EE', 'FI', 'IS', 'LT', 'LV', 'NO', 'SE']);
  });

  test('COUNTRY_FROM_NAME maps every full name to a code in COUNTRIES', () => {
    for (const code of Object.values(M.COUNTRY_FROM_NAME)) {
      assert.ok(M.COUNTRIES[code], `unknown country code ${code}`);
    }
  });

  test('TYPE_LABELS has a label for each known facility_type key', () => {
    assert.equal(M.TYPE_LABELS.dedicated_indoor_sand_hall, 'Dedicated indoor sand hall');
    assert.equal(M.TYPE_LABELS.air_dome_seasonal_winter, 'Air dome (winter)');
  });

  test('OUTDOOR_COLOR is a hex colour', () => {
    assert.match(M.OUTDOOR_COLOR, /^#[0-9a-f]{6}$/i);
  });
});
