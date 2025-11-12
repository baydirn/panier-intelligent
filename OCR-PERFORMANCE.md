# Optimisations de Performance OCR

## Optimisations Appliquées

### 1. **Modèle de langue simplifié**
- **Avant**: `fra+eng` (2 modèles de langue)
- **Après**: `fra` (1 modèle seulement)
- **Gain**: ~30-40% plus rapide au chargement

### 2. **Mode PSM optimisé**
- **Avant**: Mode 1 (OSD - Détection d'orientation)
- **Après**: Mode 3 (Automatique complet, sans OSD)
- **Gain**: ~20-30% plus rapide par page

### 3. **Whitelist de caractères supprimée**
- **Avant**: Liste restrictive de caractères autorisés
- **Après**: Pas de restriction (Tesseract décide)
- **Gain**: ~10-15% plus rapide

### 4. **Réduction du nombre de pages PDF**
- **Avant**: Maximum 10 pages
- **Après**: Maximum 5 pages
- **Raison**: Les premières pages contiennent généralement les meilleures offres

### 5. **Résolution d'image réduite**
- **Avant**: Scale 1.5x pour le rendu PDF
- **Après**: Scale 1.2x
- **Gain**: Moins de pixels = traitement plus rapide
- **Compromis**: Légère perte de précision sur texte très petit

## Performance Attendue

### Images JPG/PNG
- **Avant**: 15-30 secondes
- **Après**: 8-15 secondes

### PDF Multi-pages
- **Avant**: 1-3 minutes (10 pages)
- **Après**: 30-60 secondes (5 pages)

## Optimisations Futures Possibles

### Option 1: OCR Backend (Serveur)
- Déplacer Tesseract côté serveur (Node.js)
- Utiliser un GPU pour accélération
- **Avantage**: 5-10x plus rapide
- **Inconvénient**: Coûts d'infrastructure

### Option 2: API Google Cloud Vision
- Service OCR cloud optimisé
- **Avantage**: Très rapide (2-5 secondes), meilleure précision
- **Inconvénient**: Coûts par requête (~$1.50/1000 images)

### Option 3: Résolution adaptative
```javascript
// Détecter la qualité de l'image et ajuster la résolution
const scale = imageQuality > 150 ? 1.0 : 1.2
```

### Option 4: Prétraitement d'image
```javascript
// Améliorer le contraste avant OCR
- Conversion en niveaux de gris
- Ajustement du contraste
- Binarisation (noir et blanc pur)
```

### Option 5: OCR Parallèle (Web Workers)
- Traiter plusieurs pages en parallèle
- **Gain potentiel**: 2-3x plus rapide sur PDFs
- **Complexité**: Moyenne

## Paramètres Ajustables

Si l'OCR est **trop lent** mais **précis**:
- Réduire `maxPages` à 3
- Réduire `scale` à 1.0
- Utiliser mode PSM 6 (bloc uniforme)

Si l'OCR est **rapide** mais **imprécis**:
- Augmenter `scale` à 1.5
- Revenir au mode PSM 1 (avec OSD)
- Ajouter `fra+eng` pour texte bilingue

## Monitoring

Ajouter des logs de performance:
```javascript
console.time('[OCR] Page processing')
// ... traitement
console.timeEnd('[OCR] Page processing')
```
