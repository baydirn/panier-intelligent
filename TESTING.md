# Guide de test - Panier Intelligent

## 🧪 Tests à effectuer sur Vercel après déploiement

### 1. Test de géolocalisation et code postal

**Objectif**: Vérifier que les magasins de Québec apparaissent correctement

#### Étapes:
1. Allez dans **Paramètres** (⚙️)
2. Scrollez jusqu'à **"Localisation & Magasins proches"**
3. Entrez votre code postal: **G3A 2W5** (ou G1, G2, G3, etc.)
4. Cliquez sur **"📍 Utiliser code postal"**

#### Résultats attendus:
- ✅ Message: "✓ Position définie via code postal"
- ✅ Liste de magasins affichée avec:
  - IGA Sainte-Foy
  - IGA Beauport
  - Metro Laurier Québec
  - Metro Saint-Sacrement
  - Maxi Charlesbourg
  - Maxi Duberger
  - Super C Québec
  - Walmart Sainte-Foy
  - Walmart Beauport
  - Costco Sainte-Foy
  - Costco Lebourgneuf
  - Provigo Sillery
- ✅ Distances affichées en km (par exemple: "3.2 km", "5.8 km")

#### Si ça ne fonctionne pas:
- Vérifiez la console (F12 → Console) pour voir les erreurs
- Vérifiez que le rayon de recherche est assez grand (augmentez à 10-20 km)
- Essayez d'autres codes postaux: G1A 1B1, G2A 1A1, H1A 1A1

---

### 2. Test de l'upload OCR

**Objectif**: Vérifier que l'analyse OCR fonctionne et affiche des messages clairs

#### Étapes:
1. Allez dans **Paramètres** (⚙️)
2. Scrollez jusqu'à **"Base de prix hebdomadaire"**
3. Cliquez sur **"📄 Contribuer une circulaire (OCR)"**
4. Sélectionnez un magasin (ex: IGA)
5. Entrez les dates (ex: 2025-11-10 à 2025-11-17)
6. Uploadez une image de circulaire (JPG/PNG) ou un PDF
7. Cliquez sur **"Analyser la circulaire"**

#### Résultats attendus:
- ✅ Barre de progression s'affiche (0-100%)
- ✅ Message: "Traitement en cours... (cela peut prendre 30-60 secondes)"
- ✅ Console affiche des logs avec préfixe `[OCR]`:
  - `[OCR] Starting OCR processing for: ...`
  - `[OCR] Progress: 10%`, `20%`, etc.
  - `[OCR] OCR completed. Results: ...`
  - `[OCR] Saving submission...`
  - `[OCR] Merge complete. Added: X Updated: Y`
- ✅ **En cas de succès**:
  - Toast vert: "🎉 X produits analysés avec succès!"
  - Modal reste ouvert avec résumé des produits détectés
  - Liste des 10 premiers produits avec prix
- ✅ **En cas d'échec**:
  - Toast rouge: "❌ Erreur lors du traitement OCR: ..."
  - Message d'erreur dans le modal avec aide
  - Console montre l'erreur détaillée

#### Images de test recommandées:
- Circulaire papier photographiée avec bon éclairage
- PDF de circulaire (max 15 pages analysées)
- Image claire avec texte et prix visibles

#### Si ça ne fonctionne pas:
1. **Ouvrez la console (F12 → Console)** - c'est LA source de vérité
2. Cherchez les messages `[OCR]` pour voir où ça bloque:
   - Si `[OCR] Starting...` n'apparaît pas → bouton ne déclenche pas le processus
   - Si bloqué à `[OCR] Processing...` → problème avec Tesseract.js
   - Si `[OCR] No products detected` → image pas assez claire ou format non reconnu
3. Vérifiez les variables d'environnement sur Vercel:
   - `VITE_COMMUNITY_OCR_UPLOAD_ENABLED=true` (pour afficher le bouton)
4. Testez avec une image très simple (texte + prix clairs)

---

### 3. Test de l'optimisation multi-critères

**Objectif**: Vérifier que l'analyse prend en compte distance, prix et favoris

#### Étapes:
1. Ajoutez au moins 5 produits à votre liste
2. Allez dans **Paramètres** → Ajustez les poids:
   - Prix: 0.6
   - Distance: 0.3
   - Favoris: 0.1
3. Entrez un code postal (ex: G3A 2W5)
4. Dans Paramètres → Magasins favoris: "IGA, Metro"
5. Allez dans **Analyse** (📊)
6. Vérifiez que les combinaisons suggérées privilégient IGA et Metro

#### Résultats attendus:
- ✅ Combinaisons affichent score total
- ✅ IGA et Metro apparaissent plus souvent en haut
- ✅ Distance affichée pour chaque magasin
- ✅ Prix total et économies calculés

---

### 4. Test des données hebdomadaires

**Objectif**: Vérifier que les prix de base se chargent

#### Étapes:
1. Paramètres → "Base de prix hebdomadaire"
2. Cliquez sur "🔁 Forcer la mise à jour"
3. Cliquez sur "🧪 Tester la source"

#### Résultats attendus:
- ✅ Message: "Test OK: X items depuis [URL]"
- ✅ Si erreur 404 ou CORS → vérifier `VITE_PRICE_DATA_URL` sur Vercel

---

## 🐛 Débogage rapide

### Console (F12 → Console)
Cherchez ces patterns:
- `[OCR]` - Tous les logs OCR
- `Loaded stores:` - Combien de magasins chargés
- `Nearby stores:` - Combien de magasins dans le rayon
- Erreurs en rouge

### Network (F12 → Network)
- Filtrez par `stores.qc.json` - doit retourner 200 OK avec ~40 magasins
- Filtrez par `weekly-prices` - doit retourner 200 OK
- Si 404 → fichier manquant dans `public/`
- Si CORS → problème de configuration serveur

### Application (F12 → Application → IndexedDB)
- `panier_products` - Vos produits
- `panier_settings` - Vos paramètres
- `user_geo_v1` - Votre position (lat/lon)
- `ocr_submissions_v1` - Vos uploads OCR

---

## 📝 Checklist de déploiement Vercel

- [ ] Variables d'environnement configurées:
  - `VITE_COMMUNITY_OCR_UPLOAD_ENABLED=true`
  - `VITE_PRICE_DATA_URL=/weekly-prices.json`
  - `VITE_PRICE_META_URL=/prices-meta.json`
- [ ] Build réussi sans erreurs
- [ ] `public/stores.qc.json` déployé (40+ magasins)
- [ ] `public/weekly-prices.json` déployé
- [ ] Test géolocalisation OK (code postal)
- [ ] Test OCR OK (upload + feedback)
- [ ] Console sans erreurs critiques

---

## 🚨 Problèmes connus et solutions

### "Aucun magasin trouvé"
- **Cause**: Code postal non reconnu ou rayon trop petit
- **Solution**: Augmentez le rayon à 10-20 km, essayez G3A, H1A, J8A

### "OCR ne répond pas"
- **Cause**: Tesseract.js prend du temps à charger (30-60s)
- **Solution**: Patience! Surveillez la console pour `[OCR] Progress:`

### "Erreur CORS sur prix"
- **Cause**: URL externe bloquée
- **Solution**: Utilisez `/weekly-prices.json` (fichier local)

### "Modal OCR vide après upload"
- **Cause**: Erreur silencieuse, modal fermé trop vite
- **Solution**: Maintenant le modal reste ouvert + logs console

---

**Note**: Ce fichier est pour le développement et les tests. Ne pas déployer en production.
