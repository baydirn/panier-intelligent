// src/domain/productNormalization.js
// Minimal domain contracts for product normalization and similarity

/**
 * @typedef {Object} NormalizedProduct
 * @property {string} baseName - Lowercased, trimmed base name without brand/volume tokens
 * @property {string|null} marque - Canonical brand if detected
 * @property {string|null} volume - Original volume string if detected (e.g., "2L", "500g")
 * @property {string} nameKey - Deterministic identity key: `${baseName}|${marque||''}|${canonicalVolume||''}`
 * @property {string[]} tokens - Tokenized normalized words for similarity
 */

/**
 * Normalize a product display name into a deterministic identity.
 * Non-destructive: best-effort parsing without throwing.
 *
 * @param {Object} input
 * @param {string} input.nom - Display name (user/OCR)
 * @param {string} [input.marque]
 * @param {string} [input.volume]
 * @returns {NormalizedProduct}
 */
export function normalizeProductName(input){
  const raw = String(input?.nom || '').trim()
  const lower = raw.toLowerCase()
  // naive brand/volume extraction placeholders (to be improved)
  const brand = input?.marque ? String(input.marque).trim() : null
  const volume = input?.volume ? String(input.volume).trim() : (guessVolumeFromText(lower) || null)
  const baseName = lower
    .replace(/\b(\d+[.,]?\d*\s?(ml|l|g|kg|unité|unites|unités))\b/g, ' ') // strip simple volume mentions
    .replace(/[^a-z0-9%\s]/g, ' ') // drop punctuation
    .replace(/\s+/g, ' ')
    .trim()
  const canonicalVol = canonicalizeVolume(volume)
  const tokens = baseName.split(' ').filter(Boolean)
  const nameKey = `${baseName}|${brand||''}|${canonicalVol||''}`
  return { baseName, marque: brand, volume, nameKey, tokens }
}

/**
 * Compute a simple token-based similarity between two names in range [0..1].
 * Jaccard similarity as a baseline.
 * @param {string} a
 * @param {string} b
 * @returns {number}
 */
export function computeSimilarity(a, b){
  const ta = new Set(String(a||'').toLowerCase().split(/\s+/).filter(Boolean))
  const tb = new Set(String(b||'').toLowerCase().split(/\s+/).filter(Boolean))
  if(ta.size === 0 && tb.size === 0) return 1
  let inter = 0
  for(const t of ta){ if(tb.has(t)) inter++ }
  const union = ta.size + tb.size - inter
  return union === 0 ? 0 : inter / union
}

/**
 * Best-effort volume guess from free text (very limited, improve later).
 * @param {string} lower
 * @returns {string|undefined}
 */
function guessVolumeFromText(lower){
  // Match multipack like "2x500ml" or "3 x 250 g"
  const mx = lower.match(/\b(\d+)\s*[xX]\s*(\d+(?:[.,]\d+)?)\s*(ml|l|g|kg)\b/)
  if(mx){
    const count = Number(mx[1])
    const amt = Number(mx[2].replace(',', '.'))
    const unit = mx[3]
    if(Number.isFinite(count) && Number.isFinite(amt)){
      // compute total in base unit string
      if(unit === 'l'){
        return `${count * amt * 1000}ml`
      }
      if(unit === 'kg'){
        return `${count * amt * 1000}g`
      }
      // ml or g
      return `${count * amt}${unit}`
    }
  }
  const m = lower.match(/\b(\d+[.,]?\d*)\s*(ml|l|g|kg)\b/)
  if(!m) return undefined
  return `${m[1]}${m[2]}`
}

/**
 * Canonicalize a volume string to base units (ml for liquids, g for weight) but keep as string for key.
 * Placeholder: strictly normalizes formatting; conversion happens in units service.
 * @param {string|null|undefined} vol
 * @returns {string}
 */
export function canonicalizeVolume(vol){
  if(!vol) return ''
  const s = String(vol).toLowerCase().replace(/\s+/g, '')
  // Normalize multipack notations e.g. 2x500ml -> 1000ml, 3x200g -> 600g
  const mx = s.match(/^(\d+)x(\d+(?:[.,]\d+)?)(ml|l|g|kg)$/)
  if(mx){
    const count = Number(mx[1])
    const amt = Number(mx[2].replace(',', '.'))
    const unit = mx[3]
    if(Number.isFinite(count) && Number.isFinite(amt)){
      if(unit === 'l') return `${count * amt * 1000}ml`
      if(unit === 'kg') return `${count * amt * 1000}g`
      return `${count * amt}${unit}`
    }
  }
  // Convert L/Kg to base units for canonical string
  const m = s.match(/^(\d+(?:[.,]\d+)?)(ml|l|g|kg)$/)
  if(m){
    const amt = Number(m[1].replace(',', '.'))
    const unit = m[2]
    if(Number.isFinite(amt)){
      if(unit === 'l') return `${amt * 1000}ml`
      if(unit === 'kg') return `${amt * 1000}g`
      return `${amt}${unit}`
    }
  }
  return s
}
