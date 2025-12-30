import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { AlertTriangle, Merge, X } from 'lucide-react'
import Button from './Button'

/**
 * Modal pour gérer la détection et fusion de doublons
 *
 * @param {Object} props
 * @param {Object} props.newProduct - Le nouveau produit à ajouter
 * @param {Object} props.existingProduct - Le produit existant dans la liste
 * @param {Function} props.onMerge - Callback quand l'utilisateur choisit de fusionner (augmenter quantité)
 * @param {Function} props.onAddAnyway - Callback quand l'utilisateur choisit d'ajouter quand même
 * @param {Function} props.onCancel - Callback pour annuler
 */
export default function DuplicateModal({ newProduct, existingProduct, onMerge, onAddAnyway, onCancel }) {
  const [mergeAction, setMergeAction] = useState('increase') // 'increase' | 'replace'

  if (!newProduct || !existingProduct) return null

  const handleMerge = () => {
    if (mergeAction === 'increase') {
      // Augmenter la quantité du produit existant
      const newQuantity = (existingProduct.quantite || 1) + (newProduct.quantite || 1)
      onMerge(existingProduct.id, { quantite: newQuantity })
    } else {
      // Remplacer par le nouveau produit
      onMerge(existingProduct.id, newProduct)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center">
            <AlertTriangle className="w-6 h-6 text-orange-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-gray-900">Doublon détecté</h3>
            <p className="text-sm text-gray-600">Ce produit existe déjà dans votre liste</p>
          </div>
          <button
            onClick={onCancel}
            className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Comparison */}
        <div className="space-y-3 mb-6">
          <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-xs text-blue-600 font-medium mb-1">Produit existant</p>
            <p className="text-gray-900 font-medium">{existingProduct.nom}</p>
            <p className="text-sm text-gray-600">Quantité: {existingProduct.quantite || 1}</p>
            {existingProduct.magasin && (
              <p className="text-sm text-gray-600">Magasin: {existingProduct.magasin}</p>
            )}
          </div>

          <div className="p-3 bg-green-50 rounded-lg border border-green-200">
            <p className="text-xs text-green-600 font-medium mb-1">Nouveau produit</p>
            <p className="text-gray-900 font-medium">{newProduct.nom}</p>
            <p className="text-sm text-gray-600">Quantité: {newProduct.quantite || 1}</p>
            {newProduct.magasin && (
              <p className="text-sm text-gray-600">Magasin: {newProduct.magasin}</p>
            )}
          </div>
        </div>

        {/* Merge Options */}
        <div className="space-y-3 mb-6">
          <p className="text-sm font-medium text-gray-700">Que souhaitez-vous faire?</p>

          <label className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
            <input
              type="radio"
              name="mergeAction"
              value="increase"
              checked={mergeAction === 'increase'}
              onChange={(e) => setMergeAction(e.target.value)}
              className="mt-1"
            />
            <div className="flex-1">
              <p className="font-medium text-gray-900">Augmenter la quantité</p>
              <p className="text-sm text-gray-600">
                Quantité finale: {(existingProduct.quantite || 1) + (newProduct.quantite || 1)}
              </p>
            </div>
          </label>

          <label className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
            <input
              type="radio"
              name="mergeAction"
              value="replace"
              checked={mergeAction === 'replace'}
              onChange={(e) => setMergeAction(e.target.value)}
              className="mt-1"
            />
            <div className="flex-1">
              <p className="font-medium text-gray-900">Remplacer par le nouveau</p>
              <p className="text-sm text-gray-600">
                Le produit existant sera mis à jour
              </p>
            </div>
          </label>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2">
          <Button
            onClick={handleMerge}
            variant="primary"
            className="w-full flex items-center justify-center gap-2"
          >
            <Merge className="w-4 h-4" />
            Fusionner
          </Button>

          <Button
            onClick={onAddAnyway}
            variant="secondary"
            className="w-full"
          >
            Ajouter quand même (créer un doublon)
          </Button>

          <button
            onClick={onCancel}
            className="w-full px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
          >
            Annuler
          </button>
        </div>
      </motion.div>
    </div>
  )
}
