# Décisions Techniques - Panier Intelligent

**Date:** 2025-12-29
**Contexte:** Application web/mobile collaborative pour optimisation d'épicerie au Québec

---

## 1. Frontend: React + Capacitor.js ✅ (Décision finale)

### Pourquoi React au lieu de React Native?

**Avantages:**
- ✅ **Code existant déjà en React** (ne pas tout refaire)
- ✅ **Capacitor.js** convertit React → iOS/Android natif
- ✅ **1 seule codebase** pour web + iOS + Android
- ✅ **Plugins natifs** (camera, geolocation, push) disponibles
- ✅ **Plus simple** pour solo dev avec Copilot

**vs React Native:**
- ❌ Nécessiterait réécrire tout le code
- ❌ Syntaxe différente (pas de `<div>`, utiliser `<View>`)
- ❌ Ecosystème plus complexe (Expo vs bare React Native)

**Conclusion:** Garder React + ajouter Capacitor.js

---

## 2. Backend: Firebase vs Supabase vs Express

### Comparaison

| Critère | Firebase | Supabase | Express (existant) |
|---------|----------|----------|-------------------|
| **Base de données** | Firestore (NoSQL) | PostgreSQL (SQL) | Aucune (local IndexedDB) |
| **Temps réel** | ✅ Natif (onSnapshot) | ✅ Realtime subscriptions | ❌ Polling manuel |
| **Auth** | ✅ Excellent | ⚠️ Basique | ❌ À implémenter |
| **Notifications** | ✅ FCM intégré | ❌ Externe (FCM séparé) | ❌ Externe |
| **Hosting** | ✅ Inclus | ✅ Inclus | ⚠️ Vercel (séparé) |
| **Functions** | ✅ Cloud Functions | ✅ Edge Functions | ✅ Déjà Express |
| **Free tier** | ✅ 50k reads/day | ✅ 500 MB DB | ✅ Vercel gratuit |
| **Conformité Loi 25** | ⚠️ Région US (mais ok) | ✅ Région Canada | ✅ Vercel Canada |
| **SQL complexe** | ❌ NoSQL seulement | ✅ PostgreSQL | ✅ Peut ajouter PG |
| **Courbe apprentissage** | ⭐⭐ Moyenne | ⭐⭐⭐ Haute | ⭐ Facile (déjà fait) |
| **Coût à l'échelle** | ⚠️ Peut devenir cher | ✅ Prévisible | ✅ Prévisible |

### Décision recommandée: **Firebase Ecosystem Complet**

**Justification:**
1. **Déjà partiellement intégré** (AuthContext.jsx avec mock Firebase)
2. **Tout-en-un** : Auth + DB + Storage + Functions + Hosting + FCM
3. **Temps réel natif** : Pas besoin de coder le polling
4. **Solo-friendly** : Configuration simple, bien documenté
5. **Free tier généreux** : Largement suffisant pour MVP + premiers 1000 users

**Compromis acceptés:**
- ❌ NoSQL au lieu de SQL (mais suffisant pour notre use case)
- ⚠️ Vendor lock-in (mais migration possible via Firestore export)
- ⚠️ Hébergement US (mais données canadiennes via Firebase région northamerica-northeast1)

**Alternative si besoin SQL avancé:**
- Utiliser Firebase pour Auth + Notifications
- Supabase PostgreSQL pour données
- Mais plus complexe (2 services à gérer)

---

## 3. Base de Données: Structure Firestore

### Collections principales

