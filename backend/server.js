/**
 * Backend API pour Panier Intelligent
 * Serveur Express.js qui exécute le scraping côté serveur
 * Accessible SEULEMENT par l'admin via mot de passe
 */

import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import jwt from 'jsonwebtoken'
import { scrapeIGA } from './scrapers/igaScraper.js'
import { scrapeIGAApi, scrapeIGAApiTest } from './scrapers/igaApiScraper.js'
import { getFlippPrices } from './scrapers/flippScraper.js'
// Price routes disabled until PostgreSQL is configured
// import pricesRouter from './routes/prices.js'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3001
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123'
const JWT_SECRET = process.env.JWT_SECRET || 'votre-secret-jwt-changez-moi-en-production'
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5174'

// Logs de diagnostic (sans exposer les valeurs sensibles)
console.log(`[BOOT] ADMIN_PASSWORD chargé (longueur=${ADMIN_PASSWORD.length})`)
console.log(`[BOOT] JWT_SECRET présent=${JWT_SECRET ? 'oui' : 'non'} (longueur=${JWT_SECRET.length})`)
console.log(`[BOOT] FRONTEND_URL=${FRONTEND_URL}`)

// Middleware
app.use(cors({
  origin: FRONTEND_URL,
  credentials: true
}))
app.use(express.json())

// Log toutes les requêtes
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`)
  next()
})

// ============================================
// MIDDLEWARE D'AUTHENTIFICATION ADMIN
// ============================================
function requireAdmin(req, res, next) {
  const authHeader = req.headers.authorization
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ 
      success: false, 
      error: 'Non autorisé - Token manquant' 
    })
  }

  const token = authHeader.substring(7) // Remove 'Bearer '
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET)
    req.admin = decoded
    next()
  } catch (error) {
    return res.status(403).json({ 
      success: false, 
      error: 'Token invalide ou expiré' 
    })
  }
}

// ============================================
// ROUTES PUBLIQUES (Utilisateurs)
// ============================================

app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Panier Intelligent Backend API',
    version: '1.0.0'
  })
})

/**
 * GET /api/prices
 * Retourne les prix depuis le scraper Flipp
 * Format: { nomProduit: { magasin: prix } }
 */
app.get('/api/prices', async (req, res) => {
  try {
    const prices = await getFlippPrices()
    res.json({
      success: true,
      prices,
      source: 'flipp-scraper',
      generatedAt: new Date().toISOString()
    })
  } catch (error) {
    console.error('[API] Erreur lors de la récupération des prix:', error)
    res.status(500).json({
      success: false,
      error: error.message
    })
  }
})

// ============================================
// ROUTES ADMIN (Protégées)
// ============================================

/**
 * POST /api/admin/login
 * Vérifier le mot de passe admin et générer un JWT token
 */
app.post('/api/admin/login', (req, res) => {
  const { password } = req.body

  if (!password) {
    return res.status(400).json({ 
      success: false, 
      error: 'Mot de passe requis' 
    })
  }

  if (password === ADMIN_PASSWORD) {
    // Générer un JWT token valide pour 24h
    const token = jwt.sign(
      { role: 'admin', timestamp: Date.now() },
      JWT_SECRET,
      { expiresIn: '24h' }
    )
    
    return res.json({ 
      success: true, 
      token: token,
      message: 'Authentification réussie',
      expiresIn: '24h'
    })
  }

  res.status(401).json({ 
    success: false, 
    error: 'Mot de passe incorrect' 
  })
})

/**
 * GET /api/admin/verify
 * Vérifier si le token JWT est encore valide
 */
app.get('/api/admin/verify', requireAdmin, (req, res) => {
  res.json({
    success: true,
    valid: true,
    admin: req.admin
  })
})

/**
 * POST /api/share-list
 * Créer une liste partagée (Phase 1.2)
 */
app.post('/api/share-list', async (req, res) => {
  try {
    const { title = 'Ma liste', data = {}, ownerEmail } = req.body || {}
    
    if (!ownerEmail) {
      return res.status(400).json({ error: 'ownerEmail requis' })
    }

    // Import Prisma client
    const { PrismaClient } = await import('@prisma/client')
    const { nanoid } = await import('nanoid')
    const prisma = new PrismaClient()

    // Ensure owner user exists
    const owner = await prisma.user.upsert({
      where: { email: ownerEmail },
      update: {},
      create: {
        id: `user_${nanoid(10)}`,
        email: ownerEmail,
        displayName: ownerEmail.split('@')[0],
        tier: 'free'
      }
    })

    const shareCode = nanoid(10)

    // Create shared list
    const sharedList = await prisma.sharedList.create({
      data: {
        id: `list_${nanoid(10)}`,
        ownerId: owner.id,
        title,
        shareCode,
        data,
        isActive: true
      }
    })

    // Add owner as admin member
    await prisma.sharedListMember.create({
      data: {
        id: `member_${nanoid(10)}`,
        listId: sharedList.id,
        userId: owner.id,
        role: 'admin'
      }
    })

    await prisma.$disconnect()

    res.json({
      success: true,
      id: sharedList.id,
      shareCode,
      url: `http://localhost:5175/shared/${shareCode}`,
      owner: { id: owner.id, email: owner.email }
    })
  } catch (err) {
    console.error('[share-list] Error:', err)
    res.status(500).json({ 
      success: false, 
      error: err.message || 'Erreur lors du partage' 
    })
  }
})

