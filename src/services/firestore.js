/**
 * Firestore Service - Cloud database operations
 *
 * Ce service remplace progressivement db.js (IndexedDB local)
 * pour utiliser Firestore (cloud sync + temps réel)
 *
 * Usage:
 *   import { getProducts, addProduct, updateProduct } from './services/firestore'
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  writeBatch,
  serverTimestamp
} from 'firebase/firestore'
import { db } from '../config/firebase.config'

// ========================================
// PRODUITS (Catalogue universel)
// ========================================

/**
 * Récupérer tous les produits du catalogue
 */
export async function getAllProducts() {
  try {
    const snapshot = await getDocs(collection(db, 'products'))
    const products = []
    snapshot.forEach(doc => {
      products.push({ id: doc.id, ...doc.data() })
    })
    return products
  } catch (error) {
    console.error('[firestore] Error getting products:', error)
    throw error
  }
}

/**
 * Rechercher des produits par nom (fuzzy match)
 */
export async function searchProducts(searchTerm) {
  try {
    const snapshot = await getDocs(collection(db, 'products'))
    const products = []
    const lowerSearch = searchTerm.toLowerCase()

    snapshot.forEach(doc => {
      const data = doc.data()
      const nameMatch = data.nom_produit?.toLowerCase().includes(lowerSearch)
      const marqueMatch = data.marque?.toLowerCase().includes(lowerSearch)
      const nameKeyMatch = data.nameKey?.toLowerCase().includes(lowerSearch)

      if (nameMatch || marqueMatch || nameKeyMatch) {
        products.push({ id: doc.id, ...data })
      }
    })

    return products
  } catch (error) {
    console.error('[firestore] Error searching products:', error)
    throw error
  }
}

/**
 * Récupérer un produit par ID
 */
export async function getProductById(productId) {
  try {
    const docRef = doc(db, 'products', productId)
    const docSnap = await getDoc(docRef)

    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() }
    } else {
      return null
    }
  } catch (error) {
    console.error('[firestore] Error getting product:', error)
    throw error
  }
}

// ========================================
// PRIX PAR MAGASIN
// ========================================

/**
 * Récupérer tous les prix pour un produit donné
 */
export async function getProductPrices(productId) {
  try {
    const q = query(
      collection(db, 'storePrices'),
      where('product_id', '==', productId)
    )
    const snapshot = await getDocs(q)
    const prices = []

    snapshot.forEach(doc => {
      prices.push({ id: doc.id, ...doc.data() })
    })

    return prices
  } catch (error) {
    console.error('[firestore] Error getting prices:', error)
    throw error
  }
}

/**
 * Récupérer les prix pour une liste de produits
 * Retourne: { productId: { storeCode: price } }
 */
export async function getPricesForProducts(productIds) {
  try {
    const priceMap = {}

    // Firestore limite "in" queries à 10 items, donc on batch
    const chunks = []
    for (let i = 0; i < productIds.length; i += 10) {
      chunks.push(productIds.slice(i, i + 10))
    }

    for (const chunk of chunks) {
      const q = query(
        collection(db, 'storePrices'),
        where('product_id', 'in', chunk)
      )
      const snapshot = await getDocs(q)

      snapshot.forEach(doc => {
        const data = doc.data()
        const productId = data.product_id
        const storeId = data.store_id
        const price = data.promo_actif ? data.prix_promo : data.prix_regulier

        if (!priceMap[productId]) {
          priceMap[productId] = {}
        }

        priceMap[productId][storeId] = price
      })
    }

    return priceMap
  } catch (error) {
    console.error('[firestore] Error getting prices for products:', error)
    throw error
  }
}

/**
 * Récupérer les prix depuis Firestore pour l'algorithme d'optimisation
 * Format retourné: { nomProduit: { magasin: prix }, __meta: {...} }
 * Compatible avec l'algorithme d'optimisation
 */
