import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getSavedListSnapshots, deleteSavedListSnapshot, loadSavedListSnapshot } from '../services/firestore'
import useFirestoreStore from '../store/useFirestoreStore'
import Button from '../components/Button'
import Card, { CardBody } from '../components/Card'
import Badge from '../components/Badge'
import { useToast } from '../components/ToastProvider'
import { useAuth } from '../contexts/AuthContext'

function formatDate(value) {
  if (!value) return 'Date inconnue'
  try {
    const dateObj = value.toDate ? value.toDate() : new Date(value)
    return dateObj.toLocaleDateString('fr-CA')
  } catch (err) {
    console.warn('[MesListes] Unable to format date', err)
    return 'Date inconnue'
  }
}

export default function MesListes() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [savedLists, setSavedLists] = useState([])
  const [loading, setLoading] = useState(false)
  const { addToast } = useToast()
  const loadProducts = useFirestoreStore((s) => s.loadProducts)

  useEffect(() => {
    if (user?.uid) {
      loadSavedListsFromFirestore()
    } else {
      setSavedLists([])
    }
  }, [user?.uid])

  async function loadSavedListsFromFirestore() {
    try {
      if (!user?.uid) return
      setLoading(true)
      const lists = await getSavedListSnapshots(user.uid)
      setSavedLists(Array.isArray(lists) ? lists : [])
    } catch (error) {
      console.error('[MesListes] Error loading saved lists:', error)
      addToast('Erreur lors du chargement des listes', 'error')
    } finally {
      setLoading(false)
    }
  }

  async function handleLoadList(list) {
    try {
      if (!user?.uid) {
        addToast('Vous devez être connecté', 'error')
        return
      }
      // Load the saved list into the personal list in Firestore
      await loadSavedListSnapshot(user.uid, list.id)
      // Reload products from Firestore store to update the UI
      await loadProducts(user.uid)
      addToast(`Liste "${list.name}" chargée`, 'success')
      navigate('/liste')
    } catch (error) {
      console.error('[MesListes] Error loading list:', error)
      addToast('Erreur lors du chargement de la liste', 'error')
    }
  }

  async function handleDeleteList(list) {
    try {
      if (!confirm('Supprimer cette liste ?')) return
      await deleteSavedListSnapshot(list.id)
      addToast(`Liste "${list.name}" supprimée`, 'success')
      await loadSavedListsFromFirestore()
    } catch (error) {
      console.error('[MesListes] Error deleting list:', error)
      addToast('Erreur lors de la suppression', 'error')
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-4 pb-24">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">Mes Listes</h1>
        <p className="text-gray-600">Gérez vos listes de courses sauvegardées</p>
      </div>

      <div className="mb-6 flex gap-3">
        <Button
          variant="secondary"
          onClick={() => navigate('/liste')}
          className="flex-1"
        >
          ↩️ Retour à la liste
        </Button>
        <Button
          variant="primary"
          onClick={loadSavedListsFromFirestore}
          className="flex-1"
          disabled={loading}
        >
          {loading ? 'Chargement...' : 'Rafraîchir'}
        </Button>
      </div>

      <div className="space-y-4">
        {loading ? (
          <Card>
            <CardBody>
              <p className="text-center text-gray-500 py-8">Chargement des listes...</p>
            </CardBody>
          </Card>
        ) : savedLists.length === 0 ? (
          <Card>
            <CardBody>
              <p className="text-center text-gray-500 py-8">
                Aucune liste sauvegardée.
                <br />
                Utilisez le bouton "Sauvegarder" dans votre liste pour en créer une.
              </p>
            </CardBody>
          </Card>
        ) : (
          savedLists.map(list => {
            const products = list.products || []
            return (
              <Card key={list.id}>
                <CardBody>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-lg font-semibold truncate">{list.name || 'Sans nom'}</h3>
                        <Badge variant="secondary">{products.length} produit{products.length > 1 ? 's' : ''}</Badge>
                      </div>
                      <div className="text-sm text-gray-600">
                        📅 Créée le {formatDate(list.createdAt)}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleLoadList(list)}
                        disabled={loading}
                      >
                        Charger
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => handleDeleteList(list)}
                        disabled={loading}
                      >
                        Supprimer
                      </Button>
                    </div>
                  </div>

                  {products.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <p className="text-sm text-gray-600 mb-2">Aperçu :</p>
                      <div className="flex flex-wrap gap-2">
                        {products.slice(0, 5).map((p, idx) => (
                          <Badge key={`${list.id}-prod-${idx}`} variant="secondary">
                            {p.nom} {p.quantite > 1 ? `×${p.quantite}` : ''}
                          </Badge>
                        ))}
                        {products.length > 5 && (
                          <Badge variant="secondary">+{products.length - 5}</Badge>
                        )}
                      </div>
                    </div>
                  )}
                </CardBody>
              </Card>
            )
          })
        )}
      </div>
    </div>
  )
}