/**
 * GET /api/shared-list/:code
 * Récupérer une liste partagée par shareCode (Phase 1.2)
 */
app.get('/api/shared-list/:code', async (req, res) => {
  try {
    const { code } = req.params

    // Import Prisma client
    const { PrismaClient } = await import('@prisma/client')
    const prisma = new PrismaClient()

    const sharedList = await prisma.sharedList.findUnique({
      where: { shareCode: code },
      include: {
        owner: { select: { id: true, email: true, displayName: true } },
        members: {
          include: {
            user: { select: { id: true, email: true, displayName: true } }
          }
        }
      }
    })

    await prisma.$disconnect()

    if (!sharedList) {
      return res.status(404).json({ error: 'Liste non trouvée' })
    }

    res.json({
      success: true,
      list: sharedList
    })
  } catch (err) {
    console.error('[shared-list] Error:', err)
    res.status(500).json({ 
      success: false, 
      error: err.message || 'Erreur lors de la récupération' 
    })
  }
})

/**
 * POST /api/shared-list/:code/update
 * Mettre à jour une liste partagée (Phase 1.2)
 */
app.post('/api/shared-list/:code/update', async (req, res) => {
  try {
    const { code } = req.params
    const { products = [], userEmail } = req.body

    console.log('[shared-list/update] Received request:', { code, userEmail, productsCount: products.length })

    if (!userEmail) {
      return res.status(400).json({ error: 'userEmail requis' })
    }

    // Import Prisma client
    const { PrismaClient } = await import('@prisma/client')
    const prisma = new PrismaClient()

    // Find shared list
    const sharedList = await prisma.sharedList.findUnique({
      where: { shareCode: code },
      include: {
        owner: true,
        members: { include: { user: true } }
      }
    })

    if (!sharedList) {
      await prisma.$disconnect()
      return res.status(404).json({ error: 'Liste non trouvée' })
    }

    // Check if user is owner or member with edit permission
    const userMember = sharedList.members.find(m => m.user?.email === userEmail)
    const isOwner = sharedList.owner.email === userEmail
    const canEdit = isOwner || (userMember && (userMember.role === 'edit' || userMember.role === 'admin'))

    if (!canEdit) {
      await prisma.$disconnect()
      return res.status(403).json({ error: 'Permissions insuffisantes' })
    }

    // Update shared list data
    const updatedList = await prisma.sharedList.update({
      where: { id: sharedList.id },
      data: {
        data: { products }
      },
      include: {
        owner: { select: { id: true, email: true, displayName: true } },
        members: {
          include: {
            user: { select: { id: true, email: true, displayName: true } }
          }
        }
      }
    })

    await prisma.$disconnect()

    res.json({
      success: true,
      list: updatedList
    })
  } catch (err) {
    console.error('[shared-list update] Error:', err)
    res.status(500).json({ 
      success: false, 
      error: err.message || 'Erreur lors de la mise à jour' 
    })
  }
})

