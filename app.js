/* ===================================================================
   Bad Racks Seattle — app.js
   - Each card shows a static OpenStreetMap image (1 request, no JS map
     instance) so the grid is fast and can never get stuck "loading".
   - Map View uses a single Leaflet map, loaded defensively: if Leaflet
     fails to load, the rest of the app still works.
   - Live search + one-tap "type of bad" filter chips + grid/map toggle.
   =================================================================== */

(function () {
  'use strict';

  /* ---- state ---- */
  var state = { query: '', type: 'all', view: 'grid' };

  /* ---- el refs ---- */
  var grid        = document.getElementById('rack-grid');
  var mapView     = document.getElementById('map-view');
  var countEl     = document.getElementById('rack-count');
  var chipsEl     = document.getElementById('chips');
  var searchInput = document.getElementById('search-input');
  var toggleBtns  = document.querySelectorAll('.view-toggle button');

  var hasLeaflet  = (typeof L !== 'undefined');
  var fullMap     = null;
  var fullMarkers = [];

  /* ---- helpers ---- */
  function esc(str) {
    var d = document.createElement('div');
    d.textContent = (str == null ? '' : String(str));
    return d.innerHTML;
  }
  function attr(str) {
    return esc(str).replace(/"/g, '&quot;');
  }
  function mapsUrl(rack) {
    return 'https://www.google.com/maps/search/?api=1&query=' +
      encodeURIComponent(rack.address);
  }
  function gradeFamily(grade) {
    return (grade || 'F').trim().charAt(0).toUpperCase();
  }
  /* Static map thumbnail centered on the rack. We overlay our own pin
     at dead-center (the image is centered on the coordinates). */
  function staticMapUrl(rack) {
    return 'https://staticmap.openstreetmap.de/staticmap.php?center=' +
      rack.lat + ',' + rack.lng + '&zoom=15&size=400x220';
  }

  /* ---- filtering ---- */
  function getFiltered() {
    var q = state.query.trim().toLowerCase();
    return racks.filter(function (r) {
      if (state.type !== 'all' && r.type !== state.type) return false;
      if (!q) return true;
      return (
        r.nickname.toLowerCase().indexOf(q) > -1 ||
        r.neighborhood.toLowerCase().indexOf(q) > -1 ||
        r.type.toLowerCase().indexOf(q) > -1 ||
        r.address.toLowerCase().indexOf(q) > -1 ||
        r.description.toLowerCase().indexOf(q) > -1
      );
    });
  }

  /* ---- card render ---- */
  function createCard(rack) {
    var card = document.createElement('article');
    card.className = 'rack-card';
    var gf = gradeFamily(rack.grade);

    card.innerHTML =
      '<div class="card-map">' +
        '<img class="card-tile" loading="lazy" alt="Map of ' + attr(rack.neighborhood) +
          ' near ' + attr(rack.address) + '" src="' + attr(staticMapUrl(rack)) + '" ' +
          'onerror="this.closest(\'.card-map\').classList.add(\'map-failed\')" />' +
        '<div class="map-fallback" aria-hidden="true">' +
          '<span class="mf-hood">' + esc(rack.neighborhood) + '</span>' +
          '<span class="mf-coord">' + rack.lat.toFixed(4) + ', ' + rack.lng.toFixed(4) + '</span>' +
        '</div>' +
        '<div class="map-pin" aria-hidden="true">' +
          '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">' +
          '<path d="M12 2a7 7 0 0 0-7 7c0 5 7 13 7 13s7-8 7-13a7 7 0 0 0-7-7Z"/>' +
          '<circle cx="12" cy="9" r="2.6" fill="#fff"/></svg>' +
        '</div>' +
        '<div class="grade-stamp" data-g="' + gf + '" title="Severity grade ' + attr(rack.grade) +
          '" aria-label="Severity grade ' + attr(rack.grade) + '">' + esc(rack.grade) + '</div>' +
      '</div>' +
      '<div class="card-body">' +
        '<span class="badge">' + esc(rack.type) + '</span>' +
        '<h2 class="card-title">' + esc(rack.nickname) + '</h2>' +
        '<p class="card-location">' +
          '<span class="pin" aria-hidden="true">◆</span>' +
          '<span><span class="neighborhood">' + esc(rack.neighborhood) + '</span> ' +
          '<span class="address">' + esc(rack.address) + '</span></span>' +
        '</p>' +
        '<p class="card-description">' + esc(rack.description) + '</p>' +
        '<div class="card-actions">' +
          '<a class="btn-map" href="' + attr(mapsUrl(rack)) + '" target="_blank" rel="noopener noreferrer" ' +
            'aria-label="Open ' + attr(rack.nickname) + ' in Google Maps">' +
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
      var empty = document.createElement('div');
      empty.className = 'no-results';
      empty.innerHTML =
        '<div class="big">No racks here</div>' +
        '<p>Nothing matches your search and filters. Try widening the net.</p>' +
        '<button type="button" id="reset-filters">Clear filters</button>';
      grid.appendChild(empty);
      var reset = document.getElementById('reset-filters');
      if (reset) reset.addEventListener('click', resetFilters);
      return;
    }

    var frag = document.createDocumentFragment();
    list.forEach(function (rack) { frag.appendChild(createCard(rack)); });
    grid.appendChild(frag);
  }

  function updateCount(n) {
    var total = racks.length;
    countEl.innerHTML = (n === total)
      ? 'Cataloging <strong>' + total + '</strong> bad racks'
      : 'Showing <strong>' + n + '</strong> of ' + total + ' racks';
  }

  /* ---- Map View (Leaflet, defensive) ---- */
  function pinIcon(rack) {
    return L.divIcon({
      className: '',
      html: '<div class="rack-pin" data-g="' + gradeFamily(rack.grade) + '"><span>' +
            esc(gradeFamily(rack.grade)) + '</span></div>',
      iconSize: [26, 26], iconAnchor: [13, 26], popupAnchor: [0, -24]
    });
  }
  function popupHtml(rack) {
    return '<div class="popup-title"><span class="popup-grade">' + esc(rack.grade) + '</span>' +
      esc(rack.nickname) + '</div>' +
      '<div class="popup-type">' + esc(rack.type) + ' · ' + esc(rack.neighborhood) + '</div>' +
      '<a class="popup-link" href="' + attr(mapsUrl(rack)) +
      '" target="_blank" rel="noopener noreferrer">Open in Google Maps →</a>';
  }
  function ensureFullMap() {
    if (fullMap || !hasLeaflet) return;
    try {
      fullMap = L.map('fullmap', { scrollWheelZoom: true }).setView([47.62, -122.34], 12);
      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(fullMap);
    } catch (e) {
      hasLeaflet = false;
    }
  }
  function updateFullMapMarkers(list) {
    if (!fullMap) return;
    fullMarkers.forEach(function (m) { fullMap.removeLayer(m); });
    fullMarkers = [];
    var pts = [];
    list.forEach(function (rack) {
      var mk = L.marker([rack.lat, rack.lng], { icon: pinIcon(rack) })
        .addTo(fullMap).bindPopup(popupHtml(rack));
      fullMarkers.push(mk);
      pts.push([rack.lat, rack.lng]);
    });
    if (pts.length === 1) fullMap.setView(pts[0], 15);
    else if (pts.length > 1) fullMap.fitBounds(pts, { padding: [40, 40] });
  }

  /* ---- chips ---- */
  function buildChips() {
    var counts = {};
    racks.forEach(function (r) { counts[r.type] = (counts[r.type] || 0) + 1; });
    var types = Object.keys(counts).sort();
    var defs = [{ key: 'all', label: 'All', n: racks.length }];
    types.forEach(function (t) { defs.push({ key: t, label: t, n: counts[t] }); });

    chipsEl.innerHTML = '';
    defs.forEach(function (d) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'chip';
      btn.dataset.type = d.key;
      btn.setAttribute('aria-pressed', d.key === state.type ? 'true' : 'false');
      btn.innerHTML = esc(d.label) + '<span class="chip-count">' + d.n + '</span>';
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
      if (!hasLeaflet) {
        document.getElementById('fullmap').innerHTML =
          '<div class="map-unavailable">Map couldn’t load. Use the <strong>Open in Maps</strong> ' +
          'button on each rack instead.</div>';
        return;
      }
      ensureFullMap();
      setTimeout(function () {
        if (fullMap) { fullMap.invalidateSize(); updateFullMapMarkers(getFiltered()); }
      }, 60);
    } else {
      mapView.classList.remove('active');
      grid.classList.remove('hidden');
    }
  }

  /* ---- master render ---- */
  function render() {
    var list = getFiltered();
    updateCount(list.length);
    if (state.view === 'grid') {
      renderGrid(list);
    } else if (hasLeaflet) {
      ensureFullMap();
      if (fullMap) { fullMap.invalidateSize(); updateFullMapMarkers(list); }
    }
  }

  function resetFilters() {
    state.query = '';
    state.type = 'all';
    if (searchInput) searchInput.value = '';
    buildChips();
    render();
  }

  /* ---- init ---- */
  function init() {
    if (!hasLeaflet) document.body.classList.add('no-leaflet');
    buildChips();
    render();

    if (searchInput) {
      searchInput.addEventListener('input', function () {
        state.query = this.value; render();
      });
      searchInput.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') { this.value = ''; state.query = ''; render(); this.blur(); }
      });
    }
    toggleBtns.forEach(function (b) {
      b.addEventListener('click', function () { setView(b.dataset.view); });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
