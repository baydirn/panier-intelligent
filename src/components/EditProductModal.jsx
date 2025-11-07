import React, { useState, useEffect } from 'react'
import Modal from './Modal'
import Input from './Input'
import Button from './Button'
import { 
  findProduct, 
  getBrandsForProduct, 
  getFormatsForBrand, 
  getDefaultQuantities
} from '../data/productsDatabase'
import { getPriceAlert, setPriceAlert } from '../services/db'

export default function EditProductModal({ isOpen, onClose, product, onSave }) {
  const [nom, setNom] = useState('')
  const [marque, setMarque] = useState('')
  const [taille, setTaille] = useState('')
  const [quantite, setQuantite] = useState('x1')
  
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [availableBrands, setAvailableBrands] = useState([])
  const [availableFormats, setAvailableFormats] = useState([])
  const [availableQuantities, setAvailableQuantities] = useState(['x1', 'x2', 'x3', 'x4', 'x5'])
  const [alertPrice, setAlertPrice] = useState('')
  
  // Initialiser avec les données du produit existant
  useEffect(() => {
    if (product && isOpen) {
      // Parser le nom du produit pour extraire les composants
      const fullName = product.nom || ''
      setNom(fullName)
      
      // Essayer de trouver le produit dans la base de données
      const parts = fullName.toLowerCase().split(' ')
      let foundProduct = null
      
      for (let i = parts.length; i > 0; i--) {
        const searchTerm = parts.slice(0, i).join(' ')
        foundProduct = findProduct(searchTerm)
        if (foundProduct) {
          setSelectedProduct(foundProduct)
          
          // Extraire marque et taille du reste du nom
          const remaining = parts.slice(i).join(' ')
          const brands = getBrandsForProduct(foundProduct.key)
          setAvailableBrands(brands)
          
          // Chercher la marque dans le nom
          let detectedBrand = ''
          let detectedFormat = ''
          let detectedQuantity = 'x1'
          
          for (const brand of brands) {
            if (remaining.toLowerCase().includes(brand.name.toLowerCase())) {
              detectedBrand = brand.name
              setSelectedProduct(foundProduct)
              break
            }
          }
          
          // Extraire format et quantité du nom
          const formatMatch = remaining.match(/(\d+\.?\d*)(ml|l|g|kg|unités?)/i)
          if (formatMatch) {
            detectedFormat = formatMatch[0]
          }
          
          const quantityMatch = fullName.match(/x(\d+)/i)
          if (quantityMatch) {
            detectedQuantity = `x${quantityMatch[1]}`
          }
          
          setMarque(detectedBrand)
          setTaille(detectedFormat)
          setQuantite(detectedQuantity)
          
          if (detectedBrand) {
            const formats = getFormatsForBrand(foundProduct.key, detectedBrand)
            setAvailableFormats(formats)
          }
          
          const quantities = getDefaultQuantities(foundProduct.key)
          setAvailableQuantities(quantities)
          
          break
        }
      }
      
      if (!foundProduct) {
        // Produit non trouvé dans la base - mode manuel
        setNom(fullName)
        setMarque('')
        setTaille('')
        
        // Essayer d'extraire la quantité
        const quantityMatch = fullName.match(/x(\d+)/i)
        if (quantityMatch) {
          setQuantite(`x${quantityMatch[1]}`)
        } else {
          setQuantite('x1')
        }
      }
      // Charger alerte de prix existante
      getPriceAlert(fullName).then(alert => {
        if(alert && alert.targetPrice != null){
          setAlertPrice(String(alert.targetPrice))
        } else {
          setAlertPrice('')
        }
      }).catch(()=> setAlertPrice(''))
    }
  }, [product, isOpen])
  
  useEffect(() => {
    if (selectedProduct && marque) {
      const formats = getFormatsForBrand(selectedProduct.key, marque)
      setAvailableFormats(formats)
    }
  }, [selectedProduct, marque])
  
  const handleSave = () => {
    let newName = nom.trim()
    
    if (selectedProduct) {
      // Reconstruire le nom avec les sélections
      newName = selectedProduct.key
      if (marque) newName += ` ${marque}`
      if (taille) newName += ` ${taille}`
    }
    
    // Ajouter la quantité si différente de x1
    if (quantite && quantite !== 'x1') {
      newName += ` ${quantite}`
    }
    
    onSave({
      ...product,
      nom: newName,
      marque: marque,
      taille: taille,
      quantite: parseInt(quantite.replace('x', '')) || 1
    })

    // Enregistrer alerte de prix si fournie
    const target = parseFloat(alertPrice)
    if(!isNaN(target)){
      setPriceAlert(newName, target)
    } else {
      setPriceAlert(newName, null)
    }
    
    handleClose()
  }
  
  const handleClose = () => {
    setNom('')
    setMarque('')
    setTaille('')
    setQuantite('x1')
    setSelectedProduct(null)
    setAvailableBrands([])
    setAvailableFormats([])
    onClose()
  }
  
  return (
    <Modal isOpen={isOpen} onClose={handleClose}>
      <div className="p-6">
        <h2 className="text-xl font-bold mb-4">✏️ Modifier le produit</h2>
        
        {/* Nom du produit (lecture seule si trouvé dans la base) */}
        {selectedProduct ? (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Produit
            </label>
            <div className="px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg">
              {selectedProduct.key}
            </div>
          </div>
        ) : (
          <Input
            label="Nom du produit"
            value={nom}
            onChange={(e) => setNom(e.target.value)}
            placeholder="Ex: Lait"
            className="mb-4"
          />
        )}
        
        {/* Marque */}
        {availableBrands.length > 0 ? (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Marque
            </label>
            <select
              value={marque}
              onChange={(e) => setMarque(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Sélectionner...</option>
              {availableBrands.map((brand, index) => (
                <option key={index} value={brand.name}>
                  {brand.name}
                </option>
              ))}
            </select>
          </div>
        ) : (
          <Input
            label="Marque (optionnel)"
            value={marque}
            onChange={(e) => setMarque(e.target.value)}
            placeholder="Ex: Québon"
            className="mb-4"
          />
        )}
        
        {/* Format */}
        {availableFormats.length > 0 ? (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Format
            </label>
            <select
              value={taille}
              onChange={(e) => setTaille(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Sélectionner...</option>
              {availableFormats.map((format, index) => (
                <option key={index} value={format}>
                  {format}
                </option>
              ))}
            </select>
          </div>
        ) : (
          <Input
            label="Format (optionnel)"
            value={taille}
            onChange={(e) => setTaille(e.target.value)}
            placeholder="Ex: 2L"
            className="mb-4"
          />
        )}
        
        {/* Quantité */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Quantité
          </label>
          <select
            value={quantite}
            onChange={(e) => setQuantite(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {availableQuantities.map((qty, index) => (
              <option key={index} value={qty}>
                {qty}
              </option>
            ))}
          </select>
        </div>

        {/* Alerte de prix */}
        <Input
          label="Alerte prix (déclenche si ≤)"
          value={alertPrice}
          onChange={(e) => setAlertPrice(e.target.value)}
          placeholder="Ex: 4.99"
          className="mb-4"
        />
        
        {/* Aperçu */}
        <div className="mb-6 p-4 bg-blue-50 rounded-lg">
          <div className="text-sm text-gray-600 mb-1">Aperçu:</div>
          <div className="font-semibold text-lg">
            {selectedProduct ? selectedProduct.key : nom}
            {marque && ` ${marque}`}
            {taille && ` ${taille}`}
            {quantite !== 'x1' && ` ${quantite}`}
          </div>
        </div>
        
        {/* Boutons */}
        <div className="flex gap-3">
          <Button
            variant="secondary"
            onClick={handleClose}
            className="flex-1"
          >
            Annuler
          </Button>
          <Button
            variant="primary"
            onClick={handleSave}
            className="flex-1"
            disabled={!nom.trim() && !selectedProduct}
          >
            💾 Enregistrer
          </Button>
        </div>
      </div>
    </Modal>
  )
}
