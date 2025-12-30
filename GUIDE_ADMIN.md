# 📖 Guide d'utilisation - Admin Dashboard

## 🎯 Vue d'ensemble

Le **Panier Intelligent** permet de comparer les prix entre différentes épiceries grâce à un système de gestion de prix centralisé. Ce guide explique comment utiliser l'interface admin pour gérer la base de données de prix.

---

## 🔐 Connexion Admin

### Accès
- **URL**: `http://localhost:5174/admin`
- **Mot de passe**: Configuré dans `backend/.env` (`ADMIN_PASSWORD`)

### Première connexion
1. Ouvrez `http://localhost:5174/admin`
2. Entrez le mot de passe admin
3. Le token JWT est valide 24h

---

## 📊 Dashboard - Statistiques

Le dashboard affiche en temps réel :

### Métriques globales
- **Total produits** : Nombre total de prix dans la base
- **Prix actifs** : Produits dont la période de validité est en cours
- **Expirés** : Produits dont la validité est passée
- **Épiceries** : Nombre d'épiceries différentes

### Statistiques par épicerie
Pour chaque épicerie (IGA, Costco, Metro, Maxi, Super C) :
- Total de produits
- Nombre de prix actifs
- Prix moyen

### Actualisation
- Bouton **🔄 Actualiser** pour recharger les stats
- Mise à jour automatique après chaque publication

---

## 🌐 Génération de données de test

### Option 1 : Toutes les épiceries (🌟 5 Épiceries)
**Génère 275 produits** (55 produits × 5 épiceries)

#### Épiceries incluses
- **IGA** : Prix de base
- **Costco** : -15% (entrepôt)
- **Metro** : +5%
- **Maxi** : -8% (rabais)
- **Super C** : -12% (plus bas prix)

#### Variations de prix
- Multiplicateur de base selon l'épicerie
- Variation aléatoire de ±5% pour chaque produit
- Permet de tester la comparaison de prix réaliste

#### Utilisation
1. Cliquez sur **🌟 5 Épiceries**
2. Attendez quelques secondes (génération de 275 produits)
3. Les produits apparaissent dans le tableau de validation

---

### Option 2 : Données test simples (✨ Données test)
**Génère 55 produits** pour une seule épicerie "Test"

#### Utilisation
- Idéal pour tester rapidement l'interface
- Même catalogue que "Toutes les épiceries" mais une seule épicerie

---

## ✅ Validation des produits

### Tableau de validation

Chaque produit généré affiche :

| Colonne | Description | Éditable |
|---------|-------------|----------|
| ✓ | Case à cocher pour valider | Oui |
| **Nom** | Nom du produit | Oui |
| **Marque** | Marque du produit | Oui |
| **Épicerie** | Nom de l'épicerie | Oui |
| **Prix** | Prix en CAD ($) | Oui |
| **Volume** | Taille/poids du produit | Oui |
| **Début** | Date de début de validité | Oui |
| **Fin** | Date de fin de validité | Oui |
| **Statut** | Badge "Modifié" si édité | - |
| **Actions** | Bouton 🗑️ pour supprimer | - |

### Workflow de validation

1. **Génération** : Cliquez sur un bouton de scraping
2. **Vérification** : Examinez les produits détectés
3. **Édition** : 
   - Modifiez les champs incorrects
   - Ajustez les dates de validité si nécessaire
   - Supprimez les doublons avec 🗑️
4. **Validation** : Cochez ✓ les produits à publier
5. **Publication** : Cliquez sur **✅ Publier les validés**

### Édition en masse
- Sélectionnez plusieurs produits avec les cases à cocher
- Éditez individuellement chaque champ
- Le badge "Modifié" apparaît sur les produits édités

---

## 📅 Gestion des périodes de validité

### Format des dates
- **Format** : `YYYY-MM-DD` (ex: 2025-11-22)
- **Début** : Date de début de la circulaire
- **Fin** : Date de fin de la circulaire

### Périodes typiques
Les circulaires québécoises sont généralement :
- **Durée** : 7 jours (vendredi à jeudi)
- **Exemple** : 2025-11-22 → 2025-11-28

### Gestion automatique
- Les produits générés ont déjà des dates pré-remplies
- Période par défaut : semaine courante
- Les prix expirés sont filtrés automatiquement dans la recherche

