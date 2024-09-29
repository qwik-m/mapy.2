const fs = require('fs');
const jtskToWgs84 = require('./jtsk_to_wgs84');  // Import funkce
const XLSX = require('xlsx');

// Načtení souboru data.txt
const data = fs.readFileSync('data.txt', 'utf8');
const lines = data.trim().split('\n');

// Inicializace pole pro výstup
let outputData = [['name', 'coords', 'icon', 'distance', 'minZoom']];

// Funkce pro převod souřadnic z JTSK na WGS84
function convertCoords(x, y) {
    console.log(`Původní souřadnice: X = ${x}, Y = ${y}`);  // Výpis původních souřadnic do konzole
    
    // Použití jtskToWgs84 pro převod souřadnic
    const { lat, lon } = jtskToWgs84(Number(x), Number(y), 0);  // Převod bez výšky

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

    // Použití jtskToWgs84 pro převod souřadnic
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
