// OCR service using Tesseract.js for flyer text extraction
import { createWorker } from 'tesseract.js'

/**
 * Extract text from an image file using Tesseract OCR
 * @param {File} imageFile - Image file to process
 * @param {Function} onProgress - Progress callback (0-1)
 * @returns {Promise<{text: string, confidence: number}>}
 */
export async function extractTextFromImage(imageFile, onProgress = () => {}) {
  const worker = await createWorker('fra+eng', 1, {
    logger: (m) => {
      if (m.status === 'recognizing text') {
        onProgress(m.progress)
      }
    }
  })

  try {
    const { data } = await worker.recognize(imageFile)
    await worker.terminate()
    
    return {
      text: data.text,
      confidence: data.confidence,
      words: data.words || []
    }
  } catch (error) {
    await worker.terminate()
    throw error
  }
}

/**
 * Parse extracted OCR text to find products and prices
 * @param {string} text - OCR extracted text
 * @returns {Array<{name: string, price: number}>}
 */
export function parseProductsFromText(text) {
  const products = []
  const lines = text.split('\n').filter(l => l.trim())

  // Regex patterns for Quebec grocery flyers
  const pricePatterns = [
    /(\d+)[,.](\d{2})\s*\$/, // 3.99$ or 3,99$
    /\$\s*(\d+)[,.](\d{2})/, // $3.99
    /(\d+)\s*\$\s*(\d{2})/, // 3$ 99
  ]

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()
    
    // Try to find a price in this line
    let price = null
    let priceMatch = null
    
    for (const pattern of pricePatterns) {
      priceMatch = line.match(pattern)
      if (priceMatch) {
        price = parseFloat(`${priceMatch[1]}.${priceMatch[2]}`)
        break
      }
    }

    if (price && price > 0 && price < 1000) {
      // Look for product name in same line or previous line
      let productName = line.replace(priceMatch[0], '').trim()
      
      // If name too short, check previous line
      if (productName.length < 3 && i > 0) {
        productName = lines[i - 1].trim()
      }

      // Clean up product name
      productName = productName
        .replace(/[^\w\sÀ-ÿ'-]/g, ' ') // Keep alphanumeric + accents
        .replace(/\s+/g, ' ')
        .trim()

      if (productName.length >= 3) {
        products.push({
          name: productName,
          price: price,
          confidence: 'medium', // Could be enhanced with word confidence
          rawLine: line
        })
      }
    }
  }

  return products
}

/**
 * Validate and clean parsed products
 * @param {Array} products - Raw parsed products
 * @returns {Array} - Cleaned and validated products
 */
export function validateProducts(products) {
  return products
    .filter(p => {
      // Remove obvious errors
      if (!p.name || p.name.length < 3) return false
      if (!p.price || p.price <= 0 || p.price > 500) return false
      if (p.name.match(/^\d+$/)) return false // Name is just numbers
      return true
    })
    .map(p => ({
      name: p.name.toLowerCase(),
      price: Math.round(p.price * 100) / 100, // Round to 2 decimals
      confidence: p.confidence,
      rawLine: p.rawLine
    }))
}

/**
 * Full pipeline: Image -> OCR -> Parsed products
 * @param {File} imageFile - Flyer image
 * @param {Function} onProgress - Progress callback
 * @returns {Promise<Array>} - Validated products
 */
export async function processFlyer(imageFile, onProgress = () => {}) {
  // Step 1: OCR extraction (0-70% progress)
  const { text, confidence } = await extractTextFromImage(imageFile, (p) => {
    onProgress(p * 0.7)
  })

  onProgress(0.7)

  // Step 2: Parse products (70-90% progress)
  const rawProducts = parseProductsFromText(text)
  onProgress(0.9)

  // Step 3: Validate (90-100% progress)
  const validProducts = validateProducts(rawProducts)
  onProgress(1.0)

  return {
    products: validProducts,
    ocrConfidence: confidence,
    rawText: text,
    totalFound: rawProducts.length,
    validCount: validProducts.length
  }
}

/**
 * Process a PDF: render pages to canvas and run OCR
 * @param {File} pdfFile - PDF file
 * @param {Function} onProgress - callback 0..100
 */
export async function processPdf(pdfFile, onProgress = () => {}){
  // Lazy-load pdfjs to keep bundle light
  const pdfjsLib = await import('pdfjs-dist/build/pdf')
  const workerSrc = (await import('pdfjs-dist/build/pdf.worker.min.mjs?url')).default
  pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc

  const ab = await pdfFile.arrayBuffer()
  const doc = await pdfjsLib.getDocument({ data: ab }).promise
  const pageCount = doc.numPages

  // Create a single tesseract worker for all pages
  const { createWorker } = await import('tesseract.js')
  const worker = await createWorker('fra+eng', 1, {
    logger: (m) => {
      if (m.status === 'recognizing text') {
        // per-page progress handled below
      }
    }
  })

  let combinedText = ''
  let confidenceAcc = 0
  let count = 0
  const maxPages = Math.min(pageCount, 5) // cap for performance

  for(let i=1; i<=maxPages; i++){
    const page = await doc.getPage(i)
    const viewport = page.getViewport({ scale: 2 })
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    canvas.width = viewport.width
    canvas.height = viewport.height
    await page.render({ canvasContext: ctx, viewport }).promise

    const { data } = await worker.recognize(canvas)
    combinedText += '\n' + (data.text || '')
    confidenceAcc += (data.confidence || 0)
    count += 1
    onProgress(Math.round((i / maxPages) * 70)) // map first 70% to rendering+OCR
  }

  await worker.terminate()

  onProgress(80)
  const rawProducts = parseProductsFromText(combinedText)
  onProgress(90)
  const validProducts = validateProducts(rawProducts)
  onProgress(100)

  const avgConf = count ? (confidenceAcc / count) : null
  return {
    products: validProducts,
    ocrConfidence: avgConf,
    rawText: combinedText,
    totalFound: rawProducts.length,
    validCount: validProducts.length
  }
}
