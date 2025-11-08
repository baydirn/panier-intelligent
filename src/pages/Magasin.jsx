import React, { useEffect, useMemo, useState } from 'react'
import ProgressBar from '../components/ProgressBar'
import useAppStore from '../store/useAppStore'
import { loadProgress, saveProgress, clearProgress, addRecurrentProduct } from '../services/db'
import { useToast } from '../components/ToastProvider'
import Button from '../components/Button'
import Badge from '../components/Badge'

export default function Magasin(){
  const products = useAppStore(s => s.products)
  const loadProducts = useAppStore(s => s.loadProducts)
  const updateProduct = useAppStore(s => s.updateProduct)
  const getCombinaisonOptimale = useAppStore(s => s.getCombinaisonOptimale)
  const { addToast } = useToast()

  const [viewMode, setViewMode] = useState('grouped') // 'grouped' or 'list'
  const [restoring, setRestoring] = useState(false)
  const [hideCompleted, setHideCompleted] = useState(false)

  useEffect(()=>{ loadProducts().catch(()=>{}) }, [])

  const total = products.length
  const purchased = products.filter(p => p.purchased).length
  const percent = total === 0 ? 0 : Math.round((purchased/total)*100)

  // Stable list id based on current items (changes if list changes)
  const listId = useMemo(() => {
    if(!products || products.length === 0) return 'empty'
    try {
      return products.map(p => p.id).sort().join('|')
    } catch {
      return 'list'
    }
  }, [products])

  async function togglePurchased(p){
    // Update DB/state
    const nextPurchased = !p.purchased
    await updateProduct(p.id, { purchased: nextPurchased })
    // Persist progress
    try{
      const checked = new Set(products.filter(x => x.purchased).map(x => x.id))
      if(nextPurchased) checked.add(p.id); else checked.delete(p.id)
      await saveProgress(listId, Array.from(checked))
    }catch(e){ /* noop */ }
  }

  async function toggleAllInStore(store, checked){
    const items = groupedByStore[store] || []
    for(const p of items){
      try{ await updateProduct(p.id, { purchased: checked }) }catch{}
    }
    try{
      const allChecked = new Set(products.filter(x => x.purchased).map(x => x.id))
      items.forEach(p => { checked ? allChecked.add(p.id) : allChecked.delete(p.id) })
      await saveProgress(listId, Array.from(allChecked))
    }catch{}
  }

  // Group products by store
  const groupedByStore = useMemo(() => {
    const groups = {}
    const itemsToShow = hideCompleted ? products.filter(p => !p.purchased) : products
    itemsToShow.forEach(p => {
      const store = p.magasin || 'Non assigné'
      if(!groups[store]) groups[store] = []
      groups[store].push(p)
    })
    return groups
  }, [products, hideCompleted])

  // Get optimal combination to show suggested order
  const combination = getCombinaisonOptimale ? getCombinaisonOptimale() : null
  const storeOrder = combination?.stores || Object.keys(groupedByStore)

  // On mount/when products change, restore saved purchase progress
  useEffect(() => {
    let mounted = true
    async function restore(){
      if(!products || products.length === 0) return
      setRestoring(true)
      try{
        const saved = await loadProgress(listId)
        if(!mounted) return
        const savedSet = new Set(saved)
        // update only mismatches
        const mismatches = products.filter(p => !!p.purchased !== savedSet.has(p.id))
        for(const p of mismatches){
          try{ await updateProduct(p.id, { purchased: savedSet.has(p.id) }) }catch{}
        }
      } finally {
        setRestoring(false)
      }
    }
    restore()
    return () => { mounted = false }
  }, [listId])

  // Auto-apply combination mapping for missing magasin/prix
  useEffect(() => {
    if(!combination || !products || products.length === 0) return
    const assignMap = new Map()
    combination.assignment?.forEach(a => {
      if(!a || !a.product) return
      assignMap.set(String(a.product).toLowerCase(), { store: a.store, price: a.price })
    })
    const toUpdate = []
    for(const p of products){
      const key = (p.nom || '').toLowerCase()
      const mapped = assignMap.get(key)
      if(mapped && (!p.magasin || p.prix == null)){
        toUpdate.push({ id: p.id, magasin: mapped.store || p.magasin || null, prix: typeof mapped.price === 'number' ? mapped.price : p.prix, prixSource: 'optimisation', autoAssigned: true })
      }
    }
    if(toUpdate.length){
      ;(async () => {
        for(const it of toUpdate){
          try{ await updateProduct(it.id, { magasin: it.magasin, prix: it.prix, prixSource: it.prixSource, autoAssigned: it.autoAssigned }) }catch{}
        }
      })()
    }
  }, [combination, products])

  // Calculate stats per store
  const storeStats = useMemo(() => {
    const stats = {}
    Object.entries(groupedByStore).forEach(([store, items]) => {
      const totalItems = items.length
      const purchasedItems = items.filter(p => p.purchased).length
      const totalPrice = items.reduce((sum, p) => sum + (p.prix || 0), 0)
      stats[store] = { totalItems, purchasedItems, totalPrice, percent: totalItems ? Math.round((purchasedItems/totalItems)*100) : 0 }
    })
    return stats
  }, [groupedByStore])

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 animate-fade-in">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-gray-900">Mode Magasin</h2>
        <div className="flex items-center gap-2">
          <Badge variant={hideCompleted ? 'info' : 'default'}>
            {hideCompleted ? 'Masqué' : 'Tout'}
          </Badge>
        </div>
      </div>

      {/* Sticky Global Progress */}
      <div className="sticky top-0 z-20 bg-white/95 backdrop-blur border-b border-gray-200 mb-4 -mx-4 px-4">
        <div className="py-3">
          <div className="flex items-center justify-between mb-1">
            <h3 className="font-semibold text-gray-900">Progression globale</h3>
            <span className="text-sm text-gray-600">{purchased}/{total} produits</span>
          </div>
          <ProgressBar percent={percent} />
        </div>
      </div>

      {/* Finish banner */}
      {percent === 100 && total > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-4 animate-fade-in">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-2 text-green-800 font-medium">
              <span className="text-2xl">🎉</span>
              <span>Épicerie complétée !</span>
            </div>
            <div className="flex gap-2">
              <Button
                variant="primary"
                size="sm"
                onClick={async () => {
                  const purchasedItems = products.filter(p => p.purchased)
                  for(const p of purchasedItems){
                    try{
                      await addRecurrentProduct({ name: p.nom, default_quantity: p.quantite || 1, default_store: p.magasin || null, active: true })
                    }catch{}
                  }
                  addToast('Liste enregistrée comme récurrente', 'success')
                }}
              >
                Enregistrer cette liste comme récurrente
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={async () => {
                  try{ await clearProgress(listId) }catch{}
                  addToast('Terminé', 'info')
                }}
              >
                Terminer
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* View Mode Toggle + Hide Completed */}
      <div className="flex items-center justify-between mb-4 gap-2">
        <div className="flex gap-2">
          <Button
            onClick={() => setViewMode('grouped')}
            variant={viewMode === 'grouped' ? 'primary' : 'secondary'}
            size="sm"
          >
            Par magasin
          </Button>
          <Button
            onClick={() => setViewMode('list')}
            variant={viewMode === 'list' ? 'primary' : 'secondary'}
            size="sm"
          >
            Liste complète
          </Button>
        </div>
        
        <button
          onClick={() => setHideCompleted(!hideCompleted)}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all text-sm ${hideCompleted ? 'bg-blue-50 text-blue-700' : 'bg-gray-100 text-gray-700'}`}
        >
          <input type="checkbox" checked={hideCompleted} onChange={() => {}} className="w-4 h-4 rounded" />
          <span>Masquer achetés</span>
        </button>
      </div>

      {/* Itinerary suggestion */}
      {viewMode === 'grouped' && storeOrder.length > 1 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <h4 className="font-semibold mb-2 flex items-center">
            <span className="mr-2">🗺️</span>
            Itinéraire suggéré
          </h4>
          <div className="flex items-center gap-2 flex-wrap">
            {storeOrder.map((store, idx) => (
              <React.Fragment key={store}>
                <span className="bg-white px-3 py-1 rounded shadow-sm font-medium">
                  {idx + 1}. {store}
                </span>
                {idx < storeOrder.length - 1 && <span className="text-gray-400">→</span>}
              </React.Fragment>
            ))}
          </div>
        </div>
      )}

      {/* Grouped View */}
      {viewMode === 'grouped' && (
        <div className="space-y-6">
          {storeOrder.map(store => {
            const items = groupedByStore[store] || []
            if(items.length === 0) return null
            const stats = storeStats[store] || {}
            const allChecked = items.every(p => p.purchased)
            
            return (
              <div key={store} className="bg-white rounded-xl shadow-sm border overflow-hidden">
                {/* Store Header */}
                <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-semibold">{store}</h3>
                    <div className="flex items-center gap-2">
                      <span className="bg-white/20 px-3 py-1 rounded-full text-sm">
                        {stats.purchasedItems}/{stats.totalItems}
                      </span>
                      <button
                        onClick={() => toggleAllInStore(store, !allChecked)}
                        className="bg-white/20 hover:bg-white/30 px-3 py-1 rounded-full text-sm transition-colors"
                      >
                        {allChecked ? 'Tout décocher' : 'Tout cocher'}
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span>Total estimé: ${stats.totalPrice.toFixed(2)}</span>
                    <span>{stats.percent}% complété</span>
                  </div>
                  <ProgressBar percent={stats.percent} showLabel={false} />
                </div>

                {/* Products in this store */}
                <div className="divide-y">
                  {items.map(p => (
                    <div key={p.id} className="p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 flex-1">
                          <input
                            type="checkbox"
                            checked={p.purchased || false}
                            onChange={() => togglePurchased(p)}
                            className="w-6 h-6 text-blue-600 rounded transition-transform active:scale-95"
                          />
                          <div className="flex-1">
                            <div className={`font-medium text-lg ${p.purchased ? 'line-through text-gray-400' : 'text-gray-900'}`}>
                              {p.nom}
                            </div>
                            <div className="text-sm text-gray-500">
                              Qté: {p.quantite} {p.prix && `• $${p.prix.toFixed(2)}`}
                            </div>
                          </div>
                        </div>
                        {p.purchased && (
                          <span className="text-green-600 font-bold text-xl animate-fade-in">✓</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* List View */}
      {viewMode === 'list' && (
        <div className="bg-white rounded-lg shadow divide-y">
          {products.map(p => (
            <div key={p.id} className="p-4 hover:bg-gray-50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1">
                  <input
                    type="checkbox"
                    checked={p.purchased || false}
                    onChange={() => togglePurchased(p)}
                    className="w-5 h-5 text-blue-600 rounded transition-transform active:scale-95"
                  />
                  <div className="flex-1">
                    <div className={`font-medium ${p.purchased ? 'line-through text-gray-400' : 'text-gray-800'}`}>
                      {p.nom}
                    </div>
                    <div className="text-sm text-gray-500">
                      {p.quantite} • {p.magasin || 'Non assigné'} {p.prix && `• $${p.prix.toFixed(2)}`}
                    </div>
                  </div>
                </div>
                {p.purchased && (
                  <span className="text-green-600 font-medium">✓</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {products.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          Aucun produit dans la liste. Ajoute des produits depuis la page Liste.
        </div>
      )}
    </div>
  )
}
