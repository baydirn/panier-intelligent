import { describe, it, expect } from 'vitest'
import { parseUnit, toCanonical, computeUnitPrice } from '../../domain/units'

describe('units', () => {
  it('parses and canonicalizes liters to ml', () => {
    const p = parseUnit('2L')
    expect(p).toBeTruthy()
    expect(toCanonical(p)).toBe(2000)
  })
  it('computes price per base unit', () => {
    const per = computeUnitPrice(5, '500g')
    expect(per).toBeCloseTo(5/500, 5)
  })
})