export async function getPricesForOptimization(products) {
  try {
    if (!products || products.length === 0) {
      return { __meta: {} }
    }

    // Normaliser les noms de produits pour matching
    const productNames = products.map(p => (p.nom || '').toLowerCase().trim())

    // Query storePrices - récupérer tous les prix
    const pricesSnapshot = await getDocs(collection(db, 'storePrices'))

    const result = {}
    const meta = {}

    pricesSnapshot.forEach(doc => {
      const data = doc.data()
      const productName = (data.productName || data.product_name || '').toLowerCase().trim()
      const storeName = (data.storeName || data.store_name || data.store_id || '').toLowerCase().trim()

      // Utiliser prix promo si actif, sinon régulier
      const price = data.promo_actif ? data.prix_promo : data.prix_regulier

      // Vérifier si ce produit est dans notre liste
      if (productNames.includes(productName) && price != null) {
        if (!result[productName]) {
          result[productName] = {}
          meta[productName] = {}
        }

        result[productName][storeName] = Number(price)
        meta[productName][storeName] = {
          isStored: true,
          source: 'firestore',
          promoActif: data.promo_actif || false
        }
      }
    })

    result.__meta = meta
    console.log(`[firestore] Loaded prices for ${Object.keys(result).length - 1} products from Firestore`)

    return result
  } catch (error) {
    console.error('[firestore] Error getting prices for optimization:', error)
    return { __meta: {} }  // Return empty instead of throwing
  }
}

// ========================================
// MAGASINS
// ========================================

/**
 * Récupérer tous les magasins
 */
export async function getAllStores() {
  try {
    const snapshot = await getDocs(collection(db, 'stores'))
    const stores = []

    snapshot.forEach(doc => {
      stores.push({ id: doc.id, ...doc.data() })
    })

    return stores
  } catch (error) {
    console.error('[firestore] Error getting stores:', error)
    throw error
  }
}

/**
 * Récupérer les magasins dans un rayon géographique
 */
export async function getStoresNearby(userLat, userLon, radiusKm) {
  try {
    // Note: Firestore n'a pas de requête géospatiale native
    // On récupère tous les magasins et on filtre en JS
    const allStores = await getAllStores()

    const nearby = allStores.filter(store => {
      const distance = haversineDistance(
        userLat,
        userLon,
        store.latitude,
        store.longitude
      )
      return distance <= radiusKm
    })

    return nearby
  } catch (error) {
    console.error('[firestore] Error getting nearby stores:', error)
    throw error
  }
}

/**
 * Calcul distance Haversine (km)
 */
function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371 // Rayon de la Terre en km
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

// ========================================
// LISTES PERSONNELLES (User Lists)
// ========================================

/**
 * Récupérer la liste personnelle d'un utilisateur
 * Note: Chaque user a UNE liste personnelle principale
 */
export async function getUserPersonalList(userId) {
  try {
    const q = query(
      collection(db, 'userLists'),
      where('userId', '==', userId),
      where('isPersonal', '==', true)
    )
    const snapshot = await getDocs(q)

    if (snapshot.empty) {
      // Créer une liste personnelle vide si elle n'existe pas
      return await createUserPersonalList(userId)
    }

    const doc = snapshot.docs[0]
    return { id: doc.id, ...doc.data() }
  } catch (error) {
    console.error('[firestore] Error getting personal list:', error)
    throw error
  }
}

/**
 * Créer la liste personnelle d'un utilisateur
 */
async function createUserPersonalList(userId) {
  try {
    const listData = {
      userId,
      isPersonal: true,
      products: [],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    }

    const docRef = await addDoc(collection(db, 'userLists'), listData)
    console.log('[firestore] Created personal list:', docRef.id)

    return { id: docRef.id, ...listData }
  } catch (error) {
    console.error('[firestore] Error creating personal list:', error)
    throw error
  }
}

/**
 * Mettre à jour la liste personnelle d'un utilisateur
 */
export async function updateUserPersonalList(listId, updates) {
  try {
    const docRef = doc(db, 'userLists', listId)

    await updateDoc(docRef, {
      ...updates,
      updatedAt: serverTimestamp()
    })

    console.log('[firestore] Updated personal list:', listId)
    return { id: listId, ...updates }
  } catch (error) {
    console.error('[firestore] Error updating personal list:', error)
    throw error
  }
}

/**
 * Écouter les changements de la liste personnelle en temps réel
 */
