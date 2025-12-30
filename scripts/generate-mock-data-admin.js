/**
 * Script de génération de données mock pour Panier Intelligent
 * Version Firebase Admin SDK (pour scripts serveur)
 *
 * Génère 500 produits × 5 épiceries = 2500 entrées dans Firestore
 *
 * Usage:
 *   node scripts/generate-mock-data-admin.js
 *
 * Prérequis:
 *   1. Avoir créé un projet Firebase
 *   2. Avoir téléchargé serviceAccountKey.json depuis Firebase Console
 *   3. Avoir activé Firestore dans Firebase Console
 */

import admin from 'firebase-admin'
import { readFileSync } from 'fs'

// Charger Service Account Key
let serviceAccount
try {
  serviceAccount = JSON.parse(readFileSync('./serviceAccountKey.json', 'utf8'))
} catch (error) {
  console.error('❌ Erreur: fichier serviceAccountKey.json non trouvé')
  console.log('\n📝 Pour obtenir ce fichier:')
  console.log('1. Allez sur https://console.firebase.google.com/project/panier-intelligent-d050c/settings/serviceaccounts/adminsdk')
  console.log('2. Cliquez sur "Generate new private key"')
  console.log('3. Sauvegardez le fichier téléchargé sous le nom "serviceAccountKey.json" à la racine du projet')
  process.exit(1)
}

// Initialiser Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
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

const stores = [
  { code: 'IGA', name: 'IGA', multiplier: 1.0, lat: 46.8139, lon: -71.2080 },
  { code: 'Metro', name: 'Metro', multiplier: 1.05, lat: 46.7705, lon: -71.2910 },
  { code: 'Maxi', name: 'Maxi', multiplier: 0.92, lat: 46.7750, lon: -71.2955 },
  { code: 'SuperC', name: 'Super C', multiplier: 0.88, lat: 46.7407, lon: -71.3665 },
  { code: 'Costco', name: 'Costco', multiplier: 0.85, lat: 46.7815, lon: -71.2923 }
]

