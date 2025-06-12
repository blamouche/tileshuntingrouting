

// --- Affichage des activités Strava sur la carte ---
// Ajout d'un loader global
if (!document.getElementById('loader')) {
  const loader = document.createElement('div');
  loader.id = 'loader';
  loader.style.position = 'fixed';
  loader.style.top = '1em';
  loader.style.right = '1em';
  loader.style.width = 'auto';
  loader.style.height = 'auto';
  loader.style.background = 'rgba(255,255,255,0.95)';
  loader.style.display = 'none';
  loader.style.zIndex = 9999;
  loader.style.justifyContent = 'center';
  loader.style.alignItems = 'center';
  loader.style.boxShadow = '0 2px 8px #aaa';
  loader.style.borderRadius = '1em';
  loader.innerHTML = '<div style="font-size:1.2em;color:#333;padding:1em 2em;display:flex;align-items:center;"><span class="loader-spinner" style="display:inline-block;width:1.5em;height:1.5em;border:3px solid #ccc;border-top:3px solid #333;border-radius:50%;margin-right:1em;animation:spin 1s linear infinite;"></span>Chargement des activités...</div>';
  document.body.appendChild(loader);
  // Animation CSS spinner
  const style = document.createElement('style');
  style.innerHTML = '@keyframes spin{0%{transform:rotate(0deg);}100%{transform:rotate(360deg);}}';
  document.head.appendChild(style);
}
function showLoader() {
  document.getElementById('loader').style.display = 'flex';
}
function hideLoader() {
  document.getElementById('loader').style.display = 'none';
}
let stopImport = false;
// tilesVisited global et persistant
let tilesVisited = new Set();
// Polylignes Strava globales
let stravaPolylines = [];
// Restauration des tilesVisited depuis le localStorage
try {
  const tiles = localStorage.getItem('tiles_visited');
  if (tiles) {
    JSON.parse(tiles).forEach(k => tilesVisited.add(k));
  }
} catch (e) {}


async function loadStravaActivities() {
  // Nettoyer toutes les anciennes polylignes Strava de la carte et du tableau
  if (Array.isArray(stravaPolylines) && stravaPolylines.length > 0) {
    stravaPolylines.forEach(obj => {
      try { map.removeLayer(obj.polyline); } catch(e){}
    });
    stravaPolylines.length = 0;
  }
  showLoader();
  // 1. Charger les activités du localStorage
  let allActivities = [];
  let count = 0;
  const infoDiv = document.getElementById('route-info');
  infoDiv.textContent = '';
  try {
    const local = localStorage.getItem('strava_activities');
    if (local) {
      allActivities = JSON.parse(local);
      allActivities.forEach(act => {
        if (act.map && act.map.summary_polyline) {
          const coords = decodePolyline(act.map.summary_polyline);
          // Créer la polyligne et la stocker (ne pas l'ajouter à la carte ici)
          const poly = L.polyline(coords, {color: 'purple', weight: 3, opacity: 0.7})
            .bindPopup(`${act.name} (${act.type})`);
          stravaPolylines.push({polyline: poly, activity: act});
          count++;
          // Marquer les tiles traversées
          coords.forEach(([lat, lng]) => {
            const tile = getTileKey(lat, lng);
            tilesVisited.add(tile);
          });
        }
      });
      // Sauvegarder tilesVisited dans le localStorage
      localStorage.setItem('tiles_visited', JSON.stringify(Array.from(tilesVisited)));
      colorTiles();
    }
    infoDiv.textContent = `${allActivities.length} activité(s) Strava chargée(s)`;
  } catch (e) {}
  hideLoader();

  // 2. Charger les activités manquantes depuis Strava (si connecté)
  let page = 1;
  let perPage = 50;
  let keepLoading = true;
  let newActivities = [];
  let lastId = allActivities.length > 0 ? allActivities[0].id : null;
  stopImport = false;
  while (keepLoading) {
    if (stopImport) break;
    try {
      const res = await fetch(`/strava/activities?page=${page}&per_page=${perPage}`);
      if (!res.ok) break;
      const activities = await res.json();
      if (!Array.isArray(activities) || activities.length === 0) break;
      // Arrêt si on a déjà la première activité (les plus récentes d'abord)
      let found = false;
      for (const act of activities) {
        if (lastId && act.id === lastId) {
          found = true;
          break;
        }
        if (act.map && act.map.summary_polyline) {
          const coords = decodePolyline(act.map.summary_polyline);
          // Créer la polyligne et la stocker (mais ne pas l'ajouter à la carte ici)
          const poly = L.polyline(coords, {color: 'purple', weight: 3, opacity: 0.7})
            .bindPopup(`${act.name} (${act.type})`);
          stravaPolylines.push({polyline: poly, activity: act});
          count++;
          coords.forEach(([lat, lng]) => {
            const tile = getTileKey(lat, lng);
            tilesVisited.add(tile);
          });
        }
        newActivities.push(act);
      }
      // Sauvegarder tilesVisited dans le localStorage
      localStorage.setItem('tiles_visited', JSON.stringify(Array.from(tilesVisited)));
      colorTiles();
      if (found || activities.length < perPage) break;
      page++;
      await new Promise(r => setTimeout(r, 1000));
    } catch (e) {
      break;
    }
  }
  // 3. Fusionner et stocker
  if (newActivities.length > 0) {
    allActivities = newActivities.concat(allActivities);
    localStorage.setItem('strava_activities', JSON.stringify(allActivities));
  }
  infoDiv.textContent = `${allActivities.length} activité(s) Strava chargée(s)`;
}

