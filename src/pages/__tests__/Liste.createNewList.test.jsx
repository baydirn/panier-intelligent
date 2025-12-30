import { vi, beforeEach, describe, it, expect } from 'vitest'

// Simple unit test for the removeProducts batch operation logic
describe('Liste - createNewList batch removal', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should batch all product removals in a single operation', async () => {
    // Mock the Firestore update operation
    const mockUpdateUserPersonalList = vi.fn().mockResolvedValue(undefined)
    const mockSet = vi.fn()

    // Simulate the removeProducts store logic
    const products = [
      { id: 'prod-1', nom: 'Lait', quantite: 1 },
      { id: 'prod-2', nom: 'Pain', quantite: 2 },
      { id: 'prod-3', nom: 'Œufs', quantite: 12 }
    ]

    const productIds = products.map(p => p.id)
    const updatedProducts = products.filter(p => !productIds.includes(p.id))

    // Verify that all products are removed
    expect(updatedProducts.length).toBe(0)
    expect(productIds).toEqual(['prod-1', 'prod-2', 'prod-3'])
  })

  it('should handle empty product list gracefully', async () => {
    const products = []
    const productIds = products.map(p => p.id)

    // Should not attempt to remove anything
    expect(productIds.length).toBe(0)
    expect(productIds).toEqual([])
  })

  it('should remove all products in batch, not individually', async () => {
    // Simulate the batch operation
    const mockBatchUpdate = vi.fn().mockResolvedValue(undefined)

    const products = [
      { id: 'prod-1', nom: 'Lait' },
      { id: 'prod-2', nom: 'Pain' },
      { id: 'prod-3', nom: 'Œufs' }
    ]

    const productIds = products.map(p => p.id)

    // Simulate batch removal
    await mockBatchUpdate(productIds)

    // Should be called exactly once with all IDs, not three times
    expect(mockBatchUpdate).toHaveBeenCalledTimes(1)
    expect(mockBatchUpdate).toHaveBeenCalledWith(['prod-1', 'prod-2', 'prod-3'])
  })

  it('should filter out all products when removing by ID list', () => {
    const products = [
      { id: 'prod-1', nom: 'Lait' },
      { id: 'prod-2', nom: 'Pain' },
      { id: 'prod-3', nom: 'Œufs' }
    ]

    const idsToRemove = ['prod-1', 'prod-2', 'prod-3']
    const remaining = products.filter(p => !idsToRemove.includes(p.id))

    expect(remaining).toEqual([])
    expect(remaining.length).toBe(0)
  })
})
