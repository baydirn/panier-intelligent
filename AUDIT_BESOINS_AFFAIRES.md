# Rapport d'Audit — Besoins & Règles d'Affaires
**Date:** 2025-11-09  
**Projet:** Panier Intelligent  
**Analyste:** Copilot AI

---

## 1. Résumé Exécutif

### Statut Global
- **Couverture fonctionnelle:** ~65% (besoins principaux implémentés, bonifications stratégiques partielles)
- **Conformité règles métier:** ~70% (provenance prix OK, normalisation partielle, doublons non couverts)
- **Gaps critiques:** 8 fonctionnalités manquantes ou incomplètes
- **Priorité immédiate:** Normalisation produits, détection doublons, validation admin circulaires

---

## 2. Analyse Détaillée par Section

### 2.1 Gestion des Listes d'Épicerie (Besoin 1.1)

| Fonctionnalité | Statut | Implémentation | Gap |
|---|---|---|---|
| Ajouter produit manuellement | ✅ OK | `Liste.jsx` (`onAdd`, `AddProductModalNew.jsx`) | — |
| Ajouter via code-barres | ❌ ABSENT | — | **Besoin scanner barcode + base UPC→produit** |
| Quantité par défaut = 1 | ✅ OK | `db.js` `addProduct({ quantite: product.quantite ?? 1 })` | — |
| Volume (optionnel) | ❌ ABSENT | Pas de champ `volume` dans schéma produit | **Ajouter champ `volume` (ex: "2L", "500g")** |
| Marque (optionnel) | ❌ ABSENT | Pas de champ `marque` dans schéma produit | **Ajouter champ `marque` et l'afficher dans ProductItem** |
| Modifier produit | ✅ OK | `EditProductModal.jsx`, `updateProduct` | — |
| Supprimer produit | ✅ OK | `ProductItem` bouton Supprimer → `removeProduct` | — |
| Tagger récurrent | ✅ OK | `ProductItem` bouton Récurrent → `updateProduct({ recurrent: true })` | — |
| Détection doublons | ⚠️ PARTIEL | Vérification nom exact lowercase dans `Liste.onAdd` | **Pas de normalisation sémantique (ex: "Lait 2%" vs "lait 2 %")** |
| Fusion doublons | ❌ ABSENT | Aucun mécanisme de fusion auto ou proposé | **Proposer fusion si similarity > seuil (Levenshtein ou tokenization)** |
| Suggestions alternatives | ✅ OK | `ProductItem` → `suggestions.js` (Jaccard keywords) | Bon, mais limité aux produits en base `productsDatabase.js` |
| Produits absents visibles | ✅ OK | `Analyse.jsx` affiche `unknownCount` + badge "sans prix" | — |
| Enregistrer/charger listes | ✅ OK | `MesListes.jsx`, `db.js` (savedLists) | — |
| Support multi-unités | ❌ ABSENT | Pas de parsing/conversion unités (L↔mL, kg↔g) | **Ajouter service `units.js` pour parseFormat + conversion** |

**Score:** 7/12 ✅ | 1/12 ⚠️ | 4/12 ❌

**Gaps Critiques:**
1. **Code-barres:** Aucun scanner UPC/EAN intégré.
2. **Volume/Marque:** Schéma produit incomplet (normalisation impossible sans ces champs).
3. **Fusion doublons:** Uniquement détection exacte lowercase; pas de proposition de fusion ni normalisation sémantique.
4. **Multi-unités:** Service `utils/units.js` existe (`parseFormat`, `computeUnitPrice`) mais pas utilisé pour conversion ou comparaison équivalente (ex: 1L vs 1000mL).

---

### 2.2 Analyse et Optimisation (Besoin 1.2)

