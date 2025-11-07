// Cache local pour produits scannés et recherchés
// Stocke par code-barres et par terme de recherche
import localforage from 'localforage'

const CACHE_NAME = 'PanierIntelligent'
const CACHE_KEY = 'product_cache_v1'

localforage.config({ name: CACHE_NAME })

async function getAllCache(){
  return (await localforage.getItem(CACHE_KEY)) || { byBarcode: {}, byQuery: {} }
}

export async function cacheProductByBarcode(barcode, data){
  if(!barcode) return
  const cache = await getAllCache()
  cache.byBarcode[barcode] = { data, ts: Date.now() }
  await localforage.setItem(CACHE_KEY, cache)
}

export async function getCachedProductByBarcode(barcode, maxAgeMs = 1000*60*60*24*30){
  const cache = await getAllCache()
  const entry = cache.byBarcode[barcode]
  if(!entry) return null
  if(maxAgeMs && Date.now() - entry.ts > maxAgeMs) return null
  return entry.data
}

export async function cacheSearchResults(query, results){
  if(!query) return
  const cache = await getAllCache()
  cache.byQuery[query.toLowerCase()] = { results, ts: Date.now() }
  await localforage.setItem(CACHE_KEY, cache)
}

export async function getCachedSearchResults(query, maxAgeMs = 1000*60*60*24*7){
  const cache = await getAllCache()
  const entry = cache.byQuery[(query||'').toLowerCase()]
  if(!entry) return null
  if(maxAgeMs && Date.now() - entry.ts > maxAgeMs) return null
  return entry.results
}

export async function clearProductCache(){
  await localforage.setItem(CACHE_KEY, { byBarcode: {}, byQuery: {} })
}
