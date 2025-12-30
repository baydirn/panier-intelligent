# Plan d'Action Immédiat - Panier Intelligent

**Date:** 2025-12-29
**Priorité:** Compléter le MVP fonctionnel

---

## État Actuel du Projet

### ✅ Ce qui fonctionne déjà

1. **Frontend React + Vite**
   - Pages: Liste, Analyse, Magasin, Paramètres, SharedList
   - Design Figma partiellement intégré
   - Framer Motion + Tailwind CSS

2. **Gestion de base locale (IndexedDB)**
   - CRUD produits complet
   - Listes récurrentes
   - Listes sauvegardées
   - Historique des prix (local)

3. **Algorithme d'optimisation**
   - Multi-critères (prix + distance + nb magasins)
   - Top N combinaisons
   - Scoring pondéré

4. **Partage collaboratif (basique)**
   - Création de shareCode
   - Polling 5s pour sync
   - Backend Express avec routes `/api/share-list`

5. **Backend Express**
   - Authentification admin (JWT)
   - Endpoints partage de listes
   - Scraping IGA (partiellement implémenté)
   - Génération de données de test

### ❌ Ce qui manque pour le MVP

1. **Authentification réelle Firebase** (mock actuel)
2. **Base de données PostgreSQL** (Prisma configuré mais pas déployé)
3. **Sync temps réel** (actuellement polling, besoin Supabase Realtime)
4. **Permissions groupes** (admin/editor/viewer)
5. **Assignation des courses** (fonctionnalité complète manquante)
6. **Notifications prix** (infrastructure manquante)
7. **Mobile (Capacitor.js)** (pas encore implémenté)
8. **Freemium gates** (PaywallGate.jsx existe mais incomplet)

---

## Recommandation : Stack Technique Finale

### Frontend ✅ (Garder l'existant)
- React 18 + Vite
- Zustand + IndexedDB (offline-first)
- Capacitor.js pour mobile (à ajouter)

### Backend & Database
**Option Recommandée: Firebase Ecosystem Complet**

Pourquoi Firebase au lieu de Supabase?

1. **Déjà partiellement intégré** (AuthContext.jsx avec mock Firebase)
2. **Cloud Firestore** = NoSQL temps réel natif (pas besoin de polling)
3. **Firebase Cloud Messaging** déjà prévu pour notifications
4. **Cloud Functions** pour cron jobs (scraping, vérification prix)
5. **Firebase Hosting** gratuit pour static assets
6. **Tout-en-un** : Auth + DB + Storage + Functions + Hosting
7. **Free tier généreux:**
   - 50k reads/day, 20k writes/day
   - 10 GB storage
   - 360 MB/day bandwidth
   - 125k invocations Cloud Functions/month

**Alternative: Garder Express + Supabase PostgreSQL**
- Si vous préférez SQL et avez besoin de requêtes complexes
- Mais nécessite plus de configuration (Prisma + Supabase + Express + Vercel)

**Décision à prendre:** Que préférez-vous?
- [ ] **Option A:** Migrer vers Firebase complet (Auth + Firestore + Functions)
- [ ] **Option B:** Garder Supabase PostgreSQL + Express + Prisma

---

## Phase 1 (Prochains 7 jours) - Infrastructure de Base

### Objectif: Avoir un MVP fonctionnel avec auth réelle + DB cloud

### Si Option A (Firebase):

#### Jour 1-2: Configuration Firebase
```bash
# 1. Créer projet Firebase sur console.firebase.google.com
# 2. Activer:
#    - Authentication (Google + Email/Password)
#    - Cloud Firestore (mode test, région northamerica-northeast1 Montreal)
#    - Cloud Functions
#    - Cloud Messaging

# 3. Installer Firebase SDK
npm install firebase firebase-admin
npm install -D firebase-tools

# 4. Initialiser Firebase
npx firebase login
npx firebase init
# Sélectionner: Firestore, Functions, Hosting

# 5. Mettre à jour .env
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```

**Fichiers à modifier:**
- `src/services/firebase.js` (remplacer mock par vraie config)
- `src/contexts/AuthContext.jsx` (supprimer mock, utiliser vraie Firebase Auth)
- `src/services/db.js` (migrer de IndexedDB vers Firestore pour sync cloud)

