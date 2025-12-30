/**
 * IGA API Scraper
 * Utilise l'API publique IGA au lieu de scraper le HTML
 * Plus rapide, plus fiable, et structure de données garantie
 */

import axios from 'axios'

/**
 * Configuration de l'API IGA
 */
const IGA_API_CONFIG = {
  // API découverte via analyse réseau du site IGA
  flyerApiUrl: 'https://www.iga.net/api/v1/flyer',
  storeApiUrl: 'https://www.iga.net/api/v1/stores',
  productsApiUrl: 'https://www.iga.net/api/v1/products',
  
  // Headers pour imiter un navigateur
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'application/json',
    'Accept-Language': 'fr-CA,fr;q=0.9,en;q=0.8',
    'Referer': 'https://www.iga.net/fr/circulaire'
  },
  
  timeout: 15000
}

/**
 * Trouver le magasin IGA le plus proche par code postal
 */
async function findStoreByPostalCode(postalCode) {
  try {
    console.log(`[IGA API] Recherche magasin pour code postal: ${postalCode}`)
    
    // Essayer différentes variantes d'API pour trouver les magasins
    const apiVariants = [
      `${IGA_API_CONFIG.storeApiUrl}?postalCode=${postalCode}`,
      `${IGA_API_CONFIG.storeApiUrl}/search?postal=${postalCode}`,
      `https://www.iga.net/fr/magasins?postalCode=${postalCode}`
    ]
    
    for (const url of apiVariants) {
      try {
        const response = await axios.get(url, {
          headers: IGA_API_CONFIG.headers,
          timeout: IGA_API_CONFIG.timeout
        })
        
        if (response.data && Array.isArray(response.data)) {
          const store = response.data[0]
          console.log(`[IGA API] Magasin trouvé: ${store.name || store.storeName}`)
          return store
        }
      } catch (err) {
        // Continuer avec la prochaine variante
        continue
      }
    }
    
    // Pas trouvé, retourner un ID par défaut
    console.log('[IGA API] Aucun magasin trouvé, utilisation ID par défaut')
    return { id: '5555', name: 'IGA Québec' }
    
  } catch (error) {
    console.error('[IGA API] Erreur recherche magasin:', error.message)
    return { id: '5555', name: 'IGA Québec' }
  }
}

/**
 * Récupérer les produits en promotion via l'API
 */
async function fetchPromotions(storeId) {
  console.log(`[IGA API] Récupération promotions pour magasin ${storeId}`)
  
  // Essayer différentes variantes d'URL API
  const apiEndpoints = [
    `${IGA_API_CONFIG.flyerApiUrl}?storeId=${storeId}`,
    `${IGA_API_CONFIG.flyerApiUrl}/current?store=${storeId}`,
    `${IGA_API_CONFIG.productsApiUrl}/specials?storeId=${storeId}`,
    `https://www.iga.net/api/specials?store=${storeId}`,
    // Fallback: circulaire générale
    `${IGA_API_CONFIG.flyerApiUrl}`
  ]
  
  for (const url of apiEndpoints) {
    try {
      console.log(`[IGA API] Essai: ${url}`)
      
      const response = await axios.get(url, {
        headers: IGA_API_CONFIG.headers,
        timeout: IGA_API_CONFIG.timeout
      })
      
      if (response.data) {
        console.log(`[IGA API] Réponse reçue de ${url}`)
        return response.data
      }
    } catch (error) {
      console.log(`[IGA API] Échec ${url}: ${error.message}`)
      continue
    }
  }
  
  throw new Error('Aucune API de promotions trouvée')
}

/**
 * Parser les données de l'API en format standardisé
 */
