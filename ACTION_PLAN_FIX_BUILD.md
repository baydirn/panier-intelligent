# 🔥 ACTION PLAN - FIX IMMEDIATE

## BLOCAGE CRITIQUE: Build Scripts ES Module Error

### Diagnostic Rapide
```
❌ npm run build → FAILS
   └─→ Error: require is not defined in ES module
       File: scripts/generate-initial-prices.js:3
       Cause: package.json has "type": "module"
```

### Solution Choisie: Option 1 (Convertir en ES Modules)

**Rationale:** 
- Plus propre que .cjs (consistency avec resto du projet)
- Utilise imports ES6 (modern)
- Prépare pour Node.js futur

### Fichiers à Modifier (3)

#### 1️⃣ scripts/generate-initial-prices.js
```diff
- const fs = require('fs')
+ import fs from 'fs'

- const path = require('path')
+ import path from 'path'

- const { initStorageProvider, getStorageProvider } = require('../src/services/storage')
+ import { initStorageProvider, getStorageProvider } from '../src/services/storage/index.js'

- module.exports = { generatePrices }
+ export { generatePrices }
```

#### 2️⃣ scripts/generate-prices-meta.js
```diff
- const fs = require('fs')
+ import fs from 'fs'

- const path = require('path')
+ import path from 'path'

- module.exports = { generatePricesMeta }
+ export { generatePricesMeta }
```

#### 3️⃣ scripts/generate-mock-data.js
```diff
- const fs = require('fs')
+ import fs from 'fs'

- module.exports = { generateMockData }
+ export { generateMockData }
```

### Étapes de Fix

1. **Lire les 3 fichiers** pour voir les require() exacts
2. **Remplacer tous require()** par import (ES6)
3. **Vérifier les imports de chemin** → Ajouter '.js' extension
4. **Tester le build:** `npm run build`
5. **Confirmer le succès**

### Alternative Rapide (Si import fails)
Si les imports locaux ne marchent pas:
```json
// Dans package.json, commentez prebuild:
"prebuild": "",
```
Cela skip la génération au build mais permet au reste de compiler.

### Validation
Après fix, ces commandes doivent marcher:
```bash
npm run generate:prices      # ✅ Doit réussir
npm run generate:meta        # ✅ Doit réussir
npm run generate:mock        # ✅ Doit réussir
npm run build                # ✅ Doit réussir
```

### Temps Estimé: 15-20 minutes

---

## SÉCURITÉ: serviceAccountKey.json

### Action Immédiate
```bash
# 1. Ajouter à .gitignore
echo "serviceAccountKey.json" >> .gitignore

# 2. Retirer du git (si committé)
git rm --cached serviceAccountKey.json

# 3. Vérifier
git status  # Ne doit pas afficher serviceAccountKey.json
```

### Plus Tard (Best Practice)
- Stocker la clé en variable d'environnement GitHub Actions
- Ou utiliser Firebase App Check
- Ou ne pas partager la clé du tout (chaque dev: sa propre)

---

## Après Ces Fixes

✅ npm run build fonctionne
✅ firebase deploy fonctionne
✅ App ready for next features

**Next:** Continuer avec design polish (Parametres.jsx, Analyse.jsx)

---

**Created:** 29 décembre 2025 | **Estimated Fix Time:** 20 min
