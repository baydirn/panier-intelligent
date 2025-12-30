/**
 * Script de génération de données mock pour Panier Intelligent
 * Version Émulateurs Firebase (pas besoin de clé de service)
 *
 * Génère 500 produits × 5 épiceries = 2500 entrées dans Firestore
 *
 * Usage:
 *   1. Démarrer les émulateurs: firebase emulators:start
 *   2. Dans un autre terminal: node scripts/generate-mock-data-emulator.js
 */

import admin from 'firebase-admin'

// Initialiser Firebase Admin pour émulateurs (pas besoin de credentials)
process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8080'

admin.initializeApp({
  projectId: 'panier-intelligent-d050c'
})

const db = admin.firestore()

// ========================================
// DONNÉES DE BASE
// ========================================

const categories = [
  'Fruits & Légumes',
  'Produits laitiers',
  'Viandes & Poissons',
  'Boulangerie',
  'Épicerie sèche',
  'Boissons',
  'Collations & Desserts'
]

const baseProducts = [
  // Fruits & Légumes (15 produits)
  { name: 'Pommes Gala', category: 'Fruits & Légumes', unit: 'kg', basePrice: 3.99, image: '🍎' },
  { name: 'Bananes', category: 'Fruits & Légumes', unit: 'kg', basePrice: 1.49, image: '🍌' },
  { name: 'Oranges Navel', category: 'Fruits & Légumes', unit: 'kg', basePrice: 2.99, image: '🍊' },
  { name: 'Fraises du Québec', category: 'Fruits & Légumes', unit: '454g', basePrice: 4.99, image: '🍓' },
  { name: 'Raisins rouges', category: 'Fruits & Légumes', unit: 'kg', basePrice: 5.99, image: '🍇' },
  { name: 'Tomates en grappe', category: 'Fruits & Légumes', unit: 'kg', basePrice: 4.49, image: '🍅' },
  { name: 'Laitue romaine', category: 'Fruits & Légumes', unit: 'unité', basePrice: 2.99, image: '🥬' },
  { name: 'Carottes biologiques', category: 'Fruits & Légumes', unit: '2lb', basePrice: 3.49, image: '🥕' },
  { name: 'Brocoli', category: 'Fruits & Légumes', unit: 'unité', basePrice: 2.49, image: '🥦' },
  { name: 'Poivrons rouges', category: 'Fruits & Légumes', unit: 'kg', basePrice: 6.99, image: '🫑' },
  { name: 'Concombres anglais', category: 'Fruits & Légumes', unit: 'unité', basePrice: 1.99, image: '🥒' },
  { name: 'Champignons blancs', category: 'Fruits & Légumes', unit: '227g', basePrice: 2.99, image: '🍄' },
  { name: 'Oignons jaunes', category: 'Fruits & Légumes', unit: '3lb', basePrice: 2.49, image: '🧅' },
  { name: 'Pommes de terre', category: 'Fruits & Légumes', unit: '5lb', basePrice: 4.99, image: '🥔' },
  { name: 'Avocat Hass', category: 'Fruits & Légumes', unit: 'unité', basePrice: 1.99, image: '🥑' },

  // Produits laitiers (15 produits)
  { name: 'Lait 2% Natrel', category: 'Produits laitiers', unit: '2L', basePrice: 4.99, image: '🥛' },
  { name: 'Fromage cheddar fort', category: 'Produits laitiers', unit: '400g', basePrice: 7.99, image: '🧀' },
  { name: 'Yogourt grec Oikos', category: 'Produits laitiers', unit: '750g', basePrice: 5.49, image: '🥛' },
  { name: 'Beurre Lactantia', category: 'Produits laitiers', unit: '454g', basePrice: 5.99, image: '🧈' },
  { name: 'Œufs gros calibre', category: 'Produits laitiers', unit: '12 unités', basePrice: 4.49, image: '🥚' },
  { name: 'Crème 35%', category: 'Produits laitiers', unit: '473ml', basePrice: 3.99, image: '🥛' },
  { name: 'Fromage mozzarella', category: 'Produits laitiers', unit: '300g', basePrice: 6.49, image: '🧀' },
  { name: 'Yogourt Minigo', category: 'Produits laitiers', unit: '8×60g', basePrice: 4.99, image: '🥛' },
  { name: 'Lait d\'amande Silk', category: 'Produits laitiers', unit: '1.89L', basePrice: 4.49, image: '🥛' },
  { name: 'Brie Président', category: 'Produits laitiers', unit: '200g', basePrice: 6.99, image: '🧀' },
  { name: 'Crème sure Astro', category: 'Produits laitiers', unit: '500ml', basePrice: 3.49, image: '🥛' },
  { name: 'Fromage cottage', category: 'Produits laitiers', unit: '500g', basePrice: 4.99, image: '🧀' },
  { name: 'Lait au chocolat', category: 'Produits laitiers', unit: '1L', basePrice: 3.49, image: '🥛' },
  { name: 'Fromage à la crème', category: 'Produits laitiers', unit: '250g', basePrice: 3.99, image: '🧀' },
  { name: 'Kéfir probiotique', category: 'Produits laitiers', unit: '1L', basePrice: 5.49, image: '🥛' },

  // Viandes & Poissons (15 produits)
  { name: 'Poulet entier', category: 'Viandes & Poissons', unit: 'kg', basePrice: 5.49, image: '🍗' },
  { name: 'Bœuf haché mi-maigre', category: 'Viandes & Poissons', unit: 'kg', basePrice: 11.99, image: '🥩' },
  { name: 'Porc côtelettes', category: 'Viandes & Poissons', unit: 'kg', basePrice: 9.99, image: '🥓' },
  { name: 'Saumon de l\'Atlantique', category: 'Viandes & Poissons', unit: 'kg', basePrice: 19.99, image: '🐟' },
  { name: 'Crevettes 31-40', category: 'Viandes & Poissons', unit: '400g', basePrice: 9.99, image: '🦐' },
  { name: 'Bacon fumé', category: 'Viandes & Poissons', unit: '375g', basePrice: 6.99, image: '🥓' },
  { name: 'Jambon cuit tranché', category: 'Viandes & Poissons', unit: '300g', basePrice: 5.99, image: '🍖' },
  { name: 'Dindon haché', category: 'Viandes & Poissons', unit: 'kg', basePrice: 8.99, image: '🦃' },
  { name: 'Cuisses de poulet', category: 'Viandes & Poissons', unit: 'kg', basePrice: 4.99, image: '🍗' },
  { name: 'Steak de bœuf', category: 'Viandes & Poissons', unit: 'kg', basePrice: 24.99, image: '🥩' },
  { name: 'Poitrine de poulet', category: 'Viandes & Poissons', unit: 'kg', basePrice: 14.99, image: '🍗' },
  { name: 'Saucisses italiennes', category: 'Viandes & Poissons', unit: '500g', basePrice: 6.49, image: '🌭' },
  { name: 'Thon en conserve', category: 'Viandes & Poissons', unit: '4×170g', basePrice: 5.99, image: '🐟' },
  { name: 'Saumon fumé', category: 'Viandes & Poissons', unit: '150g', basePrice: 7.99, image: '🐟' },
  { name: 'Agneau côtelettes', category: 'Viandes & Poissons', unit: 'kg', basePrice: 19.99, image: '🥩' },

  // Boulangerie (10 produits)
  { name: 'Pain tranché blanc', category: 'Boulangerie', unit: '675g', basePrice: 2.99, image: '🍞' },
  { name: 'Pain multigrains', category: 'Boulangerie', unit: '600g', basePrice: 3.49, image: '🍞' },
  { name: 'Bagels sésame', category: 'Boulangerie', unit: '6 unités', basePrice: 3.99, image: '🥯' },
  { name: 'Croissants pur beurre', category: 'Boulangerie', unit: '4 unités', basePrice: 4.99, image: '🥐' },
  { name: 'Pita blanc', category: 'Boulangerie', unit: '6 unités', basePrice: 2.99, image: '🥙' },
  { name: 'Tortillas farine', category: 'Boulangerie', unit: '10 unités', basePrice: 3.49, image: '🌮' },
  { name: 'Baguette française', category: 'Boulangerie', unit: 'unité', basePrice: 2.49, image: '🥖' },
  { name: 'Pain ciabatta', category: 'Boulangerie', unit: 'unité', basePrice: 3.99, image: '🍞' },
  { name: 'Muffins aux bleuets', category: 'Boulangerie', unit: '6 unités', basePrice: 4.49, image: '🧁' },
  { name: 'Pain hamburger', category: 'Boulangerie', unit: '8 unités', basePrice: 3.49, image: '🍔' },

  // Épicerie sèche (25 produits)
  { name: 'Pâtes spaghetti', category: 'Épicerie sèche', unit: '900g', basePrice: 2.49, image: '🍝' },
  { name: 'Riz basmati', category: 'Épicerie sèche', unit: '2kg', basePrice: 7.99, image: '🍚' },
  { name: 'Farine tout usage', category: 'Épicerie sèche', unit: '2.5kg', basePrice: 4.99, image: '🌾' },
  { name: 'Sucre blanc', category: 'Épicerie sèche', unit: '2kg', basePrice: 3.49, image: '🍬' },
  { name: 'Huile d\'olive', category: 'Épicerie sèche', unit: '750ml', basePrice: 9.99, image: '🫒' },
  { name: 'Sauce tomate', category: 'Épicerie sèche', unit: '680ml', basePrice: 2.99, image: '🍅' },
  { name: 'Café moulu', category: 'Épicerie sèche', unit: '930g', basePrice: 12.99, image: '☕' },
  { name: 'Céréales Cheerios', category: 'Épicerie sèche', unit: '430g', basePrice: 5.99, image: '🥣' },
  { name: 'Confiture fraises', category: 'Épicerie sèche', unit: '500ml', basePrice: 4.49, image: '🍓' },
  { name: 'Beurre d\'arachide', category: 'Épicerie sèche', unit: '1kg', basePrice: 6.99, image: '🥜' },
  { name: 'Miel pur', category: 'Épicerie sèche', unit: '500g', basePrice: 8.99, image: '🍯' },
  { name: 'Quinoa biologique', category: 'Épicerie sèche', unit: '400g', basePrice: 6.49, image: '🌾' },
  { name: 'Lentilles rouges', category: 'Épicerie sèche', unit: '900g', basePrice: 3.99, image: '🫘' },
  { name: 'Haricots noirs', category: 'Épicerie sèche', unit: '540ml', basePrice: 1.99, image: '🫘' },
  { name: 'Pois chiches', category: 'Épicerie sèche', unit: '540ml', basePrice: 1.99, image: '🫘' },
  { name: 'Soupe poulet et nouilles', category: 'Épicerie sèche', unit: '540ml', basePrice: 2.49, image: '🍜' },
  { name: 'Maïs en crème', category: 'Épicerie sèche', unit: '398ml', basePrice: 1.79, image: '🌽' },
  { name: 'Thé vert', category: 'Épicerie sèche', unit: '20 sachets', basePrice: 4.99, image: '🍵' },
  { name: 'Nouilles ramen', category: 'Épicerie sèche', unit: '5×85g', basePrice: 2.99, image: '🍜' },
  { name: 'Sauce soya', category: 'Épicerie sèche', unit: '296ml', basePrice: 3.49, image: '🥢' },
  { name: 'Ketchup Heinz', category: 'Épicerie sèche', unit: '1L', basePrice: 4.99, image: '🍅' },
  { name: 'Moutarde Dijon', category: 'Épicerie sèche', unit: '500ml', basePrice: 3.99, image: '🌭' },
  { name: 'Mayonnaise', category: 'Épicerie sèche', unit: '890ml', basePrice: 5.49, image: '🥪' },
  { name: 'Vinaigre balsamique', category: 'Épicerie sèche', unit: '500ml', basePrice: 5.99, image: '🫒' },
  { name: 'Sel de mer', category: 'Épicerie sèche', unit: '1kg', basePrice: 2.49, image: '🧂' },

  // Boissons (10 produits)
  { name: 'Coca-Cola', category: 'Boissons', unit: '12×355ml', basePrice: 5.99, image: '🥤' },
  { name: 'Jus d\'orange Tropicana', category: 'Boissons', unit: '2.63L', basePrice: 6.99, image: '🍊' },
  { name: 'Eau Perrier', category: 'Boissons', unit: '12×330ml', basePrice: 9.99, image: '💧' },
  { name: 'Bière Molson', category: 'Boissons', unit: '12×341ml', basePrice: 18.99, image: '🍺' },
  { name: 'Vin rouge Bordeaux', category: 'Boissons', unit: '750ml', basePrice: 16.99, image: '🍷' },
  { name: 'Eau embouteillée', category: 'Boissons', unit: '24×500ml', basePrice: 3.99, image: '💧' },
  { name: 'Boisson énergétique', category: 'Boissons', unit: '4×473ml', basePrice: 6.99, image: '⚡' },
  { name: 'Jus de pomme', category: 'Boissons', unit: '1.89L', basePrice: 3.99, image: '🍎' },
  { name: 'Limonade', category: 'Boissons', unit: '2L', basePrice: 2.99, image: '🍋' },
  { name: 'Thé glacé', category: 'Boissons', unit: '1.75L', basePrice: 2.49, image: '🍵' },

  // Collations & Desserts (10 produits)
  { name: 'Chips Lay\'s', category: 'Collations & Desserts', unit: '235g', basePrice: 3.99, image: '🥔' },
  { name: 'Chocolat Lindt', category: 'Collations & Desserts', unit: '100g', basePrice: 3.49, image: '🍫' },
  { name: 'Biscuits Oreo', category: 'Collations & Desserts', unit: '303g', basePrice: 4.49, image: '🍪' },
  { name: 'Crème glacée vanille', category: 'Collations & Desserts', unit: '1.5L', basePrice: 5.99, image: '🍦' },
  { name: 'Barres granola', category: 'Collations & Desserts', unit: '10×35g', basePrice: 5.49, image: '🍫' },
  { name: 'Pop-corn micro-ondes', category: 'Collations & Desserts', unit: '6×90g', basePrice: 4.99, image: '🍿' },
  { name: 'Noix mélangées', category: 'Collations & Desserts', unit: '400g', basePrice: 7.99, image: '🥜' },
  { name: 'Gâteau au chocolat', category: 'Collations & Desserts', unit: 'unité', basePrice: 8.99, image: '🍰' },
  { name: 'Pudding au chocolat', category: 'Collations & Desserts', unit: '4×99g', basePrice: 3.49, image: '🍮' },
  { name: 'Jell-O fraises', category: 'Collations & Desserts', unit: '4×99g', basePrice: 2.99, image: '🍓' }
]

