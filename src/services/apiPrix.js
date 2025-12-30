/**
 * API Prix - Récupère les prix depuis le backend
 * Retourne les prix réalistes du scraper Flipp
 */

import { getPricesForOptimization } from './firestore'

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001'
const STORES = ['IGA', 'Maxi', 'Metro', 'Walmart', 'Super C', 'Costco']

// Deterministic pseudo-random generator from string (for mock prices)
function seedFromString(s) {
  let h = 2166136261 >>> 0
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

/**
 * Récupère tous les prix depuis le backend
 * Retourne: { nomProduit: { magasin: prix }, ... }
 */
async function getAllPrices() {
  // Skip backend call if explicitly disabled or in development without backend
  const skipBackend = import.meta.env.VITE_SKIP_BACKEND === 'true'
  if (skipBackend) {
    return {}
  }

  try {
    const response = await fetch(`${BACKEND_URL}/api/prices`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      throw new Error(`Backend returned ${response.status}`)
    }

    const data = await response.json()
    return data.prices || {}
  } catch (error) {
    console.warn('[apiPrix] Backend non disponible (normal en dev sans backend) - utilisation du fallback mock')
    // Fallback vide - les prix mock seront générés
    return {}
  }
}

// Cache des prix (rechargé une fois par session)
let pricesCache = null
let pricesCacheTime = 0
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

/**
 * Retourne les prix pour les produits donnés
 * Format: { nomProduit: { magasin: prix }, ... }
 * PRIORITY:
 * 1. Prix manuel (p.prix + magasin)
 * 2. Prix Firestore (storePrices collection)
 * 3. Prix backend/Flipp API
 * 4. Prix mock générés (fallback)
 */
export async function getPrixProduits(products) {
  // Récupérer ou rafraîchir le cache des prix backend
  const now = Date.now()
  if (!pricesCache || (now - pricesCacheTime) > CACHE_DURATION) {
    pricesCache = await getAllPrices()
    pricesCacheTime = now
  }

  const result = {}
  const meta = {}

  // PRIORITY 2: Récupérer les prix Firestore pour tous les produits
  let firestorePrices = {}
  try {
    firestorePrices = await getPricesForOptimization(products)
  } catch (error) {
    console.warn('[apiPrix] Erreur lors de la récupération des prix Firestore:', error)
    firestorePrices = { __meta: {} }
  }

  products.forEach((p, idx) => {
    const nom = (p.nom || p.id || `produit-${idx}`).toLowerCase()
    const map = {}
    meta[nom] = {}

    // PRIORITY 1: Si le produit a un prix manuel avec magasin, l'utiliser
    if (p.prix != null && p.magasin) {
      const magasin = p.magasin.toLowerCase()
      map[magasin] = Number(p.prix)
      meta[nom][magasin] = { isStored: true, source: 'manuel' }
    }

    // PRIORITY 2: Ajouter les prix Firestore pour ce produit
    if (firestorePrices[nom]) {
      Object.entries(firestorePrices[nom]).forEach(([magasin, prix]) => {
        // Ne pas overwrite si déjà un prix manuel
        if (!map[magasin]) {
          map[magasin] = prix
          meta[nom][magasin] = firestorePrices.__meta?.[nom]?.[magasin] || { isStored: false, source: 'firestore' }
        }
      })
    }

    // PRIORITY 3: Chercher les prix du backend pour ce produit
    if (pricesCache[nom]) {
      Object.entries(pricesCache[nom]).forEach(([magasin, prix]) => {
        // Ne pas overwrite si déjà un prix manuel ou Firestore
        if (!map[magasin]) {
          map[magasin] = prix
          meta[nom][magasin] = { isStored: false, source: 'backend-flipp' }
        }
      })
    }

    // PRIORITY 4: Générer des prix mock si aucun prix disponible (fallback)
    if (Object.keys(map).length === 0) {
      const seed = seedFromString(String(nom))
      STORES.forEach((store, i) => {
        const r = ((seed >> (i * 3)) % 850) / 100.0 // 0..8.5
        const price = 1.5 + r
        map[store.toLowerCase()] = Math.round(price * 100) / 100
        meta[nom][store.toLowerCase()] = { isStored: false, source: 'estime' }
      })
    }

    result[nom] = map
  })

  result.__meta = meta
  return result
}

/**
 * Retourne les prix au format légacy (pour compatibilité)
 */
export async function fetchPricesForProducts(products) {
  const obj = await getPrixProduits(products)
  return products.map(p => ({
    id: p.id,
    nom: p.nom,
    prices: Object.entries(obj[p.nom] || {}).map(([magasin, prix]) => ({ magasin, prix }))
  }))
}

