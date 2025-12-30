# 🚀 Démarrage Rapide - Panier Intelligent

**Temps estimé:** 30 minutes
**Niveau:** Débutant

---

## ✅ Checklist Avant de Commencer

- [ ] Node.js 18+ installé (`node --version`)
- [ ] npm 10+ installé (`npm --version`)
- [ ] Compte Google (gratuit)
- [ ] Connexion Internet

---

## Étape 1: Créer le Projet Firebase (10 min)

### 1.1 Créer le projet

1. Allez sur [https://console.firebase.google.com](https://console.firebase.google.com)
2. Cliquez sur **"Ajouter un projet"**
3. Nom: **panier-intelligent**
4. Google Analytics: **Activer** ✅
5. Cliquez sur **"Créer le projet"**

### 1.2 Activer les services

**Authentication:**
1. Menu **Build** → **Authentication** → **Get started**
2. Onglet **Sign-in method**
3. Activer **Email/Password** ✅
4. Activer **Google** ✅

**Firestore Database:**
1. Menu **Build** → **Firestore Database** → **Create database**
2. Mode: **Test mode** (on déploiera les rules après)
3. Location: **nam5 (United States)**
4. Cliquez sur **Enable**

**Cloud Messaging:**
1. Menu **Build** → **Cloud Messaging**
2. Cliquez sur **Get started** (rien à configurer)

### 1.3 Ajouter une Web App

1. **Project Settings** (⚙️) → Onglet **General**
2. Section **Your apps** → Cliquez sur **Web** (`</>`)
3. App nickname: **Panier Intelligent Web**
4. ✅ Cochez **"Also set up Firebase Hosting"**
5. Cliquez sur **Register app**

### 1.4 Copier les credentials

Vous verrez un code comme ceci:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSy...",
  authDomain: "panier-intelligent.firebaseapp.com",
  projectId: "panier-intelligent",
  // ...
};
```

**⚠️ IMPORTANT:** Gardez cette fenêtre ouverte, on en aura besoin à l'Étape 3.

---

## Étape 2: Installer Firebase CLI (2 min)

Ouvrez un terminal (PowerShell sur Windows) :

```powershell
# Installer Firebase CLI globalement
npm install -g firebase-tools

# Se connecter à Firebase
firebase login
```

Une fenêtre de navigateur s'ouvrira → Connectez-vous avec Google.

**Output attendu:**
```
✔ Success! Logged in as votre-email@gmail.com
```

---

## Étape 3: Configurer le Projet Local (5 min)

### 3.1 Créer le fichier .env

Dans le dossier du projet (`c:\Dev\panier-intelligent`), exécutez:

```powershell
# Copier le template
Copy-Item .env.example .env
```

### 3.2 Remplir le .env

Ouvrez `.env` avec votre éditeur de code et remplissez avec les valeurs de l'Étape 1.4:

```env
VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=panier-intelligent.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=panier-intelligent
VITE_FIREBASE_STORAGE_BUCKET=panier-intelligent.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789012
VITE_FIREBASE_APP_ID=1:123456789012:web:abc...
VITE_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX
```

**Pour la VAPID Key:**
1. Retournez dans Firebase Console → **Project Settings** → **Cloud Messaging**
2. Section **Web Push certificates** → Cliquez sur **Generate key pair**
3. Copiez la clé (commence par `BM-...`)
4. Ajoutez dans `.env`:
   ```env
   VITE_FIREBASE_VAPID_KEY=BM-XXXXXXX...
   ```

**Laissez le reste par défaut:**
```env
VITE_USE_FIREBASE_EMULATORS=false
VITE_BACKEND_URL=http://localhost:3001
```

Sauvegardez et fermez `.env`.

---

## Étape 4: Initialiser Firebase (3 min)

Dans le terminal, à la racine du projet:

```powershell
# Initialiser Firebase
firebase init
```

**Répondez aux questions:**

1. **Which Firebase features?** (Appuyez Espace pour cocher)
   - ✅ Firestore
   - ✅ Hosting
   - Appuyez Enter

2. **Use an existing project:**
   - Sélectionnez **panier-intelligent**

3. **Firestore Rules file:**
   - Tapez: `firestore.rules` (déjà créé)
   - Appuyez Enter

4. **Firestore indexes file:**
   - Appuyez Enter (default: `firestore.indexes.json`)

5. **Public directory:**
   - Tapez: `dist`
   - Appuyez Enter

6. **Single-page app:**
   - Tapez: `y` (Yes)
   - Appuyez Enter

7. **Automatic builds with GitHub:**
   - Tapez: `N` (No)
   - Appuyez Enter

8. **Overwrite dist/index.html:**
   - Tapez: `N` (No)
   - Appuyez Enter

**Output attendu:**
```
✔ Firebase initialization complete!
```

---

## Étape 5: Déployer les Security Rules (1 min)

```powershell
firebase deploy --only firestore:rules
```

**Output attendu:**
```
✔ Deploy complete!
```

---

## Étape 6: Générer les Données de Test (3-5 min)

```powershell
node scripts/generate-mock-data.js
```

**⏳ Attendez 3-5 minutes...**

**Output attendu:**
```
🚀 Début de la génération des données mock...

📦 500 produits à créer
🏪 5 magasins
📊 Total: 2500 entrées storePrices

🏪 Création des magasins...
  ✅ IGA
  ✅ Metro
  ✅ Maxi
  ✅ Super C
  ✅ Costco

