import React, { useState } from 'react'
import Modal from './Modal'
import Button from './Button'
import { useToast } from './ToastProvider'
import { hasSubmissionFor, saveSubmission } from '../services/ocrKV'
import { ingestOcrProducts } from '../services/weeklyPrices'

import useAppStore from '../store/useAppStore'
import { normalizeProductName } from '../domain/productNormalization'
import { canonicalizeStoreName } from '../domain/stores'

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
  const settings = useAppStore(s => s.settings)
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
    setIngestionStats(null)
    setMergeStats(null)

    try {
      // Process OCR client-side (image or PDF)
      console.log('[OCR] Starting OCR processing for:', file.name, file.type)
      let result
      const svc = await import('../services/ocrService')
      if(file.type === 'application/pdf'){
        console.log('[OCR] Processing PDF...')
        result = await svc.processPdf(file, (fraction) => {
          const pct = Math.round(fraction * 100)
          console.log('[OCR] Progress:', pct + '%')
          setProgress(pct)
        })
      } else {
        console.log('[OCR] Processing image...')
        result = await svc.processFlyer(file, (fraction) => {
          const pct = Math.round(fraction * 100)
          console.log('[OCR] Progress:', pct + '%')
          setProgress(pct)
        })
      }

      console.log('[OCR] OCR completed. Results:', result)
      setResults(result)
      
      if (result.validCount === 0) {
        console.warn('[OCR] No products detected')
        addToast('❌ Aucun produit détecté. Essayez une autre photo plus claire.', 'warning', 5000)
        setProcessing(false)
        return
      }

      console.log('[OCR] Saving submission...')
      // Save locally (KV) for now; could POST to server later
      const saved = await saveSubmission({
        store,
        period: { from: fromDate, to: toDate },
        products: result.products,
        uploadedBy: 'community',
        imageUrl: null,
        ocrConfidence: result.ocrConfidence
      })
      console.log('[OCR] Submission saved:', saved)
      
      // Ingest immediately into weekly price base
      let ingestRes = null
      try {
        console.log('[OCR] Ingesting products into weekly price base...')
        ingestRes = await ingestOcrProducts({
          products: result.products,
          store,
          period: { from: fromDate, to: toDate },
          ocrConfidence: result.ocrConfidence
        })
        console.log('[OCR] Ingestion result:', ingestRes)
        setIngestionStats(ingestRes) // Store for display in modal
      } catch(e){
        console.warn('[OCR] Ingestion OCR échouée', e)
        addToast('⚠️ Produits analysés mais non ajoutés à la base hebdomadaire', 'warning', 3000)
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
        console.log('[OCR] Merging products into list...')
        const { recordPriceObservation } = await import('../services/db')
        const existingByKey = new Map()
        products.forEach(p => { if(p.nameKey){ existingByKey.set(p.nameKey, p) } })
        let addedToList = 0, updatedInList = 0, historyCount = 0
        const replaceMode = settings?.ocrPriceReplaceMode || 'better'
        const canonStore = canonicalizeStoreName(store)
        console.log('[OCR] Merge mode:', replaceMode, 'Store:', canonStore)
        
        for(const op of result.products){
          const norm = normalizeProductName({ nom: op.name })
          if(!norm?.nameKey) continue
          const existing = existingByKey.get(norm.nameKey)
          // Enregistrement systématique dans l'historique (par nameKey + store canonical)
          try {
            await recordPriceObservation(norm.nameKey, canonStore, op.price)
            historyCount++
          } catch(_){ /* ignore single failure */ }
          if(existing){
            let shouldUpdate = false
            if(replaceMode === 'always'){
              shouldUpdate = true
            } else if(replaceMode === 'better'){
              shouldUpdate = (existing.prix == null) || (typeof existing.prix === 'number' && op.price < existing.prix)
            } else if(replaceMode === 'never'){
              shouldUpdate = (existing.prix == null) // Only update if no price set
            }
            if(shouldUpdate){
              try {
                await updateProductStore(existing.id, { prix: op.price, magasin: canonStore, prixSource: 'ocr', autoAssigned: true })
                updatedInList++
              } catch(_){}
            }
          } else {
            try {
              const added = await addProductStore({ nom: norm.baseName, marque: norm.marque, volume: norm.volume, prix: op.price, magasin: canonStore, quantite: 1, prixSource: 'ocr', autoAssigned: true })
              if(added) addedToList++
            } catch(_){ /* ignore single failure */ }
          }
        }
        console.log('[OCR] Merge complete. Added:', addedToList, 'Updated:', updatedInList, 'History:', historyCount)
        setMergeStats({ addedToList, updatedInList, historyCount })
        if(addedToList || updatedInList){
          addToast(`Liste mise à jour via OCR (+${addedToList} ajoutés, ⟳${updatedInList} mis à jour, 🕒 ${historyCount} historiques)`, 'info', 6000)
        }
      } catch(mergeErr){
        console.error('[OCR] Merge OCR -> liste échoué', mergeErr)
        addToast('⚠️ Erreur lors de la fusion avec votre liste: ' + mergeErr.message, 'warning', 5000)
      }

      // Success message with ingestion details
      console.log('[OCR] Showing success message...')
      if(ingestRes && (ingestRes.added || ingestRes.updated)){
        addToast(
          `🎉 Merci pour votre contribution! ${result.validCount} produits analysés. ` +
          `${ingestRes.added} nouveaux prix ajoutés, ${ingestRes.updated} mis à jour. ` +
          `(${store}, ${fromDate} → ${toDate})`,
          'success',
          10000 // Show longer
        )
      } else {
        addToast(
          `✅ ${result.validCount} produits analysés avec succès! (${store}, ${fromDate} → ${toDate})`,
          'success',
          8000
        )
      }
      
      if (onSuccess) onSuccess(result.products, saved)
      
      // Don't close automatically - let user review results
      console.log('[OCR] Processing complete. Modal remains open for review.')
      // setTimeout(() => {
      //   handleClose()
      // }, 1500)

    } catch (error) {
      console.error('[OCR] Error during processing:', error)
      addToast('❌ Erreur lors du traitement OCR: ' + (error.message || 'Erreur inconnue'), 'error', 8000)
      // Show error in modal too
      setResults({
        products: [],
        validCount: 0,
        error: error.message || 'Erreur inconnue',
        ocrConfidence: 0
      })
    } finally {
      setProcessing(false)
      console.log('[OCR] Processing finished (finally block)')
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
                Traitement en cours... (cela peut prendre 30-60 secondes)
              </span>
              <span className="text-sm text-gray-600">{progress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-xs text-gray-500 mt-2">
              💡 Astuce: Vérifiez la console (F12) pour voir les détails du traitement
            </p>
          </div>
        )}

        {/* Error display */}
        {results && results.error && !processing && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <h3 className="font-semibold text-red-900 mb-2">
              ❌ Erreur de traitement
            </h3>
            <p className="text-sm text-red-800">
              {results.error}
            </p>
            <p className="text-xs text-red-600 mt-2">
              Vérifiez que l'image est claire et que les prix sont visibles. Ouvrez la console (F12) pour plus de détails.
            </p>
          </div>
        )}

        {/* Results preview */}
        {results && !results.error && results.validCount > 0 && !processing && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
            <h3 className="font-semibold text-green-900 mb-2">
              🎉 Analyse terminée avec succès!
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
