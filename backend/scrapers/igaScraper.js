/**
 * IGA Web Scraper
 * Extrait les produits en promotion depuis IGA.net
 * 
 * APPROCHE:
 * 1. Essayer d'abord l'API interne (si découverte)
 * 2. Sinon, utiliser Puppeteer pour scraper le HTML
 */

// Chargement paresseux de puppeteer pour éviter un crash si Chromium n'est pas disponible.
// On ne l'importe plus en top-level afin que le serveur démarre même sans environnement de scraping complet.
import * as cheerio from 'cheerio'

// Code postal pour sélectionner automatiquement un magasin (configurable)
const IGA_POSTAL_CODE = process.env.IGA_POSTAL_CODE || 'H2Y1C6'

/**
 * Configuration du scraper IGA
 */
const IGA_CONFIG = {
  baseUrl: 'https://www.iga.net/fr',
  flyerUrl: 'https://www.iga.net/fr/circulaire',
  // Magasin par défaut (Québec) - À ajuster selon votre région
  defaultStoreId: null, // Sera détecté automatiquement
  timeout: 30000,
  headless: true, // true = invisible, false = voir le navigateur
}

/**
 * Méthode 1: Essayer de trouver et utiliser l'API interne
 */
export async function scrapeViaAPI(storeId = null) {
  console.log('[IGA API] Tentative de scraping via API interne...')
  
  // TODO: Implémenter après découverte de l'API
  // Cette fonction sera remplie quand vous aurez trouvé l'API endpoint
  
  throw new Error('API non encore découverte. Utilisez scrapeViaHTML() à la place.')
}

/**
 * Méthode 2: Scraper via Puppeteer (HTML parsing)
 */
