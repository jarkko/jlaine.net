(function (root) {
  'use strict';

  const { INDOOR_REQUIRED_COLUMNS, OUTDOOR_REQUIRED_COLUMNS, parseCsv, rowToOutdoor, rowToVenue, validateCsvSchema } =
    root.BVMap;

  function createDataStore() {
    let markerFactory = () => {};
    const store = {
      indoorVenues: [],
      outdoorVenues: [],
      outdoorError: null,
      outdoorLoaded: false,
      outdoorLoading: null,

      setMarkerFactory(factory) {
        markerFactory = factory;
      },

      allVenues() {
        return [...store.indoorVenues, ...store.outdoorVenues];
      },

      findVenue(id) {
        return (
          store.indoorVenues.find((venue) => venue.id === id) || store.outdoorVenues.find((venue) => venue.id === id)
        );
      },

      venuesForMode(mode) {
        if (mode === 'indoor') return store.indoorVenues;
        if (mode === 'outdoor') return store.outdoorLoaded ? store.outdoorVenues : [];
        return [...store.indoorVenues, ...(store.outdoorLoaded ? store.outdoorVenues : [])];
      },

      async loadIndoorCsv() {
        const response = await fetch('nordic_indoor_beach_volleyball_facilities.csv');
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const rows = validateCsvSchema(parseCsv(await response.text()), INDOOR_REQUIRED_COLUMNS, 'indoor CSV');
        store.indoorVenues = rows
          .map(rowToVenue)
          .filter((venue) => Number.isFinite(venue.lat) && Number.isFinite(venue.lng));
        if (!store.indoorVenues.length) throw new Error('indoor CSV produced 0 geocoded rows');
        store.indoorVenues.forEach(markerFactory);
      },

      async loadOutdoorCsv() {
        if (store.outdoorLoaded) return;
        if (store.outdoorLoading) return store.outdoorLoading;
        store.outdoorLoading = (async () => {
          store.outdoorError = null;
          try {
            const response = await fetch('finland_outdoor_beach_volleyball_courts.csv');
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const rows = validateCsvSchema(parseCsv(await response.text()), OUTDOOR_REQUIRED_COLUMNS, 'outdoor CSV');
            store.outdoorVenues = rows
              .map(rowToOutdoor)
              .filter((venue) => Number.isFinite(venue.lat) && Number.isFinite(venue.lng));
            store.outdoorVenues.forEach(markerFactory);
            store.outdoorLoaded = true;
          } catch (error) {
            store.outdoorError = error;
            throw error;
          }
        })();
        try {
          return await store.outdoorLoading;
        } finally {
          store.outdoorLoading = null;
        }
      },
    };
    return store;
  }

  root.BVDataLoader = Object.freeze({ createDataStore });
})(window);
