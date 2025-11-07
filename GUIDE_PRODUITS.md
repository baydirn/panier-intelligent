# 📊 Système de Données de Produits - Guide Complet

## Vue d'ensemble

Le système de gestion des produits utilise **deux sources de données** :

1. **Base de données locale** (`src/data/productsDatabase.js`) - Produits québécois courants avec marques et formats réels
2. **API OpenFoodFacts** (`src/services/openFoodFactsApi.js`) - Base de données mondiale collaborative (700 000+ produits)

## 🎯 Fonctionnalités

### ✅ Ajout de produits avec détails
- **Recherche intelligente** : Tape le nom du produit (ex: "lait")
- **Sélection de marque** : Choix parmi les marques réelles (Québon, Natrel, etc.)
- **Sélection de format** : Formats disponibles pour chaque marque (1L, 2L, 4L)
- **Quantité** : Choix de la quantité (x1, x2, x3, etc.)
- **Scan code-barres** : Utilise la caméra pour scanner un produit

### ✏️ Modification de produits existants
- Cliquer sur **"✏️ Modifier"** sur n'importe quel produit
- Changer la marque, le format ou la quantité
- Les modifications sont sauvegardées instantanément

### 🔍 Mode manuel
- Si le produit n'est pas dans la base de données
- Permet la saisie libre du nom, marque et format
- Ajustement de la quantité toujours possible

## 📚 Base de Données Locale

### Structure

```javascript
{
  'lait': {
    category: 'Produits laitiers',
    keywords: ['lait', 'milk'],
    brands: [
      { name: 'Québon', formats: ['1L', '2L', '4L'] },
      { name: 'Natrel', formats: ['1L', '2L', '4L'] }
    ],
    defaultQuantities: ['x1', 'x2', 'x3', 'x4']
  }
}
```

### Produits Actuellement Disponibles

#### 🥛 Produits Laitiers
- **Lait** : Québon, Natrel, Lactantia, Beatrice, Selection (1L, 2L, 4L)
- **Yogourt** : Yoplait, Danone, Oikos, iögo, Liberté
- **Fromage** : Black Diamond, Armstrong, P'tit Québec, Selection
- **Beurre** : Lactantia, Gay Lea, Selection

#### 🍞 Boulangerie
- **Pain** : Gadoua, Bon Matin, POM, St-Méthode, Première Moisson
- **Bagels** : St-Viateur, Fairmount, Thomas

#### 🥩 Viandes
- **Poulet** : Exceldor, Flamingo, Sans nom
- **Bœuf haché** : Angus, Olymel, Selection

#### 🍎 Fruits et Légumes
- **Bananes** : Chiquita, Del Monte, Équitable
- **Pommes** : Québec, Gala, Cortland

#### 🥤 Boissons
- **Jus d'orange** : Tropicana, Oasis, Simply Orange, Selection
- **Eau** : Eska, Naya, Dasani

#### 🍝 Épicerie
- **Pâtes** : Catelli, Barilla, De Cecco
- **Riz** : Uncle Ben's, Tilda, Selection
- **Céréales** : Cheerios, Special K, Corn Flakes, Vector

#### 🧻 Hygiène
- **Papier toilette** : Cashmere, Charmin, Royale
- **Savon** : Dove, Ivory, Irish Spring

## 🌐 API OpenFoodFacts

### Fonctionnalités

1. **Recherche par code-barres**
   - Scan avec la caméra (Chrome/Edge uniquement)
   - Saisie manuelle du code-barres
   - Récupération automatique : nom, marque, format, image

2. **Recherche par nom**
   - Recherche dans 700 000+ produits
   - Résultats enrichis avec données nutritionnelles
   - Affichage des magasins où le produit est disponible

### Utilisation

```javascript
import { getProductByBarcode, searchProductsByName } from '../services/openFoodFactsApi'

// Recherche par code-barres
const product = await getProductByBarcode('3017620425035')
// Retourne: { name, brand, quantity, categories, image, nutriments, ... }

// Recherche par nom
const results = await searchProductsByName('nutella', 1, 10)
// Retourne: [{ name, brand, quantity, ... }, ...]
```

## 🔧 Comment Ajouter de Nouveaux Produits

### Option 1: Base de données locale

Éditez `src/data/productsDatabase.js` :

```javascript
export const PRODUCTS_DB = {
  // ... produits existants ...
  
  'nouveau_produit': {
    category: PRODUCT_CATEGORIES.EPICERIE,
    keywords: ['nouveau', 'produit', 'keywords'],
    brands: [
      { name: 'Marque A', formats: ['100g', '250g', '500g'] },
      { name: 'Marque B', formats: ['200g', '400g'] }
    ],
    defaultQuantities: ['x1', 'x2', 'x3']
  }
}
```