📦 Création des produits et prix...
  📈 Progression: 50/500 produits (10%)
  ...
  📈 Progression: 500/500 produits (100%)

✅ Génération terminée!

📊 Résumé:
  - Magasins créés: 5
  - Produits créés: 500
  - Prix créés: 2500

🎉 Base de données prête à l'emploi!
```

### Vérifier dans Firebase Console

1. Allez dans **Firestore Database** → **Data**
2. Vous devriez voir:
   - `products` (500 documents) ✅
   - `stores` (5 documents) ✅
   - `storePrices` (2500 documents) ✅

---

## Étape 7: Tester Localement (2 min)

```powershell
# Démarrer le serveur de développement
npm run dev
```

**Output attendu:**
```
  VITE v7.2.4  ready in 345 ms

  ➜  Local:   http://localhost:5177/
  ➜  Network: use --host to expose
  ➜  press h + enter to show help
```

### Ouvrir dans le navigateur

Allez sur [http://localhost:5177](http://localhost:5177)

### Tester l'authentification

1. Cliquez sur **"Se connecter"** (ou **"Sign In"**)
2. Essayez **"Sign in with Google"** → Devrait ouvrir popup Google
3. Ou créez un compte avec email/password
4. Vous devriez être redirigé vers la page Liste ✅

### Vérifier dans Firebase Console

1. Allez dans **Authentication** → **Users**
2. Vous devriez voir votre compte créé ✅

---

## Étape 8: Déployer en Production (5 min) 🎉

### 8.1 Build de production

```powershell
npm run build
```

**Output attendu:**
```
vite v7.2.4 building for production...
✓ 1234 modules transformed.
dist/index.html                  0.45 kB │ gzip: 0.30 kB
dist/assets/index-abc123.js    145.23 kB │ gzip: 45.12 kB
✓ built in 2.34s
```

### 8.2 Déployer vers Firebase Hosting

```powershell
firebase deploy
```

**⏳ Attendez 1-2 minutes...**

**Output attendu:**
```
=== Deploying to 'panier-intelligent'...

i  deploying firestore, hosting
✔  firestore: rules file firestore.rules compiled successfully
i  firestore: uploading rules firestore.rules...
✔  firestore: released rules firestore.rules to cloud.firestore
i  hosting[panier-intelligent]: beginning deploy...
✔  hosting[panier-intelligent]: file upload complete
✔  hosting[panier-intelligent]: version finalized
✔  hosting[panier-intelligent]: release complete

✔  Deploy complete!

Project Console: https://console.firebase.google.com/project/panier-intelligent/overview
Hosting URL: https://panier-intelligent.web.app
```

### 8.3 Tester en production

Ouvrez l'URL fournie dans le navigateur:
```
https://panier-intelligent.web.app
```

**✅ Votre application est en ligne !**

---

## 🎉 Félicitations !

Vous avez déployé **Panier Intelligent** en production !

### Prochaines Étapes

1. **Testez l'application** avec des amis/famille
2. **Créez une liste collaborative** et invitez quelqu'un
3. **Testez l'optimisation** avec au moins 10 produits
4. **Consultez la documentation** pour aller plus loin:
   - [FIREBASE_SETUP.md](FIREBASE_SETUP.md) - Guide complet
   - [ARCHITECTURE_COMPLETE.md](ARCHITECTURE_COMPLETE.md) - Architecture
   - [PHASE_1_RECAP.md](PHASE_1_RECAP.md) - Prochaines phases

---

## ❓ Problèmes Courants

### Problème: "Firebase config is missing"
**Solution:**
```powershell
# Vérifiez que .env est bien rempli
cat .env

# Redémarrez le serveur dev
npm run dev
```

### Problème: "Permission denied" lors du deploy
**Solution:**
```powershell
# Reconnectez-vous à Firebase
firebase login --reauth
```

### Problème: "Module not found"
**Solution:**
```powershell
# Réinstallez les dépendances
Remove-Item -Recurse -Force node_modules
npm install
```

### Problème: Script generate-mock-data.js échoue
**Solution:**
```powershell
# Vérifiez que .env est configuré
cat .env

# Vérifiez que Firestore est activé dans Firebase Console
# Build > Firestore Database > Doit être "Enabled"
```

---

## 📞 Support

**Besoin d'aide ?**

1. Consultez [FIREBASE_SETUP.md](FIREBASE_SETUP.md) pour le guide détaillé
2. Ouvrez une issue sur [GitHub](https://github.com/panier-intelligent/app/issues)
3. Contactez-nous: support@panierintelligent.app

---

## 🔗 Liens Utiles

- **Console Firebase:** [console.firebase.google.com](https://console.firebase.google.com)
- **Documentation Firebase:** [firebase.google.com/docs](https://firebase.google.com/docs)
- **Votre App en Ligne:** `https://panier-intelligent.web.app`

---

## 📋 Récapitulatif des Commandes

```powershell
# Setup initial
npm install -g firebase-tools
firebase login
Copy-Item .env.example .env
# (Remplir .env avec credentials Firebase)

# Initialiser Firebase
firebase init

# Déployer Security Rules
firebase deploy --only firestore:rules

# Générer données test
node scripts/generate-mock-data.js

# Développement local
npm run dev

# Build production
npm run build

# Déployer en production
firebase deploy
```

---

**Temps total:** ~30 minutes ⏱️

**Résultat:** Application web en production avec 500 produits × 5 épiceries ✅

---

<p align="center">
  <strong>🎉 Bravo ! Vous avez déployé votre première application Firebase ! 🎉</strong>
</p>
