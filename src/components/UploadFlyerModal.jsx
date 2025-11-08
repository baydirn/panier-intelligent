import React, { useState } from 'react'
import Modal from './Modal'
import Button from './Button'
import { useToast } from './ToastProvider'
import { hasSubmissionFor, saveSubmission } from '../services/ocrKV'
import { ingestOcrProducts } from '../services/weeklyPrices'

export default function UploadFlyerModal({ isOpen, onClose, onSuccess }) {
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [pdfInfo, setPdfInfo] = useState(null) // { pages }
  const [store, setStore] = useState('')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [processing, setProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [results, setResults] = useState(null)
  const { addToast } = useToast()

  const STORES = [
    'IGA', 'Metro', 'Walmart', 'Maxi', 'Provigo', 
    'Super C', 'Costco', 'Adonis', 'Avril', 'Autre'
  ]

  const handleFileChange = async (e) => {
    const selectedFile = e.target.files[0]
    if (!selectedFile) return

    // Validate file type
    const isImage = selectedFile.type.startsWith('image/')
    const isPdf = selectedFile.type === 'application/pdf'
    if (!isImage && !isPdf) {
      addToast('Veuillez sélectionner une image ou un PDF', 'error')
      return
    }

    // Validate file size (max 10MB)
    if (selectedFile.size > 10 * 1024 * 1024) {
      addToast('Image trop grande (max 10MB)', 'error')
      return
    }

    setFile(selectedFile)
    setPdfInfo(null)

    if(isImage){
      // Create preview for image
      const reader = new FileReader()
      reader.onloadend = () => {
        setPreview(reader.result)
      }
      reader.readAsDataURL(selectedFile)
    } else if(isPdf){
      setPreview(null)
      try{
        // Light parse to get page count
  const pdfjsLib = await import('pdfjs-dist/build/pdf')
  const workerSrc = (await import('pdfjs-dist/build/pdf.worker.min.mjs?url')).default
        pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc
        const ab = await selectedFile.arrayBuffer()
        const doc = await pdfjsLib.getDocument({ data: ab }).promise
        setPdfInfo({ pages: doc.numPages })
      }catch(err){
        console.warn('PDF parse info failed', err)
      }
    }
  }

  const handleProcess = async () => {
    if (!file) {
      addToast('Veuillez sélectionner une image ou un PDF', 'error')
      return
    }

    if (!store) {
      addToast('Veuillez sélectionner un magasin', 'error')
      return
    }

    if(!fromDate || !toDate){
      addToast('Veuillez indiquer la période de validité', 'error')
      return
    }
    if(new Date(fromDate) > new Date(toDate)){
      addToast('La date de début est après la date de fin', 'error')
      return
    }

    // Deduplication / preflight
    const exists = await hasSubmissionFor(store, fromDate, toDate)
    if(exists){
      addToast('Une circulaire pour ce magasin et cette période existe déjà. Upload refusé.', 'error')
      return
    }

    setProcessing(true)
    setProgress(0)
    setResults(null)

    try {
      // Process OCR client-side (image or PDF)
      let result
      const svc = await import('../services/ocrService')
      if(file.type === 'application/pdf'){
        result = await svc.processPdf(file, (fraction) => setProgress(Math.round(fraction * 100)))
      } else {
        result = await svc.processFlyer(file, (fraction) => setProgress(Math.round(fraction * 100)))
      }

      setResults(result)
      
      if (result.validCount === 0) {
        addToast('Aucun produit détecté. Essayez une autre photo.', 'warning')
        return
      }

      // Save locally (KV) for now; could POST to server later
      const saved = await saveSubmission({
        store,
        period: { from: fromDate, to: toDate },
        products: result.products,
        uploadedBy: 'community',
        imageUrl: null,
        ocrConfidence: result.ocrConfidence
      })
      // Ingest immediately into weekly price base
      try {
        const ingestRes = await ingestOcrProducts({
          products: result.products,
          store,
          period: { from: fromDate, to: toDate },
          ocrConfidence: result.ocrConfidence
        })
        if(ingestRes.added || ingestRes.updated){
          addToast(`Base prix mise à jour (+${ingestRes.added} / ⟳${ingestRes.updated})`, 'info')
        }
      } catch(e){
        console.warn('Ingestion OCR échouée', e)
      }
      addToast(`✅ ${result.validCount} produits soumis (${store}, ${fromDate} → ${toDate})`, 'success')
      if (onSuccess) onSuccess(result.products, saved)
      handleClose()

    } catch (error) {
      console.error('OCR error:', error)
      addToast('Erreur lors du traitement: ' + error.message, 'error')
    } finally {
      setProcessing(false)
    }
  }

  const handleClose = () => {
    setFile(null)
    setPreview(null)
    setStore('')
    setFromDate('')
    setToDate('')
    setProcessing(false)
    setProgress(0)
    setResults(null)
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose}>
      <div className="p-6 max-w-2xl">
        <h2 className="text-2xl font-bold mb-4">📸 Téléverser une circulaire</h2>
        
        <p className="text-sm text-gray-600 mb-6">
          Prenez une photo claire de votre circulaire papier ou importez un PDF. Notre IA extraira automatiquement les prix.
        </p>

        {/* Store selection */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Magasin
          </label>
          <select
            value={store}
            onChange={(e) => setStore(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={processing}
          >
            <option value="">Sélectionner...</option>
            {STORES.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        {/* Validity period */}
        <div className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Début</label>
            <input
              type="date"
              value={fromDate}
              onChange={e => setFromDate(e.target.value)}
              disabled={processing}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Fin</label>
            <input
              type="date"
              value={toDate}
              onChange={e => setToDate(e.target.value)}
              disabled={processing}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* File upload */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Fichier de la circulaire (image ou PDF)
          </label>
          <input
            type="file"
            accept="image/*,application/pdf"
            capture="environment"
            onChange={handleFileChange}
            disabled={processing}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Preview */}
        {preview && (
          <div className="mb-4">
            <img 
              src={preview} 
              alt="Aperçu" 
              className="w-full max-h-64 object-contain border rounded-lg"
            />
          </div>
        )}
        {!preview && pdfInfo && (
          <div className="mb-4 text-sm text-gray-600">
            PDF chargé • Pages: {pdfInfo.pages}
          </div>
        )}

        {/* Progress */}
        {processing && (
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">
                Traitement en cours...
              </span>
              <span className="text-sm text-gray-600">{progress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Results preview */}
        {results && !processing && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
            <h3 className="font-semibold text-green-900 mb-2">
              ✓ {results.validCount} produits détectés
            </h3>
            <div className="max-h-40 overflow-auto text-sm">
              {results.products.slice(0, 10).map((p, i) => (
                <div key={i} className="flex justify-between py-1 border-b border-green-100">
                  <span className="text-gray-700">{p.name}</span>
                  <span className="font-semibold text-green-700">{p.price.toFixed(2)}$</span>
                </div>
              ))}
              {results.products.length > 10 && (
                <p className="text-gray-500 text-xs mt-2">
                  ... et {results.products.length - 10} autres produits
                </p>
              )}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <Button
            variant="secondary"
            onClick={handleClose}
            disabled={processing}
            className="flex-1"
          >
            Annuler
          </Button>
          <Button
            variant="primary"
            onClick={handleProcess}
            disabled={!file || !store || !fromDate || !toDate || (fromDate && toDate && new Date(fromDate) > new Date(toDate)) || processing}
            className="flex-1"
          >
            {processing ? 'Traitement...' : 'Analyser la circulaire'}
          </Button>
        </div>

        {/* Inline requirements hint */}
        {!processing && (!file || !store || !fromDate || !toDate) && (
          <p className="text-xs text-amber-600 mt-2">
            Sélectionnez le magasin, les dates de validité et un fichier (image ou PDF) pour activer l'analyse.
          </p>
        )}

        {/* Help text */}
        <p className="text-xs text-gray-500 mt-4">
          💡 Conseil: Assurez-vous que les prix sont clairement visibles et que l'éclairage est bon pour de meilleurs résultats.
        </p>
      </div>
    </Modal>
  )
}
