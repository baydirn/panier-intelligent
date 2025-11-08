import localforage from 'localforage'

const PRICE_STATUS_KEY = 'price_status_v1'
const TEN_MIN = 10 * 60 * 1000

export async function getCachedPriceStatus(){
  return (await localforage.getItem(PRICE_STATUS_KEY)) || { lastChecked: 0, meta: null }
}

export async function fetchPriceStatus({ force = false } = {}){
  const now = Date.now()
  const cached = await getCachedPriceStatus()
  if(!force && cached.lastChecked && (now - cached.lastChecked) < TEN_MIN){
    return cached
  }
  try{
    const res = await fetch('/api/price-status', { cache: 'no-cache' })
  const data = await res.json()
  const payload = { lastChecked: now, meta: data.meta || null, source: data.source || null, resolved: data.resolved || null }
    await localforage.setItem(PRICE_STATUS_KEY, payload)
    return payload
  }catch(err){
    console.warn('fetchPriceStatus failed:', err)
    return cached
  }
}