/**
 * POST /api/admin/scrape/iga
 * Déclencher le scraping IGA via API (ADMIN SEULEMENT)
 */
app.post('/api/admin/scrape/iga', requireAdmin, async (req, res) => {
  console.log('[ADMIN] Démarrage scraping IGA via API...')
  
  try {
    // Utiliser le nouveau scraper API au lieu de Puppeteer
    const result = await scrapeIGAApi({
      postalCode: process.env.IGA_POSTAL_CODE || 'G3A2W5'
    })

    console.log(`[ADMIN] Scraping terminé: ${result.totalFound} produits`)

    // Marquer tous comme "draft" (non publiés)
    const productsWithStatus = result.products.map(p => ({
      ...p,
      published: false,
      scrapedAt: new Date().toISOString(),
      source: 'iga-api-scraper'
    }))

    res.json({
      success: result.success,
      totalFound: result.totalFound,
      products: productsWithStatus,
      store: result.store,
      storeId: result.storeId,
      method: result.method,
      duration: result.duration,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('[ADMIN] Erreur scraping:', error)
    res.status(500).json({
      success: false,
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    })
  }
})

/**
 * POST /api/admin/scrape/metro
 * Déclencher le scraping Metro (ADMIN SEULEMENT)
 */
app.post('/api/admin/scrape/metro', requireAdmin, async (req, res) => {
  res.status(501).json({
    success: false,
    error: 'Scraper Metro pas encore implémenté'
  })
})

/**
 * POST /api/admin/scrape/maxi
 * Déclencher le scraping Maxi (ADMIN SEULEMENT)
 */
app.post('/api/admin/scrape/maxi', requireAdmin, async (req, res) => {
  res.status(501).json({
    success: false,
    error: 'Scraper Maxi pas encore implémenté'
  })
})

/**
 * Générateur de 50 produits réalistes avec marques québécoises/canadiennes
 */
function generateBaseProducts() {
  return [
    // Fruits & Légumes (10)
    { name: 'Pommes Gala', brand: 'Selection', basePrice: 2.99, volume: '3 lb', category: 'Fruits' },
    { name: 'Bananes', brand: 'Chiquita', basePrice: 0.79, volume: 'lb', category: 'Fruits' },
    { name: 'Oranges navel', brand: 'Sunkist', basePrice: 4.99, volume: '4 lb', category: 'Fruits' },
    { name: 'Fraises', brand: 'Savoura', basePrice: 3.99, volume: '454 g', category: 'Fruits' },
    { name: 'Raisins verts', brand: '', basePrice: 3.49, volume: 'lb', category: 'Fruits' },
    { name: 'Tomates', brand: 'Savoura', basePrice: 1.99, volume: 'lb', category: 'Légumes' },
    { name: 'Concombres anglais', brand: '', basePrice: 1.99, volume: 'un', category: 'Légumes' },
    { name: 'Carottes', brand: '', basePrice: 2.49, volume: '2 lb', category: 'Légumes' },
    { name: 'Brocoli', brand: '', basePrice: 1.99, volume: 'un', category: 'Légumes' },
    { name: 'Laitue romaine', brand: '', basePrice: 2.49, volume: 'un', category: 'Légumes' },
    
    // Produits laitiers & Œufs (10)
    { name: 'Lait 2%', brand: 'Natrel', basePrice: 4.49, volume: '2 L', category: 'Produits laitiers' },
    { name: 'Lait 3.25%', brand: 'Québon', basePrice: 4.69, volume: '2 L', category: 'Produits laitiers' },
    { name: 'Yogourt grec', brand: 'Oikos', basePrice: 4.99, volume: '4x100g', category: 'Produits laitiers' },
    { name: 'Yogourt nature', brand: 'Liberté', basePrice: 3.99, volume: '650g', category: 'Produits laitiers' },
    { name: 'Fromage cheddar', brand: 'Black Diamond', basePrice: 6.99, volume: '400g', category: 'Produits laitiers' },
    { name: 'Fromage mozzarella', brand: 'Saputo', basePrice: 5.49, volume: '340g', category: 'Produits laitiers' },
    { name: 'Beurre', brand: 'Lactantia', basePrice: 5.49, volume: '454g', category: 'Produits laitiers' },
    { name: 'Crème sure', brand: 'Astro', basePrice: 3.49, volume: '500ml', category: 'Produits laitiers' },
    { name: 'Œufs gros', brand: 'Québon', basePrice: 3.99, volume: '12 un', category: 'Produits laitiers' },
    { name: 'Œufs extra-gros', brand: 'Nutrioeuf', basePrice: 4.49, volume: '12 un', category: 'Produits laitiers' },
    
    // Viandes & Poissons (8)
    { name: 'Poulet entier', brand: 'Exceldor', basePrice: 9.99, volume: 'kg', category: 'Viandes' },
    { name: 'Poitrines de poulet', brand: 'Exceldor', basePrice: 12.99, volume: 'kg', category: 'Viandes' },
    { name: 'Bœuf haché mi-maigre', brand: '', basePrice: 7.99, volume: 'lb', category: 'Viandes' },
    { name: 'Bœuf haché maigre', brand: '', basePrice: 8.99, volume: 'lb', category: 'Viandes' },
    { name: 'Bacon', brand: 'Olymel', basePrice: 5.99, volume: '375g', category: 'Viandes' },
    { name: 'Saucisses italiennes', brand: 'Olymel', basePrice: 6.49, volume: '450g', category: 'Viandes' },
    { name: 'Côtelettes de porc', brand: 'Olymel', basePrice: 11.99, volume: 'kg', category: 'Viandes' },
    { name: 'Saumon atlantique', brand: '', basePrice: 15.99, volume: 'lb', category: 'Poissons' },
    
    // Boulangerie (5)
    { name: 'Pain tranché blanc', brand: 'Bon Matin', basePrice: 2.99, volume: '675g', category: 'Boulangerie' },
    { name: 'Pain de blé entier', brand: 'POM', basePrice: 3.49, volume: '600g', category: 'Boulangerie' },
    { name: 'Bagels', brand: 'St-Viateur', basePrice: 4.99, volume: '6 un', category: 'Boulangerie' },
    { name: 'Tortillas', brand: 'Old El Paso', basePrice: 3.99, volume: '8 un', category: 'Boulangerie' },
    { name: 'Croissants', brand: 'Vachon', basePrice: 4.49, volume: '6 un', category: 'Boulangerie' },
    
    // Épicerie sèche (10)
    { name: 'Pâtes spaghetti', brand: 'Catelli', basePrice: 1.99, volume: '900g', category: 'Épicerie' },
    { name: 'Pâtes penne', brand: 'Barilla', basePrice: 2.49, volume: '500g', category: 'Épicerie' },
    { name: 'Riz blanc', brand: 'Uncle Ben\'s', basePrice: 4.99, volume: '2 kg', category: 'Épicerie' },
    { name: 'Sauce tomate', brand: 'Classico', basePrice: 3.99, volume: '650ml', category: 'Épicerie' },
    { name: 'Huile d\'olive', brand: 'Bertolli', basePrice: 9.99, volume: '750ml', category: 'Épicerie' },
    { name: 'Farine tout usage', brand: 'Robin Hood', basePrice: 5.49, volume: '2.5 kg', category: 'Épicerie' },
    { name: 'Sucre blanc', brand: 'Lantic', basePrice: 4.99, volume: '2 kg', category: 'Épicerie' },
    { name: 'Céréales Cheerios', brand: 'Cheerios', basePrice: 4.49, volume: '430g', category: 'Déjeuner' },
    { name: 'Céréales Corn Flakes', brand: 'Kellogg\'s', basePrice: 3.99, volume: '440g', category: 'Déjeuner' },
    { name: 'Gruau', brand: 'Quaker', basePrice: 5.99, volume: '1 kg', category: 'Déjeuner' },
    
    // Boissons (5)
    { name: 'Jus d\'orange', brand: 'Tropicana', basePrice: 3.99, volume: '1.75 L', category: 'Boissons' },
    { name: 'Jus de pomme', brand: 'Oasis', basePrice: 2.99, volume: '1.75 L', category: 'Boissons' },
    { name: 'Café moulu', brand: 'Nabob', basePrice: 8.99, volume: '900g', category: 'Boissons' },
    { name: 'Thé vert', brand: 'Tetley', basePrice: 4.49, volume: '72 sachets', category: 'Boissons' },
    { name: 'Eau pétillante', brand: 'Perrier', basePrice: 5.99, volume: '8x330ml', category: 'Boissons' },
    
    // Collations & Desserts (7)
    { name: 'Chips originales', brand: 'Lay\'s', basePrice: 2.99, volume: '235g', category: 'Collations' },
    { name: 'Chips BBQ', brand: 'Ruffles', basePrice: 2.99, volume: '220g', category: 'Collations' },
    { name: 'Biscuits Oreo', brand: 'Oreo', basePrice: 3.99, volume: '303g', category: 'Collations' },
    { name: 'Barres granola', brand: 'Nature Valley', basePrice: 4.49, volume: '6 barres', category: 'Collations' },
    { name: 'Crème glacée vanille', brand: 'Ben & Jerry\'s', basePrice: 5.99, volume: '500ml', category: 'Desserts' },
    { name: 'Crème glacée chocolat', brand: 'Häagen-Dazs', basePrice: 6.49, volume: '500ml', category: 'Desserts' },
    { name: 'Biscuits au chocolat', brand: 'Leclerc', basePrice: 3.49, volume: '350g', category: 'Collations' }
  ]
}

/**
 * POST /api/admin/scrape/test
 * Scraper de TEST avec 50 produits de base (ADMIN SEULEMENT)
 */
app.post('/api/admin/scrape/test', requireAdmin, async (req, res) => {
  console.log('[ADMIN] Génération de 50 produits de test...')
  
  const baseProducts = generateBaseProducts()
  const testProducts = baseProducts.map(p => ({
    ...p,
    price: p.basePrice,
    validFrom: '2025-11-22',
    validTo: '2025-11-28',
    store: 'Test',
    image: '',
    published: false,
    scrapedAt: new Date().toISOString(),
    source: 'test-scraper'
  }))

  res.json({
    success: true,
    totalFound: testProducts.length,
    products: testProducts,
    method: 'test-data',
    timestamp: new Date().toISOString(),
    message: `✅ ${testProducts.length} produits de test générés`
  })
})

/**
 * POST /api/admin/scrape/all-stores
 * Générer les 50 mêmes produits pour 5 épiceries avec prix variés (ADMIN SEULEMENT)
 */
app.post('/api/admin/scrape/all-stores', requireAdmin, async (req, res) => {
  console.log('[ADMIN] Génération de 50 produits × 5 épiceries (250 produits)...')
  
  const stores = [
    { name: 'IGA', priceMultiplier: 1.0 },      // Prix de base
    { name: 'Costco', priceMultiplier: 0.85 },  // -15% (entrepôt)
    { name: 'Metro', priceMultiplier: 1.05 },   // +5%
    { name: 'Maxi', priceMultiplier: 0.92 },    // -8% (rabais)
    { name: 'Super C', priceMultiplier: 0.88 }  // -12% (plus bas prix)
  ]
  
  const baseProducts = generateBaseProducts()
  const allProducts = []
  
  // Période de validité : cette semaine (vendredi à jeudi)
  const validFrom = '2025-11-22'
  const validTo = '2025-11-28'
  
  stores.forEach(store => {
    baseProducts.forEach(product => {
      // Variation aléatoire de ±5% en plus du multiplicateur de base
      const randomVariation = 0.95 + Math.random() * 0.10
      const finalPrice = Math.round(product.basePrice * store.priceMultiplier * randomVariation * 100) / 100
      
      allProducts.push({
        name: product.name,
        brand: product.brand,
        price: finalPrice,
        volume: product.volume,
        category: product.category,
        store: store.name,
        validFrom: validFrom,
        validTo: validTo,
        image: '',
        published: false,
        scrapedAt: new Date().toISOString(),
        source: 'multi-store-generator'
      })
    })
  })
  
  console.log(`[ADMIN] ${allProducts.length} produits générés (${baseProducts.length} produits × ${stores.length} épiceries)`)

  res.json({
    success: true,
    totalFound: allProducts.length,
    products: allProducts,
    stores: stores.map(s => s.name),
    productsPerStore: baseProducts.length,
    validFrom: validFrom,
    validTo: validTo,
    method: 'multi-store-generator',
    timestamp: new Date().toISOString(),
    message: `✅ ${allProducts.length} produits générés pour ${stores.length} épiceries`
  })
})

/**
 * POST /api/admin/publish
 * Publier des produits validés (ADMIN SEULEMENT)
 */
app.post('/api/admin/publish', requireAdmin, async (req, res) => {
  const { products } = req.body

  if (!products || !Array.isArray(products)) {
    return res.status(400).json({
      success: false,
      error: 'Liste de produits invalide'
    })
  }

  console.log(`[ADMIN] Publication de ${products.length} produits...`)

  // Marquer comme publiés
  const publishedProducts = products.map(p => ({
    ...p,
    published: true,
    publishedAt: new Date().toISOString(),
    publishedBy: 'admin'
  }))

  // TODO: Sauvegarder dans une base de données ou fichier JSON
  // Pour l'instant, juste retourner les produits publiés

  res.json({
    success: true,
    published: publishedProducts.length,
    products: publishedProducts,
    message: `${publishedProducts.length} produits publiés avec succès`,
    timestamp: new Date().toISOString()
  })
})

// ============================================
// ROUTES API
// ============================================

// Price history routes (disabled until PostgreSQL configured)
// app.use('/api/prices', pricesRouter)

// ============================================
// GESTION DES ERREURS
// ============================================

app.use((req, res) => {
  res.status(404).json({ 
    success: false, 
    error: 'Route non trouvée' 
  })
})

app.use((err, req, res, next) => {
  console.error('[ERROR]', err)
  res.status(500).json({ 
    success: false, 
    error: 'Erreur serveur interne',
    message: err.message 
  })
})

// ============================================
// DÉMARRAGE DU SERVEUR
// ============================================

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('[FATAL] Unhandled Promise Rejection:', reason);
  console.error('Promise:', promise);
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('[FATAL] Uncaught Exception:', error);
  process.exit(1);
});

const server = app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════╗
║   Panier Intelligent - Backend API       ║
╠═══════════════════════════════════════════╣
║   Port: ${PORT}                            ║
║   Frontend: ${FRONTEND_URL}               ║
║   Admin protégé: Oui                      ║
╚═══════════════════════════════════════════╝
  `)
  console.log('✅ Serveur démarré avec succès')
  console.log(`📍 Health check: http://localhost:${PORT}/api/health`)
  console.log(`🔒 Admin API: http://localhost:${PORT}/api/admin/*`)
})
