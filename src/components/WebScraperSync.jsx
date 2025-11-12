import React, { useState, useEffect } from 'react'
import Card, { CardHeader, CardTitle, CardBody } from './Card'
import Button from './Button'
import Badge from './Badge'
import { syncPricesFromScraper, getAllLastSyncs } from '../services/scraperSync'
import { scrapeIGA, scrapeMetro, scrapeMaxi } from '../services/scrapers/clientScrapers'

export default function WebScraperSync() {
  const [syncingStore, setSyncingStore] = useState(null)
  const [lastSyncs, setLastSyncs] = useState({})
  const [syncStatus, setSyncStatus] = useState(null)

  // Charger les dernières syncs au montage
  useEffect(() => {
    loadLastSyncs()
  }, [])

  async function loadLastSyncs() {
    const syncs = await getAllLastSyncs()
    setLastSyncs(syncs)
  }

  async function handleSync(storeName) {
    setSyncingStore(storeName)
    setSyncStatus(null)

    try {
      let result
      
      if (storeName === 'iga') {
        result = await syncPricesFromScraper('IGA', scrapeIGA)
      } else if (storeName === 'metro') {
        result = await syncPricesFromScraper('Metro', scrapeMetro)
      } else if (storeName === 'maxi') {
        result = await syncPricesFromScraper('Maxi', scrapeMaxi)
      }

      setSyncStatus(result)
      
      // Recharger les dernières syncs
      await loadLastSyncs()

    } catch (error) {
      console.error(`[Sync ${storeName}] Erreur:`, error)
      setSyncStatus({
        success: false,
        error: error.message
      })
    } finally {
      setSyncingStore(null)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>🌐 Synchronisation Web (IGA/Metro/Maxi)</CardTitle>
      </CardHeader>
      <CardBody className="space-y-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-900 mb-2">
            <strong>Nouvelle fonctionnalité!</strong> Récupérez automatiquement les prix des circulaires en ligne.
          </p>
          <p className="text-xs text-blue-700">
            Plus rapide et précis que l'OCR (2-5 secondes vs 30+ minutes). Extraction directe depuis les sites web.
          </p>
        </div>

        {/* IGA */}
        <div className="border rounded-lg p-4 bg-white">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-lg">IGA</span>
              <Badge variant="success">Actif</Badge>
            </div>
            <Button
              variant="primary"
              disabled={syncingStore === 'iga'}
              onClick={() => handleSync('iga')}
            >
              {syncingStore === 'iga' ? '⏳ Synchronisation...' : '🔄 Mettre à jour'}
            </Button>
          </div>
          {lastSyncs.iga && (
            <div className="text-xs text-gray-600 space-y-1">
              <div>Dernière sync: {new Date(lastSyncs.iga.timestamp).toLocaleString('fr-CA')}</div>
              <div>Produits trouvés: {lastSyncs.iga.productsFound}</div>
              <div className="text-green-600">Ajoutés: {lastSyncs.iga.added} | Mis à jour: {lastSyncs.iga.updated}</div>
            </div>
          )}
        </div>

        {/* Metro */}
        <div className="border rounded-lg p-4 bg-gray-50">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-lg">Metro</span>
              <Badge variant="secondary">Bientôt disponible</Badge>
            </div>
            <Button variant="secondary" disabled>
              🔄 Mettre à jour
            </Button>
          </div>
          <p className="text-xs text-gray-500">En développement...</p>
        </div>

        {/* Maxi */}
        <div className="border rounded-lg p-4 bg-gray-50">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-lg">Maxi</span>
              <Badge variant="secondary">Bientôt disponible</Badge>
            </div>
            <Button variant="secondary" disabled>
              🔄 Mettre à jour
            </Button>
          </div>
          <p className="text-xs text-gray-500">En développement...</p>
        </div>

        {/* Sync Status */}
        {syncStatus && (
          <div className={`p-3 rounded-lg border ${
            syncStatus.success 
              ? 'bg-green-50 border-green-200' 
              : 'bg-red-50 border-red-200'
          }`}>
            <p className={`text-sm font-medium ${
              syncStatus.success ? 'text-green-900' : 'text-red-900'
            }`}>
              {syncStatus.success 
                ? `✅ Synchronisation réussie: ${syncStatus.added} ajoutés, ${syncStatus.updated} mis à jour`
                : `❌ Erreur: ${syncStatus.error}`
              }
            </p>
            {syncStatus.apisDiscovered > 0 && (
              <p className="text-xs text-green-700 mt-1">
                {syncStatus.apisDiscovered} APIs découvertes (voir console pour détails)
              </p>
            )}
          </div>
        )}

        <div className="text-xs text-gray-500 pt-2 border-t">
          💡 <strong>Astuce:</strong> La synchronisation extrait les produits en promotion directement depuis les sites.
          Beaucoup plus rapide et précis que l'analyse OCR de circulaires PDF.
        </div>
      </CardBody>
    </Card>
  )
}
