// OCR service using Tesseract.js for flyer text extraction
import { createWorker } from 'tesseract.js'

/**
 * Extract text from an image file using Tesseract OCR
 * Enhanced with better parameters for grocery flyers
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
    // Configure Tesseract for better flyer recognition
    await worker.setParameters({
      tessedit_pageseg_mode: '1', // Automatic with OSD (better for complex layouts)
      preserve_interword_spaces: '1',
      tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789$.,% àâäéèêëïîôùûüÿçÀÂÄÉÈÊËÏÎÔÙÛÜŸÇ-/',
      // Improve number recognition (important for prices)
      classify_bln_numeric_mode: '1',
    })
    
    const { data } = await worker.recognize(imageFile)
    await worker.terminate()
    
    return {
      text: data.text,
      confidence: data.confidence,
      words: data.words || [],
      blocks: data.blocks || [] // Useful for spatial analysis
    }
  } catch (error) {
    await worker.terminate()
    throw error
  }
}

/**
 * Parse extracted OCR text to find products and prices
 * Enhanced version with better pattern matching and context awareness
 * @param {string} text - OCR extracted text
 * @returns {Array<{name: string, price: number, volume?: string, pricePerUnit?: number}>}
 */
export function parseProductsFromText(text) {
  const products = []
  const lines = text.split('\n').filter(l => l.trim())

  // Enhanced regex patterns for Quebec grocery flyers
  const pricePatterns = [
    // Standard formats
    { pattern: /(\d+)[,.](\d{2})\s*\$/, priority: 1 },           // 3.99$ or 3,99$
    { pattern: /\$\s*(\d+)[,.](\d{2})/, priority: 1 },           // $3.99
    { pattern: /(\d+)\s*\$\s*(\d{2})/, priority: 2 },           // 3$ 99
    
    // Bulk pricing (lower priority - these are often "per unit" prices we want to skip)
    { pattern: /(\d+)\s*pour\s*(\d+)[,.](\d{2})\s*\$/, type: 'bulk', priority: 3 },  // 2 pour 5.99$
    { pattern: /(\d+)\s*\/\s*(\d+)[,.](\d{2})\s*\$/, type: 'bulk', priority: 3 },     // 2/5.99$
    
    // Cents
    { pattern: /(\d+)¢/, type: 'cents', priority: 2 },          // 99¢
    
    // Price ranges (we'll take the lower bound)
    { pattern: /à\s*partir\s*de\s*(\d+)[,.](\d{2})\s*\$/, priority: 3 },  // à partir de 2.99$
  ]
  
  // Volume/unit patterns
  const volumePatterns = [
    /(\d+(?:[,.]\d+)?)\s*(kg|g|lb|oz|ml|l|litre|litres)/i,
    /(\d+(?:[,.]\d+)?)\s*(lb|kg)/i,
    /(sac|paquet|boîte|pot|bouteille)\s+de\s+(\d+(?:[,.]\d+)?)\s*(kg|g|lb|oz|ml|l)/i,
  ]

  // Words to ignore (common flyer text)
  const ignoreWords = new Set([
    'économisez', 'rabais', 'spécial', 'promo', 'valide', 'du', 'au', 
    'limite', 'quantité', 'limitée', 'membre', 'points', 'coupon',
    'page', 'circulaire', 'semaine'
  ])

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()
    const lineLower = line.toLowerCase()
    
    // Skip lines with ignore words only
    if (ignoreWords.has(lineLower)) continue
    
    // Try to find a price in this line
    let bestMatch = null
    let bestPriority = 999
    
    for (const { pattern, type, priority } of pricePatterns) {
      const match = line.match(pattern)
      if (match && priority < bestPriority) {
        bestMatch = { match, type: type || 'standard', pattern }
        bestPriority = priority
      }
    }

    if (bestMatch) {
      let price = null
      const { match, type } = bestMatch
      
      if (type === 'cents') {
        price = parseInt(match[1]) / 100
      } else if (type === 'bulk') {
        // For "2 pour 5.99$", calculate unit price
        const quantity = parseInt(match[1])
        const totalPrice = parseFloat(`${match[2]}.${match[3]}`)
        price = totalPrice / quantity
      } else {
        price = parseFloat(`${match[1]}.${match[2]}`)
      }
      
      if (price && price > 0 && price < 1000) {
        // Extract product name from context
        let productName = line.replace(match[0], '').trim()
        
        // Look in previous/next lines for better context
        let context = [productName]
        if (i > 0) context.unshift(lines[i - 1].trim())
        if (i > 1) context.unshift(lines[i - 2].trim())
        if (i < lines.length - 1) context.push(lines[i + 1].trim())
        
        // Find the best product name candidate
        productName = extractBestProductName(context, ignoreWords)
        
        // Extract volume if present
        let volume = null
        for (const line of context) {
          for (const volPattern of volumePatterns) {
            const volMatch = line.match(volPattern)
            if (volMatch) {
              if (volMatch[3]) {
                volume = `${volMatch[2]} ${volMatch[3]}`
              } else {
                volume = `${volMatch[1]} ${volMatch[2]}`
              }
              break
            }
          }
          if (volume) break
        }

        // Clean up product name
        productName = cleanProductName(productName)

        if (productName.length >= 3) {
          products.push({
            name: productName,
            price: price,
            volume: volume,
            priceType: type,
            confidence: bestPriority === 1 ? 'high' : (bestPriority === 2 ? 'medium' : 'low'),
            rawLine: line,
            context: context.join(' | ')
          })
        }
      }
    }
  }

  return products
}