| Fonctionnalité | Statut | Implémentation | Gap |
|---|---|---|---|
| Sélectionner liste | ✅ OK | `Analyse.jsx` dropdown listes + `loadSavedList` | — |
| Paramètres: max magasins | ✅ OK | `Parametres.jsx` `maxStoresToCombine`, `settings` | — |
| Paramètres: rayon géo | ✅ OK | `Parametres.jsx` `searchRadiusKm` | — |
| Magasins favoris/exclus | ⚠️ PARTIEL | `favoriteStores` stocké mais **pas utilisé dans optimisation** | **Intégrer favoris dans scoring `optimisation.js`** |
| 3 meilleures combinaisons | ✅ OK | `trouverCombinaisonsOptimales(..., 3)` → top 3 | — |
| Critère: prix total min | ✅ OK | Tri principal par `total` croissant | — |
| Critère: distance min | ❌ ABSENT | Aucun calcul distance géo dans combinaisons | **Ajouter calcul distance→parcours total** |
| Critère: nb magasins min | ⚠️ PARTIEL | Implicite (nb stores), mais pas de tri secondaire | **Tri multi-critères: prix → distance → nb magasins** |
| Choisir combinaison | ✅ OK | `handleUseCombination` → `applyCombination` | — |
| Simuler scénarios | ⚠️ PARTIEL | Modifier paramètres re-lance analyse, mais pas de vue "compare" | **Ajouter mode compare 2+ scénarios côte-à-côte** |

**Score:** 5/10 ✅ | 3/10 ⚠️ | 2/10 ❌

**Gaps Critiques:**
1. **Distance:** Aucune intégration géolocalisation dans scoring combinaisons (magasins connus mais distance utilisateur→magasin ignorée).
2. **Magasins favoris:** Enregistrés mais non utilisés pour boost score ou contrainte.
3. **Tri multi-critères:** Un seul critère (prix). Besoin de scoring composite (prix × 0.6 + distance × 0.3 + nb_mag × 0.1, par exemple).

---

### 2.3 Magasin (Besoin 1.3)

| Fonctionnalité | Statut | Implémentation | Gap |
|---|---|---|---|
| Cocher produits achetés | ✅ OK | `Magasin.jsx` cases à cocher → `handleTogglePurchased` | — |
| Modifier quantité | ✅ OK | Boutons +/- dans `ProductItem` | — |
| Produit alternatif | ✅ OK | `ProductItem` suggestions alternatives | — |
| Itinéraire optimisé | ❌ ABSENT | Liste simple par magasin, pas de parcours dans magasin | **Cartographie rayon/allée intra-magasin** |

**Score:** 3/4 ✅ | 0/4 ⚠️ | 1/4 ❌

**Gap Critique:**
- **Itinéraire optimisé:** Nécessite base de données layout magasin (rayons, allées) — très complexe, dépend partenariat magasins. **Priority:** Low (non bloquant MVP).

---

### 2.4 Paramètres (Besoin 1.4)

| Fonctionnalité | Statut | Implémentation | Gap |
|---|---|---|---|
| Config préférences | ✅ OK | `Parametres.jsx` (max magasins, rayon, favoris, OCR mode) | — |
| Vérifier fraîcheur données | ✅ OK | `weeklyMeta.lastFetched` affiché | — |
| Upload circulaires | ✅ OK | `UploadFlyerModal` (PDF/image OCR) | — |
| Saisie manuelle magasin/période | ✅ OK | Formulaire store + dates dans modal | — |
| Sync base centrale | ❌ ABSENT | Aucun endpoint serveur `/api/admin/validate` | **POST vers API admin pour review** |
| Alertes promotions | ⚠️ PARTIEL | `setPriceAlert` existe, alerte déclenchée dans `Liste.handleFetchPrice` | **Pas de notification push ni scan automatique** |

**Score:** 4/6 ✅ | 1/6 ⚠️ | 1/6 ❌

**Gap Critique:**
- **Sync centrale:** OCR reste local (KV + weeklyPrices). Besoin endpoint `/api/admin/upload-for-review` + workflow validation admin.

