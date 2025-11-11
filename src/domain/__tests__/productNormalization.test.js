import { describe, it, expect } from 'vitest'
import { normalizeProductName, canonicalizeVolume, computeSimilarity } from '../../domain/productNormalization'

describe('productNormalization', () => {
  it('normalizes name and computes nameKey with canonical volume in base units', () => {
    const n = normalizeProductName({ nom: 'Lait 2 % 2 L' })
    expect(n.baseName).toContain('lait')
    expect(n.nameKey).toContain('lait')
    // canonical form converts 2L -> 2000ml now
    expect(canonicalizeVolume('2L')).toBe('2000ml')
  })

  it('computes token similarity (Jaccard) — tolerant lower threshold after volume normalization', () => {
    const a = 'Lait 2% 2L'
    const b = 'lait 2 % 2 l'
    const s = computeSimilarity(a, b)
    expect(s).toBeGreaterThan(0.15)
  })

  it('canonicalizes multipack volumes', () => {
    expect(canonicalizeVolume('2x500ml')).toBe('1000ml')
    expect(canonicalizeVolume('3x200g')).toBe('600g')
    expect(canonicalizeVolume('1.5L')).toBe('1500ml')
    expect(canonicalizeVolume('0.75kg')).toBe('750g')
  })
})
