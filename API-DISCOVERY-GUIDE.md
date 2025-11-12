# 🔍 Guide: Découvrir les APIs internes des sites de circulaires

## Méthode 1: Chrome DevTools Network Inspector

### Étape 1: Ouvrir IGA.net
1. Ouvrez Chrome/Edge
2. Allez sur https://www.iga.net/fr
3. Appuyez sur **F12** pour ouvrir DevTools
4. Cliquez sur l'onglet **Network**
5. Cochez **Preserve log** (pour garder l'historique)

### Étape 2: Filtrer les requêtes API
1. Dans le champ de filtre, tapez: `api` ou `json` ou `xhr`
2. Naviguez sur le site (cliquez sur "Circulaire" ou "Produits en promotion")
3. Observez les requêtes qui apparaissent

### Étape 3: Analyser les requêtes intéressantes
Cherchez des URLs comme:
```
https://api.iga.net/...
https://www.iga.net/api/...
https://services.iga.net/...
```

### Étape 4: Inspecter une requête API
1. Cliquez sur une requête qui semble intéressante
2. Onglet **Headers**: Voir l'URL complète, les paramètres, les en-têtes requis
3. Onglet **Response**: Voir les données JSON renvoyées
4. Onglet **Preview**: Vue structurée du JSON

### Ce qu'on cherche:
- URL de l'endpoint API
- Paramètres de requête (storeId, category, etc.)
- En-têtes requis (Authorization, API-Key, etc.)
- Structure des données de réponse

---

## Méthode 2: Intercepter les requêtes de l'application mobile

Si le site web est trop complexe, l'app mobile utilise souvent des APIs plus simples:

### Outils nécessaires:
- **Android**: Packet Capture, HTTP Canary
- **iOS**: Charles Proxy, Proxyman

### Processus:
1. Installer l'app IGA sur mobile
2. Configurer le proxy pour intercepter le trafic HTTPS
3. Ouvrir la section "Circulaire" dans l'app
4. Observer les requêtes API dans le proxy
5. Copier l'URL et les paramètres

---

## Méthode 3: Reverse Engineering du code JavaScript

### Dans Chrome DevTools:
1. Onglet **Sources**
2. Appuyez sur **Ctrl+Shift+F** (recherche globale)
3. Cherchez des mots-clés: `fetch`, `axios`, `api`, `endpoint`, `/products`
4. Analysez le code pour trouver les URLs d'API

### Exemple de ce qu'on cherche:
```javascript
fetch('https://api.iga.net/v1/products?storeId=123&category=fruits')
axios.get('https://services.iga.net/flyer/weekly-specials')
```

---

## Exemples typiques d'APIs de circulaires québécoises

### IGA (hypothétique - à confirmer):
```
GET https://www.iga.net/api/circulaire/produits
GET https://api.iga.net/v2/stores/{storeId}/specials
GET https://services.iga.net/flyer/current
```

### Metro (hypothétique):
```
GET https://www.metro.ca/api/products/on-sale
GET https://api.metro.ca/v1/flyer/weekly
```

### Maxi (hypothétique):
```
GET https://www.maxi.ca/api/deals/weekly
GET https://api.pcexpress.ca/product-facade/v3/products/deals
```

---

## Ce que vous devez faire MAINTENANT:

### 🎯 Mission: Découvrir l'API IGA

1. **Ouvrez Chrome** et allez sur https://www.iga.net/fr
2. **F12** → Onglet **Network**
3. **Cochez "Preserve log"**
4. **Filtrez par**: XHR ou Fetch
5. **Cliquez sur "Circulaire"** ou "Produits en promotion"
6. **Observez les requêtes** qui apparaissent
7. **Cliquez sur une requête** qui retourne du JSON avec des produits
8. **Copiez-moi**:
   - L'URL complète
   - Les paramètres de requête (Query String Parameters)
   - Les en-têtes importants (Headers → Request Headers)
   - Un extrait de la réponse JSON (Response)

### Ce que je recherche spécifiquement:

```
URL: https://api.iga.net/v1/???
Params: { storeId: ???, category: ??? }
Headers: { Authorization: ???, X-API-Key: ??? }
Response: { products: [...], pagination: {...} }
```

---

## Pendant que vous cherchez...

Je vais créer un scraper de base qui utilise Puppeteer (alternative si l'API n'est pas accessible).

**Envoyez-moi ce que vous trouvez dans le Network tab!**
