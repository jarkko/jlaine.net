(function (root) {
  'use strict';

  const { COUNTRIES, OUTDOOR_COLOR, escapeHtml, safeUrl, ctaLabelFor } = root.BVMap;
  const { ce } = root.BVDom;

  function venueTagDescriptors(venue) {
    const tags = [];
    if (venue.category === 'indoor') {
      tags.push({
        className: 'tag tag--strong',
        text: venue.courtsIndoor == null ? 'courts n/a' : venue.courtTagLabel,
        title: venue.courtDetail || null,
      });
      if (venue.outdoorTagLabel) {
        tags.push({ className: 'tag tag--out', text: venue.outdoorTagLabel, title: venue.outdoorDetail || null });
      }
      if (venue.currency) tags.push({ className: 'tag', text: venue.currency });
    } else {
      const courtText = venue.courtsLabel
        ? `${venue.courtsLabel} court${venue.courts !== 1 ? 's' : ''}`
        : 'outdoor sand';
      tags.push({ className: 'tag tag--out', text: courtText });
      if (venue.surface) tags.push({ className: 'tag', text: venue.surface });
      if (venue.freeUse) tags.push({ className: 'tag', text: 'free' });
      if (venue.lighting) tags.push({ className: 'tag', text: 'lit' });
    }
    if (venue.precision === 'town') {
      tags.push({
        className: 'tag tag--note',
        text: '~ town',
        title: 'Marker placed at town level — address-precise location not yet verified',
      });
    }
    return tags;
  }

  function popupTagsHtml(venue) {
    return venueTagDescriptors(venue)
      .map((tag) => {
        const title = tag.title ? ` title="${escapeHtml(tag.title)}"` : '';
        return `<span class="${tag.className}"${title}>${escapeHtml(tag.text)}</span>`;
      })
      .join('');
  }

  function buildPopup(venue) {
    const country = COUNTRIES[venue.country] || { flag: '', name: venue.country };
    const url = safeUrl(venue.url);
    const ctaClass = venue.category === 'outdoor' ? 'popup__cta popup__cta--out' : 'popup__cta';
    const ctaLabel = ctaLabelFor(venue);
    const cta =
      url && ctaLabel
        ? `<a class="${ctaClass}" href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer">${ctaLabel}</a>`
        : '';
    const location = venue.town
      ? `${escapeHtml(venue.town)}<br/>${escapeHtml(venue.address)}`
      : escapeHtml(venue.address);
    const price = venue.priceNote ? `<p class="popup__price">${escapeHtml(venue.priceNote)}</p>` : '';
    return `
      <div>
        <h3 class="popup__name">${escapeHtml(venue.name)}</h3>
        <div class="popup__meta">${country.flag} ${escapeHtml(country.name)} · ${location}</div>
        <div class="popup__row">${popupTagsHtml(venue)}</div>
        ${price}
        ${cta}
      </div>`;
  }

  function cardMetaTags(venue) {
    return venueTagDescriptors(venue).map((tag) => ce('span', { class: tag.className, title: tag.title }, tag.text));
  }

  function buildCard(venue, { selectedId, onSelectVenue, closeOnMobile }) {
    const isOutdoor = venue.category === 'outdoor';
    const country = isOutdoor
      ? { flag: '🏐', color: OUTDOOR_COLOR }
      : COUNTRIES[venue.country] || { flag: '', color: '#0f172a' };
    const item = ce('li', { class: 'venue-list__item' });
    const card = ce('button', {
      class: 'card' + (isOutdoor ? ' card--outdoor' : ''),
      type: 'button',
      'data-id': venue.id,
      'aria-current': selectedId === venue.id ? 'true' : 'false',
      style: `--country:${country.color}`,
      onclick: () => {
        onSelectVenue(venue.id, { fly: true, openPopup: true });
        if (window.matchMedia('(max-width: 700px)').matches) closeOnMobile();
      },
    });
    const flag = ce('span', { class: 'card__flag', 'aria-hidden': 'true' }, country.flag);
    const body = ce('div', { class: 'card__body' });
    const name = ce('div', { class: 'card__name' }, venue.name);
    const townText = venue.town ? `${venue.town} · ${venue.address}` : venue.address;
    const town = ce('div', { class: 'card__town' }, townText);
    const meta = ce('div', { class: 'card__meta' });
    cardMetaTags(venue).forEach((tag) => meta.append(tag));
    body.append(name, town, meta);
    card.append(flag, body);
    item.append(card);
    return item;
  }

  function buildSkeletonCard() {
    const item = ce('li', { class: 'venue-list__item' });
    const card = ce('div', { class: 'card card--skeleton', 'aria-hidden': 'true' });
    const flag = ce('span', { class: 'skel skel--flag' });
    const body = ce('div', { class: 'card__body' });
    body.append(
      ce('span', { class: 'skel skel--block skel--name' }),
      ce('span', { class: 'skel skel--block skel--town' }),
      ce(
        'div',
        { class: 'card__meta' },
        ce('span', { class: 'skel skel--tag' }),
        ce('span', { class: 'skel skel--tag' }),
      ),
    );
    card.append(flag, body);
    item.append(card);
    return item;
  }

  root.BVVenueView = Object.freeze({ buildCard, buildPopup, buildSkeletonCard, venueTagDescriptors });
})(window);
