import localforage from 'localforage'

const GEO_KEY = 'user_geo_v1'
const RADIUS_KEY = 'user_radius_km_v1'
const STORES_CACHE_KEY = 'stores_list_cache_v1'
const DEFAULT_STORES_URL = '/stores.qc.json'

function toRad(d){ return d * Math.PI / 180 }
function haversine(lat1, lon1, lat2, lon2){
  const R = 6371 // km
  const dLat = toRad(lat2-lat1)
  const dLon = toRad(lon2-lon1)
  const a = Math.sin(dLat/2)**2 + Math.cos(toRad(lat1))*Math.cos(toRad(lat2))*Math.sin(dLon/2)**2
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
  return R * c
}

export async function requestUserLocation(){
  return new Promise((resolve, reject) => {
    if(!('geolocation' in navigator)){
      console.error('Geolocation API not supported')
      reject(new Error('Geolocation non supportée'))
      return
    }
    console.log('Requesting geolocation permission...')
    navigator.geolocation.getCurrentPosition(async pos => {
      const coords = { lat: pos.coords.latitude, lon: pos.coords.longitude, ts: Date.now() }
      console.log('Geolocation success:', coords)
      await localforage.setItem(GEO_KEY, coords)
      resolve(coords)
    }, err => {
      console.error('Geolocation error:', err.code, err.message)
      reject(err)
    }, { enableHighAccuracy: true, timeout: 10000 })
  })
}

export async function getStoredLocation(){
  return await localforage.getItem(GEO_KEY)
}

export async function setRadiusKm(km){
  await localforage.setItem(RADIUS_KEY, Number(km))
}
export async function getRadiusKm(){
  return (await localforage.getItem(RADIUS_KEY)) || 5
}

async function loadStores(){
  // cache stores list
  const cached = await localforage.getItem(STORES_CACHE_KEY)
  if(cached && Array.isArray(cached) && cached.length){
    return cached
  }
  try{
    const res = await fetch(DEFAULT_STORES_URL, { cache: 'default' })
    if(res.ok){
      const data = await res.json()
      if(Array.isArray(data)){
        await localforage.setItem(STORES_CACHE_KEY, data)
        return data
      }
    }
  }catch(_){/* ignore */}
  return []
}

export async function listNearbyStores(){
  const loc = await getStoredLocation()
  if(!loc) return []
  const radius = await getRadiusKm()
  const stores = await loadStores()
  return stores.map(s => ({
    ...s,
    distanceKm: haversine(loc.lat, loc.lon, s.lat, s.lon)
  })).filter(s => s.distanceKm <= radius).sort((a,b) => a.distanceKm - b.distanceKm)
}
