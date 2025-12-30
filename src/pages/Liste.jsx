import React, {useState, useEffect, useMemo} from 'react'
import { useNavigate } from 'react-router-dom'
import ProductItem from '../components/ProductItem'
import useFirestoreStore from '../store/useFirestoreStore'
import { Plus, Users, Sparkles, Settings, Trophy, Save, FilePlus } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { getRecurrentProducts, addRecurrentProduct, ignoreRecurrentSuggestion, getCurrentListId } from '../services/db'
import { savePersonalListAsSnapshot } from '../services/firestore'
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
import { forceRegenerateAllProductIds } from '../services/db'
import localforage from 'localforage'
import ShareModal from '../components/ShareModal'
import { useAuth } from '../contexts/AuthContext'
import { syncSharedListsIfNeeded } from '../services/sharedLists'
import FigmaMotionButton from '../components/FigmaMotionButton'
import DuplicateModal from '../components/DuplicateModal'

export default function Liste(){
  const navigate = useNavigate()
  const products = useFirestoreStore(s => s.products)
  const addProduct = useFirestoreStore(s => s.addProduct)
  const updateProduct = useFirestoreStore(s => s.updateProduct)
  const removeProduct = useFirestoreStore(s => s.removeProduct)
  const removeProducts = useFirestoreStore(s => s.removeProducts)
  const loadProducts = useFirestoreStore(s => s.loadProducts)
  const subscribeToProducts = useFirestoreStore(s => s.subscribeToProducts)
  const unsubscribeFromProducts = useFirestoreStore(s => s.unsubscribeFromProducts)
  const { addToast } = useToast()
  const { user } = useAuth()
  
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
  const [showIds, setShowIds] = useState(false)
  const [showShareModal, setShowShareModal] = useState(false)
    const [sharedMembers, setSharedMembers] = useState([])
  const [showDuplicateModal, setShowDuplicateModal] = useState(false)
  const [duplicateData, setDuplicateData] = useState({ newProduct: null, existingProduct: null })

  useEffect(()=>{
    // Load products from Firestore when user is authenticated
    if (user?.uid) {
      loadProducts(user.uid).then(() => {
        const ids = products.map(p => p.id)
        const duplicates = ids.filter((id, index) => ids.indexOf(id) !== index)
        if (duplicates.length > 0) {
          console.error('[Liste] DUPLICATE IDs FOUND:', duplicates)
          console.error('[Liste] All IDs:', ids)
        }
      }).catch(()=>{})

      // Subscribe to real-time updates
      subscribeToProducts(user.uid)
    }
    loadCurrentListId()

    // Cleanup: unsubscribe on unmount
    return () => {
      unsubscribeFromProducts()
    }
  }, [])

  // Sync shared lists whenever products change
  useEffect(() => {
    let syncTimeout = null
    
    const performSync = async () => {
      try {
        await syncSharedListsIfNeeded(products, user?.email)
      } catch (err) {
        console.error('[Liste] Sync error:', err)
      }
    }

    // Debounce sync to avoid too many API calls
    syncTimeout = setTimeout(performSync, 1000)

    return () => {
      if (syncTimeout) clearTimeout(syncTimeout)
    }
  }, [products, user?.email])

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
      // Show duplicate modal instead of error toast
      setDuplicateData({
        newProduct: productData,
        existingProduct: existingProduct
      })
      setShowDuplicateModal(true)
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
    // Update all provided fields from the modal
    const fields = {
      nom: updatedProduct.nom,
      quantite: updatedProduct.quantite
    }

    // Add optional fields if provided
    if (updatedProduct.magasin !== undefined) {
      fields.magasin = updatedProduct.magasin
    }
    if (updatedProduct.prix !== undefined) {
      fields.prix = updatedProduct.prix
    }
    if (updatedProduct.prixSource !== undefined) {
      fields.prixSource = updatedProduct.prixSource
    }

    await updateProduct(updatedProduct.id, fields)
    setShowEditModal(false)
    setProductToEdit(null)
    addToast('Produit modifié ✅', 'success')
  }