export function subscribeToUserPersonalList(userId, callback) {
  console.log('[firestore] subscribeToUserPersonalList starting for userId:', userId)
  
  const q = query(
    collection(db, 'userLists'),
    where('userId', '==', userId),
    where('isPersonal', '==', true)
  )

  const unsubscribe = onSnapshot(
    q,
    async (snapshot) => {
      console.log('[firestore] onSnapshot received. Docs count:', snapshot.docs.length)
      
      if (!snapshot.empty) {
        const doc = snapshot.docs[0]
        const data = { id: doc.id, ...doc.data() }
        console.log('[firestore] Found personal list:', data.id, 'Products count:', data.products?.length || 0)
        callback(data)
      } else {
        console.log('[firestore] No personal list found, creating one')
        // Auto-create if doesn't exist
        const newList = await createUserPersonalList(userId)
        console.log('[firestore] Created personal list:', newList.id)
        callback(newList)
      }
    },
    (error) => {
      console.error('[firestore] Error in personal list subscription:', error)
    }
  )

  return unsubscribe
}

// ========================================
// LISTES PARTAGÉES
// ========================================

/**
 * Créer une nouvelle liste partagée
 * Maintenant: pointe vers la userList au lieu de copier les produits
 */
export async function createSharedList(ownerId, title, userListId) {
  try {
    const shareCode = generateShareCode()

    const listData = {
      ownerId,
      title,
      shareCode,
      userListId, // RÉFÉRENCE à la liste personnelle
      members: {
        [ownerId]: 'admin'
      },
      isActive: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    }

    const docRef = await addDoc(collection(db, 'sharedLists'), listData)

    // Update the userList with sharedWith array for security rules
    const userListRef = doc(db, 'userLists', userListId)
    await updateDoc(userListRef, {
      sharedWith: [ownerId], // Initialize with owner
      updatedAt: serverTimestamp()
    })

    console.log('[firestore] Created shared list:', docRef.id)

    return {
      id: docRef.id,
      ...listData,
      shareCode
    }
  } catch (error) {
    console.error('[firestore] Error creating shared list:', error)
    throw error
  }
}

/**
 * Récupérer une liste partagée par shareCode
 */
export async function getSharedListByCode(shareCode) {
  try {
    const q = query(
      collection(db, 'sharedLists'),
      where('shareCode', '==', shareCode),
      where('isActive', '==', true)
    )
    const snapshot = await getDocs(q)

    if (snapshot.empty) {
      return null
    }

    const doc = snapshot.docs[0]
    return { id: doc.id, ...doc.data() }
  } catch (error) {
    console.error('[firestore] Error getting shared list:', error)
    throw error
  }
}

/**
 * Récupérer toutes les listes d'un utilisateur
 */
export async function getUserSharedLists(userId) {
  try {
    // Trouver toutes les listes où l'utilisateur est owner ou membre
    const snapshot = await getDocs(collection(db, 'sharedLists'))
    const lists = []

    snapshot.forEach(doc => {
      const data = doc.data()
      const isOwner = data.ownerId === userId
      const isMember = data.members && data.members[userId]

      if ((isOwner || isMember) && data.isActive) {
        lists.push({ id: doc.id, ...data })
      }
    })

    // Trier par date de mise à jour (plus récent en premier)
    lists.sort((a, b) => {
      const dateA = a.updatedAt?.toDate() || new Date(0)
      const dateB = b.updatedAt?.toDate() || new Date(0)
      return dateB - dateA
    })

    return lists
  } catch (error) {
    console.error('[firestore] Error getting user lists:', error)
    throw error
  }
}

/**
 * Mettre à jour une liste partagée
 */
export async function updateSharedList(listId, updates) {
  try {
    const docRef = doc(db, 'sharedLists', listId)

    await updateDoc(docRef, {
      ...updates,
      updatedAt: serverTimestamp()
    })

    // Si les membres ont été mis à jour, synchroniser sharedWith dans userList
    if (updates.members) {
      const sharedListDoc = await getDoc(docRef)
      const sharedListData = sharedListDoc.data()

      if (sharedListData.userListId) {
        const memberIds = Object.keys(updates.members)
        const userListRef = doc(db, 'userLists', sharedListData.userListId)
        await updateDoc(userListRef, {
          sharedWith: memberIds,
          updatedAt: serverTimestamp()
        })
      }
    }

    console.log('[firestore] Updated shared list:', listId)

    return { id: listId, ...updates }
  } catch (error) {
    console.error('[firestore] Error updating shared list:', error)
    throw error
  }
}

