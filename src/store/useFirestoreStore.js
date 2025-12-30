/**
 * Firestore-based Store - Replaces IndexedDB with Cloud Firestore
 *
 * Features:
 * - Real-time sync across devices
 * - Automatic persistence
 * - Multi-user collaboration ready
 */

import { create } from 'zustand'
import { getUserPersonalList, updateUserPersonalList, subscribeToUserPersonalList } from '../services/firestore'
import { DEFAULT_WEIGHTS } from '../domain/scoring'

const DEFAULT_SETTINGS = {
  maxStoresToCombine: 3,
  searchRadiusKm: 5,
  favoriteStores: [],
  ocrPriceReplaceMode: 'better',
  scoringWeights: { ...DEFAULT_WEIGHTS }
}

const useFirestoreStore = create((set, get) => ({
  // State
  products: [],
  personalListId: null,
  optimalCombinations: [],
  selectedCombination: null,
  mode: 'liste',
  settings: DEFAULT_SETTINGS,
  lastSnapshot: null,
  maxStoresFreemium: 1,
  unsubscribe: null,
  isLoading: false,
  error: null,

  // Initialize: Load user's personal list from Firestore
  loadProducts: async (userId) => {
    if (!userId) {
      console.warn('[FirestoreStore] loadProducts called without userId')
      return []
    }

    set({ isLoading: true, error: null })

    try {
      const personalList = await getUserPersonalList(userId)
      set({
        products: personalList.products || [],
        personalListId: personalList.id,
        isLoading: false
      })
      return personalList.products || []
    } catch (error) {
      console.error('[FirestoreStore] Error loading products:', error)
      set({ error: error.message, isLoading: false })
      return []
    }
  },

  // Subscribe to real-time updates
  subscribeToProducts: (userId) => {
    if (!userId) {
      console.warn('[FirestoreStore] subscribeToProducts called without userId')
      return
    }

    console.log('[FirestoreStore] subscribeToProducts starting for userId:', userId)

    // Unsubscribe previous listener if exists
    const currentUnsubscribe = get().unsubscribe
    if (currentUnsubscribe) {
      currentUnsubscribe()
    }

    const unsubscribe = subscribeToUserPersonalList(userId, (personalList) => {
      console.log('[FirestoreStore] Received personalList update:', personalList)
      set({
        products: personalList.products || [],
        personalListId: personalList.id,
        isLoading: false
      })
    })

    set({ unsubscribe })
  },

  // Unsubscribe from real-time updates
  unsubscribeFromProducts: () => {
    const currentUnsubscribe = get().unsubscribe
    if (currentUnsubscribe) {
      currentUnsubscribe()
      set({ unsubscribe: null })
    }
  },

  // Add product
  addProduct: async (product) => {
    const { personalListId, products } = get()
    if (!personalListId) {
      throw new Error('Personal list not loaded')
    }

    const newProduct = {
      id: `prod-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      ...product,
      createdAt: new Date().toISOString()
    }

    const updatedProducts = [newProduct, ...products]

    await updateUserPersonalList(personalListId, { products: updatedProducts })

    // Optimistic update (real-time listener will update state)
    set({ products: updatedProducts })

    return newProduct
  },

  // Update product
  updateProduct: async (id, fields) => {
    const { personalListId, products } = get()
    if (!personalListId) {
      throw new Error('Personal list not loaded')
    }

    const updatedProducts = products.map(p =>
      p.id === id ? { ...p, ...fields, updatedAt: new Date().toISOString() } : p
    )

    await updateUserPersonalList(personalListId, { products: updatedProducts })

    // Optimistic update
    set({ products: updatedProducts })

    return { id, ...fields }
  },

  // Remove product
  removeProduct: async (id) => {
    const { personalListId, products } = get()
    if (!personalListId || !id) {
      throw new Error('Cannot remove product')
    }

    console.log('[FirestoreStore] Removing product:', id)

    const updatedProducts = products.filter(p => p.id !== id)

    await updateUserPersonalList(personalListId, { products: updatedProducts })

    // Optimistic update
    set({ products: updatedProducts })
  },

  // Remove multiple products
  removeProducts: async (ids) => {
    const { personalListId, products } = get()
    if (!personalListId || !Array.isArray(ids) || ids.length === 0) {
      return
    }

    console.log('[FirestoreStore] Removing products:', ids)

    const updatedProducts = products.filter(p => !ids.includes(p.id))

    await updateUserPersonalList(personalListId, { products: updatedProducts })

    // Optimistic update
    set({ products: updatedProducts })
  },

  // Other actions (unchanged from useAppStore)
  setOptimalCombinations: (comb) => set({ optimalCombinations: comb }),
  setSelectedCombination: (comb) => set({ selectedCombination: comb }),
  setMode: (m) => set({ mode: m }),
  setSettings: (s) => set({ settings: { ...get().settings, ...s } }),

  checkFreemiumLimit: (isPremium = false) => {
    const maxStores = isPremium ? 999 : get().maxStoresFreemium
    return maxStores
  },

  applyCombination: async (combination) => {
    const { personalListId, products } = get()
    if (!combination || !combination.items || !personalListId) return

    // Save snapshot for undo
    set({ lastSnapshot: products })

    const updates = combination.items
    let updatedProducts = [...products]

    for (const it of updates) {
      updatedProducts = updatedProducts.map(p =>
        p.id === it.id
          ? { ...p, magasin: it.magasin, prix: it.prix, prixSource: 'optimisation', autoAssigned: true }
          : p
      )
    }

    await updateUserPersonalList(personalListId, { products: updatedProducts })

    set({ products: updatedProducts, selectedCombination: combination })
  }
}))

export default useFirestoreStore
