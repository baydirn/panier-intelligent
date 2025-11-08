// Suggestions de produits similaires (même catégorie, autres marques)
import { findProduct, PRODUCTS_DB, getBrandsForProduct } from '../data/productsDatabase'
import { getBestWeeklyOffers } from './weeklyPrices'
import { fetchBestOffers } from './pricing'

export async function suggestSimilarProducts(productName, max = 5){
  if(!productName) return []
  const base = findProduct(productName)
  if(!base) return []
  const list = []

  // Collect price info for base product
  let basePrice = null
  try {
    const weekly = await getBestWeeklyOffers(base.key)
    if(weekly && weekly.length) basePrice = weekly[0].price
    if(basePrice == null){
      const live = await fetchBestOffers({ name: base.key })
      if(live && live.length) basePrice = live[0].price
    }
  } catch(_){}

  const brands = getBrandsForProduct(base.key)
  for(const b of brands){
    const altName = `${base.key} ${b.name}`
    // Estimate price difference (placeholder until real mapping)
    let altPrice = null
    try {
      const weeklyAlt = await getBestWeeklyOffers(base.key) // same key for brand variants
      if(weeklyAlt && weeklyAlt.length) altPrice = weeklyAlt[0].price
    } catch(_){}
    const saving = basePrice != null && altPrice != null ? (basePrice - altPrice) : null
    list.push({ name: altName, brand: b.name, type: 'brand', basePrice, altPrice, saving })
    if(list.length >= max) return rank(list).slice(0, max)
  }

  for(const [key, p] of Object.entries(PRODUCTS_DB)){
    if(key === base.key) continue
    if(p.category === base.category){
      let altPrice = null
      try {
        const weeklyAlt = await getBestWeeklyOffers(key)
        if(weeklyAlt && weeklyAlt.length) altPrice = weeklyAlt[0].price
      } catch(_){}
      const saving = basePrice != null && altPrice != null ? (basePrice - altPrice) : null
      list.push({ name: key, type: 'category', basePrice, altPrice, saving })
      if(list.length >= max) break
    }
  }
  return rank(list).slice(0, max)
}

function rank(arr){
  return arr.sort((a,b) => {
    if(a.saving != null && b.saving != null){
      return b.saving - a.saving // highest saving first
    }
    if(a.saving != null) return -1
    if(b.saving != null) return 1
    return 0
  })
}
