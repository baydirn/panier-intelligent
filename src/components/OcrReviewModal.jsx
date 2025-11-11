import React, { useState } from 'react'
import Button from './Button'
import Input from './Input'

/**
 * Component to review and edit OCR results before submission
 * Allows user to correct errors, remove false positives, add missing products
 */
export default function OcrReviewModal({ products, onSave, onCancel }) {
  const [editedProducts, setEditedProducts] = useState(
    products.map((p, idx) => ({ ...p, id: idx, enabled: true }))
  )
  const [newProduct, setNewProduct] = useState({ name: '', price: '', volume: '' })

  const updateProduct = (id, field, value) => {
    setEditedProducts(prev =>
      prev.map(p => (p.id === id ? { ...p, [field]: value } : p))
    )
  }

  const toggleProduct = (id) => {
    setEditedProducts(prev =>
      prev.map(p => (p.id === id ? { ...p, enabled: !p.enabled } : p))
    )
  }

  const removeProduct = (id) => {
    setEditedProducts(prev => prev.filter(p => p.id !== id))
  }

  const addNewProduct = () => {
    if (!newProduct.name || !newProduct.price) return
    
    const price = parseFloat(newProduct.price)
    if (isNaN(price) || price <= 0) return
    
    setEditedProducts(prev => [
      ...prev,
      {
        id: Date.now(),
        name: newProduct.name.toLowerCase(),
        price: price,
        volume: newProduct.volume || null,
        confidence: 'manual',
        enabled: true
      }
    ])
    
    setNewProduct({ name: '', price: '', volume: '' })
  }

  const handleSave = () => {
    const valid = editedProducts
      .filter(p => p.enabled)
      .map(({ id, enabled, ...rest }) => rest)
    onSave(valid)
  }

  const enabledCount = editedProducts.filter(p => p.enabled).length

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">
            Réviser les produits détectés
          </h2>
          <p className="text-sm text-gray-600 mt-2">
            Vérifiez et corrigez les produits avant de les ajouter. 
            <strong> {enabledCount}</strong> produits seront ajoutés.
          </p>
        </div>

        {/* Product list */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-4">
            {editedProducts.map((product) => (
              <div
                key={product.id}
                className={`border rounded-lg p-4 ${
                  product.enabled ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-gray-50'
                }`}
              >
                <div className="flex items-start gap-4">
                  {/* Enable/disable checkbox */}
                  <input
                    type="checkbox"
                    checked={product.enabled}
                    onChange={() => toggleProduct(product.id)}
                    className="mt-2 h-5 w-5 text-green-600 rounded focus:ring-green-500"
                  />

                  {/* Fields */}
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Nom du produit
                      </label>
                      <input
                        type="text"
                        value={product.name}
                        onChange={(e) => updateProduct(product.id, 'name', e.target.value)}
                        className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        disabled={!product.enabled}
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Prix ($)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={product.price}
                        onChange={(e) => updateProduct(product.id, 'price', parseFloat(e.target.value))}
                        className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        disabled={!product.enabled}
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Volume (optionnel)
                      </label>
                      <input
                        type="text"
                        value={product.volume || ''}
                        onChange={(e) => updateProduct(product.id, 'volume', e.target.value)}
                        placeholder="ex: 3 lb, 500g"
                        className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        disabled={!product.enabled}
                      />
                    </div>
                  </div>

                  {/* Confidence badge + Delete */}
                  <div className="flex flex-col items-end gap-2">
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${
                        product.confidence === 'high'
                          ? 'bg-green-100 text-green-800'
                          : product.confidence === 'medium'
                          ? 'bg-yellow-100 text-yellow-800'
                          : product.confidence === 'manual'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {product.confidence === 'manual' ? '✏️ Manuel' : `🤖 ${product.confidence}`}
                    </span>
                    <button
                      onClick={() => removeProduct(product.id)}
                      className="text-red-600 hover:text-red-800 text-sm font-medium"
                    >
                      ✕ Supprimer
                    </button>
                  </div>
                </div>

                {/* Raw OCR line (debug) */}
                {product.rawLine && (
                  <div className="mt-2 text-xs text-gray-500 font-mono bg-gray-100 p-2 rounded">
                    OCR: {product.rawLine}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Add new product */}
          <div className="mt-6 border-t pt-6">
            <h3 className="font-semibold text-gray-900 mb-3">➕ Ajouter un produit manquant</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <input
                type="text"
                value={newProduct.name}
                onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                placeholder="Nom du produit"
                className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="number"
                step="0.01"
                value={newProduct.price}
                onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                placeholder="Prix ($)"
                className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="text"
                value={newProduct.volume}
                onChange={(e) => setNewProduct({ ...newProduct, volume: e.target.value })}
                placeholder="Volume (optionnel)"
                className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <Button onClick={addNewProduct} variant="secondary">
                Ajouter
              </Button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 flex justify-between items-center bg-gray-50">
          <div className="text-sm text-gray-600">
            {enabledCount} produit{enabledCount > 1 ? 's' : ''} sélectionné{enabledCount > 1 ? 's' : ''}
          </div>
          <div className="flex gap-3">
            <Button onClick={onCancel} variant="secondary">
              Annuler
            </Button>
            <Button onClick={handleSave} variant="primary">
              Confirmer et enregistrer
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
