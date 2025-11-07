// Agrégateur de fournisseurs de prix
import { fetchOffers as mockFetch } from './providers/mockProvider'

const providers = [
  { id: 'mock', fetch: mockFetch }
  // À l'avenir: { id: 'iga', fetch: igaFetch }, etc.
]

export async function fetchBestOffers({ name, barcode }){
  const allOffers = []
  for(const p of providers){
    try {
      const offers = await p.fetch({ name, barcode })
      const normalized = offers.map(o => ({ ...o, provider: p.id }))
      allOffers.push(...normalized)
    } catch(e){ /* ignore provider errors */ }
  }
  // Trier par prix
  allOffers.sort((a,b) => a.price - b.price)
  return allOffers
}