// 100 produits de base (on les dupliquera 5x pour atteindre 500)
const baseProducts = [
  // Fruits & Légumes (20)
  { nom: 'Pommes Gala', marque: 'Sélection', basePrice: 2.99, volume: 3, unite: 'lb', categorie: 'Fruits & Légumes', tags: ['local'] },
  { nom: 'Bananes', marque: 'Chiquita', basePrice: 0.79, volume: 1, unite: 'lb', categorie: 'Fruits & Légumes', tags: [] },
  { nom: 'Oranges navel', marque: 'Sunkist', basePrice: 4.99, volume: 4, unite: 'lb', categorie: 'Fruits & Légumes', tags: [] },
  { nom: 'Fraises', marque: 'Savoura', basePrice: 3.99, volume: 454, unite: 'g', categorie: 'Fruits & Légumes', tags: ['québec'] },
  { nom: 'Raisins verts', marque: '', basePrice: 3.49, volume: 1, unite: 'lb', categorie: 'Fruits & Légumes', tags: [] },
  { nom: 'Bleuets', marque: 'Savoura', basePrice: 4.99, volume: 340, unite: 'g', categorie: 'Fruits & Légumes', tags: ['québec'] },
  { nom: 'Ananas', marque: '', basePrice: 2.99, volume: 1, unite: 'un', categorie: 'Fruits & Légumes', tags: [] },
  { nom: 'Mangues', marque: '', basePrice: 1.99, volume: 1, unite: 'un', categorie: 'Fruits & Légumes', tags: [] },
  { nom: 'Tomates', marque: 'Savoura', basePrice: 1.99, volume: 1, unite: 'lb', categorie: 'Fruits & Légumes', tags: ['québec'] },
  { nom: 'Concombres anglais', marque: '', basePrice: 1.99, volume: 1, unite: 'un', categorie: 'Fruits & Légumes', tags: [] },
  { nom: 'Carottes', marque: '', basePrice: 2.49, volume: 2, unite: 'lb', categorie: 'Fruits & Légumes', tags: [] },
  { nom: 'Brocoli', marque: '', basePrice: 1.99, volume: 1, unite: 'un', categorie: 'Fruits & Légumes', tags: [] },
  { nom: 'Laitue romaine', marque: '', basePrice: 2.49, volume: 1, unite: 'un', categorie: 'Fruits & Légumes', tags: [] },
  { nom: 'Poivrons rouges', marque: '', basePrice: 3.99, volume: 1, unite: 'lb', categorie: 'Fruits & Légumes', tags: [] },
  { nom: 'Oignons jaunes', marque: '', basePrice: 1.49, volume: 3, unite: 'lb', categorie: 'Fruits & Légumes', tags: [] },
  { nom: 'Pommes de terre', marque: '', basePrice: 3.99, volume: 10, unite: 'lb', categorie: 'Fruits & Légumes', tags: [] },
  { nom: 'Ail', marque: '', basePrice: 1.99, volume: 1, unite: 'un', categorie: 'Fruits & Légumes', tags: [] },
  { nom: 'Champignons blancs', marque: '', basePrice: 2.99, volume: 227, unite: 'g', categorie: 'Fruits & Légumes', tags: [] },
  { nom: 'Épinards', marque: '', basePrice: 3.49, volume: 283, unite: 'g', categorie: 'Fruits & Légumes', tags: [] },
  { nom: 'Avocats', marque: '', basePrice: 1.49, volume: 1, unite: 'un', categorie: 'Fruits & Légumes', tags: [] },

  // Produits laitiers (15)
  { nom: 'Lait 2%', marque: 'Natrel', basePrice: 4.49, volume: 2, unite: 'L', categorie: 'Produits laitiers', tags: [] },
  { nom: 'Lait 3.25%', marque: 'Québon', basePrice: 4.69, volume: 2, unite: 'L', categorie: 'Produits laitiers', tags: ['québec'] },
  { nom: 'Lait écrémé', marque: 'Lactantia', basePrice: 4.29, volume: 2, unite: 'L', categorie: 'Produits laitiers', tags: [] },
  { nom: 'Yogourt grec vanille', marque: 'Oikos', basePrice: 4.99, volume: 400, unite: 'g', categorie: 'Produits laitiers', tags: [] },
  { nom: 'Yogourt nature', marque: 'Liberté', basePrice: 3.99, volume: 650, unite: 'g', categorie: 'Produits laitiers', tags: ['québec'] },
  { nom: 'Fromage cheddar', marque: 'Black Diamond', basePrice: 6.99, volume: 400, unite: 'g', categorie: 'Produits laitiers', tags: [] },
  { nom: 'Fromage mozzarella', marque: 'Saputo', basePrice: 5.49, volume: 340, unite: 'g', categorie: 'Produits laitiers', tags: ['québec'] },
  { nom: 'Beurre salé', marque: 'Lactantia', basePrice: 5.49, volume: 454, unite: 'g', categorie: 'Produits laitiers', tags: [] },
  { nom: 'Crème sure', marque: 'Astro', basePrice: 3.49, volume: 500, unite: 'ml', categorie: 'Produits laitiers', tags: [] },
  { nom: 'Œufs gros', marque: 'Québon', basePrice: 3.99, volume: 12, unite: 'un', categorie: 'Produits laitiers', tags: ['québec'] },
  { nom: 'Œufs extra-gros', marque: 'Nutrioeuf', basePrice: 4.49, volume: 12, unite: 'un', categorie: 'Produits laitiers', tags: [] },
  { nom: 'Crème 35%', marque: 'Québon', basePrice: 4.99, volume: 473, unite: 'ml', categorie: 'Produits laitiers', tags: ['québec'] },
  { nom: 'Fromage à la crème', marque: 'Philadelphia', basePrice: 3.99, volume: 250, unite: 'g', categorie: 'Produits laitiers', tags: [] },
  { nom: 'Parmesan râpé', marque: 'Kraft', basePrice: 5.99, volume: 250, unite: 'g', categorie: 'Produits laitiers', tags: [] },
  { nom: 'Lait d\'amande', marque: 'Silk', basePrice: 3.99, volume: 1.89, unite: 'L', categorie: 'Produits laitiers', tags: ['végétalien'] },

  // Viandes & Poissons (12)
  { nom: 'Poulet entier', marque: 'Exceldor', basePrice: 9.99, volume: 1, unite: 'kg', categorie: 'Viandes & Poissons', tags: ['québec'] },
  { nom: 'Poitrines de poulet', marque: 'Exceldor', basePrice: 12.99, volume: 1, unite: 'kg', categorie: 'Viandes & Poissons', tags: ['québec'] },
  { nom: 'Cuisses de poulet', marque: 'Exceldor', basePrice: 7.99, volume: 1, unite: 'kg', categorie: 'Viandes & Poissons', tags: ['québec'] },
  { nom: 'Bœuf haché mi-maigre', marque: '', basePrice: 7.99, volume: 1, unite: 'lb', categorie: 'Viandes & Poissons', tags: [] },
  { nom: 'Bœuf haché maigre', marque: '', basePrice: 8.99, volume: 1, unite: 'lb', categorie: 'Viandes & Poissons', tags: [] },
  { nom: 'Bacon', marque: 'Olymel', basePrice: 5.99, volume: 375, unite: 'g', categorie: 'Viandes & Poissons', tags: ['québec'] },
  { nom: 'Saucisses italiennes', marque: 'Olymel', basePrice: 6.49, volume: 450, unite: 'g', categorie: 'Viandes & Poissons', tags: ['québec'] },
  { nom: 'Côtelettes de porc', marque: 'Olymel', basePrice: 11.99, volume: 1, unite: 'kg', categorie: 'Viandes & Poissons', tags: ['québec'] },
  { nom: 'Saumon atlantique', marque: '', basePrice: 15.99, volume: 1, unite: 'lb', categorie: 'Viandes & Poissons', tags: [] },
  { nom: 'Crevettes cuites', marque: '', basePrice: 9.99, volume: 340, unite: 'g', categorie: 'Viandes & Poissons', tags: [] },
  { nom: 'Filets de tilapia', marque: '', basePrice: 8.99, volume: 454, unite: 'g', categorie: 'Viandes & Poissons', tags: [] },
  { nom: 'Jambon tranché', marque: 'Olymel', basePrice: 4.99, volume: 175, unite: 'g', categorie: 'Viandes & Poissons', tags: ['québec'] },

  // Boulangerie (8)
  { nom: 'Pain tranché blanc', marque: 'Bon Matin', basePrice: 2.99, volume: 675, unite: 'g', categorie: 'Boulangerie', tags: [] },
  { nom: 'Pain de blé entier', marque: 'POM', basePrice: 3.49, volume: 600, unite: 'g', categorie: 'Boulangerie', tags: ['québec'] },
  { nom: 'Pain multigrains', marque: 'Gadoua', basePrice: 3.99, volume: 600, unite: 'g', categorie: 'Boulangerie', tags: [] },
  { nom: 'Bagels', marque: 'St-Viateur', basePrice: 4.99, volume: 6, unite: 'un', categorie: 'Boulangerie', tags: ['québec'] },
  { nom: 'Tortillas', marque: 'Old El Paso', basePrice: 3.99, volume: 8, unite: 'un', categorie: 'Boulangerie', tags: [] },
  { nom: 'Croissants', marque: 'Vachon', basePrice: 4.49, volume: 6, unite: 'un', categorie: 'Boulangerie', tags: ['québec'] },
  { nom: 'Muffins anglais', marque: 'Première Moisson', basePrice: 3.49, volume: 6, unite: 'un', categorie: 'Boulangerie', tags: ['québec'] },
  { nom: 'Pita', marque: '', basePrice: 2.99, volume: 6, unite: 'un', categorie: 'Boulangerie', tags: [] },

  // Épicerie sèche (20)
  { nom: 'Pâtes spaghetti', marque: 'Catelli', basePrice: 1.99, volume: 900, unite: 'g', categorie: 'Épicerie sèche', tags: [] },
  { nom: 'Pâtes penne', marque: 'Barilla', basePrice: 2.49, volume: 500, unite: 'g', categorie: 'Épicerie sèche', tags: [] },
  { nom: 'Pâtes fusilli', marque: 'Catelli', basePrice: 1.99, volume: 900, unite: 'g', categorie: 'Épicerie sèche', tags: [] },
  { nom: 'Riz blanc', marque: 'Uncle Ben\'s', basePrice: 4.99, volume: 2, unite: 'kg', categorie: 'Épicerie sèche', tags: [] },
  { nom: 'Riz basmati', marque: 'Tilda', basePrice: 6.99, volume: 1, unite: 'kg', categorie: 'Épicerie sèche', tags: [] },
  { nom: 'Sauce tomate', marque: 'Classico', basePrice: 3.99, volume: 650, unite: 'ml', categorie: 'Épicerie sèche', tags: [] },
  { nom: 'Sauce Alfredo', marque: 'Classico', basePrice: 4.49, volume: 650, unite: 'ml', categorie: 'Épicerie sèche', tags: [] },
  { nom: 'Huile d\'olive', marque: 'Bertolli', basePrice: 9.99, volume: 750, unite: 'ml', categorie: 'Épicerie sèche', tags: [] },
  { nom: 'Huile de canola', marque: 'Mazola', basePrice: 5.99, volume: 1, unite: 'L', categorie: 'Épicerie sèche', tags: [] },
  { nom: 'Farine tout usage', marque: 'Robin Hood', basePrice: 5.49, volume: 2.5, unite: 'kg', categorie: 'Épicerie sèche', tags: [] },
  { nom: 'Sucre blanc', marque: 'Lantic', basePrice: 4.99, volume: 2, unite: 'kg', categorie: 'Épicerie sèche', tags: [] },
  { nom: 'Cassonade', marque: 'Lantic', basePrice: 5.49, volume: 2, unite: 'kg', categorie: 'Épicerie sèche', tags: [] },
  { nom: 'Céréales Cheerios', marque: 'Cheerios', basePrice: 4.49, volume: 430, unite: 'g', categorie: 'Épicerie sèche', tags: [] },
  { nom: 'Céréales Corn Flakes', marque: 'Kellogg\'s', basePrice: 3.99, volume: 440, unite: 'g', categorie: 'Épicerie sèche', tags: [] },
  { nom: 'Gruau', marque: 'Quaker', basePrice: 5.99, volume: 1, unite: 'kg', categorie: 'Épicerie sèche', tags: [] },
  { nom: 'Thon en conserve', marque: 'Clover Leaf', basePrice: 1.99, volume: 170, unite: 'g', categorie: 'Épicerie sèche', tags: [] },
  { nom: 'Soupe poulet et nouilles', marque: 'Campbell', basePrice: 1.49, volume: 284, unite: 'ml', categorie: 'Épicerie sèche', tags: [] },
  { nom: 'Haricots noirs', marque: 'Unico', basePrice: 1.29, volume: 540, unite: 'ml', categorie: 'Épicerie sèche', tags: [] },
  { nom: 'Maïs en crème', marque: 'Del Monte', basePrice: 1.49, volume: 341, unite: 'ml', categorie: 'Épicerie sèche', tags: [] },
  { nom: 'Ketchup', marque: 'Heinz', basePrice: 3.99, volume: 1, unite: 'L', categorie: 'Épicerie sèche', tags: [] },

  // Boissons (15)
  { nom: 'Jus d\'orange', marque: 'Tropicana', basePrice: 3.99, volume: 1.75, unite: 'L', categorie: 'Boissons', tags: [] },
  { nom: 'Jus de pomme', marque: 'Oasis', basePrice: 2.99, volume: 1.75, unite: 'L', categorie: 'Boissons', tags: [] },
  { nom: 'Jus de canneberge', marque: 'Ocean Spray', basePrice: 3.49, volume: 1.89, unite: 'L', categorie: 'Boissons', tags: [] },
  { nom: 'Café moulu', marque: 'Nabob', basePrice: 8.99, volume: 900, unite: 'g', categorie: 'Boissons', tags: [] },
  { nom: 'Café instantané', marque: 'Nescafé', basePrice: 6.99, volume: 200, unite: 'g', categorie: 'Boissons', tags: [] },
  { nom: 'Thé vert', marque: 'Tetley', basePrice: 4.49, volume: 72, unite: 'sachets', categorie: 'Boissons', tags: [] },
  { nom: 'Thé Earl Grey', marque: 'Twinings', basePrice: 5.49, volume: 50, unite: 'sachets', categorie: 'Boissons', tags: [] },
  { nom: 'Eau pétillante', marque: 'Perrier', basePrice: 5.99, volume: 8, unite: 'x330ml', categorie: 'Boissons', tags: [] },
  { nom: 'Eau embouteillée', marque: 'Naya', basePrice: 3.99, volume: 24, unite: 'x500ml', categorie: 'Boissons', tags: ['québec'] },
  { nom: 'Cola', marque: 'Coca-Cola', basePrice: 4.99, volume: 2, unite: 'L', categorie: 'Boissons', tags: [] },
  { nom: 'Seven-Up', marque: '7UP', basePrice: 4.99, volume: 2, unite: 'L', categorie: 'Boissons', tags: [] },
  { nom: 'Boisson énergisante', marque: 'Red Bull', basePrice: 2.49, volume: 250, unite: 'ml', categorie: 'Boissons', tags: [] },
  { nom: 'Limonade', marque: 'Minute Maid', basePrice: 3.49, volume: 1.75, unite: 'L', categorie: 'Boissons', tags: [] },
  { nom: 'Thé glacé', marque: 'Nestea', basePrice: 2.99, volume: 1.75, unite: 'L', categorie: 'Boissons', tags: [] },
  { nom: 'Boisson de soya', marque: 'Silk', basePrice: 3.99, volume: 1.89, unite: 'L', categorie: 'Boissons', tags: ['végétalien'] },

  // Collations & Desserts (10)
  { nom: 'Chips originales', marque: 'Lay\'s', basePrice: 2.99, volume: 235, unite: 'g', categorie: 'Collations & Desserts', tags: [] },
  { nom: 'Chips BBQ', marque: 'Ruffles', basePrice: 2.99, volume: 220, unite: 'g', categorie: 'Collations & Desserts', tags: [] },
  { nom: 'Chips sel & vinaigre', marque: 'Lay\'s', basePrice: 2.99, volume: 235, unite: 'g', categorie: 'Collations & Desserts', tags: [] },
  { nom: 'Biscuits Oreo', marque: 'Oreo', basePrice: 3.99, volume: 303, unite: 'g', categorie: 'Collations & Desserts', tags: [] },
  { nom: 'Biscuits au chocolat', marque: 'Leclerc', basePrice: 3.49, volume: 350, unite: 'g', categorie: 'Collations & Desserts', tags: ['québec'] },
  { nom: 'Barres granola', marque: 'Nature Valley', basePrice: 4.49, volume: 6, unite: 'barres', categorie: 'Collations & Desserts', tags: [] },
  { nom: 'Crème glacée vanille', marque: 'Ben & Jerry\'s', basePrice: 5.99, volume: 500, unite: 'ml', categorie: 'Collations & Desserts', tags: [] },
  { nom: 'Crème glacée chocolat', marque: 'Häagen-Dazs', basePrice: 6.49, volume: 500, unite: 'ml', categorie: 'Collations & Desserts', tags: [] },
  { nom: 'Chocolat au lait', marque: 'Cadbury', basePrice: 2.49, volume: 100, unite: 'g', categorie: 'Collations & Desserts', tags: [] },
  { nom: 'Bonbons gélifiés', marque: 'Maynards', basePrice: 2.99, volume: 185, unite: 'g', categorie: 'Collations & Desserts', tags: [] }
]

