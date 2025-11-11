import { describe, it, expect, beforeEach, vi } from 'vitest'

// In-memory localforage mock
const mem = new Map()
vi.mock('localforage', () => ({
  default: {
    config: () => {},
    async getItem(key){ return mem.get(key) },
    async setItem(key, val){ mem.set(key, val); return val },
    async removeItem(key){ mem.delete(key) }
  }
}))

// Mock ToastProvider (not needed for logic)
vi.mock('../../components/ToastProvider', () => ({ useToast: () => ({ addToast: () => {} }) }))

// Mock weekly ingestion service to avoid side effects
vi.mock('../../services/weeklyPrices', () => ({
  ingestOcrProducts: vi.fn(async ({ products }) => ({ added: products.length, updated: 0 }))
}))

// Mock OCR KV store
vi.mock('../../services/ocrKV', () => ({
  hasSubmissionFor: vi.fn(async () => false),
  saveSubmission: vi.fn(async (sub) => ({ id: 'sub1', ...sub }))
}))

import { normalizeProductName } from '../../domain/productNormalization'
import { canonicalizeStoreName } from '../../domain/stores'
import * as db from '../../services/db'

// We won't mount React component here; we test the merging logic standalone.
// Re-implement the essential merging routine extracted from UploadFlyerModal for test clarity.
async function mergeOcrProducts({ ocrProducts, store, replaceMode }){
  const canonStore = canonicalizeStoreName(store)
  const existing = await db.getAllProducts()
  const existingByKey = new Map(existing.map(p => [p.nameKey, p]))
  let addedToList = 0, updatedInList = 0, historyCount = 0
  const { recordPriceObservation } = db
  for(const op of ocrProducts){
    const norm = normalizeProductName({ nom: op.name })
    if(!norm.nameKey) continue
    const current = existingByKey.get(norm.nameKey)
    await recordPriceObservation(norm.nameKey, canonStore, op.price)
    historyCount++
    if(current){
      let shouldUpdate = false
      if(replaceMode === 'always') shouldUpdate = true
      else if(replaceMode === 'better') shouldUpdate = (current.prix == null) || (typeof current.prix === 'number' && op.price < current.prix)
      else if(replaceMode === 'never') shouldUpdate = (current.prix == null)
      if(shouldUpdate){
        await db.updateProduct(current.id, { prix: op.price, magasin: canonStore, prixSource: 'ocr', autoAssigned: true })
        updatedInList++
      }
    } else {
      const added = await db.addProduct({ nom: norm.baseName, marque: norm.marque, volume: norm.volume, prix: op.price, magasin: canonStore, quantite: 1, prixSource: 'ocr', autoAssigned: true })
      if(added) addedToList++
    }
  }
  return { addedToList, updatedInList, historyCount }
}

describe('OCR merge logic', () => {
  beforeEach(async () => {
    mem.clear && mem.clear()
    await db.init()
  })

  it('adds new products when none exist', async () => {
    const res = await mergeOcrProducts({
      ocrProducts: [ { name: 'Lait 2% 2L', price: 3.99 }, { name: 'Yogourt 650g', price: 4.50 } ],
      store: 'IGA',
      replaceMode: 'better'
    })
    expect(res.addedToList).toBe(2)
    expect(res.updatedInList).toBe(0)
    const all = await db.getAllProducts()
    expect(all.length).toBe(2)
  })

  it('updates existing product only when better price in "better" mode', async () => {
    const p = await db.addProduct({ nom: 'Lait 2% 2L', prix: 4.20, magasin: 'IGA' })
    const res = await mergeOcrProducts({
      ocrProducts: [ { name: 'Lait 2% 2L', price: 3.99 } ],
      store: 'IGA',
      replaceMode: 'better'
    })
    expect(res.addedToList).toBe(0)
    expect(res.updatedInList).toBe(1)
    const updated = (await db.getAllProducts()).find(x => x.id === p.id)
    expect(updated.prix).toBe(3.99)
    expect(updated.prixSource).toBe('ocr')
  })

  it('does not update if OCR price higher in better mode', async () => {
    const p = await db.addProduct({ nom: 'Lait 2% 2L', prix: 3.50, magasin: 'IGA' })
    const res = await mergeOcrProducts({
      ocrProducts: [ { name: 'Lait 2% 2L', price: 3.99 } ],
      store: 'IGA',
      replaceMode: 'better'
    })
    expect(res.updatedInList).toBe(0)
    const updated = (await db.getAllProducts()).find(x => x.id === p.id)
    expect(updated.prix).toBe(3.5)
  })

  it('always updates existing price in always mode', async () => {
    const p = await db.addProduct({ nom: 'Yogourt 650g', prix: 5.00, magasin: 'Metro' })
    const res = await mergeOcrProducts({
      ocrProducts: [ { name: 'Yogourt 650g', price: 5.25 } ],
      store: 'Metro',
      replaceMode: 'always'
    })
    expect(res.updatedInList).toBe(1)
    const updated = (await db.getAllProducts()).find(x => x.id === p.id)
    expect(updated.prix).toBe(5.25)
  })

  it('only fills missing price in never mode', async () => {
    const p = await db.addProduct({ nom: 'Pain 500g' })
    const res = await mergeOcrProducts({
      ocrProducts: [ { name: 'Pain 500g', price: 2.49 } ],
      store: 'Maxi',
      replaceMode: 'never'
    })
    expect(res.updatedInList).toBe(1)
    const updated = (await db.getAllProducts()).find(x => x.id === p.id)
    expect(updated.prix).toBe(2.49)
  })

  it('records price history entries for each OCR product', async () => {
    await mergeOcrProducts({
      ocrProducts: [ { name: 'Pomme Gala 1kg', price: 3.99 }, { name: 'Pomme Gala 1kg', price: 4.10 } ],
      store: 'Provigo',
      replaceMode: 'always'
    })
    // history keyed by nameKey, which is lowercased normalized base name combined with volume
    const norm = normalizeProductName({ nom: 'Pomme Gala 1kg' })
    const { getPriceHistory } = db
    const hist = await getPriceHistory(norm.nameKey)
    expect(hist.length).toBeGreaterThan(0)
    // check day-collapsing (same day should replace) by counting unique dates
    const uniqueDates = new Set(hist.map(h => h.date.slice(0,10)))
    expect(uniqueDates.size).toBe(1)
  })
})
