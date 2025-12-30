/**
 * Storage provider singleton and factory
 * 
 * Provides a single instance of the storage provider throughout the application.
 * Can be swapped for different implementations (LocalForage for web, AsyncStorage for RN, etc.)
 */

import { LocalForageProvider } from './LocalForageProvider'

let storageProvider = null

/**
 * Get or create the global storage provider instance
 * @returns {IStorageProvider}
 */
export function getStorageProvider() {
  if (!storageProvider) {
    // Default to LocalForageProvider for browser
    // Can be overridden by React Native or other environments
    storageProvider = new LocalForageProvider()
  }
  return storageProvider
}

/**
 * Set a custom storage provider (for testing or alternate implementations)
 * @param {IStorageProvider} provider
 */
export function setStorageProvider(provider) {
  storageProvider = provider
}

/**
 * Initialize the storage provider
 * @returns {Promise<void>}
 */
export async function initStorageProvider() {
  const provider = getStorageProvider()
  await provider.init()
}