// Décodage polyline Google/Strava
function decodePolyline(str) {
  let index = 0, lat = 0, lng = 0, coordinates = [];
  while (index < str.length) {
    let b, shift = 0, result = 0;
    do {
      b = str.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    let dlat = ((result & 1) ? ~(result >> 1) : (result >> 1));
    lat += dlat;
    shift = 0; result = 0;
    do {
      b = str.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    let dlng = ((result & 1) ? ~(result >> 1) : (result >> 1));
    lng += dlng;
    coordinates.push([lat / 1e5, lng / 1e5]);
  }
  return coordinates;
}

// --- Coloration des tuiles traversées par les activités ---
// Découpage des tuiles selon le standard "Slippy Map Tilenames" (zoom 14)
function getTileKey(lat, lng) {
  // https://wiki.openstreetmap.org/wiki/Slippy_map_tilenames
  const z = 14; // niveau de zoom VeloViewer/Statshunters
  const n = Math.pow(2, z);
  const xTile = Math.floor((lng + 180) / 360 * n);
  const yTile = Math.floor((1 - Math.log(Math.tan(lat * Math.PI / 180) + 1 / Math.cos(lat * Math.PI / 180)) / Math.PI) / 2 * n);
  return `${z},${xTile},${yTile}`;
}

function colorTiles() {
  if (!map._gridLayers) return;
  if (map._tileRects) {
    map._tileRects.forEach(r => map.removeLayer(r));
  }
  map._tileRects = [];
  const mileInKm = 1.60934;
  const degLat = mileInKm / 111.32;
  const centerLat = map.getCenter().lat * Math.PI / 180;
  const degLng = mileInKm / (111.32 * Math.cos(centerLat));
  const bounds = map.getBounds();
  const minLat = Math.floor(bounds.getSouth() / degLat) * degLat;
  const maxLat = Math.ceil(bounds.getNorth() / degLat) * degLat;
  const minLng = Math.floor(bounds.getWest() / degLng) * degLng;
  const maxLng = Math.ceil(bounds.getEast() / degLng) * degLng;

  for (let tileLat = Math.floor(minLat / degLat); tileLat <= Math.floor(maxLat / degLat); tileLat++) {
    for (let tileLng = Math.floor(minLng / degLng); tileLng <= Math.floor(maxLng / degLng); tileLng++) {
      const key = `${tileLat},${tileLng}`;
      if (tilesVisited.has(key)) {
        const lat0 = tileLat * degLat;
        const lat1 = (tileLat + 1) * degLat;
        const lng0 = tileLng * degLng;
        const lng1 = (tileLng + 1) * degLng;
        const rect = L.rectangle([[lat0, lng0], [lat1, lng1]], {
          color: 'red',
          weight: 1,
          fillOpacity: 0.3,
          fillColor: 'red',
          interactive: false
        }).addTo(map);
        map._tileRects.push(rect);
      }
    }
  }

  if (stravaPolylines && stravaPolylines.length > 0) {
    stravaPolylines.forEach(obj => {
      try { map.removeLayer(obj.polyline); } catch (e) {}
    });
    stravaPolylines.forEach(obj => {
      try { obj.polyline.addTo(map); } catch (e) {}
    });
  }
}


// Charger les activités Strava au chargement de la page
window.addEventListener('DOMContentLoaded', loadStravaActivities);

// Bouton pour stopper l'importation
document.getElementById('stop-import').addEventListener('click', function() {
  stopImport = true;
});

// Bouton pour réinitialiser les activités et tuiles
document.getElementById('reset-strava').addEventListener('click', function() {
  localStorage.removeItem('strava_activities');
  localStorage.removeItem('tiles_visited');
  location.reload();
});
// Bouton pour réinitialiser l'itinéraire
document.getElementById('reset-route').addEventListener('click', function() {
  if (routeLayers && routeLayers.length > 0) {
    routeLayers.forEach(l => { try { map.removeLayer(l); } catch(e){} });
    routeLayers = [];
  }
  if (fromMarker) { map.removeLayer(fromMarker); fromMarker = null; }
  if (toMarker) { map.removeLayer(toMarker); toMarker = null; }
  fromCoords = null;
  toCoords = null;
  document.getElementById('from').value = '';
  document.getElementById('to').value = '';
  showRouteInfo(null);
});
// --- Authentification Strava ---
document.getElementById('strava-login').addEventListener('click', function() {
  window.location.href = '/strava/login';
});
// Initialisation de la carte
// Zoom sur Lyon par défaut
const map = L.map('map').setView([45.75, 4.85], 12);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '© OpenStreetMap contributors'
}).addTo(map);


