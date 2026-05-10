(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory(root);
  } else {
    root.BVMapView = factory(root);
  }
})(typeof self !== 'undefined' ? self : globalThis, function (root) {
  'use strict';

  const dataHelpers = root.BVMap || (typeof require === 'function' ? require('./map-data.js') : {});
  const { COUNTRIES = {}, escapeHtml = (value) => String(value) } = dataHelpers;
  const buildPopup = root.BVVenueView?.buildPopup || (() => '');

  function clusterCourtTotal(cluster) {
    let total = 0;
    for (const marker of cluster.getAllChildMarkers()) {
      const courts = marker.options._courts;
      total += typeof courts === 'number' && courts > 0 ? courts : 1;
    }
    return total;
  }

  function createMapView({ state, data, onMarkerClick, onPopupOpen, onPopupClose }) {
    const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const map = L.map('map', {
      zoomControl: false,
      scrollWheelZoom: true,
      worldCopyJump: false,
      fadeAnimation: !reducedMotion(),
      zoomAnimation: !reducedMotion(),
      markerZoomAnimation: !reducedMotion(),
    }).setView([63, 16], 4);

    L.control.zoom({ position: 'topright' }).addTo(map);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);

    const indoorLayer = L.markerClusterGroup({
      showCoverageOnHover: false,
      spiderfyOnMaxZoom: true,
      maxClusterRadius: (zoom) => (zoom < 5 ? 26 : zoom < 7 ? 18 : 12),
      zoomToBoundsOnClick: true,
      animateAddingMarkers: false,
      disableClusteringAtZoom: 9,
      iconCreateFunction: (cluster) => {
        const display = clusterCourtTotal(cluster);
        const countries = new Set(cluster.getAllChildMarkers().map((marker) => marker.options._country));
        const big = display >= 100;
        const country = countries.size === 1 ? [...countries][0] : null;
        const colour = country ? COUNTRIES[country]?.color || '#0f172a' : '#0f172a';
        return L.divIcon({
          className: 'bv-cluster' + (big ? ' bv-cluster--lg' : ''),
          html: `<span class="bv-cluster__inner" style="background:${colour}">${display}</span>`,
          iconSize: big ? [48, 48] : [40, 40],
        });
      },
    }).addTo(map);

    const outdoorLayer = L.markerClusterGroup({
      showCoverageOnHover: false,
      spiderfyOnMaxZoom: true,
      maxClusterRadius: (zoom) => (zoom < 6 ? 60 : zoom < 9 ? 40 : 20),
      zoomToBoundsOnClick: true,
      animateAddingMarkers: false,
      disableClusteringAtZoom: 12,
      iconCreateFunction: (cluster) =>
        L.divIcon({
          className: 'bv-out-cluster',
          html: `<span class="bv-out-cluster__inner">${clusterCourtTotal(cluster)}</span>`,
          iconSize: [36, 36],
        }),
    });

    const markerById = new Map();
    let flyToken = 0;

    const markerTypes = {
      indoor: {
        iconSize: [32, 32],
        iconAnchor: [16, 16],
        popupAnchor: [0, -16],
        popupOpts: { maxWidth: 320, minWidth: 240 },
        icon: (venue) => {
          const colour = COUNTRIES[venue.country]?.color || '#0f172a';
          return {
            className: 'bv-marker',
            html: `<span class="bv-marker__dot" style="--country:${colour}">${escapeHtml(venue.courtPinLabel)}</span>`,
          };
        },
        clusterCount: (venue) => venue.courtCount,
      },
      outdoor: {
        iconSize: [22, 22],
        iconAnchor: [11, 11],
        popupAnchor: [0, -11],
        popupOpts: { maxWidth: 280, minWidth: 200 },
        icon: (venue) => ({
          className: 'bv-out-marker',
          html: `<span class="bv-out-marker__dot">${escapeHtml(venue.courtsLabel || '')}</span>`,
        }),
        clusterCount: (venue) => venue.courts || 1,
      },
    };

    function makeMarker(venue) {
      const config = markerTypes[venue.category];
      const { className, html } = config.icon(venue);
      const icon = L.divIcon({
        className,
        html,
        iconSize: config.iconSize,
        iconAnchor: config.iconAnchor,
        popupAnchor: config.popupAnchor,
      });
      const marker = L.marker([venue.lat, venue.lng], {
        icon,
        title: venue.name,
        riseOnHover: true,
        _courts: config.clusterCount(venue),
        _country: venue.country,
        _venueId: venue.id,
      });
      marker.bindPopup(buildPopup(venue), { closeButton: true, ...config.popupOpts });
      marker.on('click', () => onMarkerClick(venue.id, { fly: false, openPopup: false }));
      markerById.set(venue.id, marker);
      return marker;
    }

    function syncMarkers() {
      const showIndoor = state.category !== 'outdoor';
      const showOutdoor = state.category !== 'indoor';

      indoorLayer.clearLayers();
      if (showIndoor) {
        const active = data.indoorVenues
          .filter((venue) => state.country === 'all' || venue.country === state.country)
          .map((venue) => markerById.get(venue.id))
          .filter(Boolean);
        indoorLayer.addLayers(active);
        if (!map.hasLayer(indoorLayer)) map.addLayer(indoorLayer);
      } else if (map.hasLayer(indoorLayer)) {
        map.removeLayer(indoorLayer);
      }

      if (showOutdoor && data.outdoorLoaded) {
        outdoorLayer.clearLayers();
        const active =
          state.country === 'all'
            ? data.outdoorVenues.map((venue) => markerById.get(venue.id)).filter(Boolean)
            : data.outdoorVenues
                .filter((venue) => venue.country === state.country)
                .map((venue) => markerById.get(venue.id))
                .filter(Boolean);
        outdoorLayer.addLayers(active);
        if (!map.hasLayer(outdoorLayer)) map.addLayer(outdoorLayer);
      } else if (map.hasLayer(outdoorLayer)) {
        map.removeLayer(outdoorLayer);
      }
    }

    function syncActiveMarker(id) {
      markerById.forEach((marker, markerId) => {
        const element = marker.getElement();
        if (element) element.classList.toggle('is-active', markerId === id);
      });
    }

    function fitVenues(venues, { padding = [40, 40], maxZoom = 6, animate = true, fly = false } = {}) {
      if (!venues.length) return;
      const bounds = L.latLngBounds(venues.map((venue) => [venue.lat, venue.lng]));
      const options = { padding, maxZoom };
      if (!animate) options.animate = false;
      if (fly && !reducedMotion()) map.flyToBounds(bounds, { ...options, duration: 0.55 });
      else map.fitBounds(bounds, options);
    }

    function focusVenue(venue, marker, { fly = true, openPopup = true } = {}) {
      const finish = () => {
        syncActiveMarker(venue.id);
        if (openPopup) marker.openPopup();
      };
      const alreadyOpen = openPopup && map._popup && map._popup._source === marker;
      if (alreadyOpen) return;
      if (!fly) {
        finish();
        return;
      }
      if (openPopup) map.closePopup();
      const targetZoom = Math.max(map.getZoom(), 11);
      const myToken = ++flyToken;
      if (reducedMotion()) {
        map.setView([venue.lat, venue.lng], targetZoom);
        finish();
      } else {
        map.flyTo([venue.lat, venue.lng], targetZoom, { duration: 0.6 });
        map.once('moveend', () => {
          if (myToken === flyToken) finish();
        });
      }
    }

    map.on('popupopen', (event) => {
      const id = event.popup._source?.options?._venueId;
      if (id) onPopupOpen(id);
    });
    map.on('popupclose', (event) => {
      const id = event.popup._source?.options?._venueId;
      if (id) onPopupClose(id);
    });

    return {
      map,
      markerById,
      closePopup: () => map.closePopup(),
      fitVenues,
      focusVenue,
      getMarker: (id) => markerById.get(id),
      makeMarker,
      markReady: () => document.getElementById('map')?.classList.add('is-ready'),
      syncActiveMarker,
      syncMarkers,
    };
  }

  return Object.freeze({ createMapView, clusterCourtTotal });
});
