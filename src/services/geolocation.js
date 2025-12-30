import { getStorageProvider } from './storage'
import { getGeolocationService } from './geolocation/index'
import { getStoreCatalog } from '../domain/stores'

const GEO_KEY = 'user_geo_v1'
const RADIUS_KEY = 'user_radius_km_v1'
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
  const storage = getStorageProvider()
  const geoService = getGeolocationService()
  
  try {
    const position = await geoService.getCurrentLocation()
    const coords = { lat: position.latitude, lon: position.longitude, ts: Date.now(), source: 'geo' }
    console.log('Geolocation success:', coords)
    await storage.setItem(GEO_KEY, coords)
    return coords
  } catch (err) {
    console.error('Geolocation error:', err.message)
    // Graceful fallback: if user denies, keep previous location if exists
    const prev = await storage.getItem(GEO_KEY)
    if(prev){
      console.warn('Using previously stored location as fallback.')
      return prev
    }
    throw err
  }
}

// Postal code centroid lightweight fallback (Canada approximate mapping by first 3 chars)
const POSTAL_PREFIX = {
  // Montréal
  'H1': { lat: 45.59, lon: -73.54 },
  'H2': { lat: 45.52, lon: -73.57 },
  'H3': { lat: 45.49, lon: -73.58 },
  'H4': { lat: 45.47, lon: -73.67 },
  'H7': { lat: 45.61, lon: -73.77 },
  'H8': { lat: 45.45, lon: -73.68 },
  'H9': { lat: 45.43, lon: -73.83 },
  // Laval
  'H7': { lat: 45.61, lon: -73.77 },
  // Rive-Nord
  'J7': { lat: 45.73, lon: -73.52 },
  'J6': { lat: 45.58, lon: -73.45 },
  // Québec
  'G1': { lat: 46.81, lon: -71.21 },
  'G2': { lat: 46.79, lon: -71.28 },
  'G3': { lat: 46.77, lon: -71.27 },
  'G4': { lat: 46.85, lon: -71.24 },
  'G5': { lat: 46.76, lon: -71.33 },
  'G6': { lat: 46.78, lon: -71.23 },
  'G7': { lat: 46.74, lon: -71.30 },
  'G8': { lat: 46.83, lon: -71.26 },
  // Gatineau
  'J8': { lat: 45.48, lon: -75.70 },
  'J9': { lat: 45.43, lon: -75.65 },
  // Sherbrooke
  'J1': { lat: 45.40, lon: -71.89 },
  // Trois-Rivières
  'G8': { lat: 46.34, lon: -72.54 },
  'G9': { lat: 46.35, lon: -72.55 }
}

export async function setLocationFromPostal(postal){
  const storage = getStorageProvider()
  if(!postal) return null
  const prefix = String(postal).toUpperCase().replace(/\s+/g,'').slice(0,2)
  const entry = POSTAL_PREFIX[prefix]
  if(!entry) return null
  const coords = { lat: entry.lat, lon: entry.lon, ts: Date.now(), source: 'postal' }
  await storage.setItem(GEO_KEY, coords)
  return coords
}

export async function getStoredLocation(){
  const storage = getStorageProvider()
  return await storage.getItem(GEO_KEY)
}

export async function setRadiusKm(km){
  const storage = getStorageProvider()
  await storage.setItem(RADIUS_KEY, Number(km))
}
export async function getRadiusKm(){
  const storage = getStorageProvider()
  return (await storage.getItem(RADIUS_KEY)) || 5
}

async function loadStores(){
  // Fallback to catalog if external stores.qc.json not available
  try{
    const res = await fetch(DEFAULT_STORES_URL, { cache: 'default' })
    if(res.ok){
      const data = await res.json()
      if(Array.isArray(data) && data.length > 0){
        return data
      }
    }
  }catch(_){/* ignore */}
  // Use domain catalog as fallback
  return getStoreCatalog()
}

export async function listNearbyStores(){
  const loc = await getStoredLocation()
  if(!loc){ 
    console.warn('No stored location for nearby stores')
    return [] 
  }
  const radius = await getRadiusKm()
  const stores = await loadStores()
  console.log('[geolocation] Loaded stores:', stores.length, 'Sample:', stores[0])
  console.log('[geolocation] User location:', loc, 'Radius:', radius)
  const nearby = stores
    .filter(s => s.lat != null && s.lon != null)
    .map(s => ({
      ...s,
      distanceKm: haversine(loc.lat, loc.lon, s.lat, s.lon)
    }))
    .filter(s => s.distanceKm <= radius)
    .sort((a,b) => a.distanceKm - b.distanceKm)
  console.log('[geolocation] Nearby stores:', nearby.length, 'Sample:', nearby[0])
  return nearby
}

// Return all stores with computed distance (ignores radius), sorted ascending.
export async function listStoresWithDistance(){
  const loc = await getStoredLocation()
  if(!loc){ return [] }
  const stores = await loadStores()
  return stores
    .filter(s => s.lat != null && s.lon != null)
    .map(s => ({
      ...s,
      distanceKm: haversine(loc.lat, loc.lon, s.lat, s.lon)
    }))
    .sort((a,b) => a.distanceKm - b.distanceKm)
}
