import React, { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useToast } from '../components/ToastProvider'
import { useAuth } from '../contexts/AuthContext'
import Button from '../components/Button'
import Input from '../components/Input'
import ProductItem from '../components/ProductItem'
import AddProductModal from '../components/AddProductModal'
import { ArrowLeft, UserPlus, Clock, CheckCircle2, Shield, Edit3, Eye, Plus } from 'lucide-react'
import { motion } from 'framer-motion'
import { subscribeToSharedListByCode, updateUserPersonalList } from '../services/firestore'

export default function SharedList() {
  const { code: shareCode } = useParams()
  const navigate = useNavigate()
  const { addToast } = useToast()
  const { user, logout } = useAuth()
  const [list, setList] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showLoginPrompt, setShowLoginPrompt] = useState(false)
  const [userRole, setUserRole] = useState(null)
  const [showAddProductModal, setShowAddProductModal] = useState(false)
  const [quickAddName, setQuickAddName] = useState('')
  const unsubscribeRef = useRef(null)
  const isInitialLoadRef = useRef(true)

  // Subscribe to real-time updates from Firestore
  useEffect(() => {
    if (!shareCode) return

    console.log('[SharedList] Subscribing to shareCode:', shareCode, 'userId:', user?.uid)
    setLoading(true)

    // Setup real-time listener using shareCode from URL
    const unsubscribe = subscribeToSharedListByCode(shareCode, (updatedList) => {
      console.log('[SharedList] Received update:', updatedList)
      
      if (!updatedList) {
        setError('Liste non trouvée')
        setLoading(false)
        return
      }

      console.log('[SharedList] Products count:', updatedList.products?.length || 0)
      setList(updatedList)
      setError(null)

      // Determine user role
      if (user && updatedList.members) {
        const role = updatedList.members[user.uid] || null
        console.log('[SharedList] User role:', role)
        setUserRole(role)
      }

      // Show toast on updates (but not on initial load)
      if (!isInitialLoadRef.current) {
        addToast('✨ Liste mise à jour', 'success')
      }

      isInitialLoadRef.current = false
      setLoading(false)
    }, user?.uid) // Pass userId for automatic access sync

    unsubscribeRef.current = unsubscribe

    // Cleanup on unmount
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current()
      }
    }
  }, [shareCode, user])

  // Handle product update (add/remove/modify)
  const handleProductChange = async (updatedProducts) => {
    if (!user) {
      setShowLoginPrompt(true)
      return
    }

    // Check permissions
    if (userRole !== 'admin' && userRole !== 'editor') {
      addToast('❌ Vous n\'avez pas la permission de modifier cette liste', 'error')
      return
    }

    try {
      // Update the userList directly (referenced by userListId)
      if (!list.userListId) {
        throw new Error('Liste non liée à une liste personnelle')
      }

      await updateUserPersonalList(list.userListId, {
        products: updatedProducts
      })
      // No need to manually update state - onSnapshot will handle it
      addToast('✅ Liste mise à jour', 'success')
    } catch (err) {
      console.error('[SharedList] Update error:', err)
      addToast('Erreur lors de la mise à jour', 'error')
    }
  }

  const handleDeleteProduct = (productId) => {
    if (!list) return
    const updatedProducts = (list.products || []).filter(p => p.id !== productId)
    handleProductChange(updatedProducts)
  }

  const handleQuickAdd = async () => {
    if (!quickAddName.trim()) return
    if (!canEdit) {
      addToast('❌ Vous n\'avez pas la permission de modifier cette liste', 'error')
      return
    }

    const newProduct = {
      id: `prod-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      nom: quickAddName.trim(),
      quantite: 1,
      recurrent: false,
      magasin: null,
      prix: null
    }

    const updatedProducts = [...(list.products || []), newProduct]
    await handleProductChange(updatedProducts)
    setQuickAddName('')
    addToast('✅ Produit ajouté', 'success')
  }

  const handleAddProductFromModal = async (productData) => {
    if (!canEdit) {
      addToast('❌ Vous n\'avez pas la permission de modifier cette liste', 'error')
      return
    }

    const newProduct = {
      id: `prod-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      nom: productData.nom,
      quantite: productData.quantite || 1,
      recurrent: false,
      magasin: productData.magasin || null,
      prix: productData.prix || null
    }

    const updatedProducts = [...(list.products || []), newProduct]
    await handleProductChange(updatedProducts)
    setShowAddProductModal(false)
    addToast('✅ Produit ajouté', 'success')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement de la liste partagée...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center p-6 bg-red-50 rounded-lg border border-red-200 max-w-md">
          <h2 className="text-2xl font-bold text-red-600 mb-2">Erreur</h2>
          <p className="text-gray-700 mb-4">{error}</p>
          <p className="text-sm text-gray-600">Le lien de partage n'est peut-être plus valide.</p>
        </div>
      </div>
    )
  }

  if (!list) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Liste vide</p>
        </div>
      </div>
    )
  }

  const products = list.products || []
  const ownerId = list.ownerId
  const members = list.members || {}
  const isOwner = user && ownerId === user.uid
  const canEdit = user && (userRole === 'admin' || userRole === 'editor')
  const canView = user && (userRole === 'admin' || userRole === 'editor' || userRole === 'viewer')

  // Get role badge
  const getRoleBadge = (role) => {
    const roles = {
      admin: { icon: Shield, label: 'Admin', color: 'text-purple-600 bg-purple-100' },
      editor: { icon: Edit3, label: 'Éditeur', color: 'text-blue-600 bg-blue-100' },
      viewer: { icon: Eye, label: 'Lecture', color: 'text-gray-600 bg-gray-100' }
    }
    return roles[role] || roles.viewer
  }

  const roleBadge = userRole ? getRoleBadge(userRole) : null

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-50 to-purple-50">
      {/* Header */}
      <div className="bg-white px-6 pt-8 pb-6 shadow-sm sticky top-0 z-10">
        <div className="flex items-center gap-4 mb-6">
          <motion.button 
            onClick={() => navigate('/liste')}
            className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center"
            whileHover={{ scale: 1.1, backgroundColor: 'rgb(229 231 235)' }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
          >
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </motion.button>
          <div className="flex-1">
            <h1 className="text-gray-900">{list.title || 'Liste collaborative'}</h1>
            <div className="flex items-center gap-2 mt-1">
              <motion.div 
                className="w-2 h-2 bg-green-500 rounded-full"
                animate={{ scale: [1, 1.2, 1], opacity: [1, 0.7, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
              <span className="text-green-600">Synchronisé</span>
            </div>
          </div>
          <motion.button 
            className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center"
            whileHover={{ scale: 1.1, backgroundColor: 'rgb(191 219 254)' }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
            title="Inviter un membre"
          >
            <UserPlus className="w-5 h-5 text-blue-600" />
          </motion.button>
        </div>

        {/* Members avatars */}
        {Object.keys(members).length > 0 && (
          <div className="flex items-center gap-3 overflow-x-auto pb-2">
            {Object.entries(members).map(([userId, role], index) => {
              const badge = getRoleBadge(role)
              const RoleIcon = badge.icon
              return (
                <motion.div
                  key={userId}
                  className="flex flex-col items-center gap-2 min-w-fit"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1, type: "spring" }}
                  whileHover={{ y: -5 }}
                >
                  <div className={`w-12 h-12 rounded-full ${badge.color} flex items-center justify-center shadow-md relative`}>
                    <RoleIcon className="w-5 h-5" />
                    {userId === ownerId && (
                      <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-400 rounded-full border-2 border-white flex items-center justify-center">
                        <span className="text-xs">👑</span>
                      </div>
                    )}
                  </div>
                  <div className="text-center">
                    <span className="text-gray-700 text-xs block">{userId === user?.uid ? 'Vous' : `Membre ${index + 1}`}</span>
                    <span className={`text-xs ${badge.color.split(' ')[0]} font-medium`}>{badge.label}</span>
                  </div>
                </motion.div>
              )
            })}
          </div>
        )}
      </div>
      {/* Login Prompt Modal */}
      {showLoginPrompt && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-sm">
            <h3 className="text-lg font-bold text-gray-900 mb-3">Connexion requise</h3>
            <p className="text-gray-600 mb-4">
              Veuillez vous connecter pour modifier cette liste partagée.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowLoginPrompt(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Annuler
              </button>
              <button
                onClick={() => {
                  navigate('/auth')
                  setShowLoginPrompt(false)
                }}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Se connecter
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Auth status */}
      <div className="mx-6 mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
          {user ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <p className="text-sm text-blue-700">
                  ✅ Connecté en tant que <span className="font-semibold">{user.email}</span>
                </p>
                {roleBadge && (
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${roleBadge.color}`}>
                    {roleBadge.label}
                  </span>
                )}
              </div>
              <button
                onClick={logout}
                className="text-xs text-blue-600 hover:text-blue-700 underline"
              >
                Déconnecter
              </button>
            </div>
          ) : (
            <button
              onClick={() => navigate('/auth')}
              className="w-full text-sm text-blue-700 hover:text-blue-800 hover:underline text-left"
            >
              📖 Mode lecture seule - Cliquez ici pour vous connecter et modifier la liste
            </button>
          )}
      </div>

      {/* Quick Add Section - Only show if user can edit */}
      {canEdit && (
        <div className="mx-6 mt-4 p-4 bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="flex gap-2">
            <Input
              value={quickAddName}
              onChange={(e) => setQuickAddName(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleQuickAdd()}
              placeholder="Ajouter un produit..."
              className="flex-1"
            />
            <Button onClick={handleQuickAdd} size="md">
              <Plus className="w-5 h-5" />
            </Button>
            <Button onClick={() => setShowAddProductModal(true)} variant="secondary" size="md">
              📝 Détails
            </Button>
          </div>
        </div>
      )}

      {/* Items List */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
        {products.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>Aucun produit dans cette liste</p>
          </div>
        ) : (
          products.map((product, index) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05, type: "spring", stiffness: 300, damping: 24 }}
              whileHover={{ scale: 1.02, x: 5 }}
              className={`bg-white rounded-2xl p-4 shadow-sm border-l-4 border-blue-500 cursor-pointer relative`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-gray-900">{product.nom}</h3>
                  </div>
                  {product.magasin && (
                    <p className="text-gray-500 mt-1 text-sm">Magasin: {product.magasin}</p>
                  )}
                </div>
              </div>
              {canEdit ? (
                <motion.button 
                  className="w-full bg-gray-100 text-gray-600 rounded-xl px-3 py-2 text-sm"
                  whileHover={{ backgroundColor: 'rgb(229 231 235)', scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleDeleteProduct(product.id)}
                >
                  Supprimer de la liste
                </motion.button>
              ) : (
                <motion.div 
                  className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl px-3 py-2"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                  <span className="text-green-700 text-sm">Lecture seule</span>
                </motion.div>
              )}
            </motion.div>
          ))
        )}
      </div>

      {/* Last sync */}
      <div className="px-6 py-4 bg-white border-t border-gray-100">
        <div className="flex items-center justify-center gap-2 text-gray-500 text-sm">
          <motion.div
            className="w-2 h-2 bg-green-500 rounded-full"
            animate={{ scale: [1, 1.3, 1], opacity: [1, 0.6, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
          <span className="text-green-600 font-medium">Synchronisation temps réel</span>
          <span className="ml-2 text-gray-400">Code: <span className="font-mono text-xs">{shareCode}</span></span>
        </div>
      </div>

      {/* Add Product Modal */}
      {showAddProductModal && (
        <AddProductModal
          isOpen={showAddProductModal}
          onClose={() => setShowAddProductModal(false)}
          onAdd={handleAddProductFromModal}
        />
      )}
    </div>
  )
}
