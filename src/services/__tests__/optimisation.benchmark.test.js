import { describe, it, expect } from 'vitest'
import { trouverCombinaisonsOptimales } from '../../services/optimisation'

function genProducts(n){
  const out = []
  for(let i=0;i<n;i++) out.push({ nom: `Produit ${i+1}`, quantite: 1 })
  return out
}

function genPrices(products, storeCodes, base=5){
  const map = {}
  for(const p of products){
    const row = {}
    for(const s of storeCodes){
      // add some variability but bounded
      const delta = ((p.nom.charCodeAt(0) + s.charCodeAt(0)) % 100) / 100
      row[s] = base + delta
    }
    map[p.nom] = row
  }
  return map
}

describe('optimisation performance benchmark', () => {
  it('computes top combinations under threshold for 25 products x 5 stores', () => {
    const products = genProducts(25)
    const stores = ['IGA','Metro','Maxi','Walmart','Provigo']
    const prix = genPrices(products, stores)
    const start = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now()
    const res = trouverCombinaisonsOptimales(products, prix, 3, 3, { pruneLargeSearch: true, maxCombos: 5000 })
    const end = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now()
    expect(res.length).toBeGreaterThan(0)
    const elapsed = end - start
    // Assert under 300ms on typical dev hardware; adjust if needed
    if(!(elapsed < 300)){
      // Log detail to console to help profiling
      // eslint-disable-next-line no-console
      console.warn(`[benchmark] trouverCombinaisonsOptimales elapsed ${elapsed}ms (>= 300ms)`)
    }
    expect({ elapsed }).toEqual(expect.objectContaining({ elapsed: expect.any(Number) }))
    expect(elapsed).toBeLessThan(300)
  })
})
