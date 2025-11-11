import React, { useState, useRef, useEffect } from 'react'
import useAppStore from '../store/useAppStore'
import { getAllProducts } from '../services/db'
import Button from '../components/Button'
import { requestUserLocation, listNearbyStores, setRadiusKm, getRadiusKm, setLocationFromPostal } from '../services/geolocation'
import { refreshWeeklyPrices, getWeeklyPricesMeta, getPriceDataUrl } from '../services/weeklyPrices'
import { fetchPriceStatus, getCachedPriceStatus } from '../services/priceMeta'
import Input from '../components/Input'
import Card, { CardHeader, CardTitle, CardBody } from '../components/Card'
import Badge from '../components/Badge'
import UploadFlyerModal from '../components/UploadFlyerModal'
import { canShowOcrUpload } from '../domain/adminUpload'
import { listSubmissions as listOcrSubmissions, removeSubmission as removeOcrSubmission } from '../services/ocrKV'

export default function Parametres(){
  const settings = useAppStore(s => s.settings)
  const setSettings = useAppStore(s => s.setSettings)
  const products = useAppStore(s => s.products)
  const addProduct = useAppStore(s => s.addProduct)
  const loadProducts = useAppStore(s => s.loadProducts)
  
  const [maxStores, setMaxStores] = useState(settings.maxStoresToCombine)
  const [searchRadius, setSearchRadius] = useState(settings.searchRadiusKm || 5)
  const [favoriteStores, setFavoriteStores] = useState((settings.favoriteStores || []).join(', '))
  const [ocrPriceMode, setOcrPriceMode] = useState(settings.ocrPriceReplaceMode || 'better')
  // Scoring weights UI state (fallback to defaults from scoring when absent)
  const [weights, setWeights] = useState(() => ({
    price: settings.scoringWeights?.price ?? 0.6,
    distance: settings.scoringWeights?.distance ?? 0.25,
    nbStores: settings.scoringWeights?.nbStores ?? 0.1,
    favoritesBoost: settings.scoringWeights?.favoritesBoost ?? 0.05,
    coveragePenalty: settings.scoringWeights?.coveragePenalty ?? 0.2
  }))
  const [saved, setSaved] = useState(false)
  const fileInputRef = useRef(null)
  const [geoStatus, setGeoStatus] = useState('idle')
  const [postalCode, setPostalCode] = useState('')
  const [postalStatus, setPostalStatus] = useState('')
  const [nearbyStores, setNearbyStores] = useState([])
  const [weeklyMeta, setWeeklyMeta] = useState(null)
  const [priceStatus, setPriceStatus] = useState(null)
  const [loadingWeekly, setLoadingWeekly] = useState(false)
  const [loadingStatus, setLoadingStatus] = useState(false)
  const [priceDataUrl, setPriceDataUrl] = useState('')
  const [showUploadModal, setShowUploadModal] = useState(false)
  const canUploadOcr = canShowOcrUpload()
  const [ocrSubs, setOcrSubs] = useState([])
  const [loadingSubs, setLoadingSubs] = useState(false)

  useEffect(() => {
    // Load stored radius override
    getRadiusKm().then(r => { if(!settings.searchRadiusKm) setSearchRadius(r) })
    ;(async () => {
      const meta = await getWeeklyPricesMeta()
      setWeeklyMeta(meta)
  const statusCached = await getCachedPriceStatus()
  setPriceStatus(statusCached)
      // Fire async refresh (non-blocking)
  fetchPriceStatus().then(p => setPriceStatus(p)).catch(()=>{})
      const stores = await listNearbyStores()
      setNearbyStores(stores)
      setPriceDataUrl(getPriceDataUrl())
    })()
  }, [])

  // Load local OCR submissions (debug UI)
  async function loadOcrSubs(){
    try{
      setLoadingSubs(true)
      const list = await listOcrSubmissions()
      setOcrSubs(Array.isArray(list) ? list.slice().reverse() : [])
    }finally{
      setLoadingSubs(false)
    }
  }

  useEffect(() => {
    loadOcrSubs().catch(()=>{})
  }, [])

  function save(){
    const stores = favoriteStores.split(',').map(s => s.trim()).filter(Boolean)
    setSettings({ 
      maxStoresToCombine: Number(maxStores),
      searchRadiusKm: Number(searchRadius),
      favoriteStores: stores,
      ocrPriceReplaceMode: ocrPriceMode,
      scoringWeights: {
        price: Number(weights.price),
        distance: Number(weights.distance),
        nbStores: Number(weights.nbStores),
        favoritesBoost: Number(weights.favoritesBoost),
        coveragePenalty: Number(weights.coveragePenalty)
      }
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

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Logique de remplacement des prix OCR
              </label>
              <select
                value={ocrPriceMode}
                onChange={e => setOcrPriceMode(e.target.value)}
                className="w-full max-w-xs border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="always">Toujours remplacer</option>
                <option value="better">Remplacer si meilleur prix</option>
                <option value="never">Ne jamais remplacer</option>
              </select>
              <p className="text-xs text-gray-500">
                Choisissez comment les prix OCR modifient vos produits existants
              </p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <Button onClick={save} variant="primary">
                Enregistrer
              </Button>
              {saved && <Badge variant="success">✓ Sauvegardé</Badge>}
            </div>
          </CardBody>
        </Card>

        {/* Scoring Weights */}
        <Card>
          <CardHeader>
            <CardTitle>Pondération du score (prix vs distance)</CardTitle>
          </CardHeader>
          <CardBody className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Importance du prix</label>
                <input type="range" min={0} max={1} step={0.01} value={weights.price}
                  onChange={e=>setWeights(w=>({...w, price: Number(e.target.value)}))} className="w-full" />
                <div className="text-xs text-gray-600">{weights.price.toFixed(2)}</div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Importance de la distance</label>
                <input type="range" min={0} max={1} step={0.01} value={weights.distance}
                  onChange={e=>setWeights(w=>({...w, distance: Number(e.target.value)}))} className="w-full" />
                <div className="text-xs text-gray-600">{weights.distance.toFixed(2)}</div>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Pénalité nb de magasins</label>
                <input type="number" min={0} max={1} step={0.01} value={weights.nbStores}
                  onChange={e=>setWeights(w=>({...w, nbStores: Number(e.target.value)}))}
                  className="w-full max-w-[120px] border border-gray-300 rounded-lg px-2 py-1" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Bonus favoris (plus haut = mieux)</label>
                <input type="number" min={0} max={0.5} step={0.01} value={weights.favoritesBoost}
                  onChange={e=>setWeights(w=>({...w, favoritesBoost: Number(e.target.value)}))}
                  className="w-full max-w-[120px] border border-gray-300 rounded-lg px-2 py-1" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Pénalité couverture (0..1)</label>
                <input type="number" min={0} max={1} step={0.01} value={weights.coveragePenalty}
                  onChange={e=>setWeights(w=>({...w, coveragePenalty: Number(e.target.value)}))}
                  className="w-full max-w-[120px] border border-gray-300 rounded-lg px-2 py-1" />
              </div>
            </div>
            <p className="text-xs text-gray-500">Astuce: si la localisation est désactivée, la distance est automatiquement ignorée dans l'analyse.</p>
            <div className="flex items-center gap-3 pt-2">
              <Button onClick={save} variant="primary">Enregistrer</Button>
              {saved && <Badge variant="success">✓ Sauvegardé</Badge>}
            </div>
          </CardBody>
        </Card>

  {/* Geolocalisation + Postal Fallback */}
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
            <div className="flex gap-3 items-center mt-2">
              <input
                type="text"
                value={postalCode}
                onChange={e => setPostalCode(e.target.value)}
                placeholder="Code postal (ex: H1A)"
                className="border border-gray-300 rounded-lg px-3 py-2 max-w-[120px]"
                disabled={geoStatus === 'demande...'}
              />
              <Button
                variant="secondary"
                disabled={!postalCode || geoStatus === 'demande...'}
                onClick={async () => {
                  setPostalStatus('Recherche...')
                  try {
                    const coords = await setLocationFromPostal(postalCode)
                    if(coords){
                      setPostalStatus('Position définie')
                      const stores = await listNearbyStores()
                      setNearbyStores(stores)
                    } else {
                      setPostalStatus('Code postal inconnu')
                    }
                  } catch(e){
                    setPostalStatus('Erreur: ' + e.message)
                  }
                }}
              >📍 Utiliser code postal</Button>
              <div className="text-xs text-gray-500">{postalStatus}</div>
            </div>
            <div>
              <h4 className="font-medium mb-2">Magasins dans {searchRadius} km</h4>
              {nearbyStores.length === 0 && (
                <div className="text-sm text-gray-500">Aucun magasin trouvé (autorise la géolocalisation ou entre un code postal).</div>
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
                disabled={loadingWeekly}
                onClick={async () => {
                  setLoadingWeekly(true)
                  try {
                    await refreshWeeklyPrices({ force: true })
                    const meta = await getWeeklyPricesMeta()
                    setWeeklyMeta(meta)
                  } catch(e) {
                    console.error('Erreur refresh:', e)
                  } finally {
                    setLoadingWeekly(false)
                  }
                }}
              >{loadingWeekly ? '⏳ Chargement...' : '🔁 Forcer la mise à jour'}</Button>
            </div>
            <div className="text-xs text-gray-500">Items chargés: {weeklyMeta?.items?.length || 0}</div>
            <p className="text-xs text-gray-500">Pour utiliser une source réelle, déploie un JSON à l'URL configurée VITE_PRICE_DATA_URL (ex: sur GitHub raw ou petite API).</p>
            <div className="text-xs text-gray-600 bg-gray-50 border rounded p-2">
              <div><span className="font-medium">Source active:</span> <a className="text-blue-600 underline" href={priceDataUrl} target="_blank" rel="noreferrer">{priceDataUrl || 'non définie'}</a></div>
              <div className="mt-2 flex gap-2">
                <Button variant="secondary" onClick={async ()=>{
                  try{
                    const r = await fetch(priceDataUrl, { cache: 'no-cache' })
                    const j = await r.json()
                    const n = Array.isArray(j) ? j.length : (j.items?.length || 0)
                    alert(`Test OK: ${n} items depuis\n${priceDataUrl}`)
                  }catch(e){
                    alert('Echec du test: ' + (e?.message || e))
                  }
                }}>🧪 Tester la source</Button>
                {canUploadOcr ? (
                  <Button variant="primary" onClick={() => setShowUploadModal(true)}>📄 Contribuer une circulaire (OCR)</Button>
                ) : (
                  <span className="text-xs text-gray-500">Upload OCR réservé à l'administrateur (désactivé pour les utilisateurs).</span>
                )}
              </div>
              <div className="mt-2 text-[11px] text-gray-500">Déduplication automatique par magasin et période de validité. Les contributions sont stockées localement pour l'instant.</div>
            </div>
            <div className="pt-4 border-t">
              <h4 className="font-medium mb-2">Statut agrégation distante</h4>
              {!priceStatus?.meta && <div className="text-xs text-gray-500">Chargement du statut...</div>}
              {priceStatus?.meta && (
                <div className="space-y-2 text-xs text-gray-700">
                  <div className="space-y-1">
                    <div>Généré: {new Date(priceStatus.meta.generatedAt).toLocaleString()}</div>
                    <div>Total sources: {priceStatus.meta.totalSources}</div>
                    <div>Total items (après dédup): {priceStatus.meta.totalItems}</div>
                    {priceStatus.meta.errors && priceStatus.meta.errors.length > 0 && (
                      <div className="text-red-600">Erreurs: {priceStatus.meta.errors.length}</div>
                    )}
                  </div>
                  {priceStatus.resolved && (
                    <div className="bg-gray-50 border rounded p-2 space-y-1">
                      <div className="font-medium">Détails source distante:</div>
                      {priceStatus.resolved.metaUrl && (
                        <div>Meta URL: <a className="underline text-blue-600" href={priceStatus.resolved.metaUrl} target="_blank" rel="noreferrer">{priceStatus.resolved.metaUrl}</a></div>
                      )}
                      {priceStatus.resolved.dataUrl && (
                        <div>Data URL fallback: <a className="underline text-blue-600" href={priceStatus.resolved.dataUrl} target="_blank" rel="noreferrer">{priceStatus.resolved.dataUrl}</a></div>
                      )}
                      {priceStatus.resolved.repo && (
                        <div>Repo: {priceStatus.resolved.repo} / {priceStatus.resolved.branch} / {priceStatus.resolved.metaPath}</div>
                      )}
                    </div>
                  )}
                  <Button
                    variant="secondary"
                    disabled={loadingStatus}
                    onClick={async () => {
                      setLoadingStatus(true)
                      try {
                        const s = await fetchPriceStatus({ force: true })
                        setPriceStatus(s)
                      } catch(e) {
                        console.error('Erreur status:', e)
                      } finally {
                        setLoadingStatus(false)
                      }
                    }}
                  >{loadingStatus ? '⏳ Chargement...' : '🔁 Rafraîchir statut'}</Button>
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

        {/* OCR debug submissions list (separate card) */}
        <Card>
          <CardHeader>
            <CardTitle>Contributions OCR (local) — Debug</CardTitle>
          </CardHeader>
            <CardBody>
              <div className="flex items-center gap-2 mb-3">
                <Button variant="secondary" onClick={loadOcrSubs} disabled={loadingSubs}>
                  {loadingSubs ? 'Chargement…' : 'Rafraîchir'}
                </Button>
                <span className="text-xs text-gray-500">{ocrSubs?.length || 0} soumission(s)</span>
              </div>
              {(!ocrSubs || ocrSubs.length === 0) ? (
                <div className="text-sm text-gray-500">Aucune soumission locale pour l’instant.</div>
              ) : (
                <div className="max-h-64 overflow-auto border rounded">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 text-gray-600">
                      <tr>
                        <th className="text-left p-2">Magasin</th>
                        <th className="text-left p-2">Période</th>
                        <th className="text-left p-2">Produits</th>
                        <th className="text-left p-2">Créé</th>
                        <th className="p-2">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ocrSubs.map((s) => (
                        <tr key={s.id} className="border-t">
                          <td className="p-2">{s.store || '—'}</td>
                          <td className="p-2">{s.period?.from || '—'} → {s.period?.to || '—'}</td>
                          <td className="p-2">{Array.isArray(s.products) ? s.products.length : 0}</td>
                          <td className="p-2">{s.createdAt ? new Date(s.createdAt).toLocaleString() : '—'}</td>
                          <td className="p-2 text-right">
                            <Button
                              variant="danger"
                              onClick={async () => {
                                try{
                                  await removeOcrSubmission(s.id)
                                  await loadOcrSubs()
                                }catch(e){ /* ignore */ }
                              }}
                            >Supprimer</Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              <div className="text-[11px] text-gray-500 mt-2">
                Ces données sont stockées localement (navigateur) et utilisées pour enrichir la base des prix hebdomadaires.
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
      {showUploadModal && (
        <UploadFlyerModal
          isOpen={showUploadModal}
          onClose={() => setShowUploadModal(false)}
          onSuccess={() => {
            setShowUploadModal(false)
            loadOcrSubs().catch(()=>{})
          }}
        />
      )}
    </div>
  )
}
