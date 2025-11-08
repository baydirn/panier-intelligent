// Agrégateur de fournisseurs de prix
import { fetchOffers as mockFetch } from './providers/mockProvider'
import { getBestWeeklyOffers } from '../weeklyPrices'

const providers = [
  { id: 'weekly', fetch: async ({ name }) => {
    const offers = await getBestWeeklyOffers(name)
    return offers.map(o => ({ store: o.store, price: o.price, availability: 'Semaine', updatedAt: o.updatedAt }))
  }},
  { id: 'mock', fetch: mockFetch }
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
