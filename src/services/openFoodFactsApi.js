/**
 * Service d'intégration avec OpenFoodFacts
 * API gratuite et collaborative de produits alimentaires
 * Documentation: https://world.openfoodfacts.org/data
 */

const API_BASE_URL = 'https://world.openfoodfacts.org/api/v2'
const SEARCH_URL = 'https://world.openfoodfacts.org/cgi/search.pl'

/**
 * Rechercher un produit par code-barres
 * @param {string} barcode - Code-barres du produit (EAN, UPC, etc.)
 * @returns {Promise<Object|null>} Informations du produit ou null
 */
export async function getProductByBarcode(barcode) {
  try {
    const response = await fetch(`${API_BASE_URL}/product/${barcode}.json`)
    const data = await response.json()
    
    if (data.status === 1 && data.product) {
      return normalizeProduct(data.product)
    }
    
    return null
  } catch (error) {
    console.error('Erreur lors de la récupération du produit:', error)
    return null
  }
}

/**
 * Rechercher des produits par nom
 * @param {string} query - Terme de recherche
 * @param {number} page - Numéro de page (défaut: 1)
 * @param {number} pageSize - Nombre de résultats par page (défaut: 10)
 * @returns {Promise<Array>} Liste de produits
 */
export async function searchProductsByName(query, page = 1, pageSize = 10) {
  try {
    const params = new URLSearchParams({
      search_terms: query,
      page: page,
      page_size: pageSize,
      json: 1,
      fields: 'code,product_name,brands,quantity,image_url,categories'
    })
    
    const response = await fetch(`${SEARCH_URL}?${params}`)
    const data = await response.json()
    
    if (data.products && Array.isArray(data.products)) {
      return data.products.map(normalizeProduct)
    }
    
    return []
  } catch (error) {
    console.error('Erreur lors de la recherche:', error)
    return []
  }
}

/**
 * Normaliser les données d'un produit OpenFoodFacts
 * @param {Object} product - Produit brut de l'API
 * @returns {Object} Produit normalisé
 */
function normalizeProduct(product) {
  return {
    barcode: product.code || '',
    name: product.product_name || product.product_name_fr || 'Produit inconnu',
    brand: product.brands || '',
    quantity: product.quantity || '',
    categories: product.categories ? product.categories.split(',').map(c => c.trim()) : [],
    image: product.image_url || product.image_front_url || '',
    
    // Informations nutritionnelles (optionnel)
    nutriments: product.nutriments || {},
    
    // Informations supplémentaires
    stores: product.stores ? product.stores.split(',').map(s => s.trim()) : [],
    countries: product.countries ? product.countries.split(',').map(c => c.trim()) : [],
    
    // Lien vers la page du produit
    url: `https://world.openfoodfacts.org/product/${product.code}`
  }
}

/**
 * Extraire le format/taille d'un produit
 * @param {string} quantity - Quantité brute de l'API
 * @returns {string} Format normalisé
 */
export function extractFormat(quantity) {
  if (!quantity) return ''
  
  // Nettoyer et normaliser
  let format = quantity.toLowerCase().trim()
  
  // Patterns communs
  const patterns = [
    { regex: /(\d+\.?\d*)\s*l(?:itre)?s?/i, transform: (m) => `${m[1]}L` },
    { regex: /(\d+\.?\d*)\s*ml/i, transform: (m) => `${m[1]}ml` },
    { regex: /(\d+\.?\d*)\s*kg/i, transform: (m) => `${m[1]}kg` },
    { regex: /(\d+\.?\d*)\s*g(?:ramme)?s?/i, transform: (m) => `${m[1]}g` },
    { regex: /(\d+)\s*x\s*(\d+\.?\d*)\s*(ml|l|g|kg)/i, transform: (m) => `${m[1]}x${m[2]}${m[3]}` },
    { regex: /(\d+)\s*(?:unités?|units?|pcs?)/i, transform: (m) => `${m[1]} unités` }
  ]
  
  for (const { regex, transform } of patterns) {
    const match = format.match(regex)
    if (match) {
      return transform(match)
    }
  }
  
  return format
}

/**
 * Extraire la première marque d'une liste de marques
 * @param {string} brands - Liste de marques séparées par virgules
 * @returns {string} Première marque
 */
export function extractBrand(brands) {
  if (!brands) return ''
  
  const brandList = brands.split(',').map(b => b.trim())
  return brandList[0] || ''
}
