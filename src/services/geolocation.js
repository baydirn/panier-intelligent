import localforage from 'localforage'

const GEO_KEY = 'user_geo_v1'
const RADIUS_KEY = 'user_radius_km_v1'

// Static store list (sample coordinates around Montreal/QC) - extend as needed
export const STORES = [
  { id: 'iga_st_denys', name: 'IGA Saint-Denis', lat: 45.5234, lon: -73.585 },
  { id: 'metro_mont_royal', name: 'Metro Mont-Royal', lat: 45.5262, lon: -73.574 },
  { id: 'walmart_anjou', name: 'Walmart Anjou', lat: 45.607, lon: -73.560 },
  { id: 'maxi_papineau', name: 'Maxi Papineau', lat: 45.537, lon: -73.611 },
  { id: 'costco_brossard', name: 'Costco Brossard', lat: 45.455, lon: -73.454 }
]

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
      reject(new Error('Geolocation non supportée'))
      return
    }
    navigator.geolocation.getCurrentPosition(async pos => {
      const coords = { lat: pos.coords.latitude, lon: pos.coords.longitude, ts: Date.now() }
      await localforage.setItem(GEO_KEY, coords)
      resolve(coords)
    }, err => reject(err), { enableHighAccuracy: true, timeout: 10000 })
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

export async function listNearbyStores(){
  const loc = await getStoredLocation()
  if(!loc) return []
  const radius = await getRadiusKm()
  return STORES.map(s => ({
    ...s,
    distanceKm: haversine(loc.lat, loc.lon, s.lat, s.lon)
  })).filter(s => s.distanceKm <= radius).sort((a,b) => a.distanceKm - b.distanceKm)
}