// Handler pour fusionner les doublons  async function handleMergeDuplicate(existingProductId, updates) {    await updateProduct(existingProductId, updates)    setShowDuplicateModal(false)    setDuplicateData({ newProduct: null, existingProduct: null })    setShowAddProductModal(false)    addToast('Produits fusionnes', 'success')  }  // Handler pour ajouter quand meme (creer doublon)  async function handleAddDuplicateAnyway() {    const { newProduct } = duplicateData    await addProduct({      nom: newProduct.nom,      quantite: newProduct.quantite || 1,      recurrent: false,      magasin: newProduct.magasin || null,      prix: newProduct.prix || null    })    setShowDuplicateModal(false)    setDuplicateData({ newProduct: null, existingProduct: null })    setShowAddProductModal(false)    addToast('Produit ajoute', 'success')  }  // Handler pour annuler  function handleCancelDuplicate() {    setShowDuplicateModal(false)    setDuplicateData({ newProduct: null, existingProduct: null })  }

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

    async function handleResetAllData() {
      if (!window.confirm('Vider TOUTES les données (produits, listes, cache) et recharger? Cette action est irréversible.')) return
      try {
        // Clear IndexedDB
        await localforage.clear()
        // Clear localStorage & sessionStorage
        localStorage.clear()
        sessionStorage.clear()
        // Clear caches
        const cacheNames = await caches.keys()
        for (const cacheName of cacheNames) {
          await caches.delete(cacheName)
        }
        addToast('Toutes les données ont été vidées. Rechargement...', 'success')
        setTimeout(() => window.location.reload(), 1000)
      } catch (error) {
        console.error('Error clearing data:', error)
        addToast('Erreur lors du vidage des données', 'error')
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

  async function handleForceIds(){
    try {
      await forceRegenerateAllProductIds()
      await loadProducts()
      addToast('IDs régénérés', 'success')
    } catch(e){
      console.error('ForceIds error', e)
      addToast('Erreur regen IDs', 'error')
    }
  }

  async function onSaveList(){
    try {
      if(products.length === 0){
        addToast('Aucun produit à sauvegarder', 'error')
        return
      }
      
      // Generate default name
      const defaultName = `Liste ${new Date().toLocaleDateString('fr-CA')}`
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
    
    if (!user?.uid) {
      addToast('Vous devez être connecté', 'error')
      return
    }
    
    try {
      console.log('[Liste] Saving list:', saveListName, 'Products:', products.length)
      await savePersonalListAsSnapshot(user.uid, saveListName.trim(), products)
      console.log('[Liste] Save successful')
      setShowSaveOnlyModal(false)
      setSaveListName('')
      addToast('Liste sauvegardée ✅', 'success')
    } catch (error) {
      console.error('[Liste] Error saving list:', error)
      addToast('Erreur lors de la sauvegarde: ' + error.message, 'error')
    }
  }

  async function handleSaveAndNewList(){
    if(!saveListName.trim()){
      addToast('Veuillez entrer un nom pour la liste', 'error')
      return
    }
    
    if (!user?.uid) {
      addToast('Vous devez être connecté', 'error')
      return
    }
    
    await savePersonalListAsSnapshot(user.uid, saveListName.trim(), products)
    // Effacer tous les produits de la liste personnelle
    for (const product of products) {
      await removeProduct(product.id)
    }
    setShowSaveModal(false)
    setSaveListName('')
    addToast('Liste sauvegardée et nouvelle liste créée ✅', 'success')
  }

  async function handleNoSaveNewList(){
    setShowSaveModal(false)
    setSaveListName('')
    await createNewList()
  }

  async function createNewList(){
    try {
      // Remove ALL products from the current list using removeProducts (batch operation)
      const productIds = products.map(p => p.id)
      if (productIds.length > 0) {
        console.log('[Liste] Removing', productIds.length, 'products')
        await removeProducts(productIds)
      }
      
      // Clear local storage
      await clearCurrentList()
      setCurrentListId(null)
      
      // start a new session
      await startNewListSession()
      
      // load active recurrent products and add to list preventing duplicates
      try {
        const rec = (await getRecurrentProducts()).filter(r => r.active)
        if(rec.length){
          for(const r of rec){
            await addProduct({ nom: r.name, quantite: r.default_quantity || 1, magasin: r.default_store || null, recurrent: false })
          }
          addToast('Produits récurrents ajoutés automatiquement ✅', 'success')
        } else {
          addToast('Nouvelle liste créée ✅', 'success')
        }
        
        // record occurrences and compute suggestions
        const names = rec.map(r => r.name)
        await recordOccurrencesForCurrentList(names)
        const cands = await detectRecurrentCandidates()
        setSuggestions(cands || [])
      } catch (recError) {
        console.warn('[Liste] Recurrent products error (non-critical):', recError)
        addToast('Nouvelle liste créée ✅', 'success')
      }
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

    const handleShareClick = () => {
      setShowShareModal(true)
      const shared = JSON.parse(localStorage.getItem('sharedLists') || '[]')
      setSharedMembers(shared.map(s => ({ name: s.ownerEmail?.split('@')[0] || 'Partagé', color: 'bg-blue-500' })))
    }

    const handleOptimizeClick = () => {
      navigate('/analyse')
    }

    const handleSettingsClick = () => {
      navigate('/parametres')
    }

    const handleGamificationClick = () => {
      navigate('/parametres#gamification')
    }

    const totalPrice = useMemo(() => {
      return products.reduce((sum, p) => sum + (p.prix || 0), 0)
    }, [products])

  return (
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-green-50 to-blue-50">
        {/* Header with design HomeScreen */}
        <motion.div
          className="bg-white px-6 pt-8 pb-6 shadow-sm sticky top-0 z-10"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex items-center justify-between mb-6">
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <h1 className="text-2xl font-bold text-gray-900">Ma liste d'épicerie</h1>
              <p className="text-gray-500 mt-1">{products.length} produits · {totalPrice.toFixed(2)} $</p>
            </motion.div>
            <div className="flex gap-2">
              <motion.button
                onClick={onSaveList}
                className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center"
                whileHover={{ scale: 1.1, backgroundColor: 'rgb(187 247 208)' }}
                whileTap={{ scale: 0.95 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
                title="Enregistrer la liste"
              >
                <Save className="w-5 h-5 text-green-600" />
              </motion.button>
              <motion.button
                onClick={onNewList}
                className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center"
                whileHover={{ scale: 1.1, backgroundColor: 'rgb(233 213 255)' }}
                whileTap={{ scale: 0.95 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
                title="Nouvelle liste"
              >
                <FilePlus className="w-5 h-5 text-purple-600" />
              </motion.button>
              <motion.button
                onClick={handleGamificationClick}
                className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center"
                whileHover={{ scale: 1.1, backgroundColor: 'rgb(252 211 77)' }}
                whileTap={{ scale: 0.95 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
              >
                <Trophy className="w-5 h-5 text-amber-600" />
              </motion.button>
              <motion.button
                onClick={handleSettingsClick}
                className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center"
                whileHover={{ scale: 1.1, backgroundColor: 'rgb(229 231 235)' }}
                whileTap={{ scale: 0.95 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
              >
                <Settings className="w-5 h-5 text-gray-600" />
              </motion.button>
            </div>
          </div>

          {/* Shared indicator */}
          <motion.div
            onClick={handleShareClick}
            className="bg-blue-50 border border-blue-200 rounded-2xl px-4 py-3 flex items-center justify-between cursor-pointer"
            whileHover={{ scale: 1.02, backgroundColor: 'rgb(219 234 254)' }}
            whileTap={{ scale: 0.98 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
          >
            <div className="flex items-center gap-3">
              <Users className="w-5 h-5 text-blue-600" />
              <span className="text-blue-900 font-medium">Liste partagée</span>
            </div>
            <div className="flex -space-x-2">
              {sharedMembers.length > 0 ? (
                sharedMembers.map((member, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2 + index * 0.1, type: "spring" }}
                    className={`w-8 h-8 rounded-full ${member.color} border-2 border-white flex items-center justify-center text-white text-xs font-bold`}
                  >
                    {member.name[0]?.toUpperCase()}
                  </motion.div>
                ))
              ) : (
                <span className="text-blue-600 text-xs">Partager</span>
              )}
            </div>
          </motion.div>
        </motion.div>

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
            <Button onClick={handleResetAllData} variant="ghost" size="sm" title="Vider toutes les données">
              🗑️
            </Button>
            <Button onClick={() => setShowIds(s => !s)} variant="ghost" size="sm" title="Afficher/masquer IDs">
              🆔
            </Button>
            <Button onClick={handleForceIds} variant="ghost" size="sm" title="Forcer régénération des IDs">
              ♻️
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
        {(() => {
          const ids = filteredProducts.map(p => p.id)
          const uniqueIds = new Set(ids)
          if (ids.length !== uniqueIds.size) {
            console.error('[Liste RENDER] DUPLICATE IDs in filteredProducts!', 
              'Total:', ids.length, 'Unique:', uniqueIds.size,
              'IDs:', ids)
          }
          return null
        })()}
        {filteredProducts.map((p, idx) => (
          <React.Fragment key={p.id || `${p.nom}-${idx}`}>
            <ProductItem
              product={p}
              updateProduct={updateProduct}
              onToggle={async (prod) => {
                await updateProduct(prod.id, { recurrent: !prod.recurrent })
              }}
              onDelete={async (id) => {
                console.log('[Liste onDelete] Called with id:', id)
                try {
                  await removeProduct(id)
                  console.log('[Liste onDelete] After removeProduct')
                  addToast('Produit supprimé', 'success')
                } catch(e) {
                  console.error('[Liste onDelete] Error:', e)
                  addToast('Erreur lors de la suppression', 'error')
                }
              }}
              onEdit={handleEditProduct}
              onPrice={handleFetchPrice}
            />
            {showIds && (
              <div className="text-[10px] text-gray-400 ml-2 select-all">ID: {p.id}</div>
            )}
          </React.Fragment>
        ))}
      </div>

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

      {/* Modal: Save current list before creating a new one */}
      {showSaveModal && (
        <Modal onClose={() => setShowSaveModal(false)}>
          <div className="p-6">
            <h2 className="text-xl font-bold mb-4">Créer une nouvelle liste</h2>
            <p className="text-gray-600 mb-4">
              Voulez-vous sauvegarder la liste actuelle avant d'en créer une nouvelle ?
            </p>
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

      {/* Modal de partage */}
      {showShareModal && (
        <ShareModal
          isOpen={showShareModal}
          onClose={() => setShowShareModal(false)}
          products={products}
          ownerEmail={user?.email}
        />
      )}
{/* Duplicate Detection Modal */}      {showDuplicateModal && (        <DuplicateModal          newProduct={duplicateData.newProduct}          existingProduct={duplicateData.existingProduct}          onMerge={handleMergeDuplicate}          onAddAnyway={handleAddDuplicateAnyway}          onCancel={handleCancelDuplicate}        />      )}
    </div>
  )
}
