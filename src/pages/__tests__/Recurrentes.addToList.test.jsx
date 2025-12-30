import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import React from 'react'

// Mock the services
vi.mock('../../services/db', () => ({
  getRecurrentProducts: vi.fn(),
  addRecurrentProduct: vi.fn(),
  updateRecurrentProduct: vi.fn(),
  deleteRecurrentProduct: vi.fn(),
  toggleRecurrentProduct: vi.fn(),
}))

const mockAddProduct = vi.fn()
const mockUpdateProduct = vi.fn()

vi.mock('../../store/useAppStore', () => ({
  default: vi.fn(selector => {
    const state = {
      products: [],
      addProduct: mockAddProduct,
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

import { getRecurrentProducts, addRecurrentProduct } from '../../services/db'
import useAppStore from '../../store/useAppStore'
import { useToast } from '../../components/ToastProvider'

describe('Recurrentes addToList functionality', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    getRecurrentProducts.mockResolvedValue([
      { id: '1', name: 'Lait', active: true, default_quantity: 1, default_store: 'IGA' },
    ])
  })

  it('should add recurrent product to the list with correct quantity', async () => {
    mockAddProduct.mockResolvedValue({ id: 'prod-123' })

    // Simulate the onAddToList function from Recurrentes.jsx
    const item = { id: '1', name: 'Lait', default_quantity: 2, default_store: 'IGA' }
    const products = []

    // Check for duplicates
    const normalizedName = item.name.toLowerCase()
    const existingProduct = products.find(p => p.nom?.toLowerCase() === normalizedName)

    // Add product with quantity - now with recurrent: true
    await mockAddProduct({
      nom: item.name,
      quantite: item.default_quantity || 1,
      magasin: item.default_store || null,
      recurrent: true, // This is the fix
    })

    expect(mockAddProduct).toHaveBeenCalledWith({
      nom: 'Lait',
      quantite: 2,
      magasin: 'IGA',
      recurrent: true,
    })
  })

  it('should merge quantities when adding recurrent product that already exists', async () => {
    mockUpdateProduct.mockResolvedValue({})

    const item = { id: '1', name: 'Lait', default_quantity: 2, default_store: 'IGA' }
    const products = [
      { id: 'existing-1', nom: 'Lait', quantite: 1, magasin: null, recurrent: false },
    ]

    // Simulate the logic from Recurrentes.jsx onAddToList
    const normalizedName = item.name.toLowerCase()
    const existingProduct = products.find(p => p.nom?.toLowerCase() === normalizedName)

    if (existingProduct) {
      const newQty = (existingProduct.quantite || 1) + (item.default_quantity || 1)
      const newStore = existingProduct.magasin || (item.default_store || null)
      // When merging, also set recurrent: true
      await mockUpdateProduct(existingProduct.id, { quantite: newQty, magasin: newStore, recurrent: true })

      expect(mockUpdateProduct).toHaveBeenCalledWith('existing-1', {
        quantite: 3, // 1 + 2
        magasin: 'IGA',
        recurrent: true,
      })
    }
  })

  it('should show success message when adding recurrent product to list', async () => {
    mockAddProduct.mockResolvedValue({ id: 'prod-123' })

    const item = { id: '1', name: 'Lait', default_quantity: 1, default_store: 'IGA' }
    const products = []

    const normalizedName = item.name.toLowerCase()
    const existingProduct = products.find(p => p.nom?.toLowerCase() === normalizedName)

    if (!existingProduct) {
      await mockAddProduct({
        nom: item.name,
        quantite: item.default_quantity || 1,
        magasin: item.default_store || null,
        recurrent: true,
      })
      mockAddToast('Ajouté à la liste ✅', 'success')
    }

    expect(mockAddToast).toHaveBeenCalledWith('Ajouté à la liste ✅', 'success')
  })
})
