export const config = {
  runtime: 'edge'
}

// Flipp API endpoints (reverse-engineered from their mobile app)
const FLIPP_API_BASE = 'https://flipp.com/api/v4'
const FLIPP_SEARCH_URL = `${FLIPP_API_BASE}/items`

// Mapping des bannières québécoises aux IDs Flipp
const STORE_MAPPING = {
  'IGA': { flippId: 'iga', keywords: ['iga', 'sobeys'] },
  'Walmart': { flippId: 'walmart', keywords: ['walmart'] },
  'Costco': { flippId: 'costco', keywords: ['costco'] },
  'Maxi': { flippId: 'maxi', keywords: ['maxi', 'loblaws', 'provigo'] },
  'Super C': { flippId: 'super-c', keywords: ['super c', 'super-c'] },
  'Metro': { flippId: 'metro', keywords: ['metro'] }
}

// Postal codes majeurs du Québec pour géolocalisation
const QC_POSTAL_CODES = [
  'H1A 0A1', // Montréal Est
  'H2X 1Y4', // Montréal Centre-Ville
  'H3A 0G4', // Montréal Ouest
  'G1A 1A1', // Québec
  'J4H 0A1', // Longueuil
  'J7V 0A1', // Laval
  'J3X 0A1', // Brossard
]

/**
 * Fetch flyers for a specific store in Quebec
 */
async function fetchStoreFlyers(storeName, postalCode = 'H2X 1Y4') {
  try {
    const storeConfig = STORE_MAPPING[storeName]
    if (!storeConfig) {
      console.warn(`Store ${storeName} not found in mapping`)
      return []
    }

    // Flipp API endpoint pour les circulaires
    const url = new URL(`${FLIPP_API_BASE}/flyers`)
    url.searchParams.set('locale', 'fr-ca')
    url.searchParams.set('postal_code', postalCode)
    url.searchParams.set('q', storeConfig.keywords[0])

    const response = await fetch(url.toString(), {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (compatible; PanierIntelligent/1.0; +https://github.com/baydirn/panier-intelligent)'
      }
    })

    if (!response.ok) {
      console.error(`Flipp API error for ${storeName}: ${response.status}`)
      return []
    }

    const data = await response.json()
    return data.flyers || []
  } catch (error) {
    console.error(`Error fetching flyers for ${storeName}:`, error)
    return []
  }
}

/**
 * Fetch items from a specific flyer
 */
async function fetchFlyerItems(flyerId, storeName) {
  try {
    const url = `${FLIPP_API_BASE}/flyers/${flyerId}/items`
    
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (compatible; PanierIntelligent/1.0)'
      }
    })

    if (!response.ok) {
      console.error(`Failed to fetch items for flyer ${flyerId}: ${response.status}`)
      return []
    }

    const data = await response.json()
    const items = data.items || []

    // Normalize to our format
    return items.map(item => normalizeFlippItem(item, storeName)).filter(Boolean)
  } catch (error) {
    console.error(`Error fetching flyer items:`, error)
    return []
  }
}

/**
 * Normalize Flipp item to our schema
 */
function normalizeFlippItem(item, storeName) {
  try {
    // Extract price - Flipp uses various formats
    let price = null
    if (item.current_price) {
      price = parseFloat(item.current_price)
    } else if (item.price) {
      price = parseFloat(item.price)
    } else if (item.sale_story) {
      // Try to extract from sale_story like "$2.99" or "2 pour $5"
      const match = item.sale_story.match(/\$?(\d+[.,]\d{2})/)
      if (match) price = parseFloat(match[1].replace(',', '.'))
    }

    if (!price || isNaN(price)) return null

    // Extract product name
    const name = (item.name || item.description || '').trim().toLowerCase()
    if (!name) return null

    // Extract format/size
    let format = null
    if (item.size) {
      format = item.size
    } else if (item.sale_story) {
      // Try to extract size from sale_story
      const sizeMatch = item.sale_story.match(/(\d+\s*(g|kg|ml|l|oz|lb|units?|un))/i)
      if (sizeMatch) format = sizeMatch[0]
    }

    return {
      name,
      store: storeName,
      price,
      format: format || null,
      updatedAt: new Date().toISOString().split('T')[0],
      // Metadata for debugging
      _source: 'flipp',
      _itemId: item.id,
      _flyerId: item.flyer_id
    }
  } catch (error) {
    console.error('Error normalizing item:', error)
    return null
  }
}

