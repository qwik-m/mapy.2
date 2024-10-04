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
const Výhybka = L.icon({ iconUrl: 'výhybka.png', iconSize: [25, 25], iconAnchor: [12.5, 25], popupAnchor: [1, -34] });
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
// URL pro jednotlivé listy
const sheetUrl1 = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vT5mnhf0b1ivo8e8eFUAtp71M9jTqG3xpl8GLK9KRgwNI-El2sy5LqfDrULStkL7FiOXOXPuWbz4lxZ/pub?gid=337819404&single=true&output=csv';
const sheetUrl2 = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vT5mnhf0b1ivo8e8eFUAtp71M9jTqG3xpl8GLK9KRgwNI-El2sy5LqfDrULStkL7FiOXOXPuWbz4lxZ/pub?gid=946430603&single=true&output=csv';
// Přidej více URL dle potřeby

let allMarkers = [];

// Funkce pro načtení a zpracování dat z jednotlivého listu
function processSheet(sheetUrl) {
    Papa.parse(sheetUrl, {
        download: true,
        header: true,
        complete: function (results) {
            console.log(results.data); 

            const points = results.data.map(row => {
                if (!row.coords || !row.icon || !row.name) {
                    return null;
                }

                const coordsArray = cleanCoordinates(row.coords).split(',').map(Number);
                if (coordsArray.length !== 2 || isNaN(coordsArray[0]) || isNaN(coordsArray[1])) {
                    return null;
                }

                let distance = 'Neznámá';
                if (row.distance && !isNaN(parseFloat(row.distance))) {
                    distance = row.distance.trim();
                }

                let trackNumber = row.trackNumber && row.trackNumber.trim() !== '' ? row.trackNumber.trim() : 'Neznámá';

                // Zde je dynamicky vytvořený odkaz na Mapy.cz podle souřadnic s pinem
                const mapyCzLink = `https://mapy.cz/zakladni?x=${coordsArray[1]}&y=${coordsArray[0]}&z=17&source=coor&id=${coordsArray[1]},${coordsArray[0]}`;

                return {
                    coords: coordsArray,
                    name: row.name,
                    distance: distance,
                    icon: getIcon(row.icon),
                    minZoom: Number(row.minZoom) || 10,
                    trackNumber: trackNumber,
                    mapyCzLink: mapyCzLink // Přidáme odkaz na Mapy.cz s pinem
                };
            }).filter(point => point !== null);

            markers = markers.concat(points.map(point => {
                const marker = L.marker(point.coords, { icon: point.icon });
                
                // Zde je přidaný HTML obsah pop-upu s ikonou odkazu na Mapy.cz
                const popupContent = `
                    <b>${point.name}</b><br>
                    Vzdálenost: ${point.distance}<br>
                    Číslo trati: ${point.trackNumber}<br>
                    <a href="${point.mapyCzLink}" target="_blank" title="Zobrazit na Mapy.cz">
                        <img src="link-icon.png" alt="Odkaz na Mapy.cz" style="width:16px;height:16px;">
                    </a>
                `;
                
                marker.bindPopup(popupContent);
                return { marker, minZoom: point.minZoom };
            }));

            // Spojení všech markerů do jednoho pole
            allMarkers = allMarkers.concat(points.map(point => ({
                coords: point.coords,
                name: point.name,
                marker: L.marker(point.coords, { icon: point.icon })
            })));

            // Aktualizace markerů na základě zoomu
            map.on('zoomend', updateMarkers);
            updateMarkers();
        }
    });
}


// Načíst jednotlivé listy
processSheet(sheetUrl1);
processSheet(sheetUrl2);
// Přidej více volání processSheet(sheetUrlX) dle potřeby

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
    const filterPřejezd = document.getElementById('filter-přejezd').checked;
    const filterPřejezdZ = document.getElementById('filter-přejezdZ').checked;
    const filterKS = document.getElementById('filter-KS').checked;
    const filterNávěstidlo = document.getElementById('filter-návěstidlo').checked;
    const filterDomky = document.getElementById('filter-domky').checked;
    const filterPN = document.getElementById('filter-PN').checked;
    const filterPřejezdník = document.getElementById('filter-přejezdník').checked;
    const filterVýhybka = document.getElementById('filter-výhybka').checked;
    const filterTrpaslík = document.getElementById('filter-trpaslík').checked;

    markers.forEach(({ marker }) => {
        const iconUrl = marker.options.icon.options.iconUrl;

        const isVisible =
            (filterPřejezd && iconUrl.includes('přejezd bez závor.png')) ||
            (filterPřejezdZ && iconUrl.includes('přejezd se závorami.png')) ||
            (filterKS && iconUrl.includes('kabelová skříň.png')) ||
            (filterNávěstidlo && iconUrl.includes('návěstidlo.png')) ||
            (filterDomky && iconUrl.includes('domek.png')) ||
            (filterPN && iconUrl.includes('PN.png')) ||
            (filterPřejezdník && iconUrl.includes('přejezdník.png')) ||
            (filterVýhybka && iconUrl.includes('výhybka.png')) ||
            (filterTrpaslík && iconUrl.includes('trpaslík.png'));

        if (isVisible) {
            marker.addTo(map);
        } else {
            map.removeLayer(marker);
        }
    });
}

// Event listenery pro každý checkbox
document.getElementById('filter-přejezd').addEventListener('change', updateVisibleMarkers);
document.getElementById('filter-přejezdZ').addEventListener('change', updateVisibleMarkers);
document.getElementById('filter-KS').addEventListener('change', updateVisibleMarkers);
document.getElementById('filter-návěstidlo').addEventListener('change', updateVisibleMarkers);
document.getElementById('filter-domky').addEventListener('change', updateVisibleMarkers);
document.getElementById('filter-PN').addEventListener('change', updateVisibleMarkers);
document.getElementById('filter-přejezdník').addEventListener('change', updateVisibleMarkers);
document.getElementById('filter-výhybka').addEventListener('change', updateVisibleMarkers);
document.getElementById('filter-trpaslík').addEventListener('change', updateVisibleMarkers);