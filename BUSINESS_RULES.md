# Business Rules: Données, Prix, Normalisation & Uploads

Ce document définit les standards incontournables avant toute évolution majeure.

## 1) Schéma Produit (standard minimal)

Champs persistés (LocalForage via `db.js`) — extensions compatibles rétro:

- id: string (nanoid)
- nom: string (affichage)
- nameKey: string (clé identité normalisée — voir Normalisation)
- marque: string|null
- volume: string|null (ex: `2L`, `500g`)
- quantite: number (>=1)
- categorie: string|null
- tags: string[] (bio, vegan, etc.)
- magasin: string|null (code canonical — voir Magasins)
- prix: number|null (>= 0, arrondi 2 décimales)
- prixSource: 'manuel' | 'optimisation' | 'weekly' | 'ocr' | 'estime' | null
- autoAssigned: boolean
- purchased: boolean
- createdAt/updatedAt: ISO string (optionnel)

Règles d’intégrité:
- `prix` >= 0, arrondi 2 décimales (déjà pris en charge par `db.js`).
- `quantite` >= 1.
- `magasin` doit être un code canonical si non-null.
- `nameKey` doit être mis à jour sur tout add/update/OCR merge.

## 2) Normalisation & Déduplication

- Fonction canonique: `normalizeProductName({ nom, marque?, volume? }) -> { baseName, marque, volume, nameKey, tokens }`.
- `nameKey = "{baseName}|{marque?}|{canonicalVolume?}"`.
- Similarité minimale: `computeSimilarity(a, b)` (Jaccard tokens) ∈ [0..1].
- Déduplication:
  - Auto-fusion si `nameKey` identique.
  - Proposer fusion si similarity > 0.85.
  - Fusion conserve historique des prix; un seul produit final.

## 3) Magasins (catalogue & canonicalisation)

- Catalogue commun (`src/domain/stores.js`).
- `canonicalizeStoreName(name)` mappe toute saisie vers un code canonical (ex: `Maxi`).
- Historique des prix et `magasin` dans produits utilisent toujours le code canonical.

## 4) Unités & Prix Unitaire

- `parseUnit(volume)` → { amount, unit } avec unités: `ml|l|g|kg`.
- `toCanonical(parsed)` convertit en base (ml/g) pour comparer.
- `computeUnitPrice(prix, volume)` → prix par unité canonique.
- Les suggestions et l’optimisation privilégient les meilleurs prix unitaires comparables (même type d’unité).

## 5) Sources de Prix & Provenance

Priorité logique (du plus fort au plus faible):
1. `product.prix` stocké + `magasin` (manuel/optimisation/OCR/weekly)
2. `product.prix` stocké sans magasin (appliqué à tous pour l’analyse)
3. Estimation (mock API `apiPrix.js`)

- Toute modification de prix doit définir `prixSource` et `autoAssigned` si non saisi manuellement.
- OCR: `prixSource='ocr'`. Optimisation: `prixSource='optimisation'`. Saisie manuelle: `prixSource='manuel'`.

## 6) Historique, Stats & Alertes

- Chaque observation de prix est enregistrée via `recordPriceObservation(nameKey, store, price)` (dédoublon jour+magasin).
- Alerte: `setPriceAlert(name, targetPrice)` → notification UI quand le prix < cible.
- Stats (à venir): économies cumulées vs baseline, moyennes par magasin, tendances.

## 7) OCR Upload — Politique Admin-Only (Sécurité)

- Par défaut, l’upload OCR communautaire est désactivé (admin uniquement).
- Feature flag: `VITE_COMMUNITY_OCR_UPLOAD_ENABLED` (`"true"|"false"`).
- La UI ne doit afficher le bouton d’upload que si `canShowOcrUpload()` est vrai (admin OU flag true).
- Workflow cible: `submitOcrForAdminReview(payload)` côté backend → validation → inclusion en base hebdo.

## 8) Optimisation Multi-Critères

- Critères pris en compte: prix total, distance totale (km), nb de magasins, couverture (% items avec prix), favoris.
- Poids par défaut: `{ price: 0.6, distance: 0.25, nbStores: 0.1, favoritesBoost: 0.05, coveragePenalty: 0.2 }`.
- Score `scoreCombination(inputs, weights, bounds)` (plus bas = meilleur).
- La couverture partielle applique une pénalité.

## 9) Règles de Remplacement OCR

- Paramètre: `ocrPriceReplaceMode` ∈ { `always`, `better`, `never` }.
- `always`: remplace toujours.
- `better`: remplace si prix OCR < prix courant ou prix courant absent.
- `never`: ne remplace pas un prix existant (sauf si null).

Ces standards sont verrouillés pour les prochaines itérations; toute déviation doit être explicitée et documentée.
