/**
 * Script de test pour le scraper IGA
 * Usage: node scripts/test-iga-scraper.js
 */

import { scrapeIGA } from '../src/services/scrapers/igaScraper.js'

console.log('🚀 Démarrage du test du scraper IGA...\n')

async function main() {
  try {
    const result = await scrapeIGA({
      headless: false // Mettre true pour mode invisible
    })

    console.log('\n✅ Résultat du scraping:')
    console.log('─────────────────────────────────────')
    console.log(`Succès: ${result.success}`)
    console.log(`Produits trouvés: ${result.totalFound}`)
    console.log(`APIs découvertes: ${result.apisDiscovered?.length || 0}`)
    console.log(`Méthode: ${result.method}`)
    console.log(`Timestamp: ${result.timestamp}`)

    if (result.products && result.products.length > 0) {
      console.log('\n📦 Premiers produits:')
      result.products.slice(0, 5).forEach((p, i) => {
        console.log(`\n${i + 1}. ${p.name}`)
        console.log(`   Prix: ${p.price.toFixed(2)} $`)
        if (p.volume) console.log(`   Volume: ${p.volume}`)
      })
    }

    if (result.apisDiscovered && result.apisDiscovered.length > 0) {
      console.log('\n🎯 APIs découvertes:')
      result.apisDiscovered.forEach((api, i) => {
        console.log(`\n${i + 1}. ${api.method} ${api.url}`)
      })
      console.log('\n💡 Voir iga-apis-discovered.json pour plus de détails')
    }

    if (!result.success) {
      console.log('\n⚠️ Erreur:', result.error)
      console.log('\n📝 Fichiers générés pour analyse:')
      console.log('   - iga-page-dump.html (structure HTML de la page)')
      console.log('   - iga-apis-discovered.json (APIs interceptées)')
    }

  } catch (error) {
    console.error('\n❌ Erreur fatale:', error)
    process.exit(1)
  }
}

main()