// ========================================
// FONCTIONS DE GÉNÉRATION
// ========================================

function generateNameKey(nom, marque, volume, unite) {
  return `${nom}-${marque}-${volume}${unite}`
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]/g, '')
}

function randomVariation(baseMultiplier) {
  // Variation aléatoire de ±5%
  return baseMultiplier * (0.95 + Math.random() * 0.10)
}

function generateProducts() {
  const products = []

  // Dupliquer les 100 produits de base 5x avec variations
  for (let i = 0; i < 5; i++) {
    baseProducts.forEach((prod, index) => {
      const variant = i === 0 ? '' : ` - Variante ${i}`
      products.push({
        ...prod,
        nom: prod.nom + variant,
        // Ajouter petite variation de prix pour chaque variante
        basePrice: prod.basePrice * (0.95 + Math.random() * 0.10)
      })
    })
  }

  return products
}

async function seedFirestore() {
  console.log('🚀 Début de la génération des données mock...\n')

  const allProducts = generateProducts()
  console.log(`📦 ${allProducts.length} produits à créer`)
  console.log(`🏪 ${stores.length} magasins`)
  console.log(`📊 Total: ${allProducts.length * stores.length} entrées storePrices\n`)

  let productsCreated = 0
  let storesCreated = 0
  let storePricesCreated = 0

  // 1. Créer les magasins
  console.log('🏪 Création des magasins...')
  for (const store of stores) {
    try {
      await db.collection('stores').add({
        chaine: store.code,
        nom: store.name,
        adresse: `123 rue Example, Québec`,
        ville: 'Québec',
        code_postal: 'G1R 1A1',
        latitude: store.lat,
        longitude: store.lon,
        heures_ouverture: {
          lundi: '8h-21h',
          mardi: '8h-21h',
          mercredi: '8h-21h',
          jeudi: '8h-21h',
          vendredi: '8h-21h',
          samedi: '8h-21h',
          dimanche: '9h-18h'
        },
        isPartner: false,
        commissionRate: 0.0
      })
      storesCreated++
      console.log(`  ✅ ${store.name}`)
    } catch (error) {
      console.error(`  ❌ Erreur création ${store.name}:`, error.message)
    }
  }

  // 2. Créer les produits et leurs prix par magasin
  console.log('\n📦 Création des produits et prix...')

  // Utiliser batch writes pour optimiser (max 500 opérations par batch)
  let batch = db.batch()
  let operationsInBatch = 0
  const BATCH_SIZE = 500

  for (const [index, product] of allProducts.entries()) {
    try {
      // Créer le produit
      const productRef = db.collection('products').doc()
      const nameKey = generateNameKey(product.nom, product.marque, product.volume, product.unite)

      batch.set(productRef, {
        nom_produit: product.nom,
        marque: product.marque || '',
        categorie: product.categorie,
        sous_categorie: null,
        volume: product.volume,
        unite: product.unite,
        code_barre: null,
        image_url: null,
        tags: product.tags,
        nameKey: nameKey,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      })
      operationsInBatch++

      // Créer les prix pour chaque magasin
      for (const store of stores) {
        const finalPrice = Math.round(product.basePrice * randomVariation(store.multiplier) * 100) / 100

        // Promo aléatoire (10% de chance)
        const hasPromo = Math.random() < 0.1
        const promoPrice = hasPromo ? Math.round(finalPrice * 0.85 * 100) / 100 : null

        const storePriceRef = db.collection('storePrices').doc()
        batch.set(storePriceRef, {
          product_id: productRef.id,
          store_id: store.code,
          store_product_name: `${product.nom} ${product.marque} ${product.volume}${product.unite}`.trim(),
          prix_regulier: finalPrice,
          prix_promo: promoPrice,
          promo_actif: hasPromo,
          promo_debut: hasPromo ? admin.firestore.FieldValue.serverTimestamp() : null,
          promo_fin: hasPromo ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) : null,
          disponible: true,
          last_updated: admin.firestore.FieldValue.serverTimestamp()
        })
        operationsInBatch++
        storePricesCreated++

        // Commit batch si on atteint la limite
        if (operationsInBatch >= BATCH_SIZE) {
          await batch.commit()
          batch = db.batch()
          operationsInBatch = 0
        }
      }

      productsCreated++

      // Afficher progression tous les 50 produits
      if ((index + 1) % 50 === 0) {
        console.log(`  📈 Progression: ${index + 1}/${allProducts.length} produits (${Math.round((index + 1) / allProducts.length * 100)}%)`)
      }

    } catch (error) {
      console.error(`  ❌ Erreur produit ${product.nom}:`, error.message)
    }
  }

  // Commit le dernier batch
  if (operationsInBatch > 0) {
    await batch.commit()
  }

  console.log('\n✅ Génération terminée!')
  console.log(`\n📊 Résumé:`)
  console.log(`  - Magasins créés: ${storesCreated}`)
  console.log(`  - Produits créés: ${productsCreated}`)
  console.log(`  - Prix créés: ${storePricesCreated}`)
  console.log(`\n🎉 Base de données prête à l'emploi!`)
}

// ========================================
// EXÉCUTION
// ========================================

seedFirestore()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('\n❌ Erreur fatale:', error)
    process.exit(1)
  })
