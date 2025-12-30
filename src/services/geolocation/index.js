/**
 * Geolocation service singleton and factory
 * 
 * Provides a single instance of the geolocation service throughout the application.
 * Can be swapped for different implementations (Browser for web, RN for mobile, etc.)
 */

import { BrowserGeolocationProvider } from './BrowserGeolocationProvider'

let geolocationService = null

/**
 * Get or create the global geolocation service instance
 * @returns {IGeolocationService}
 */
export function getGeolocationService() {
  if (!geolocationService) {
    // Default to BrowserGeolocationProvider for browser
    // Can be overridden by React Native or other environments
    geolocationService = new BrowserGeolocationProvider()
  }
  return geolocationService
}

/**
 * Set a custom geolocation service (for testing or alternate implementations)
 * @param {IGeolocationService} service
 */
export function setGeolocationService(service) {
  geolocationService = service
}
