import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock tesseract worker to avoid heavy OCR
vi.mock('tesseract.js', () => ({
  createWorker: vi.fn(async (_lang, _oem, opts) => ({
    recognize: vi.fn(async (_img) => {
      // Simulate progress updates if logger provided (handled in service)
      return { data: { text: "Lait 2% 2L\n$3.99\nPâtes 500g 2$ 49", confidence: 87, words: [] } }
    }),
    terminate: vi.fn(async () => {})
  }))
}))

// Optional: mock pdfjs since we don't exercise processPdf here

import { processFlyer } from '../../services/ocrService'

describe('OCR pipeline (processFlyer) with mocked Tesseract', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('extracts and validates products with progress updates', async () => {
    // Blob-like stub; service just forwards file to worker so any object works
    const fakeImage = new Blob(["fake"], { type: 'image/png' })
    let lastProgress = 0
    const res = await processFlyer(fakeImage, (p) => { lastProgress = p })
    expect(res.validCount).toBeGreaterThan(0)
    expect(res.products.some(p => p.name.includes('lait'))).toBe(true)
    expect(res.ocrConfidence).toBe(87)
    expect(lastProgress).toBe(1)
  })
})
