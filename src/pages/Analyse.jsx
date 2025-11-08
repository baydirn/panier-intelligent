import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import useAppStore from '../store/useAppStore'
import { getPrixProduits } from '../services/apiPrix'
import { trouverCombinaisonsOptimales } from '../services/optimisation'
import StoreComparisonCard from '../components/StoreComparisonCard'
import ProgressBar from '../components/ProgressBar'
import { getSavedLists, loadSavedList, getCurrentListId } from '../services/db'
import Button from '../components/Button'
import Badge from '../components/Badge'

export default function Analyse() {
  const navigate = useNavigate()
  const products = useAppStore((s) => s.products || [])
  const loadProducts = useAppStore((s) => s.loadProducts)
  const setCombinaisonOptimale = useAppStore((s) => s.setCombinaisonOptimale)
  const maxMagasins = useAppStore((s) => s.settings?.maxStoresToCombine ?? 2)

  const [loading, setLoading] = useState(false)
  const [prixData, setPrixData] = useState(null)
  const [prixMeta, setPrixMeta] = useState(null) // Track price sources
  const [combis, setCombis] = useState([])
  const [error, setError] = useState(null)
  const [savedLists, setSavedLists] = useState([])
  const [currentListId, setCurrentListId] = useState(null)
  const [showListSelector, setShowListSelector] = useState(false)

  useEffect(() => {
    loadSavedListsData()
  }, [])

  async function loadSavedListsData(){
    const lists = await getSavedLists()
    setSavedLists(lists)
    const id = await getCurrentListId()
    setCurrentListId(id)
  }

  async function handleSelectList(listId){
    await loadSavedList(listId)
    await loadProducts()
    setCurrentListId(listId)
    setShowListSelector(false)
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
        // fetch mock prices
        const prix = await getPrixProduits(products)
        if (!mounted) return
        setPrixData(prix)
        setPrixMeta(prix.__meta || null) // Extract metadata

        // compute best combinations (top 3)
        const results = trouverCombinaisonsOptimales(products, prix, maxMagasins, 3)
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
  }, [products, maxMagasins])

  function computeAverageBaseline(prix, productsList) {
    // average price per product across available stores
    if (!prix) return 0
    let total = 0
    for (const p of productsList) {
      const key = p.nom?.toLowerCase() ?? ''
      const row = prix[key]
      if (!row) continue
      const values = Object.values(row).filter((v) => typeof v === 'number')
      total += values.reduce((a, b) => a + b, 0) / Math.max(values.length, 1)
    }
    return Math.round(total * 100) / 100
  }

  function handleUseCombination(comb) {
    // sauvegarde dans le store
    setCombinaisonOptimale(comb)
    // redirige vers Magasin
    navigate('/magasin')
  }

  const currentListName = savedLists.find(l => l.id === currentListId)?.name || 'Liste actuelle'

  return (
    <div className="p-4 max-w-4xl mx-auto pb-24">
      <div className="mb-6">
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
        <div className="text-gray-600">Aucune combinaison trouvée (ajoute des produits dans la liste).</div>
      )}

      {!loading && combis && combis.length > 0 && prixData && (
        <>
          <div className="mb-4">
            <p className="text-sm text-gray-700">
              Résultats — {combis.length} meilleure(s) combinaison(s) affichées.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {(() => {
              const baseline = computeAverageBaseline(prixData, products)
              return combis.map((c, idx) => {
                const effectiveSavings = (c.savings != null) ? c.savings : null
                const effectiveSavingsPct = (c.savingsPct != null) ? c.savingsPct : null
                return (
                  <div key={idx} className="bg-white rounded-xl shadow-sm border overflow-hidden animate-fade-in">
                    <div className="bg-blue-50 border-b px-4 py-2 text-sm text-blue-800 font-medium">
                      {c.stores.join(' • ')}
                    </div>
                    <div className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <p className="text-2xl font-bold">${c.total.toFixed(2)}</p>
                        <span className="inline-block text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full">
                          Couverture: {Math.round((c.coverage || 0)*100)}%
                        </span>
                        {c.unknownCount > 0 && (
                          <span className="inline-block text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full">
                            {c.unknownCount} sans prix
                          </span>
                        )}
                        {c.coverage < 1 && (
                          <span className="inline-block text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full" title="Certaines lignes sont estimées">
                            Estimation
                          </span>
                        )}
                      </div>
                      {effectiveSavings != null && effectiveSavingsPct != null ? (
                        <span className="inline-block text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full mb-3">Économie: ${effectiveSavings.toFixed(2)} ({effectiveSavingsPct}%) {c.coverage < 1 ? '(estimé)' : ''}</span>
                      ) : (
                        <span className="inline-block text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full mb-3">Économie non calculable (prix manquants)</span>
                      )}

                      <div className="mb-3 max-h-40 overflow-auto">
                        <ul className="text-sm space-y-1">
                          {c.assignment.map((a, i) => {
                            // Check if price came from stored data
                            const isStored = prixMeta?.[a.product]?.[a.store]?.isStored || false
                            return (
                              <li key={i} className="flex justify-between">
                                <span>{a.product}</span>
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
