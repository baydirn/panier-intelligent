import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getSavedLists, createSavedList, updateSavedList, deleteSavedList, loadSavedList, getCurrentListId, saveCurrentListAs, clearCurrentList, startNewListSession, getRecurrentProducts } from '../services/db'
import useAppStore from '../store/useAppStore'
import Button from '../components/Button'
import Card, { CardHeader, CardTitle, CardBody } from '../components/Card'
import Input from '../components/Input'
import Modal from '../components/Modal'
import Badge from '../components/Badge'
import { useToast } from '../components/ToastProvider'

export default function MesListes() {
  const navigate = useNavigate()
  const [savedLists, setSavedLists] = useState([])
  const [currentListId, setCurrentListId] = useState(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showRenameModal, setShowRenameModal] = useState(false)
  const [showNewListModal, setShowNewListModal] = useState(false)
  const [newListName, setNewListName] = useState('')
  const [editingList, setEditingList] = useState(null)
  const loadProducts = useAppStore(state => state.loadProducts)
  const addProduct = useAppStore(state => state.addProduct)
  const products = useAppStore(state => state.products)
  const { addToast } = useToast()

  useEffect(() => {
    loadLists()
  }, [])

  async function loadLists() {
    const lists = await getSavedLists()
    setSavedLists(lists)
    const currentId = await getCurrentListId()
    setCurrentListId(currentId)
  }

  async function handleCreateList() {
    if (!newListName.trim()) return
    await createSavedList(newListName.trim())
    setNewListName('')
    setShowCreateModal(false)
    await loadLists()
  }

  async function handleLoadList(list) {
    await loadSavedList(list.id)
    await loadProducts()
    setCurrentListId(list.id)
    navigate('/liste')
  }

  async function handleRenameList() {
    if (!editingList || !newListName.trim()) return
    await updateSavedList(editingList.id, { name: newListName.trim() })
    setEditingList(null)
    setNewListName('')
    setShowRenameModal(false)
    await loadLists()
  }

  async function handleDeleteList(id) {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette liste ?')) return
    await deleteSavedList(id)
    await loadLists()
  }

  async function handleNewList() {
    if (products.length > 0) {
      // Show modal if there are products
      setNewListName(`Liste ${new Date().toLocaleDateString()}`)
      setShowNewListModal(true)
    } else {
      // No products, just create new list
      await createNewEmptyList()
    }
  }

  async function handleSaveAndNewList() {
    if (!newListName.trim()) {
      addToast('Veuillez entrer un nom pour la liste', 'error')
      return
    }
    await saveCurrentListAs(newListName.trim())
    setShowNewListModal(false)
    setNewListName('')
    addToast('Liste sauvegardée ✅', 'success')
    await loadLists()
    await createNewEmptyList()
  }

  async function handleNoSaveNewList() {
    setShowNewListModal(false)
    setNewListName('')
    await createNewEmptyList()
  }

  async function createNewEmptyList() {
    await clearCurrentList()
    await loadProducts()
    setCurrentListId(null)
    
    // Start new session and add recurrent products
    await startNewListSession()
    const rec = (await getRecurrentProducts()).filter(r => r.active)
    if (rec.length) {
      for (const r of rec) {
        await addProduct({ nom: r.name, quantite: r.default_quantity || 1, magasin: r.default_store || null, recurrent: false })
      }
      await loadProducts()
      addToast('Produits récurrents ajoutés automatiquement ✅', 'success')
    }
    
    navigate('/liste')
  }

  function openRenameModal(list) {
    setEditingList(list)
    setNewListName(list.name)
    setShowRenameModal(true)
  }

  return (
    <div className="max-w-4xl mx-auto p-4 pb-24">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">Mes Listes</h1>
        <p className="text-gray-600">Gérez vos listes de courses sauvegardées</p>
      </div>

      <div className="mb-6 flex gap-3">
        <Button
          variant="primary"
          onClick={handleNewList}
          className="flex-1"
        >
          <span className="text-lg">➕</span> Nouvelle Liste
        </Button>
        <Button
          variant="secondary"
          onClick={() => setShowCreateModal(true)}
          className="flex-1"
        >
          <span className="text-lg">💾</span> Sauvegarder Actuelle
        </Button>
      </div>

      {currentListId && (
        <div className="mb-6 p-4 bg-blue-50 border-l-4 border-blue-500 rounded">
          <p className="text-sm font-medium text-blue-900">
            📋 Liste active : {savedLists.find(l => l.id === currentListId)?.name || 'Sans nom'}
          </p>
        </div>
      )}

      <div className="space-y-4">
        {savedLists.length === 0 ? (
          <Card>
            <CardBody>
              <p className="text-center text-gray-500 py-8">
                Aucune liste sauvegardée.
                <br />
                Créez votre première liste !
              </p>
            </CardBody>
          </Card>
        ) : (
          savedLists.map(list => (
            <Card key={list.id} className={currentListId === list.id ? 'border-2 border-blue-500' : ''}>
              <CardBody>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg font-semibold truncate">{list.name}</h3>
                      {currentListId === list.id && (
                        <Badge variant="primary">Active</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-sm text-gray-600">
                      <span>📦 {list.products.length} produits</span>
                      <span>📅 {new Date(list.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleLoadList(list)}
                      disabled={currentListId === list.id}
                    >
                      {currentListId === list.id ? '✓' : 'Charger'}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openRenameModal(list)}
                    >
                      ✏️
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => handleDeleteList(list.id)}
                    >
                      🗑️
                    </Button>
                  </div>
                </div>

                {list.products.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <p className="text-sm text-gray-600 mb-2">Aperçu :</p>
                    <div className="flex flex-wrap gap-2">
                      {list.products.slice(0, 5).map((p, idx) => (
                        <Badge key={idx} variant="secondary">
                          {p.nom} {p.quantite > 1 ? `×${p.quantite}` : ''}
                        </Badge>
                      ))}
                      {list.products.length > 5 && (
                        <Badge variant="secondary">+{list.products.length - 5}</Badge>
                      )}
                    </div>
                  </div>
                )}
              </CardBody>
            </Card>
          ))
        )}
      </div>

      {/* Modal Create/Save List */}
      {showCreateModal && (
        <Modal
          onClose={() => {
            setShowCreateModal(false)
            setNewListName('')
          }}
        >
          <div className="p-6">
            <h2 className="text-xl font-bold mb-4">Sauvegarder la liste</h2>
            <Input
              label="Nom de la liste"
              value={newListName}
              onChange={(e) => setNewListName(e.target.value)}
              placeholder="Ex: Courses de la semaine"
              autoFocus
            />
            <div className="flex gap-3 mt-6">
              <Button
                variant="secondary"
                onClick={() => {
                  setShowCreateModal(false)
                  setNewListName('')
                }}
                className="flex-1"
              >
                Annuler
              </Button>
              <Button
                variant="primary"
                onClick={handleCreateList}
                className="flex-1"
                disabled={!newListName.trim()}
              >
                Sauvegarder
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Modal Rename List */}
      {showRenameModal && editingList && (
        <Modal
          onClose={() => {
            setShowRenameModal(false)
            setEditingList(null)
            setNewListName('')
          }}
        >
          <div className="p-6">
            <h2 className="text-xl font-bold mb-4">Renommer la liste</h2>
            <Input
              label="Nouveau nom"
              value={newListName}
              onChange={(e) => setNewListName(e.target.value)}
              placeholder="Nouveau nom"
              autoFocus
            />
            <div className="flex gap-3 mt-6">
              <Button
                variant="secondary"
                onClick={() => {
                  setShowRenameModal(false)
                  setEditingList(null)
                  setNewListName('')
                }}
                className="flex-1"
              >
                Annuler
              </Button>
              <Button
                variant="primary"
                onClick={handleRenameList}
                className="flex-1"
                disabled={!newListName.trim()}
              >
                Renommer
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Modal New List with Save Prompt */}
      {showNewListModal && (
        <Modal onClose={() => setShowNewListModal(false)}>
          <div className="p-6">
            <h2 className="text-xl font-bold mb-4">Sauvegarder la liste actuelle ?</h2>
            <p className="text-gray-600 mb-4">
              Vous avez {products.length} produit{products.length > 1 ? 's' : ''} dans votre liste actuelle.
            </p>
            
            <Input
              label="Nom de la liste à sauvegarder"
              value={newListName}
              onChange={(e) => setNewListName(e.target.value)}
              placeholder="Ex: Courses de la semaine"
              className="mb-6"
            />

            <div className="flex flex-col gap-3">
              <Button
                variant="primary"
                onClick={handleSaveAndNewList}
                className="w-full"
              >
                💾 Oui, sauvegarder et créer une nouvelle
              </Button>
              <Button
                variant="secondary"
                onClick={handleNoSaveNewList}
                className="w-full"
              >
                🗑️ Non, créer une nouvelle sans sauvegarder
              </Button>
              <Button
                variant="ghost"
                onClick={() => setShowNewListModal(false)}
                className="w-full"
              >
                ✖️ Annuler
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
