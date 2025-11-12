/**
 * Service de synchronisation des prix depuis les scrapers
 * Intègre les données des scrapers IGA/Metro/Maxi dans la base de prix hebdomadaires
 */

import { ingestOcrProducts } from './weeklyPrices.js'
import localforage from 'localforage'

const LAST_SYNC_KEY = 'scraper_last_sync_v1'

/**
 * Synchroniser les prix depuis un scraper
 * @param {string} storeName - Nom du magasin (IGA, Metro, Maxi)
 * @param {Function} scraperFn - Fonction async du scraper qui retourne {success, products, ...}
 * @returns {Promise<{success: boolean, added: number, updated: number, error?: string}>}
 */
export async function syncPricesFromScraper(storeName, scraperFn) {
  console.log(`[Sync ${storeName}] Démarrage de la synchronisation...`)
  
  try {
    // Exécuter le scraper
    const result = await scraperFn()
    
    if (!result.success) {
      throw new Error(result.error || 'Scraping échoué')
    }

    console.log(`[Sync ${storeName}] ${result.totalFound} produits trouvés`)

    if (!result.products || result.products.length === 0) {
      return {
        success: false,
        added: 0,
        updated: 0,
        error: 'Aucun produit trouvé'
      }
    }

    // Convertir les produits du scraper au format de la base de données
    const productsForDB = result.products.map(p => ({
      name: p.name,
      price: p.price,
      volume: p.volume || '',
      image: p.image || '',
      description: p.description || '',
      category: p.category || '',
      validFrom: p.validFrom || new Date().toISOString().split('T')[0],
      validTo: p.validTo || getNextWeekDate(),
      source: 'scraper',
      scrapedAt: new Date().toISOString()
    }))

    // Injecter dans la base de prix hebdomadaires
    const ingestionResult = await ingestOcrProducts(storeName, productsForDB, {
      source: 'web-scraper',
      confidence: 1.0, // 100% de confiance (données structurées)
      method: result.method || 'scraper'
    })

    // Sauvegarder le timestamp de dernière sync
    await saveLastSyncTimestamp(storeName, {
      timestamp: new Date().toISOString(),
      productsFound: result.totalFound,
      added: ingestionResult.added,
      updated: ingestionResult.updated,
      method: result.method
    })

    console.log(`[Sync ${storeName}] ✅ Succès: +${ingestionResult.added} / ⟳${ingestionResult.updated}`)

    return {
      success: true,
      added: ingestionResult.added,
      updated: ingestionResult.updated,
      totalFound: result.totalFound,
      apisDiscovered: result.apisDiscovered?.length || 0
    }

  } catch (error) {
    console.error(`[Sync ${storeName}] ❌ Erreur:`, error)
    return {
      success: false,
      added: 0,
      updated: 0,
      error: error.message
    }
  }
}

/**
 * Obtenir la date de la semaine prochaine (format YYYY-MM-DD)
 */
function getNextWeekDate() {
  const date = new Date()
  date.setDate(date.getDate() + 7)
  return date.toISOString().split('T')[0]
}

/**
 * Sauvegarder le timestamp de dernière synchronisation
 */
async function saveLastSyncTimestamp(storeName, data) {
  const allSyncs = await localforage.getItem(LAST_SYNC_KEY) || {}
  allSyncs[storeName.toLowerCase()] = data
  await localforage.setItem(LAST_SYNC_KEY, allSyncs)
}

/**
 * Récupérer les infos de dernière synchronisation
 */
export async function getLastSync(storeName) {
  const allSyncs = await localforage.getItem(LAST_SYNC_KEY) || {}
  return allSyncs[storeName.toLowerCase()] || null
}

/**
 * Récupérer toutes les dernières synchronisations
 */
export async function getAllLastSyncs() {
  return await localforage.getItem(LAST_SYNC_KEY) || {}
}
