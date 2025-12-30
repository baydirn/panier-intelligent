/**
 * IGeolocationService - Abstract interface for geolocation implementations
 * 
 * This interface defines all geolocation operations needed by the application.
 * Implementations: BrowserGeolocationProvider (web), RNGeolocationProvider (React Native, future)
 */

export class IGeolocationService {
  /**
   * Get current user location (latitude, longitude)
   * @returns {Promise<{latitude: number, longitude: number}>}
   */
  async getCurrentLocation() {
    throw new Error('getCurrentLocation() not implemented')
  }

  /**
   * Get stores within a given radius from a location
   * @param {number} latitude
   * @param {number} longitude
   * @param {number} radiusKm
   * @param {Array} stores - Array of store objects with lat, lon
   * @returns {Promise<Array>} filtered stores
   */
  async getStoresByRadius(latitude, longitude, radiusKm, stores) {
    throw new Error('getStoresByRadius() not implemented')
  }

  /**
   * Calculate distance between two coordinates (Haversine formula)
   * @param {number} lat1
   * @param {number} lon1
   * @param {number} lat2
   * @param {number} lon2
   * @returns {number} distance in kilometers
   */
  calculateDistance(lat1, lon1, lat2, lon2) {
    throw new Error('calculateDistance() not implemented')
  }
}
