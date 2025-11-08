# Guide: Comment trouver les vraies API de circulaires

## Résultat des tests initiaux

❌ **Tous les endpoints suggérés par ChatGPT ont échoué**:
- Metro: Connexion refusée
- Walmart: "You do not have access to this url"
- Flyerify: 404 Not Found
- IGA/Sobeys: À tester

## ✅ Méthode recommandée: Reverse Engineering

### Étape 1: Inspecter le site web réel

1. **Ouvrir le site de la circulaire** dans Chrome/Edge:
   - Metro: https://www.metro.ca/circulaire
   - IGA: https://www.iga.net/fr/circulaire
   - Walmart: https://www.walmart.ca/fr/flyer
   - Maxi: https://www.maxi.ca/circulaire

2. **Ouvrir DevTools** (F12)

3. **Onglet Network** → Filtrer par "Fetch/XHR"

4. **Recharger la page** et chercher les requêtes JSON qui chargent les produits

5. **Copier l'URL réelle** et les headers nécessaires

### Étape 2: Exemple concret - IGA

```powershell
# 1. Aller sur https://www.iga.net/fr/circulaire
# 2. F12 → Network → XHR
# 3. Chercher une requête qui retourne du JSON avec les produits
# 4. Clic droit → Copy → Copy as PowerShell

# Exemple typique (à adapter selon ce que tu trouves):
$headers = @{
    "Accept" = "application/json"
    "Referer" = "https://www.iga.net/fr/circulaire"
    "User-Agent" = "Mozilla/5.0..."
}
Invoke-RestMethod -Uri "URL_TROUVEE_DANS_NETWORK" -Headers $headers
```

## Alternative: Scraping HTML direct

Si aucune API n'est accessible, on scrappe le HTML:

### Test IGA HTML:
```powershell
$html = Invoke-WebRequest -Uri "https://www.iga.net/fr/circulaire" -UseBasicParsing
$html.Content | Out-File iga-page.html
# Analyser iga-page.html pour trouver les sélecteurs CSS
```

### Test Metro HTML:
```powershell
$html = Invoke-WebRequest -Uri "https://www.metro.ca/circulaire" -UseBasicParsing
$html.Content | Out-File metro-page.html
```

## 🎯 Plan révisé

### Phase 1: Investigation (maintenant)
1. Visiter chaque site web manuellement
2. Inspecter Network pour trouver les vraies API
3. Documenter les endpoints réels

### Phase 2: Implémentation
- **Si API trouvée**: Scraper JSON (facile, fiable)
- **Si pas d'API**: Scraper HTML avec Cheerio (plus fragile)

### Phase 3: Fallback
- Garder le dataset manuel enrichi actuel (`api/scrapers/flipp.js`)
- Mise à jour hebdomadaire manuelle si nécessaire

## 📝 Template pour documenter les vraies API

Créer un fichier `REAL_ENDPOINTS.md` avec:

```markdown
## IGA
- URL: [à compléter après inspection]
- Method: GET
- Headers requis: [à compléter]
- Params: ?store_id=XXX&postal_code=XXX
- Response: { ... }

## Metro
- URL: [à compléter]
- ...
```

## Prochaines étapes

1. **Toi**: Inspecter 1-2 sites manuellement (IGA + Metro recommandés)
2. **Copilot**: Implémenter les scrapers basés sur tes découvertes
3. **Ensemble**: Tester et affiner

---

**Note importante**: Les vraies API sont souvent:
- Non documentées publiquement
- Protégées par des tokens/cookies de session
- Changeantes (structure peut varier)
- Soumises à rate limiting

C'est pourquoi un **dataset manuel enrichi + OCR pour upload communautaire** reste une excellente approche long-terme.
