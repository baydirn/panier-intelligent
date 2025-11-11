// src/domain/units.js
// Unit parsing and canonicalization helpers (minimal stubs)

/**
 * @typedef {Object} ParsedUnit
 * @property {number} amount - Numeric amount
 * @property {string} unit - Canonical unit ('ml' | 'l' | 'g' | 'kg')
 */

/**
 * Parse a volume/weight descriptor (e.g., "2L", "500 g", "0.5kg").
 * Returns null if not recognized.
 * @param {string} raw
 * @returns {ParsedUnit|null}
 */
export function parseUnit(raw){
  if(!raw) return null
  const s = String(raw).toLowerCase().trim().replace(/\s+/g,'')
  const m = s.match(/^(\d+(?:[.,]\d+)?)\s*(ml|l|g|kg)$/)
  if(!m) return null
  let amount = Number(m[1].replace(',','.'))
  const unit = m[2]
  if(!Number.isFinite(amount)) return null
  return { amount, unit }
}

/**
 * Convert parsed unit to canonical base (ml for liquids, g for weight).
 * @param {ParsedUnit} parsed
 * @returns {number} amountInBase - For ml/g comparison
 */
export function toCanonical(parsed){
  if(!parsed) return NaN
  const { amount, unit } = parsed
  switch(unit){
    case 'l': return amount * 1000
    case 'ml': return amount
    case 'kg': return amount * 1000
    case 'g': return amount
    default: return NaN
  }
}

/**
 * Compute unit price if possible.
 * @param {number|null|undefined} price
 * @param {string|null|undefined} volume
 * @returns {number|null} pricePerCanonical - price per 1 canonical unit (ml or g)
 */
export function computeUnitPrice(price, volume){
  if(price == null || volume == null) return null
  const parsed = parseUnit(volume)
  if(!parsed) return null
  const base = toCanonical(parsed)
  if(!Number.isFinite(base) || base <= 0) return null
  return Math.round((price / base) * 10000) / 10000 // 4 decimals
}