// Ajout d'un quadrillage type "tiles hunting" (1 mile x 1 mile, vraiment carré)
function drawGrid() {
  // 1 mile en km
  const mileInKm = 1.60934;
  // 1 degré de latitude = ~111.32 km
  const degLat = mileInKm / 111.32;
  // 1 degré de longitude = 111.32 * cos(latitude)
  const centerLat = map.getCenter().lat * Math.PI / 180;
  const degLng = mileInKm / (111.32 * Math.cos(centerLat));

  let bounds = map.getBounds();
  let minLat = Math.floor(bounds.getSouth() / degLat) * degLat;
  let maxLat = Math.ceil(bounds.getNorth() / degLat) * degLat;
  let minLng = Math.floor(bounds.getWest() / degLng) * degLng;
  let maxLng = Math.ceil(bounds.getEast() / degLng) * degLng;

  // Nettoyage des anciens quadrillages
  if (map._gridLayers) {
    map._gridLayers.forEach(l => map.removeLayer(l));
  }
  map._gridLayers = [];

  // Lignes horizontales
  for (let lat = minLat; lat <= maxLat + 0.0001; lat += degLat) {
    let line = L.polyline([
      [lat, minLng],
      [lat, maxLng]
    ], {color: '#888', weight: 1, opacity: 0.5, interactive: false});
    line.addTo(map);
    map._gridLayers.push(line);
  }
  // Lignes verticales
  for (let lng = minLng; lng <= maxLng + 0.0001; lng += degLng) {
    let line = L.polyline([
      [minLat, lng],
      [maxLat, lng]
    ], {color: '#888', weight: 1, opacity: 0.5, interactive: false});
    line.addTo(map);
    map._gridLayers.push(line);
  }
  // Ne pas appeler colorTiles ici : il sera appelé après chargement effectif des activités
}

