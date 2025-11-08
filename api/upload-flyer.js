// API endpoint to upload and process flyer images with OCR
// Uses Tesseract.js running in Node.js/Edge runtime

export const config = {
  runtime: 'edge',
  api: {
    bodyParser: false, // Handle multipart ourselves
  }
}

export default async function handler(req) {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' }
    })
  }

  try {
    // Parse multipart form data
    const formData = await req.formData()
    const file = formData.get('flyer')
    const storeName = formData.get('store') || 'Unknown'

    if (!file) {
      return new Response(JSON.stringify({ error: 'No file uploaded' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // Convert file to buffer for OCR processing
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Return placeholder response for now
    // OCR processing will be implemented client-side (Tesseract.js in browser)
    // This endpoint will store the extracted data after client processes it
    return new Response(JSON.stringify({
      success: true,
      message: 'File received. Process OCR client-side and submit extracted data.',
      filename: file.name,
      size: file.size,
      store: storeName
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Upload error:', error)
    return new Response(JSON.stringify({
      error: 'Upload failed',
      details: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}
