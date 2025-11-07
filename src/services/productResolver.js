// Résout les produits via cache -> API OpenFoodFacts
import { getCachedProductByBarcode, cacheProductByBarcode, getCachedSearchResults, cacheSearchResults } from './productCache'
import { getProductByBarcode as offGetProductByBarcode, searchProductsByName as offSearch } from './openFoodFactsApi'

export async function resolveProductByBarcode(barcode){
  // 1) cache
  const cached = await getCachedProductByBarcode(barcode)
  if(cached) return { ...cached, from: 'cache' }
  // 2) OpenFoodFacts
  const api = await offGetProductByBarcode(barcode)
  if(api){
    await cacheProductByBarcode(barcode, api)
  }
  return api ? { ...api, from: 'openfoodfacts' } : null
}

export async function resolveSearch(query){
  const cached = await getCachedSearchResults(query)
  if(cached) return cached
  const api = await offSearch(query, 1, 10)
  if(api && api.length){
    await cacheSearchResults(query, api)
  }
  return api
}
