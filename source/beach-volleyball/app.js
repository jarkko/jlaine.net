(function (root) {
  'use strict';

  const { $ } = root.BVDom;
  const { parseHash, serializeHash } = root.BVMap;
  const { createDataStore } = root.BVDataLoader;
  const { createMapView } = root.BVMapView;
  const { createSidebarView } = root.BVSidebarView;

  const state = {
    category: 'indoor',
    country: 'all',
    query: '',
    selectedId: null,
    sidebarOpen: false,
    returnFocusTo: null,
  };

  const data = createDataStore();
  let mapView;
  let modeChangeToken = 0;
  let sidebarView;

  function applyHashToState() {
    const { mode, country, q, venue } = parseHash(location.hash);
    state.category = mode;
    state.country = mode === 'outdoor' && country !== 'all' && country !== 'FI' ? 'all' : country;
    state.query = q;
    state.selectedId = venue || null;
    const search = $('#search');
    if (search && search.value !== q) search.value = q;
  }

  function syncHash(push = false) {
    const target = serializeHash({
      mode: state.category,
      country: state.country,
      q: state.query,
      venue: state.selectedId || '',
    });
    if (location.hash !== target) {
      if (push) history.pushState(null, '', target);
      else history.replaceState(null, '', target);
    }
  }

  function render() {
    sidebarView.render();
    mapView.syncMarkers();
  }

  function visibleVenuesForCountry(country) {
    const venues = data.venuesForMode(state.category);
    return country === 'all' ? venues : venues.filter((venue) => venue.country === country);
  }

  function selectCountry(id) {
    state.country = id;
    if (state.selectedId && id !== 'all') {
      const selected = data.findVenue(state.selectedId);
      if (selected && selected.country !== id) mapView.closePopup();
    }
    render();
    syncHash(false);
    const filtered = visibleVenuesForCountry(id);
    if (filtered.length) mapView.fitVenues(filtered, { padding: [60, 60], maxZoom: 7, fly: true });
  }

  function updateModeButtons(mode) {
    document.querySelectorAll('.mode-btn').forEach((button) => {
      button.setAttribute('aria-pressed', button.dataset.mode === mode ? 'true' : 'false');
    });
  }

  async function setMode(mode, { resetCountry = true, push = true, fitToBounds = true } = {}) {
    const token = ++modeChangeToken;
    state.category = mode;
    if (resetCountry) state.country = 'all';
    updateModeButtons(mode);
    syncHash(push);

    if (mode !== 'indoor' && !data.outdoorLoaded) {
      render();
      try {
        await data.loadOutdoorCsv();
      } catch (error) {
        if (token !== modeChangeToken || state.category !== mode) return;
        console.error('[nordic-bv-map] outdoor data failed:', error);
        const hint = $('#hint');
        if (hint) hint.textContent = 'Failed to load outdoor court data: ' + error.message;
        return;
      }
      if (token !== modeChangeToken || state.category !== mode) return;
    }

    if (token !== modeChangeToken || state.category !== mode) return;
    render();

    if (fitToBounds) {
      const venues = mode === 'both' ? [...data.indoorVenues, ...data.outdoorVenues] : data.venuesForMode(mode);
      mapView.fitVenues(venues, { padding: [40, 40], maxZoom: mode === 'outdoor' ? 5 : 6 });
    }
  }

  function selectVenue(id, { fly = true, openPopup = true } = {}) {
    state.selectedId = id;
    document.querySelectorAll('.card').forEach((card) => {
      card.setAttribute('aria-current', card.dataset.id === id ? 'true' : 'false');
    });

    const venue = data.findVenue(id);
    const marker = mapView.getMarker(id);
    if (!venue || !marker) {
      state.selectedId = null;
      syncHash(false);
      return;
    }

    if (state.country !== 'all' && venue.country !== state.country) {
      state.country = 'all';
      render();
    }

    syncHash(false);
    mapView.focusVenue(venue, marker, { fly, openPopup });

    const card = document.querySelector(`.card[data-id="${CSS.escape(id)}"]`);
    if (card && state.sidebarOpen) card.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }

  function onPopupOpen(id) {
    if (id && id !== state.selectedId) selectVenue(id, { fly: false, openPopup: false });
  }

  function onPopupClose(id) {
    if (id && id === state.selectedId) {
      state.selectedId = null;
      document
        .querySelectorAll('.card[aria-current="true"]')
        .forEach((card) => card.setAttribute('aria-current', 'false'));
      syncHash(false);
    }
  }

  function attachHashNavigation() {
    window.addEventListener('hashchange', async () => {
      const prevCategory = state.category;
      const prevCountry = state.country;
      const prevQuery = state.query;
      const prevVenue = state.selectedId || '';
      applyHashToState();
      const modeChanged = state.category !== prevCategory;
      const filtersChanged = state.country !== prevCountry || state.query !== prevQuery;
      const venueChanged = (state.selectedId || '') !== prevVenue;

      if (modeChanged) {
        await setMode(state.category, {
          resetCountry: false,
          push: false,
          fitToBounds: !state.selectedId,
        });
      } else if (filtersChanged) {
        render();
      }

      if (venueChanged) {
        if (prevVenue) mapView.getMarker(prevVenue)?.closePopup();
        if (state.selectedId) selectVenue(state.selectedId, { fly: true, openPopup: true });
        else mapView.closePopup();
      }
    });
  }

  async function boot() {
    mapView = createMapView({
      state,
      data,
      onMarkerClick: selectVenue,
      onPopupOpen,
      onPopupClose,
    });
    data.setMarkerFactory(mapView.makeMarker);
    sidebarView = createSidebarView({
      state,
      data,
      onSelectCountry: selectCountry,
      onSelectVenue: selectVenue,
      onSetMode: setMode,
      onSearchChanged: (value) => {
        state.query = value;
        sidebarView.renderList();
        syncHash(false);
      },
      closePopup: mapView.closePopup,
    });

    try {
      applyHashToState();
      updateModeButtons(state.category);
      await data.loadIndoorCsv();

      if (state.category !== 'indoor') {
        try {
          await data.loadOutdoorCsv();
        } catch {
          // Keep the indoor map usable if optional outdoor data fails at boot.
        }
      }

      const initialVenues =
        state.category === 'both'
          ? [...data.indoorVenues, ...(data.outdoorLoaded ? data.outdoorVenues : [])]
          : data.venuesForMode(state.category);
      mapView.fitVenues(initialVenues.length ? initialVenues : data.indoorVenues, {
        padding: [40, 40],
        maxZoom: state.category === 'outdoor' ? 5 : 6,
        animate: false,
      });
      mapView.markReady();

      if (state.selectedId && !data.findVenue(state.selectedId)) state.selectedId = null;

      render();
      sidebarView.attachEvents();
      attachHashNavigation();

      if (state.selectedId) selectVenue(state.selectedId, { fly: true, openPopup: true });
      else syncHash(false);
    } catch (error) {
      console.error('[nordic-bv-map] boot failed:', error);
      mapView.markReady();
      const hint = $('#hint');
      if (hint) hint.textContent = 'Failed to load venue data: ' + error.message;
    }
  }

  boot();
})(window);
