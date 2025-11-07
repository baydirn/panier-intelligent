// Base de données de produits avec marques et formats réels du marché québécois
export const PRODUCT_CATEGORIES = {
  LAIT: 'Produits laitiers',
  PAIN: 'Boulangerie',
  VIANDE: 'Viandes',
  FRUITS: 'Fruits et légumes',
  BOISSONS: 'Boissons',
  EPICERIE: 'Épicerie',
  HYGIENE: 'Hygiène',
  AUTRE: 'Autre'
}

// Formats standards par catégorie
export const FORMATS = {
  LIQUIDE: ['250ml', '500ml', '1L', '2L', '3L', '4L'],
  POIDS: ['100g', '250g', '500g', '750g', '1kg', '2kg', '5kg'],
  UNITE: ['1 unité', '2 unités', '4 unités', '6 unités', '12 unités', '24 unités'],
  PAIN: ['1 pain', '400g', '600g', '750g'],
  AUTRE: ['petit', 'moyen', 'grand', 'format familial']
}

// Base de données de produits réels
export const PRODUCTS_DB = {
  // PRODUITS LAITIERS
  'lait': {
    category: PRODUCT_CATEGORIES.LAIT,
    keywords: ['lait', 'milk'],
    brands: [
      { name: 'Québon', formats: ['1L', '2L', '4L'] },
      { name: 'Natrel', formats: ['1L', '2L', '4L'] },
      { name: 'Lactantia', formats: ['1L', '2L', '4L'] },
      { name: 'Beatrice', formats: ['1L', '2L', '4L'] },
      { name: 'Selection', formats: ['1L', '2L', '4L'] }
    ],
    defaultQuantities: ['x1', 'x2', 'x3', 'x4']
  },
  'yogourt': {
    category: PRODUCT_CATEGORIES.LAIT,
    keywords: ['yogourt', 'yogurt', 'yoplait'],
    brands: [
      { name: 'Yoplait', formats: ['100g', '650g', '750g'] },
      { name: 'Danone', formats: ['100g', '500g', '650g'] },
      { name: 'Oikos', formats: ['100g', '500g', '750g'] },
      { name: 'iögo', formats: ['100g', '650g', '16x100g'] },
      { name: 'Liberté', formats: ['500g', '750g', '1kg'] }
    ],
    defaultQuantities: ['x1', 'x2', 'x4', 'x6']
  },
  'fromage': {
    category: PRODUCT_CATEGORIES.LAIT,
    keywords: ['fromage', 'cheese', 'cheddar'],
    brands: [
      { name: 'Black Diamond', formats: ['200g', '400g', '600g'] },
      { name: 'Armstrong', formats: ['200g', '400g', '600g'] },
      { name: 'P\'tit Québec', formats: ['200g', '400g'] },
      { name: 'Selection', formats: ['200g', '400g', '600g'] }
    ],
    defaultQuantities: ['x1', 'x2', 'x3']
  },
  'beurre': {
    category: PRODUCT_CATEGORIES.LAIT,
    keywords: ['beurre', 'butter'],
    brands: [
      { name: 'Lactantia', formats: ['454g'] },
      { name: 'Gay Lea', formats: ['454g'] },
      { name: 'Selection', formats: ['454g'] }
    ],
    defaultQuantities: ['x1', 'x2', 'x3']
  },

  // PAIN ET BOULANGERIE
  'pain': {
    category: PRODUCT_CATEGORIES.PAIN,
    keywords: ['pain', 'bread'],
    brands: [
      { name: 'Gadoua', formats: ['1 pain', '675g'] },
      { name: 'Bon Matin', formats: ['1 pain', '570g', '675g'] },
      { name: 'POM', formats: ['1 pain', '600g'] },
      { name: 'St-Méthode', formats: ['1 pain', '450g'] },
      { name: 'Boulangerie Première Moisson', formats: ['1 pain', '450g', '600g'] }
    ],
    defaultQuantities: ['x1', 'x2', 'x3']
  },
  'bagel': {
    category: PRODUCT_CATEGORIES.PAIN,
    keywords: ['bagel', 'bagels'],
    brands: [
      { name: 'St-Viateur', formats: ['6 unités', '12 unités'] },
      { name: 'Fairmount', formats: ['6 unités', '12 unités'] },
      { name: 'Thomas', formats: ['6 unités'] }
    ],
    defaultQuantities: ['x1', 'x2']
  },

  // VIANDES
  'poulet': {
    category: PRODUCT_CATEGORIES.VIANDE,
    keywords: ['poulet', 'chicken', 'poitrine'],
    brands: [
      { name: 'Exceldor', formats: ['500g', '1kg', '2kg'] },
      { name: 'Flamingo', formats: ['500g', '1kg'] },
      { name: 'Sans nom', formats: ['1kg'] }
    ],
    defaultQuantities: ['x1', 'x2']
  },
  'boeuf haché': {
    category: PRODUCT_CATEGORIES.VIANDE,
    keywords: ['boeuf', 'haché', 'viande hachée'],
    brands: [
      { name: 'Angus', formats: ['454g', '900g'] },
      { name: 'Olymel', formats: ['454g', '900g'] },
      { name: 'Selection', formats: ['454g', '900g'] }
    ],
    defaultQuantities: ['x1', 'x2', 'x3']
  },

  // FRUITS ET LÉGUMES
  'banane': {
    category: PRODUCT_CATEGORIES.FRUITS,
    keywords: ['banane', 'banana'],
    brands: [
      { name: 'Chiquita', formats: ['6 unités', '1kg'] },
      { name: 'Del Monte', formats: ['6 unités', '1kg'] },
      { name: 'Équitable', formats: ['1kg'] }
    ],
    defaultQuantities: ['x1', 'x2', 'x3']
  },
  'pomme': {
    category: PRODUCT_CATEGORIES.FRUITS,
    keywords: ['pomme', 'apple', 'cortland', 'gala'],
    brands: [
      { name: 'Québec', formats: ['1kg', '2kg', '4kg'] },
      { name: 'Gala', formats: ['1kg', '3kg'] },
      { name: 'Cortland', formats: ['1kg', '3kg'] }
    ],
    defaultQuantities: ['x1', 'x2']
  },

  // BOISSONS
  'jus d\'orange': {
    category: PRODUCT_CATEGORIES.BOISSONS,
    keywords: ['jus', 'orange', 'jus d\'orange'],
    brands: [
      { name: 'Tropicana', formats: ['1L', '1.54L', '2.63L'] },
      { name: 'Oasis', formats: ['960ml', '1.75L'] },
      { name: 'Simply Orange', formats: ['1.54L', '2.63L'] },
      { name: 'Selection', formats: ['1L', '2L'] }
    ],
    defaultQuantities: ['x1', 'x2']
  },
  'eau': {
    category: PRODUCT_CATEGORIES.BOISSONS,
    keywords: ['eau', 'water', 'dasani', 'eska'],
    brands: [
      { name: 'Eska', formats: ['500ml', '1L', '12x500ml', '24x500ml'] },
      { name: 'Naya', formats: ['500ml', '1.5L', '12x500ml'] },
      { name: 'Dasani', formats: ['500ml', '12x500ml', '24x500ml'] }
    ],
    defaultQuantities: ['x1', 'x2', 'x3']
  },

  // ÉPICERIE
  'pâtes': {
    category: PRODUCT_CATEGORIES.EPICERIE,
    keywords: ['pâtes', 'pasta', 'spaghetti', 'macaroni'],
    brands: [
      { name: 'Catelli', formats: ['375g', '450g', '900g'] },
      { name: 'Barilla', formats: ['410g', '500g'] },
      { name: 'De Cecco', formats: ['500g', '1kg'] }
    ],
    defaultQuantities: ['x1', 'x2', 'x3', 'x4']
  },
  'riz': {
    category: PRODUCT_CATEGORIES.EPICERIE,
    keywords: ['riz', 'rice', 'basmati'],
    brands: [
      { name: 'Uncle Ben\'s', formats: ['900g', '2kg', '5kg'] },
      { name: 'Tilda', formats: ['500g', '1kg'] },
      { name: 'Selection', formats: ['1kg', '2kg', '5kg'] }
    ],
    defaultQuantities: ['x1', 'x2']
  },
  'céréales': {
    category: PRODUCT_CATEGORIES.EPICERIE,
    keywords: ['céréales', 'cereal'],
    brands: [
      { name: 'Cheerios', formats: ['285g', '430g', '570g'] },
      { name: 'Special K', formats: ['305g', '430g'] },
      { name: 'Corn Flakes', formats: ['340g', '450g'] },
      { name: 'Vector', formats: ['375g', '450g'] }
    ],
    defaultQuantities: ['x1', 'x2', 'x3']
  },

  // HYGIÈNE
  'papier toilette': {
    category: PRODUCT_CATEGORIES.HYGIENE,
    keywords: ['papier', 'toilette', 'pq'],
    brands: [
      { name: 'Cashmere', formats: ['12 rouleaux', '24 rouleaux', '30 rouleaux'] },
      { name: 'Charmin', formats: ['12 rouleaux', '24 rouleaux'] },
      { name: 'Royale', formats: ['12 rouleaux', '24 rouleaux', '30 rouleaux'] }
    ],
    defaultQuantities: ['x1', 'x2']
  },
  'savon': {
    category: PRODUCT_CATEGORIES.HYGIENE,
    keywords: ['savon', 'soap', 'dove'],
    brands: [
      { name: 'Dove', formats: ['90g', '106g', '2x106g'] },
      { name: 'Ivory', formats: ['90g', '3x90g'] },
      { name: 'Irish Spring', formats: ['104g', '3x104g'] }
    ],
    defaultQuantities: ['x1', 'x2', 'x3']
  }
  ,
  // NOUVEAUX PRODUITS
  'oeufs': {
    category: PRODUCT_CATEGORIES.EPICERIE,
    keywords: ['oeufs', 'oeuf', 'eggs'],
    brands: [
      { name: 'Selection', formats: ['12 unités', '18 unités'] },
      { name: 'Omega-3', formats: ['12 unités'] },
      { name: 'Ferme locale', formats: ['12 unités'] }
    ],
    defaultQuantities: ['x1', 'x2']
  },
  'farine': {
    category: PRODUCT_CATEGORIES.EPICERIE,
    keywords: ['farine', 'flour'],
    brands: [
      { name: 'Robin Hood', formats: ['1kg', '2.5kg', '5kg'] },
      { name: 'Five Roses', formats: ['1kg', '2.5kg', '5kg'] }
    ],
    defaultQuantities: ['x1', 'x2']
  },
  'sucre': {
    category: PRODUCT_CATEGORIES.EPICERIE,
    keywords: ['sucre', 'sugar'],
    brands: [
      { name: 'Redpath', formats: ['1kg', '2kg'] },
      { name: 'Selection', formats: ['1kg', '2kg'] }
    ],
    defaultQuantities: ['x1', 'x2']
  },
  'cafe': {
    category: PRODUCT_CATEGORIES.EPICERIE,
    keywords: ['cafe', 'coffee'],
    brands: [
      { name: 'Van Houtte', formats: ['340g', '1kg'] },
      { name: 'Tim Hortons', formats: ['300g', '1kg'] },
      { name: 'Starbucks', formats: ['340g', '1kg'] }
    ],
    defaultQuantities: ['x1', 'x2']
  },
  'the': {
    category: PRODUCT_CATEGORIES.EPICERIE,
    keywords: ['the', 'tea'],
    brands: [
      { name: 'Tetley', formats: ['20 unités', '72 unités'] },
      { name: 'Lipton', formats: ['20 unités', '72 unités'] }
    ],
    defaultQuantities: ['x1', 'x2']
  },
  'huile': {
    category: PRODUCT_CATEGORIES.EPICERIE,
    keywords: ['huile', "huile d'olive", 'canola'],
    brands: [
      { name: 'Bertolli', formats: ['500ml', '1L'] },
      { name: 'Filipo Berio', formats: ['500ml', '1L'] },
      { name: 'Mazola', formats: ['1L', '2L'] }
    ],
    defaultQuantities: ['x1', 'x2']
  },
  'vinaigre': {
    category: PRODUCT_CATEGORIES.EPICERIE,
    keywords: ['vinaigre', 'balsamique', 'cidre'],
    brands: [
      { name: 'Selection', formats: ['500ml', '1L'] },
      { name: 'Maille', formats: ['500ml'] }
    ],
    defaultQuantities: ['x1']
  },
  'tomate': {
    category: PRODUCT_CATEGORIES.FRUITS,
    keywords: ['tomate', 'tomates'],
    brands: [
      { name: 'Québec', formats: ['1lb', '2lb'] }
    ],
    defaultQuantities: ['x1', 'x2']
  },
  'laitue': {
    category: PRODUCT_CATEGORIES.FRUITS,
    keywords: ['laitue', 'salade'],
    brands: [
      { name: 'Romaine', formats: ['1 unité'] },
      { name: 'Iceberg', formats: ['1 unité'] }
    ],
    defaultQuantities: ['x1', 'x2']
  },
  'oignon': {
    category: PRODUCT_CATEGORIES.FRUITS,
    keywords: ['oignon', 'oignons', 'onion'],
    brands: [
      { name: 'Jaune', formats: ['1kg', '2kg'] },
      { name: 'Rouge', formats: ['1kg'] }
    ],
    defaultQuantities: ['x1']
  },
  'chips': {
    category: PRODUCT_CATEGORIES.EPICERIE,
    keywords: ['chips', 'croustilles'],
    brands: [
      { name: 'Lay\'s', formats: ['180g', '235g'] },
      { name: 'Ruffles', formats: ['180g', '230g'] }
    ],
    defaultQuantities: ['x1', 'x2', 'x3']
  },
  'biscuits': {
    category: PRODUCT_CATEGORIES.EPICERIE,
    keywords: ['biscuits', 'cookies'],
    brands: [
      { name: 'Oreo', formats: ['270g', '500g'] },
      { name: 'Chips Ahoy', formats: ['300g'] }
    ],
    defaultQuantities: ['x1', 'x2']
  },
  'essuie-tout': {
    category: PRODUCT_CATEGORIES.HYGIENE,
    keywords: ['essuie-tout', 'paper towel'],
    brands: [
      { name: 'Bounty', formats: ['6 rouleaux', '12 rouleaux'] },
      { name: 'SpongeTowels', formats: ['6 rouleaux'] }
    ],
    defaultQuantities: ['x1']
  },
  'detergent': {
    category: PRODUCT_CATEGORIES.HYGIENE,
    keywords: ['detergent', 'lessive', 'tide'],
    brands: [
      { name: 'Tide', formats: ['1.09L', '1.47L'] },
      { name: 'Persil', formats: ['1.18L'] }
    ],
    defaultQuantities: ['x1']
  }
}

