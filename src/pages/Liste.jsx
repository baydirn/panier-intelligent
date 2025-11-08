import React, {useState, useEffect, useMemo} from 'react'
import { useNavigate } from 'react-router-dom'
import ProductItem from '../components/ProductItem'
import useAppStore from '../store/useAppStore'
import { getRecurrentProducts, startNewListSession, recordOccurrencesForCurrentList, detectRecurrentCandidates, addRecurrentProduct, ignoreRecurrentSuggestion, clearCurrentList, getCurrentListId, saveCurrentListAs, getSavedLists } from '../services/db'
import { useToast } from '../components/ToastProvider'
import Button from '../components/Button'
import Input from '../components/Input'
import Card from '../components/Card'
import Badge from '../components/Badge'
import Modal from '../components/Modal'
import AddProductModal from '../components/AddProductModalNew'
import EditProductModal from '../components/EditProductModal'
import { fetchBestOffers } from '../services/pricing'
import { recordPriceObservation, getPriceAlert } from '../services/db'

export default function Liste(){
  const navigate = useNavigate()
  const products = useAppStore(s => s.products)
  const addProduct = useAppStore(s => s.addProduct)
  const updateProduct = useAppStore(s => s.updateProduct)
  const removeProduct = useAppStore(s => s.removeProduct)
  const loadProducts = useAppStore(s => s.loadProducts)
  const { addToast } = useToast()
  
  const [name, setName] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [filterRecurrent, setFilterRecurrent] = useState('all')
  const [filterPurchased, setFilterPurchased] = useState('all')
  const [sortBy, setSortBy] = useState('date')
  const [suggestions, setSuggestions] = useState([])
  const [showFilters, setShowFilters] = useState(false)
  const [currentListId, setCurrentListId] = useState(null)
  const [showSaveModal, setShowSaveModal] = useState(false)
  const [saveListName, setSaveListName] = useState('')
  const [showSaveOnlyModal, setShowSaveOnlyModal] = useState(false)
  const [showAddProductModal, setShowAddProductModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [productToEdit, setProductToEdit] = useState(null)

  useEffect(()=>{
    loadProducts().catch(()=>{})
    loadCurrentListId()
  }, [])

  async function loadCurrentListId(){
    const id = await getCurrentListId()
    setCurrentListId(id)
  }

  async function onAdd(){
    if(!name.trim()) return
    
    // Check if product already exists (case-insensitive)
    const normalizedName = name.trim().toLowerCase()
    const existingProduct = products.find(p => p.nom?.toLowerCase() === normalizedName)
    
    if(existingProduct){
      addToast(`"${name.trim()}" est déjà dans la liste`, 'error')
      setName('')
      return
    }
    
    await addProduct({nom: name.trim(), quantite:1, recurrent:false, magasin:null, prix:null})
    setName('')
    addToast('Produit ajouté ✅', 'success')
  }

  async function handleAddProductFromModal(productData) {
    // Check if product already exists
    const normalizedName = productData.nom.toLowerCase()
    const existingProduct = products.find(p => p.nom?.toLowerCase() === normalizedName)
    
    if(existingProduct){
      addToast(`"${productData.nom}" est déjà dans la liste`, 'error')
      setShowAddProductModal(false)
      return
    }
    
    await addProduct({
      nom: productData.nom,
      quantite: productData.quantite || 1,
      recurrent: false,
      magasin: null,
      prix: null
    })
    setShowAddProductModal(false)
    addToast('Produit ajouté ✅', 'success')
  }

  function handleEditProduct(product) {
    setProductToEdit(product)
    setShowEditModal(true)
  }

  async function handleSaveEditedProduct(updatedProduct) {
    await updateProduct(updatedProduct.id, updatedProduct)
    setShowEditModal(false)
    setProductToEdit(null)
    addToast('Produit modifié ✅', 'success')
  }

  async function handleFetchPrice(product){
    try{
      const offers = await fetchBestOffers({ name: product.nom })
      if(!offers || offers.length === 0){
        addToast('Aucune offre trouvée', 'error')
        return
      }
      const best = offers[0]
      await updateProduct(product.id, { prix: best.price, magasin: best.store })
      await recordPriceObservation(product.nom, best.store, best.price)
      const alert = await getPriceAlert(product.nom)
      if(alert && best.price <= alert.targetPrice){
        addToast(`🔔 Promo: ${product.nom} à ${best.price.toFixed(2)}$ chez ${best.store}`,'success')
      } else {
        addToast(`Meilleur prix: ${best.price.toFixed(2)}$ chez ${best.store}`,'success')
      }
    } catch(e){
      addToast('Erreur lors de la récupération des prix', 'error')
    }
  }

  async function onNewList(){
    try {
      if(products.length > 0){
        // Show save modal
        const defaultName = `Liste ${new Date().toLocaleDateString()}`
        setSaveListName(defaultName)
        setShowSaveModal(true)
      } else {
        // No products, just create new list
        await createNewList()
      }
    } catch(error) {
      console.error('Error in onNewList:', error)
      addToast('Erreur lors de la création de la liste', 'error')
    }
  }

  async function onSaveList(){
    try {
      if(products.length === 0){
        addToast('Aucun produit à sauvegarder', 'error')
        return
      }
      
      // Get current list name if exists
      let defaultName = `Liste ${new Date().toLocaleDateString()}`
      if(currentListId){
        const lists = await getSavedLists()
        const currentList = lists.find(l => l.id === currentListId)
        if(currentList) {
          defaultName = currentList.name
        }
      }
      
      setSaveListName(defaultName)
      setShowSaveOnlyModal(true)
    } catch(error) {
      console.error('Error in onSaveList:', error)
      addToast('Erreur lors de l\'ouverture du modal', 'error')
    }
  }

  async function handleSaveOnly(){
    if(!saveListName.trim()){
      addToast('Veuillez entrer un nom pour la liste', 'error')
      return
    }
    await saveCurrentListAs(saveListName.trim())
    await loadCurrentListId()
    setShowSaveOnlyModal(false)
    setSaveListName('')
    addToast('Liste sauvegardée ✅', 'success')
  }

  async function handleSaveAndNewList(){
    if(!saveListName.trim()){
      addToast('Veuillez entrer un nom pour la liste', 'error')
      return
    }
    await saveCurrentListAs(saveListName.trim())
    setShowSaveModal(false)
    setSaveListName('')
    addToast('Liste sauvegardée ✅', 'success')
    await createNewList()
  }

  async function handleNoSaveNewList(){
    setShowSaveModal(false)
    setSaveListName('')
    await createNewList()
  }

  async function createNewList(){
    try {
      // Clear current list
      await clearCurrentList()
      await loadProducts()
      setCurrentListId(null)
      
      // start a new session
      await startNewListSession()
      
      // load active recurrent products and add to list preventing duplicates
      const rec = (await getRecurrentProducts()).filter(r => r.active)
      if(rec.length){
        for(const r of rec){
          await addProduct({ nom: r.name, quantite: r.default_quantity || 1, magasin: r.default_store || null, recurrent: false })
        }
        await loadProducts()
        addToast('Produits récurrents ajoutés automatiquement ✅', 'success')
      } else {
        addToast('Nouvelle liste créée ✅', 'success')
      }
      
      // record occurrences and compute suggestions
      const names = rec.map(r => r.name)
      await recordOccurrencesForCurrentList(names)
      const cands = await detectRecurrentCandidates()
      setSuggestions(cands || [])
    } catch(error) {
      console.error('Error creating new list:', error)
      addToast('Erreur lors de la création de la liste', 'error')
    }
  }

  // Filter and sort products
  const filteredProducts = useMemo(() => {
    let result = [...products]

    // Search filter
    if(searchQuery.trim()){
      const query = searchQuery.toLowerCase()
      result = result.filter(p => 
        p.nom?.toLowerCase().includes(query) || 
        p.magasin?.toLowerCase().includes(query)
      )
    }

    // Recurrent filter
    if(filterRecurrent === 'recurrent'){
      result = result.filter(p => p.recurrent)
    } else if(filterRecurrent === 'normal'){
      result = result.filter(p => !p.recurrent)
    }

    // Purchased filter
    if(filterPurchased === 'purchased'){
      result = result.filter(p => p.purchased)
    } else if(filterPurchased === 'pending'){
      result = result.filter(p => !p.purchased)
    }

    // Sort
    if(sortBy === 'name'){
      result.sort((a, b) => (a.nom || '').localeCompare(b.nom || ''))
    } else if(sortBy === 'price'){
      result.sort((a, b) => {
        const ap = a.prix
        const bp = b.prix
        if(ap == null && bp == null) return 0
        if(ap == null) return 1
        if(bp == null) return -1
        return (bp - ap)
      })
    }
    // 'date' is default (already in order from store)

    return result
  }, [products, searchQuery, filterRecurrent, filterPurchased, sortBy])

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 animate-fade-in">
      {/* Header section */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-900">Ma liste d'épicerie</h2>
          <div className="flex gap-2">
            <Button 
              onClick={onSaveList} 
              variant="primary" 
              size="sm"
            >
              💾 Enregistrer
            </Button>
            <Button 
              onClick={onNewList} 
              variant="success" 
              size="sm"
            >
              ➕ Nouvelle
            </Button>
          </div>
        </div>
        {/* Stats */}
        <div className="flex items-center gap-4 text-sm text-gray-600">
          <span>{products.length} produit{products.length !== 1 ? 's' : ''}</span>
          {products.filter(p => p.purchased).length > 0 && (
            <Badge variant="success">{products.filter(p => p.purchased).length} acheté{products.filter(p => p.purchased).length > 1 ? 's' : ''}</Badge>
          )}
          {products.filter(p => p.recurrent).length > 0 && (
            <Badge variant="info">{products.filter(p => p.recurrent).length} récurrent{products.filter(p => p.recurrent).length > 1 ? 's' : ''}</Badge>
          )}
        </div>
      </div>

      {/* Suggestions IA */}
      {suggestions.length > 0 && (
        <Card className="mb-4 bg-yellow-50 border-yellow-200">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="text-2xl">💡</span>
              <div>
                <p className="font-medium text-yellow-900">Produit fréquent détecté</p>
                <p className="text-sm text-yellow-700">Ajouter <strong>{suggestions[0].name}</strong> aux récurrents ?</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="primary"
                size="sm"
                onClick={async () => {
                  await addRecurrentProduct({ name: suggestions[0].name, active: true, default_quantity: 1 })
                  addToast('Ajouté aux récurrents', 'success')
                  setSuggestions(prev => prev.slice(1))
                }}
              >
                Oui
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={async () => {
                  await ignoreRecurrentSuggestion(suggestions[0].name)
                  setSuggestions(prev => prev.slice(1))
                }}
              >
                Non merci
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Add Product Zone */}
      <Card className="mb-6">
        <div className="flex gap-2">
          <Input
            value={name}
            onChange={e => setName(e.target.value)}
            onKeyPress={e => e.key === 'Enter' && onAdd()}
            placeholder="Ajout rapide..."
            className="flex-1"
          />
          <Button onClick={onAdd} size="md">
            ➕
          </Button>
          <Button onClick={() => setShowAddProductModal(true)} variant="secondary" size="md">
            📝 Détails
          </Button>
        </div>
      </Card>

      {/* Filter Bar */}
      <Card className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-gray-900">Filtres & Recherche</h3>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="text-sm text-blue-600 hover:underline"
          >
            {showFilters ? 'Masquer' : 'Afficher'}
          </button>
        </div>
        
        {showFilters && (
          <div className="space-y-3 animate-fade-in">
            <Input
              placeholder="🔍 Rechercher par nom ou magasin..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                <select
                  value={filterRecurrent}
                  onChange={e => setFilterRecurrent(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">Tous</option>
                  <option value="recurrent">Récurrents</option>
                  <option value="normal">Non-récurrents</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Statut</label>
                <select
                  value={filterPurchased}
                  onChange={e => setFilterPurchased(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">Tous</option>
                  <option value="pending">À acheter</option>
                  <option value="purchased">Achetés</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Trier par</label>
                <select
                  value={sortBy}
                  onChange={e => setSortBy(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="date">Date d'ajout</option>
                  <option value="name">Nom (A-Z)</option>
                  <option value="price">Prix (décroissant)</option>
                </select>
              </div>
            </div>

            {(searchQuery || filterRecurrent !== 'all' || filterPurchased !== 'all') && (
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm text-gray-600">Filtres actifs:</span>
                {searchQuery && <Badge>"{searchQuery}"</Badge>}
                {filterRecurrent !== 'all' && (
                  <Badge variant="info">{filterRecurrent === 'recurrent' ? 'Récurrents' : 'Non-récurrents'}</Badge>
                )}
                {filterPurchased !== 'all' && (
                  <Badge variant="purple">{filterPurchased === 'purchased' ? 'Achetés' : 'À acheter'}</Badge>
                )}
                <button
                  onClick={() => {
                    setSearchQuery('')
                    setFilterRecurrent('all')
                    setFilterPurchased('all')
                  }}
                  className="text-sm text-gray-500 hover:text-gray-700 underline"
                >
                  Réinitialiser
                </button>
              </div>
            )}
          </div>
        )}
      </Card>

      {/* Products List */}
      <div className="space-y-3">
        {filteredProducts.length === 0 && (
          <Card className="text-center py-12 bg-gray-50">
            <p className="text-gray-500">
              {products.length === 0 
                ? "Aucun produit pour l'instant. Ajoute-en un ci-dessus !" 
                : "Aucun produit ne correspond aux filtres."}
            </p>
          </Card>
        )}
        {filteredProducts.map(p => (
          <ProductItem
            key={p.id}
            product={p}
            onToggle={async (prod) => {
              await updateProduct(prod.id, { recurrent: !prod.recurrent })
            }}
            onDelete={async (id) => {
              await removeProduct(id)
            }}
            onEdit={handleEditProduct}
            onPrice={handleFetchPrice}
          />
        ))}
      </div>

      {/* Save Modal */}
      {showSaveModal && (
        <Modal onClose={() => setShowSaveModal(false)}>
          <div className="p-6">
            <h2 className="text-xl font-bold mb-4">Sauvegarder la liste actuelle ?</h2>
            <p className="text-gray-600 mb-4">
              Vous avez {products.length} produit{products.length > 1 ? 's' : ''} dans votre liste actuelle.
            </p>
            
            <Input
              label="Nom de la liste"
              value={saveListName}
              onChange={(e) => setSaveListName(e.target.value)}
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
                onClick={() => setShowSaveModal(false)}
                className="w-full"
              >
                ✖️ Annuler
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Modal Save Only */}
      {showSaveOnlyModal && (
        <Modal onClose={() => setShowSaveOnlyModal(false)}>
          <div className="p-6">
            <h2 className="text-xl font-bold mb-4">💾 Enregistrer la liste</h2>
            <p className="text-gray-600 mb-4">
              {currentListId 
                ? 'Modifier le nom de la liste existante ou créer une nouvelle sauvegarde.'
                : 'Donner un nom à votre liste pour la sauvegarder.'}
            </p>
            
            <Input
              label="Nom de la liste"
              value={saveListName}
              onChange={(e) => setSaveListName(e.target.value)}
              placeholder="Ex: Courses de la semaine"
              autoFocus
              className="mb-6"
            />

            <div className="flex gap-3">
              <Button
                variant="secondary"
                onClick={() => {
                  setShowSaveOnlyModal(false)
                  setSaveListName('')
                }}
                className="flex-1"
              >
                Annuler
              </Button>
              <Button
                variant="primary"
                onClick={handleSaveOnly}
                className="flex-1"
                disabled={!saveListName.trim()}
              >
                💾 Enregistrer
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Modal d'ajout de produit avec détails */}
      {showAddProductModal && (
        <AddProductModal
          isOpen={showAddProductModal}
          onClose={() => setShowAddProductModal(false)}
          onAdd={handleAddProductFromModal}
        />
      )}

      {/* Modal d'édition de produit */}
      {showEditModal && productToEdit && (
        <EditProductModal
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false)
            setProductToEdit(null)
          }}
          product={productToEdit}
          onSave={handleSaveEditedProduct}
        />
      )}
    </div>
  )
}
