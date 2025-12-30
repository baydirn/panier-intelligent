import React, { useState } from 'react'
import Modal from './Modal'
import Button from './Button'
import Input from './Input'
import { useAuth } from '../contexts/AuthContext'
import { createSharedList, getUserPersonalList, updateUserPersonalList } from '../services/firestore'

export default function ShareModal({ isOpen, onClose, products, ownerEmail }) {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [shareLink, setShareLink] = useState('')
  const [error, setError] = useState('')

  async function handleShare() {
    setError('')
    setLoading(true)
    try {
      // Check if user is authenticated
      if (!user) {
        throw new Error('Vous devez être connecté pour partager une liste')
      }

      // Step 1: Ensure personal list exists in Firestore with current products
      const personalList = await getUserPersonalList(user.uid)

      // Sync local products to personal list if needed
      if (products && products.length > 0) {
        await updateUserPersonalList(personalList.id, { products })
      }

      // Step 2: Create shared list POINTING to the personal list (not copying products)
      const sharedList = await createSharedList(
        user.uid,
        'Ma liste de courses',
        personalList.id  // Pass userListId instead of products array
      )

      const base = window.location.origin
      const link = `${base}/shared/${sharedList.shareCode}`
      setShareLink(link)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  async function copyLink() {
    if (!shareLink) return
    try {
      await navigator.clipboard.writeText(shareLink)
    } catch (_) {
      /* ignore */
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="bg-white rounded-lg shadow-lg p-6 max-w-lg mx-auto">
        <h2 className="text-xl font-bold mb-4">Partager ma liste</h2>
        <p className="text-sm text-gray-600 mb-4">
          Génère un lien public à partager avec ta famille. La liste sera synchronisée en temps réel.
        </p>

        {error && (
          <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
            {error}
          </div>
        )}

        {shareLink ? (
          <div className="space-y-3">
            <div>
              <label className="text-xs text-gray-500">Lien de partage</label>
              <Input value={shareLink} readOnly className="mt-1" />
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" className="flex-1" onClick={copyLink}>Copier</Button>
              <Button variant="ghost" className="flex-1" onClick={() => window.open(shareLink, '_blank')}>Ouvrir</Button>
            </div>
          </div>
        ) : (
          <Button 
            variant="primary" 
            className="w-full"
            onClick={handleShare}
            disabled={loading}
          >
            {loading ? '⏳ Création du lien...' : 'Générer un lien'}
          </Button>
        )}

        <div className="mt-4 flex justify-end">
          <Button variant="ghost" onClick={onClose}>Fermer</Button>
        </div>
      </div>
    </Modal>
  )
}
