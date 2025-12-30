/**
 * Wrapper côté client pour le scraping IGA
 * Note: Le scraping Puppeteer doit être exécuté côté serveur
 * Cette version appelle l'API backend
 */

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001'

/**
 * Scraper IGA via backend API
 */
export async function scrapeIGA(options = {}) {
  try {
    const token = localStorage.getItem('adminToken')
    
    if (!token) {
      return {
        success: false,
        error: 'Authentification requise. Veuillez vous connecter en tant qu\'admin.',
        products: [],
        totalFound: 0
      }
    }

    const response = await fetch(`${BACKEND_URL}/api/admin/scrape/iga`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ options })
    })

    if (response.status === 401 || response.status === 403) {
      return {
        success: false,
        error: 'Token expiré ou invalide. Veuillez vous reconnecter.',
        products: [],
        totalFound: 0
      }
    }

    const data = await response.json()
    return data

  } catch (error) {
    console.error('[IGA Scraper Client] Erreur:', error)
    return {
      success: false,
      error: `Erreur de connexion au serveur: ${error.message}`,
      products: [],
      totalFound: 0
    }
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
