/**
 * IStorageProvider - Abstract interface for storage implementations
 * 
 * This interface defines all storage operations needed by the application.
 * Implementations: LocalForageProvider (web), AsyncStorageProvider (React Native, future)
 */

export class IStorageProvider {
  /**
   * Initialize storage (create tables/collections if needed)
   * @returns {Promise<void>}
   */
  async init() {
    throw new Error('init() not implemented')
  }

  /**
   * Get a single item from storage
   * @param {string} key
   * @returns {Promise<any>}
   */
  async getItem(key) {
    throw new Error('getItem() not implemented')
  }

  /**
   * Set a single item in storage
   * @param {string} key
   * @param {any} value
   * @returns {Promise<void>}
   */
  async setItem(key, value) {
    throw new Error('setItem() not implemented')
  }

  /**
   * Remove a single item from storage
   * @param {string} key
   * @returns {Promise<void>}
   */
  async removeItem(key) {
    throw new Error('removeItem() not implemented')
  }

  /**
   * Get all keys in storage
   * @returns {Promise<string[]>}
   */
  async keys() {
    throw new Error('keys() not implemented')
  }

  /**
   * Clear all items in storage (use with caution)
   * @returns {Promise<void>}
   */
  async clear() {
    throw new Error('clear() not implemented')
  }
}