export async function scrapeViaHTML(options = {}) {
  console.log('[IGA Scraper] Démarrage du scraping HTML...')
  let puppeteer
  try {
    puppeteer = await import('puppeteer').then(m => m.default || m)
  } catch (e) {
    console.error('[IGA Scraper] Puppeteer introuvable ou non chargeable:', e.message)
    throw new Error('Puppeteer non disponible sur ce déploiement')
  }
  const browser = await puppeteer.launch({
    headless: IGA_CONFIG.headless,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--disable-gpu'
    ]
  })

  try {
    const page = await browser.newPage()
    
    // Configuration de la page
    await page.setViewport({ width: 1920, height: 1080 })
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36')
    
    // Intercepter les requêtes réseau pour détecter les appels API
    const apiCalls = []
    page.on('response', async (response) => {
      const url = response.url()
      const type = response.request().resourceType()
      
      // Capturer les requêtes API/XHR qui contiennent probablement les données
      if ((type === 'xhr' || type === 'fetch') && 
          (url.includes('api') || url.includes('product') || url.includes('flyer'))) {
        try {
          const contentType = response.headers()['content-type']
          if (contentType && contentType.includes('json')) {
            const data = await response.json()
            apiCalls.push({
              url,
              method: response.request().method(),
              status: response.status(),
              data
            })
            console.log(`[API DISCOVERED] ${url}`)
          }
        } catch (e) {
          // Pas du JSON, ignorer
        }
      }
    })

    console.log('[IGA Scraper] Navigation vers page magasins...')
    try {
      await page.goto(`${IGA_CONFIG.baseUrl}/magasins?postalCode=${encodeURIComponent(IGA_POSTAL_CODE)}`, {
        waitUntil: 'domcontentloaded',
        timeout: IGA_CONFIG.timeout
      })
      await new Promise(r => setTimeout(r, 2000))

      // Essayer de cliquer sur le premier magasin disponible
      const storeClicked = await page.evaluate(() => {
        const storeLinks = Array.from(document.querySelectorAll('a'))
          .filter(a => /\/fr\/magasin\//.test(a.getAttribute('href') || ''))
        if (storeLinks.length > 0) {
          storeLinks[0].click()
          return true
        }
        return false
      })
      if (storeClicked) {
        console.log('[IGA Scraper] Magasin sélectionné (premier lien).')
        await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: IGA_CONFIG.timeout }).catch(()=>{})
      } else {
        console.log('[IGA Scraper] Aucun lien magasin cliquable détecté, on continue.')
      }
    } catch (e) {
      console.log('[IGA Scraper] Sélection magasin échouée, on continue. Raison:', e.message)
    }

    // Aller directement à la circulaire
    console.log('[IGA Scraper] Navigation vers la circulaire...')
    await page.goto(IGA_CONFIG.flyerUrl, {
      waitUntil: 'networkidle2',
      timeout: IGA_CONFIG.timeout
    })
    await new Promise(r => setTimeout(r, 3000))

    // Scroll pour charger plus de produits dynamiques
    for (let i = 0; i < 6; i++) {
      await page.evaluate(() => window.scrollBy(0, window.innerHeight))
      await new Promise(r => setTimeout(r, 1200))
    }

    // Extraire le HTML pour analyse
    const html = await page.content()
    
    // Parser avec Cheerio
    const $ = cheerio.load(html)
    
    // Analyse de la structure de la page
    console.log('[IGA Scraper] Analyse de la structure HTML...')
    
    // Chercher les conteneurs de produits (sélecteurs courants)
    const productSelectors = [
      '.product-card',
      '.product-item', 
      '.flyer-item',
      '[data-product]',
      '.promotion-item',
      '.special-item'
    ]

    let products = []
    
    for (const selector of productSelectors) {
      const items = $(selector)
      if (items.length > 0) {
        console.log(`[IGA Scraper] ✅ Trouvé ${items.length} éléments avec sélecteur: ${selector}`)
        
        items.each((i, elem) => {
          const $elem = $(elem)
          
          // Extraction des données complètes
          const product = {
            name: $elem.find('.product-name, .name, h3, h4, .tile__name').first().text().trim(),
            price: extractPrice($elem),
            volume: $elem.find('.product-size, .size, .volume, .tile__format').first().text().trim(),
            image: $elem.find('img').first().attr('src') || $elem.find('img').first().attr('data-src'),
            description: $elem.find('.description, .product-description, .tile__description').first().text().trim(),
            category: $elem.find('.category, .product-category').first().text().trim() || 
                     $elem.closest('[data-category]').attr('data-category') || '',
            // Dates de promotion (si disponibles)
            validFrom: $elem.find('.valid-from, [data-valid-from]').first().text().trim() ||
                      $elem.attr('data-valid-from') || '',
            validTo: $elem.find('.valid-to, [data-valid-to]').first().text().trim() ||
                    $elem.attr('data-valid-to') || '',
            // Données brutes pour debug
            dataProduct: $elem.attr('data-product'),
            productId: $elem.attr('data-product-id') || $elem.attr('id'),
            rawHtml: $elem.html().substring(0, 500) // Limiter pour performance
          }
          
          // Valider que le produit a au minimum un nom et un prix
          if (product.name && product.price > 0) {
            products.push(product)
          }
        })
        
        break // On a trouvé des produits, inutile de tester les autres sélecteurs
      }
    }

    // Incorporer les données éventuelles des appels API interceptés (offers/items)
    for (const call of apiCalls) {
      const data = call.data
      if (!data || typeof data !== 'object') continue

      const candidateArrays = []
      for (const key of Object.keys(data)) {
        const val = data[key]
        if (Array.isArray(val) && val.length && typeof val[0] === 'object') {
          candidateArrays.push(val)
        }
      }
      for (const arr of candidateArrays) {
        arr.forEach(raw => {
          const name = raw.name || raw.title || raw.productName || ''
          const priceVal = raw.price?.value || raw.currentPrice || raw.price || raw.salePrice || null
          const vol = raw.format || raw.size || raw.volume || ''
          const brand = raw.brand || raw.manufacturer || ''
          if (name && priceVal) {
            products.push({
              name: String(name).trim(),
              price: Number(priceVal),
              volume: vol || '',
              image: raw.imageUrl || raw.image || '',
              description: raw.description || '',
              category: raw.category || raw.categoryName || '',
              validFrom: raw.validFrom || raw.startDate || '',
              validTo: raw.validTo || raw.endDate || '',
              brand: brand,
              source: 'api-call'
            })
          }
        })
      }
    }

    // Dédupliquer (par nom + prix)
    products = products.filter(p => p && p.name).reduce((acc, p) => {
      const key = `${p.name}__${p.price}`
      if (!acc.map.has(key)) {
        acc.map.set(key, true)
        acc.list.push(p)
      }
      return acc
    }, { map: new Map(), list: [] }).list

    // Si aucun produit trouvé avec les sélecteurs standards ni API, dump la structure
    if (products.length === 0) {
      console.log('[IGA Scraper] ⚠️ Aucun produit trouvé avec les sélecteurs standards')
      console.log('[IGA Scraper] Dump de la structure pour analyse manuelle...')
      
      // Sauvegarder le HTML pour analyse
      const fs = await import('fs/promises')
      await fs.writeFile('iga-page-dump.html', html, 'utf-8')
      console.log('[IGA Scraper] HTML sauvegardé dans: iga-page-dump.html')
      
      // Afficher les classes CSS présentes
      const allClasses = new Set()
      $('[class]').each((i, elem) => {
        const classes = $(elem).attr('class').split(' ')
        classes.forEach(c => allClasses.add(c))
      })
      console.log('[IGA Scraper] Classes CSS trouvées:', Array.from(allClasses).slice(0, 50))
    }

    // Afficher les APIs découvertes
    if (apiCalls.length > 0) {
      console.log('\n[🎯 APIs DÉCOUVERTES]')
      apiCalls.forEach((call, i) => {
        console.log(`\n${i + 1}. ${call.method} ${call.url}`)
        console.log(`   Status: ${call.status}`)
        if (call.data && typeof call.data === 'object') {
          console.log(`   Data keys:`, Object.keys(call.data).slice(0, 10))
        }
      })
      
      // Sauvegarder les APIs découvertes
      const fs = await import('fs/promises')
      await fs.writeFile('iga-apis-discovered.json', JSON.stringify(apiCalls, null, 2), 'utf-8')
      console.log('\n[IGA Scraper] APIs sauvegardées dans: iga-apis-discovered.json')
    }

    await browser.close()

    return {
      success: products.length > 0,
      products,
      apisDiscovered: apiCalls,
      totalFound: products.length,
      timestamp: new Date().toISOString(),
      store: 'IGA',
      method: 'puppeteer-html+enhanced'
    }

  } catch (error) {
    await browser.close()
    console.error('[IGA Scraper] Erreur:', error)
    throw error
  }
}