```javascript
// Collection: users
{
  userId: "abc123",
  email: "user@example.com",
  displayName: "John Doe",
  tier: "free", // ou "premium"
  location: {
    lat: 46.8139,
    lon: -71.2080,
    city: "Québec"
  },
  preferences: {
    maxStores: 3,
    maxRadiusKm: 10,
    favoriteStores: ["IGA", "Metro"]
  },
  createdAt: Timestamp
}

// Collection: products (catalogue universel, géré par admin)
{
  productId: "prod_001",
  nom_produit: "Lait 2%",
  marque: "Natrel",
  categorie: "Produits laitiers",
  sous_categorie: "Lait",
  volume: 2,
  unite: "L",
  code_barre: "068200000000",
  image_url: "https://...",
  tags: ["sans lactose"],
  nameKey: "lait-2-natrel-2l", // pour matching
  createdAt: Timestamp
}

// Collection: storePrices (prix par magasin)
{
  storePriceId: "sp_001",
  product_id: "prod_001",
  store_id: "store_iga_001",
  store_product_name: "Lait Natrel 2% 2L",
  prix_regulier: 5.99,
  prix_promo: 4.99,
  promo_actif: true,
  promo_debut: Timestamp,
  promo_fin: Timestamp,
  disponible: true,
  last_updated: Timestamp
}

// Collection: stores (catalogues des magasins)
{
  storeId: "store_iga_001",
  chaine: "IGA",
  nom: "IGA Extra Dupont",
  adresse: "123 rue Dupont",
  ville: "Québec",
  code_postal: "G1R 1A1",
  latitude: 46.8139,
  longitude: -71.2080,
  heures_ouverture: {
    lundi: "8h-21h",
    // ...
  },
  isPartner: false,
  commissionRate: 0.0
}

// Collection: sharedLists (listes collaboratives)
{
  listId: "list_001",
  ownerId: "abc123",
  title: "Liste de la semaine",
  shareCode: "XyZ789",
  products: [
    {
      id: "prod_001",
      nom: "Lait 2%",
      marque: "Natrel",
      quantite: 2,
      magasin: "IGA", // assigné après optimisation
      prix: 4.99,
      locked: false // si verrouillé manuellement
    }
  ],
  combinaisonChoisie: {
    stores: ["IGA", "Metro"],
    total: 87.50,
    savings: 12.30,
    totalDistanceKm: 5.2
  },
  members: {
    "abc123": "admin",
    "def456": "editor",
    "ghi789": "viewer"
  },
  isActive: true,
  createdAt: Timestamp,
  updatedAt: Timestamp
}

// Collection: courseAssignments (assignations des courses)
{
  assignmentId: "assign_001",
  listId: "list_001",
  userId: "abc123",
  storeCode: "IGA",
  productIds: ["prod_001", "prod_002"],
  status: "pending", // ou "in_progress", "completed"
  completedAt: Timestamp
}

// Collection: priceAlerts (alertes de prix)
{
  alertId: "alert_001",
  userId: "abc123",
  productId: "prod_001",
  targetPrice: 3.99,
  isActive: true,
  lastNotified: Timestamp,
  createdAt: Timestamp
}

// Collection: priceHistory (historique des prix)
{
  historyId: "hist_001",
  productId: "prod_001",
  storeCode: "IGA",
  price: 4.99,
  recordedAt: Timestamp
}

// Collection: notifications (notifications utilisateur)
{
  notificationId: "notif_001",
  userId: "abc123",
  type: "price_drop", // ou "assignment", "invite"
  title: "Prix en baisse !",
  body: "Lait Natrel 2L: 5.99$ → 3.99$ chez IGA",
  data: {
    productId: "prod_001",
    oldPrice: 5.99,
    newPrice: 3.99,
    store: "IGA"
  },
  read: false,
  createdAt: Timestamp
}
```

### Indexes Firestore nécessaires

```javascript
// products
- nameKey (ASC)
- categorie (ASC)

// storePrices
- product_id (ASC)
- store_id (ASC)
- last_updated (DESC)

// sharedLists
- ownerId (ASC)
- shareCode (ASC)
- updatedAt (DESC)

// priceHistory
- productId + recordedAt (ASC, DESC)
```

---

## 4. Authentification: Firebase Auth

### Providers activés
1. **Email/Password** (pour tous)
2. **Google Sign-In** (plus rapide)

### Flow d'authentification
```
1. User clique "Se connecter avec Google"
2. Firebase Auth popup
3. User accepte permissions
4. Firebase retourne { user, token }
5. Frontend stocke userId dans Zustand
6. Backend vérifie token via Firebase Admin SDK
7. Création automatique du document /users/{userId} si nouveau
```

### Sécurité
- Tokens JWT signés par Firebase (non falsifiables)
- Expiration: 1 heure (refresh automatique)
- Rules Firestore basées sur `request.auth.uid`