#### Jour 3-4: Migration données vers Firestore
**Structure Firestore:**
```
users/
  {userId}/
    email: string
    displayName: string
    tier: "free" | "premium"
    preferences: {
      maxStores: number
      maxRadiusKm: number
      favoriteStores: string[]
    }

sharedLists/
  {listId}/
    ownerId: string
    title: string
    shareCode: string
    products: array
    combinaisonChoisie: object
    members: {
      {userId}: "admin" | "editor" | "viewer"
    }
    createdAt: timestamp
    updatedAt: timestamp

products/ (catalogue universel)
  {productId}/
    nom_produit: string
    marque: string
    categorie: string
    volume: number
    unite: string
    code_barre: string
    tags: array

storePrices/
  {storeProductId}/
    product_id: string
    store_id: string
    prix_regulier: number
    prix_promo: number
    promo_actif: boolean
    last_updated: timestamp
```

**Script de migration:**
```javascript
// scripts/migrate-to-firestore.js
// Exporter les données mock actuelles vers Firestore
```

#### Jour 5-6: Sync temps réel Firestore
**Remplacer polling par Firestore onSnapshot:**
```javascript
// src/pages/SharedList.jsx (avant)
useEffect(() => {
  const interval = setInterval(() => {
    fetchSharedList(code) // polling 5s
  }, 5000)
  return () => clearInterval(interval)
}, [])

// (après)
useEffect(() => {
  const unsubscribe = onSnapshot(
    doc(db, 'sharedLists', listId),
    (snapshot) => {
      setListData(snapshot.data())
    }
  )
  return () => unsubscribe()
}, [listId])
```

#### Jour 7: Tests + Corrections
- Tester avec 3 utilisateurs simultanés
- Vérifier sync temps réel
- Corriger bugs

---

### Si Option B (Supabase + Express):

#### Jour 1-2: Déploiement Supabase
```bash
# 1. Créer projet sur supabase.com
# 2. Région: Canada (Montreal)
# 3. Récupérer credentials:
#    - DATABASE_URL
#    - SUPABASE_URL
#    - SUPABASE_ANON_KEY

# 4. Mettre à jour .env
DATABASE_URL="postgresql://..."
SUPABASE_URL="https://xxx.supabase.co"
SUPABASE_ANON_KEY="..."

# 5. Migrer schéma Prisma
npx prisma migrate dev --name init
npx prisma generate

# 6. Seed database
node scripts/seed-supabase.js
```

#### Jour 3-4: Migration Auth vers Firebase (garder)
```bash
# Garder Firebase pour Auth (meilleur que Supabase Auth)
# Mais utiliser Supabase pour database
npm install firebase
```

**Workflow hybride:**
- Firebase Auth pour login/logout
- Supabase PostgreSQL pour données
- Express backend pour logique métier

#### Jour 5-6: Supabase Realtime
```javascript
// src/pages/SharedList.jsx
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

useEffect(() => {
  const channel = supabase
    .channel('shared-list-changes')
    .on('postgres_changes', {
      event: 'UPDATE',
      schema: 'public',
      table: 'SharedList',
      filter: `id=eq.${listId}`
    }, (payload) => {
      setListData(payload.new)
    })
    .subscribe()

  return () => {
    supabase.removeChannel(channel)
  }
}, [listId])
```

#### Jour 7: Tests + Corrections

---

## Phase 2 (Jours 8-14) - Partage Collaboratif Avancé

### Tasks
1. **Permissions (admin/editor/viewer)**
   - Ajouter champ `role` dans SharedListMember
   - Middleware backend vérifiant permissions
   - UI: Badge "Admin" dans liste membres

2. **Détection doublons**
   - Utiliser champ `nameKey` (déjà existant dans db.js)
   - Modal "Produit similaire : [nom]. Fusionner?"
   - Options: "Fusionner" / "Ajouter quand même"

3. **Multi-groupes**
   - Page `/groupes` listant tous les groupes de l'utilisateur
   - Bouton "Créer nouveau groupe"
   - Switch entre groupes

4. **Invitations par email**
   - Backend endpoint `/api/invite` (envoie email avec lien)
   - Page `/accept-invite/:inviteCode`

---

## Phase 3 (Jours 15-21) - Optimisation Avancée

### Tasks
1. **Intégration prix DB**
   - API `/api/prices` retourne depuis Firestore/Supabase
   - Remplacer mock data par vraies données (500 produits × 5 épiceries)

2. **UI Analyse.jsx améliorée**
   - Badges "Économie: 12.50$ (-15%)"
   - Icône 📍 "Distance totale: 8.2 km"
   - Bouton "Voir détails" → modal avec répartition par magasin

