// optimisation.js
// Compute combinations of stores and choose cheapest assignment per product for each combination.
// Now supports multi-criteria scoring: price, distance, nbStores, favorites, coverage

import { getStoreCatalog } from '../domain/stores'
import { scoreCombination, DEFAULT_WEIGHTS } from '../domain/scoring'

/**
 * Simple Haversine distance in km between two lat/lon points.
 * @param {number} lat1
 * @param {number} lon1
 * @param {number} lat2
 * @param {number} lon2
 * @returns {number} distance in km
 */
function haversineDistance(lat1, lon1, lat2, lon2){
  const R = 6371 // Earth radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a = Math.sin(dLat/2)*Math.sin(dLat/2) +
    Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*
    Math.sin(dLon/2)*Math.sin(dLon/2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
  return R * c
}

/**
 * Get store coordinates from catalog; fallback if missing.
 * @param {string} storeCode
 * @returns {{lat:number,lon:number}|null}
 */
function getStoreCoords(storeCode){
  const catalog = getStoreCatalog()
  const entry = catalog.find(s => s.code === storeCode)
  return entry?.lat != null && entry?.lon != null ? { lat: entry.lat, lon: entry.lon } : null
}

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
// options: { userLat, userLon, favoriteStores, weights }
export function trouverCombinaisonsOptimales(produits, prix, maxMagasins = 3, topN = 3, options = {}){
  const { userLat, userLon, favoriteStores = [], weights, debug = false, pruneLargeSearch = false, maxCombos = 5000 } = options
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

  const t0 = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now()
  const allCombos = []
  const limit = Math.min(maxMagasins, stores.length)
  for(let k=1;k<=limit;k++) allCombos.push(...combinations(stores, k))
  let combosToEval = allCombos
  if(pruneLargeSearch && allCombos.length > maxCombos){
    // Heuristic: prefer fewer-store combos first
    combosToEval = allCombos
      .sort((a,b)=> a.length - b.length)
      .slice(0, maxCombos)
  }

  // compute average total (per product average over all stores)
  const avgTotal = produits.reduce((sum,p)=>{
    const nom = p.nom || p.id || 'produit'
    const pr = prix[nom] || {}
    const vals = Object.values(pr)
    const avg = vals.length ? vals.reduce((a,b)=>a+b,0)/vals.length : 0
    const qty = Number(p.quantite) || 1
    return sum + avg * qty
  }, 0)

  const combos = combosToEval.map(combo => {
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

    // Multi-criteria: distance
    let totalDistanceKm = 0
    if(userLat != null && userLon != null){
      combo.forEach(storeCode => {
        const coords = getStoreCoords(storeCode)
        if(coords){
          totalDistanceKm += haversineDistance(userLat, userLon, coords.lat, coords.lon)
        }
      })
    }

    // Count favorites
    const favSet = new Set((favoriteStores || []).map(f => String(f).trim()))
    const favoritesCount = combo.filter(s => favSet.has(s)).length

    return { 
      stores: combo, 
      assignment, 
      total, 
      coverage: Math.round(coverage*100)/100, 
      unknownCount,
      savings: savings == null ? null : Math.round(savings*100)/100, 
      savingsPct: savingsPct == null ? null : Math.round(savingsPct*100)/100,
      totalDistanceKm: Math.round(totalDistanceKm*10)/10,
      favoritesCount
    }
  })

  // Compute bounds for normalization
  const prices = combos.map(c => c.total).filter(Number.isFinite)
  const distances = combos.map(c => c.totalDistanceKm).filter(Number.isFinite)
  const storeCounts = combos.map(c => c.stores.length)
  const minPrice = Math.min(...prices, 0)
  const maxPrice = Math.max(...prices, 1)
  const minDistance = Math.min(...distances, 0)
  const maxDistance = Math.max(...distances, 1)
  const minStores = Math.min(...storeCounts, 1)
  const maxStores = Math.max(...storeCounts, 1)

  // Compute composite score for each combo
  const withScores = combos.map(c => {
    const score = scoreCombination(
      { totalPrice: c.total, totalDistanceKm: c.totalDistanceKm, nbStores: c.stores.length, coverage: c.coverage, favoritesCount: c.favoritesCount },
      weights,
      { minPrice, maxPrice, minDistance, maxDistance, minStores, maxStores }
    )
    return { ...c, score }
  })

  const t1 = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now()
  if(debug){
    // eslint-disable-next-line no-console
    console.log(`[optimisation] stores=${stores.length} combos=${allCombos.length}${combosToEval.length!==allCombos.length?` (capped to ${combosToEval.length})`:''} evalTime=${Math.round((t1-t0))}ms`)
  }
  return withScores
    .sort((a,b)=>{
      // Primary: score (lower is better)
      if(Math.abs(a.score - b.score) > 0.001) return a.score - b.score
      // Fallback: coverage desc
      if(a.coverage !== b.coverage) return b.coverage - a.coverage
      // Final: total price asc
      return a.total - b.total
    })
    .slice(0, topN)
}
