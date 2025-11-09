import React, { useState } from 'react'
import Modal from './Modal'
import Button from './Button'
import { useToast } from './ToastProvider'
import { hasSubmissionFor, saveSubmission } from '../services/ocrKV'
import { ingestOcrProducts } from '../services/weeklyPrices'

import useAppStore from '../store/useAppStore'

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
  const [ingestionStats, setIngestionStats] = useState(null) // { added, updated }
  const [mergeStats, setMergeStats] = useState(null) // { addedToList, updatedInList }
  const { addToast } = useToast()
  // Access store actions for merging OCR results into the shopping list
  const products = useAppStore(s => s.products)
  const addProductStore = useAppStore(s => s.addProduct)
  const updateProductStore = useAppStore(s => s.updateProduct)

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
        const pageCount = doc.numPages
        setPdfInfo({ pages: pageCount, truncated: pageCount > 15 })
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
      let ingestRes = null
      try {
        ingestRes = await ingestOcrProducts({
          products: result.products,
          store,
          period: { from: fromDate, to: toDate },
          ocrConfidence: result.ocrConfidence
        })
        setIngestionStats(ingestRes) // Store for display in modal
      } catch(e){
        console.warn('Ingestion OCR échouée', e)
      }

      // Merge into main products list (business rule: reflect new OCR prices in user list)
      // Strategy:
      //  - Normalize product names (lowercase trim)
      //  - If existing product with same normalized name:
      //       * Update if no price yet OR OCR price < existing price
      //       * Set magasin=flyer store, prixSource='ocr', autoAssigned=true
      //  - Else add new product with prixSource='ocr'
      //  - Track counts
      try {
        const existingByName = new Map()
        products.forEach(p => { existingByName.set((p.nom||'').trim().toLowerCase(), p) })
        let addedToList = 0, updatedInList = 0
        for(const op of result.products){
          const norm = (op.name || '').trim().toLowerCase()
            .replace(/\s+/g,' ')
          if(!norm) continue
          const existing = existingByName.get(norm)
          if(existing){
            const shouldUpdate = (existing.prix == null) || (typeof existing.prix === 'number' && op.price < existing.prix)
            if(shouldUpdate){
              try {
                await updateProductStore(existing.id, { prix: op.price, magasin: store, prixSource: 'ocr', autoAssigned: true })
                updatedInList++
              } catch(_){}
            }
          } else {
            try {
              const added = await addProductStore({ nom: norm, prix: op.price, magasin: store, quantite: 1, prixSource: 'ocr', autoAssigned: true })
              if(added) addedToList++
            } catch(_){ /* ignore single failure */ }
          }
        }
        setMergeStats({ addedToList, updatedInList })
        if(addedToList || updatedInList){
          addToast(`Liste mise à jour via OCR (+${addedToList} ajoutés, ⟳${updatedInList} mis à jour)`, 'info', 6000)
        }
      } catch(mergeErr){
        console.warn('Merge OCR -> liste échoué', mergeErr)
      }

      // Success message with ingestion details
      if(ingestRes && (ingestRes.added || ingestRes.updated)){
        addToast(
          `🎉 Merci pour votre contribution! ${result.validCount} produits analysés. ` +
          `${ingestRes.added} nouveaux prix ajoutés, ${ingestRes.updated} mis à jour. ` +
          `(${store}, ${fromDate} → ${toDate})`,
          'success',
          8000 // Show longer
        )
      } else {
        addToast(
          `✅ Merci pour votre contribution! ${result.validCount} produits soumis (${store}, ${fromDate} → ${toDate})`,
          'success',
          5000
        )
      }
      
      if (onSuccess) onSuccess(result.products, saved)
      
      // Close after a delay to let user see the success message in the modal
      setTimeout(() => {
        handleClose()
      }, 1500)

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
    setPdfInfo(null)
    setStore('')
    setFromDate('')
    setToDate('')
    setProcessing(false)
    setProgress(0)
    setResults(null)
    setIngestionStats(null)
    setMergeStats(null)
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
            {pdfInfo.truncated && (
              <span className="ml-2 inline-block text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700" title="Limite de 15 pages pour performance">
                15 premières analysées
              </span>
            )}
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
              🎉 Merci pour votre contribution!
            </h3>
            <p className="text-sm text-green-800 mb-3 space-y-1">
              <span>{results.validCount} produits détectés et analysés.</span>
              {ingestionStats && (ingestionStats.added > 0 || ingestionStats.updated > 0) && (
                <span className="block font-medium">
                  Base hebdo: +{ingestionStats.added} / ⟳{ingestionStats.updated}
                </span>
              )}
              {mergeStats && (mergeStats.addedToList > 0 || mergeStats.updatedInList > 0) && (
                <span className="block font-medium">
                  Liste: +{mergeStats.addedToList} / ⟳{mergeStats.updatedInList}
                </span>
              )}
            </p>
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