3. **Verrouillage produits**
   - Icône 🔒 sur produits verrouillés
   - Exclure produits verrouillés de l'optimisation

4. **Substitutions**
   - Algorithme de matching (même catégorie + volume similaire)
   - Modal "Substitut disponible : [nom] à [prix]"

---

## Phase 4 (Jours 22-28) - Assignation & Checklist

### Tasks
1. **Page `/assign` (admin only)**
   - Drag-and-drop pour assigner produits aux membres
   - Prévisualisation par magasin

2. **Table CourseAssignment** (Firestore ou Supabase)
   ```
   {
     listId: string
     userId: string
     storeCode: string
     productIds: string[]
     status: "pending" | "in_progress" | "completed"
   }
   ```

3. **Notifications FCM**
   - Backend Cloud Function: `onAssignmentCreate` → envoie notification
   - Frontend: Affiche notification in-app

4. **Page `/mes-courses`**
   - Liste des produits assignés
   - Checkboxes pour valider achats
   - Barre de progression

---

## Phase 5 (Jours 29-35) - Mobile (Capacitor.js)

### Tasks
1. **Installation Capacitor**
   ```bash
   npm install @capacitor/core @capacitor/cli
   npx cap init
   npx cap add ios
   npx cap add android
   ```

2. **Plugins**
   ```bash
   npm install @capacitor/camera @capacitor/geolocation @capacitor/push-notifications
   ```

3. **Scan code-barres**
   - Bouton "Scanner" dans Liste.jsx
   - Utilise Capacitor Camera plugin
   - Recherche produit par code-barres dans DB

4. **Build iOS/Android**
   ```bash
   npm run build
   npx cap sync
   npx cap open ios  # Xcode
   npx cap open android  # Android Studio
   ```

---

## Décisions à Prendre MAINTENANT

### 1. Stack Database
- [ ] **Firebase Firestore** (NoSQL, temps réel natif, tout-en-un)
- [ ] **Supabase PostgreSQL** (SQL, plus flexible pour requêtes complexes)

**Ma recommandation:** Firebase (plus simple pour solo dev, déjà partiellement intégré)

### 2. Ordre des priorités
Quelle phase voulez-vous attaquer en premier?

- [ ] **A. Infrastructure (Auth + DB cloud)** ← Recommandé
- [ ] **B. Optimisation avancée (meilleure UI)**
- [ ] **C. Mobile (Capacitor.js)**
- [ ] **D. Assignation des courses**

**Ma recommandation:** Ordre A → D → B → C

### 3. Données de test
Comment voulez-vous générer les 500 produits × 5 épiceries?

- [ ] **A. Script manuel** (JSON statique, 2h de travail)
- [ ] **B. Scraping réel** (plus long mais données réelles)
- [ ] **C. Mix** (50 produits manuels + scraping pour le reste)

**Ma recommandation:** Option A pour MVP, puis migration progressive vers B

---

## Actions Immédiates (Aujourd'hui)

### Étape 1: Choisir votre stack
Répondez aux 3 questions ci-dessus, puis je génère:
1. Scripts de configuration
2. Commandes à exécuter
3. Fichiers à modifier
4. Ordre exact des étapes

### Étape 2: Je vous guide étape par étape
Une fois la stack choisie, je peux:
- Générer les fichiers de config Firebase/Supabase
- Créer les scripts de migration
- Modifier le code existant
- Tester avec vous

### Étape 3: On attaque Phase 1
Objectif: En 7 jours, avoir un MVP avec:
- ✅ Auth réelle (Firebase)
- ✅ DB cloud (Firebase/Supabase)
- ✅ Sync temps réel (pas de polling)
- ✅ 500 produits × 5 épiceries

---

## Prêt à commencer?

**Répondez aux 3 questions ci-dessus et je génère tout le code nécessaire !**

Ou si vous voulez que je décide pour vous:
```
Stack recommandée:
- Auth: Firebase
- Database: Cloud Firestore (Firebase)
- Notifications: Firebase Cloud Messaging
- Hosting: Firebase Hosting (frontend) + Cloud Functions (backend)
- Mobile: Capacitor.js

Ordre des phases: 1 → 4 → 2 → 3 → 5
Données de test: Script manuel (500 produits JSON)
```

**Voulez-vous que je commence avec cette stack recommandée ?**
