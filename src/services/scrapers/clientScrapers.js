/**
 * Wrapper côté client pour le scraping IGA
 * Note: Le scraping Puppeteer doit être exécuté côté serveur
 * Cette version montre comment l'intégrer
 */

/**
 * Version client (simulée pour demo)
 * En production, ceci appellerait un endpoint API backend qui exécute Puppeteer
 */
export async function scrapeIGA(options = {}) {
  // En production, ceci ferait:
  // const response = await fetch('/api/scrape/iga', { method: 'POST', body: JSON.stringify(options) })
  // return await response.json()
  
  // Pour l'instant, retourner des données de démonstration
  console.log('[IGA Scraper Client] Cette fonctionnalité nécessite un backend Node.js')
  console.log('[IGA Scraper Client] Pour activer: déployer scripts/test-iga-scraper.js sur un serveur')
  
  return {
    success: false,
    error: 'Le scraping web nécessite un backend Node.js. Utilisez plutôt l\'upload OCR ou déployez un serveur de scraping.',
    products: [],
    totalFound: 0,
    method: 'client-stub'
  }
}

/**
 * Scraper Metro (à implémenter)
 */
export async function scrapeMetro(options = {}) {
  return {
    success: false,
    error: 'Scraper Metro pas encore implémenté',
    products: [],
    totalFound: 0
  }
}

/**
 * Scraper Maxi (à implémenter)
 */
export async function scrapeMaxi(options = {}) {
  return {
    success: false,
    error: 'Scraper Maxi pas encore implémenté',
    products: [],
    totalFound: 0
  }
}
