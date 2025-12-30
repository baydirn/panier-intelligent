/**
 * BrowserGeolocationProvider - Browser Geolocation API implementation
 * 
 * Uses native browser Geolocation API (GPS on mobile, IP-based on desktop)
 */

import { IGeolocationService } from './IGeolocationService'

export class BrowserGeolocationProvider extends IGeolocationService {
  async getCurrentLocation() {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation API not available'))
        return
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy
          })
        },
        (error) => {
          console.error('[BrowserGeolocationProvider.getCurrentLocation] Error:', error)
          reject(error)
        },
        { timeout: 10000, enableHighAccuracy: false }
      )
    })
  }

  async getStoresByRadius(latitude, longitude, radiusKm, stores) {
    if (!Array.isArray(stores)) return []
    return stores.filter((store) => {
      if (store.latitude == null || store.longitude == null) return false
      const distance = this.calculateDistance(
        latitude,
        longitude,
        store.latitude,
        store.longitude
      )
      return distance <= radiusKm
    })
  }

  calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371 // Earth radius in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180
    const dLon = ((lon2 - lon1) * Math.PI) / 180
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
  }
}