### Filtrage des prix expirés
```javascript
// Dans la recherche de prix, seuls les prix actifs sont retournés
const now = new Date().toISOString()
const activePrices = prices.filter(p => !p.validTo || now <= p.validTo)
```

---

## 📤 Publication des prix

### Avant publication

Assurez-vous que :
- [ ] Les produits sont validés (✓ cochés)
- [ ] Les prix sont corrects
- [ ] Les dates de validité sont bonnes
- [ ] Pas de doublons

### Processus de publication

1. Cliquez sur **✅ Publier les validés**
2. Confirmez dans la boîte de dialogue
3. Le système effectue deux actions :
   - **Backend** : Enregistre les produits publiés
   - **IndexedDB** : Ingestion dans la base locale `weekly_prices_v1`

### Résultat de publication

Message de confirmation affichant :
- ✅ Nombre de produits publiés
- **Ajoutés** : Nouveaux produits dans la base
- **Mis à jour** : Produits existants avec prix mis à jour

Exemple :
```
✅ Publication réussie!
50 produits publiés pour les utilisateurs
Ingestion locale: +45 / ⟳5
```
- +45 = 45 nouveaux produits ajoutés
- ⟳5 = 5 produits mis à jour (prix plus bas trouvé)

---

## 🗄️ Base de données IndexedDB

### Structure `weekly_prices_v1`

Chaque produit stocké contient :
```javascript
{
  name: string,          // Nom normalisé (minuscules)
  store: string,         // Nom de l'épicerie
  price: number,         // Prix en CAD
  brand: string,         // Marque du produit
  volume: string,        // Taille/poids
  category: string,      // Catégorie
  validFrom: string,     // Date début (ISO 8601)
  validTo: string,       // Date fin (ISO 8601)
  updatedAt: string,     // Dernière modification
  source: string,        // 'ocr', 'admin-publish', etc.
  ocrConfidence: number  // Confiance OCR (0-1)
}
```

### Stratégie de déduplication

Lors de l'ingestion :
1. Recherche d'un produit existant avec **même nom + même épicerie**
2. Si trouvé : garde le **prix le plus bas**
3. Si nouveau : ajoute à la base

### Maintenance

Pour vider la base de données :
```javascript
// Dans la console du navigateur (F12)
await localforage.removeItem('weekly_prices_v1')
location.reload()
```

---

## 📋 Catalogue de produits (55 items)

### 🍎 Fruits & Légumes (10)
1. Pommes Gala - Selection
2. Bananes - Chiquita
3. Oranges navel - Sunkist
4. Fraises - Savoura
5. Raisins verts
6. Tomates - Savoura
7. Concombres anglais
8. Carottes
9. Brocoli
10. Laitue romaine

### 🥛 Produits laitiers & Œufs (10)
11. Lait 2% - Natrel
12. Lait 3.25% - Québon
13. Yogourt grec - Oikos
14. Yogourt nature - Liberté
15. Fromage cheddar - Black Diamond
16. Fromage mozzarella - Saputo
17. Beurre - Lactantia
18. Crème sure - Astro
19. Œufs gros - Québon
20. Œufs extra-gros - Nutrioeuf

### 🥩 Viandes & Poissons (8)
21. Poulet entier - Exceldor
22. Poitrines de poulet - Exceldor
23. Bœuf haché mi-maigre
24. Bœuf haché maigre
25. Bacon - Olymel
26. Saucisses italiennes - Olymel
27. Côtelettes de porc - Olymel
28. Saumon atlantique

### 🍞 Boulangerie (5)
29. Pain tranché blanc - Bon Matin
30. Pain de blé entier - POM
31. Bagels - St-Viateur
32. Tortillas - Old El Paso
33. Croissants - Vachon

### 🍝 Épicerie sèche (10)
34. Pâtes spaghetti - Catelli
35. Pâtes penne - Barilla
36. Riz blanc - Uncle Ben's
37. Sauce tomate - Classico
38. Huile d'olive - Bertolli
39. Farine tout usage - Robin Hood
40. Sucre blanc - Lantic
41. Céréales Cheerios
42. Céréales Corn Flakes - Kellogg's
43. Gruau - Quaker

### 🥤 Boissons (5)
44. Jus d'orange - Tropicana
45. Jus de pomme - Oasis
46. Café moulu - Nabob
47. Thé vert - Tetley
48. Eau pétillante - Perrier

