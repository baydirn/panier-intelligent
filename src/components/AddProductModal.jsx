import React, { useState } from 'react'
import Modal from './Modal'
import Input from './Input'
import Button from './Button'

export default function AddProductModal({ isOpen, onClose, onAdd }) {
  const [nom, setNom] = useState('')
  const [marque, setMarque] = useState('')
  const [taille, setTaille] = useState('')
  const [quantite, setQuantite] = useState(1)
  const [scanning, setScanning] = useState(false)

  const handleSubmit = () => {
    if (!nom.trim()) return
    
    // Construire le nom complet avec marque et taille
    let fullName = nom.trim()
    if (marque.trim()) {
      fullName += ` ${marque.trim()}`
    }
    if (taille.trim()) {
      fullName += ` ${taille.trim()}`
    }
    
    onAdd({
      nom: fullName,
      quantite: parseInt(quantite) || 1
    })
    
    // Reset form
    setNom('')
    setMarque('')
    setTaille('')
    setQuantite(1)
  }

  const handleScanBarcode = async () => {
    setScanning(true)
    try {
      // Check if BarcodeDetector API is available
      if ('BarcodeDetector' in window) {
        const barcodeDetector = new window.BarcodeDetector()
        
        // Request camera access
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: 'environment' } 
        })
        
        const video = document.createElement('video')
        video.srcObject = stream
        video.play()
        
        // Create a simple UI for scanning
        const scannerDiv = document.createElement('div')
        scannerDiv.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:black;z-index:9999;display:flex;flex-direction:column;align-items:center;justify-content:center;'
        scannerDiv.innerHTML = `
          <video id="scanner-video" autoplay style="width:100%;max-width:500px;"></video>
          <button id="cancel-scan" style="margin-top:20px;padding:10px 20px;background:white;color:black;border:none;border-radius:8px;cursor:pointer;">Annuler</button>
        `
        document.body.appendChild(scannerDiv)
        const videoElement = scannerDiv.querySelector('#scanner-video')
        videoElement.srcObject = stream
        
        scannerDiv.querySelector('#cancel-scan').onclick = () => {
          stream.getTracks().forEach(track => track.stop())
          document.body.removeChild(scannerDiv)
          setScanning(false)
        }
        
        // Scan for barcode
        const detectBarcode = async () => {
          try {
            const barcodes = await barcodeDetector.detect(videoElement)
            if (barcodes.length > 0) {
              const barcode = barcodes[0].rawValue
              
              // Stop camera
              stream.getTracks().forEach(track => track.stop())
              document.body.removeChild(scannerDiv)
              setScanning(false)
              
              // TODO: Lookup product by barcode (would need a product database API)
              // For now, just fill the barcode as product name
              setNom(`Produit code-barres: ${barcode}`)
              alert(`Code-barres scanné: ${barcode}\n\nNote: La recherche de produit par code-barres nécessite une API externe.`)
            } else {
              requestAnimationFrame(detectBarcode)
            }
          } catch (err) {
            requestAnimationFrame(detectBarcode)
          }
        }
        
        detectBarcode()
      } else {
        // Fallback: manual barcode input
        const barcode = prompt('Scanner non disponible. Entrez le code-barres manuellement :')
        if (barcode) {
          setNom(`Produit code-barres: ${barcode}`)
          alert('Note: La recherche de produit par code-barres nécessite une API externe.')
        }
        setScanning(false)
      }
    } catch (error) {
      console.error('Error scanning barcode:', error)
      alert('Erreur lors du scan du code-barres. Vérifiez les permissions de la caméra.')
      setScanning(false)
    }
  }

  if (!isOpen) return null

  return (
    <Modal onClose={onClose}>
      <div className="p-6">
        <h2 className="text-xl font-bold mb-4">Ajouter un produit</h2>
        
        <div className="space-y-4">
          <Input
            label="Nom du produit *"
            value={nom}
            onChange={(e) => setNom(e.target.value)}
            placeholder="Ex: Lait"
            autoFocus
          />
          
          <Input
            label="Marque"
            value={marque}
            onChange={(e) => setMarque(e.target.value)}
            placeholder="Ex: Quebon"
          />
          
          <Input
            label="Taille / Format"
            value={taille}
            onChange={(e) => setTaille(e.target.value)}
            placeholder="Ex: 2 litres"
          />
          
          <Input
            label="Quantité"
            type="number"
            min="1"
            value={quantite}
            onChange={(e) => setQuantite(e.target.value)}
          />
          
          <div className="bg-gray-50 p-3 rounded-lg">
            <p className="text-sm text-gray-600 mb-2">Aperçu :</p>
            <p className="font-medium">
              {nom.trim() || 'Nom'}
              {marque.trim() && ` ${marque.trim()}`}
              {taille.trim() && ` ${taille.trim()}`}
              {quantite > 1 && ` ×${quantite}`}
            </p>
          </div>

          <Button
            variant="secondary"
            onClick={handleScanBarcode}
            className="w-full"
            disabled={scanning}
          >
            {scanning ? '📷 Scan en cours...' : '📷 Scanner un code-barres'}
          </Button>
        </div>

        <div className="flex gap-3 mt-6">
          <Button
            variant="secondary"
            onClick={onClose}
            className="flex-1"
          >
            Annuler
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            className="flex-1"
            disabled={!nom.trim()}
          >
            ➕ Ajouter
          </Button>
        </div>
      </div>
    </Modal>
  )
}