/**
 * Extract best product name from context lines
 * @param {Array<string>} context - Lines around the price
 * @param {Set<string>} ignoreWords - Words to skip
 * @returns {string} - Best product name candidate
 */
function extractBestProductName(context, ignoreWords) {
  let candidates = []
  
  for (const line of context) {
    const cleaned = line
      .replace(/\d+[,.]?\d*\s*\$/g, '')  // Remove prices
      .replace(/\d+\s*pour\s*\d+[,.]?\d*\s*\$/g, '')  // Remove bulk prices
      .replace(/\d+¢/g, '')  // Remove cents
      .trim()
    
    if (cleaned.length >= 3 && !ignoreWords.has(cleaned.toLowerCase())) {
      // Prefer lines with actual product-like words
      const hasProductIndicators = /pommes|lait|pain|viande|poulet|boeuf|porc|fromage|yogourt|légumes|fruits/i.test(cleaned)
      const score = hasProductIndicators ? 10 : cleaned.length
      candidates.push({ text: cleaned, score })
    }
  }
  
  // Return highest scoring candidate
  candidates.sort((a, b) => b.score - a.score)
  return candidates.length > 0 ? candidates[0].text : context[0] || ''
}

/**
 * Clean and normalize product name
 * @param {string} name - Raw product name
 * @returns {string} - Cleaned name
 */
function cleanProductName(name) {
  return name
    .replace(/[^\w\sÀ-ÿ'-]/g, ' ')  // Keep alphanumeric + accents
    .replace(/\s+/g, ' ')            // Collapse whitespace
    .replace(/\b(du|de|la|le|les|un|une|des)\b/gi, '') // Remove articles
    .trim()
    .toLowerCase()
}

/**
 * Validate and clean parsed products
 * Enhanced with deduplication and better filtering
 * @param {Array} products - Raw parsed products
 * @returns {Array} - Cleaned and validated products
 */
export function validateProducts(products) {
  // Step 1: Filter out obvious errors
  let valid = products.filter(p => {
    // Remove obvious errors
    if (!p.name || p.name.length < 3) return false
    if (!p.price || p.price <= 0 || p.price > 500) return false
    if (p.name.match(/^\d+$/)) return false // Name is just numbers
    if (p.name.match(/^(page|du|au|limite)$/i)) return false // Common false positives
    return true
  })

  // Step 2: Deduplicate by similarity
  const deduplicated = []
  const seen = new Map()
  
  for (const p of valid) {
    // Create a normalized key for deduplication
    const normalizedName = p.name
      .toLowerCase()
      .replace(/[^a-zà-ÿ]/g, '')  // Remove numbers, spaces, punctuation
      .trim()
    
    // Check if we've seen a similar product
    let isDuplicate = false
    for (const [key, existing] of seen.entries()) {
      // If names are very similar (Levenshtein distance or simple contains)
      if (normalizedName.includes(key) || key.includes(normalizedName)) {
        // Keep the one with higher confidence or better price
        if (p.confidence === 'high' && existing.confidence !== 'high') {
          seen.set(key, p)
          const index = deduplicated.findIndex(x => x === existing)
          if (index >= 0) deduplicated[index] = p
        }
        isDuplicate = true
        break
      }
    }
    
    if (!isDuplicate) {
      seen.set(normalizedName, p)
      deduplicated.push(p)
    }
  }

  // Step 3: Clean and format
  return deduplicated.map(p => ({
    name: p.name,
    price: Math.round(p.price * 100) / 100, // Round to 2 decimals
    volume: p.volume || null,
    priceType: p.priceType || 'standard',
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
    logger: () => {}, // Reduce logging overhead
    tessedit_pageseg_mode: '3',
    tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789$.,% àâäéèêëïîôùûüÿçÀÂÄÉÈÊËÏÎÔÙÛÜŸÇ-',
  })

  let combinedText = ''
  let confidenceAcc = 0
  let count = 0
  const maxPages = Math.min(pageCount, 10) // Reduce to 10 pages for speed

  for(let i=1; i<=maxPages; i++){
    const page = await doc.getPage(i)
    const viewport = page.getViewport({ scale: 1.5 }) // Reduced from 2 for speed
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    canvas.width = viewport.width
    canvas.height = viewport.height
    await page.render({ canvasContext: ctx, viewport }).promise

    const { data } = await worker.recognize(canvas)
    combinedText += '\n' + (data.text || '')
    confidenceAcc += (data.confidence || 0)
    count += 1
    // Map page progress into first 70% as a fraction
    onProgress((i / maxPages) * 0.7)
  }

  await worker.terminate()

  onProgress(0.8)
  const rawProducts = parseProductsFromText(combinedText)
  onProgress(0.9)
  const validProducts = validateProducts(rawProducts)
  onProgress(1.0)

  const avgConf = count ? (confidenceAcc / count) : null
  return {
    products: validProducts,
    ocrConfidence: avgConf,
    rawText: combinedText,
    totalFound: rawProducts.length,
    validCount: validProducts.length
  }
}