**Exemple Firestore Rules:**
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Users can only read/write their own document
    match /users/{userId} {
      allow read, write: if request.auth.uid == userId;
    }

    // Shared lists: owner + members can read
    match /sharedLists/{listId} {
      allow read: if request.auth.uid in resource.data.members.keys();
      allow write: if request.auth.uid == resource.data.ownerId
                   || (request.auth.uid in resource.data.members.keys()
                       && resource.data.members[request.auth.uid] in ['admin', 'editor']);
    }

    // Products & prices: public read, admin write
    match /products/{productId} {
      allow read: if true;
      allow write: if get(/databases/$(database)/documents/users/$(request.auth.uid)).data.tier == 'admin';
    }

    match /storePrices/{priceId} {
      allow read: if true;
      allow write: if false; // Only via Cloud Functions
    }
  }
}
```

---

## 5. Optimisation: Algorithme Multi-Critères

### Fonction objectif (déjà implémentée)

```javascript
Score = 0.3 × (Prix total normalisé)
      + 0.3 × (Distance totale normalisée)
      + 0.7 × (Nombre de magasins normalisé)
      - 0.1 × (Nombre de favoris)
      + 0.2 × (1 - Couverture)
```

**Objectif:** Minimiser le score

### Contraintes
1. **Nombre max de magasins** (défini par utilisateur: 1-5)
2. **Distance max** (rayon géographique: 5-50 km)
3. **Épiceries favorites** (bonus si présentes dans combo)
4. **Produits verrouillés** (ne pas déplacer)

### Algorithme (existant dans `src/services/optimisation.js`)
1. Générer toutes les combinaisons possibles de K magasins (K=1 à maxStores)
2. Pour chaque combinaison:
   - Assigner chaque produit au magasin le moins cher dans la combo
   - Calculer total, distance, couverture
   - Calculer score composite
3. Trier par score (ASC)
4. Retourner top 3

**Optimisations possibles (futures):**
- Caching des combinaisons fréquentes
- Pruning des combos peu prometteuses (heuristique)
- Parallélisation (Web Workers)

---

## 6. Notifications: Firebase Cloud Messaging (FCM)

### Types de notifications

1. **Prix en baisse (>10%)**
   - Déclencheur: Cron job quotidien (6h AM)
   - Payload: `{ type: 'price_drop', productId, oldPrice, newPrice, store }`

2. **Assignation de courses**
   - Déclencheur: Admin assigne courses
   - Payload: `{ type: 'assignment', listId, storeCode, productIds }`

3. **Invitation à un groupe**
   - Déclencheur: Owner invite membre
   - Payload: `{ type: 'invite', listId, inviterName }`

### Architecture FCM

```
Backend (Cloud Function) → FCM Server → Device (in-app notification)
```

**Code backend (Cloud Function):**
```javascript
// functions/src/sendNotification.js
import admin from 'firebase-admin';

export async function sendPriceDropNotification(userId, productData) {
  const messaging = admin.messaging();

  // Récupérer FCM token de l'utilisateur
  const userDoc = await admin.firestore().doc(`users/${userId}`).get();
  const fcmToken = userDoc.data().fcmToken;

  if (!fcmToken) return;

  const message = {
    token: fcmToken,
    notification: {
      title: '🎉 Prix en baisse !',
      body: `${productData.nom}: ${productData.oldPrice}$ → ${productData.newPrice}$ chez ${productData.store}`
    },
    data: {
      type: 'price_drop',
      productId: productData.productId,
      click_action: '/analyse'
    }
  };

  await messaging.send(message);

  // Enregistrer dans collection notifications
  await admin.firestore().collection('notifications').add({
    userId,
    type: 'price_drop',
    title: message.notification.title,
    body: message.notification.body,
    data: message.data,
    read: false,
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  });
}
```

**Code frontend (enregistrement FCM token):**
```javascript
// src/services/notifications.js
import { getMessaging, getToken, onMessage } from 'firebase/messaging';

export async function registerFCMToken(userId) {
  const messaging = getMessaging();

  // Demander permission
  const permission = await Notification.requestPermission();
  if (permission !== 'granted') return null;

  // Récupérer token
  const token = await getToken(messaging, {
    vapidKey: 'YOUR_VAPID_KEY'
  });

  // Sauvegarder dans Firestore
  await updateDoc(doc(db, 'users', userId), {
    fcmToken: token
  });

  return token;
}