/**
 * Supprimer une liste partagée (soft delete)
 */
export async function deleteSharedList(listId) {
  try {
    const docRef = doc(db, 'sharedLists', listId)

    await updateDoc(docRef, {
      isActive: false,
      updatedAt: serverTimestamp()
    })

    console.log('[firestore] Deleted shared list:', listId)

    return { id: listId }
  } catch (error) {
    console.error('[firestore] Error deleting shared list:', error)
    throw error
  }
}

/**
 * Écouter les changements d'une liste en temps réel (par ID de document)
 */
export function subscribeToSharedList(listId, callback) {
  const docRef = doc(db, 'sharedLists', listId)

  const unsubscribe = onSnapshot(
    docRef,
    (doc) => {
      if (doc.exists()) {
        callback({ id: doc.id, ...doc.data() })
      } else {
        callback(null)
      }
    },
    (error) => {
      console.error('[firestore] Error in subscription:', error)
    }
  )

  return unsubscribe
}

/**
 * Synchroniser l'accès d'un utilisateur à une userList via sharedList
 * Ajoute l'utilisateur aux membres de la sharedList ET au tableau sharedWith de la userList
 */
async function syncUserAccessToSharedList(sharedListData, sharedListDocId, userId) {
  if (!userId || !sharedListData.userListId) return

  try {
    // Vérifier si l'utilisateur est déjà membre de la sharedList
    const currentMembers = sharedListData.members || {}
    const isMember = currentMembers[userId] !== undefined

    // Si l'utilisateur n'est pas encore membre, l'ajouter avec le rôle 'editor'
    if (!isMember) {
      console.log('[firestore] Adding new member to sharedList:', userId)
      const sharedListRef = doc(db, 'sharedLists', sharedListDocId)
      const updatedMembers = {
        ...currentMembers,
        [userId]: 'editor' // Nouveau membre = editor par défaut
      }

      await updateDoc(sharedListRef, {
        members: updatedMembers,
        updatedAt: serverTimestamp()
      })

      // Mettre à jour aussi sharedListData pour la suite
      sharedListData.members = updatedMembers
    }

    // Maintenant synchroniser le tableau sharedWith dans userList
    const userListRef = doc(db, 'userLists', sharedListData.userListId)
    const userListDoc = await getDoc(userListRef)

    if (userListDoc.exists()) {
      const userListData = userListDoc.data()
      const currentSharedWith = userListData.sharedWith || []

      // Ajouter l'utilisateur s'il n'est pas déjà dans le tableau
      if (!currentSharedWith.includes(userId)) {
        console.log('[firestore] Adding user to sharedWith:', userId)
        await updateDoc(userListRef, {
          sharedWith: [...currentSharedWith, userId],
          updatedAt: serverTimestamp()
        })
      }
    }
  } catch (error) {
    console.error('[firestore] Error syncing user access:', error)
  }
}

/**
 * Écouter les changements d'une liste en temps réel (par shareCode)
 * Nouvelle version: récupère les produits depuis userLists
 */
