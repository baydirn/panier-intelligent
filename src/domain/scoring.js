// src/domain/scoring.js
// Multi-criteria combination scoring (stub with defaults)

/**
 * @typedef {Object} ScoreInputs
 * @property {number} totalPrice
 * @property {number} totalDistanceKm
 * @property {number} nbStores
 * @property {number} coverage - 0..1
 * @property {number} favoritesCount - number of favorite stores in the combo
 */

/**
 * @typedef {Object} ScoreWeights
 * @property {number} price - weight (default 0.6)
 * @property {number} distance - weight (default 0.25)
 * @property {number} nbStores - weight (default 0.1)
 * @property {number} favoritesBoost - negative weight to reduce score (default 0.05)
 * @property {number} coveragePenalty - multiplier applied when coverage < 1 (default 0.2)
 */

/** @type {ScoreWeights} */
export const DEFAULT_WEIGHTS = {
  price: 0.6,
  distance: 0.25,
  nbStores: 0.1,
  favoritesBoost: 0.05,
  coveragePenalty: 0.2
}

/**
 * Normalize numeric values into [0..1] given min/max bounds.
 * @param {number} value
 * @param {number} min
 * @param {number} max
 * @returns {number}
 */
function norm(value, min, max){
  if(!Number.isFinite(value)) return 1
  if(max <= min) return 1
  const x = (value - min) / (max - min)
  return Math.min(1, Math.max(0, x))
}

/**
 * Compute composite score (lower is better).
 * This is a placeholder: in practice, feed min/max context per analysis run.
 * @param {ScoreInputs} inputs
 * @param {Partial<ScoreWeights>} [weights]
 * @param {Object} [bounds]
 * @param {number} [bounds.minPrice]
 * @param {number} [bounds.maxPrice]
 * @param {number} [bounds.minDistance]
 * @param {number} [bounds.maxDistance]
 * @param {number} [bounds.minStores]
 * @param {number} [bounds.maxStores]
 * @returns {number}
 */
export function scoreCombination(inputs, weights = {}, bounds = {}){
  const w = { ...DEFAULT_WEIGHTS, ...weights }
  const p = norm(inputs.totalPrice, bounds.minPrice ?? 0, bounds.maxPrice ?? Math.max(1, inputs.totalPrice))
  const d = norm(inputs.totalDistanceKm, bounds.minDistance ?? 0, bounds.maxDistance ?? Math.max(1, inputs.totalDistanceKm))
  const n = norm(inputs.nbStores, bounds.minStores ?? 1, bounds.maxStores ?? Math.max(1, inputs.nbStores))
  let score = w.price * p + w.distance * d + w.nbStores * n
  // favorites decrease score (good)
  const favTerm = inputs.favoritesCount > 0 ? (inputs.favoritesCount * w.favoritesBoost) : 0
  score = score - favTerm
  // coverage penalty if incomplete
  if(inputs.coverage < 1){
    score = score + (1 - inputs.coverage) * w.coveragePenalty
  }
  return Math.round(score * 10000) / 10000
}
