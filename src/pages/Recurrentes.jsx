import React, { useEffect, useState } from 'react'
import { getRecurrentProducts, addRecurrentProduct, updateRecurrentProduct, deleteRecurrentProduct, toggleRecurrentProduct } from '../services/db'
import useAppStore from '../store/useAppStore'
import { useToast } from '../components/ToastProvider'
import Button from '../components/Button'
import Input from '../components/Input'
import Card from '../components/Card'
import Modal from '../components/Modal'

export default function Recurrentes(){
  const addProduct = useAppStore(s => s.addProduct)
  const products = useAppStore(s => s.products)
  const { addToast } = useToast()

  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [form, setForm] = useState({ name: '', default_quantity: 1, default_store: '' })
  const [editingItem, setEditingItem] = useState(null)
  const [editForm, setEditForm] = useState({ name: '', default_quantity: 1, default_store: '' })

  async function refresh(){
    setLoading(true)
    try{ setItems(await getRecurrentProducts()) } finally { setLoading(false) }
  }

  useEffect(() => { refresh() }, [])

  async function onAdd(){
    const name = form.name.trim()
    if(!name) return
    await addRecurrentProduct({ name, default_quantity: Number(form.default_quantity) || 1, default_store: form.default_store || null, active: true })
    setForm({ name: '', default_quantity: 1, default_store: '' })
    setShowAddForm(false)
    addToast('Produit récurrent ajouté', 'success')
    refresh()
  }

  async function onToggleActive(item){
    await toggleRecurrentProduct(item.id, !item.active)
    refresh()
  }

  async function onDelete(item){
    if(confirm(`Supprimer "${item.name}" des récurrents ?`)){
      await deleteRecurrentProduct(item.id)
      addToast('Produit récurrent supprimé', 'info')
      refresh()
    }
  }

  async function onChangeQty(item, qty){
    const v = Math.max(1, parseInt(qty) || 1)
    await updateRecurrentProduct(item.id, { default_quantity: v })
    refresh()
  }

  async function onAddToList(item){
    // Check for duplicates
    const normalizedName = item.name.toLowerCase()
    const existingProduct = products.find(p => p.nom?.toLowerCase() === normalizedName)
    
    if(existingProduct){
      // Fusionner: addition quantités, conserver magasin existant si défini sinon prendre default_store
      const newQty = (existingProduct.quantite || 1) + (item.default_quantity || 1)
      const newStore = existingProduct.magasin || (item.default_store || null)
      await useAppStore.getState().updateProduct(existingProduct.id, { quantite: newQty, magasin: newStore })
      addToast(`Quantité fusionnée (+${item.default_quantity || 1})`, 'success')
      return
    }

    await addProduct({ nom: item.name, quantite: item.default_quantity || 1, magasin: item.default_store || null, recurrent: false })
    addToast('Ajouté à la liste ✅', 'success')
  }

  function openEditModal(item){
    setEditingItem(item)
    setEditForm({ name: item.name, default_quantity: item.default_quantity || 1, default_store: item.default_store || '' })
  }

  async function saveEdit(){
    if(!editingItem || !editForm.name.trim()) return
    await updateRecurrentProduct(editingItem.id, {
      name: editForm.name.trim(),
      default_quantity: Number(editForm.default_quantity) || 1,
      default_store: editForm.default_store.trim() || null
    })
    addToast('Produit mis à jour', 'success')
    setEditingItem(null)
    refresh()
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Produits récurrents</h2>
          <p className="text-sm text-gray-600 mt-1">Gérer, activer/désactiver, et ajouter à la liste</p>
        </div>
        <Button onClick={() => setShowAddForm(!showAddForm)} variant="primary">
          + Ajouter un produit
        </Button>
      </div>

      {showAddForm && (
        <Card className="mb-6">
          <h3 className="font-semibold mb-4">Nouveau produit récurrent</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <Input
              placeholder="Nom"
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
            />
            <Input
              type="number"
              min="1"
              placeholder="Quantité"
              value={form.default_quantity}
              onChange={e => setForm({ ...form, default_quantity: e.target.value })}
            />
            <Input
              placeholder="Magasin (optionnel)"
              value={form.default_store}
              onChange={e => setForm({ ...form, default_store: e.target.value })}
            />
          </div>
          <div className="flex gap-2">
            <Button onClick={onAdd} variant="success">Ajouter</Button>
            <Button onClick={() => setShowAddForm(false)} variant="secondary">Annuler</Button>
          </div>
        </Card>
      )}

      {loading && (
        <div className="text-gray-500">Chargement…</div>
      )}

      {!loading && items.length === 0 && (
        <Card className="text-center py-12 bg-gray-50">
          <p className="text-gray-500">Aucun produit récurrent.</p>
          <p className="text-sm text-gray-400">Ajoute-en ci-dessus pour commencer.</p>
        </Card>
      )}

      {!loading && items.length > 0 && (
        <div className="space-y-3">
          {items.map((it) => (
            <Card key={it.id} hover className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-4 flex-1">
                {/* Toggle switch */}
                <button
                  onClick={() => onToggleActive(it)}
                  className={`w-12 h-7 rounded-full relative transition-all active:scale-95 ${it.active ? 'bg-green-500' : 'bg-gray-300'}`}
                  aria-label="Activer / désactiver"
                >
                  <span className={`absolute top-1 left-1 w-5 h-5 rounded-full bg-white transition-transform ${it.active ? 'translate-x-5' : ''}`} />
                </button>

                <div className="flex-1">
                  <div className="font-medium text-gray-900">{it.name}</div>
                  <div className="text-sm text-gray-500">
                    {it.default_store ? it.default_store : 'Magasin non défini'} • Qté: {it.default_quantity || 1}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button onClick={() => onAddToList(it)} variant="primary" size="sm">+ Ajouter</Button>
                <button
                  onClick={() => openEditModal(it)}
                  className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 active:scale-95 transition"
                  aria-label="Éditer"
                >
                  {/* Pencil icon */}
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                    <path d="M21.731 2.269a2.625 2.625 0 00-3.712 0l-1.157 1.157 3.712 3.712 1.157-1.157a2.625 2.625 0 000-3.712zM19.513 8.199l-3.712-3.712-8.4 8.4a5.25 5.25 0 00-1.32 2.214l-.8 2.685a.75.75 0 00.933.933l2.685-.8a5.25 5.25 0 002.214-1.32l8.4-8.4z"/>
                    <path d="M5.25 5.25a3 3 0 00-3 3v10.5a3 3 0 003 3h10.5a3 3 0 003-3V13.5a.75.75 0 00-1.5 0v5.25a1.5 1.5 0 01-1.5 1.5H5.25a1.5 1.5 0 01-1.5-1.5V8.25a1.5 1.5 0 011.5-1.5h5.25a.75.75 0 000-1.5H5.25z"/>
                  </svg>
                </button>
                <button
                  onClick={() => onDelete(it)}
                  className="p-2 rounded-lg text-red-600 hover:bg-red-50 active:scale-95 transition"
                  aria-label="Supprimer"
                >
                  {/* Trash icon */}
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                    <path d="M9 3.75A.75.75 0 019.75 3h4.5a.75.75 0 01.75.75V6h4.25a.75.75 0 010 1.5H4.75a.75.75 0 010-1.5H9V3.75zM6.75 9h10.5l-.67 10.05A2.25 2.25 0 0114.34 21H9.66a2.25 2.25 0 01-2.24-1.95L6.75 9z"/>
                  </svg>
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Modal */}
      <Modal
        isOpen={!!editingItem}
        onClose={() => setEditingItem(null)}
        title="Éditer le produit récurrent"
        footer={
          <>
            <Button onClick={() => setEditingItem(null)} variant="secondary" size="sm">Annuler</Button>
            <Button onClick={saveEdit} variant="primary" size="sm">Enregistrer</Button>
          </>
        }
      >
        <div className="space-y-3">
          <Input
            label="Nom du produit"
            value={editForm.name}
            onChange={e => setEditForm({ ...editForm, name: e.target.value })}
          />
          <Input
            label="Quantité par défaut"
            type="number"
            min="1"
            value={editForm.default_quantity}
            onChange={e => setEditForm({ ...editForm, default_quantity: e.target.value })}
          />
          <Input
            label="Magasin par défaut"
            value={editForm.default_store}
            onChange={e => setEditForm({ ...editForm, default_store: e.target.value })}
            placeholder="Optionnel"
          />
        </div>
      </Modal>
    </div>
  )
}
