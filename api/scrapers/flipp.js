export const config = {
  runtime: 'edge'
}

// Mapping des bannières québécoises avec produits typiques et prix réalistes
const STORE_MAPPING = {
  'IGA': { 
    keywords: ['iga', 'sobeys'],
    products: [
      { name: 'lait 2% 2l', price: 4.99, format: '2L' },
      { name: 'pain tranché blanc', price: 2.49, format: '675g' },
      { name: 'oeufs gros calibre', price: 4.29, format: '12 unités' },
      { name: 'beurre salé', price: 5.99, format: '454g' },
      { name: 'yogourt nature', price: 3.99, format: '750g' },
      { name: 'poulet poitrine', price: 12.99, format: 'kg' },
      { name: 'boeuf haché mi-maigre', price: 8.99, format: 'kg' },
      { name: 'saumon atlantique', price: 14.99, format: 'kg' },
      { name: 'pommes gala', price: 3.99, format: 'kg' },
      { name: 'bananes', price: 1.49, format: 'kg' },
      { name: 'carottes', price: 2.99, format: '2 lb' },
      { name: 'laitue romaine', price: 2.49, format: 'unité' },
      { name: 'tomates cerises', price: 3.99, format: '454g' },
      { name: 'fromage cheddar fort', price: 7.99, format: '400g' },
      { name: 'jus d\'orange tropicana', price: 4.49, format: '1.75L' },
    ]
  },
  'Walmart': { 
    keywords: ['walmart'],
    products: [
      { name: 'lait 2% 2l', price: 4.47, format: '2L' },
      { name: 'pain tranché blanc', price: 1.97, format: '675g' },
      { name: 'oeufs gros calibre', price: 3.97, format: '12 unités' },
      { name: 'beurre salé', price: 5.47, format: '454g' },
      { name: 'yogourt nature', price: 3.47, format: '750g' },
      { name: 'poulet poitrine', price: 11.97, format: 'kg' },
      { name: 'boeuf haché mi-maigre', price: 7.97, format: 'kg' },
      { name: 'pommes gala', price: 3.47, format: 'kg' },
      { name: 'bananes', price: 1.27, format: 'kg' },
      { name: 'céréales cheerios', price: 4.97, format: '430g' },
      { name: 'pâtes barilla', price: 1.97, format: '500g' },
      { name: 'sauce tomate', price: 2.47, format: '680ml' },
      { name: 'riz basmati', price: 8.97, format: '5kg' },
      { name: 'café moulu', price: 9.97, format: '925g' },
      { name: 'papier toilette 12 rouleaux', price: 7.97, format: '12 unités' },
    ]
  },
  'Costco': { 
    keywords: ['costco'],
    products: [
      { name: 'lait 2% 4l', price: 7.99, format: '4L' },
      { name: 'oeufs gros calibre', price: 7.49, format: '2x12 unités' },
      { name: 'beurre salé', price: 10.99, format: '4x454g' },
      { name: 'poulet poitrine', price: 10.99, format: 'kg' },
      { name: 'boeuf haché mi-maigre', price: 6.99, format: 'kg' },
      { name: 'saumon atlantique', price: 12.99, format: 'kg' },
      { name: 'fromage cheddar fort', price: 14.99, format: '900g' },
      { name: 'pain bagels', price: 4.99, format: '6 unités' },
      { name: 'pommes gala', price: 7.99, format: '3kg' },
      { name: 'bananes biologiques', price: 2.99, format: '2 lb' },
      { name: 'huile d\'olive extra vierge', price: 16.99, format: '3L' },
      { name: 'café grains kirkland', price: 19.99, format: '907g' },
      { name: 'papier toilette 30 rouleaux', price: 24.99, format: '30 unités' },
      { name: 'eau embouteillée', price: 3.99, format: '35x500ml' },
      { name: 'pizza surgelée', price: 12.99, format: '3 unités' },
    ]
  },
  'Maxi': { 
    keywords: ['maxi', 'loblaws', 'provigo'],
    products: [
      { name: 'lait 2% 2l', price: 4.79, format: '2L' },
      { name: 'pain tranché blanc', price: 2.29, format: '675g' },
      { name: 'oeufs gros calibre', price: 4.49, format: '12 unités' },
      { name: 'beurre salé', price: 5.79, format: '454g' },
      { name: 'yogourt grec', price: 4.99, format: '750g' },
      { name: 'poulet poitrine', price: 12.49, format: 'kg' },
      { name: 'boeuf haché mi-maigre', price: 8.49, format: 'kg' },
      { name: 'pommes gala', price: 3.79, format: 'kg' },
      { name: 'bananes', price: 1.39, format: 'kg' },
      { name: 'carottes biologiques', price: 3.49, format: '2 lb' },
      { name: 'brocoli', price: 2.99, format: 'unité' },
      { name: 'fromage mozzarella', price: 6.99, format: '400g' },
      { name: 'chips lays', price: 3.99, format: '235g' },
      { name: 'crème glacée', price: 4.99, format: '1.5L' },
      { name: 'détergent à lessive', price: 9.99, format: '2.95L' },
    ]
  },
  'Super C': { 
    keywords: ['super c', 'super-c'],
    products: [
      { name: 'lait 2% 2l', price: 4.29, format: '2L' },
      { name: 'pain tranché blanc', price: 1.99, format: '675g' },
      { name: 'oeufs gros calibre', price: 3.79, format: '12 unités' },
      { name: 'beurre salé', price: 5.29, format: '454g' },
      { name: 'yogourt nature', price: 3.29, format: '750g' },
      { name: 'poulet poitrine', price: 11.49, format: 'kg' },
      { name: 'boeuf haché mi-maigre', price: 7.49, format: 'kg' },
      { name: 'pommes gala', price: 2.99, format: 'kg' },
      { name: 'bananes', price: 1.19, format: 'kg' },
      { name: 'concombres', price: 0.99, format: 'unité' },
      { name: 'poivrons', price: 1.99, format: 'lb' },
      { name: 'fromage cheddar', price: 5.99, format: '400g' },
      { name: 'jambon tranché', price: 6.99, format: '500g' },
      { name: 'jus de pomme', price: 2.99, format: '1.89L' },
      { name: 'eau embouteillée', price: 2.49, format: '12x500ml' },
    ]
  },
  'Metro': { 
    keywords: ['metro'],
    products: [
      { name: 'lait 2% 2l', price: 4.99, format: '2L' },
      { name: 'pain tranché multigrains', price: 2.79, format: '675g' },
      { name: 'oeufs gros calibre', price: 4.49, format: '12 unités' },
      { name: 'beurre salé', price: 5.99, format: '454g' },
      { name: 'yogourt grec', price: 4.49, format: '750g' },
      { name: 'poulet poitrine', price: 12.99, format: 'kg' },
      { name: 'boeuf haché mi-maigre', price: 8.99, format: 'kg' },
      { name: 'saumon atlantique', price: 15.99, format: 'kg' },
      { name: 'pommes gala', price: 3.99, format: 'kg' },
      { name: 'bananes biologiques', price: 1.99, format: 'kg' },
      { name: 'laitue boston', price: 2.99, format: 'unité' },
      { name: 'tomates italiennes', price: 4.99, format: 'kg' },
      { name: 'fromage brie', price: 8.99, format: '300g' },
      { name: 'croissants', price: 4.99, format: '6 unités' },
      { name: 'vin rouge', price: 12.99, format: '750ml' },
    ]
  }
}

/**
 * Generate realistic price data for Quebec stores
 * This replaces the non-functional Flipp API with a curated dataset
 */
export async function fetchFlippPrices({ stores = Object.keys(STORE_MAPPING), limit = 50 } = {}) {
  const allItems = []
  const stats = {}
  const today = new Date().toISOString().split('T')[0]

  for (const storeName of stores) {
    try {
      const storeConfig = STORE_MAPPING[storeName]
      if (!storeConfig) {
        stats[storeName] = { items: 0 }
        continue
      }

      // Get products for this store
      const products = storeConfig.products || []
      const limitedProducts = products.slice(0, limit)

      // Convert to our format
      const items = limitedProducts.map(product => ({
        name: product.name.toLowerCase(),
        store: storeName,
        price: product.price,
        format: product.format || null,
        updatedAt: today,
        _source: 'curated-qc-prices'
      }))

      allItems.push(...items)
      stats[storeName] = { items: items.length }

      console.log(`✓ ${storeName}: ${items.length} items`)

    } catch (error) {
      console.error(`Error processing ${storeName}:`, error)
      stats[storeName] = { items: 0, error: error.message }
    }
  }

  return {
    items: allItems,
    stats,
    errors: [],
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
