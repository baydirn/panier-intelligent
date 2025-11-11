import { describe, it, expect } from 'vitest'
import { scoreCombination, DEFAULT_WEIGHTS } from '../../domain/scoring'

describe('scoring', () => {
  it('produces lower score with favorites and full coverage', () => {
    const inputsA = { totalPrice: 100, totalDistanceKm: 10, nbStores: 3, coverage: 1, favoritesCount: 1 }
    const inputsB = { ...inputsA, favoritesCount: 0 }
    const scoreA = scoreCombination(inputsA, DEFAULT_WEIGHTS, { maxPrice: 150, maxDistance: 20, maxStores: 5 })
    const scoreB = scoreCombination(inputsB, DEFAULT_WEIGHTS, { maxPrice: 150, maxDistance: 20, maxStores: 5 })
    expect(scoreA).toBeLessThan(scoreB)
  })
  it('applies coverage penalty', () => {
    const full = scoreCombination({ totalPrice: 100, totalDistanceKm: 10, nbStores: 3, coverage: 1, favoritesCount: 0 }, DEFAULT_WEIGHTS, { maxPrice: 150, maxDistance: 20, maxStores: 5 })
    const partial = scoreCombination({ totalPrice: 100, totalDistanceKm: 10, nbStores: 3, coverage: 0.5, favoritesCount: 0 }, DEFAULT_WEIGHTS, { maxPrice: 150, maxDistance: 20, maxStores: 5 })
    expect(partial).toBeGreaterThan(full)
  })
})
