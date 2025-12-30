import { describe, it, expect } from 'vitest'

/**
 * Phase 1.0 Test Script
 * 
 * Tests pour vérifier que les abstractions de persistence et géolocalisation fonctionnent correctement.
 * À exécuter dans le navigateur après npm run dev
 */

/**
 * Test 1: Vérifier que le storage provider fonctionne
 */
export async function testStorageProvider() {
  const { getStorageProvider, initStorageProvider } = await import('../services/storage/index.js')
  
  console.log('✓ [Test 1] Import storage provider réussi')
  
  try {
    await initStorageProvider()
    console.log('✓ [Test 1] Storage provider initialization réussie')
  } catch (e) {
    console.error('✗ [Test 1] Erreur initialization:', e)
    return false
  }

  const provider = getStorageProvider()
  
  // Test setItem/getItem
  try {
    await provider.setItem('test-key', { test: 'value' })
    const value = await provider.getItem('test-key')
    if (value && value.test === 'value') {
      console.log('✓ [Test 1] setItem/getItem fonctionne')
    } else {
      console.error('✗ [Test 1] setItem/getItem valeur incorrecte:', value)
      return false
    }
  } catch (e) {
    console.error('✗ [Test 1] Erreur setItem/getItem:', e)
    return false
  }

  // Test removeItem
  try {
    await provider.removeItem('test-key')
    const value = await provider.getItem('test-key')
    if (value === null || value === undefined) {
      console.log('✓ [Test 1] removeItem fonctionne')
    } else {
      console.error('✗ [Test 1] removeItem non-exécuté')
      return false
    }
  } catch (e) {
    console.error('✗ [Test 1] Erreur removeItem:', e)
    return false
  }

  return true
}

/**
 * Test 2: Vérifier que le geolocation service fonctionne
 */
export async function testGeolocationService() {
  const { getGeolocationService } = await import('../services/geolocation/index.js')
  
  console.log('✓ [Test 2] Import geolocation service réussi')
  
  const service = getGeolocationService()
  
  // Test calculateDistance (sans géolocalisation réelle)
  try {
    // Distance Montréal (45.5, -73.6) à Québec (46.8, -71.2)
    const dist = service.calculateDistance(45.5, -73.6, 46.8, -71.2)
    if (dist > 240 && dist < 250) { // ~246 km
      console.log(`✓ [Test 2] calculateDistance fonctionne (distance: ${dist.toFixed(1)} km)`)
    } else {
      console.error('✗ [Test 2] calculateDistance valeur incorrecte:', dist)
      return false
    }
  } catch (e) {
    console.error('✗ [Test 2] Erreur calculateDistance:', e)
    return false
  }

  return true
}

/**
 * Test 3: Vérifier que db.js fonctionne avec le new storage provider
 */
export async function testDbService() {
  const { getAllProducts, addProduct, deleteProduct } = await import('../services/db.js')
  
  console.log('✓ [Test 3] Import db service réussi')
  
  try {
    // Vérifier que getAllProducts fonctionne
    const initialProducts = await getAllProducts()
    console.log(`✓ [Test 3] getAllProducts fonctionne (${initialProducts.length} produits actuels)`)
  } catch (e) {
    console.error('✗ [Test 3] Erreur getAllProducts:', e)
    return false
  }

  // Test addProduct
  try {
    const newProduct = await addProduct({ 
      nom: '[TEST] Produit test phase 1.0',
      marque: 'Test Brand',
      volume: '500g',
      quantite: 1,
      prix: 9.99
    })
    if (newProduct && newProduct.id) {
      console.log(`✓ [Test 3] addProduct fonctionne (ID: ${newProduct.id})`)
      
      // Nettoyage: supprimer le produit de test
      try {
        await deleteProduct(newProduct.id)
        console.log('✓ [Test 3] Cleanup: deleteProduct fonctionne')
      } catch (e) {
        console.error('⚠ [Test 3] Cleanup failed:', e)
      }
    } else {
      console.error('✗ [Test 3] addProduct résultat invalide:', newProduct)
      return false
    }
  } catch (e) {
    console.error('✗ [Test 3] Erreur addProduct:', e)
    return false
  }

  return true
}

// Skip legacy manual tests when running Vitest automation
describe.skip('phase1.0 legacy manual suite', () => {
  it('placeholder', () => {
    expect(true).toBe(true)
  })
})

/**
 * Test 4: Vérifier que les imports OCR sont supprimés
 */
export async function testOCRRemoved() {
  console.log('✓ [Test 4] Vérification que les imports OCR sont supprimés...')
  
  try {
    // Vérifier que ocrService n'existe plus ou génère une erreur
    try {
      await import('../services/ocrService.js')
      console.error('✗ [Test 4] ocrService.js existe toujours!')
      return false
    } catch (e) {
      if (e.code === 'ERR_MODULE_NOT_FOUND' || e.message.includes('404')) {
        console.log('✓ [Test 4] ocrService.js correctement supprimé')
      }
    }
    
    // Vérifier que UploadFlyerModal n'existe plus
    try {
      await import('../components/UploadFlyerModal.jsx')
      console.error('✗ [Test 4] UploadFlyerModal.jsx existe toujours!')
      return false
    } catch (e) {
      if (e.code === 'ERR_MODULE_NOT_FOUND' || e.message.includes('404')) {
        console.log('✓ [Test 4] UploadFlyerModal.jsx correctement supprimé')
      }
    }
    
    // Vérifier que tesseract.js n'est plus dans package.json
    const packageJson = await fetch('/package.json').then(r => r.json())
    if (!packageJson.dependencies['tesseract.js'] && !packageJson.dependencies['pdfjs-dist']) {
      console.log('✓ [Test 4] tesseract.js et pdfjs-dist supprimés de package.json')
    } else {
      console.error('✗ [Test 4] Les dépendances OCR existent toujours!')
      return false
    }
    
    return true
  } catch (e) {
    console.error('✗ [Test 4] Erreur lors de la vérification:', e)
    return false
  }
}

/**
 * Exécuter tous les tests
 */
export async function runAllTests() {
  console.log('🚀 Démarrage des tests Phase 1.0...\n')
  
  const results = {
    storageProvider: await testStorageProvider(),
    geolocationService: await testGeolocationService(),
    dbService: await testDbService(),
    ocrRemoved: await testOCRRemoved()
  }
  
  console.log('\n📊 Résumé des tests:')
  console.log(`  Storage Provider: ${results.storageProvider ? '✓' : '✗'}`)
  console.log(`  Geolocation Service: ${results.geolocationService ? '✓' : '✗'}`)
  console.log(`  DB Service: ${results.dbService ? '✓' : '✗'}`)
  console.log(`  OCR Removed: ${results.ocrRemoved ? '✓' : '✗'}`)
  
  const allPassed = Object.values(results).every(r => r === true)
  console.log(`\n${allPassed ? '✅ TOUS LES TESTS RÉUSSIS!' : '❌ CERTAINS TESTS ONT ÉCHOUÉ'}`)
  
  return allPassed
}

// Auto-run si importé directement
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllTests().then(success => process.exit(success ? 0 : 1))
}
