/*
 * Pure data helpers used by the beach volleyball map.
 *
 * Loaded twice:
 *   - In the browser, via <script src="map-data.js">; exposes window.BVMap.
 *   - In Node, via require('source/beach-volleyball/map-data.js'); exposes module.exports.
 *
 * Keep this file free of DOM and Leaflet references so it stays unit-testable.
 */
/* c8 ignore start -- UMD wrapper; one branch always dead per environment */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.BVMap = factory();
  }
}(typeof self !== 'undefined' ? self : globalThis, function () {
/* c8 ignore stop */
  'use strict';

  const COUNTRIES = {
    FI: { name: 'Finland',   flag: '🇫🇮', color: '#1f4fb6' },
    SE: { name: 'Sweden',    flag: '🇸🇪', color: '#d8a200' },
    NO: { name: 'Norway',    flag: '🇳🇴', color: '#c8102e' },
    DK: { name: 'Denmark',   flag: '🇩🇰', color: '#c8487a' },
    IS: { name: 'Iceland',   flag: '🇮🇸', color: '#14b8a6' },
    EE: { name: 'Estonia',   flag: '🇪🇪', color: '#2c7a55' },
    LV: { name: 'Latvia',    flag: '🇱🇻', color: '#7e2530' },
    LT: { name: 'Lithuania', flag: '🇱🇹', color: '#6b46c1' },
  };
  const COUNTRY_FROM_NAME = {
    FINLAND: 'FI', SWEDEN: 'SE', NORWAY: 'NO', DENMARK: 'DK', ICELAND: 'IS',
    ESTONIA: 'EE', LATVIA: 'LV', LITHUANIA: 'LT',
  };
  const TYPE_LABELS = {
    dedicated_indoor_sand_hall:        'Dedicated indoor sand hall',
    multi_activity_indoor_beach_venue: 'Multi-activity indoor beach venue',
    air_dome_seasonal_winter:          'Air dome (winter)',
    gym_with_indoor_sand_court:        'Gym with indoor sand court',
  };
  const OUTDOOR_COLOR = '#047857';

  const escapeHtml = s => String(s).replace(/[&<>"']/g, c => (
    { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]
  ));

  // Returns a safe http:/https: URL string, or null. Blocks javascript:, data:,
  // file:, vbscript:, etc. so untrusted CSV data cannot inject scripted links.
  const safeUrl = raw => {
    if (!raw) return null;
    try {
      const base = (typeof document !== 'undefined') ? document.baseURI : undefined;
      const u = new URL(String(raw).trim(), base);
      return (u.protocol === 'http:' || u.protocol === 'https:') ? u.href : null;
    } catch { return null; }
  };

  const slug = s => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
                      .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

  // Trailing-edge debounce. Each call resets the timer; the wrapped function
  // fires once `ms` milliseconds have elapsed since the last call.
  const debounce = (fn, ms) => {
    let t;
    return (...args) => {
      clearTimeout(t);
      t = setTimeout(() => fn(...args), ms);
    };
  };

  const VALID_MODES = ['indoor', 'outdoor', 'both'];

  // Decodes the hash fragment into the page's UI state. Two formats supported:
  //   #outdoor                       (legacy: bare mode word)
  //   #mode=outdoor&country=FI&q=hel (when extra state needs to round-trip)
  // Anything missing or invalid falls back to defaults.
  function parseHash(hash) {
    const raw = (typeof hash === 'string' ? hash : '').replace(/^#/, '').trim();
    const defaults = { mode: 'indoor', country: 'all', q: '' };
    if (!raw) return defaults;
    const lower = raw.toLowerCase();
    if (VALID_MODES.includes(lower)) return { ...defaults, mode: lower };
    const params = new URLSearchParams(raw);
    const m = params.get('mode');
    return {
      mode:    VALID_MODES.includes(m) ? m : 'indoor',
      country: params.get('country') || 'all',
      q:       params.get('q') || '',
    };
  }

  // Inverse of parseHash. Uses the bare-word form for default country & query
  // so the simplest URLs stay short and shareable.
  function serializeHash({ mode = 'indoor', country = 'all', q = '' } = {}) {
    const hasExtra = (country && country !== 'all') || !!q;
    if (!hasExtra) return `#${mode}`;
    const parts = [`mode=${mode}`];
    if (country && country !== 'all') parts.push(`country=${encodeURIComponent(country)}`);
    if (q) parts.push(`q=${encodeURIComponent(q)}`);
    return '#' + parts.join('&');
  }

  const matchesQuery = (v, q) => {
    if (!q) return true;
    const extra = v.category === 'indoor'
      ? (v.priceNote || '')
      : `${v.surface || ''} ${v.access || ''}`;
    const hay = `${v.name} ${v.town || ''} ${v.address} ${extra} ${COUNTRIES[v.country]?.name || ''}`.toLowerCase();
    return hay.includes(q);
  };

  // RFC 4180-ish CSV parser. Handles quoted fields, escaped quotes ("") and
  // CRLF line endings.  Returns array of objects keyed by header row.
  function parseCsv(text) {
    const rows = [];
    let row = [], field = '', inQuotes = false;
    const t = text.replace(/\r\n?/g, '\n').replace(/^\s*\n/, '');
    for (let i = 0; i < t.length; i++) {
      const c = t[i];
      if (inQuotes) {
        if (c === '"') {
          if (t[i + 1] === '"') { field += '"'; i++; }
          else { inQuotes = false; }
        } else field += c;
      } else {
        if (c === '"') inQuotes = true;
        else if (c === ',') { row.push(field); field = ''; }
        else if (c === '\n') { row.push(field); rows.push(row); row = []; field = ''; }
        else field += c;
      }
    }
    if (field !== '' || row.length) { row.push(field); rows.push(row); }
    while (rows.length && rows[0].every(v => v.trim() === '')) rows.shift();
    while (rows.length && rows[rows.length - 1].every(v => v.trim() === '')) rows.pop();
    if (!rows.length) return [];
    const headers = rows[0].map(h => h.trim());
    return rows.slice(1).map(r => Object.fromEntries(
      headers.map((h, i) => [h, (r[i] ?? '').trim()])
    ));
  }

  // Throws if any required column is missing from the parseCsv output. The
  // intent is that a future CSV column rename fails loudly during boot
  // (and during the e2e/data-sanity tests in CI) instead of producing a
  // silently empty page.
  function validateCsvSchema(rows, required, label = 'CSV') {
    if (!Array.isArray(rows) || !rows.length) {
      throw new Error(`${label}: produced 0 rows`);
    }
    const headers = new Set(Object.keys(rows[0]));
    const missing = required.filter(c => !headers.has(c));
    if (missing.length) {
      throw new Error(`${label}: missing required column(s): ${missing.join(', ')}`);
    }
    return rows;
  }

  const INDOOR_REQUIRED_COLUMNS = [
    'country', 'facility_name', 'town', 'address',
    'latitude', 'longitude',
    'indoor_sand_courts',
    'currency', 'booking_or_info_url',
  ];

  const OUTDOOR_REQUIRED_COLUMNS = [
    'facility_name', 'town', 'address',
    'latitude', 'longitude',
    'outdoor_courts', 'surface',
  ];

  function parseCourtValue(value) {
    if (value == null || value === '') {
      return { count: 0, pinLabel: '?', tagLabel: 'courts n/a', detail: null };
    }
    if (typeof value === 'number') {
      return { count: value, pinLabel: String(value), tagLabel: `${value} indoor`, detail: null };
    }
    const raw = String(value);
    const label = raw.match(/^\s*(\d+(?:[\u2013\u2014-]\d+)?)/)?.[1] || '?';
    return {
      count: parseInt(label, 10) || 0,
      pinLabel: label,
      tagLabel: label === '?' ? 'indoor courts n/a' : `${label} indoor`,
      detail: raw,
    };
  }

  function parseOutdoorValue(value) {
    if (value == null || value === '') return { tagLabel: '', detail: null };
    const raw = String(value);
    const label = raw.match(/^\s*(\d+(?:[\u2013\u2014-]\d+)?)/)?.[1];
    return {
      tagLabel: label ? `+ ${label} outdoor` : `+ ${raw}`,
      detail: label ? raw : null,
    };
  }

  function rowToVenue(r, idx) {
    const country = COUNTRY_FROM_NAME[(r.country || '').toUpperCase()]
                  || ((r.country || '').slice(0, 2).toUpperCase() || 'XX');
    const indoor = r.indoor_sand_courts;
    let courtsIndoor;
    if (!indoor || indoor === 'not_stated_publicly') courtsIndoor = null;
    else if (/^\d+$/.test(indoor)) courtsIndoor = parseInt(indoor, 10);
    else courtsIndoor = indoor;
    const indoorDisplay  = parseCourtValue(courtsIndoor);
    const outdoorDisplay = parseOutdoorValue(r.outdoor_courts_same_venue);
    return {
      category: 'indoor',
      id:        slug(`${country}-${r.facility_name || `idx-${idx}`}`),
      country,
      name:      r.facility_name,
      town:      r.town,
      address:   r.address,
      lat:       parseFloat(r.latitude),
      lng:       parseFloat(r.longitude),
      precision: r.coord_precision || 'address',
      type:      TYPE_LABELS[r.facility_type] || r.facility_type,
      courtsIndoor,
      courtCount:    indoorDisplay.count,
      courtPinLabel: indoorDisplay.pinLabel,
      courtTagLabel: indoorDisplay.tagLabel,
      courtDetail:   indoorDisplay.detail,
      courtsOutdoor:   r.outdoor_courts_same_venue || null,
      outdoorTagLabel: outdoorDisplay.tagLabel,
      outdoorDetail:   outdoorDisplay.detail,
      currency:  r.currency,
      priceNote: r.price_notes,
      url:       r.booking_or_info_url,
    };
  }

  function rowToOutdoor(r, idx) {
    const lipasId = r.lipas_id || `idx-${idx}`;
    const courts = parseInt(r.outdoor_courts, 10) || 0;
    return {
      category: 'outdoor',
      id:       `fi-out-${lipasId}`,
      country:  'FI',
      name:     r.facility_name,
      town:     r.town,
      address:  r.address,
      lat:      parseFloat(r.latitude),
      lng:      parseFloat(r.longitude),
      precision: r.coord_precision || 'address',
      courts,
      courtsLabel: r.outdoor_courts || '',
      surface:  r.surface || '',
      lighting: r.lighting === 'yes',
      freeUse:  r.free_use === 'yes',
      access:   r.access || 'public',
      owner:    r.owner || '',
      lipasId,
      url:      r.source_url || '',
    };
  }

  // Sums marker._courts across a Leaflet markercluster cluster. Markers whose
  // _courts is missing or zero (unknown-courts venues, e.g. "courts n/a"
  // indoor halls) still contribute 1 to the total so they don't silently
  // disappear from a mixed cluster. A cluster of all-unknown markers therefore
  // shows the venue count, matching the previous fallback behaviour.
  function clusterCourtTotal(cluster) {
    let total = 0;
    for (const m of cluster.getAllChildMarkers()) {
      const c = m.options._courts;
      total += (typeof c === 'number' && c > 0) ? c : 1;
    }
    return total;
  }

  return {
    COUNTRIES, COUNTRY_FROM_NAME, TYPE_LABELS, OUTDOOR_COLOR, VALID_MODES,
    INDOOR_REQUIRED_COLUMNS, OUTDOOR_REQUIRED_COLUMNS,
    escapeHtml, safeUrl, slug, matchesQuery, debounce,
    parseCsv, parseCourtValue, parseOutdoorValue, validateCsvSchema,
    rowToVenue, rowToOutdoor, clusterCourtTotal,
    parseHash, serializeHash,
  };
}));
