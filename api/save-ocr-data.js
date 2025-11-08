// API endpoint to save OCR-extracted prices
// Called by client after Tesseract.js processing

export const config = {
  runtime: 'edge'
}

export default async function handler(req) {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' }
    })
  }

  try {
    const { store, products, uploadedBy, imageUrl } = await req.json()

    if (!store || !products || !Array.isArray(products)) {
      return new Response(JSON.stringify({ error: 'Invalid data format' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // Validate products structure
    const validProducts = products.filter(p => p.name && p.price != null)

    if (validProducts.length === 0) {
      return new Response(JSON.stringify({ error: 'No valid products found' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // TODO: Save to database or file storage
    // For now, return success response
    const submission = {
      id: `flyer_${Date.now()}`,
      store,
      products: validProducts,
      uploadedBy: uploadedBy || 'anonymous',
      uploadedAt: new Date().toISOString(),
      imageUrl,
      status: 'pending_review' // Manual review before publishing
    }

    // In production: save to D1, KV, or external DB
    // await env.DB.prepare('INSERT INTO flyer_submissions ...').bind(...).run()

    return new Response(JSON.stringify({
      success: true,
      submissionId: submission.id,
      productsCount: validProducts.length,
      message: 'Soumission reçue! Elle sera révisée avant publication.'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Save OCR data error:', error)
    return new Response(JSON.stringify({
      error: 'Failed to save data',
      details: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}