// Écouter notifications quand app est ouverte
export function listenToNotifications(callback) {
  const messaging = getMessaging();
  onMessage(messaging, (payload) => {
    callback(payload);
  });
}
```

### Limitation iOS
⚠️ **FCM sur iOS nécessite Apple Developer Program (120 USD/an)**
- Alternative gratuite pour MVP: **Notifications in-app seulement** (pas de push native)
- Afficher badge rouge sur icône 🔔 quand nouvelle notification

---

## 7. Mobile: Capacitor.js

### Plugins nécessaires

```json
{
  "@capacitor/core": "^5.0.0",
  "@capacitor/cli": "^5.0.0",
  "@capacitor/camera": "^5.0.0",      // Scan code-barres
  "@capacitor/geolocation": "^5.0.0", // Localisation user
  "@capacitor/push-notifications": "^5.0.0" // FCM
}
```

### Configuration

**capacitor.config.ts:**
```typescript
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.panierintelligent',
  appName: 'Panier Intelligent',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  },
  plugins: {
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert']
    }
  }
};

export default config;
```

### Build iOS
```bash
npm run build
npx cap sync ios
npx cap open ios
# Dans Xcode: Product > Archive > Distribute App
```

### Build Android
```bash
npm run build
npx cap sync android
npx cap open android
# Dans Android Studio: Build > Generate Signed Bundle/APK
```

---

## 8. Freemium: Stripe Checkout

### Produits Stripe

**Mode Test:**
```javascript
// Free tier (default)
{
  tier: "free",
  limits: {
    maxProducts: 20,
    maxGroups: 1,
    maxStores: 1,
    priceHistory: 30 // days
  }
}

// Premium tier
{
  tier: "premium",
  price: 4.99, // CAD/month
  priceId: "price_xxx", // Stripe price ID
  limits: {
    maxProducts: 999,
    maxGroups: 999,
    maxStores: 5,
    priceHistory: 365 // days
  }
}
```

### Flow de paiement

```
1. User clique "Passer à Premium" (/premium)
2. Frontend appelle /api/create-checkout-session
3. Backend crée Stripe Checkout Session
4. Redirect vers Stripe Checkout
5. User paie avec carte
6. Stripe webhook → /api/stripe-webhook
7. Backend met à jour user.tier = "premium"
8. Redirect vers /success
```

**Code backend (Cloud Function):**
```javascript
import Stripe from 'stripe';
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function createCheckoutSession(req, res) {
  const { userId } = req.body;

  const session = await stripe.checkout.sessions.create({
    customer_email: req.user.email,
    line_items: [{
      price: 'price_xxx', // Premium monthly
      quantity: 1
    }],
    mode: 'subscription',
    success_url: 'https://panierintelligent.app/success',
    cancel_url: 'https://panierintelligent.app/premium',
    metadata: { userId }
  });

  res.json({ url: session.url });
}

export async function handleStripeWebhook(req, res) {
  const sig = req.headers['stripe-signature'];
  const event = stripe.webhooks.constructEvent(
    req.body,
    sig,
    process.env.STRIPE_WEBHOOK_SECRET
  );

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const userId = session.metadata.userId;

    await admin.firestore().doc(`users/${userId}`).update({
      tier: 'premium',
      stripeCustomerId: session.customer,
      subscriptionId: session.subscription
    });
  }

  res.json({ received: true });
}
```

---

## 9. Conformité Loi 25 (Québec)

### Checklist

- [x] **Hébergement Canada:** Firebase région `northamerica-northeast1` (Montreal)
- [ ] **Politique de confidentialité:** Page `/legal/privacy`
- [ ] **Consentement explicite:** Modal au 1er lancement
- [ ] **Droit à l'oubli:** Bouton "Supprimer compte" dans `/parametres`
- [ ] **Sécurité:** HTTPS, tokens JWT, chiffrement

### Contenu politique de confidentialité

**Sections obligatoires:**
1. **Données collectées:** Email, nom, localisation, listes d'épicerie
2. **Finalité:** Optimisation trajets, notifications prix, sync collaborative
3. **Durée conservation:** 2 ans après dernière activité
4. **Partage avec tiers:** Aucun (sauf Firebase/Google pour hébergement)
5. **Droits utilisateur:** Accès, rectification, suppression, portabilité
6. **Contact:** support@panierintelligent.app

### Modal consentement (1er lancement)

```jsx
<div className="modal">
  <h2>Bienvenue sur Panier Intelligent</h2>
  <p>
    Pour fonctionner, nous collectons :
    - Votre email (authentification)
    - Votre localisation (optimisation trajets)
    - Vos listes d'épicerie (fonctionnalité principale)
  </p>
  <p>
    Vos données sont hébergées au Canada et protégées selon la Loi 25 du Québec.
  </p>
  <button onClick={acceptConsent}>J'accepte</button>
  <button onClick={refuseConsent}>Je refuse</button>
