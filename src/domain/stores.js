// src/domain/stores.js
// Canonical store catalog and helpers

/**
 * @typedef {Object} Store
 * @property {string} code - Canonical code (e.g., 'IGA', 'Maxi')
 * @property {string} name - Display name
 * @property {number} [lat]
 * @property {number} [lon]
 */

/**
 * Return the canonical store catalog. Extend with coordinates as needed.
 * Coordinates are sample locations in Montreal area for testing.
 * @returns {Store[]}
 */
export function getStoreCatalog(){
  return [
    { code: 'IGA', name: 'IGA', lat: 45.5017, lon: -73.5673 },
    { code: 'Maxi', name: 'Maxi', lat: 45.5088, lon: -73.5878 },
    { code: 'Metro', name: 'Metro', lat: 45.5200, lon: -73.5800 },
    { code: 'Walmart', name: 'Walmart', lat: 45.4950, lon: -73.6100 },
    { code: 'Provigo', name: 'Provigo', lat: 45.5100, lon: -73.5700 },
    { code: 'Super C', name: 'Super C', lat: 45.5150, lon: -73.5950 },
    { code: 'Costco', name: 'Costco', lat: 45.4800, lon: -73.6200 },
    { code: 'Adonis', name: 'Adonis', lat: 45.5250, lon: -73.5650 },
    { code: 'Avril', name: 'Avril', lat: 45.5180, lon: -73.5720 }
  ]
}

/**
 * Map any user-input store name to a canonical code from catalog.
 * If not found, returns the trimmed original string.
 * @param {string|null|undefined} name
 * @returns {string|null}
 */
export function canonicalizeStoreName(name){
  if(!name) return null
  const input = String(name).trim().toLowerCase()
  const match = getStoreCatalog().find(s => s.code.toLowerCase() === input || s.name.toLowerCase() === input)
  if(match) return match.code
  // try relaxed matching (remove spaces and case)
  const relaxed = input.replace(/\s+/g,'')
  const alt = getStoreCatalog().find(s => s.code.toLowerCase().replace(/\s+/g,'') === relaxed)
  return alt ? alt.code : String(name).trim()
}
