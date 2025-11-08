import React, { useState, useEffect, useRef } from 'react'
import { BrowserMultiFormatReader } from '@zxing/browser'
import Modal from './Modal'
import Input from './Input'
import Button from './Button'
import { 
  findProduct, 
  getBrandsForProduct, 
  getFormatsForBrand, 
  getDefaultQuantities,
  searchProducts 
} from '../data/productsDatabase'
import { 
  extractFormat,
  extractBrand
} from '../services/openFoodFactsApi'
import { resolveProductByBarcode, resolveSearch } from '../services/productResolver'

export default function AddProductModal({ isOpen, onClose, onAdd }) {
  // État principal
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [selectedBrand, setSelectedBrand] = useState('')
  const [selectedFormat, setSelectedFormat] = useState('')
  const [selectedQuantity, setSelectedQuantity] = useState('x1')
  
  // État pour la recherche
  const [searchResults, setSearchResults] = useState([])
  const [showSearchResults, setShowSearchResults] = useState(false)
  const [isSearchingAPI, setIsSearchingAPI] = useState(false)
  
  // État pour scan code-barres
  const [scanning, setScanning] = useState(false)
  const [barcodeManual, setBarcodeManual] = useState('')
  const [barcodeSupported, setBarcodeSupported] = useState(false)
  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const searchTimeoutRef = useRef(null)
  
  // Options disponibles basées sur la sélection
  const [availableBrands, setAvailableBrands] = useState([])
  const [availableFormats, setAvailableFormats] = useState([])
  const [availableQuantities, setAvailableQuantities] = useState(['x1', 'x2', 'x3', 'x4', 'x5'])
  
  // Mode manuel (si produit inconnu)
  const [manualMode, setManualMode] = useState(false)
  const [manualName, setManualName] = useState('')
  
  // Vérifier support BarcodeDetector
  useEffect(() => {
    setBarcodeSupported('BarcodeDetector' in window)
  }, [])
  
  // Recherche avec debounce
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }
    
    if (searchTerm.length < 2) {
      setSearchResults([])
      setShowSearchResults(false)
      return
    }
    
    searchTimeoutRef.current = setTimeout(async () => {
      // D'abord chercher dans la base locale
      const localResults = searchProducts(searchTerm)
      setSearchResults(localResults)
      setShowSearchResults(true)
      
      // Ensuite chercher via resolver (cache + API)
      if (localResults.length < 3) {
        setIsSearchingAPI(true)
        try {
          const apiResults = await resolveSearch(searchTerm)
          if (apiResults.length > 0) {
            // Ajouter résultats API avec un flag
            const apiResultsFormatted = apiResults.map(r => ({
              key: r.barcode,
              name: r.name,
              brand: extractBrand(r.brand),
              format: extractFormat(r.quantity),
              fromAPI: true,
              apiData: r
            }))
            setSearchResults([...localResults, ...apiResultsFormatted])
          }
        } catch (error) {
          console.error('Erreur recherche API:', error)
        } finally {
          setIsSearchingAPI(false)
        }
      }
    }, 300)
    
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }
    }
  }, [searchTerm])
  
  // Mise à jour des options quand un produit est sélectionné
  useEffect(() => {
    if (selectedProduct) {
      if (selectedProduct.fromAPI) {
        // Produit de l'API - mode limité
        setManualMode(true)
        setManualName(selectedProduct.name)
        setSelectedBrand(selectedProduct.brand || '')
        setSelectedFormat(selectedProduct.format || '')
        setAvailableBrands([])
        setAvailableFormats([])
      } else {
        // Produit de la base locale
        setManualMode(false)
        const brands = getBrandsForProduct(selectedProduct.key)
        setAvailableBrands(brands)
        
        if (brands.length > 0) {
          setSelectedBrand(brands[0].name)
        }
        
        const quantities = getDefaultQuantities(selectedProduct.key)
        setAvailableQuantities(quantities)
      }
    }
  }, [selectedProduct])
  
  // Mise à jour des formats quand une marque est sélectionnée
  useEffect(() => {
    if (selectedProduct && selectedBrand && !selectedProduct.fromAPI) {
      const formats = getFormatsForBrand(selectedProduct.key, selectedBrand)
      setAvailableFormats(formats)
      
      if (formats.length > 0) {
        setSelectedFormat(formats[0])
      }
    }
  }, [selectedProduct, selectedBrand])
  
  const handleSelectProduct = (product) => {
    setSelectedProduct(product)
    setSearchTerm(product.key || product.name)
    setShowSearchResults(false)
  }
  
  const handleScanBarcode = async () => {
    try {
      setScanning(true)
      const constraints = {
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      }
      const stream = await navigator.mediaDevices.getUserMedia(constraints)
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }

      let barcodeDetector = null
      if (barcodeSupported) {
        try {
          barcodeDetector = new window.BarcodeDetector({ formats: ['ean_13','ean_8','upc_a','upc_e','code_128'] })
        } catch (e) {
          console.warn('BarcodeDetector init fallback', e)
          barcodeDetector = null
        }
      }

      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')

      // Try native BarcodeDetector first; if not available, fallback to ZXing reader
      let usedZXing = false

      const startZXing = async () => {
        try {
          const reader = new BrowserMultiFormatReader()
          await reader.decodeFromVideoDevice(undefined, videoRef.current, (result, err) => {
            if (result) {
              const text = result.getText()
              handleBarcodeDetected(text)
              reader.reset()
              stopScanning()
            }
          })
          usedZXing = true
        } catch (e) {
          console.warn('ZXing fallback failed', e)
        }
      }

      const poll = async () => {
        if (!scanning || !videoRef.current) return
        const video = videoRef.current
        if (video.readyState === 4) {
          canvas.width = video.videoWidth
          canvas.height = video.videoHeight
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
          if (barcodeDetector) {
            try {
              const codes = await barcodeDetector.detect(video)
              if (codes.length > 0) {
                const code = codes[0].rawValue
                await handleBarcodeDetected(code)
                stopScanning()
                return
              }
            } catch (e) {
              console.debug('Detect error, continuing', e)
            }
          } else if (!usedZXing) {
            // Start ZXing once if native detector is unavailable
            startZXing()
          }
        }
        requestAnimationFrame(poll)
      }
      poll()
    } catch (error) {
      console.error('Erreur accès caméra:', error)
      alert("Accès caméra refusé ou impossible. Vérifiez les permissions navigateur.")
      setScanning(false)
    }
  }
  
  const handleBarcodeDetected = async (barcode) => {
    console.log('Code-barres détecté:', barcode)
    
  // Chercher via resolver (cache -> OpenFoodFacts)
  const product = await resolveProductByBarcode(barcode)
    
    if (product) {
      // Produit trouvé dans l'API
      setSelectedProduct({
        key: product.barcode,
        name: product.name,
        brand: extractBrand(product.brand),
        format: extractFormat(product.quantity),
        fromAPI: true,
        apiData: product
      })
      setManualMode(true)
      setManualName(product.name)
      setSelectedBrand(extractBrand(product.brand))
      setSelectedFormat(extractFormat(product.quantity))
    } else {
      alert(`Produit non trouvé pour le code-barres: ${barcode}`)
    }
  }
  
  const handleManualBarcodeSubmit = async () => {
    if (barcodeManual.trim()) {
      await handleBarcodeDetected(barcodeManual.trim())
      setBarcodeManual('')
    }
  }
  
  const stopScanning = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    setScanning(false)
  }
  
  const handleSubmit = () => {
    let productName = ''
    
    if (manualMode) {
      // Mode manuel ou produit API
      productName = manualName.trim()
      if (selectedBrand) productName += ` ${selectedBrand}`
      if (selectedFormat) productName += ` ${selectedFormat}`
    } else if (selectedProduct) {
      // Produit de la base locale
      productName = selectedProduct.key
      if (selectedBrand) productName += ` ${selectedBrand}`
      if (selectedFormat) productName += ` ${selectedFormat}`
    } else {
      return
    }
    
    // Ajouter la quantité
    if (selectedQuantity && selectedQuantity !== 'x1') {
      productName += ` ${selectedQuantity}`
    }
    
    onAdd({
      nom: productName,
      marque: selectedBrand,
      taille: selectedFormat,
      quantite: selectedQuantity
    })
    
    handleClose()
  }
  
  const handleClose = () => {
    setSearchTerm('')
    setSelectedProduct(null)
    setSelectedBrand('')
    setSelectedFormat('')
    setSelectedQuantity('x1')
    setSearchResults([])
    setShowSearchResults(false)
    setManualMode(false)
    setManualName('')
    setBarcodeManual('')
    stopScanning()
    onClose()
  }
  
  const toggleManualMode = () => {
    setManualMode(!manualMode)
    if (!manualMode) {
      setManualName(searchTerm)
    }
  }
  
  return (
    <Modal isOpen={isOpen} onClose={handleClose}>
      <div className="p-6">
        <h2 className="text-xl font-bold mb-4">📝 Ajouter un produit détaillé</h2>
        
        {/* Scan code-barres */}
        {!scanning && (
          <div className="mb-4 flex gap-2">
            {barcodeSupported ? (
              <Button
                variant="secondary"
                onClick={handleScanBarcode}
                className="flex-1"
              >
                📷 Scanner code-barres
              </Button>
            ) : (
              <div className="flex-1 flex gap-2">
                <Input
                  value={barcodeManual}
                  onChange={(e) => setBarcodeManual(e.target.value)}
                  placeholder="Entrer code-barres"
                  onKeyPress={(e) => e.key === 'Enter' && handleManualBarcodeSubmit()}
                  className="flex-1"
                />
                <Button onClick={handleManualBarcodeSubmit}>
                  🔍
                </Button>
              </div>
            )}
          </div>
        )}
        
        {/* Vidéo pour scan */}
        {scanning && (
          <div className="mb-4">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full rounded-lg border-2 border-blue-500"
            />
            <Button
              variant="secondary"
              onClick={stopScanning}
              className="w-full mt-2"
            >
              ❌ Annuler le scan
            </Button>
          </div>
        )}
        
        {/* Recherche de produit */}
        <div className="mb-4 relative">
          <Input
            label="Rechercher un produit"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value)
              setSelectedProduct(null)
            }}
            placeholder="Ex: lait, pain, yogourt..."
            autoFocus={!scanning}
          />
          
          {/* Résultats de recherche */}
          {showSearchResults && searchResults.length > 0 && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
              {searchResults.map((result, index) => (
                <button
                  key={index}
                  onClick={() => handleSelectProduct(result)}
                  className="w-full text-left px-4 py-3 hover:bg-gray-100 border-b border-gray-200 last:border-b-0"
                >
                  <div className="font-semibold">{result.key || result.name}</div>
                  {result.fromAPI && (
                    <div className="text-xs text-blue-600 mt-1">
                      🌐 {result.brand} - {result.format}
                    </div>
                  )}
                  {result.category && (
                    <div className="text-xs text-gray-500 mt-1">{result.category}</div>
                  )}
                </button>
              ))}
              {isSearchingAPI && (
                <div className="px-4 py-2 text-sm text-gray-500 text-center">
                  🔍 Recherche en ligne...
                </div>
              )}
            </div>
          )}
          
          <button
            onClick={toggleManualMode}
            className="text-xs text-blue-600 mt-1 hover:underline"
          >
            {manualMode ? '🔄 Utiliser la base de données' : '✏️ Saisie manuelle'}
          </button>
        </div>
        
        {/* Mode manuel */}
        {manualMode && (
          <div className="space-y-4 mb-4">
            <Input
              label="Nom du produit"
              value={manualName}
              onChange={(e) => setManualName(e.target.value)}
              placeholder="Ex: Lait"
            />
            <Input
              label="Marque (optionnel)"
              value={selectedBrand}
              onChange={(e) => setSelectedBrand(e.target.value)}
              placeholder="Ex: Québon"
            />
            <Input
              label="Format (optionnel)"
              value={selectedFormat}
              onChange={(e) => setSelectedFormat(e.target.value)}
              placeholder="Ex: 2L"
            />
          </div>
        )}
        
        {/* Sélecteurs pour produit connu */}
        {!manualMode && selectedProduct && !selectedProduct.fromAPI && (
          <div className="space-y-4 mb-4">
            {/* Sélection marque */}
            {availableBrands.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Marque
                </label>
                <select
                  value={selectedBrand}
                  onChange={(e) => setSelectedBrand(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {availableBrands.map((brand, index) => (
                    <option key={index} value={brand.name}>
                      {brand.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
            
            {/* Sélection format */}
            {availableFormats.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Format
                </label>
                <select
                  value={selectedFormat}
                  onChange={(e) => setSelectedFormat(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {availableFormats.map((format, index) => (
                    <option key={index} value={format}>
                      {format}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        )}
        
        {/* Sélection quantité */}
        {(selectedProduct || manualMode) && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Quantité
            </label>
            <select
              value={selectedQuantity}
              onChange={(e) => setSelectedQuantity(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {availableQuantities.map((qty, index) => (
                <option key={index} value={qty}>
                  {qty}
                </option>
              ))}
            </select>
          </div>
        )}
        
        {/* Aperçu */}
        {(selectedProduct || manualMode) && (
          <div className="mb-6 p-4 bg-blue-50 rounded-lg">
            <div className="text-sm text-gray-600 mb-1">Aperçu:</div>
            <div className="font-semibold text-lg">
              {manualMode ? (
                <>
                  {manualName}
                  {selectedBrand && ` ${selectedBrand}`}
                  {selectedFormat && ` ${selectedFormat}`}
                  {selectedQuantity !== 'x1' && ` ${selectedQuantity}`}
                </>
              ) : (
                <>
                  {selectedProduct.key}
                  {selectedBrand && ` ${selectedBrand}`}
                  {selectedFormat && ` ${selectedFormat}`}
                  {selectedQuantity !== 'x1' && ` ${selectedQuantity}`}
                </>
              )}
            </div>
          </div>
        )}
        
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
            onClick={handleSubmit}
            className="flex-1"
            disabled={!selectedProduct && !manualMode}
          >
            ➕ Ajouter
          </Button>
        </div>
      </div>
    </Modal>
  )
}