---

### 2.5 Listes et Produits Récurrents (Besoin 1.5)

| Fonctionnalité | Statut | Implémentation | Gap |
|---|---|---|---|
| Afficher listes | ✅ OK | `MesListes.jsx` | — |
| Gérer récurrents | ✅ OK | `Recurrentes.jsx` | — |
| Éviter doublons récurrents | ⚠️ PARTIEL | Vérification nom lowercase dans `addRecurrentProduct` | **Pas de normalisation sémantique** |
| Fusion auto récurrents | ⚠️ PARTIEL | `detectRecurrentCandidates` suggère, mais fusion manuelle | **Auto-fusion si confiance > seuil** |
| Historique achats | ✅ OK | `getPriceHistory` par produit | — |
| Historique prix | ✅ OK | `PriceHistoryModal`, sparkline | — |
| Statistiques personnelles | ❌ ABSENT | Aucune vue "économies réalisées" ou "prix moyen par magasin" | **Ajouter page Statistiques** |

**Score:** 4/7 ✅ | 2/7 ⚠️ | 1/7 ❌

**Gap Critique:**
- **Statistiques:** Données historiques collectées mais aucune agrégation/visualisation (économies vs baseline, évolution prix, magasin le plus économique par catégorie).

---

### 2.6 Bonifications UX et Collaboration (Besoin 1.6)

| Fonctionnalité | Statut | Implémentation | Gap |
|---|---|---|---|
| Multi-profil utilisateur | ❌ ABSENT | LocalForage global, pas de notion user_id | **Ajouter auth + profiles** |
| Partage listes | ❌ ABSENT | Aucune fonctionnalité collaborative | **Share link ou sync real-time (WebSocket/Firebase)** |
| Fusion listes partagées | ❌ ABSENT | — | **Merge conflicts resolution UI** |
| Filtres avancés (bio, etc.) | ❌ ABSENT | Pas de champ `tags` ou `labels` dans produit | **Ajouter metadata (bio, vegan, gluten-free, etc.)** |
| Score qualité/prix | ⚠️ PARTIEL | Unit price calc dans `suggestions.js`, mais pas de score global | **Ajouter badge score composite (prix+qualité+avis)** |

**Score:** 0/5 ✅ | 1/5 ⚠️ | 4/5 ❌

**Gap Critique:**
- **Collaboration:** Aucune feature multi-user. Besoin backend + auth pour partage.
- **Filtres/tags:** Schéma produit ne supporte pas metadata filtrable.

---

### 2.7 Admin (Besoin 2)

| Fonctionnalité | Statut | Implémentation | Gap |
|---|---|---|---|
| Upload circulaires admin | ❌ ABSENT | Aucun endpoint `/api/admin/upload` | **Backend endpoint + UI admin** |
| Validation circulaires users | ❌ ABSENT | OCR directement ingéré localement | **Workflow review: pending → approved → rejected** |
| Gestion doublons base | ❌ ABSENT | — | **Admin UI pour merge/normalize produits** |
| Suivi fraîcheur | ⚠️ PARTIEL | `weeklyMeta.lastFetched` côté client | **Dashboard admin: stale data alerts** |
| Produits absents/incomplets | ❌ ABSENT | — | **Liste produits sans prix ou avec confiance faible** |
| Support futur API/coupons | ⚠️ PARTIEL | Structure prête (`apiPrix.js` mock), mais pas d'intégration réelle | **Placeholder endpoints définis** |

**Score:** 0/6 ✅ | 2/6 ⚠️ | 4/6 ❌

**Gap Critique:**
- **Panel Admin:** Aucune interface admin (validation, modération, stats globales).
- **API intégration:** Actuellement mock; besoin adapters pour IGA/Metro APIs futures.

---

## 3. Règles d'Affaires — Conformité

