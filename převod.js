const fs = require('fs');
const proj4 = require('proj4');
const XLSX = require('xlsx');

// Správná definice S-JTSK (EPSG:5514)
proj4.defs("EPSG:5514", "+proj=krovak +lat_0=49.5 +lon_0=42.5 +k_0=0.9999 +x_0=0 +y_0=0 +ellps=bessel +towgs84=589,76,480,7.5,2.0,6.7,-4.0 +units=m +no_defs");

proj4.defs("EPSG:4326", "+proj=longlat +datum=WGS84 +no_defs");

// Načtení souboru data.txt
const data = fs.readFileSync('data.txt', 'utf8');
const lines = data.trim().split('\n');

// Inicializace pole pro výstup
let outputData = [['name', 'coords', 'icon', 'distance', 'minZoom']];

// Funkce pro převod souřadnic
function convertCoords(x, y) {
    console.log(`Původní souřadnice: X = ${x}, Y = ${y}`);  // Výpis původních souřadnic do konzole
    
    // Pozor na pořadí souřadnic, měníme X a Y
    let [lon, lat] = proj4('EPSG:5514', 'EPSG:4326', [parseFloat(x), parseFloat(y)]);

    console.log(`Převedené souřadnice (lat, lon): ${lat}, ${lon}`);
    return `${lat.toFixed(6)},${lon.toFixed(6)}`;
}

// Klíčová slova a jejich hodnoty
const keywordMappings = [
    { keyword: 'Sním.poč.náprav', name: 'PN', icon: 'PN' },
    { keyword: 'Náv.stož.podst.', name: 'návěstidlo', icon: 'návěstidlo' },
    { keyword: 'Náv.trp.podst.', name: 'trpaslík', icon: 'trpaslík' },
    { keyword: 'Mech.závor-pr.', name: 'přejezdZ', icon: 'přejezdZ' },
    { keyword: 'Kab.rozv.zab.ved.', name: 'KS', icon: 'KS' },
    { keyword: 'Výstr.PZS akt.sig.', name: 'přejezd', icon: 'přejezd' },
    { keyword: 'Přestavník', name: 'výhybka', icon: 'výhybka' },
];

// Iterace přes řádky dat
for (let line of lines) {
    const columns = line.split(/\s+/);
    const xCoord = columns[2];  // Souřadnice X (východ)
    const yCoord = columns[1];  // Souřadnice Y (sever)
    const name = columns[columns.length - 1];

    let matchedName = 'Unknown';
    let icon = 'Unknown';

    // Hledání shod s klíčovými slovy
    for (let mapping of keywordMappings) {
        if (line.includes(mapping.keyword)) {
            matchedName = mapping.name;
            icon = mapping.icon;
            break;
        }
    }

    if (matchedName === 'Unknown' && icon === 'Unknown') {
        continue;  // Přeskoč tento řádek
    }

    // Použití proj4 pro převod souřadnic
    const coords = convertCoords(xCoord, yCoord);

    const distance = 'XXX';  // Placeholder pro vzdálenost
    const minZoom = 15;

    outputData.push([matchedName, coords, icon, distance, minZoom]);
}

// Vytvoření nového XLSX souboru
const workbook = XLSX.utils.book_new();
const worksheet = XLSX.utils.aoa_to_sheet(outputData);
XLSX.utils.book_append_sheet(workbook, worksheet, 'Data');

// Uložení souboru
XLSX.writeFile(workbook, 'data.xlsx');
console.log('Hotovo! Data byla zapsána do data.xlsx');
