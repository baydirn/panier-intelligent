/**
 * LocalForageProvider - Browser IndexedDB implementation of IStorageProvider
 * 
 * Uses localforage library for cross-browser storage via IndexedDB
 */

import localforage from 'localforage'
import { IStorageProvider } from './IStorageProvider'

export class LocalForageProvider extends IStorageProvider {
  constructor() {
    super()
    // Configure localforage with app name
    localforage.config({
      name: 'PanierIntelligent',
      storeName: 'storage'
    })
  }

  async init() {
    // LocalForage initializes automatically, but we can verify connection
    try {
      await localforage.setItem('__init_check__', true)
      await localforage.removeItem('__init_check__')
    } catch (e) {
      console.error('[LocalForageProvider.init] Failed to initialize:', e)
      throw e
    }
  }

  async getItem(key) {
    try {
      return await localforage.getItem(key)
    } catch (e) {
      console.error(`[LocalForageProvider.getItem] Failed to get key "${key}":`, e)
      throw e
    }
  }

  async setItem(key, value) {
    try {
      return await localforage.setItem(key, value)
    } catch (e) {
      console.error(`[LocalForageProvider.setItem] Failed to set key "${key}":`, e)
      throw e
    }
  }

  async removeItem(key) {
    try {
      return await localforage.removeItem(key)
    } catch (e) {
      console.error(`[LocalForageProvider.removeItem] Failed to remove key "${key}":`, e)
      throw e
    }
  }

  async keys() {
    try {
      return await localforage.keys()
    } catch (e) {
      console.error('[LocalForageProvider.keys] Failed to list keys:', e)
      throw e
    }
  }

  async clear() {
    try {
      return await localforage.clear()
    } catch (e) {
      console.error('[LocalForageProvider.clear] Failed to clear storage:', e)
      throw e
    }
  }
}
