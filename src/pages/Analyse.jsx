import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import useFirestoreStore from '../store/useFirestoreStore'
import { getPrixProduits } from '../services/apiPrix'
import { trouverCombinaisonsOptimales } from '../services/optimisation'
import { listNearbyStores, getStoredLocation } from '../services/geolocation'
import { savePersonalListAsSnapshot } from '../services/firestore'
import StoreComparisonCard from '../components/StoreComparisonCard'
import ProgressBar from '../components/ProgressBar'
import { getSavedLists, loadSavedList, getCurrentListId } from '../services/db'
import Button from '../components/Button'
import Badge from '../components/Badge'
import Modal from '../components/Modal'
import Input from '../components/Input'
import { motion } from 'framer-motion'
import { DollarSign, Building2, TrendingDown, MapPin, Lock, Star, Save } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../components/ToastProvider'

export default function Analyse() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { addToast } = useToast()
  const products = useFirestoreStore((s) => s.products || [])
  const loadProducts = useFirestoreStore((s) => s.loadProducts)
  const subscribeToProducts = useFirestoreStore((s) => s.subscribeToProducts)
  const unsubscribeFromProducts = useFirestoreStore((s) => s.unsubscribeFromProducts)
  const setSelectedCombination = useFirestoreStore((s) => s.setSelectedCombination)
  const settings = useFirestoreStore((s) => s.settings || {})
  const maxMagasins = settings.maxStoresToCombine ?? 2
  const favoriteStores = settings.favoriteStores ?? []

  const [loading, setLoading] = useState(false)
  const [prixData, setPrixData] = useState(null)
  const [prixMeta, setPrixMeta] = useState(null) // Track price sources
  const [combis, setCombis] = useState([])
  const [error, setError] = useState(null)
  const [savedLists, setSavedLists] = useState([])
  const [currentListId, setCurrentListId] = useState(null)
  const [showListSelector, setShowListSelector] = useState(false)
  const [showSaveModal, setShowSaveModal] = useState(false)
  const [saveListName, setSaveListName] = useState('')
  const [userLocation, setUserLocation] = useState(null) // {lat, lon}
  const [allowedStores, setAllowedStores] = useState([])

  useEffect(() => {
    loadSavedListsData()
    // Try to get user location for distance calc (non-blocking)
    // Prefer stored location (Paramètres) for consistency
    getStoredLocation().then(loc => { if(loc) setUserLocation({ lat: loc.lat, lon: loc.lon }) }).catch(()=>{})
    // Load and subscribe to products
    if(user?.uid){
      loadProducts(user.uid).catch(()=>{})
      subscribeToProducts(user.uid)
    }
    
    // Cleanup: unsubscribe on unmount
    return () => {
      unsubscribeFromProducts()
    }
  }, [user, loadProducts, subscribeToProducts, unsubscribeFromProducts])

  async function loadSavedListsData(){
    const lists = await getSavedLists()
    setSavedLists(lists)
    const id = await getCurrentListId()
    setCurrentListId(id)
  }

  async function handleSelectList(listId){
    await loadSavedList(listId)
    if (user) {
      await loadProducts(user.uid)
    }
    setCurrentListId(listId)
    setShowListSelector(false)
  }

  async function handleSaveList() {
    if (!saveListName.trim()) {
      addToast('Veuillez entrer un nom pour la liste', 'error')
      return
    }

    if (!user?.uid) {
      addToast('Vous devez être connecté', 'error')
      return
    }

    try {
      await savePersonalListAsSnapshot(user.uid, saveListName.trim(), products)
      addToast('Liste sauvegardée ✅', 'success')
      setShowSaveModal(false)
      setSaveListName('')
      await loadSavedListsData()
    } catch (error) {
      console.error('[Analyse] Error saving list:', error)
      addToast('Erreur lors de la sauvegarde: ' + error.message, 'error')
    }
  }

  useEffect(() => {
    let mounted = true
    async function runAnalyse() {
      if (!products || products.length === 0) {
        setCombis([])
        return
      }
      setLoading(true)
      setError(null)
      try {
        // When location exists, get nearby stores FIRST to filter prices
        let allowedCodes = []
        if(userLocation){
          try{ 
            const nearby = await listNearbyStores()
            // Extract base store codes by parsing the name field
            // E.g., "Metro Laurier Québec (DEMO - Laurier)" -> "metro"
            //       "Super C Saint-Augustin" -> "super c"
            allowedCodes = (nearby || [])
              .map(s => {
                const name = s.name || s.id || s.code || ''
                // Handle special cases like "Super C"
                if(name.toLowerCase().startsWith('super c')) return 'super c'
                if(name.toLowerCase().startsWith('super')) return 'super c' // Fallback
                // Otherwise extract first word
                const firstWord = name.split(/\s+/)[0]
                return firstWord.toLowerCase()
              })
              .filter(Boolean)
            // Get unique codes
            allowedCodes = Array.from(new Set(allowedCodes))
          } catch(e) {
            console.error('[Analyse] listNearbyStores failed:', e)
          }
          setAllowedStores(allowedCodes)
        }

        // fetch mock prices
        const prixRaw = await getPrixProduits(products)
        if (!mounted) return
        
        // Filter prices to only include nearby stores when location is active
        let prix = prixRaw
        if(allowedCodes.length > 0){
          const allowedSet = new Set(allowedCodes.map(c => String(c).trim().toLowerCase()))
          const filtered = {}
          const filteredMeta = {}
          
          Object.entries(prixRaw).forEach(([productName, storeMap]) => {
            if(productName === '__meta') return // Skip metadata in first pass
            const filteredStores = {}
            Object.entries(storeMap || {}).forEach(([store, price]) => {
              const storeNorm = String(store).trim().toLowerCase()
              if(allowedSet.has(storeNorm)){
                // Store with normalized (lowercase) key to match allowedCodes
                filteredStores[storeNorm] = price
              }
            })
            if(Object.keys(filteredStores).length > 0){
              filtered[productName] = filteredStores
            }
          })
          
          // Also filter metadata
          if(prixRaw.__meta){
            Object.entries(prixRaw.__meta).forEach(([productName, storeMetaMap]) => {
              filteredMeta[productName] = {}
              Object.entries(storeMetaMap || {}).forEach(([store, meta]) => {
                const storeNorm = String(store).trim().toLowerCase()
                if(allowedSet.has(storeNorm)){
                  // Also normalize metadata keys
                  filteredMeta[productName][storeNorm] = meta
                }
              })
            })
          }
          
          filtered.__meta = filteredMeta
          prix = filtered
        }
        
        setPrixData(prix)
        setPrixMeta(prix.__meta || null)

        // compute best combinations (top 3)
        // Build weights from settings; if no geolocation, ignore distance by setting its weight to 0
        const userWeights = { ...(settings.scoringWeights || {}) }
        if(!userLocation){ userWeights.distance = 0 }
        const opts = {
          userLat: userLocation?.lat,
          userLon: userLocation?.lon,
          favoriteStores,
          weights: userWeights,
          debug: import.meta?.env?.VITE_DEBUG === '1',
          pruneLargeSearch: true,
          maxCombos: 8000,
          maxRadiusKm: settings.searchRadiusKm ?? 10,
          // Only restrict if we actually found nearby stores; otherwise allow all
          allowedStoreCodes: (allowedCodes.length > 0 ? allowedCodes : undefined)
        }
        const results = trouverCombinaisonsOptimales(products, prix, maxMagasins, 3, opts)
        if (!mounted) return
        setCombis(results)
      } catch (err) {
        console.error(err)
        if (mounted) setError('Erreur lors de l\'analyse')
      } finally {
        if (mounted) setLoading(false)
      }
    }
    runAnalyse()
    return () => {
      mounted = false
    }
  }, [products, maxMagasins, favoriteStores, userLocation])

  function computeAverageBaseline(prix, productsList) {
    // average price per product across available stores
    if (!prix) return 0
    let total = 0
    for (const p of productsList) {
      const key = p.nom?.toLowerCase() ?? ''
      const row = prix[key]
      if (!row) continue
      const values = Object.values(row).filter((v) => typeof v === 'number')
      const qty = Number(p.quantite) || 1
      total += (values.reduce((a, b) => a + b, 0) / Math.max(values.length, 1)) * qty
    }
    return Math.round(total * 100) / 100
  }

  const baselineAvg = React.useMemo(() => computeAverageBaseline(prixData, products), [prixData, products])

  function handleUseCombination(comb) {
    // sauvegarde dans le store
    setSelectedCombination(comb)
    // redirige vers Magasin
    navigate('/magasin')
  }

  const currentListName = savedLists.find(l => l.id === currentListId)?.name || 'Liste actuelle'

  const handleOpenSaveModal = () => {
    setSaveListName(`Liste ${new Date().toLocaleDateString('fr-CA')}`)
    setShowSaveModal(true)
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-green-50 to-blue-50">
      {/* Header */}
      <div className="bg-white px-6 pt-8 pb-6 shadow-sm sticky top-0 z-10">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 className="text-gray-900">Meilleures options</h1>
            <p className="text-gray-500 mt-1">Pour votre panier de {products.length} produit(s)</p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="primary"
              size="sm"
              onClick={handleOpenSaveModal}
              disabled={products.length === 0}
            >
              <Save className="w-4 h-4 mr-1" />
              Sauvegarder
            </Button>
          </div>
        </div>
      </div>

      {/* Save Modal */}
      {showSaveModal && (
        <Modal
          isOpen={showSaveModal}
          onClose={() => setShowSaveModal(false)}
          title="Sauvegarder la liste"
        >
          <div className="space-y-4">
            <Input
              label="Nom de la liste"
              value={saveListName}
              onChange={(e) => setSaveListName(e.target.value)}
              placeholder="ex: Courses du 30 décembre"
            />
            <div className="flex gap-2 justify-end">
              <Button
                variant="secondary"
                onClick={() => setShowSaveModal(false)}
              >
                Annuler
              </Button>
              <Button
                variant="primary"
                onClick={handleSaveList}
              >
                Sauvegarder
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Options summary cards (top 3 combinations with enhanced visual hierarchy) */}
      {!loading && combis && combis.length > 0 && (
        <div className="px-6 py-6">
          <div className="mb-4">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.1, type: 'spring' }}
              >
                ✨
              </motion.span>
              Vos meilleures options
            </h2>
            <p className="text-sm text-gray-500 mt-1">Classées par économies estimées</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {combis.slice(0, 3).map((c, index) => {
              const effectiveSavings = (c.savings != null) ? c.savings : (baselineAvg > 0 ? baselineAvg - c.total : 0)
              const effectiveSavingsPct = baselineAvg > 0 ? Math.round((effectiveSavings / baselineAvg) * 100) : 0
              
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 30, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ delay: index * 0.12, type: "spring", stiffness: 300, damping: 24 }}
                  whileHover={{ scale: 1.04, y: -6 }}
                  onClick={() => handleUseCombination(c)}
                  className={`relative group cursor-pointer rounded-3xl overflow-hidden shadow-xl transition-all duration-300`}
                >
                  {/* Background gradient */}
                  <div className={`absolute inset-0 ${
                    index === 0 
                      ? 'bg-gradient-to-br from-green-50 via-emerald-50 to-green-100' 
                      : index === 1 
                      ? 'bg-gradient-to-br from-blue-50 via-cyan-50 to-blue-100'
                      : 'bg-gradient-to-br from-purple-50 via-pink-50 to-purple-100'
                  }`} />
                  
                  {/* Rank badge */}
                  <div className="absolute top-4 left-4 z-10">
                    <motion.div
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ delay: index * 0.12 + 0.2, type: 'spring' }}
                      className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white shadow-lg ${
                        index === 0 
                          ? 'bg-gradient-to-br from-green-500 to-emerald-600' 
                          : index === 1
                          ? 'bg-gradient-to-br from-blue-500 to-cyan-600'
                          : 'bg-gradient-to-br from-purple-500 to-pink-600'
                      }`}
                    >
                      {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
                    </motion.div>
                  </div>

                  {/* Border highlight for #1 */}
                  {index === 0 && (
                    <div className="absolute inset-0 border-2 border-green-400 rounded-3xl pointer-events-none" />
                  )}

                  <div className="relative p-6 h-full flex flex-col">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1 pt-6">
                        <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-1">
                          Option {index + 1}
                        </h3>
                        <p className="text-xs text-gray-600 flex items-center gap-1">
                          <Building2 className="w-3 h-3" />
                          {c.stores.length} magasin{c.stores.length > 1 ? 's' : ''}
                        </p>
                      </div>
                      <motion.div
                        whileHover={{ rotate: 10, scale: 1.1 }}
                        className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-md ${
                          index === 0 
                            ? 'bg-green-100' 
                            : index === 1
                            ? 'bg-blue-100'
                            : 'bg-purple-100'
                        }`}
                      >
                        <DollarSign className={`w-6 h-6 ${
                          index === 0 
                            ? 'text-green-600' 
                            : index === 1
                            ? 'text-blue-600'
                            : 'text-purple-600'
                        }`} />
                      </motion.div>
                    </div>

                    {/* Price highlight */}
                    <motion.div
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: index * 0.12 + 0.1 }}
                      className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 mb-4 shadow-sm border border-white/60"
                    >
                      <p className="text-3xl font-bold text-gray-900">${c.total.toFixed(2)}</p>
                      <p className="text-xs text-gray-600 mt-2 flex items-center gap-1">
                        {c.stores.join(' • ')}
                      </p>
                    </motion.div>

                    {/* Savings badge */}
                    {effectiveSavings > 0 && (
                      <motion.div
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.12 + 0.15 }}
                        className={`mb-3 px-3 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 ${
                          index === 0 
                            ? 'bg-green-100 text-green-700 border border-green-300' 
                            : index === 1
                            ? 'bg-blue-100 text-blue-700 border border-blue-300'
                            : 'bg-purple-100 text-purple-700 border border-purple-300'
                        }`}
                      >
                        <TrendingDown className="w-4 h-4" />
                        <span>Économie: ${effectiveSavings.toFixed(2)}</span>
                        <span className="opacity-70">({effectiveSavingsPct}%)</span>
                      </motion.div>
                    )}

                    {/* Distance indicator */}
                    {userLocation && c.totalDistanceKm > 0 && (
                      <motion.div
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.12 + 0.2 }}
                        className="px-3 py-2 rounded-xl text-xs font-medium flex items-center gap-2 bg-white/50 text-gray-700 border border-gray-200 mb-3"
                      >
                        <MapPin className="w-3 h-3" />
                        <span>{c.totalDistanceKm} km</span>
                      </motion.div>
                    )}

                    {/* Coverage indicator */}
                    {c.coverage != null && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: index * 0.12 + 0.25 }}
                        className="mt-auto"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-medium text-gray-600">Couverture</span>
                          <span className="text-xs font-bold text-gray-700">
                            {Math.round((c.coverage || 0) * 100)}%
                          </span>
                        </div>
                        <div className="w-full h-1.5 bg-white/40 rounded-full overflow-hidden border border-white/60">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${(c.coverage || 0) * 100}%` }}
                            transition={{ delay: index * 0.12 + 0.3, duration: 0.6, ease: 'easeOut' }}
                            className={`h-full ${
                              index === 0 
                                ? 'bg-green-500' 
                                : index === 1
                                ? 'bg-blue-500'
                                : 'bg-purple-500'
                            }`}
                          />
                        </div>
                      </motion.div>
                    )}

                    {/* CTA Button */}
                    <motion.button
                      whileHover={{ scale: 1.05, y: -2 }}
                      whileTap={{ scale: 0.95 }}
                      className={`mt-4 w-full py-3 rounded-xl font-semibold text-white transition-all ${
                        index === 0 
                          ? 'bg-gradient-to-r from-green-600 to-emerald-600 hover:shadow-lg hover:shadow-green-200' 
                          : index === 1
                          ? 'bg-gradient-to-r from-blue-600 to-cyan-600 hover:shadow-lg hover:shadow-blue-200'
                          : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:shadow-lg hover:shadow-purple-200'
                      }`}
                      onClick={() => handleUseCombination(c)}
                    >
                      Utiliser →
                    </motion.button>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </div>
      )}
      <div className="mb-6 px-6">
        <h1 className="text-2xl font-semibold mb-2">Comparer les prix</h1>
        
        {/* List Selector */}
        <div className="flex items-center gap-3 mb-4">
          <div className="flex-1">
            <Button
              variant="secondary"
              onClick={() => setShowListSelector(!showListSelector)}
              className="w-full justify-between"
            >
              <span>📋 {currentListName}</span>
              <span>{showListSelector ? '▲' : '▼'}</span>
            </Button>
          </div>
          <Button
            variant="ghost"
            onClick={() => navigate('/mes-listes')}
          >
            Gérer
          </Button>
        </div>

        {/* Dropdown list selector */}
        {showListSelector && savedLists.length > 0 && (
          <div className="bg-white border rounded-lg shadow-lg mb-4 max-h-64 overflow-auto">
            {savedLists.map(list => (
              <button
                key={list.id}
                onClick={() => handleSelectList(list.id)}
                className={`w-full text-left px-4 py-3 hover:bg-gray-50 border-b last:border-b-0 ${currentListId === list.id ? 'bg-blue-50' : ''}`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{list.name}</p>
                    <p className="text-sm text-gray-500">{list.products.length} produits</p>
                  </div>
                  {currentListId === list.id && (
                    <Badge variant="primary">Active</Badge>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}

        <p className="text-sm text-gray-600">
          Analyse pour {products.length} produit(s). Max magasins : {maxMagasins}
        </p>
      </div>

      {loading && (
        <div className="space-y-4">
          <div className="h-6 bg-gray-200 rounded w-2/5 animate-pulse" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="h-44 bg-gray-100 rounded-xl animate-pulse" />
            <div className="h-44 bg-gray-100 rounded-xl animate-pulse" />
            <div className="h-44 bg-gray-100 rounded-xl animate-pulse" />
          </div>
        </div>
      )}

      {error && <div className="text-red-600">{error}</div>}

      {!loading && combis && combis.length === 0 && (
        <div className="text-gray-600">
          Aucune combinaison trouvée.
          <div className="text-xs text-gray-500 mt-1">
            Produits: {products.length} • Rayon: {settings.searchRadiusKm ?? 10} km • Distance {userLocation ? 'activée' : 'ignorée'}.
            <br/>Astuce: augmente le rayon ou active la position, sinon les combos prix-only seront calculés.
          </div>
        </div>
      )}

      {!loading && combis && combis.length > 0 && prixData && (
        <>
          <div className="mb-4">
            <p className="text-sm text-gray-700">
              Résultats — {combis.length} meilleure(s) combinaison(s) affichées.
            </p>
            {baselineAvg > 0 && (
              <p className="text-xs text-gray-500 mt-1">
                Référence moyenne (acheter partout) : <strong>{baselineAvg.toFixed(2)}$</strong>
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {(() => {
              const baseline = computeAverageBaseline(prixData, products)
              return combis.map((c, idx) => {
                const effectiveSavings = (c.savings != null) ? c.savings : null
                const effectiveSavingsPct = (c.savingsPct != null) ? c.savingsPct : null
                return (
                  <div key={idx} className="bg-white rounded-xl shadow-sm border overflow-hidden animate-fade-in">
                    <div className="bg-blue-50 border-b px-4 py-2 text-sm text-blue-800 font-medium flex items-center justify-between">
                      <span>{c.stores.join(' • ')}</span>
                      {c.score != null && (
                        <Badge variant="info" title="Score composite (prix, distance, nb magasins, favoris, couverture)">
                          Score: {c.score.toFixed(3)}
                        </Badge>
                      )}
                    </div>
                    <div className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <p className="text-2xl font-bold">${c.total.toFixed(2)}</p>
                        {c.totalDistanceKm > 0 && (
                          <Badge variant="purple" className="flex items-center gap-1" title="Distance totale (aller)">
                            <MapPin className="w-3 h-3" />
                            {c.totalDistanceKm} km
                          </Badge>
                        )}
                        {c.favoritesCount > 0 && (
                          <Badge variant="amber" className="flex items-center gap-1" title="Magasins favoris">
                            <Star className="w-3 h-3" />
                            {c.favoritesCount}
                          </Badge>
                        )}
                        <Badge variant="default">
                          Couverture: {Math.round((c.coverage || 0)*100)}%
                        </Badge>
                        {c.unknownCount > 0 && (
                          <Badge variant="warning">
                            {c.unknownCount} sans prix
                          </Badge>
                        )}
                        {c.coverage < 1 && (
                          <Badge variant="default" className="text-[10px]" title="Certaines lignes sont estimées">
                            Estimation
                          </Badge>
                        )}
                      </div>
                      {effectiveSavings != null && effectiveSavingsPct != null ? (
                        <Badge variant="success" className="flex items-center gap-1 mb-3">
                          <TrendingDown className="w-3 h-3" />
                          Économie: ${effectiveSavings.toFixed(2)} ({effectiveSavingsPct}%) {c.coverage < 1 ? '(estimé)' : ''}
                        </Badge>
                      ) : (
                        <Badge variant="default" className="mb-3">
                          Économie non calculable (prix manquants)
                        </Badge>
                      )}

                      <div className="mb-3 max-h-40 overflow-auto">
                        <ul className="text-sm space-y-1">
                          {c.assignment.map((a, i) => {
                            // Check if price came from stored data
                            const isStored = prixMeta?.[a.product]?.[a.store]?.isStored || false
                            return (
                              <li key={i} className="flex justify-between items-center">
                                <span className="flex items-center gap-1">
                                  {a.product}
                                  {a.isLocked && <Lock className="w-3 h-3 text-amber-600" title="Verrouillé dans ce magasin" />}
                                </span>
                                <span className="text-gray-600">
                                  {a.store || '—'} • {a.price != null
                                    ? `$${a.price.toFixed(2)}${isStored ? '' : ' (estimé)'}`
                                    : 'Prix indisponible'
                                  }
                                </span>
                              </li>
                            )
                          })}
                        </ul>
                      </div>

                      <div className="flex items-center justify-between">
                        <button
                          className="bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 active:scale-95 transition"
                          onClick={() => handleUseCombination(c)}
                        >
                          Utiliser cette combinaison
                        </button>
                        <button
                          className="text-sm text-gray-500 hover:underline"
                          onClick={() => {
                            alert(`Détails:\nMagasins: ${c.stores.join(', ')}\nCoût: $${c.total.toFixed(2)}`)
                          }}
                        >
                          Détails
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })
            })()}
          </div>
        </>
      )}

    </div>
  )
}