// Redessiner le quadrillage à chaque déplacement ou zoom
map.on('moveend zoomend', () => {
  showLoader();
  drawGrid();
  if (stravaPolylines.length > 0) {
    colorTiles();
    setTimeout(hideLoader, 300); // cache le loader après le redraw (petit délai pour UX)
  } else {
    hideLoader();
  }
});
drawGrid();

function hideContextMenu() {
  if (contextMenu) {
    map.getContainer().removeChild(contextMenu);
    contextMenu = null;
  }
}

function showContextMenu(e) {
  hideContextMenu();
  contextMenu = document.createElement('div');
  contextMenu.style.position = 'absolute';
  contextMenu.style.background = '#fff';
  contextMenu.style.border = '1px solid #ccc';
  contextMenu.style.zIndex = 10000;
  contextMenu.innerHTML = '<div id="ctx-start" style="padding:0.5em;cursor:pointer;">D\u00e9finir comme d\u00e9part</div>' +
                          '<div id="ctx-end" style="padding:0.5em;cursor:pointer;">D\u00e9finir comme arriv\u00e9e</div>';
  contextMenu.style.left = e.containerPoint.x + 'px';
  contextMenu.style.top = e.containerPoint.y + 'px';
  map.getContainer().appendChild(contextMenu);
  document.getElementById('ctx-start').addEventListener('click', () => {
    selectStart(e.latlng);
    hideContextMenu();
  });
  document.getElementById('ctx-end').addEventListener('click', () => {
    selectEnd(e.latlng);
    hideContextMenu();
  });
}

map.on('contextmenu', showContextMenu);
map.on('click', hideContextMenu);

function reverseGeocode(lat, lon, cb) {
  fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}`)
    .then(res => res.json())
    .then(data => cb(data.display_name || `${lat.toFixed(5)}, ${lon.toFixed(5)}`))
    .catch(() => cb(`${lat.toFixed(5)}, ${lon.toFixed(5)}`));
}

function selectStart(latlng) {
  fromCoords = [latlng.lat, latlng.lng];
  if (fromMarker) map.removeLayer(fromMarker);
  fromMarker = L.marker(latlng).addTo(map).bindPopup('D\u00e9part').openPopup();
  reverseGeocode(latlng.lat, latlng.lng, txt => {
    document.getElementById('from').value = txt;
  });
}

function selectEnd(latlng) {
  toCoords = [latlng.lat, latlng.lng];
  if (toMarker) map.removeLayer(toMarker);
  toMarker = L.marker(latlng).addTo(map).bindPopup('Arriv\u00e9e').openPopup();
  reverseGeocode(latlng.lat, latlng.lng, txt => {
    document.getElementById('to').value = txt;
  });
}

let fromMarker = null, toMarker = null, routeLayers = [];
let fromCoords = null, toCoords = null;
let contextMenu = null;

function createAutocomplete(inputId, autocompleteId, onSelect) {
  const input = document.getElementById(inputId);
  const container = document.getElementById(autocompleteId);
  let timeout = null;

  input.addEventListener('input', function() {
    clearTimeout(timeout);
    const query = input.value.trim();
    if (query.length < 3) {
      container.innerHTML = '';
      return;
    }
    timeout = setTimeout(() => {
      fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&addressdetails=1&limit=5`)
        .then(res => res.json())
        .then(results => {
          container.innerHTML = '<ul class="autocomplete">' + results.map(r => `<li data-lat="${r.lat}" data-lon="${r.lon}">${r.display_name}</li>`).join('') + '</ul>';
          container.querySelectorAll('li').forEach(li => {
            li.addEventListener('click', () => {
              input.value = li.textContent;
              container.innerHTML = '';
              onSelect({
                lat: parseFloat(li.getAttribute('data-lat')),
                lon: parseFloat(li.getAttribute('data-lon')),
                name: li.textContent
              });
            });
          });
        });
    }, 300);
  });
  document.addEventListener('click', (e) => {
    if (!container.contains(e.target) && e.target !== input) {
      container.innerHTML = '';
    }
  });
}

