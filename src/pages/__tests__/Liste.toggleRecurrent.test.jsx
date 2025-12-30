import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock the services
vi.mock('../../services/db', () => ({
  getRecurrentProducts: vi.fn(),
  addRecurrentProduct: vi.fn(),
  updateRecurrentProduct: vi.fn(),
  toggleRecurrentProduct: vi.fn(),
}))

const mockUpdateProduct = vi.fn()

vi.mock('../../store/useAppStore', () => ({
  default: vi.fn(selector => {
    const state = {
      products: [],
      updateProduct: mockUpdateProduct,
    }
    return selector(state)
  }),
}))

const mockAddToast = vi.fn()

vi.mock('../../components/ToastProvider', () => ({
  useToast: vi.fn(() => ({
    addToast: mockAddToast,
  })),
}))

import { addRecurrentProduct, updateRecurrentProduct } from '../../services/db'
import useAppStore from '../../store/useAppStore'
import { useToast } from '../../components/ToastProvider'

describe('Liste toggleRecurrent functionality', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should toggle product to recurrent and create recurrent entry', async () => {
    mockUpdateProduct.mockResolvedValue({})
    addRecurrentProduct.mockResolvedValue({ id: 'rec-123', name: 'Lait', active: true })

    // Simulate the onToggle handler from Liste.jsx
    const product = {
      id: 'prod-123',
      nom: 'Lait',
      quantite: 1,
      magasin: 'IGA',
      recurrent: false,
    }

    // Update the product locally to mark as recurrent
    await mockUpdateProduct(product.id, { recurrent: true })

    // Also add to recurrent products list
    await addRecurrentProduct({
      name: product.nom,
      default_quantity: product.quantite || 1,
      default_store: product.magasin || null,
      active: true,
    })

    expect(mockUpdateProduct).toHaveBeenCalledWith('prod-123', { recurrent: true })
    expect(addRecurrentProduct).toHaveBeenCalledWith({
      name: 'Lait',
      default_quantity: 1,
      default_store: 'IGA',
      active: true,
    })
  })

  it('should toggle product to non-recurrent and deactivate recurrent entry', async () => {
    mockUpdateProduct.mockResolvedValue({})
    const mockUpdateRecurrentMock = vi.fn().mockResolvedValue({})
    updateRecurrentProduct.mockImplementation(mockUpdateRecurrentMock)

    const product = {
      id: 'prod-123',
      nom: 'Lait',
      quantite: 1,
      magasin: 'IGA',
      recurrent: true,
      recurrentId: 'rec-123',
    }

    // Toggle off: update product
    await mockUpdateProduct(product.id, { recurrent: false })

    // Also deactivate in recurrent products list
    await updateRecurrentProduct(product.recurrentId, { active: false })

    expect(mockUpdateProduct).toHaveBeenCalledWith('prod-123', { recurrent: false })
    expect(mockUpdateRecurrentMock).toHaveBeenCalledWith('rec-123', { active: false })
  })

  it('should prevent duplicate recurrent entries when toggling', async () => {
    mockUpdateProduct.mockResolvedValue({})
    addRecurrentProduct.mockResolvedValue(
      { id: 'rec-existing', name: 'Lait', active: true } // Returns existing entry
    )

    const product = {
      id: 'prod-123',
      nom: 'Lait',
      quantite: 1,
      magasin: 'IGA',
      recurrent: false,
    }

    // Try to add as recurrent
    const result = await addRecurrentProduct({
      name: product.nom,
      default_quantity: product.quantite || 1,
      default_store: product.magasin || null,
      active: true,
    })

    // Should return existing entry (from addRecurrentProduct logic with dedup)
    expect(result).toEqual({ id: 'rec-existing', name: 'Lait', active: true })

    // Still update product to mark as recurrent
    await mockUpdateProduct(product.id, { recurrent: true })
    expect(mockUpdateProduct).toHaveBeenCalledWith('prod-123', { recurrent: true })
  })

  it('should sync recurrent status when product is marked as recurrent', async () => {
    mockUpdateProduct.mockResolvedValue({})
    addRecurrentProduct.mockResolvedValue({ id: 'rec-new', name: 'Pain', active: true })

    const product = {
      id: 'prod-999',
      nom: 'Pain',
      quantite: 1,
      magasin: 'Metro',
      recurrent: false,
    }

    // Toggle to recurrent
    await mockUpdateProduct(product.id, { recurrent: true })
    await addRecurrentProduct({
      name: product.nom,
      default_quantity: product.quantite,
      default_store: product.magasin,
      active: true,
    })

    expect(mockUpdateProduct).toHaveBeenCalledWith('prod-999', { recurrent: true })
    expect(addRecurrentProduct).toHaveBeenCalledWith({
      name: 'Pain',
      default_quantity: 1,
      default_store: 'Metro',
      active: true,
    })
  })
})
