# Variables d'environnement Vercel - panier-intelligent

## Instructions

1. Va sur https://vercel.com/dashboard
2. Sélectionne ton projet "panier-intelligent"
3. Settings → Environment Variables
4. Ajoute CHAQUE variable ci-dessous (clique "Add New" pour chaque)
5. Pour chaque variable, sélectionne les environnements : Production, Preview, Development (ou au minimum Production)

---

## Variables OBLIGATOIRES

### GITHUB_REPO
**Value:** `baydirn/panier-intelligent`
**Description:** Repo GitHub où publier prices.json et prices-meta.json

### GITHUB_TOKEN
**Value:** `[COLLE TON PAT ICI]`
**Description:** Personal Access Token avec permission Contents: Read & Write
**⚠️ IMPORTANT:** Ne partage jamais cette valeur, garde-la secrète

### PRICE_SOURCE_URLS
**Value (exemple de départ):** `https://raw.githubusercontent.com/baydirn/panier-intelligent/main/public/prices.sample.json`
**Description:** Liste d'URLs JSON séparées par des virgules (tu pourras ajouter d'autres sources plus tard)
**Format attendu:** Chaque URL doit retourner `[{name,store,price}]` ou `{items:[{name,store,price}]}`

### CRON_SECRET
**Value (génère-le avec la commande PowerShell ci-dessous):**
```powershell
-join ((48..57)+(65..90)+(97..122) | Get-Random -Count 48 | ForEach-Object {[char]$_})
```
**Description:** Jeton secret pour protéger l'accès à /api/update-prices
**⚠️ IMPORTANT:** Garde cette valeur précieusement, tu en auras besoin à l'étape 4

### VITE_PRICE_DATA_URL
**Value:** `https://raw.githubusercontent.com/baydirn/panier-intelligent/main/prices.json`
**Description:** URL publique où le frontend chargera les prix (sera créé automatiquement après première exécution)

---

## Variables RECOMMANDÉES (valeurs par défaut si omises)

### GITHUB_PATH
**Value:** `prices.json`
**Description:** Nom du fichier de prix agrégés dans le repo

### GITHUB_META_PATH
**Value:** `prices-meta.json`
**Description:** Nom du fichier méta (stats d'agrégation)

### GITHUB_HISTORY_DIR
**Value:** `prices-history`
**Description:** Dossier pour les snapshots hebdomadaires (un fichier par semaine)

### GITHUB_BRANCH
**Value:** `main`
**Description:** Branche Git cible (main par défaut)

---

## Variables OPTIONNELLES

### PRICE_META_URL
**Value:** `https://raw.githubusercontent.com/baydirn/panier-intelligent/main/prices-meta.json`
**Description:** URL directe pour le statut (fallback intelligent si omis)

### PRICE_DATA_URL
**Value:** `https://raw.githubusercontent.com/baydirn/panier-intelligent/main/prices.json`
**Description:** Fallback pour /api/price-status si PRICE_META_URL absent

---

## Après l'ajout des variables

1. Vercel va automatiquement redéployer ton projet
2. Attends que le déploiement soit terminé (onglet "Deployments")
3. Vérifie que le déploiement est en "Ready" (vert)
4. Note ton URL de déploiement (ex: https://panier-intelligent.vercel.app)
5. Reviens me dire "Étape 2 OK" pour passer à l'étape 3

---

## Commande PowerShell pour générer CRON_SECRET

Copie-colle dans ton terminal PowerShell :

```powershell
-join ((48..57)+(65..90)+(97..122) | Get-Random -Count 48 | ForEach-Object {[char]$_})
```

Sauvegarde le résultat dans un fichier texte sécurisé (tu en auras besoin pour déclencher manuellement l'API).
