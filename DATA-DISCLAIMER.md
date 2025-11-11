# ⚠️ IMPORTANT - Données de démonstration

## 📍 Données des magasins (`public/stores.qc.json`)

**Les coordonnées GPS sont APPROXIMATIVES et à but de démonstration uniquement.**

### Ce qui est fait:
- Zones géographiques correctes (Québec, Montréal, Laval, Gatineau, etc.)
- Noms de bannières réels (IGA, Metro, Maxi, Walmart, Costco, etc.)
- Coordonnées centrées sur les bonnes villes

### Ce qui n'est PAS fait:
- ❌ Adresses exactes des magasins
- ❌ Coordonnées GPS précises
- ❌ Liste exhaustive de tous les magasins

### Pour obtenir des données réelles:

1. **Option manuelle** (gratuite mais chronophage):
   - Cherchez chaque magasin sur Google Maps
   - Notez les coordonnées GPS (clic droit → coordonnées)
   - Ajoutez-les au fichier `public/stores.qc.json`

2. **Option API** (recommandée pour production):
   ```javascript
   // Exemple avec Google Places API
   const response = await fetch(
     `https://maps.googleapis.com/maps/api/place/textsearch/json?query=IGA+Sainte-Foy&key=YOUR_API_KEY`
   );
   const data = await response.json();
   const { lat, lng } = data.results[0].geometry.location;
   ```

3. **Option scraping** (OpenStreetMap):
   - Utilisez Overpass API pour extraire les épiceries d'une région
   - Gratuit mais nécessite du code

4. **Option communautaire**:
   - Créez un formulaire pour que les utilisateurs ajoutent leurs magasins locaux
   - Modération manuelle avant ajout

### Format attendu:
```json
{
  "id": "iga_ste_foy_duplessis",
  "name": "IGA Famille Duplessis",
  "lat": 46.77234,
  "lon": -71.29456,
  "address": "2450 Boulevard Laurier, Québec, QC G1V 2L1",
  "phone": "+1 418-651-6666",
  "hours": "8h-21h",
  "verified": true
}
```

---

## 🔍 OCR - Tesseract.js

### Problème courant: "OCR ne fonctionne pas"

**Causes possibles**:
1. Tesseract.js ne se charge pas (réseau, CDN bloqué)
2. Fichier trop gros (> 10MB)
3. Format d'image non supporté
4. Erreur silencieuse (pas de console.log visible)

### Test de diagnostic

Ouvrez **`http://localhost:5173/test-ocr.html`** pour tester:

1. **Test 1**: Import de tesseract.js → vérifie que la bibliothèque se charge
2. **Test 2**: Création d'un worker → vérifie que Tesseract peut démarrer
3. **Test 3**: Analyse d'image → teste l'OCR complet avec vos propres images

La page affiche tous les logs en temps réel et vous montre exactement où ça bloque.

### Si le test échoue:

#### Erreur: "Failed to fetch"
- **Cause**: CDN Tesseract.js bloqué ou hors ligne
- **Solution**: Vérifiez votre connexion Internet, essayez un autre réseau

#### Erreur: "Worker failed to initialize"
- **Cause**: Problème de chargement des fichiers de langue (fra+eng)
- **Solution**: 
  - Vérifiez que vous avez assez d'espace disque/cache
  - Essayez avec une seule langue: `createWorker('eng')` au lieu de `'fra+eng'`

#### Erreur: "Out of memory"
- **Cause**: Image trop grosse
- **Solution**: 
  - Réduisez la taille de l'image avant upload
  - Compressez le PDF
  - Essayez avec une seule page

#### Pas d'erreur mais "Aucun produit détecté"
- **Cause**: OCR fonctionne mais ne trouve pas de prix
- **Solution**:
  - Vérifiez que l'image contient du texte ET des prix
  - Image doit être claire, bien éclairée
  - Format prix attendu: `3.99$`, `$3.99`, `3$ 99`

### Logs à surveiller dans la console:

```
[OCR] Starting OCR processing for: flyer.jpg image/jpeg
[OCR] Processing image...
[OCR] Progress: 10%
[OCR] Progress: 50%
[OCR] Progress: 100%
[OCR] OCR completed. Results: {validCount: 12, ...}
```

Si vous ne voyez **aucun** de ces logs, le problème est dans le déclenchement du bouton ou l'import du module.

---

## 🚀 Pour aller en production

### Checklist avant déploiement:

- [ ] Remplacer `stores.qc.json` par de vraies données GPS
- [ ] Tester OCR avec plusieurs types de circulaires (IGA, Metro, Maxi)
- [ ] Configurer un service backend pour valider/modérer les uploads OCR
- [ ] Ajouter rate limiting sur l'upload OCR (éviter spam)
- [ ] Implémenter authentification si contribution communautaire
- [ ] Ajouter monitoring (Sentry, LogRocket) pour traquer les erreurs OCR en prod
- [ ] Optimiser les images uploadées (compression automatique côté client)
- [ ] Backup régulier de IndexedDB ou migration vers vraie base de données

### Variables d'environnement Vercel:

```env
VITE_COMMUNITY_OCR_UPLOAD_ENABLED=false  # Désactiver en prod sans modération
VITE_PRICE_DATA_URL=https://votre-api.com/prices.json
VITE_GOOGLE_MAPS_API_KEY=your_key_here  # Si vous utilisez Google Maps
```

---

## 📝 Note légale

Les noms de bannières (IGA, Metro, Walmart, etc.) sont des marques déposées de leurs propriétaires respectifs. Cette application est un projet de démonstration et n'est pas affiliée à ces entreprises.

Pour un usage commercial, assurez-vous d'avoir les droits nécessaires et de respecter les conditions d'utilisation des APIs utilisées (Google Maps, OpenStreetMap, etc.).