// Fonction de recherche de produit
export function findProduct(searchTerm) {
  if (!searchTerm) return null
  
  const term = searchTerm.toLowerCase().trim()
  
  // Recherche exacte
  if (PRODUCTS_DB[term]) {
    return { key: term, ...PRODUCTS_DB[term] }
  }
  
  // Recherche par mots-clés
  for (const [key, product] of Object.entries(PRODUCTS_DB)) {
    if (product.keywords.some(keyword => term.includes(keyword) || keyword.includes(term))) {
      return { key, ...product }
    }
  }
  
  return null
}

// Fonction pour obtenir toutes les marques pour un produit
export function getBrandsForProduct(productKey) {
  const product = PRODUCTS_DB[productKey]
  return product ? product.brands : []
}

// Fonction pour obtenir les formats d'une marque spécifique
export function getFormatsForBrand(productKey, brandName) {
  const product = PRODUCTS_DB[productKey]
  if (!product) return []
  
  const brand = product.brands.find(b => b.name === brandName)
  return brand ? brand.formats : []
}

// Fonction pour obtenir les quantités par défaut
export function getDefaultQuantities(productKey) {
  const product = PRODUCTS_DB[productKey]
  return product ? product.defaultQuantities : ['x1', 'x2', 'x3', 'x4', 'x5']
}

// Fonction pour rechercher des produits similaires
export function searchProducts(query) {
  if (!query) return []
  
  const term = query.toLowerCase().trim()
  const results = []
  
  for (const [key, product] of Object.entries(PRODUCTS_DB)) {
    const score = product.keywords.reduce((acc, keyword) => {
      if (keyword.includes(term)) return acc + 2
      if (term.includes(keyword)) return acc + 1
      return acc
    }, 0)
    
    if (score > 0 || key.includes(term)) {
      results.push({ key, ...product, score: score + (key.includes(term) ? 10 : 0) })
    }
  }
  
  return results.sort((a, b) => b.score - a.score).slice(0, 10)
}