export function subscribeToSharedListByCode(shareCode, callback, userId = null) {
  console.log('[firestore] subscribeToSharedListByCode starting. shareCode:', shareCode, 'userId:', userId)
  
  const q = query(
    collection(db, 'sharedLists'),
    where('shareCode', '==', shareCode),
    where('isActive', '==', true)
  )

  let userListUnsubscribe = null
  let accessSynced = false

  const sharedListUnsubscribe = onSnapshot(
    q,
    async (snapshot) => {
      console.log('[firestore] sharedList snapshot received. Docs:', snapshot.docs.length)
      
      if (!snapshot.empty) {
        const sharedListDoc = snapshot.docs[0]
        const sharedListData = sharedListDoc.data()
        
        console.log('[firestore] sharedList found:', sharedListDoc.id, 'userListId:', sharedListData.userListId)

        // Synchroniser l'accès de l'utilisateur une seule fois
        if (userId && !accessSynced) {
          console.log('[firestore] Syncing user access...')
          await syncUserAccessToSharedList(sharedListData, sharedListDoc.id, userId)
          accessSynced = true
        }

        // Si la sharedList a un userListId, s'abonner aux produits de userLists
        if (sharedListData.userListId) {
          // Unsubscribe from previous userList if exists
          if (userListUnsubscribe) {
            userListUnsubscribe()
          }

          console.log('[firestore] Subscribing to userList:', sharedListData.userListId)
          
          // Subscribe to the referenced userList for products
          const userListRef = doc(db, 'userLists', sharedListData.userListId)
          userListUnsubscribe = onSnapshot(
            userListRef,
            (userListDoc) => {
              console.log('[firestore] userList snapshot received. Exists:', userListDoc.exists())
              
              if (userListDoc.exists()) {
                const userListData = userListDoc.data()
                console.log('[firestore] userList products count:', userListData.products?.length || 0)
                
                // Merge sharedList metadata with userList products
                callback({
                  id: sharedListDoc.id,
                  ...sharedListData,
                  products: userListData.products || []
                })
              } else {
                callback({ id: sharedListDoc.id, ...sharedListData, products: [] })
              }
            },
            (error) => {
              console.error('[firestore] Error in userList subscription:', error)
            }
          )
        } else {
          // Fallback: sharedList has its own products (old format)
          callback({ id: sharedListDoc.id, ...sharedListData })
        }
      } else {
        console.log('[firestore] No sharedList found with shareCode:', shareCode)
        callback(null)
      }
    },
    (error) => {
      console.error('[firestore] Error in subscription by code:', error)
      callback(null)
    }
  )

  // Return combined unsubscribe function
  return () => {
    console.log('[firestore] Unsubscribing from sharedList')
    sharedListUnsubscribe()
    if (userListUnsubscribe) {
      userListUnsubscribe()
    }
  }
}

// ========================================
// ASSIGNATIONS DE COURSES
// ========================================

/**
 * Créer une assignation de courses
 */
export async function createCourseAssignment(listId, userId, storeCode, productIds) {
  try {
    const assignmentData = {
      listId,
      userId,
      storeCode,
      productIds,
      status: 'pending',
      createdAt: serverTimestamp(),
      completedAt: null
    }

    const docRef = await addDoc(collection(db, 'courseAssignments'), assignmentData)

    console.log('[firestore] Created course assignment:', docRef.id)

    return { id: docRef.id, ...assignmentData }
  } catch (error) {
    console.error('[firestore] Error creating assignment:', error)
    throw error
  }
}

/**
 * Récupérer les assignations d'un utilisateur
 */
