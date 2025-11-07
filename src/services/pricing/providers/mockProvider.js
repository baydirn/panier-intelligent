// Fournisseur mock qui simule des offres de prix pour IGA/Metro/Walmart

const KNOWN_PRODUCTS = [
  { match: /lait\s+qu[eé]bon\s+2l/i, offers: [
    { store: 'IGA', price: 4.99, availability: 'En stock' },
    { store: 'Metro', price: 5.29, availability: 'En stock' },
    { store: 'Walmart', price: 4.79, availability: 'En stock' }
  ]},
  { match: /pain\s+gadoua/i, offers: [
    { store: 'IGA', price: 3.49, availability: 'En stock' },
    { store: 'Metro', price: 3.59, availability: 'En stock' },
    { store: 'Walmart', price: 3.19, availability: 'En stock' }
  ]},
  { match: /poulet/i, offers: [
    { store: 'IGA', price: 11.99, availability: 'En stock' },
    { store: 'Metro', price: 12.49, availability: 'En stock' },
    { store: 'Walmart', price: 10.99, availability: 'En stock' }
  ]}
]

export async function fetchOffers({ name, barcode }){
  const text = (name || '').toLowerCase()
  for(const entry of KNOWN_PRODUCTS){
    if(entry.match.test(text)){
      // ajouter petite variation aléatoire pour simuler promo
      return entry.offers.map(o => ({
        ...o,
        price: Number((o.price + (Math.random()*0.2 - 0.1)).toFixed(2))
      }))
    }
  }
  // Valeurs par défaut si non reconnu
  return [
    { store: 'IGA', price: Number((5 + Math.random()*5).toFixed(2)), availability: 'En stock' },
    { store: 'Metro', price: Number((5 + Math.random()*5).toFixed(2)), availability: 'En stock' },
    { store: 'Walmart', price: Number((5 + Math.random()*5).toFixed(2)), availability: 'En stock' },
  ]
}
