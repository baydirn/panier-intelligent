import React, { useMemo, useState } from 'react'
import useAppStore from '../store/useAppStore'
import { useToast } from './ToastProvider'
import { suggestSimilarProducts } from '../services/suggestions'
import PriceHistorySparkline from './PriceHistorySparkline'
import PriceHistoryModal from './PriceHistoryModal'

export default function ProductItem({ product, onToggle, onDelete, onEdit, onPrice }){
  const updateProduct = useAppStore(s => s.updateProduct)
  const removeProduct = useAppStore(s => s.removeProduct)
  const products = useAppStore(s => s.products)
  const { addToast } = useToast()
  const [showHistory, setShowHistory] = useState(false)

  async function inc(){ await updateProduct(product.id, { quantite: (product.quantite || 1) + 1 }) }
  async function dec(){ await updateProduct(product.id, { quantite: Math.max(1, (product.quantite || 1) - 1) }) }

  return (
    <>
  <div className="bg-white rounded-xl shadow-sm border p-4 transition-all animate-fade-in">
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1">
          <div className="font-medium text-gray-900">
            {product.nom}
            {product.recurrent && <span className="ml-2 text-xs text-green-600">récurrent</span>}
          </div>
          <div className="text-sm text-gray-500">{product.magasin || '—'}</div>
        </div>
        <div className="flex items-center gap-2">
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

function AlternativesRow({ productName, onReplace }){
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
              title={s.type === 'brand' ? 'Marque alternative' : 'Même catégorie'}
            >
              ↻ {s.name}{savingText}{unitSavingText}
            </button>
          )
        })}
      </div>
    </div>
  )
}