### Option 2: L'API fait le travail

Les utilisateurs peuvent :
1. Scanner le code-barres du produit
2. L'API récupère automatiquement toutes les données
3. Le produit est ajouté avec les informations réelles

## 🚀 Améliorations Futures Possibles

### 1. Base de données plus complète
- Ajouter plus de catégories (surgelés, condiments, etc.)
- Plus de marques par produit
- Prix moyens par produit/magasin

### 2. Intégration avec d'autres APIs
- **Instacart API** : Prix en temps réel
- **Walmart/Provigo API** : Disponibilité en magasin
- **LCBO API** : Pour les boissons alcoolisées

### 3. Fonctionnalités intelligentes
- **Suggestions de produits similaires** si une marque n'est pas disponible
- **Historique des prix** pour chaque produit
- **Alertes de prix** quand un produit est en promotion
- **Recommandations** basées sur les achats précédents

### 4. Cache et performance
- Mettre en cache les résultats de l'API
- Base de données locale IndexedDB pour les produits scannés
- Mode hors-ligne avec synchronisation

### 5. Contribution communautaire
- Permettre aux utilisateurs d'ajouter des produits manquants
- Système de votes pour valider les données
- Partage de listes de courses entre utilisateurs

## 📱 Compatibilité Scan Code-Barres

### ✅ Supporté
- **Chrome** (Android & Desktop)
- **Edge** (Windows & Android)
- **Samsung Internet**

### ⚠️ Non supporté
- **Firefox** : Fallback vers saisie manuelle
- **Safari** : Fallback vers saisie manuelle

### Alternative
Si le navigateur ne supporte pas `BarcodeDetector`, l'application affiche automatiquement un champ de saisie manuelle pour entrer le code-barres.

## 🎨 Interface Utilisateur

### Modal d'ajout de produit

```
┌────────────────────────────────────┐
│ 📝 Ajouter un produit détaillé    │
├────────────────────────────────────┤
│ [📷 Scanner code-barres]           │
│                                    │
│ Rechercher un produit              │
│ [lait___________________]          │
│   ↓                                │
│ ┌─────────────────────────────┐   │
│ │ > Lait (Produits laitiers)  │   │
│ │ > Lait de soya             │   │
│ └─────────────────────────────┘   │
│                                    │
│ Marque: [Québon        ▼]         │
│ Format: [2L            ▼]         │
│ Quantité: [x2          ▼]         │
│                                    │
│ Aperçu:                           │
│ Lait Québon 2L x2                 │
│                                    │
│ [Annuler]  [➕ Ajouter]           │
└────────────────────────────────────┘
```

### Modal d'édition de produit

```
┌────────────────────────────────────┐
│ ✏️ Modifier le produit            │
├────────────────────────────────────┤
│ Produit: Lait                     │
│                                    │
│ Marque: [Natrel        ▼]         │
│ Format: [4L            ▼]         │
│ Quantité: [x3          ▼]         │
│                                    │
│ Aperçu:                           │
│ Lait Natrel 4L x3                 │
│                                    │
│ [Annuler]  [💾 Enregistrer]       │
└────────────────────────────────────┘
```

## 💡 Conseils d'Utilisation

1. **Recherche rapide** : Tapez simplement "lait" et choisissez parmi les résultats
2. **Scan en magasin** : Utilisez le scan de code-barres pour ajouter rapidement des produits
3. **Mode manuel** : Pour les produits non répertoriés, basculez en mode manuel
4. **Modification après coup** : Tous les produits peuvent être modifiés après ajout
5. **Quantité flexible** : Ajustez la quantité facilement avec les boutons +/-

## 🔒 Respect de la Vie Privée

- **Aucune donnée personnelle** envoyée à OpenFoodFacts
- **Caméra** : Utilisée uniquement localement pour le scan
- **Pas de tracking** : Aucune analyse des habitudes d'achat
- **Données locales** : Toutes vos listes restent sur votre appareil

## 📄 Licence

- **Base de données locale** : Propriétaire (peut être modifiée librement)
- **OpenFoodFacts** : Open Database License (ODbL)
- **Code source** : À définir

## 🤝 Contribution

Pour ajouter des produits québécois à la base de données :
1. Forkez le projet
2. Ajoutez vos produits dans `src/data/productsDatabase.js`
3. Testez l'ajout avec le modal
4. Créez une Pull Request

---

**Développé avec ❤️ pour les courses intelligentes au Québec** 🍁
