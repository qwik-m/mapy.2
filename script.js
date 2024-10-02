// Vytvoření mapy
const map = L.map('map').setView([50.7478, 14.2908], 12);

// Nahrazení OpenStreetMap vrstvou z Thunderforest
const thunderforestLayer = L.tileLayer('https://{s}.tile.thunderforest.com/transport/{z}/{x}/{y}.png?apikey=2a291dda9b314ca9934fc9551407e825', {
    attribution: '&copy; <a href="https://www.thunderforest.com/">Thunderforest</a> contributors',
    maxZoom: 19
}).addTo(map);

// Definice ikon
const přejezd = L.icon({ iconUrl: 'přejezd bez závor.png', iconSize: [25, 25], iconAnchor: [12.5, 25], popupAnchor: [1, -34] });
const přejezdZ = L.icon({ iconUrl: 'přejezd se závorami.png', iconSize: [25, 25], iconAnchor: [12.5, 25], popupAnchor: [1, -34] });
const KS = L.icon({ iconUrl: 'kabelová skříň.png', iconSize: [25, 25], iconAnchor: [12.5, 25], popupAnchor: [1, -34] });
const Návěstidlo = L.icon({ iconUrl: 'návěstidlo.png', iconSize: [25, 25], iconAnchor: [12.5, 25], popupAnchor: [1, -34] });
const Domky = L.icon({ iconUrl: 'domek.png', iconSize: [25, 25], iconAnchor: [12.5, 25], popupAnchor: [1, -34] });
const PN = L.icon({ iconUrl: 'PN.png', iconSize: [25, 25], iconAnchor: [12.5, 25], popupAnchor: [1, -34] });
const Přejezdník = L.icon({ iconUrl: 'přejezdník.png', iconSize: [25, 25], iconAnchor: [12.5, 25], popupAnchor: [1, -34] });
const Výhybka = L.icon({ iconUrl: 'výhybka.png', iconSize: [25, 25], iconAnchor: [12.5, 41], popupAnchor: [1, -34] });
const Trpaslík = L.icon({ iconUrl: 'trpaslík.png', iconSize: [25, 25], iconAnchor: [12.5, 25], popupAnchor: [1, -34] });

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
        console.log(`Original distance value: ${row.distance}`);


        const points = results.data.map(row => {
            if (!row.coords || !row.icon || !row.name) {
                return null;
            }

            const coordsArray = cleanCoordinates(row.coords).split(',').map(Number);
            if (coordsArray.length !== 2 || isNaN(coordsArray[0]) || isNaN(coordsArray[1])) {
                return null;
            }

            // Upravená logika pro kontrolu sloupce distance
            const distance = row.distance.trim() === 'xxx' || isNaN(Number(row.distance.trim())) ? 'Neznámá' : row.distance.trim();

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
                map.setView(marker.coords, 20);
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

// Tlačítko pro zobrazení/schování filtru
const filterButton = document.getElementById('filter-button');
const iconFilter = document.getElementById('icon-filter');

// Při kliknutí na tlačítko se filtr rozbalí/sbalí
filterButton.addEventListener('click', function(event) {
    iconFilter.style.display = (iconFilter.style.display === 'none' || iconFilter.style.display === '') ? 'block' : 'none';
    event.stopPropagation(); // Zastaví šíření kliknutí, aby se zabránilo okamžitému sbalení
});

// Při kliknutí kdekoli mimo filtr se filtr schová
document.addEventListener('click', function(event) {
    if (!iconFilter.contains(event.target) && !filterButton.contains(event.target)) {
        iconFilter.style.display = 'none';
    }
});

// Funkce pro skrytí/zobrazení markerů na základě stavu filtrů
function updateVisibleMarkers() {
    const filterPřejezd = document.getElementById('přejezd').checked;
    const filterPřejezdZ = document.getElementById('přejezdZ').checked;
    const filterKS = document.getElementById('KS').checked;
    const filterNávěstidlo = document.getElementById('návěstidlo').checked;
    const filterDomky = document.getElementById('domky').checked;
    const filterPN = document.getElementById('PN').checked;
    const filterPřejezdník = document.getElementById('přejezdník').checked;
    const filterVýhybka = document.getElementById('výhybka').checked;
    const filterTrpaslík = document.getElementById('trpaslík').checked;

    markers.forEach(({ marker, minZoom }) => {
        const currentZoom = map.getZoom();
        const iconType = marker.options.icon.options.iconUrl;

        // Podmínky pro zobrazení/schování markerů
        if (
            (iconType.includes('přejezd bez závor.png') && filterPřejezd) ||
            (iconType.includes('přejezd se závorami.png') && filterPřejezdZ) ||
            (iconType.includes('kabelová skříň.png') && filterKS) ||
            (iconType.includes('návěstidlo.png') && filterNávěstidlo) ||
            (iconType.includes('domek.png') && filterDomky) ||
            (iconType.includes('PN.png') && filterPN) ||
            (iconType.includes('přejezdník.png') && filterPřejezdník) ||
            (iconType.includes('výhybka.png') && filterVýhybka) ||
            (iconType.includes('trpaslík.png') && filterTrpaslík)
        ) {
            // Přidat vrstvu, pokud je marker v rozsahu aktuálního zoomu
            if (currentZoom >= minZoom && !map.hasLayer(marker)) {
                map.addLayer(marker);
            }
        } else {
            // Odebrat marker z mapy
            if (map.hasLayer(marker)) {
                map.removeLayer(marker);
            }
        }
    });
}

// Event listener pro každý checkbox, který aktualizuje viditelnost markerů při změně
document.querySelectorAll('#icon-filter input[type="checkbox"]').forEach(checkbox => {
    checkbox.addEventListener('change', updateVisibleMarkers);
});

// Přidání této funkce i k eventu zoomu
map.on('zoomend', updateMarkers);
map.on('zoomend', updateVisibleMarkers);
