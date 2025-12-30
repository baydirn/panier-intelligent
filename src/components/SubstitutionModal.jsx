import React from 'react'
import Modal from './Modal'
import Button from './Button'
import Badge from './Badge'
import { TrendingDown, Package } from 'lucide-react'

/**
 * Modal pour afficher des produits similaires moins chers
 * Permet à l'utilisateur de remplacer le produit actuel par une alternative économique
 */
export default function SubstitutionModal({
  isOpen,
  onClose,
  product,        // Produit actuel: {nom, prix, magasin}
  alternatives,   // Tableau substituts: [{nom, prix, magasin, savings, savingsPct}]
  onSelect        // Callback quand user choisit: (alternative) => void
}) {
  if (!product) return null

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="bg-white rounded-lg shadow-lg p-6 max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
            <Package className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-bold">Produits similaires</h3>
            <p className="text-sm text-gray-600">Économisez davantage avec ces alternatives</p>
          </div>
        </div>

        {/* Current product */}
        <div className="mb-4 p-3 bg-gray-50 rounded-lg border">
          <p className="text-xs text-gray-600 mb-1">Produit actuel</p>
          <p className="font-medium">{product.nom}</p>
          <p className="text-sm text-gray-600">
            {product.magasin || 'Aucun magasin'} • {product.prix != null ? `$${product.prix.toFixed(2)}` : 'Prix non disponible'}
          </p>
        </div>

        {/* Alternatives */}
        {alternatives && alternatives.length > 0 ? (
          <div className="space-y-2 max-h-96 overflow-auto">
            <p className="text-xs text-gray-600 mb-2">Cliquez pour remplacer le produit actuel</p>
            {alternatives.map((alt, idx) => (
              <button
                key={idx}
                onClick={() => {
                  onSelect && onSelect(alt)
                  onClose()
                }}
                className="w-full p-3 border rounded-lg hover:bg-blue-50 hover:border-blue-300 transition text-left"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">{alt.nom}</span>
                  {alt.savings > 0 && (
                    <Badge variant="success" className="flex items-center gap-1">
                      <TrendingDown className="w-3 h-3" />
                      -{alt.savingsPct}%
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-gray-600">
                  {alt.magasin} • ${alt.prix.toFixed(2)} •
                  Économie: ${alt.savings.toFixed(2)}
                </p>
              </button>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <p>Aucune alternative moins chère trouvée</p>
          </div>
        )}

        {/* Actions */}
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>Fermer</Button>
        </div>
      </div>
    </Modal>
  )
}
