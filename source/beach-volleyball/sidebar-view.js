(function (root) {
  'use strict';

  const { COUNTRIES, debounce, matchesQuery } = root.BVMap;
  const { $, ce } = root.BVDom;
  const { buildCard, buildSkeletonCard } = root.BVVenueView;

  const CARD_LIMIT = 100;
  const SIDEBAR_INERT_TARGETS = '.topbar, .map-wrap';
  const CSV_LINKS = {
    indoor: {
      href: 'nordic_indoor_beach_volleyball_facilities.csv',
      label: '↓ Indoor CSV',
      title: 'Download nordic indoor beach volleyball facilities (CSV)',
    },
    outdoor: {
      href: 'finland_outdoor_beach_volleyball_courts.csv',
      label: '↓ Outdoor CSV',
      title: 'Download Finland outdoor beach volleyball courts (CSV, LIPAS open data)',
    },
    both: {
      href: 'nordic_indoor_beach_volleyball_facilities.csv',
      label: '↓ Indoor CSV',
      title: 'Indoor CSV — outdoor data is available in outdoor mode',
    },
  };

  function createSidebarView({ state, data, onSelectCountry, onSelectVenue, onSetMode, onSearchChanged, closePopup }) {
    function setSidebar(open) {
      const sidebar = $('#sidebar');
      const toggle = $('#sidebar-toggle');
      state.sidebarOpen = open;
      if (open) state.returnFocusTo = document.activeElement;
      $('#layout').classList.toggle('is-open', open);
      sidebar.classList.toggle('is-open', open);
      sidebar.setAttribute('aria-hidden', open ? 'false' : 'true');
      if (open) sidebar.removeAttribute('inert');
      else sidebar.setAttribute('inert', '');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      document.querySelectorAll(SIDEBAR_INERT_TARGETS).forEach((element) => {
        if (open) element.setAttribute('inert', '');
        else element.removeAttribute('inert');
      });
      if (open) {
        requestAnimationFrame(() => $('#search')?.focus({ preventScroll: true }));
      } else if (state.returnFocusTo && document.contains(state.returnFocusTo)) {
        state.returnFocusTo.focus({ preventScroll: true });
        state.returnFocusTo = null;
      }
    }

    function renderChips() {
      const chips = $('#chips');
      chips.innerHTML = '';
      if (state.category === 'outdoor') return;

      const make = (id, label, color) =>
        ce(
          'button',
          {
            class: 'chip',
            type: 'button',
            'aria-pressed': state.country === id ? 'true' : 'false',
            'data-country': id,
            onclick: () => onSelectCountry(id),
          },
          color ? ce('span', { class: 'chip__dot', style: `background:${color}` }) : null,
          label,
        );

      chips.append(make('all', 'All'));
      Object.entries(COUNTRIES).forEach(([code, country]) => {
        chips.append(make(code, `${country.flag} ${country.name}`, country.color));
      });
    }

    function renderModeNotice() {
      const notice = $('#mode-notice');
      if (!notice) return;
      if (state.category === 'outdoor') {
        notice.hidden = false;
        notice.textContent = '🇫🇮 Finland outdoor sand courts · LIPAS open data (CC BY 4.0) · loose sand only';
      } else if (state.category === 'both') {
        notice.hidden = false;
        notice.textContent = '🌿 Outdoor courts: Finland only for now · more countries coming';
      } else {
        notice.hidden = true;
      }
    }

    function sortedFilteredVenues() {
      return data
        .venuesForMode(state.category)
        .filter((venue) => state.country === 'all' || venue.country === state.country)
        .filter((venue) => matchesQuery(venue, state.query.toLowerCase()))
        .sort((a, b) => {
          if (a.category !== b.category) return a.category === 'indoor' ? -1 : 1;
          if (a.category === 'indoor') return a.country.localeCompare(b.country) || a.name.localeCompare(b.name);
          return (a.town || '').localeCompare(b.town || '') || a.name.localeCompare(b.name);
        });
    }

    function renderList() {
      const list = $('#venues');
      const hint = $('#hint');
      list.innerHTML = '';

      if (state.category !== 'indoor' && !data.outdoorLoaded && !data.outdoorError) {
        for (let index = 0; index < 5; index += 1) list.append(buildSkeletonCard());
      }

      const filtered = sortedFilteredVenues();
      filtered.slice(0, CARD_LIMIT).forEach((venue) =>
        list.append(
          buildCard(venue, {
            selectedId: state.selectedId,
            onSelectVenue,
            closeOnMobile: () => setSidebar(false),
          }),
        ),
      );

      const modeTotal =
        state.category === 'indoor'
          ? data.indoorVenues.length
          : state.category === 'outdoor'
            ? data.outdoorLoaded
              ? data.outdoorVenues.length
              : '…'
            : data.indoorVenues.length + (data.outdoorLoaded ? data.outdoorVenues.length : 0);
      $('#sidebar-toggle-count').textContent = String(modeTotal);

      if (state.category !== 'indoor' && data.outdoorError) {
        hint.textContent = 'Failed to load outdoor court data: ' + data.outdoorError.message;
      } else if (state.category !== 'indoor' && !data.outdoorLoaded) {
        hint.textContent = 'Loading outdoor courts…';
      } else if (filtered.length === 0) {
        hint.textContent = 'No venues match your filter.';
      } else {
        const single =
          state.category === 'indoor' ? 'indoor hall' : state.category === 'outdoor' ? 'outdoor sand court' : 'venue';
        const plural =
          state.category === 'indoor'
            ? 'indoor halls'
            : state.category === 'outdoor'
              ? 'outdoor sand courts'
              : 'venues';
        const label = filtered.length === 1 ? single : plural;
        hint.textContent =
          filtered.length > CARD_LIMIT
            ? `Showing ${CARD_LIMIT} of ${filtered.length} ${plural}. Search to narrow.`
            : `Showing ${filtered.length} ${label}.`;
      }
    }

    function renderDataLink() {
      const link = $('#data-link');
      if (!link) return;
      const config = CSV_LINKS[state.category] || CSV_LINKS.indoor;
      link.setAttribute('href', config.href);
      link.setAttribute('title', config.title);
      link.textContent = config.label;
    }

    function render() {
      renderModeNotice();
      renderChips();
      renderList();
      renderDataLink();
    }

    function trapSidebarFocus(event) {
      if (!state.sidebarOpen || event.key !== 'Tab') return;
      const focusable = [
        ...$('#sidebar').querySelectorAll(
          'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      ].filter((element) => element.offsetParent !== null);
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    const onSearchInput = debounce((value) => onSearchChanged(value), 120);

    function attachEvents() {
      $('#search').addEventListener('input', (event) => onSearchInput(event.target.value.trim()));
      $('#sidebar-toggle').addEventListener('click', () => setSidebar(!state.sidebarOpen));
      $('#sidebar-close').addEventListener('click', () => setSidebar(false));
      $('#sidebar-backdrop').addEventListener('click', () => setSidebar(false));
      $('#skip-link').addEventListener('click', (event) => {
        event.preventDefault();
        setSidebar(true);
      });
      document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && state.sidebarOpen) setSidebar(false);
        trapSidebarFocus(event);
      });
      document.querySelectorAll('.mode-btn').forEach((button) => {
        button.addEventListener('click', () => {
          closePopup();
          onSetMode(button.dataset.mode);
        });
      });
    }

    return { attachEvents, render, renderList, setSidebar };
  }

  root.BVSidebarView = Object.freeze({ createSidebarView });
})(window);