export async function getUserAssignments(userId) {
  try {
    const q = query(
      collection(db, 'courseAssignments'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    )
    const snapshot = await getDocs(q)
    const assignments = []

    snapshot.forEach(doc => {
      assignments.push({ id: doc.id, ...doc.data() })
    })

    return assignments
  } catch (error) {
    console.error('[firestore] Error getting assignments:', error)
    throw error
  }
}

/**
 * Mettre à jour le statut d'une assignation
 */
export async function updateAssignmentStatus(assignmentId, status) {
  try {
    const docRef = doc(db, 'courseAssignments', assignmentId)

    const updates = {
      status,
      updatedAt: serverTimestamp()
    }

    if (status === 'completed') {
      updates.completedAt = serverTimestamp()
    }

    await updateDoc(docRef, updates)

    console.log('[firestore] Updated assignment status:', assignmentId, status)

    return { id: assignmentId, status }
  } catch (error) {
    console.error('[firestore] Error updating assignment:', error)
    throw error
  }
}

// ========================================
// UTILITAIRES
// ========================================

/**
 * Générer un shareCode unique (10 caractères)
 */
function generateShareCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let code = ''
  for (let i = 0; i < 10; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

// ========================================
// SAVED LISTS (Snapshots de listes)
// ========================================

/**
 * Sauvegarder la liste personnelle actuelle comme snapshot
 */
export async function savePersonalListAsSnapshot(userId, listName, products) {
  try {
    console.log('[firestore] savePersonalListAsSnapshot called. userId:', userId, 'name:', listName, 'products:', products.length)
    
    const listData = {
      userId,
      name: listName || `Liste ${new Date().toLocaleDateString('fr-CA')}`,
      isPersonal: false, // C'est un snapshot, pas la liste active
      products: products.map(p => ({ ...p })), // Clone des produits
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    }

    const docRef = await addDoc(collection(db, 'userLists'), listData)
    console.log('[firestore] Created saved list snapshot:', docRef.id)

    return { id: docRef.id, ...listData }
  } catch (error) {
    console.error('[firestore] Error saving list as snapshot:', error)
    throw error
  }
}

/**
 * Récupérer toutes les listes sauvegardées d'un utilisateur
 */
export async function getSavedListSnapshots(userId) {
  try {
    const baseConstraints = [
      where('userId', '==', userId),
      where('isPersonal', '==', false)
    ]

    let snapshot

    try {
      const orderedQuery = query(
        collection(db, 'userLists'),
        ...baseConstraints,
        orderBy('createdAt', 'desc')
      )
      snapshot = await getDocs(orderedQuery)
    } catch (err) {
      console.warn('[firestore] getSavedListSnapshots fallback without orderBy:', err?.code)
      const unorderedQuery = query(collection(db, 'userLists'), ...baseConstraints)
      snapshot = await getDocs(unorderedQuery)
    }

    const lists = []
    snapshot.forEach(doc => {
      lists.push({ id: doc.id, ...doc.data() })
    })

    // Garantir l'ordre décroissant si createdAt est présent
    return lists.sort((a, b) => {
      const aDate = a.createdAt?.toMillis ? a.createdAt.toMillis() : new Date(a.createdAt || 0).getTime()
      const bDate = b.createdAt?.toMillis ? b.createdAt.toMillis() : new Date(b.createdAt || 0).getTime()
      return bDate - aDate
    })
  } catch (error) {
    console.error('[firestore] Error getting saved lists:', error)
    throw error
  }
}

/**
 * Supprimer une liste sauvegardée
 */
export async function deleteSavedListSnapshot(listId) {
  try {
    await deleteDoc(doc(db, 'userLists', listId))
    console.log('[firestore] Deleted saved list:', listId)
  } catch (error) {
    console.error('[firestore] Error deleting saved list:', error)
    throw error
  }
}

/**
 * Charger une liste sauvegardée dans la liste personnelle
 */
export async function loadSavedListSnapshot(userId, listId) {
  try {
    // Récupérer la liste sauvegardée
    const savedListDoc = await getDoc(doc(db, 'userLists', listId))
    if (!savedListDoc.exists()) {
      throw new Error('Liste sauvegardée non trouvée')
    }
    
    const savedListData = savedListDoc.data()
    
    // Récupérer la liste personnelle
    const personalList = await getUserPersonalList(userId)
    
    // Remplacer les produits de la liste personnelle par ceux de la liste sauvegardée
    await updateUserPersonalList(personalList.id, {
      products: savedListData.products.map(p => ({ ...p }))
    })
    
    console.log('[firestore] Loaded saved list into personal list:', listId)
    return personalList
  } catch (error) {
    console.error('[firestore] Error loading saved list:', error)
    throw error
  }
}

// ========================================
// EXPORTS
// ========================================

export default {
  // Produits
  getAllProducts,
  searchProducts,
  getProductById,

  // Prix
  getProductPrices,
  getPricesForProducts,

  // Magasins
  getAllStores,
  getStoresNearby,

  // Listes personnelles
  getUserPersonalList,
  updateUserPersonalList,
  subscribeToUserPersonalList,

  // Listes sauvegardées (snapshots)
  savePersonalListAsSnapshot,
  getSavedListSnapshots,
  deleteSavedListSnapshot,
  loadSavedListSnapshot,

  // Listes partagées
  createSharedList,
  getSharedListByCode,
  getUserSharedLists,
  updateSharedList,
  deleteSharedList,
  subscribeToSharedList,
  subscribeToSharedListByCode,

  // Assignations
  createCourseAssignment,
  getUserAssignments,
  updateAssignmentStatus
}
