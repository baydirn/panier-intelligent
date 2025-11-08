// Suggestions de produits similaires (même catégorie, autres marques)
import { findProduct, PRODUCTS_DB, getBrandsForProduct } from '../data/productsDatabase'
import { getBestWeeklyOffers } from './weeklyPrices'
import { fetchBestOffers } from './pricing'
import { parseFormat, computeUnitPrice } from '../utils/units'

export async function suggestSimilarProducts(productName, max = 5){
  if(!productName) return []
  const base = findProduct(productName)
  if(!base) return []
  const list = []

  // Collect price & unit info for base product
  let basePrice = null
  let baseUnitInfo = null
  try {
    const weekly = await getBestWeeklyOffers(base.key)
    if(weekly && weekly.length) basePrice = weekly[0].price
    if(basePrice == null){
      const live = await fetchBestOffers({ name: base.key })
      if(live && live.length) basePrice = live[0].price
    }
  } catch(_){}

  // Try to parse format from productName itself (if includes size) else from base definition (if extended later)
  baseUnitInfo = parseFormat(productName)

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
    const unitInfo = parseFormat(altName)
    const baseUnitPrice = computeUnitPrice(basePrice, baseUnitInfo?.canonicalQty, baseUnitInfo?.canonicalUnit)
    const altUnitPrice = computeUnitPrice(altPrice, unitInfo?.canonicalQty, unitInfo?.canonicalUnit)
    let unitSaving = null
    if(baseUnitPrice?.per != null && altUnitPrice?.per != null){
      unitSaving = baseUnitPrice.per - altUnitPrice.per
    }
    list.push({ name: altName, brand: b.name, type: 'brand', basePrice, altPrice, saving, baseUnitPrice, altUnitPrice, unitSaving })
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
      const unitInfo = parseFormat(key)
      const baseUnitPrice = computeUnitPrice(basePrice, baseUnitInfo?.canonicalQty, baseUnitInfo?.canonicalUnit)
      const altUnitPrice = computeUnitPrice(altPrice, unitInfo?.canonicalQty, unitInfo?.canonicalUnit)
      let unitSaving = null
      if(baseUnitPrice?.per != null && altUnitPrice?.per != null){
        unitSaving = baseUnitPrice.per - altUnitPrice.per
      }
      list.push({ name: key, type: 'category', basePrice, altPrice, saving, baseUnitPrice, altUnitPrice, unitSaving })
      if(list.length >= max) break
    }
  }
  return rank(list).slice(0, max)
}

function rank(arr){
  return arr.sort((a,b) => {
    // Prefer unitSaving if available
    if(a.unitSaving != null && b.unitSaving != null){
      if(b.unitSaving !== a.unitSaving) return b.unitSaving - a.unitSaving
    } else if(a.unitSaving != null){
      return -1
    } else if(b.unitSaving != null){
      return 1
    }
    if(a.saving != null && b.saving != null){
      if(b.saving !== a.saving) return b.saving - a.saving
    } else if(a.saving != null){
      return -1
    } else if(b.saving != null){
      return 1
    }
    return 0
  })
}