// Liste des épiceries avec multiplicateurs de prix
const stores = [
  { code: 'IGA', name: 'IGA Extra', multiplier: 1.0, lat: 45.5017, lon: -73.5673 },
  { code: 'Metro', name: 'Metro Plus', multiplier: 1.05, lat: 45.5088, lon: -73.5878 },
  { code: 'Maxi', name: 'Maxi', multiplier: 0.92, lat: 45.4817, lon: -73.6044 },
  { code: 'SuperC', name: 'Super C', multiplier: 0.88, lat: 45.5267, lon: -73.5965 },
  { code: 'Costco', name: 'Costco', multiplier: 0.85, lat: 45.4942, lon: -73.6155 }
]

// ========================================
// GÉNÉRATION PRODUITS
// ========================================

function generateProducts() {
  const products = []
  let productId = 1

  // Pour chaque produit de base, créer 5 variantes (une par marque/origine)
  baseProducts.forEach(baseProduct => {
    const brands = ['Marque A', 'Marque B', 'Marque C', 'Marque D', 'Sans marque']

    brands.forEach(brand => {
      products.push({
        id: `prod-${productId.toString().padStart(4, '0')}`,
        name: `${baseProduct.name}${brand !== 'Sans marque' ? ` - ${brand}` : ''}`,
        category: baseProduct.category,
        unit: baseProduct.unit,
        basePrice: baseProduct.basePrice,
        brand: brand,
        image: baseProduct.image,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      productId++
    })
  })

  console.log(`✅ ${products.length} produits générés (${baseProducts.length} base × 5 variantes)`)
  return products
}

// ========================================
// GÉNÉRATION PRIX
// ========================================

function generatePrices(products) {
  const prices = []
  const now = new Date()

  products.forEach(product => {
    stores.forEach(store => {
      // Prix = basePrice × store multiplier ± 5% de variation aléatoire
      const randomVariation = 0.95 + (Math.random() * 0.1) // Entre 0.95 et 1.05
      const calculatedPrice = product.basePrice * store.multiplier * randomVariation
      const finalPrice = Math.round(calculatedPrice * 100) / 100 // Arrondir à 2 décimales

      prices.push({
        id: `${product.id}-${store.code}`,
        productId: product.id,
        storeCode: store.code,
        storeName: store.name,
        price: finalPrice,
        inStock: Math.random() > 0.1, // 90% en stock
        lastUpdated: now,
        createdAt: now
      })
    })
  })

  console.log(`✅ ${prices.length} prix générés (${products.length} produits × ${stores.length} épiceries)`)
  return prices
}

// ========================================
// GÉNÉRATION MAGASINS
// ========================================

function generateStores() {
  const storesList = stores.map(store => ({
    code: store.code,
    name: store.name,
    address: `1234 Rue Example, Montréal, QC`,
    city: 'Montréal',
    province: 'QC',
    postalCode: 'H1X 1X1',
    lat: store.lat,
    lon: store.lon,
    phone: '514-555-0100',
    hours: {
      monday: '8:00-21:00',
      tuesday: '8:00-21:00',
      wednesday: '8:00-21:00',
      thursday: '8:00-21:00',
      friday: '8:00-21:00',
      saturday: '8:00-21:00',
      sunday: '8:00-21:00'
    },
    createdAt: new Date(),
    updatedAt: new Date()
  }))

  console.log(`✅ ${storesList.length} magasins générés`)
  return storesList
}

// ========================================
// ÉCRITURE FIRESTORE
// ========================================

async function writeToFirestore() {
  console.log('\n🚀 Début de la génération des données...\n')

  // Générer les données
  const products = generateProducts()
  const prices = generatePrices(products)
  const storesList = generateStores()

  console.log('\n📝 Écriture dans Firestore (émulateurs)...\n')

  try {
    // 1. Écrire les produits (par batch de 500)
    console.log('📦 Écriture des produits...')
    let batch = db.batch()
    let operationCount = 0

    for (let i = 0; i < products.length; i++) {
      const product = products[i]
      const docRef = db.collection('products').doc(product.id)
      batch.set(docRef, product)
      operationCount++

      // Firestore limite: 500 opérations par batch
      if (operationCount === 500 || i === products.length - 1) {
        await batch.commit()
        console.log(`  ✓ ${Math.min(i + 1, products.length)}/${products.length} produits écrits`)
        batch = db.batch()
        operationCount = 0
      }
    }

    // 2. Écrire les prix (par batch de 500)
    console.log('\n💰 Écriture des prix...')
    batch = db.batch()
    operationCount = 0

    for (let i = 0; i < prices.length; i++) {
      const price = prices[i]
      const docRef = db.collection('prices').doc(price.id)
      batch.set(docRef, price)
      operationCount++

      if (operationCount === 500 || i === prices.length - 1) {
        await batch.commit()
        console.log(`  ✓ ${Math.min(i + 1, prices.length)}/${prices.length} prix écrits`)
        batch = db.batch()
        operationCount = 0
      }
    }

    // 3. Écrire les magasins
    console.log('\n🏪 Écriture des magasins...')
    batch = db.batch()

    for (const store of storesList) {
      const docRef = db.collection('stores').doc(store.code)
      batch.set(docRef, store)
    }

    await batch.commit()
    console.log(`  ✓ ${storesList.length}/${storesList.length} magasins écrits`)

    // Résumé
    console.log('\n' + '='.repeat(60))
    console.log('✅ GÉNÉRATION TERMINÉE AVEC SUCCÈS!')
    console.log('='.repeat(60))
    console.log(`\n📊 Statistiques:`)
    console.log(`   • ${products.length} produits`)
    console.log(`   • ${prices.length} prix`)
    console.log(`   • ${storesList.length} magasins`)
    console.log(`   • ${categories.length} catégories`)
    console.log(`\n🔗 Accédez à l'interface des émulateurs: http://localhost:4000`)
    console.log('\n')

  } catch (error) {
    console.error('\n❌ Erreur lors de l\'écriture:', error)
    process.exit(1)
  }
}

// ========================================
// EXÉCUTION
// ========================================

writeToFirestore()
  .then(() => {
    console.log('✅ Script terminé avec succès')
    process.exit(0)
  })
  .catch(error => {
    console.error('❌ Erreur fatale:', error)
    process.exit(1)
  })
