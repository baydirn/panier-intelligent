import React, { useMemo, useState } from 'react'
import useAppStore from '../store/useAppStore'
import { useToast } from './ToastProvider'
import { suggestSimilarProducts } from '../services/suggestions'
import PriceHistorySparkline from './PriceHistorySparkline'
import PriceHistoryModal from './PriceHistoryModal'

export default function ProductItem({ product, onToggle, onDelete, onEdit, onPrice }){
  const duplicateInfo = useDuplicateInfo(product)

  const updateProduct = useAppStore(s => s.updateProduct)
  const removeProduct = useAppStore(s => s.removeProduct)
  const products = useAppStore(s => s.products)
  const { addToast } = useToast()
  const [showHistory, setShowHistory] = useState(false)

  async function inc(){ await updateProduct(product.id, { quantite: (product.quantite || 1) + 1 }) }
  async function dec(){ await updateProduct(product.id, { quantite: Math.max(1, (product.quantite || 1) - 1) }) }

  async function mergeDuplicates(){
    if(!duplicateInfo || duplicateInfo.others.length === 0) return
    let totalQty = product.quantite || 1
    for(const o of duplicateInfo.others){ totalQty += (o.quantite || 1) }
    // Keep current product as canonical; remove others
    for(const o of duplicateInfo.others){
      if(o.id !== product.id){ try{ await removeProduct(o.id) }catch{} }
    }
    await updateProduct(product.id, { quantite: totalQty })
    addToast(`Fusion effectuée (${duplicateInfo.others.length} doublon(s))`, 'success')
  }

  return (
    <>
  <div className="bg-white rounded-xl shadow-sm border p-4 transition-all animate-fade-in">
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1">
          <div className="font-medium text-gray-900">
            {product.nom}
            {product.recurrent && <span className="ml-2 text-xs text-green-600">récurrent</span>}
            <DuplicateBadge product={product} />
          </div>
          <div className="text-sm text-gray-500 flex items-center gap-2 flex-wrap">
            <span>{product.magasin || '—'}</span>
            {product.marque && <span className="text-xs bg-purple-50 text-purple-700 px-1.5 py-0.5 rounded">Marque: {product.marque}</span>}
            {product.volume && <span className="text-xs bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded">{product.volume}</span>}
          </div>
          {(product.categorie || (product.tags && product.tags.length > 0)) && (
            <div className="text-xs text-gray-600 mt-1 flex items-center gap-1 flex-wrap">
              {product.categorie && <span className="bg-gray-100 text-gray-700 px-1.5 py-0.5 rounded">{product.categorie}</span>}
              {product.tags && product.tags.map((tag, i) => (
                <span key={i} className="bg-green-50 text-green-700 px-1.5 py-0.5 rounded">{tag}</span>
              ))}
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          {duplicateInfo && duplicateInfo.count > 1 && (
            <div className="inline-flex items-center gap-2 bg-amber-50 text-amber-700 border border-amber-200 rounded-full px-2 py-0.5 text-[10px]" title="Des produits identiques existent (normalisés)">
              <span>doublon ×{duplicateInfo.count}</span>
              <button onClick={mergeDuplicates} className="underline hover:opacity-80">fusionner</button>
            </div>
          )}
          <button onClick={dec} className="w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 active:scale-95 transition">-</button>
          <div className="w-10 text-center font-semibold">{product.quantite || 1}</div>
          <button onClick={inc} className="w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 active:scale-95 transition">+</button>
        </div>
      </div>
      <div className="mt-3 flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <div className="text-sm text-gray-600">
            {product.prix != null 
              ? `${product.prix.toFixed?.(2) ?? product.prix} $`
              : <span className="inline-block text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">Prix indisponible</span>
            }
          </div>
          {product.prix != null && (
            <span className="inline-block text-[10px] px-2 py-0.5 rounded-full border bg-white text-gray-600" title="Source du prix">
              {(
                {
                  manuel: 'Manuel',
                  optimisation: 'Optimisation',
                  weekly: 'Hebdo',
                  ocr: 'OCR',
                  estime: 'Estimé'
                }[product.prixSource]
                ) || 'Source?'}
              {product.autoAssigned ? ' • Auto' : ''}
            </span>
          )}
          {/* Hide sparkline on very small screens to avoid overflow */}
          <div className="hidden sm:block">
            <button onClick={() => setShowHistory(true)} className="hover:opacity-80 active:scale-[0.98]">
              <PriceHistorySparkline name={product.nom} />
            </button>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => onPrice && onPrice(product)} className="px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-xs md:text-sm active:scale-95 transition">💵 Prix</button>
          <button onClick={() => onEdit && onEdit(product)} className="px-3 py-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 text-xs md:text-sm active:scale-95 transition">✏️ Modifier</button>
            <button onClick={() => onToggle && onToggle(product)} className="px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-xs md:text-sm active:scale-95 transition">Récurrent</button>
          <button onClick={() => onDelete && onDelete(product.id)} className="px-3 py-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 text-xs md:text-sm active:scale-95 transition">Supprimer</button>
        </div>
      </div>

      {/* Alternatives */}
      <AlternativesRow productName={product.nom} onReplace={async (name) => {
        const targetName = String(name || '').trim()
        if(!targetName) return
        // Si un autre produit possède déjà ce nom, fusionner quantités et supprimer l'autre
        const other = products.find(p => (p.nom || '').toLowerCase() === targetName.toLowerCase() && p.id !== product.id)
        let newQty = product.quantite || 1
        if(other){ newQty += (other.quantite || 1) }
        await updateProduct(product.id, { nom: targetName, prix: null, magasin: null, quantite: newQty })
        if(other){ await removeProduct(other.id) }
        addToast('Produit remplacé ✅', 'success')
      }} />
    </div>
    {showHistory && (
      <PriceHistoryModal
        isOpen={showHistory}
        onClose={() => setShowHistory(false)}
        productName={product.nom}
      />
    )}
    </>
  )
}

function useDuplicateInfo(product){
  const products = useAppStore(s => s.products)
  return useMemo(() => {
    const key = product?.nameKey || null
    if(!key){
      // try to match by normalized name if available
      const k = String(product?.nom || '').trim().toLowerCase().replace(/\s+/g,' ')
      const matches = products.filter(p => (p.nom||'').trim().toLowerCase().replace(/\s+/g,' ') === k)
      return matches.length > 1 ? { count: matches.length, others: matches.filter(p=>p.id!==product.id) } : { count: 1, others: [] }
    }
    const group = products.filter(p => p.nameKey === key)
    return { count: group.length, others: group.filter(p => p.id !== product.id) }
  }, [products, product?.nameKey, product?.nom, product?.id])
}

function AlternativesRow({ productName, onReplace }){
  const duplicateInfo = useDuplicateInfo({ nom: productName })
  const [suggestions, setSuggestions] = useState([])
  React.useEffect(() => {
    let active = true
    suggestSimilarProducts(productName, 6).then(res => { if(active) setSuggestions(res) })
    return () => { active = false }
  }, [productName])
  if(!suggestions || suggestions.length === 0) return null
  return (
    <div className="mt-3">
      <div className="text-xs text-gray-500 mb-2">Alternatives (basées sur le prix et le prix unitaire)</div>
      <div className="flex flex-wrap gap-2">
        {suggestions.map((s, idx) => {
          const savingText = s.saving != null && s.saving > 0 ? ` (-${s.saving.toFixed(2)}$)` : ''
          const unitSavingText = s.unitSaving != null && s.unitSaving > 0 ? ` (↓/u)` : ''
          return (
            <button
              key={idx}
              onClick={() => onReplace && onReplace(s.name)}
              className="px-2.5 py-1 rounded-full text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-200"
              title={`${s.type === 'brand' ? 'Marque alternative' : 'Même catégorie'}\nPrix base: ${s.basePrice != null ? s.basePrice.toFixed(2)+'$' : '—'}\nPrix alt: ${s.altPrice != null ? s.altPrice.toFixed(2)+'$' : '—'}\nUnit base: ${s.baseUnitPrice?.per != null ? s.baseUnitPrice.per.toFixed(3)+'$/'+(s.baseUnitPrice.unit||'u') : '—'}\nUnit alt: ${s.altUnitPrice?.per != null ? s.altUnitPrice.per.toFixed(3)+'$/'+(s.altUnitPrice.unit||'u') : '—'}${s.unitSaving != null ? '\nGain unitaire: '+s.unitSaving.toFixed(3) : ''}`}
            >
              ↻ {s.name}{savingText}{unitSavingText}
            </button>
          )
        })}
      </div>
    </div>
  )
}