</div>
```

Si refus → Mode limité (local seulement, pas de sync cloud)

---

## 10. Données de Test: Génération Mock

### Script de génération

**scripts/generate-mock-data.js:**
```javascript
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc } from 'firebase/firestore';

const firebaseConfig = { /* ... */ };
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const categories = [
  'Fruits & Légumes',
  'Produits laitiers',
  'Viandes & Poissons',
  'Boulangerie',
  'Épicerie sèche',
  'Boissons',
  'Collations'
];

const stores = [
  { code: 'IGA', multiplier: 1.0 },
  { code: 'Metro', multiplier: 1.05 },
  { code: 'Maxi', multiplier: 0.92 },
  { code: 'SuperC', multiplier: 0.88 },
  { code: 'Costco', multiplier: 0.85 }
];

const baseProducts = [
  { nom: 'Lait 2%', marque: 'Natrel', volume: 2, unite: 'L', basePrice: 4.49, categorie: 'Produits laitiers' },
  { nom: 'Bananes', marque: 'Chiquita', volume: 1, unite: 'lb', basePrice: 0.79, categorie: 'Fruits & Légumes' },
  // ... 498 autres produits
];

async function seedDatabase() {
  console.log('Seeding database...');

  // 1. Créer les produits
  for (const prod of baseProducts) {
    const docRef = await addDoc(collection(db, 'products'), {
      nom_produit: prod.nom,
      marque: prod.marque,
      volume: prod.volume,
      unite: prod.unite,
      categorie: prod.categorie,
      nameKey: `${prod.nom}-${prod.marque}-${prod.volume}${prod.unite}`.toLowerCase().replace(/\s+/g, '-'),
      createdAt: new Date()
    });

    // 2. Créer les prix pour chaque magasin
    for (const store of stores) {
      const randomVariation = 0.95 + Math.random() * 0.10;
      const finalPrice = Math.round(prod.basePrice * store.multiplier * randomVariation * 100) / 100;

      await addDoc(collection(db, 'storePrices'), {
        product_id: docRef.id,
        store_id: store.code,
        prix_regulier: finalPrice,
        prix_promo: null,
        promo_actif: false,
        disponible: true,
        last_updated: new Date()
      });
    }
  }

  console.log('✅ Database seeded with', baseProducts.length, 'products ×', stores.length, 'stores');
}

seedDatabase();
```

**Exécution:**
```bash
node scripts/generate-mock-data.js
```

---

## Résumé des Décisions

| Composant | Choix final | Justification |
|-----------|-------------|---------------|
| **Frontend** | React 18 + Vite | Déjà existant, performant |
| **Mobile** | Capacitor.js | Réutilise code React, simple |
| **Backend** | Firebase Ecosystem | Tout-en-un, solo-friendly |
| **Database** | Cloud Firestore | Temps réel natif, gratuit |
| **Auth** | Firebase Auth | Meilleur du marché |
| **Notifications** | FCM | Gratuit, bien intégré |
| **Paiements** | Stripe | Standard industrie |
| **Hosting** | Firebase Hosting | Inclus, performant |
| **Loi 25** | Région Canada | Firebase Montreal |

**Coût total (free tier):** 0 CAD/mois pour MVP + 1000 premiers users

---

**Prêt à implémenter ? Dites-moi quelle phase attaquer en premier !**
