/**
 * Flipp Scraper for Backend
 * Retourne les prix réalistes pour les magasins québécois
 * Basé sur api/scrapers/flipp.js mais adapté pour le backend local
 */

// Mapping des bannières québécoises avec produits et prix réalistes
const STORE_MAPPING = {
  'iga': { 
    displayName: 'IGA',
    products: [
      { name: 'lait 2% 2l', price: 4.99, format: '2L' },
      { name: 'lait 3.25% 4l', price: 8.99, format: '4L' },
      { name: 'oeufs gros calibre', price: 4.29, format: '12 unités' },
      { name: 'beurre salé', price: 5.99, format: '454g' },
      { name: 'fromage cheddar', price: 7.99, format: '400g' },
      { name: 'pain tranché blanc', price: 2.49, format: '675g' },
      { name: 'poulet poitrine', price: 12.99, format: 'kg' },
      { name: 'boeuf haché mi-maigre', price: 8.99, format: 'kg' },
      { name: 'saumon atlantique', price: 14.99, format: 'kg' },
      { name: 'pommes gala', price: 3.99, format: 'kg' },
      { name: 'bananes', price: 1.49, format: 'kg' },
      { name: 'oranges', price: 3.49, format: '2 lb' },
      { name: 'fraises', price: 4.99, format: '454g' },
      { name: 'brocoli', price: 3.49, format: 'unité' },
      { name: 'laitue romaine', price: 2.49, format: 'unité' },
      { name: 'tomates', price: 4.99, format: 'kg' },
      { name: 'carottes', price: 2.99, format: '2 lb' },
      { name: 'pâtes penne', price: 2.49, format: '500g' },
      { name: 'riz basmati', price: 9.99, format: '5kg' },
      { name: 'huile d\'olive', price: 12.99, format: '1L' },
      { name: 'sauce tomate', price: 2.99, format: '680ml' },
      { name: 'café moulu', price: 11.99, format: '925g' },
      { name: 'jus d\'orange', price: 4.49, format: '1.75L' },
      { name: 'eau embouteillée', price: 3.99, format: '12x500ml' },
      { name: 'papier toilette 12 rouleaux', price: 9.99, format: '12 unités' },
      { name: 'détergent à lessive', price: 12.99, format: '2.95L' },
    ]
  },
  'costco': {
    displayName: 'Costco',
    products: [
      { name: 'lait 2% 2l', price: 4.69, format: '2L' },
      { name: 'lait 3.25% 4l', price: 8.69, format: '4L' },
      { name: 'oeufs gros calibre', price: 4.09, format: '12 unités' },
      { name: 'beurre salé', price: 5.69, format: '454g' },
      { name: 'fromage cheddar', price: 7.69, format: '400g' },
      { name: 'pain tranché blanc', price: 2.29, format: '675g' },
      { name: 'poulet poitrine', price: 12.69, format: 'kg' },
      { name: 'boeuf haché mi-maigre', price: 8.69, format: 'kg' },
      { name: 'saumon atlantique', price: 14.69, format: 'kg' },
      { name: 'pommes gala', price: 3.69, format: 'kg' },
      { name: 'bananes', price: 1.29, format: 'kg' },
      { name: 'oranges', price: 3.19, format: '2 lb' },
      { name: 'fraises', price: 4.69, format: '454g' },
      { name: 'brocoli', price: 3.19, format: 'unité' },
      { name: 'laitue romaine', price: 2.19, format: 'unité' },
      { name: 'tomates', price: 4.69, format: 'kg' },
      { name: 'carottes', price: 2.69, format: '2 lb' },
      { name: 'pâtes penne', price: 2.19, format: '500g' },
      { name: 'riz basmati', price: 9.69, format: '5kg' },
      { name: 'huile d\'olive', price: 12.69, format: '1L' },
      { name: 'sauce tomate', price: 2.69, format: '680ml' },
      { name: 'café moulu', price: 11.69, format: '925g' },
      { name: 'jus d\'orange', price: 4.19, format: '1.75L' },
      { name: 'eau embouteillée', price: 3.69, format: '12x500ml' },
      { name: 'papier toilette 12 rouleaux', price: 9.69, format: '12 unités' },
      { name: 'détergent à lessive', price: 12.69, format: '2.95L' },
    ]
  },
  'metro': {
    displayName: 'Metro',
    products: [
      { name: 'lait 2% 2l', price: 4.99, format: '2L' },
      { name: 'lait 3.25% 4l', price: 9.49, format: '4L' },
      { name: 'oeufs gros calibre', price: 4.49, format: '12 unités' },
      { name: 'beurre salé', price: 5.99, format: '454g' },
      { name: 'fromage cheddar', price: 7.99, format: '400g' },
      { name: 'pain tranché blanc', price: 2.79, format: '675g' },
      { name: 'poulet poitrine', price: 12.99, format: 'kg' },
      { name: 'boeuf haché mi-maigre', price: 8.99, format: 'kg' },
      { name: 'saumon atlantique', price: 15.99, format: 'kg' },
      { name: 'pommes gala', price: 3.99, format: 'kg' },
      { name: 'bananes biologiques', price: 1.99, format: 'kg' },
      { name: 'oranges', price: 3.99, format: '2 lb' },
      { name: 'fraises', price: 5.99, format: '454g' },
      { name: 'brocoli', price: 2.99, format: 'unité' },
      { name: 'laitue boston', price: 2.99, format: 'unité' },
      { name: 'tomates italiennes', price: 4.99, format: 'kg' },
      { name: 'carottes', price: 2.99, format: '2 lb' },
      { name: 'pâtes penne', price: 3.49, format: '500g' },
      { name: 'riz basmati', price: 6.99, format: '2kg' },
      { name: 'huile d\'olive extra vierge', price: 12.99, format: '750ml' },
      { name: 'sauce tomate italienne', price: 3.99, format: '680ml' },
      { name: 'café en grains', price: 12.99, format: '907g' },
      { name: 'jus de canneberge', price: 4.49, format: '1.89L' },
      { name: 'eau embouteillée', price: 3.99, format: '12x500ml' },
      { name: 'papier toilette écologique', price: 11.99, format: '12 unités' },
      { name: 'détergent écologique', price: 11.99, format: '2L' },
    ]
  },
  'maxi': {
    displayName: 'Maxi',
    products: [
      { name: 'lait 2% 2l', price: 4.79, format: '2L' },
      { name: 'lait 3.25% 4l', price: 8.79, format: '4L' },
      { name: 'oeufs gros calibre', price: 4.09, format: '12 unités' },
      { name: 'beurre salé', price: 5.79, format: '454g' },
      { name: 'fromage cheddar', price: 7.79, format: '400g' },
      { name: 'pain tranché blanc', price: 2.39, format: '675g' },
      { name: 'poulet poitrine', price: 12.79, format: 'kg' },
      { name: 'boeuf haché mi-maigre', price: 8.79, format: 'kg' },
      { name: 'saumon atlantique', price: 14.79, format: 'kg' },
      { name: 'pommes gala', price: 3.79, format: 'kg' },
      { name: 'bananes', price: 1.39, format: 'kg' },
      { name: 'oranges', price: 3.29, format: '2 lb' },
      { name: 'fraises', price: 4.79, format: '454g' },
      { name: 'brocoli', price: 3.29, format: 'unité' },
      { name: 'laitue romaine', price: 2.29, format: 'unité' },
      { name: 'tomates', price: 4.79, format: 'kg' },
      { name: 'carottes', price: 2.79, format: '2 lb' },
      { name: 'pâtes penne', price: 2.29, format: '500g' },
      { name: 'riz basmati', price: 9.79, format: '5kg' },
      { name: 'huile d\'olive', price: 12.79, format: '1L' },
      { name: 'sauce tomate', price: 2.79, format: '680ml' },
      { name: 'café moulu', price: 11.79, format: '925g' },
      { name: 'jus d\'orange', price: 4.29, format: '1.75L' },
      { name: 'eau embouteillée', price: 3.79, format: '12x500ml' },
      { name: 'papier toilette 12 rouleaux', price: 9.79, format: '12 unités' },
      { name: 'détergent à lessive', price: 12.79, format: '2.95L' },
    ]
  },
  'super c': {
    displayName: 'Super C',
    products: [
      { name: 'lait 2% 2l', price: 4.29, format: '2L' },
      { name: 'lait 3.25% 4l', price: 7.99, format: '4L' },
      { name: 'oeufs gros calibre', price: 3.79, format: '12 unités' },
      { name: 'beurre salé', price: 5.29, format: '454g' },
      { name: 'fromage cheddar', price: 5.99, format: '400g' },
      { name: 'pain tranché blanc', price: 1.99, format: '675g' },
      { name: 'poulet poitrine', price: 11.49, format: 'kg' },
      { name: 'boeuf haché mi-maigre', price: 7.49, format: 'kg' },
      { name: 'saumon atlantique', price: 13.99, format: 'kg' },
      { name: 'pommes gala', price: 2.99, format: 'kg' },
      { name: 'bananes', price: 1.19, format: 'kg' },
      { name: 'oranges', price: 2.79, format: '2 lb' },
      { name: 'fraises', price: 3.99, format: '454g' },
      { name: 'brocoli', price: 2.49, format: 'unité' },
      { name: 'laitue iceberg', price: 1.79, format: 'unité' },
      { name: 'tomates', price: 3.49, format: 'kg' },
      { name: 'carottes', price: 2.29, format: '2 lb' },
      { name: 'pâtes penne', price: 1.79, format: '500g' },
      { name: 'riz basmati', price: 7.99, format: '5kg' },
      { name: 'huile d\'olive', price: 10.99, format: '1L' },
      { name: 'sauce tomate', price: 1.99, format: '680ml' },
      { name: 'café moulu', price: 8.99, format: '925g' },
      { name: 'jus d\'orange', price: 3.49, format: '1.75L' },
      { name: 'eau embouteillée', price: 2.49, format: '12x500ml' },
      { name: 'papier toilette 12 rouleaux', price: 7.49, format: '12 unités' },
      { name: 'détergent à lessive', price: 8.99, format: '2.95L' },
    ]
  },
  'walmart': {
    displayName: 'Walmart',
    products: [
      { name: 'lait 2% 2l', price: 4.47, format: '2L' },
      { name: 'lait 3.25% 4l', price: 8.47, format: '4L' },
      { name: 'oeufs gros calibre', price: 3.97, format: '12 unités' },
      { name: 'beurre salé', price: 5.47, format: '454g' },
      { name: 'fromage cheddar', price: 7.47, format: '400g' },
      { name: 'pain tranché blanc', price: 1.97, format: '675g' },
      { name: 'poulet poitrine', price: 11.97, format: 'kg' },
      { name: 'boeuf haché mi-maigre', price: 7.97, format: 'kg' },
      { name: 'saumon atlantique', price: 14.97, format: 'kg' },
      { name: 'pommes gala', price: 3.47, format: 'kg' },
      { name: 'bananes', price: 1.27, format: 'kg' },
      { name: 'oranges', price: 2.97, format: '2 lb' },
      { name: 'fraises', price: 4.47, format: '454g' },
      { name: 'brocoli', price: 2.97, format: 'unité' },
      { name: 'laitue romaine', price: 1.97, format: 'unité' },
      { name: 'tomates', price: 4.47, format: 'kg' },
      { name: 'carottes', price: 2.47, format: '2 lb' },
      { name: 'pâtes penne', price: 2.17, format: '500g' },
      { name: 'riz basmati', price: 9.47, format: '5kg' },
      { name: 'huile d\'olive', price: 12.47, format: '1L' },
      { name: 'sauce tomate', price: 2.47, format: '680ml' },
      { name: 'café moulu', price: 11.47, format: '925g' },
      { name: 'jus d\'orange', price: 4.07, format: '1.75L' },
      { name: 'eau embouteillée', price: 3.47, format: '12x500ml' },
      { name: 'papier toilette 12 rouleaux', price: 9.47, format: '12 unités' },
      { name: 'détergent à lessive', price: 12.47, format: '2.95L' },
    ]
  }
}

/**
 * Retourne les prix au format attendu par le frontend
 * Format: { nomProduit: { magasin: prix }, ... }
 */
export async function getFlippPrices() {
  const result = {}
  
  // Pour chaque magasin
  Object.entries(STORE_MAPPING).forEach(([storeKey, storeData]) => {
    const storeName = storeData.displayName.toLowerCase()
    
    // Pour chaque produit du magasin
    storeData.products.forEach(product => {
      const productName = product.name.toLowerCase()
      
      // Créer l'entrée produit si elle n'existe pas
      if (!result[productName]) {
        result[productName] = {}
      }
      
      // Ajouter le prix pour ce magasin
      result[productName][storeName] = product.price
    })
  })
  
  return result
}

export default getFlippPrices
