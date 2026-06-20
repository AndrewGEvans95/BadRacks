/* ===================================================================
   Bad Racks Seattle — app.js
   - Renders cards with lazy-loaded OpenStreetMap mini-maps (Leaflet)
   - Grid / Map view toggle (one shared full map instance)
   - Live search + one-tap "type of bad" filter chips
   =================================================================== */

(function () {
  'use strict';

  /* ---- state ---- */
  const state = { query: '', type: 'all', view: 'grid' };

  /* ---- el refs ---- */
  const grid        = document.getElementById('rack-grid');
  const mapView     = document.getElementById('map-view');
  const countEl     = document.getElementById('rack-count');
  const chipsEl     = document.getElementById('chips');
  const searchInput = document.getElementById('search-input');
  const toggleBtns  = document.querySelectorAll('.view-toggle button');

  let fullMap = null;        // Leaflet instance for Map View
  let fullMapMarkers = [];   // current markers on the full map

  /* ---- helpers ---- */
  function escapeHtml(str) {
    const d = document.createElement('div');
    d.textContent = str;
    return d.innerHTML;
  }
  function mapsUrl(rack) {
    return 'https://www.google.com/maps/search/?api=1&query=' +
      encodeURIComponent(rack.address);
  }
  function gradeFamily(grade) { return (grade || 'F').trim().charAt(0).toUpperCase(); }

  function pinIcon(rack) {
    return L.divIcon({
      className: '',
      html: '<div class="rack-pin" data-g="' + gradeFamily(rack.grade) + '"><span>' +
            escapeHtml(gradeFamily(rack.grade)) + '</span></div>',
      iconSize: [26, 26],
      iconAnchor: [13, 26],
      popupAnchor: [0, -24]
    });
  }

  function popupHtml(rack) {
    return (
      '<div class="popup-title"><span class="popup-grade">' + escapeHtml(rack.grade) + '</span>' +
      escapeHtml(rack.nickname) + '</div>' +
      '<div class="popup-type">' + escapeHtml(rack.type) + ' · ' + escapeHtml(rack.neighborhood) + '</div>' +
      '<a class="popup-link" href="' + mapsUrl(rack) + '" target="_blank" rel="noopener noreferrer">Open in Google Maps →</a>'
    );
  }

  /* ---- filtering ---- */
  function getFiltered() {
    const q = state.query.trim().toLowerCase();
    return racks.filter(function (r) {
      const typeOk = state.type === 'all' || r.type === state.type;
      if (!typeOk) return false;
      if (!q) return true;
      return (
        r.nickname.toLowerCase().includes(q) ||
        r.neighborhood.toLowerCase().includes(q) ||
        r.type.toLowerCase().includes(q) ||
        r.address.toLowerCase().includes(q) ||
        r.description.toLowerCase().includes(q)
      );
    });
  }

  /* ---- lazy mini-map init via IntersectionObserver ---- */
  const miniObserver = ('IntersectionObserver' in window)
    ? new IntersectionObserver(function (entries, obs) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            initMiniMap(entry.target);
            obs.unobserve(entry.target);
          }
        });
      }, { rootMargin: '200px' })
    : null;

  function initMiniMap(el) {
    if (el.dataset.ready === '1') return;
    el.dataset.ready = '1';
    const lat = parseFloat(el.dataset.lat);
    const lng = parseFloat(el.dataset.lng);
    const grade = el.dataset.grade;

    const m = L.map(el, {
      zoomControl: false, attributionControl: false,
      dragging: false, scrollWheelZoom: false, doubleClickZoom: false,
      boxZoom: false, keyboard: false, touchZoom: false, tap: false,
      fadeAnimation: false
    }).setView([lat, lng], 15);

    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19, crossOrigin: true
    }).addTo(m);

    L.marker([lat, lng], {
      icon: L.divIcon({
        className: '',
        html: '<div class="rack-pin" data-g="' + grade + '"><span>' + escapeHtml(grade) + '</span></div>',
        iconSize: [26, 26], iconAnchor: [13, 26]
      }),
      keyboard: false, interactive: false
    }).addTo(m);

    const loading = el.querySelector('.card-map-loading');
    if (loading) loading.remove();
  }

  /* ---- card render ---- */
  function createCard(rack) {
    const card = document.createElement('article');
    card.className = 'rack-card';

    const gf = gradeFamily(rack.grade);

    card.innerHTML =
      '<div class="card-map" data-lat="' + rack.lat + '" data-lng="' + rack.lng +
        '" data-grade="' + escapeHtml(rack.grade) + '" role="img" aria-label="Map showing the location of ' +
        escapeHtml(rack.nickname) + ' near ' + escapeHtml(rack.address) + '">' +
        '<div class="card-map-loading">Locating…</div>' +
        '<div class="grade-stamp" data-g="' + gf + '" title="Severity grade ' + escapeHtml(rack.grade) +
          '" aria-label="Severity grade ' + escapeHtml(rack.grade) + '">' + escapeHtml(rack.grade) + '</div>' +
      '</div>' +
      '<div class="card-body">' +
        '<span class="badge">' + escapeHtml(rack.type) + '</span>' +
        '<h2 class="card-title">' + escapeHtml(rack.nickname) + '</h2>' +
        '<p class="card-location">' +
          '<span class="pin" aria-hidden="true">◆</span>' +
          '<span><span class="neighborhood">' + escapeHtml(rack.neighborhood) + '</span> ' +
          '<span class="address">' + escapeHtml(rack.address) + '</span></span>' +
        '</p>' +
        '<p class="card-description">' + escapeHtml(rack.description) + '</p>' +
        '<div class="card-actions">' +
          '<a class="btn-map" href="' + mapsUrl(rack) + '" target="_blank" rel="noopener noreferrer" ' +
            'aria-label="Open ' + escapeHtml(rack.nickname) + ' in Google Maps">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" ' +
              'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
              '<path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0Z"/><circle cx="12" cy="10" r="3"/></svg>' +
            'Open in Maps</a>' +
        '</div>' +
      '</div>';

    return card;
  }

  function renderGrid(list) {
    grid.innerHTML = '';

    if (list.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'no-results';
      empty.innerHTML =
        '<div class="big">No racks here</div>' +
        '<p>Nothing matches your search and filters. Try widening the net.</p>' +
        '<button type="button" id="reset-filters">Clear filters</button>';
      grid.appendChild(empty);
      const reset = document.getElementById('reset-filters');
      if (reset) reset.addEventListener('click', resetFilters);
      return;
    }

    const frag = document.createDocumentFragment();
    list.forEach(function (rack) {
      const card = createCard(rack);
      frag.appendChild(card);
    });
    grid.appendChild(frag);

    // attach observers (or eager-init if unsupported)
    grid.querySelectorAll('.card-map').forEach(function (el) {
      if (miniObserver) miniObserver.observe(el);
      else initMiniMap(el);
    });
  }

  function updateCount(n) {
    const total = racks.length;
    if (n === total) {
      countEl.innerHTML = 'Cataloging <strong>' + total + '</strong> bad racks';
    } else {
      countEl.innerHTML = 'Showing <strong>' + n + '</strong> of ' + total + ' racks';
    }
  }

  /* ---- full map (Map View) ---- */
  function ensureFullMap() {
    if (fullMap) return;
    fullMap = L.map('fullmap', { scrollWheelZoom: true })
      .setView([47.62, -122.34], 12);
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(fullMap);
  }

  function updateFullMapMarkers(list) {
    if (!fullMap) return;
    fullMapMarkers.forEach(function (m) { fullMap.removeLayer(m); });
    fullMapMarkers = [];
    if (list.length === 0) return;

    const latlngs = [];
    list.forEach(function (rack) {
      const marker = L.marker([rack.lat, rack.lng], { icon: pinIcon(rack) })
        .addTo(fullMap)
        .bindPopup(popupHtml(rack));
      fullMapMarkers.push(marker);
      latlngs.push([rack.lat, rack.lng]);
    });
    if (latlngs.length === 1) fullMap.setView(latlngs[0], 15);
    else fullMap.fitBounds(latlngs, { padding: [40, 40] });
  }

  /* ---- chips ---- */
  function buildChips() {
    const counts = {};
    racks.forEach(function (r) { counts[r.type] = (counts[r.type] || 0) + 1; });
    const types = Object.keys(counts).sort();

    const defs = [{ key: 'all', label: 'All', n: racks.length }]
      .concat(types.map(function (t) { return { key: t, label: t, n: counts[t] }; }));

    chipsEl.innerHTML = '';
    defs.forEach(function (d) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'chip';
      btn.dataset.type = d.key;
      btn.setAttribute('aria-pressed', d.key === state.type ? 'true' : 'false');
      btn.innerHTML = escapeHtml(d.label) + '<span class="chip-count">' + d.n + '</span>';
      btn.addEventListener('click', function () {
        state.type = d.key;
        chipsEl.querySelectorAll('.chip').forEach(function (c) {
          c.setAttribute('aria-pressed', c.dataset.type === state.type ? 'true' : 'false');
        });
        render();
      });
      chipsEl.appendChild(btn);
    });
  }

  /* ---- view switching ---- */
  function setView(view) {
    state.view = view;
    toggleBtns.forEach(function (b) {
      b.setAttribute('aria-pressed', b.dataset.view === view ? 'true' : 'false');
    });
    if (view === 'map') {
      grid.classList.add('hidden');
      mapView.classList.add('active');
      ensureFullMap();
      // Leaflet needs a size recalc when its container becomes visible
      setTimeout(function () {
        fullMap.invalidateSize();
        updateFullMapMarkers(getFiltered());
      }, 60);
    } else {
      mapView.classList.remove('active');
      grid.classList.remove('hidden');
    }
  }

  /* ---- master render ---- */
  function render() {
    const list = getFiltered();
    updateCount(list.length);
    if (state.view === 'grid') renderGrid(list);
    else { ensureFullMap(); fullMap.invalidateSize(); updateFullMapMarkers(list); }
  }

  function resetFilters() {
    state.query = '';
    state.type = 'all';
    if (searchInput) searchInput.value = '';
    buildChips();
    render();
  }

  /* ---- init ---- */
  document.addEventListener('DOMContentLoaded', function () {
    buildChips();
    render();

    if (searchInput) {
      searchInput.addEventListener('input', function () {
        state.query = this.value;
        render();
      });
      searchInput.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') { this.value = ''; state.query = ''; render(); this.blur(); }
      });
    }

    toggleBtns.forEach(function (b) {
      b.addEventListener('click', function () { setView(b.dataset.view); });
    });
  });
})();
