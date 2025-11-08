# Stratégie de Scraping pour Circulaires du Québec/Canada

## État des API et Méthodes de Scraping par Enseigne

### ✅ API REST/JSON disponibles

| Enseigne | Endpoint | Format | Notes |
|----------|----------|--------|-------|
| **IGA** | `https://webapi.sobeys.com/flyer/v2/...` | JSON | API officielle Sobeys (parent d'IGA) |
| **Metro** | `https://api.metro.ca/flyers` | JSON | API officielle Metro |
| **Walmart** | `https://www.walmart.ca/api/v2/...` | JSON | API publique Walmart Canada |
| **Adonis** | `https://www.flyerify.com/api/flyers?store=adonis` | JSON | Via Flyerify (agrégateur) |

### ❌ Scraping HTML requis

| Enseigne | Méthode | Raison |
|----------|---------|--------|
| **Maxi** | HTML parsing | Pas d'API publique connue |
| **Provigo** | HTML parsing | Loblaw - pas d'API exposée |
| **Super C** | HTML parsing | Metro (structure différente de l'API principale) |
| **Costco** | HTML parsing | Pas d'API publique |
| **Avril** | HTML parsing | Petite chaîne, site statique |

## Plan d'implémentation

### Architecture proposée

```
api/
  scrapers/
    base/
      BaseScraperAPI.js     → Interface commune pour scrapers API
      BaseScraperHTML.js    → Interface commune pour scrapers HTML
    stores/
      iga.js                → Scraper API IGA/Sobeys
      metro.js              → Scraper API Metro
      walmart.js            → Scraper API Walmart
      adonis.js             → Scraper API Adonis (via Flyerify)
      maxi.js               → Scraper HTML Maxi
      provigo.js            → Scraper HTML Provigo
      superc.js             → Scraper HTML Super C
      costco.js             → Scraper HTML Costco
      avril.js              → Scraper HTML Avril
    factory.js            → StoreScraperFactory (injecte le bon scraper)
    flipp.js              → Fallback/legacy (enrichissement manuel)
```

### Endpoints API documentés

#### IGA/Sobeys
```
GET https://webapi.sobeys.com/flyer/v2/flyers
Headers: X-API-Key: [TBD]
Response: { flyers: [ { products: [...] } ] }
```

#### Metro
```
GET https://api.metro.ca/flyers
Query: ?store=metro&postal_code=H3A1A1
Response: { items: [ { name, price, ... } ] }
```

#### Walmart
```
GET https://www.walmart.ca/api/v2/flyers
Query: ?store_id=1234
Response: { data: { products: [...] } }
```

#### Adonis (Flyerify)
```
GET https://www.flyerify.com/api/flyers?store=adonis
Response: { flyers: [ { products: [...] } ] }
```

### Scraping HTML - Outils

- **Bibliothèque**: Cheerio (Node.js) ou AngleSharp (C#)
- **Stratégie**: Sélecteurs CSS pour extraire nom, prix, image
- **Fallback**: OCR via Google Vision API si prix dans image uniquement

## Prochaines étapes

1. **Créer BaseScraperAPI** avec méthode `fetchProducts(postalCode, storeId)`
2. **Créer BaseScraperHTML** avec méthode `parseProducts(htmlContent)`
3. **Implémenter scrapers API** pour IGA, Metro, Walmart, Adonis
4. **Implémenter scrapers HTML** pour Maxi, Provigo, Super C, Costco, Avril
5. **Factory pattern** pour injecter dynamiquement le bon scraper par enseigne
6. **Agrégation** dans `api/scrapers/aggregate.js` pour consolider tous les prix
7. **OCR/Upload** pour circulaires communautaires (étape future)

## Tests manuels

- Postman: tester chaque endpoint API avec des paramètres réels
- Vérifier structure JSON et champs disponibles (name, price, image_url, valid_from, valid_to)
- Scraping HTML: valider sélecteurs CSS sur pages live

## Notes techniques

- **Rate limiting**: throttle requests (max 1 req/sec par enseigne)
- **Caching**: stocker réponses localement (TTL: 24h)
- **Erreurs**: fallback gracieux si une enseigne est indisponible
- **Normalisation**: uniformiser les formats de prix et noms de produits

---
Document maintenu par: Copilot + baydirn
Dernière mise à jour: 2025-11-08
