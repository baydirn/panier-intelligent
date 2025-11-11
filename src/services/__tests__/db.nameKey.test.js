import { describe, it, expect, beforeEach, vi } from 'vitest'

// Simple in-memory mock for localforage
const mem = new Map()
vi.mock('localforage', () => ({
  default: {
    config: () => {},
    async getItem(key){ return mem.get(key) },
    async setItem(key, val){ mem.set(key, val); return val },
    async removeItem(key){ mem.delete(key) }
  }
}))

import * as db from '../../services/db'

describe('db nameKey computation', () => {
  beforeEach(async () => {
    mem.clear && mem.clear()
    if(mem.clear == null){ mem.clear = () => mem.clear() }
    await db.init()
  })

  it('computes nameKey on addProduct', async () => {
    const p = await db.addProduct({ nom: 'Lait 2% 2L', quantite: 1 })
    expect(p.nameKey && p.nameKey.length > 0).toBe(true)
    const all = await db.getAllProducts()
    expect(all[0].nameKey).toBe(p.nameKey)
  })

  it('recomputes nameKey on updateProduct when identity fields change', async () => {
    const p = await db.addProduct({ nom: 'Yogourt 650g' })
    const beforeKey = p.nameKey
    const updated = await db.updateProduct(p.id, { volume: '500g' })
    expect(updated.nameKey).not.toBe(beforeKey)
  })
})