| Règle | Statut | Vérification |
|---|---|---|
| Normalisation produits (nom+marque+volume) | ❌ INCOMPLET | Pas de champ `marque` ni `volume`; normalisation = lowercase trim uniquement |
| Produits absents exclus optimisation | ✅ OK | `optimisation.js` filtre produits sans prix |
| Récurrents auto-proposés | ✅ OK | `detectRecurrentCandidates` + UI suggestions |
| Détection/fusion doublons | ⚠️ PARTIEL | Détection exacte nom; pas de fusion auto |
| Optimisation respecte contraintes | ⚠️ PARTIEL | Max magasins OK; rayon/favoris non utilisés |
| 3 meilleures combinaisons multi-critères | ⚠️ PARTIEL | Prix uniquement; distance/nb magasins absents |
| Ajustement combinaison appliquée | ✅ OK | Modifications post-application possibles (`Magasin.jsx`) |
| Validation admin circulaires | ❌ ABSENT | OCR directement ingéré côté client |
| Sync locale→centrale gère conflits | ❌ ABSENT | Pas de sync backend |
| Identifiant unique produits | ✅ OK | `nanoid()` pour chaque produit |
| Suggestions basées normalisation | ⚠️ PARTIEL | Basées keywords, pas volume équivalent |
| UI claire: prix estimé/alternatif/optimal | ✅ OK | Badges `prixSource`, suggestions alternatives |
| Persistance inter-onglets | ✅ OK | Zustand + LocalForage sync |
| Historique/stats calculables | ⚠️ PARTIEL | Historique OK, stats absentes |
| Préparer API/coupons | ⚠️ PARTIEL | Mock en place, adapters manquants |

**Score:** 6/15 ✅ | 7/15 ⚠️ | 2/15 ❌

---

## 4. Gaps Fonctionnels Critiques (Priorité)

### P0 — Bloquants MVP
1. **Normalisation produits complète**
   - Ajouter champs: `marque`, `volume`, `categorie`, `tags[]`
   - Service normalisation: `normalizeProductName(nom, marque, volume)` → clé unique
   - **Impact:** Doublons, suggestions alternatives, comparaison prix unitaire

2. **Détection & fusion doublons**
   - Algorithme similarity (Levenshtein/Jaccard tokens)
   - UI proposant fusion si score > 0.85
   - **Impact:** Qualité liste, expérience utilisateur

3. **Multi-critères optimisation**
   - Intégrer distance géo (haversine lat/lon magasins)
   - Scoring composite: `score = 0.6*prix_norm + 0.3*dist_norm + 0.1*nb_mag_norm`
   - **Impact:** Pertinence combinaisons, satisfaction utilisateur

### P1 — Haute Priorité
4. **Validation admin circulaires**
   - Endpoint POST `/api/admin/review-ocr`
   - UI admin: liste pending, approve/reject
   - **Impact:** Qualité base centrale, confiance données

5. **Support multi-unités**
   - Parser `volume` → quantité canonique (mL, g)
   - Comparaison prix unitaire équivalent
   - **Impact:** Suggestions alternatives précises

6. **Statistiques personnelles**
   - Page dashboard: économies cumulées, prix moyen par magasin, tendances
   - Graphiques évolution prix top 10 produits récurrents
   - **Impact:** Engagement, rétention utilisateur

### P2 — Moyenne Priorité
7. **Scanner code-barres**
   - Intégration `html5-qrcode` ou `quagga.js`
   - Lookup UPC → base produits (fallback API externe type Open Food Facts)
   - **Impact:** Rapidité ajout produits

8. **Filtres avancés & tags**
   - Champ `tags[]` (bio, vegan, sans gluten, etc.)
   - UI filtres dans `Liste.jsx`
   - **Impact:** Personnalisation, segments utilisateurs (allergies, régimes)

### P3 — Basse Priorité (Post-MVP)
9. **Multi-profil & collaboration**
   - Auth (Firebase/Supabase)
   - Partage listes (invitations, permissions)
   - **Impact:** Familles, colocataires

