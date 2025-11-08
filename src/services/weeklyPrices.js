import localforage from 'localforage'

const WEEKLY_PRICES_KEY = 'weekly_prices_v1'
const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000

// Config: set VITE_PRICE_DATA_URL in Vercel to point to your JSON feed
const PRICE_DATA_URL = import.meta?.env?.VITE_PRICE_DATA_URL || '/prices.json'

export async function getWeeklyPricesMeta(){
  return (await localforage.getItem(WEEKLY_PRICES_KEY)) || { lastFetched: 0, items: [] }
}

export async function refreshWeeklyPrices({ force = false } = {}){
  const now = Date.now()
  const meta = await getWeeklyPricesMeta()
  if (!force && meta.lastFetched && (now - meta.lastFetched) < ONE_WEEK_MS){
    return meta
  }
  try{
    const res = await fetch(PRICE_DATA_URL, { cache: 'no-cache' })
    if(!res.ok) throw new Error('Failed to fetch prices.json')
    const data = await res.json()
    const normalized = Array.isArray(data) ? data : (data.items || [])
    // Normalize items: { name, store, price, updatedAt }
    const items = normalized.map(it => ({
      name: String(it.name || it.product || '').trim(),
      store: it.store || it.retailer || 'Unknown',
      price: Number(it.price),
      updatedAt: it.updatedAt || new Date().toISOString()
    })).filter(it => it.name && !Number.isNaN(it.price))
    const payload = { lastFetched: now, items }
    await localforage.setItem(WEEKLY_PRICES_KEY, payload)
    return payload
  }catch(err){
    console.warn('refreshWeeklyPrices failed:', err)
    return meta
  }
}

export async function getBestWeeklyOffers(name){
  if(!name) return []
  const meta = await getWeeklyPricesMeta()
  const items = meta.items || []
  const key = String(name).toLowerCase()
  const offers = items.filter(it => it.name.toLowerCase() === key)
  // sort by price
  offers.sort((a,b) => a.price - b.price)
  return offers
}