/**
 * Helper: Extraire le prix d'un élément HTML
 */
function extractPrice($elem) {
  // Chercher le prix dans différents formats
  const priceSelectors = [
    '.price',
    '.product-price',
    '[data-price]',
    '.special-price',
    '.promotion-price'
  ]
  
  for (const selector of priceSelectors) {
    const priceText = $elem.find(selector).first().text()
    if (priceText) {
      const price = parsePrice(priceText)
      if (price > 0) return price
    }
  }
  
  // Chercher dans le data attribute
  const dataPrice = $elem.attr('data-price')
  if (dataPrice) {
    const price = parseFloat(dataPrice)
    if (!isNaN(price) && price > 0) return price
  }
  
  return 0
}

/**
 * Helper: Parser un prix depuis du texte
 */
function parsePrice(text) {
  if (!text) return 0
  
  // Nettoyer et extraire le nombre
  const cleaned = text.replace(/[^0-9,.]/g, '').replace(',', '.')
  const price = parseFloat(cleaned)
  
  return isNaN(price) ? 0 : price
}

/**
 * Point d'entrée principal
 */
export async function scrapeIGA(options = {}) {
  try {
    // Essayer l'API d'abord (si disponible)
    try {
      return await scrapeViaAPI(options.storeId)
    } catch (apiError) {
      console.log('[IGA Scraper] API non disponible, fallback sur HTML scraping')
    }
    
    // Fallback sur HTML scraping
    return await scrapeViaHTML(options)
    
  } catch (error) {
    console.error('[IGA Scraper] Échec complet:', error)
    return {
      success: false,
      error: error.message,
      products: [],
      totalFound: 0
    }
  }
}