10. **Itinéraire intra-magasin**
    - Dépend partenariat magasins pour data layout
    - **Impact:** UX avancée, mais non essentiel

---

## 5. Incohérences Détectées

### 5.1 Prix
- **Inconsistency:** `apiPrix.getPrixProduits` génère prix mock même si `product.prix` existe.
  - **Fix appliqué:** Priorisation prix stocké (BUSINESS_RULES.md respecté).
  - **Statut:** ✅ RÉSOLU

### 5.2 Provenance
- **Inconsistency:** Champ `prixSource` ajouté mais pas toujours propagé (ex: `applyCombination` définit `prixSource='optimisation'`, mais suggestions alternatives n'assignent pas).
  - **Fix:** Assurer que toute modification prix via suggestion ou OCR set `prixSource` + `autoAssigned`.
  - **Statut:** ⚠️ PARTIEL (OCR OK, suggestions manquent provenance)

### 5.3 Normalisation nom
- **Inconsistency:** OCR normalise lowercase + collapse espaces, mais ajout manuel non normalisé.
  - **Fix:** Centraliser `normalizeProductName` dans `db.js` et appeler partout.
  - **Statut:** ❌ À FAIRE

### 5.4 Suggestions alternatives
- **Inconsistency:** Basées sur `productsDatabase.js` statique limité (~300 produits). Produits ajoutés manuellement/OCR pas dans base.
  - **Fix:** Générer suggestions aussi depuis `products` list actuelle (cross-match).
  - **Statut:** ❌ À FAIRE

---

## 6. Recommandations Stratégiques

### Court Terme (2-4 semaines)
1. **Implémenter normalisation complète** (P0.1)
2. **Ajouter fusion doublons semi-auto** (P0.2)
3. **Intégrer distance géo dans optimisation** (P0.3)
4. **Créer page Statistiques** (P1.6)

### Moyen Terme (1-3 mois)
5. **Backend admin + validation circulaires** (P1.4)
6. **Scanner barcode** (P2.7)
7. **Filtres/tags produits** (P2.8)

### Long Terme (3-6 mois)
8. **Multi-profil & partage** (P3.9)
9. **Intégration APIs réelles magasins** (P1.4 extension)
10. **Itinéraire intra-magasin** (P3.10, partenariat requis)

---

## 7. Métriques de Succès

| KPI | Baseline Actuel | Cible Post-Fixes |
|---|---|---|
| Doublons dans listes | ~15% (estimé) | <2% |
| Taux utilisation optimisation | Non mesuré | >60% sessions |
| Précision suggestions alternatives | ~40% (limité base statique) | >75% |
| Économies moyennes utilisateur | Non calculé | Visible dashboard |
| Satisfaction score optimisation | Non mesuré | >4/5 |

---

## 8. Conclusion

L'application **Panier Intelligent** présente une base solide pour les fonctionnalités cœur (gestion listes, optimisation simple, historique prix). Cependant, plusieurs **gaps critiques** empêchent une expérience utilisateur optimale et la conformité totale aux règles métier:

- **Normalisation produits incomplète** (manque marque, volume, catégorie).
- **Détection doublons rudimentaire** (pas de fusion semi-automatique).
- **Optimisation mono-critère** (prix uniquement; ignore distance/favoris).
- **Aucune validation admin** pour circulaires communautaires.
- **Statistiques absentes** (données collectées mais non exploitées).

**Priorité immédiate:** P0.1, P0.2, P0.3 (normalisation, doublons, multi-critères) pour atteindre un **MVP conforme aux règles métier**.

**Roadmap post-MVP:** Backend admin, scanner barcode, filtres avancés, collaboration multi-user.

---

**Rapport généré automatiquement par Copilot AI**  
*Pour toute question, voir `BUSINESS_RULES.md` et `CHANGELOG_OCR_PRIX.md`.*
