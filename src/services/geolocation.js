import localforage from 'localforage'
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
  return new Promise((resolve, reject) => {
    if(!('geolocation' in navigator)){
      console.error('Geolocation API not supported')
      reject(new Error('Geolocation non supportée'))
      return
    }
    console.log('Requesting geolocation permission...')
    navigator.geolocation.getCurrentPosition(async pos => {
      const coords = { lat: pos.coords.latitude, lon: pos.coords.longitude, ts: Date.now(), source: 'geo' }
      console.log('Geolocation success:', coords)
      await localforage.setItem(GEO_KEY, coords)
      resolve(coords)
    }, async err => {
      console.error('Geolocation error:', err.code, err.message)
      // Graceful fallback: if user denies, keep previous location if exists
      const prev = await localforage.getItem(GEO_KEY)
      if(prev){
        console.warn('Using previously stored location as fallback.')
        resolve(prev)
        return
      }
      reject(err)
    }, { enableHighAccuracy: true, timeout: 10000 })
  })
}

// Postal code centroid lightweight fallback (Canada approximate mapping by first 3 chars)
const POSTAL_PREFIX = {
  'H1': { lat: 45.59, lon: -73.54 },
  'H2': { lat: 45.52, lon: -73.57 },
  'H3': { lat: 45.49, lon: -73.58 },
  'H4': { lat: 45.47, lon: -73.67 },
  'H7': { lat: 45.61, lon: -73.77 },
  'J7': { lat: 45.73, lon: -73.52 }
}

export async function setLocationFromPostal(postal){
  if(!postal) return null
  const prefix = String(postal).toUpperCase().replace(/\s+/g,'').slice(0,2)
  const entry = POSTAL_PREFIX[prefix]
  if(!entry) return null
  const coords = { lat: entry.lat, lon: entry.lon, ts: Date.now(), source: 'postal' }
  await localforage.setItem(GEO_KEY, coords)
  return coords
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
  console.log('Loaded stores:', stores.length, 'User location:', loc, 'Radius:', radius)
  const nearby = stores
    .filter(s => s.lat != null && s.lon != null)
    .map(s => ({
      ...s,
      distanceKm: haversine(loc.lat, loc.lon, s.lat, s.lon)
    }))
    .filter(s => s.distanceKm <= radius)
    .sort((a,b) => a.distanceKm - b.distanceKm)
  console.log('Nearby stores:', nearby.length)
  return nearby
}
