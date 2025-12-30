/**
 * Service de substitutions de produits
 * Trouve des produits similaires moins chers pour augmenter les économies
 */

/**
 * Trouve des produits similaires moins chers
 * @param {Object} product - Produit actuel {nom, prix, magasin}
 * @param {Object} pricesMap - Map de tous les prix {nomProduit: {magasin: prix}, __meta: {...}}
 * @returns {Array} Alternatives triées par économies [{nom, prix, magasin, savings, savingsPct, similarity}]
 */
export function findSubstitutions(product, pricesMap) {
  const currentPrice = product.prix
  if (!currentPrice || !pricesMap) return []

  const productKey = normalizeName(product.nom)
  const alternatives = []

  // Parcourir tous les produits dans la price map
  for (const [nameKey, stores] of Object.entries(pricesMap)) {
    if (nameKey === '__meta' || nameKey === productKey) continue

    // Calculer similarité par nom (matching basique)
    const similarity = calculateSimilarity(productKey, nameKey)
    if (similarity < 0.4) continue  // Threshold 40% similarité minimum

    // Trouver meilleur prix pour ce produit alternatif
    const storePrices = Object.entries(stores)
      .filter(([store, price]) => store !== '__meta' && typeof price === 'number')
      .sort((a, b) => a[1] - b[1])

    if (storePrices.length === 0) continue

    const [bestStore, bestPrice] = storePrices[0]

    // Calculer économies
    const savings = currentPrice - bestPrice
    const savingsPct = (savings / currentPrice) * 100

    // Ne suggérer que si économies >= 50¢ ET prix inférieur
    if (savings >= 0.50) {
      alternatives.push({
        nom: nameKey,
        prix: bestPrice,
        magasin: bestStore,
        savings,
        savingsPct: savingsPct.toFixed(1),
        similarity
      })
    }
  }

  // Trier par économies décroissantes, puis par similarité
  return alternatives
    .sort((a, b) => {
      // D'abord par économies
      if (Math.abs(b.savings - a.savings) > 0.01) {
        return b.savings - a.savings
      }
      // Puis par similarité si économies équivalentes
      return b.similarity - a.similarity
    })
    .slice(0, 5)  // Top 5 alternatives
}

/**
 * Calcule similarité entre 2 noms de produits (0-1)
 * Basé sur overlap de mots clés
 */
function calculateSimilarity(str1, str2) {
  const words1 = tokenize(str1)
  const words2 = tokenize(str2)

  if (words1.length === 0 || words2.length === 0) return 0

  // Mots en commun
  const common = words1.filter(w => words2.includes(w))

  // Jaccard similarity: intersection / union
  const union = new Set([...words1, ...words2]).size
  const intersection = common.length

  return intersection / union
}

/**
 * Tokenize un nom de produit en mots clés
 * Normalise, filtre les stop words, retire tailles/formats
 */
function tokenize(str) {
  const stopWords = new Set(['de', 'la', 'le', 'du', 'des', 'et', 'ou', 'a', 'au', 'en'])
  const sizePatterns = /\d+\s*(ml|l|kg|g|mg|oz|lb|pc|cm|mm|m)/gi

  return str
    .toLowerCase()
    .replace(sizePatterns, '') // Retire formats (500ml, 2kg, etc.)
    .replace(/[^\w\s]/g, ' ')  // Retire ponctuation
    .split(/\s+/)
    .filter(w => w.length > 2 && !stopWords.has(w))
}

/**
 * Normalise un nom de produit pour matching
 */
function normalizeName(name) {
  return (name || '').toLowerCase().trim()
}
