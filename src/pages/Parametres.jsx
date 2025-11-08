import React, { useState, useRef, useEffect } from 'react'
import useAppStore from '../store/useAppStore'
import { getAllProducts } from '../services/db'
import Button from '../components/Button'
import { requestUserLocation, listNearbyStores, setRadiusKm, getRadiusKm } from '../services/geolocation'
import { refreshWeeklyPrices, getWeeklyPricesMeta } from '../services/weeklyPrices'
import { fetchPriceStatus, getCachedPriceStatus } from '../services/priceMeta'
import Input from '../components/Input'
import Card, { CardHeader, CardTitle, CardBody } from '../components/Card'
import Badge from '../components/Badge'

export default function Parametres(){
  const settings = useAppStore(s => s.settings)
  const setSettings = useAppStore(s => s.setSettings)
  const products = useAppStore(s => s.products)
  const addProduct = useAppStore(s => s.addProduct)
  const loadProducts = useAppStore(s => s.loadProducts)
  
  const [maxStores, setMaxStores] = useState(settings.maxStoresToCombine)
  const [searchRadius, setSearchRadius] = useState(settings.searchRadiusKm || 5)
  const [favoriteStores, setFavoriteStores] = useState((settings.favoriteStores || []).join(', '))
  const [saved, setSaved] = useState(false)
  const fileInputRef = useRef(null)
  const [geoStatus, setGeoStatus] = useState('idle')
  const [nearbyStores, setNearbyStores] = useState([])
  const [weeklyMeta, setWeeklyMeta] = useState(null)
  const [priceStatus, setPriceStatus] = useState(null)

  useEffect(() => {
    // Load stored radius override
    getRadiusKm().then(r => { if(!settings.searchRadiusKm) setSearchRadius(r) })
    ;(async () => {
      const meta = await getWeeklyPricesMeta()
      setWeeklyMeta(meta)
      const statusCached = await getCachedPriceStatus()
      setPriceStatus(statusCached.meta)
      // Fire async refresh (non-blocking)
      fetchPriceStatus().then(p => setPriceStatus(p.meta)).catch(()=>{})
      const stores = await listNearbyStores()
      setNearbyStores(stores)
    })()
  }, [])

  function save(){
    const stores = favoriteStores.split(',').map(s => s.trim()).filter(Boolean)
    setSettings({ 
      maxStoresToCombine: Number(maxStores),
      searchRadiusKm: Number(searchRadius),
      favoriteStores: stores
    })
    setRadiusKm(Number(searchRadius)).catch(()=>{})
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  async function exportData(){
    const allProducts = await getAllProducts()
    const data = {
      version: '1.0',
      exportDate: new Date().toISOString(),
      products: allProducts,
      settings: settings
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `panier-intelligent-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  async function importData(event){
    const file = event.target.files?.[0]
    if(!file) return

    try {
      const text = await file.text()
      const data = JSON.parse(text)
      
      if(!data.products || !Array.isArray(data.products)){
        alert('Format de fichier invalide')
        return
      }

      if(!confirm(`Importer ${data.products.length} produit(s) ? Cela ajoutera les produits à ta liste existante.`)){
        return
      }

      // Import products
      for(const p of data.products){
        await addProduct(p)
      }

      // Import settings if available
      if(data.settings){
        setSettings(data.settings)
        setMaxStores(data.settings.maxStoresToCombine || 3)
        setSearchRadius(data.settings.searchRadiusKm || 5)
        setFavoriteStores((data.settings.favoriteStores || []).join(', '))
      }

      await loadProducts()
      alert(`${data.products.length} produit(s) importé(s) avec succès !`)
    } catch(err) {
      console.error(err)
      alert('Erreur lors de l\'import: ' + err.message)
    }

    // Reset input
    if(fileInputRef.current) fileInputRef.current.value = ''
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 animate-fade-in">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Paramètres</h2>
        <p className="text-sm text-gray-600 mt-1">Configure ton expérience d'achat</p>
      </div>

      <div className="space-y-6">
        {/* General Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Paramètres généraux</CardTitle>
          </CardHeader>
          <CardBody className="space-y-4">
            <Input
              label="Nombre max de magasins à combiner"
              type="number"
              min={1}
              max={5}
              value={maxStores}
              onChange={e => setMaxStores(e.target.value)}
              containerClassName="max-w-xs"
            />
            <p className="text-xs text-gray-500 -mt-2">
              Limite le nombre de magasins dans l'optimisation
            </p>

            <Input
              label="Rayon de recherche (km)"
              type="number"
              min={1}
              max={50}
              value={searchRadius}
              onChange={e => setSearchRadius(e.target.value)}
              containerClassName="max-w-xs"
            />
            <p className="text-xs text-gray-500 -mt-2">
              Distance maximale pour chercher des magasins
            </p>

            <Input
              label="Magasins favoris (séparés par des virgules)"
              type="text"
              value={favoriteStores}
              onChange={e => setFavoriteStores(e.target.value)}
              placeholder="IGA, Maxi, Metro..."
            />
            <p className="text-xs text-gray-500 -mt-2">
              Ces magasins seront priorisés dans les suggestions
            </p>

            <div className="flex items-center gap-3 pt-2">
              <Button onClick={save} variant="primary">
                Enregistrer
              </Button>
              {saved && <Badge variant="success">✓ Sauvegardé</Badge>}
            </div>
          </CardBody>
        </Card>

        {/* Geolocalisation */}
        <Card>
          <CardHeader>
            <CardTitle>Localisation & Magasins proches</CardTitle>
          </CardHeader>
          <CardBody className="space-y-4">
            <div className="flex gap-3 flex-wrap items-center">
              <Button
                onClick={async () => {
                  setGeoStatus('demande...')
                  try {
                    await requestUserLocation()
                    setGeoStatus('ok')
                    const stores = await listNearbyStores()
                    setNearbyStores(stores)
                  } catch(e){
                    setGeoStatus('erreur: ' + e.message)
                  }
                }}
                variant="secondary"
              >🔍 Actualiser ma position</Button>
              <div className="text-xs text-gray-500">Statut: {geoStatus}</div>
            </div>
            <div>
              <h4 className="font-medium mb-2">Magasins dans {searchRadius} km</h4>
              {nearbyStores.length === 0 && (
                <div className="text-sm text-gray-500">Aucun magasin trouvé (autorise la géolocalisation).</div>
              )}
              <ul className="space-y-1">
                {nearbyStores.map(s => (
                  <li key={s.id} className="text-sm flex justify-between border rounded px-2 py-1 bg-gray-50">
                    <span>{s.name}</span>
                    <span className="text-gray-600">{s.distanceKm.toFixed(1)} km</span>
                  </li>
                ))}
              </ul>
            </div>
          </CardBody>
        </Card>

        {/* Weekly Prices */}
        <Card>
          <CardHeader>
            <CardTitle>Base de prix hebdomadaire</CardTitle>
          </CardHeader>
          <CardBody className="space-y-4">
            <p className="text-sm text-gray-600">Données locales mises à jour une fois par semaine à partir de votre fichier ou source distante.</p>
            <div className="flex items-center gap-3 text-sm">
              <span>Dernière mise à jour: {weeklyMeta?.lastFetched ? new Date(weeklyMeta.lastFetched).toLocaleDateString() : 'jamais'}</span>
              <Button
                variant="secondary"
                onClick={async () => {
                  await refreshWeeklyPrices({ force: true })
                  const meta = await getWeeklyPricesMeta()
                  setWeeklyMeta(meta)
                }}
              >🔁 Forcer la mise à jour</Button>
            </div>
            <div className="text-xs text-gray-500">Items chargés: {weeklyMeta?.items?.length || 0}</div>
            <p className="text-xs text-gray-500">Pour utiliser une source réelle, déploie un JSON à l'URL configurée VITE_PRICE_DATA_URL (ex: sur GitHub raw ou petite API).</p>
            <div className="pt-4 border-t">
              <h4 className="font-medium mb-2">Statut agrégation distante</h4>
              {!priceStatus && <div className="text-xs text-gray-500">Chargement du statut...</div>}
              {priceStatus && (
                <div className="space-y-1 text-xs text-gray-700">
                  <div>Généré: {new Date(priceStatus.generatedAt).toLocaleString()}</div>
                  <div>Total sources: {priceStatus.totalSources}</div>
                  <div>Total items (après dédup): {priceStatus.totalItems}</div>
                  {priceStatus.errors && priceStatus.errors.length > 0 && (
                    <div className="text-red-600">Erreurs: {priceStatus.errors.length}</div>
                  )}
                  <Button
                    variant="secondary"
                    onClick={async () => {
                      const s = await fetchPriceStatus({ force: true })
                      setPriceStatus(s.meta)
                    }}
                  >🔁 Rafraîchir statut</Button>
                </div>
              )}
            </div>
          </CardBody>
        </Card>

        {/* Import/Export */}
        <Card>
          <CardHeader>
            <CardTitle>Import / Export</CardTitle>
          </CardHeader>
          <CardBody className="space-y-6">
            <div>
              <h4 className="font-medium mb-2">Exporter mes données</h4>
              <p className="text-sm text-gray-600 mb-3">
                Télécharge toutes tes listes et paramètres en JSON
              </p>
              <Button onClick={exportData} variant="success">
                📥 Exporter
              </Button>
            </div>

            <div className="border-t pt-6">
              <h4 className="font-medium mb-2">Importer des données</h4>
              <p className="text-sm text-gray-600 mb-3">
                Importe un fichier JSON exporté précédemment
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={importData}
                className="hidden"
              />
              <Button onClick={() => fileInputRef.current?.click()} variant="primary">
                📤 Importer
              </Button>
            </div>
          </CardBody>
        </Card>

        {/* Stats */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Statistiques</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-3xl font-bold text-blue-600">{products.length}</div>
              <div className="text-sm text-gray-600 mt-1">Produits totaux</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-3xl font-bold text-green-600">
                {products.filter(p => p.recurrent).length}
              </div>
              <div className="text-sm text-gray-600 mt-1">Récurrents</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-3xl font-bold text-purple-600">
                {products.filter(p => p.purchased).length}
              </div>
              <div className="text-sm text-gray-600 mt-1">Achetés</div>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <div className="text-3xl font-bold text-orange-600">
                ${products.reduce((sum, p) => sum + (p.prix || 0), 0).toFixed(2)}
              </div>
              <div className="text-sm text-gray-600 mt-1">Total estimé</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
