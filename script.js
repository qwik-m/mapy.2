// Vytvoření mapy
const map = L.map('map').setView([50.7478, 14.2908], 12);

// Nahrazení OpenStreetMap vrstvou z Thunderforest
const thunderforestLayer = L.tileLayer('https://{s}.tile.thunderforest.com/transport/{z}/{x}/{y}.png?apikey=2a291dda9b314ca9934fc9551407e825', {
    attribution: '&copy; <a href="https://www.thunderforest.com/">Thunderforest</a> contributors',
    maxZoom: 19
}).addTo(map);

// Definice ikon
const přejezd = L.icon({ iconUrl: 'přejezd bez závor.png', iconSize: [25, 25], iconAnchor: [12, 25], popupAnchor: [1, -34] });
const přejezdZ = L.icon({ iconUrl: 'přejezd se závorami.png', iconSize: [25, 25], iconAnchor: [18, 45], popupAnchor: [1, -34] });
const KS = L.icon({ iconUrl: 'kabelová skříň.png', iconSize: [25, 25], iconAnchor: [12, 41], popupAnchor: [1, -34] });
const Návěstidlo = L.icon({ iconUrl: 'návěstidlo.png', iconSize: [25, 25], iconAnchor: [12, 41], popupAnchor: [1, -34] });
const Domky = L.icon({ iconUrl: 'domek.png', iconSize: [25, 25], iconAnchor: [12, 41], popupAnchor: [1, -34] });
const PN = L.icon({ iconUrl: 'PN.png', iconSize: [25, 25], iconAnchor: [12, 41], popupAnchor: [1, -34] });
const Přejezdník = L.icon({ iconUrl: 'přejezdník.png', iconSize: [25, 25], iconAnchor: [12, 41], popupAnchor: [1, -34] });
const Výhybka = L.icon({ iconUrl: 'výhybka.png', iconSize: [25, 25], iconAnchor: [12, 41], popupAnchor: [1, -34] });
const Trpaslík = L.icon({ iconUrl: 'trpaslík.png', iconSize: [25, 25], iconAnchor: [12, 41], popupAnchor: [1, -34] });

// Definice markerů
let markers = [];

// Funkce pro vrácení správné ikony na základě názvu z CSV souboru
function getIcon(iconName) {
    if (!iconName) {
        console.warn("Neplatný název ikony:", iconName);
        return L.icon({ iconUrl: 'default.png', iconSize: [25, 25] }); // Výchozí ikona
    }

    switch (iconName) {
        case "přejezd":
            return přejezd;
        case "přejezdZ":
            return přejezdZ;
        case "KS":
            return KS;
        case "návěstidlo":
            return Návěstidlo;
        case "domky":
            return Domky;
        case "PN":
            return PN;
        case "přejezdník":
            return Přejezdník;
        case "výhybka":
            return Výhybka;
        case "trpaslík":
            return Trpaslík;
        default:
            console.warn("Nedefinovaná ikona:", iconName);
            return L.icon({ iconUrl: 'default.png', iconSize: [25, 25] });
    }
}

// Funkce pro odstranění mezer ze souřadnic a zpracování číselných hodnot
function cleanCoordinates(coords) {
    return coords.replace(/\s+/g, ''); // Odstraní mezery okolo čárky
}

// Funkce pro aktualizaci viditelnosti markerů podle aktuálního zoomu
function updateMarkers() {
    const currentZoom = map.getZoom();
    markers.forEach(({ marker, minZoom }) => {
        if (currentZoom >= minZoom) {
            if (!map.hasLayer(marker)) {
                map.addLayer(marker);
            }
        } else {
            if (map.hasLayer(marker)) {
                map.removeLayer(marker);
            }
        }
    });
}

// Načtení CSV souboru z Google Sheets
const sheetUrl = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vT5mnhf0b1ivo8e8eFUAtp71M9jTqG3xpl8GLK9KRgwNI-El2sy5LqfDrULStkL7FiOXOXPuWbz4lxZ/pub?output=csv';

let allMarkers = []; // Pro uložení všech markerů pro vyhledávání

Papa.parse(sheetUrl, {
    download: true,
    header: true,
    complete: function (results) {
        console.log(results.data); // Zobrazí načtená data v konzoli

        const points = results.data.map(row => {
            if (!row.coords || !row.icon || !row.name) {
                return null;
            }

            const coordsArray = cleanCoordinates(row.coords).split(',').map(Number);
            if (coordsArray.length !== 2 || isNaN(coordsArray[0]) || isNaN(coordsArray[1])) {
                return null;
            }

            const distance = isNaN(Number(row.distance)) ? 'Neznámá' : row.distance;

            return {
                coords: coordsArray,
                name: row.name,
                distance: distance,
                icon: getIcon(row.icon),
                minZoom: Number(row.minZoom) || 10
            };
        }).filter(point => point !== null);

        markers = points.map(point => {
            const marker = L.marker(point.coords, { icon: point.icon });
            marker.bindPopup(`<b>${point.name}</b><br>Vzdálenost: ${point.distance}`);
            return { marker, minZoom: point.minZoom };
        });

        allMarkers = points.map(point => ({
            coords: point.coords,
            name: point.name,
            marker: L.marker(point.coords, { icon: point.icon })
        }));

        map.on('zoomend', updateMarkers);
        updateMarkers();
    }
});

// Funkce pro vyhledávání
function searchMarkers(query) {
    const searchResults = document.getElementById('search-results');
    searchResults.innerHTML = '';
    searchResults.style.display = 'none';

    if (query.length === 0) return;

    const filteredMarkers = allMarkers.filter(marker => marker.name.toLowerCase().includes(query.toLowerCase()));

    if (filteredMarkers.length > 0) {
        searchResults.style.display = 'block';
        filteredMarkers.forEach(marker => {
            const resultItem = document.createElement('div');
            resultItem.textContent = marker.name;
            resultItem.addEventListener('click', () => {
                map.setView(marker.coords, 16);
                marker.marker.openPopup();
                searchResults.style.display = 'none';
            });
            searchResults.appendChild(resultItem);
        });
    }
}

// Event listener pro změny v searchbaru
document.getElementById('search-input').addEventListener('input', function (e) {
    searchMarkers(e.target.value);
});