createAutocomplete('from', 'from-autocomplete', (place) => {
  fromCoords = [place.lat, place.lon];
  if (fromMarker) map.removeLayer(fromMarker);
  fromMarker = L.marker(fromCoords).addTo(map).bindPopup('Départ').openPopup();
  map.setView(fromCoords, 13);
});

createAutocomplete('to', 'to-autocomplete', (place) => {
  toCoords = [place.lat, place.lon];
  if (toMarker) map.removeLayer(toMarker);
  toMarker = L.marker(toCoords).addTo(map).bindPopup('Arrivée').openPopup();
  map.setView(toCoords, 13);
});

function drawRoutes(options) {
  if (routeLayers && routeLayers.length > 0) {
    routeLayers.forEach(l => {
      try { map.removeLayer(l); } catch (e) {}
    });
  }
  routeLayers = [];
  // On n'affiche que l'itinéraire principal (OSRM)
  if (options.length > 0) {
    const layer = L.polyline(options[0].coords, {
      color: 'blue',
      weight: 5,
      opacity: 0.8
    });
    layer.addTo(map);
    routeLayers.push(layer);
    map.fitBounds(layer.getBounds());
  }
}

function showRouteInfo(options) {
  const infoDiv = document.getElementById('route-info');
  if (Array.isArray(options) && options.length > 0) {
    infoDiv.innerHTML = options.map((o, i) => `Option ${i + 1} : ${(o.distance / 1000).toFixed(2)} km`).join('<br>');
  } else {
    infoDiv.textContent = '';
  }
}


// Routing OSRM (profil vélo, voiture ou piéton)
async function getOsrmRoute(start, end, profile = 'cycling') {
  // profile: 'cycling', 'driving', 'walking'
  const url = `https://router.project-osrm.org/route/v1/${profile}/${start[1]},${start[0]};${end[1]},${end[0]}?overview=full&geometries=geojson`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Erreur de routing');
  const data = await res.json();
  if (!data.routes || !data.routes[0]) throw new Error('Route invalide');
  const coords = data.routes[0].geometry.coordinates.map(([lng, lat]) => [lat, lng]);
  const dist = data.routes[0].distance;
  return { coords, distance: dist };
}

// Indices de tuiles OSM (zoom 14)
function getTileIndices(lat, lng) {
  const z = 14;
  const n = Math.pow(2, z);
  const xTile = Math.floor((lng + 180) / 360 * n);
  const yTile = Math.floor((1 - Math.log(Math.tan(lat * Math.PI / 180) + 1 / Math.cos(lat * Math.PI / 180)) / Math.PI) / 2 * n);
  return { z, xTile, yTile };
}

// Centre d'une tuile OSM (zoom 14)
function tileCenter(xTile, yTile, z = 14) {
  const n = Math.pow(2, z);
  const lng = xTile / n * 360 - 180;
  const latRad = Math.atan(Math.sinh(Math.PI * (1 - 2 * yTile / n)));
  const lat = latRad * 180 / Math.PI;
  return [lat, lng];
}

function findRouteAvoidingTiles(start, end) {
  const startIdx = getTileIndices(start[0], start[1]);
  const endIdx = getTileIndices(end[0], end[1]);
  const startKey = `${startIdx.z},${startIdx.xTile},${startIdx.yTile}`;
  const endKey = `${endIdx.z},${endIdx.xTile},${endIdx.yTile}`;
  const avoid = new Set(tilesVisited);
  avoid.delete(startKey);
  avoid.delete(endKey);
  const queue = [startIdx];
  const parents = {};
  parents[startKey] = null;
  const visited = new Set([startKey]);
  const dirs = [[1,0],[0,1],[-1,0],[0,-1]];
  while (queue.length > 0 && visited.size < 10000) {
    const cur = queue.shift();
    const curKey = `${cur.z},${cur.xTile},${cur.yTile}`;
    if (cur.xTile === endIdx.xTile && cur.yTile === endIdx.yTile) {
      const tiles = [];
      let k = curKey;
      while (k) {
        const [z, x, y] = k.split(',').map(Number);
        tiles.push({z, xTile:x, yTile:y});
        k = parents[k];
      }
      tiles.reverse();
      return tiles.map(t => tileCenter(t.xTile, t.yTile, t.z));
    }
    for (const [dx, dy] of dirs) {
      const n = {z: cur.z, xTile: cur.xTile + dx, yTile: cur.yTile + dy};
      const nKey = `${n.z},${n.xTile},${n.yTile}`;
      if (avoid.has(nKey) || visited.has(nKey)) continue;
      visited.add(nKey);
      parents[nKey] = curKey;
      queue.push(n);
    }
  }
  return null;
}

