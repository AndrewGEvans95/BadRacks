/* Bad Racks Seattle — app.js */

const BIKE_RACK_SVG = `<svg
  xmlns="http://www.w3.org/2000/svg"
  viewBox="0 0 80 80"
  width="72"
  height="72"
  fill="none"
  stroke="white"
  stroke-width="6"
  stroke-linecap="round"
  stroke-linejoin="round"
  aria-hidden="true"
>
  <!-- Top horizontal bar of the staple -->
  <line x1="18" y1="20" x2="62" y2="20" />
  <!-- Left vertical leg -->
  <line x1="18" y1="20" x2="18" y2="62" />
  <!-- Right vertical leg -->
  <line x1="62" y1="20" x2="62" y2="62" />
</svg>`;

function createRackCard(rack) {
  const card = document.createElement('article');
  card.className = 'rack-card';
  card.setAttribute('data-id', rack.id);

  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(rack.address)}`;

  card.innerHTML = `
    <div class="card-image" aria-label="Bike rack illustration">
      ${BIKE_RACK_SVG}
    </div>
    <div class="card-body">
      <span class="badge">${escapeHtml(rack.type)}</span>
      <h2 class="card-title">${escapeHtml(rack.nickname)}</h2>
      <p class="card-location">
        📍 <span class="neighborhood">${escapeHtml(rack.neighborhood)}</span>
        <span class="address">${escapeHtml(rack.address)}</span>
      </p>
      <p class="card-description">${escapeHtml(rack.description)}</p>
      <div class="card-actions">
        <a
          href="${mapsUrl}"
          class="btn-map"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="View ${escapeHtml(rack.nickname)} on Google Maps"
        >View on Map</a>
      </div>
    </div>
  `;

  return card;
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function renderRacks(racksToRender) {
  const grid = document.getElementById('rack-grid');
  const countEl = document.getElementById('rack-count');

  grid.innerHTML = '';

  if (racksToRender.length === 0) {
    const noResults = document.createElement('div');
    noResults.className = 'no-results';
    noResults.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="11" cy="11" r="8"/>
        <line x1="21" y1="21" x2="16.65" y2="16.65"/>
        <line x1="8" y1="11" x2="14" y2="11"/>
      </svg>
      <p>No racks found matching your search.</p>
      <small>Try a different neighborhood, type, or nickname.</small>
    `;
    grid.appendChild(noResults);

    if (countEl) {
      countEl.innerHTML = 'No results found';
    }
    return;
  }

  const fragment = document.createDocumentFragment();
  racksToRender.forEach(rack => {
    fragment.appendChild(createRackCard(rack));
  });
  grid.appendChild(fragment);

  if (countEl) {
    const total = racks.length;
    const showing = racksToRender.length;
    if (showing === total) {
      countEl.innerHTML = `Showing <strong>${total}</strong> bad rack${total !== 1 ? 's' : ''} across Seattle`;
    } else {
      countEl.innerHTML = `Showing <strong>${showing}</strong> of <strong>${total}</strong> racks`;
    }
  }
}

function filterRacks(query) {
  const term = query.trim().toLowerCase();
  if (!term) return racks;

  return racks.filter(rack => {
    return (
      rack.nickname.toLowerCase().includes(term) ||
      rack.neighborhood.toLowerCase().includes(term) ||
      rack.type.toLowerCase().includes(term) ||
      rack.address.toLowerCase().includes(term) ||
      rack.description.toLowerCase().includes(term)
    );
  });
}

document.addEventListener('DOMContentLoaded', function () {
  /* Initial render */
  renderRacks(racks);

  /* Search */
  const searchInput = document.getElementById('search-input');
  if (searchInput) {
    searchInput.addEventListener('input', function () {
      const filtered = filterRacks(this.value);
      renderRacks(filtered);
    });

    /* Clear search on Escape */
    searchInput.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') {
        this.value = '';
        renderRacks(racks);
        this.blur();
      }
    });
  }
});