/**
 * Fetch all prices from Flipp for Quebec stores
 */
export async function fetchFlippPrices({ stores = Object.keys(STORE_MAPPING), limit = 50 } = {}) {
  const allItems = []
  const errors = []
  const stats = {}

  for (const storeName of stores) {
    try {
      console.log(`Fetching flyers for ${storeName}...`)
      
      // Get active flyers for this store
      const flyers = await fetchStoreFlyers(storeName)
      
      if (flyers.length === 0) {
        console.warn(`No flyers found for ${storeName}`)
        stats[storeName] = { flyers: 0, items: 0 }
        continue
      }

      let storeItems = []
      
      // Limit to most recent flyer to avoid rate limiting
      const recentFlyers = flyers.slice(0, 2)
      
      for (const flyer of recentFlyers) {
        const items = await fetchFlyerItems(flyer.id, storeName)
        storeItems.push(...items)
        
        // Rate limiting: wait 500ms between flyer requests
        await new Promise(resolve => setTimeout(resolve, 500))
      }

      // Limit items per store
      const limitedItems = storeItems.slice(0, limit)
      allItems.push(...limitedItems)

      stats[storeName] = {
        flyers: recentFlyers.length,
        items: limitedItems.length
      }

      console.log(`✓ ${storeName}: ${limitedItems.length} items from ${recentFlyers.length} flyers`)

    } catch (error) {
      console.error(`Error processing ${storeName}:`, error)
      errors.push({ store: storeName, error: error.message })
      stats[storeName] = { flyers: 0, items: 0, error: error.message }
    }

    // Rate limiting between stores
    await new Promise(resolve => setTimeout(resolve, 1000))
  }

  return {
    items: allItems,
    stats,
    errors,
    totalItems: allItems.length,
    generatedAt: new Date().toISOString()
  }
}

/**
 * Edge function handler
 */
export default async function handler(request) {
  const { searchParams } = new URL(request.url)
  const secret = searchParams.get('secret')
  
  // Basic authentication
  if (secret !== process.env.CRON_SECRET) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    })
  }

  try {
    // Optional test mode that returns a tiny static payload so you can verify the endpoint quickly
    if (searchParams.get('dry') === '1') {
      const sample = {
        items: [
          { name: 'lait 2% 2l', store: 'IGA', price: 3.99, format: '2L', updatedAt: new Date().toISOString().split('T')[0], _source: 'flipp-dry' },
          { name: 'bananes', store: 'Walmart', price: 0.79, format: 'lb', updatedAt: new Date().toISOString().split('T')[0], _source: 'flipp-dry' }
        ],
        stats: { IGA: { flyers: 1, items: 1 }, Walmart: { flyers: 1, items: 1 } },
        errors: [],
        totalItems: 2,
        generatedAt: new Date().toISOString(),
        debug: { mode: 'dry' }
      }
      return new Response(JSON.stringify(sample, null, 2), { status: 200, headers: { 'Content-Type': 'application/json' } })
    }

    const storesParam = searchParams.get('stores')
    const stores = storesParam ? storesParam.split(',') : undefined
    const limit = parseInt(searchParams.get('limit') || '50')

    const result = await fetchFlippPrices({ stores, limit })
    if (searchParams.get('debug') === '1') {
      result.debug = {
        requestUrl: request.url,
        stores,
        limit
      }
    }

    return new Response(JSON.stringify(result, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache'
      }
    })
  } catch (error) {
    console.error('Flipp scraper error:', error)
    return new Response(JSON.stringify({ 
      error: error.message,
      stack: error.stack 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}
