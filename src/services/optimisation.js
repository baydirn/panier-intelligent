// optimisation.js
// optimisation.js
// Compute combinations of stores and choose cheapest assignment per product for each combination.

function combinations(array, k){
  const res = []
  function helper(start, combo){
    if(combo.length === k){ res.push([...combo]); return }
    for(let i=start;i<array.length;i++){ combo.push(array[i]); helper(i+1, combo); combo.pop() }
  }
  helper(0, [])
  return res
}

export function computeBestCombinations(products, priceData, options={}){
  // kept for backwards compatibility; convert priceData to map and delegate
  const map = {}
  priceData.forEach(p => { map[p.nom] = {} ; (p.prices||[]).forEach(pr => map[p.nom][pr.magasin] = pr.prix) })
  return trouverCombinaisonsOptimales(products, map, options.maxStoresToCombine || 3)
}

// New function as requested: produits is array, prix is { nom: { store: price } }
export function trouverCombinaisonsOptimales(produits, prix, maxMagasins = 3, topN = 3){
  // collect all stores
  const storesSet = new Set()
  Object.values(prix).forEach(m => Object.keys(m || {}).forEach(s => storesSet.add(s)))
  const stores = Array.from(storesSet)
  if(stores.length === 0) return []

  // helper to generate combinations of stores (1..max)
  function combinations(arr, k){
    const res = []
    function helper(start, combo){
      if(combo.length === k){ res.push([...combo]); return }
      for(let i=start;i<arr.length;i++){ combo.push(arr[i]); helper(i+1, combo); combo.pop() }
    }
    helper(0, [])
    return res
  }

  const allCombos = []
  const limit = Math.min(maxMagasins, stores.length)
  for(let k=1;k<=limit;k++) allCombos.push(...combinations(stores, k))

  // compute average total (per product average over all stores)
  const avgTotal = produits.reduce((sum,p)=>{
    const nom = p.nom || p.id || 'produit'
    const pr = prix[nom] || {}
    const vals = Object.values(pr)
    const avg = vals.length ? vals.reduce((a,b)=>a+b,0)/vals.length : 0
    const qty = Number(p.quantite) || 1
    return sum + avg * qty
  }, 0)

  const combos = allCombos.map(combo => {
    let unknownCount = 0
    const assignment = produits.map(p => {
      const nom = p.nom || p.id || 'produit'
      const pr = prix[nom] || {}
      // choose cheapest store among combo
      let bestStore = null
      let bestPrice = Infinity
      combo.forEach(s => {
        if(pr[s] != null && pr[s] < bestPrice){ bestPrice = pr[s]; bestStore = s }
      })
      // fallback to global cheapest
      if(bestStore === null){
        Object.entries(pr).forEach(([s, price]) => { if(price < bestPrice){ bestPrice = price; bestStore = s } })
      }
      if(bestPrice === Infinity) {
        bestPrice = null
        unknownCount += 1
      }
      const qty = Number(p.quantite) || 1
      const lineTotal = bestPrice != null ? bestPrice * qty : null
      return { product: nom, store: bestStore, price: bestPrice, quantity: qty, lineTotal }
    })
    // Sum only known line totals
    const knownPrices = assignment.filter(a => a.lineTotal != null)
    const total = knownPrices.reduce((s,it)=> s + it.lineTotal, 0)
    const coverage = produits.length > 0 ? ( (produits.length - unknownCount) / produits.length ) : 0
    // Compute savings; if partial coverage, scale by coverage to reflect uncertainty
    let savings = (avgTotal - total)
    let savingsPct = (avgTotal > 0) ? (savings / avgTotal) * 100 : null
    if(unknownCount > 0){
      savings = savings * coverage
      savingsPct = savingsPct != null ? savingsPct * coverage : null
    }
    return { 
      stores: combo, 
      assignment, 
      total, 
      coverage: Math.round(coverage*100)/100, 
      unknownCount,
      savings: savings == null ? null : Math.round(savings*100)/100, 
      savingsPct: savingsPct == null ? null : Math.round(savingsPct*100)/100 
    }
  })

  return combos
    .sort((a,b)=>{
      // Prefer higher coverage first
      if(a.coverage !== b.coverage) return b.coverage - a.coverage
      return a.total - b.total
    })
    .slice(0, topN)
}