function pushSorted(queue, node) {
  queue.push(node);
  queue.sort((a, b) => a.cost - b.cost);
}

function findRouteWithPenalty(start, end, penalty) {
  const startIdx = getTileIndices(start[0], start[1]);
  const endIdx = getTileIndices(end[0], end[1]);
  const startKey = `${startIdx.z},${startIdx.xTile},${startIdx.yTile}`;
  const endKey = `${endIdx.z},${endIdx.xTile},${endIdx.yTile}`;
  const costs = {};
  const parents = {};
  const queue = [];
  pushSorted(queue, { z: startIdx.z, xTile: startIdx.xTile, yTile: startIdx.yTile, cost: 0 });
  costs[startKey] = 0;
  parents[startKey] = null;
  const dirs = [[1,0],[0,1],[-1,0],[0,-1]];
  let iterations = 0;
  while (queue.length > 0 && iterations < 20000) {
    const cur = queue.shift();
    const curKey = `${cur.z},${cur.xTile},${cur.yTile}`;
    if (cur.xTile === endIdx.xTile && cur.yTile === endIdx.yTile) {
      const tiles = [];
      let k = curKey;
      while (k) {
        const [z, x, y] = k.split(',').map(Number);
        tiles.push({ z, xTile: x, yTile: y });
        k = parents[k];
      }
      tiles.reverse();
      return tiles.map(t => tileCenter(t.xTile, t.yTile, t.z));
    }
    for (const [dx, dy] of dirs) {
      const n = { z: cur.z, xTile: cur.xTile + dx, yTile: cur.yTile + dy, cost: 0 };
      const nKey = `${n.z},${n.xTile},${n.yTile}`;
      let cost = cur.cost + (tilesVisited.has(nKey) ? penalty : 1);
      if (costs[nKey] === undefined || cost < costs[nKey]) {
        costs[nKey] = cost;
        parents[nKey] = curKey;
        pushSorted(queue, { z: n.z, xTile: n.xTile, yTile: n.yTile, cost });
      }
    }
    iterations++;
  }
  return null;
}

async function getRouteOptions(start, end) {
  const options = [];
  // Profil choisi dans le select
  const profile = document.getElementById('profile')?.value || 'cycling';
  try {
    const { coords, distance } = await getOsrmRoute(start, end, profile);
    options.push({ coords, distance });
  } catch (e) {}
  // Alternatives avec pénalité sur les tuiles déjà visitées (toujours en mode vélo)
  const penalties = [5, 10, 20];
  for (const p of penalties) {
    const coords = findRouteWithPenalty(start, end, p);
    if (coords) {
      let dist = 0;
      for (let i = 1; i < coords.length; i++) {
        dist += map.distance(coords[i - 1], coords[i]);
      }
      options.push({ coords, distance: dist });
    }
    if (options.length >= 3) break;
  }
  return options;
}

document.getElementById('route-btn').addEventListener('click', async function() {
  if (!fromCoords || !toCoords) {
    alert("Veuillez sélectionner un point de départ et d'arrivée.");
    return;
  }
  const options = await getRouteOptions(fromCoords, toCoords);
  if (options.length === 0) {
    showRouteInfo(null);
    alert('Aucun itinéraire trouvé.');
    return;
  }
  drawRoutes(options);
  showRouteInfo(options);
});
