# 🔧 Plan d'amélioration OCR - Circulaires réalistes

## Problème actuel
L'OCR basique (Tesseract ligne par ligne) ne fonctionne PAS bien sur les circulaires réelles:
- Mise en page complexe (colonnes, images)
- Prix multiples (unitaire, bulk, promo)
- Volumes intégrés dans graphiques
- Marques/descriptions mélangées

## Solutions possibles (par ordre de complexité)

### 🟢 Option 1: OCR structuré avec détection de régions (faisable)

**Idée**: Détecter les "blocs produit" avant OCR

```javascript
// 1. Détection de blocs avec OpenCV.js ou TensorFlow.js
const blocks = detectProductBlocks(image) // Retourne rectangles [x,y,w,h]

// 2. OCR par bloc
for (const block of blocks) {
  const croppedImage = cropImage(image, block)
  const text = await tesseract.recognize(croppedImage)
  const product = parseProductBlock(text)
  products.push(product)
}

// 3. Parsing intelligent par bloc
function parseProductBlock(text) {
  return {
    name: extractProductName(text),
    price: extractMainPrice(text), // Ignore prix unitaires
    volume: extractVolume(text),   // 3 lb, 500g, etc.
    promo: extractPromoText(text)  // "2 pour", "Économisez"
  }
}
```

**Avantages**:
- Meilleure association produit-prix
- Ignore le texte de mise en page
- ~60-70% de précision

**Inconvénients**:
- Nécessite OpenCV.js (~500KB)
- Plus lent (2-3x)
- Toujours imparfait

---

### 🟡 Option 2: Vision AI (Google Cloud Vision, AWS Textract)

**Idée**: Utiliser une API de vision avancée

```javascript
// Google Cloud Vision API
const response = await fetch('https://vision.googleapis.com/v1/images:annotate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    requests: [{
      image: { content: base64Image },
      features: [
        { type: 'DOCUMENT_TEXT_DETECTION' }, // OCR structuré
        { type: 'OBJECT_LOCALIZATION' }      // Détection objets
      ]
    }]
  })
})

const { textAnnotations } = response.data.responses[0]
// Retourne texte + bounding boxes → meilleure association
```

**Avantages**:
- OCR de qualité professionnelle
- Détection automatique de la mise en page
- ~85-90% de précision

**Inconvénients**:
- $$$ (gratuit jusqu'à 1000 images/mois, puis ~$1.50/1000)
- Nécessite backend (clé API secrète)
- Dépendance externe

---

### 🔴 Option 3: Machine Learning custom (difficile mais optimal)

**Idée**: Entraîner un modèle spécifique aux circulaires

1. **Dataset**: Annoter 500-1000 circulaires manuellement
   ```json
   {
     "image": "flyer_001.jpg",
     "products": [
       {"bbox": [10, 20, 100, 150], "name": "Pommes Gala", "price": 2.99, "unit": "lb"}
     ]
   }
   ```

2. **Modèle**: YOLOv8 ou Detectron2 pour détection d'objets
   - Classe: "product_block"
   - Détecte les rectangles de produits

3. **OCR ciblé**: Tesseract uniquement sur les blocs détectés

**Avantages**:
- Précision ~95%+
- Gratuit après entraînement
- Pas de dépendance API

**Inconvénients**:
- 40-80h de travail d'annotation
- Nécessite expertise ML
- Infrastructure GPU pour entraînement

---

## 🎯 Recommandation réaliste

### Court terme (maintenant):
**Accepter les limites et documenter**

```javascript
// Ajout dans UploadFlyerModal.jsx
<div className="bg-amber-50 border border-amber-200 rounded p-3 mb-4">
  <h4 className="font-semibold text-amber-900">⚠️ OCR expérimental</h4>
  <p className="text-sm text-amber-800">
    L'analyse fonctionne mieux avec:
    <ul className="list-disc ml-5 mt-2">
      <li>Circulaires simples (texte noir sur blanc)</li>
      <li>Un produit par ligne</li>
      <li>Prix clairement séparés</li>
    </ul>
    <strong>Précision attendue: 30-50%</strong> - Vérifiez toujours les résultats.
  </p>
</div>
```

### Moyen terme (1-2 mois):
**Option 1 avec OpenCV.js**
- Implémenter détection de blocs
- Parser plus intelligent
- Tester sur 20-30 circulaires réelles
- Atteindre 60-70% de précision

### Long terme (3-6 mois):
**Option 2 (Google Vision) si budget**
- Backend Node.js avec authentification
- Queue de traitement
- Modération manuelle des résultats
- ~85% de précision

---

## 🧪 Test avec votre PDF

Pour tester le PDF que vous avez fourni:

1. **Ouvrez** `http://localhost:5173/test-ocr.html`
2. **Convertissez** le PDF en images (une page = une image JPG)
   - Outil en ligne: https://www.ilovepdf.com/pdf_to_jpg
3. **Uploadez** une page à la fois
4. **Vérifiez** dans la console:
   - Le texte brut détecté
   - Si les prix sont reconnus
   - Si les noms de produits sont cohérents

**Attendez-vous à**:
- ~50% des produits correctement détectés
- ~30% avec mauvaise association nom-prix
- ~20% complètement manqués

---

## 💡 Alternative: Contribution manuelle guidée

Au lieu de l'OCR automatique, pourquoi pas:

```javascript
// Interface de saisie semi-automatique
function ContributeFlyerManual() {
  return (
    <div>
      <ImageViewer src={flyerImage} />
      <form>
        {/* Utilisateur sélectionne zone sur l'image */}
        <RegionSelector onSelect={(bbox) => {
          const cropped = cropImage(flyerImage, bbox)
          const text = await quickOCR(cropped) // OCR sur petite zone = meilleur
          setProductName(text) // Pré-rempli, utilisateur corrige si besoin
        }} />
        
        <input value={productName} onChange={...} />
        <input value={price} type="number" />
        <button>Ajouter produit</button>
      </form>
    </div>
  )
}
```

**Avantages**:
- 100% de précision (humain vérifie)
- Plus rapide que saisie complètement manuelle
- Utilisateurs engagés = meilleure qualité

---

## 📊 Conclusion

L'OCR actuel est un **POC (proof of concept)** qui démontre la faisabilité technique, mais ne remplacera **pas** une vraie solution en production.

**Choix à faire**:
1. Gardez l'OCR basique comme "fonctionnalité expérimentale" (disclaimer)
2. Investissez dans Option 1 (OpenCV) pour améliorer à ~60-70%
3. Payez pour Option 2 (Google Vision) si besoin de vrais résultats
4. Optez pour la contribution manuelle guidée (meilleur ratio effort/résultat)

Quelle direction préférez-vous?
