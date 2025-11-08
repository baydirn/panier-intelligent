## Objet

- Neutralité des prix manquants (UI + logique)
- Intégration meta automatique (prices-meta.json)
- Amélioration optimisation: couverture, unknownCount, économies calculées seulement si couverture complète
- Correctif build: retrait fallback ZXing (BarcodeDetector natif uniquement)

## Détails des changements

- api/price-status.js: lecture auto de /prices-meta.json si aucune URL fournie; fallback propre
- scripts/generate-prices-meta.js: génération du résumé (total, perStore)
- public/prices-meta.json: artefact généré
- weeklyPrices + pricing: préservent null, trient les offres sans prix en bas
- optimisation.js: ne remplace plus null par 0, totalise uniquement les prix connus, ajoute coverage/unknownCount, trie par coverage
- Analyse.jsx: badges de couverture et prix manquants, rendu "Économie non calculable" si nécessaire, affichage "Prix indisponible" par item
- Liste.jsx: tri par prix place les nulls en dernier (pas de biais)
- ProductItem.jsx: badge "Prix indisponible"
- AddProductModalNew.jsx: retrait ZXing pour éviter l'erreur Rollup

## Notes de compatibilité

- Le scan code-barres s'appuie désormais uniquement sur BarcodeDetector; pour iOS plus anciens, l'entrée manuelle est proposée.
- Vercel: Set `VITE_PRICE_DATA_URL` pour pointer vers la source JSON enrichie si besoin.

## Tests/

- Build local: OK (vite build)
- Vérifications fonctionnelles: chargement liste, tri, analyse, badges de couverture.

## Suivi (prochaines étapes)

- Optionnel: réintroduire ZXing via import dynamique et config Vite adaptée
- UI: badge de couverture dans la page Magasin
- OCR/Upload: prochaine étape pour les circulaires communautaires
