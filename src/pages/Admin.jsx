import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Card, { CardHeader, CardTitle, CardBody } from '../components/Card'
import Button from '../components/Button'
import Input from '../components/Input'
import Badge from '../components/Badge'
import { ingestOcrProducts, getPriceStats } from '../services/weeklyPrices'

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001'

export default function Admin() {
  const navigate = useNavigate()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [password, setPassword] = useState('')
  const [loginError, setLoginError] = useState('')
  const [loading, setLoading] = useState(false)

  // Scraping state
  const [scrapingStore, setScrapingStore] = useState(null)
  const [scrapedProducts, setScrapedProducts] = useState([])
  const [validatedProducts, setValidatedProducts] = useState([])
  const [publishStatus, setPublishStatus] = useState(null)
  const [lastScrapeStore, setLastScrapeStore] = useState(null)
  const [dbStats, setDbStats] = useState(null)

  // Vérifier si déjà authentifié
  useEffect(() => {
    console.log('[Admin] mount, pathname should be /admin')
    const token = localStorage.getItem('adminToken')
    if (token) {
      verifyToken(token)
    }
  }, [])

  // Charger les stats de la base de données
  useEffect(() => {
    if (isAuthenticated) {
      loadDbStats()
    }
  }, [isAuthenticated, publishStatus])

  async function loadDbStats() {
    try {
      const stats = await getPriceStats()
      setDbStats(stats)
    } catch (error) {
      console.error('Erreur chargement stats:', error)
    }
  }

  async function verifyToken(token) {
    try {
      const response = await fetch(`${BACKEND_URL}/api/admin/verify`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        setIsAuthenticated(true)
      } else {
        localStorage.removeItem('adminToken')
      }
    } catch (error) {
      console.error('Erreur vérification token:', error)
      localStorage.removeItem('adminToken')
    }
  }

  async function handleLogin(e) {
    e.preventDefault()
    setLoginError('')
    setLoading(true)

    try {
      const response = await fetch(`${BACKEND_URL}/api/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      })

      const data = await response.json()

      if (response.ok) {
        localStorage.setItem('adminToken', data.token)
        setIsAuthenticated(true)
        setPassword('')
      } else {
        setLoginError(data.error || 'Erreur de connexion')
      }
    } catch (error) {
      setLoginError('Erreur de connexion au serveur')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  function handleLogout() {
    localStorage.removeItem('adminToken')
    setIsAuthenticated(false)
    setScrapedProducts([])
    setValidatedProducts([])
  }

  async function handleScrape(storeName) {
    setScrapingStore(storeName)
    setLastScrapeStore(storeName)
    setScrapedProducts([])
    setValidatedProducts([])

    try {
      const token = localStorage.getItem('adminToken')
      const response = await fetch(`${BACKEND_URL}/api/admin/scrape/${storeName}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ options: { headless: true } })
      })

      const data = await response.json()

      if (response.ok && data.success) {
        const productsWithValidation = data.products.map((p, idx) => ({
          ...p,
          id: idx,
          validated: false,
          edited: false
        }))
        setScrapedProducts(productsWithValidation)
        
        // Afficher un message si aucun produit n'a été trouvé
        if (productsWithValidation.length === 0) {
          alert(`Scraping terminé mais 0 produits détectés.\n\nLe site ${storeName.toUpperCase()} a peut-être changé sa structure HTML ou nécessite une sélection de magasin.\n\nVérifiez les logs du backend pour plus de détails.`)
        } else {
          alert(`✅ ${productsWithValidation.length} produits détectés!`)
        }
      } else {
        alert(`Erreur: ${data.error || 'Échec du scraping'}`)
      }
    } catch (error) {
      alert('Erreur de connexion au serveur')
      console.error(error)
    } finally {
      setScrapingStore(null)
    }
  }

  function toggleValidation(productId) {
    setScrapedProducts(prev =>
      prev.map(p =>
        p.id === productId ? { ...p, validated: !p.validated } : p
      )
    )
  }

  function updateProduct(productId, field, value) {
    setScrapedProducts(prev =>
      prev.map(p =>
        p.id === productId
          ? { ...p, [field]: value, edited: true }
          : p
      )
    )
  }

  function deleteProduct(productId) {
    setScrapedProducts(prev => prev.filter(p => p.id !== productId))
  }

  async function handlePublish() {
    const toPublish = scrapedProducts.filter(p => p.validated)

    if (toPublish.length === 0) {
      alert('Aucun produit validé à publier')
      return
    }

    if (!confirm(`Publier ${toPublish.length} produits pour les utilisateurs?`)) {
      return
    }

    setLoading(true)

    try {
      const token = localStorage.getItem('adminToken')
      const response = await fetch(`${BACKEND_URL}/api/admin/publish`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ products: toPublish })
      })

      const data = await response.json()

      if (response.ok) {
        // Après publication côté serveur, synchroniser la base locale (IndexedDB)
        const todayIso = new Date().toISOString().split('T')[0]
        const nextWeekIso = new Date(Date.now() + 7*24*60*60*1000).toISOString().split('T')[0]
        const store = (lastScrapeStore || 'TEST').toString()

        const productsForDB = toPublish.map(p => ({
          name: p.name,
          brand: p.brand || '',
          price: Number(p.price),
          volume: p.volume || '',
          image: p.image || '',
          description: p.description || '',
          category: p.category || '',
          validFrom: p.validFrom || todayIso,
          validTo: p.validTo || nextWeekIso,
          source: 'admin-publish',
          scrapedAt: p.scrapedAt || new Date().toISOString()
        }))

        const ingestion = await ingestOcrProducts({
          products: productsForDB,
          store,
          period: { from: todayIso, to: nextWeekIso },
          ocrConfidence: 1.0
        })

        setPublishStatus({
          success: true,
          count: data.published,
          timestamp: data.timestamp,
          added: ingestion.added,
          updated: ingestion.updated
        })
        setScrapedProducts([])
        setValidatedProducts(toPublish)
        // Optionnel: notifier l'utilisateur du résultat d'ingestion local
        console.log(`Ingestion locale: +${ingestion.added} / ⟳${ingestion.updated}`)
      } else {
        setPublishStatus({
          success: false,
          error: data.error
        })
      }
    } catch (error) {
      setPublishStatus({
        success: false,
        error: 'Erreur de connexion'
      })
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  // Login Screen
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center text-2xl">🔐 Admin Login</CardTitle>
          </CardHeader>
          <CardBody>
            <form onSubmit={handleLogin} className="space-y-4">
              <Input
                type="password"
                placeholder="Mot de passe admin"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                error={loginError}
                disabled={loading}
              />
              <Button
                type="submit"
                variant="primary"
                className="w-full"
                disabled={loading || !password}
              >
                {loading ? 'Connexion...' : 'Se connecter'}
              </Button>
            </form>
            <p className="text-xs text-gray-500 mt-4 text-center">
              Cette page est réservée aux administrateurs uniquement.
            </p>
          </CardBody>
        </Card>
      </div>
    )
  }

  // Admin Dashboard
  return (
    <div className="min-h-screen bg-gray-50 p-4 pb-20">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">🛠️ Admin Dashboard</h1>
            <p className="text-sm text-gray-600">Gestion des prix et scraping</p>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => navigate('/')}>
              Retour à l'app
            </Button>
            <Button variant="secondary" onClick={handleLogout}>
              Déconnexion
            </Button>
          </div>
        </div>

        {/* Database Statistics */}
        {dbStats && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>📊 Base de données IndexedDB</CardTitle>
            </CardHeader>
            <CardBody>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-blue-900">{dbStats.total}</div>
                  <div className="text-sm text-blue-700">Total produits</div>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-green-900">{dbStats.active}</div>
                  <div className="text-sm text-green-700">Prix actifs</div>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-gray-900">{dbStats.expired}</div>
                  <div className="text-sm text-gray-700">Expirés</div>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-purple-900">{dbStats.stores}</div>
                  <div className="text-sm text-purple-700">Épiceries</div>
                </div>
              </div>
              
              {/* Stats par épicerie */}
              <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                {Object.entries(dbStats.storeStats).map(([store, stats]) => (
                  <div key={store} className="border rounded p-3 bg-white">
                    <div className="font-semibold text-sm mb-1">{store}</div>
                    <div className="text-xs text-gray-600">
                      <div>Total: {stats.total}</div>
                      <div className="text-green-600">Actifs: {stats.active}</div>
                      <div className="text-gray-500">Prix moy: {stats.avgPrice}$</div>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-4 flex justify-end">
                <Button variant="secondary" onClick={loadDbStats}>
                  🔄 Actualiser
                </Button>
              </div>
            </CardBody>
          </Card>
        )}

        {/* Scraping Controls */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>🌐 Scraping des circulaires</CardTitle>
          </CardHeader>
          <CardBody>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              {/* TOUTES LES ÉPICERIES */}
              <div className="border-2 border-purple-300 rounded-lg p-4 bg-purple-50">
                <h3 className="font-semibold text-lg mb-2">🏪 Toutes</h3>
                <Button
                  variant="primary"
                  className="w-full bg-purple-600 hover:bg-purple-700"
                  disabled={scrapingStore === 'all-stores'}
                  onClick={() => handleScrape('all-stores')}
                >
                  {scrapingStore === 'all-stores' ? '⏳ Génération...' : '🌟 5 Épiceries'}
                </Button>
                <p className="text-xs text-purple-700 mt-2">50 produits × 5 épiceries = 250 produits</p>
              </div>

              {/* TEST */}
              <div className="border-2 border-green-300 rounded-lg p-4 bg-green-50">
                <h3 className="font-semibold text-lg mb-2">🧪 TEST</h3>
                <Button
                  variant="primary"
                  className="w-full bg-green-600 hover:bg-green-700"
                  disabled={scrapingStore === 'test'}
                  onClick={() => handleScrape('test')}
                >
                  {scrapingStore === 'test' ? '⏳ Génération...' : '✨ Données test'}
                </Button>
                <p className="text-xs text-green-700 mt-2">50 produits de base</p>
              </div>

              {/* IGA */}
              <div className="border rounded-lg p-4">
                <h3 className="font-semibold text-lg mb-2">IGA</h3>
                <Button
                  variant="primary"
                  className="w-full"
                  disabled={scrapingStore === 'iga'}
                  onClick={() => handleScrape('iga')}
                >
                  {scrapingStore === 'iga' ? '⏳ Scraping...' : '🔄 Scraper IGA'}
                </Button>
                <p className="text-xs text-gray-500 mt-2">Peut retourner 0 produits</p>
              </div>

              {/* Metro */}
              <div className="border rounded-lg p-4 bg-gray-50">
                <h3 className="font-semibold text-lg mb-2">Metro</h3>
                <Button variant="secondary" className="w-full" disabled>
                  Bientôt disponible
                </Button>
              </div>

              {/* Maxi */}
              <div className="border rounded-lg p-4 bg-gray-50">
                <h3 className="font-semibold text-lg mb-2">Maxi</h3>
                <Button variant="secondary" className="w-full" disabled>
                  Bientôt disponible
                </Button>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Validation Table */}
        {scrapedProducts.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>📦 Produits détectés ({scrapedProducts.length})</CardTitle>
                <div className="flex gap-2">
                  <Badge variant="info">
                    {scrapedProducts.filter(p => p.validated).length} validés
                  </Badge>
                  <Button
                    variant="primary"
                    onClick={handlePublish}
                    disabled={loading || scrapedProducts.filter(p => p.validated).length === 0}
                  >
                    {loading ? 'Publication...' : '✅ Publier les validés'}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardBody>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="p-2 text-left">✓</th>
                      <th className="p-2 text-left">Nom</th>
                      <th className="p-2 text-left">Marque</th>
                      <th className="p-2 text-left">Épicerie</th>
                      <th className="p-2 text-left">Prix</th>
                      <th className="p-2 text-left">Volume</th>
                      <th className="p-2 text-left">Début</th>
                      <th className="p-2 text-left">Fin</th>
                      <th className="p-2 text-left">Statut</th>
                      <th className="p-2 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {scrapedProducts.map((product) => (
                      <tr key={product.id} className={product.validated ? 'bg-green-50' : ''}>
                        <td className="p-2">
                          <input
                            type="checkbox"
                            checked={product.validated}
                            onChange={() => toggleValidation(product.id)}
                            className="w-5 h-5"
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="text"
                            value={product.name}
                            onChange={(e) => updateProduct(product.id, 'name', e.target.value)}
                            className="w-full px-2 py-1 border rounded"
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="text"
                            value={product.brand || ''}
                            onChange={(e) => updateProduct(product.id, 'brand', e.target.value)}
                            className="w-24 px-2 py-1 border rounded"
                            placeholder="Marque"
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="text"
                            value={product.store || ''}
                            onChange={(e) => updateProduct(product.id, 'store', e.target.value)}
                            className="w-24 px-2 py-1 border rounded"
                            placeholder="IGA"
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="number"
                            step="0.01"
                            value={product.price}
                            onChange={(e) => updateProduct(product.id, 'price', parseFloat(e.target.value))}
                            className="w-20 px-2 py-1 border rounded"
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="text"
                            value={product.volume || ''}
                            onChange={(e) => updateProduct(product.id, 'volume', e.target.value)}
                            className="w-24 px-2 py-1 border rounded"
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="date"
                            value={product.validFrom || ''}
                            onChange={(e) => updateProduct(product.id, 'validFrom', e.target.value)}
                            className="w-32 px-2 py-1 border rounded text-xs"
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="date"
                            value={product.validTo || ''}
                            onChange={(e) => updateProduct(product.id, 'validTo', e.target.value)}
                            className="w-32 px-2 py-1 border rounded text-xs"
                          />
                        </td>
                        <td className="p-2">
                          {product.edited && <Badge variant="warning">Modifié</Badge>}
                        </td>
                        <td className="p-2 text-right">
                          <Button
                            variant="secondary"
                            onClick={() => deleteProduct(product.id)}
                            className="text-red-600"
                          >
                            🗑️
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardBody>
          </Card>
        )}

        {/* Publish Status */}
        {publishStatus && (
          <Card>
            <CardBody>
              <div className={`p-4 rounded-lg ${publishStatus.success ? 'bg-green-50 text-green-900' : 'bg-red-50 text-red-900'}`}>
                {publishStatus.success ? (
                  <>
                    <p className="font-semibold">✅ Publication réussie!</p>
                    <p className="text-sm">{publishStatus.count} produits publiés pour les utilisateurs</p>
                    {typeof publishStatus.added === 'number' && typeof publishStatus.updated === 'number' && (
                      <p className="text-xs mt-1">Ingestion locale: +{publishStatus.added} / ⟳{publishStatus.updated}</p>
                    )}
                    {publishStatus.timestamp && (
                      <p className="text-xs mt-2">{new Date(publishStatus.timestamp).toLocaleString()}</p>
                    )}
                  </>
                ) : (
                  <>
                    <p className="font-semibold">❌ Erreur de publication</p>
                    <p className="text-sm">{publishStatus.error}</p>
                  </>
                )}
              </div>
            </CardBody>
          </Card>
        )}
      </div>
    </div>
  )
}
