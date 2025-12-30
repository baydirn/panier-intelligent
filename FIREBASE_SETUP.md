# Guide de Déploiement Firebase - Panier Intelligent

Ce guide vous accompagne étape par étape pour configurer Firebase et déployer votre application.

---

## Étape 1: Créer un Projet Firebase

### 1.1 Créer le projet

1. Allez sur [https://console.firebase.google.com](https://console.firebase.google.com)
2. Cliquez sur **"Ajouter un projet"**
3. Nom du projet: **panier-intelligent**
4. Google Analytics: **Activer** (recommandé)
5. Compte Analytics: **Créer un nouveau compte** ou utiliser existant
6. Cliquez sur **"Créer le projet"**

### 1.2 Sélectionner la région (Loi 25 Québec)

⚠️ **Important pour conformité Loi 25:**
1. Dans la console Firebase, allez dans **Project Settings** (⚙️)
2. Onglet **General**
3. Section **"Your project"** → **"Default GCP resource location"**
4. Sélectionnez: **`northamerica-northeast1 (Montreal)`**
5. Cliquez sur **"Done"**

> Cette région est au Canada et conforme à la Loi 25 du Québec.

---

## Étape 2: Activer les Services Firebase

### 2.1 Activer Firebase Authentication

1. Dans la console Firebase, menu **Build** → **Authentication**
2. Cliquez sur **"Get started"**
3. Onglet **"Sign-in method"**
4. Activer les providers:

#### Email/Password
- Cliquez sur **"Email/Password"**
- Toggle **"Enable"** → ON
- Cliquez sur **"Save"**

#### Google Sign-In
- Cliquez sur **"Google"**
- Toggle **"Enable"** → ON
- Project support email: votre email
- Cliquez sur **"Save"**

### 2.2 Activer Cloud Firestore

1. Menu **Build** → **Firestore Database**
2. Cliquez sur **"Create database"**
3. Mode: **"Start in test mode"** (on déploiera les Security Rules après)
4. Location: **`nam5 (United States)` ou `northamerica-northeast1` si disponible**
5. Cliquez sur **"Enable"**

> ⚠️ Si `northamerica-northeast1` n'est pas disponible pour Firestore, utilisez `nam5` (multi-région Nord-Amérique, conforme Loi 25).

### 2.3 Activer Cloud Messaging (Notifications)

1. Menu **Build** → **Cloud Messaging**
2. Cliquez sur **"Get started"** (rien à configurer pour l'instant)

### 2.4 Activer Cloud Functions (Optionnel - Phase 2)

1. Menu **Build** → **Functions**
2. Cliquez sur **"Get started"**
3. Suivez les instructions (on configurera plus tard)

---

## Étape 3: Configurer l'Application Web

### 3.1 Ajouter une application Web

1. Dans **Project Settings** (⚙️), onglet **General**
2. Section **"Your apps"** → Cliquez sur l'icône **Web** (`</>`)
3. App nickname: **Panier Intelligent Web**
4. ✅ Cochez **"Also set up Firebase Hosting for this app"**
5. Cliquez sur **"Register app"**

### 3.2 Récupérer les credentials Firebase

Vous verrez un code comme ceci:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  authDomain: "panier-intelligent.firebaseapp.com",
  projectId: "panier-intelligent",
  storageBucket: "panier-intelligent.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef123456",
  measurementId: "G-XXXXXXXXXX"
};
```

**Copiez ces valeurs**, on les utilisera dans `.env`.

### 3.3 Récupérer la VAPID Key (pour notifications)

1. Dans **Project Settings** (⚙️), onglet **Cloud Messaging**
2. Section **"Web configuration"**
3. Sous **"Web Push certificates"**, cliquez sur **"Generate key pair"**
4. Copiez la **"Key pair"** (commence par `BM-...`)

---

## Étape 4: Configurer le Projet Localement

### 4.1 Créer le fichier .env

```bash
# À la racine du projet
cp .env.example .env
```

### 4.2 Remplir le fichier .env

Ouvrez `.env` et remplacez avec vos vraies valeurs Firebase (copiées à l'Étape 3.2):

```env
# Firebase Configuration
VITE_FIREBASE_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
VITE_FIREBASE_AUTH_DOMAIN=panier-intelligent.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=panier-intelligent
VITE_FIREBASE_STORAGE_BUCKET=panier-intelligent.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789012
VITE_FIREBASE_APP_ID=1:123456789012:web:abcdef123456
VITE_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX

# Firebase Cloud Messaging VAPID Key
VITE_FIREBASE_VAPID_KEY=BM-XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX

# Mode développement (false pour utiliser Firebase cloud)
VITE_USE_FIREBASE_EMULATORS=false

# Backend API URL (optionnel si Express utilisé en parallèle)
VITE_BACKEND_URL=http://localhost:3001
```

---

## Étape 5: Installer Firebase CLI

### 5.1 Installer globalement

```bash
npm install -g firebase-tools
```

### 5.2 Se connecter à Firebase

```bash
firebase login
```

Une fenêtre de navigateur s'ouvrira pour authentification Google.

### 5.3 Initialiser Firebase dans le projet

```bash
firebase init
```

Sélectionnez (avec espace pour cocher):
- ✅ Firestore
- ✅ Hosting

**Firestore Setup:**
- What file should be used for Firestore Rules? **firestore.rules** (déjà créé)
- File for Firestore indexes? **firestore.indexes.json** (appuyez Enter)

**Hosting Setup:**
- What do you want to use as your public directory? **dist**
- Configure as a single-page app? **Yes**
- Set up automatic builds with GitHub? **No** (pour l'instant)
- File dist/index.html already exists. Overwrite? **No**

### 5.4 Sélectionner le projet Firebase

```bash
firebase use panier-intelligent
```

Ou si vous avez plusieurs projets:

```bash
firebase projects:list
firebase use <PROJECT_ID>
```

---

## Étape 6: Déployer les Security Rules

### 6.1 Vérifier les rules localement

```bash
cat firestore.rules
```

### 6.2 Déployer vers Firebase

```bash
firebase deploy --only firestore:rules
```

Vous devriez voir:
```
✔  Deploy complete!
```

### 6.3 Vérifier dans la console

1. Allez dans **Firestore Database** → **Rules**
2. Vous devriez voir vos rules déployées
3. Mode: **Production** ✅

---

## Étape 7: Générer les Données Mock (500 produits × 5 épiceries)

### 7.1 Vérifier que .env est configuré

Assurez-vous que `.env` contient vos vraies credentials Firebase.

### 7.2 Exécuter le script

```bash
node scripts/generate-mock-data.js
```

**Durée:** ~2-5 minutes (500 produits + 2500 prix)

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
  📈 Progression: 100/500 produits (20%)
  ...
  📈 Progression: 500/500 produits (100%)

✅ Génération terminée!

📊 Résumé:
  - Magasins créés: 5
  - Produits créés: 500
  - Prix créés: 2500

🎉 Base de données prête à l'emploi!
```

### 7.3 Vérifier dans Firestore

1. Allez dans **Firestore Database** → **Data**
2. Vous devriez voir les collections:
   - `products` (500 documents)
   - `stores` (5 documents)
   - `storePrices` (2500 documents)

---

## Étape 8: Tester l'Application Localement

### 8.1 Démarrer le serveur de développement

```bash
npm run dev
```

### 8.2 Ouvrir dans le navigateur

```
http://localhost:5177
```

### 8.3 Tester l'authentification

1. Cliquez sur **"Se connecter"** ou **"S'inscrire"**
2. Essayez **"Sign in with Google"** → Devrait ouvrir popup Google
3. Essayez **"Email/Password"** → Devrait créer un compte

### 8.4 Vérifier dans Firebase Console

1. Allez dans **Authentication** → **Users**
2. Vous devriez voir votre compte créé ✅

---

## Étape 9: Déployer l'Application (Firebase Hosting)

### 9.1 Build de production

```bash
npm run build
```

Cela crée le dossier `dist/` avec les fichiers optimisés.

### 9.2 Déployer vers Firebase Hosting

```bash
firebase deploy --only hosting
```

**Output attendu:**
```
=== Deploying to 'panier-intelligent'...

i  deploying hosting
i  hosting[panier-intelligent]: beginning deploy...
i  hosting[panier-intelligent]: found 20 files in dist
✔  hosting[panier-intelligent]: file upload complete
i  hosting[panier-intelligent]: finalizing version...
✔  hosting[panier-intelligent]: version finalized
i  hosting[panier-intelligent]: releasing new version...
✔  hosting[panier-intelligent]: release complete

✔  Deploy complete!

Project Console: https://console.firebase.google.com/project/panier-intelligent/overview
Hosting URL: https://panier-intelligent.web.app
```

### 9.3 Tester l'application en production

Ouvrez l'URL fournie:
```
https://panier-intelligent.web.app
```

---

## Étape 10: Configurer les Domaines (Optionnel)

### 10.1 Acheter un domaine

Exemple: **panierintelligent.app** (sur Namecheap, Google Domains, etc.)

### 10.2 Ajouter le domaine dans Firebase

1. Dans Firebase Console, **Hosting** → **Add custom domain**
2. Entrez votre domaine: `panierintelligent.app`
3. Firebase vous donnera des records DNS à ajouter chez votre registrar

### 10.3 Configurer DNS

Chez votre registrar (ex: Namecheap), ajoutez:

**Type A Record:**
```
Host: @
Value: 151.101.1.195 (IP Firebase)
Value: 151.101.65.195 (IP Firebase)
```

**Type TXT Record (vérification):**
```
Host: @
Value: firebase=panier-intelligent (fourni par Firebase)
```

### 10.4 Attendre la propagation DNS (24-48h)

Une fois validé, votre app sera accessible sur:
```
https://panierintelligent.app
```

---

## Étape 11: Configurer Firebase Cloud Functions (Phase 2)

### 11.1 Installer Firebase Functions

```bash
npm install -g firebase-functions
cd functions
npm install
```

### 11.2 Créer une fonction de test

**functions/index.js:**
```javascript
const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();

exports.helloWorld = functions.https.onRequest((req, res) => {
  res.send("Hello from Firebase Cloud Functions!");
});
```

### 11.3 Déployer

```bash
firebase deploy --only functions
```

### 11.4 Tester

Ouvrez l'URL fournie:
```
https://us-central1-panier-intelligent.cloudfunctions.net/helloWorld
```

---

## Étape 12: Monitoring & Analytics

### 12.1 Activer Google Analytics

Déjà fait si activé à l'Étape 1. Vérifiez dans:
- Firebase Console → **Analytics** → **Dashboard**

### 12.2 Configurer des événements personnalisés

**src/services/analytics.js:**
```javascript
import { getAnalytics, logEvent } from 'firebase/analytics';

const analytics = getAnalytics();

export function logOptimizationEvent(totalSavings) {
  logEvent(analytics, 'optimization_completed', {
    savings: totalSavings
  });
}
```

### 12.3 Monitoring des erreurs

1. Firebase Console → **Crashlytics** (pour mobile seulement)
2. Ou intégrer Sentry pour web:
   ```bash
   npm install @sentry/react
   ```

---

## Troubleshooting

### Problème: "Firebase config is missing"

**Solution:**
- Vérifiez que `.env` est bien rempli
- Redémarrez le serveur dev: `npm run dev`

### Problème: "Permission denied" lors du deploy

**Solution:**
```bash
firebase login --reauth
```

### Problème: "Quota exceeded" lors de la génération de données

**Solution:**
- Firebase Free Tier limite à 50k writes/day
- Réduisez le nombre de produits dans `scripts/generate-mock-data.js` (ligne 200)

### Problème: "Invalid authentication" lors de tests locaux

**Solution:**
- Vérifiez que votre domaine local est autorisé dans **Authentication** → **Settings** → **Authorized domains**
- Ajoutez: `localhost`

---

## Commandes Utiles

```bash
# Voir les projets Firebase
firebase projects:list

# Changer de projet
firebase use <PROJECT_ID>

# Déployer tout
firebase deploy

# Déployer seulement Firestore rules
firebase deploy --only firestore:rules

# Déployer seulement Hosting
firebase deploy --only hosting

# Déployer seulement Functions
firebase deploy --only functions

# Voir les logs des Functions
firebase functions:log

# Ouvrir la console Firebase
firebase open

# Tester Firestore rules localement
firebase emulators:start
```

---

## Prochaines Étapes

Maintenant que Firebase est configuré:

1. ✅ **Tester l'authentification** (Google + Email/Password)
2. ✅ **Créer votre première liste partagée** (tester sync temps réel)
3. ✅ **Vérifier les données mock** (500 produits disponibles)
4. 🔜 **Implémenter Cloud Functions** (cron jobs, notifications)
5. 🔜 **Ajouter Stripe** (paiements premium)
6. 🔜 **Déployer sur mobile** (Capacitor.js)

---

## Support

**Documentation officielle:**
- Firebase: https://firebase.google.com/docs
- Firestore: https://firebase.google.com/docs/firestore
- Auth: https://firebase.google.com/docs/auth

**Issues GitHub:**
- https://github.com/panier-intelligent/app/issues

**Contact:**
- support@panierintelligent.app

---

🎉 **Félicitations ! Votre infrastructure Firebase est prête !**
