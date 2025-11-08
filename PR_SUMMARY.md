# Pull Request: Community Flyer Upload Prep & Neutral Price Handling

## Résumé

Cette PR fusionne la branche `feature/community-flyer-upload` vers `main` en introduisant:

1. Neutralité pour les produits sans prix (pas de substitution à 0, affichage "Prix indisponible").
2. Intégration automatique du fichier `public/prices-meta.json` dans `/api/price-status`.
3. Optimisation améliorée: calcul de couverture, unknownCount, économies uniquement si couverture complète.
4. Correctif de build Rollup (suppression fallback ZXing; utilisation de BarcodeDetector natif seulement).
5. Scripts d'automatisation: génération des datasets et meta en pré-build.

## Modifications principales

| Fichier | Changement |
|---------|------------|
| `api/price-status.js` | Lecture locale `/prices-meta.json` avant fallback dynamique |
| `scripts/generate-prices-meta.js` | Nouveau script pour générer le résumé meta |
| `public/prices-meta.json` | Fichier généré (compte total & par magasin) |
| `src/services/optimisation.js` | Null préservé, couverture & unknownCount, tri par couverture |
| `src/pages/Analyse.jsx` | Badges couverture / prix manquants, économies conditionnelles |
| `src/pages/Liste.jsx` | Tri prix: null en dernier (ne biaise plus) |
| `src/components/ProductItem.jsx` | Badge "Prix indisponible" |
| `src/services/weeklyPrices.js` | Normalisation prix préservant null, exclusion non-numériques |
| `src/services/pricing/index.js` | Tri offres: prix null après prix numériques |
| `src/components/AddProductModalNew.jsx` | Retrait import ZXing direct -> évite erreur build |
| `package.json` | Scripts generate:prices / generate:meta + prebuild |

## Scripts

Pré-build exécute:
```
npm run generate:prices
npm run generate:meta
```

## Build

`vite build` : PASS local.

## Comportement Fonctionnel

- Analyse: couverture (%) & nombre de produits sans prix; économies affichées seulement si couverture complète.
- Listes: tri par prix place les inconnus à la fin.
- Items: prix absent clairement signalé.
- Endpoint status: source meta locale utilisée si disponible.

## Variables d'environnement

Configurer `VITE_PRICE_DATA_URL` sur Vercel pour pointer vers votre flux JSON enrichi (sinon fallback à `prices.initial.json`).

## Limitations & Follow-up

- Scanner: uniquement BarcodeDetector (fallback ZXing à réintroduire si besoin).
- À faire ensuite:
  - Flux upload communautaire + OCR.
  - Badge couverture dans page Magasin.
  - Tests unitaires optimisation & UI prix manquants.

## Validation

Manuel: navigation Liste, Analyse, ajout produit, tri prix, status meta.

## PR Checklist

- [x] Build passe
- [x] Meta générée
- [x] Neutralité prix vérifiée
- [ ] Tests automatisés (à ajouter)
- [ ] Documentation OCR (à venir)

---
Prêt pour revue & fusion.