### 🍪 Collations & Desserts (7)
49. Chips originales - Lay's
50. Chips BBQ - Ruffles
51. Biscuits Oreo
52. Barres granola - Nature Valley
53. Crème glacée vanille - Ben & Jerry's
54. Crème glacée chocolat - Häagen-Dazs
55. Biscuits au chocolat - Leclerc

---

## 🧪 Scénarios de test recommandés

### Test 1 : Workflow complet
1. Générez **5 Épiceries** (275 produits)
2. Validez tous les produits (cochez toutes les cases)
3. Publiez
4. Vérifiez les stats : 275 actifs
5. Testez la recherche dans l'app utilisateur

### Test 2 : Comparaison de prix
1. Générez **5 Épiceries**
2. Recherchez "Lait 2%" dans l'app
3. Comparez les 5 prix :
   - Super C : ~3.80$ (le moins cher)
   - Costco : ~3.82$
   - Maxi : ~4.13$
   - IGA : ~4.49$ (base)
   - Metro : ~4.71$ (le plus cher)

### Test 3 : Édition manuelle
1. Générez **Données test** (55 produits)
2. Éditez manuellement 5 produits :
   - Changez le prix
   - Modifiez la marque
   - Ajustez les dates
3. Vérifiez le badge "Modifié"
4. Publiez uniquement les produits édités

### Test 4 : Gestion des doublons
1. Générez **5 Épiceries**
2. Publiez
3. Re-générez **5 Épiceries** avec des prix différents
4. Publiez à nouveau
5. Vérifiez les stats : la base garde les prix les plus bas

### Test 5 : Expiration des prix
1. Générez **Données test**
2. Modifiez `validTo` à une date passée (ex: 2025-11-15)
3. Publiez
4. Vérifiez les stats : ces produits apparaissent en "Expirés"
5. Testez la recherche : ils ne sont pas retournés

---

## 🔧 Configuration technique

### Variables d'environnement Backend (`backend/.env`)
```env
ADMIN_PASSWORD=MonMotDePasseSecurise2024!
JWT_SECRET=votre-secret-jwt-très-long-et-sécurisé
FRONTEND_URL=http://localhost:5174
PORT=3001
IGA_POSTAL_CODE=G3A2W5
```

### Variables d'environnement Frontend (`.env`)
```env
VITE_BACKEND_URL=http://localhost:3001
VITE_PRICE_DATA_URL=/prices.initial.json
```

### Ports
- **Backend** : 3001
- **Frontend** : 5174

---

## 🐛 Dépannage

### Problème : Token expiré
**Solution** : Déconnectez-vous et reconnectez-vous

### Problème : 0 produits générés
**Solution** : 
- Vérifiez que le backend tourne (port 3001)
- Vérifiez les logs du backend
- Testez avec `http://localhost:3001/api/health`

### Problème : Stats ne se chargent pas
**Solution** :
- Ouvrez la console (F12)
- Vérifiez les erreurs JavaScript
- Cliquez sur **🔄 Actualiser**

### Problème : Publication échoue
**Solution** :
- Vérifiez le token JWT (reconnectez-vous)
- Vérifiez que des produits sont cochés
- Consultez les logs backend

### Problème : Recherche ne trouve pas les produits
**Solution** :
- Vérifiez que les produits sont publiés (pas en mode draft)
- Vérifiez que `validTo` n'est pas expiré
- Ouvrez IndexedDB dans DevTools > Application > Storage

---

## 📱 Utilisation côté utilisateur

Une fois les prix publiés :

1. **Page d'accueil** : Liste de courses intelligente
2. **Recherche** : Tapez un produit (ex: "lait")
3. **Résultats** : Les prix actifs de toutes les épiceries
4. **Tri** : Du moins cher au plus cher automatiquement
5. **Ajout** : Ajoutez au panier pour comparer le total

---

## 🚀 Prochaines améliorations

- [ ] **Scraping réel** : IGA, Metro, Maxi (actuellement bloqué par anti-bot)
- [ ] **Upload PDF** : Analyse de circulaires PDF avec OCR
- [ ] **Historique de prix** : Graphiques d'évolution
- [ ] **Alertes de prix** : Notifications quand un produit baisse
- [ ] **API publique** : Export JSON des prix pour apps tierces

---

## 📞 Support

Pour toute question :
- Consultez ce guide
- Vérifiez les logs backend et frontend
- Inspectez IndexedDB via DevTools

**Bon usage du Panier Intelligent ! 🛒💰**
