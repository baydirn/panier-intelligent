// Updated import per zustand deprecation warning
import { create } from 'zustand'
import { getAllProducts, addProduct as dbAddProduct, updateProduct as dbUpdateProduct, deleteProduct as dbDeleteProduct, deleteProducts as dbDeleteProducts } from '../services/db'
import { DEFAULT_WEIGHTS } from '../domain/scoring'

const DEFAULT_SETTINGS = {
  maxStoresToCombine: 3,
  searchRadiusKm: 5,
  favoriteStores: [],
  ocrPriceReplaceMode: 'better', // 'always' | 'better' | 'never'
  // Allow user to tune multi-criteria optimisation weights
  scoringWeights: { ...DEFAULT_WEIGHTS }
}

const useAppStore = create((set, get) => ({
  products: [],
  optimalCombinations: [],
  selectedCombination: null,
  mode: 'liste',
  settings: DEFAULT_SETTINGS,
  // store the last snapshot to allow undoing applied combination
  lastSnapshot: null,
  
  // Freemium: max stores for free users
  maxStoresFreemium: 1,

  // initialization: load products from storage
  loadProducts: async () => {
    const list = await getAllProducts()
    set({ products: list })
    return list
  },

  addProduct: async (product) => {
    const p = await dbAddProduct(product)
    set(state => ({ products: [p, ...state.products] }))
    return p
  },

  updateProduct: async (id, fields) => {
    const updated = await dbUpdateProduct(id, fields)
    set(state => ({ products: state.products.map(p => p.id === id ? {...p, ...updated} : p) }))
    return updated
  },

  removeProduct: async (id) => {
    if(!id) return
    console.log('[removeProduct] Deleting product:', id)
    const result = await dbDeleteProduct(id)
    console.log('[removeProduct] Delete result:', result)
    // Always reload to ensure sync
    const list = await getAllProducts()
    console.log('[removeProduct] Reloaded products count:', list.length)
    set({ products: list })
  },

  removeProducts: async (ids) => {
    if(!Array.isArray(ids) || ids.length === 0) return
    console.log('[removeProducts] Deleting products:', ids)
    const result = await dbDeleteProducts(ids)
    console.log('[removeProducts] Batch delete result:', result)
    const list = await getAllProducts()
    console.log('[removeProducts] Reloaded products count:', list.length)
    set({ products: list })
  },

  setOptimalCombinations: (comb) => set({ optimalCombinations: comb }),
  setSelectedCombination: (comb) => set({ selectedCombination: comb }),
  setMode: (m) => set({ mode: m }),

  setSettings: (s) => set({ settings: { ...get().settings, ...s } })
  ,
  
  // Freemium check: ensure max stores for tier
  checkFreemiumLimit: (isPremium = false) => {
    const maxStores = isPremium ? 999 : get().maxStoresFreemium
    return maxStores
  },

  // Apply a selected combination: update products' magasin and prix according to combination.items
  applyCombination: async (combination) => {
    if(!combination || !combination.items) return
    // save current snapshot for undo
    try{
      const prev = await getAllProducts()
      set({ lastSnapshot: prev })
    }catch(e){
      set({ lastSnapshot: null })
    }

    const updates = combination.items
    for(const it of updates){
      try{
        await dbUpdateProduct(it.id, { magasin: it.magasin, prix: it.prix, prixSource: 'optimisation', autoAssigned: true })
      }catch(e){ /* ignore individual failures */ }
    }
    // reload products into state
    const list = await getAllProducts()
    set({ products: list, selectedCombination: combination })
  }
  ,

  undoApplyCombination: async () => {
    const snapshot = get().lastSnapshot
    if(!snapshot) return
    // restore each product from snapshot
    for(const p of snapshot){
      try{
        await dbUpdateProduct(p.id, { nom: p.nom, quantite: p.quantite, recurrent: p.recurrent, magasin: p.magasin, prix: p.prix, purchased: p.purchased })
      }catch(e){ /* ignore */ }
    }
    const list = await getAllProducts()
    set({ products: list, selectedCombination: null, lastSnapshot: null })
  }

  ,
  // API requested: setCombinaisonOptimale / getCombinaisonOptimale
  setCombinaisonOptimale: (comb) => set({ selectedCombination: comb }),
  getCombinaisonOptimale: () => get().selectedCombination
}))

export default useAppStore
