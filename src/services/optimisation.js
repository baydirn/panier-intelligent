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
    return sum + avg
  }, 0)

  const combos = allCombos.map(combo => {
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
      if(bestPrice === Infinity) bestPrice = null
      return { product: nom, store: bestStore, price: bestPrice || 0 }
    })
    const total = assignment.reduce((s,it)=> s + it.price, 0)
    const savings = avgTotal - total
    const savingsPct = avgTotal > 0 ? (savings / avgTotal) * 100 : 0
    return { 
      stores: combo, 
      assignment, 
      total, 
      savings: Math.round(savings*100)/100, 
      savingsPct: Math.round(savingsPct*100)/100 
    }
  })

  return combos.sort((a,b)=>a.total - b.total).slice(0, topN)
}