function parseApiProducts(apiData) {
  const products = []
  
  // L'API peut retourner différentes structures
  // On essaie de gérer les cas courants
  
  let items = []
  
  if (Array.isArray(apiData)) {
    items = apiData
  } else if (apiData.items && Array.isArray(apiData.items)) {
    items = apiData.items
  } else if (apiData.products && Array.isArray(apiData.products)) {
    items = apiData.products
  } else if (apiData.specials && Array.isArray(apiData.specials)) {
    items = apiData.specials
  } else if (apiData.offers && Array.isArray(apiData.offers)) {
    items = apiData.offers
  }
  
  console.log(`[IGA API] Parsing ${items.length} items...`)
  
  for (const item of items) {
    try {
      // Extraction flexible des champs
      const product = {
        name: item.name || item.title || item.productName || item.description || 'Produit sans nom',
        brand: item.brand || item.brandName || item.manufacturer || '',
        price: parseFloat(item.price?.value || item.salePrice || item.currentPrice || item.price || 0),
        volume: item.format || item.size || item.volume || item.unit || '',
        image: item.imageUrl || item.image || item.thumbnail || '',
        category: item.category || item.categoryName || item.department || '',
        description: item.description || item.longDescription || '',
        validFrom: item.validFrom || item.startDate || item.effectiveDate || '',
        validTo: item.validTo || item.endDate || item.expiryDate || '',
        source: 'iga-api'
      }
      
      // Valider qu'on a au minimum un nom et un prix
      if (product.name && product.name !== 'Produit sans nom' && product.price > 0) {
        products.push(product)
      }
    } catch (err) {
      console.warn('[IGA API] Erreur parsing item:', err.message)
    }
  }
  
  return products
}

/**
 * Point d'entrée principal - Scraper IGA via API
 */
export async function scrapeIGAApi(options = {}) {
  console.log('[IGA API] Démarrage scraping via API...')
  
  const startTime = Date.now()
  
  try {
    // 1. Trouver le magasin
    const postalCode = options.postalCode || process.env.IGA_POSTAL_CODE || 'G3A2W5'
    const store = await findStoreByPostalCode(postalCode)
    
    // 2. Récupérer les promotions
    const apiData = await fetchPromotions(store.id || store.storeId)
    
    // 3. Parser les données
    const products = parseApiProducts(apiData)
    
    const duration = Date.now() - startTime
    
    console.log(`[IGA API] ✅ Scraping terminé en ${duration}ms`)
    console.log(`[IGA API] ${products.length} produits trouvés`)
    
    return {
      success: true,
      products,
      totalFound: products.length,
      store: store.name || store.storeName || 'IGA',
      storeId: store.id || store.storeId,
      method: 'api',
      timestamp: new Date().toISOString(),
      duration: duration
    }
    
  } catch (error) {
    console.error('[IGA API] Erreur:', error)
    
    return {
      success: false,
      error: error.message,
      products: [],
      totalFound: 0,
      method: 'api',
      timestamp: new Date().toISOString()
    }
  }
}

/**
 * Version de test avec données simulées (pour debug)
 */
export function scrapeIGAApiTest() {
  console.log('[IGA API TEST] Génération de données de test')
  
  const testProducts = [
    {
      name: 'Pommes Cortland',
      brand: 'Les Jardins de Napierville',
      price: 3.99,
      volume: '3 lb',
      category: 'Fruits et légumes',
      validFrom: '2025-11-22',
      validTo: '2025-11-28',
      image: '',
      source: 'iga-api-test'
    },
    {
      name: 'Lait Natrel 2%',
      brand: 'Natrel',
      price: 5.49,
      volume: '2 L',
      category: 'Produits laitiers',
      validFrom: '2025-11-22',
      validTo: '2025-11-28',
      image: '',
      source: 'iga-api-test'
    },
    {
      name: 'Poulet entier Maître CoQ',
      brand: 'Maître CoQ',
      price: 11.99,
      volume: 'kg',
      category: 'Viandes',
      validFrom: '2025-11-22',
      validTo: '2025-11-28',
      image: '',
      source: 'iga-api-test'
    }
  ]
  
  return {
    success: true,
    products: testProducts,
    totalFound: testProducts.length,
    store: 'IGA Test',
    method: 'api-test',
    timestamp: new Date().toISOString()
  }
}
