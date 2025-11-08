import localforage from 'localforage'

const WEEKLY_PRICES_KEY = 'weekly_prices_v1'
const WEEKLY_PRICES_HISTORY_KEY = 'weekly_prices_history_v1'
const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000
const MAX_WEEKS = 8

// Config: set VITE_PRICE_DATA_URL in Vercel to point to your JSON feed
// Fallback changed to the richer initial dataset if env is missing
const PRICE_DATA_URL = import.meta?.env?.VITE_PRICE_DATA_URL || '/prices.initial.json'

// Expose the resolved URL for debug UI
export function getPriceDataUrl(){
  return PRICE_DATA_URL
}

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
    const items = normalized.map(it => {
      const name = String(it.name || it.product || '').trim()
      const store = it.store || it.retailer || 'Unknown'
      let price = null
      if(it.price !== '' && it.price !== null && it.price !== undefined){
        const n = Number(it.price)
        if(Number.isFinite(n)) price = n
      }
      const updatedAt = it.updatedAt || new Date().toISOString()
      return { name, store, price, updatedAt }
    }).filter(it => it.name && it.price != null)
    const generatedAt = (data.generatedAt) || new Date().toISOString()
    const payload = { lastFetched: now, generatedAt, items }
    await localforage.setItem(WEEKLY_PRICES_KEY, payload)

    // Maintain a small rolling history by ISO week id
    try {
      const weekId = isoWeekId(new Date(generatedAt))
      const history = (await localforage.getItem(WEEKLY_PRICES_HISTORY_KEY)) || {}
      history[weekId] = { generatedAt, count: items.length }
      // Trim to last MAX_WEEKS weeks
      const sortedWeeks = Object.keys(history).sort()
      const toTrim = Math.max(0, sortedWeeks.length - MAX_WEEKS)
      for(let i=0;i<toTrim;i++){
        delete history[sortedWeeks[i]]
      }
      await localforage.setItem(WEEKLY_PRICES_HISTORY_KEY, history)
    } catch(e){ /* non-fatal */ }
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

export async function getWeeklyHistory(){
  return (await localforage.getItem(WEEKLY_PRICES_HISTORY_KEY)) || {}
}

function isoWeekId(date){
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay()||7))
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(),0,1))
  const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1)/7)
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2,'0')}`
}
