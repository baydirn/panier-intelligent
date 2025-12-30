# Architecture Complète - Panier Intelligent

**Version:** 1.0
**Date:** 2025-12-29
**Marché cible:** Québec (Canada)
**Utilisateurs:** Familles, étudiants, personnes soucieuses du budget

---

## Table des matières

1. [Vision et Objectifs](#vision-et-objectifs)
2. [Architecture Système](#architecture-système)
3. [Modèle de Données](#modèle-de-données)
4. [Règles d'Affaires](#règles-daffaires)
5. [Stack Technique](#stack-technique)
6. [Fonctionnalités v1](#fonctionnalités-v1)
7. [Freemium & Monétisation](#freemium--monétisation)
8. [Conformité Loi 25](#conformité-loi-25)
9. [Roadmap de Développement](#roadmap-de-développement)

---

## Vision et Objectifs

### Problème résolu
Les consommateurs québécois perdent du temps et de l'argent en ne sachant pas où acheter leurs produits d'épicerie au meilleur prix. Les familles doivent coordonner leurs courses sans outils collaboratifs.

### Solution
**Panier Intelligent** est une application web/mobile qui :
- Permet de créer et partager des listes d'épicerie collaboratives
- Analyse automatiquement les listes pour trouver la combinaison optimale d'épiceries
- Minimise les coûts en tenant compte des préférences utilisateur (distance, nombre de magasins)
- Assigne les courses aux membres du groupe
- Notifie des changements de prix importants (>10%)

### Proposition de valeur
> "Économisez jusqu'à 30% sur votre épicerie en trouvant automatiquement la meilleure combinaison de magasins, sans effort."

---

## Architecture Système

### Vue d'ensemble

```
┌─────────────────────────────────────────────────────────────┐
│                    UTILISATEURS                              │
│  (Web: Vite + React / Mobile: Capacitor.js)                 │
└────────────────┬────────────────────────────────────────────┘
                 │
                 │ HTTPS
                 │
┌────────────────▼────────────────────────────────────────────┐
│              FRONTEND (React 18 + Vite)                      │
│  • Pages: Liste, Analyse, Magasin, Paramètres, SharedList   │
│  • State: Zustand (global), IndexedDB (offline)              │
│  • UI: Tailwind CSS, Framer Motion, Lucide Icons            │
└────────────────┬────────────────────────────────────────────┘
                 │
                 │ API REST / WebSocket (temps réel)
                 │
┌────────────────▼────────────────────────────────────────────┐
│            BACKEND (Express.js + Node)                       │
│  • Auth: Firebase Authentication                            │
│  • API: /api/prices, /api/share-list, /api/admin/*          │
│  • Scraping: Puppeteer (IGA, Metro, Maxi, etc.)             │
│  • Notifications: Firebase Cloud Messaging                  │
└────────────────┬────────────────────────────────────────────┘
                 │
                 │ SQL Queries
                 │
┌────────────────▼────────────────────────────────────────────┐
│         BASE DE DONNÉES (PostgreSQL + Supabase)              │
│  • Tables: User, SharedList, Product, StoreProduct, etc.    │
│  • Hosting: Région Canada (Loi 25)                          │
│  • Realtime: Supabase Realtime pour sync collaborative      │
└─────────────────────────────────────────────────────────────┘
```

### Flux de données

#### 1. Création de liste
```
Utilisateur → Frontend (Liste.jsx) → Zustand → IndexedDB (local) → Backend (sync optionnelle)
```

#### 2. Optimisation
```
Utilisateur clique "Analyser" → Frontend appelle /api/optimize →
Backend exécute algorithme → Retourne top 3 combinaisons →
Frontend affiche (Analyse.jsx)
```

#### 3. Partage collaboratif
```
User A crée liste → Backend génère shareCode → User A envoie lien →
User B ouvre /shared/:code → Backend vérifie permissions →
User B modifie → Backend sync via Supabase Realtime →
User A reçoit update en temps réel
```

#### 4. Notification prix
```
Cron job (1x/jour) → Backend vérifie prix → Si baisse >10% →
Firebase Cloud Messaging → Push notification in-app
```

---

## Modèle de Données

### Schéma PostgreSQL (Prisma)

```prisma
// ===== USERS =====
model User {
  id          String   @id @default(cuid())
  email       String   @unique
  displayName String?
  tier        String   @default("free") // 'free' | 'premium'
  location    Json?    // { lat, lon, city }
  preferences Json?    // { maxStores, maxRadiusKm, favoriteStores[] }
  createdAt   DateTime @default(now())

  sharedLists SharedList[]  @relation("OwnerLists")
  memberships SharedListMember[]
  priceAlerts PriceAlert[]
}

// ===== PRODUITS =====
model Product {
  id              String   @id @default(cuid())
  nom_produit     String
  marque          String?
  categorie       String
  sous_categorie  String?
  volume          Float?
  unite           String?   // "L", "kg", "un", etc.
  code_barre      String?  @unique
  image_url       String?
  tags            String[] // ["bio", "sans lactose", etc.]
  nameKey         String   // normalized name for matching
  createdAt       DateTime @default(now())

  storePrices     StoreProduct[]

  @@index([nameKey])
  @@index([categorie])
}

// ===== PRIX PAR MAGASIN =====
model StoreProduct {
  id                String   @id @default(cuid())
  product_id        String
  store_id          String
  store_product_name String  // nom exact dans le magasin
  prix_regulier     Decimal  @db.Decimal(10,2)
  prix_promo        Decimal? @db.Decimal(10,2)
  promo_actif       Boolean  @default(false)
  promo_debut       DateTime?
  promo_fin         DateTime?
  disponible        Boolean  @default(true)
  last_updated      DateTime @updatedAt

  product Product @relation(fields: [product_id], references: [id])
  store   Store   @relation(fields: [store_id], references: [id])

  @@index([product_id])
  @@index([store_id])
  @@unique([product_id, store_id])
}

// ===== MAGASINS =====
model Store {
  id              String   @id @default(cuid())
  chaine          String   // "IGA", "Metro", etc.
  nom             String   // "IGA Extra Dupont"
  adresse         String
  ville           String
  code_postal     String
  latitude        Float
  longitude       Float
  heures_ouverture Json?   // { lundi: "8h-21h", ... }
  isPartner       Boolean  @default(false) // partenariat actif?
  commissionRate  Float    @default(0.0)

  storePrices StoreProduct[]

  @@index([chaine])
  @@index([ville])
  @@index([code_postal])
}

// ===== LISTES PARTAGÉES =====
model SharedList {
  id            String   @id @default(cuid())
  ownerId       String
  title         String
  shareCode     String   @unique
  data          Json     // { products: [...], combinaisonChoisie: {...} }
  isActive      Boolean  @default(true)
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  owner         User     @relation("OwnerLists", fields: [ownerId], references: [id])
  members       SharedListMember[]
  assignments   CourseAssignment[]

  @@index([ownerId])
  @@index([shareCode])
}

model SharedListMember {
  id        String   @id @default(cuid())
  listId    String
  userId    String
  role      String   // 'viewer' | 'editor' | 'admin'
  createdAt DateTime @default(now())

  list      SharedList @relation(fields: [listId], references: [id])
  user      User       @relation(fields: [userId], references: [id])

  @@unique([listId, userId])
}

// ===== ASSIGNATION DES COURSES =====
model CourseAssignment {
  id         String   @id @default(cuid())
  listId     String
  userId     String
  storeCode  String   // "IGA", "Metro", etc.
  productIds String[] // Array of product IDs assigned to this user
  status     String   @default("pending") // 'pending' | 'in_progress' | 'completed'
  completedAt DateTime?

  list       SharedList @relation(fields: [listId], references: [id])

  @@index([listId])
  @@index([userId])
}

// ===== ALERTES PRIX =====
model PriceAlert {
  id           String   @id @default(cuid())
  userId       String
  productId    String
  targetPrice  Decimal  @db.Decimal(10,2)
  isActive     Boolean  @default(true)
  lastNotified DateTime?
  createdAt    DateTime @default(now())

  user         User     @relation(fields: [userId], references: [id])

  @@index([userId])
  @@index([productId])
}

// ===== HISTORIQUE DES PRIX =====
model PriceHistory {
  id         Int      @id @default(autoincrement())
  productId  String
  storeCode  String
  price      Decimal  @db.Decimal(10,2)
  currency   String   @default("CAD")
  recordedAt DateTime @default(now())

  @@index([productId])
  @@index([storeCode])
  @@index([recordedAt])
}
```

### Données de test (500 produits × 5 épiceries)

**Épiceries cibles:**
1. **IGA** (prix de référence)
2. **Metro** (+5% vs IGA)
3. **Maxi** (-8% vs IGA, rabais)
4. **Super C** (-12% vs IGA, plus bas prix)
5. **Costco** (-15% vs IGA, entrepôt)

**Catégories de produits:**
- Fruits & Légumes (100 produits)
- Produits laitiers & Œufs (80 produits)
- Viandes & Poissons (60 produits)
- Boulangerie (40 produits)
- Épicerie sèche (120 produits)
- Boissons (50 produits)
- Collations & Desserts (50 produits)

---

## Règles d'Affaires

### 1. Gestion des groupes

#### Permissions
| Rôle | Créer liste | Inviter membres | Modifier liste | Choisir combinaison | Assigner courses |
|------|------------|-----------------|----------------|---------------------|------------------|
| **Créateur (Admin)** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Éditeur** | ❌ | ❌ | ✅ | ❌ | ❌ |
| **Lecteur** | ❌ | ❌ | ❌ | ❌ | ❌ |

#### Multi-groupes
- Un utilisateur peut appartenir à plusieurs groupes (famille, colocation, etc.)
- Seul le créateur peut inviter de nouveaux membres
- Un utilisateur peut quitter un groupe à tout moment

#### Gestion des conflits
- **Détection de doublons:** Lors de l'ajout d'un produit, vérifier si un produit similaire (nameKey identique) existe déjà
- **Si doublon détecté:**
  - Option 1: Incrémenter la quantité du produit existant
  - Option 2: Afficher modal "Produit similaire détecté, voulez-vous fusionner?"
- **Sync en temps réel:** Utiliser Supabase Realtime pour éviter les conflits de version

### 2. Optimisation du panier

#### Fonction objectif
```javascript
Score = 0.3 × (Prix total normalisé)
      + 0.3 × (Distance totale normalisée)
      + 0.7 × (Nombre de magasins normalisé)
      - 0.1 × (Nombre de favoris)
      + 0.2 × (1 - Couverture)
```

**Objectif:** Minimiser le score

#### Contraintes
- Nombre max de magasins: défini par utilisateur (1-5)
- Distance max: définie par utilisateur (5-50 km)
- Épiceries favorites: bonus de -0.1 par favori dans la combinaison
- Produits verrouillés: ne jamais déplacer un produit verrouillé manuellement

#### Cas particuliers
- **Produit indisponible:** Reste dans le panier sans assignation, affiche ⚠️ badge
- **Substitution possible:** Affiche modal "Substitut disponible : [nom] à [prix] chez [magasin]. Accepter?"

### 3. Assignation des courses

#### Workflow
1. **Admin choisit une combinaison optimale** (ex: IGA + Metro)
2. **Admin assigne manuellement:**
   - User A → IGA (15 produits)
   - User B → Metro (8 produits)
3. **Notifications envoyées** via Firebase Cloud Messaging (in-app)
4. **Chaque membre reçoit:**
   - Nom du magasin
   - Liste des produits assignés
   - Adresse du magasin
   - Bouton "Démarrer les courses" → mode checklist

#### Validation (cocher produits achetés)
- Chaque membre coche les produits au fur et à mesure
- Barre de progression visible pour tous les membres
- Notification quand un membre termine ses courses

### 4. Notifications prix

#### Seuil de déclenchement
- **Baisse de prix > 10%** sur un produit dans le panier
- **Max 1 notification/jour** pour l'ensemble des produits du panier en cours

#### Contenu de la notification
```
🎉 Prix en baisse !
Lait Natrel 2L: 4.99$ → 3.99$ (-20%) chez IGA
+ 2 autres produits en promotion
```

#### Fréquence de vérification
- Cron job backend: 1x/jour à 6h AM (avant les courses du matin)
- Comparaison avec historique des prix (PriceHistory table)

### 5. Données de test & scraping

#### Phase MVP (données mock)
- Générer manuellement 500 produits × 5 épiceries = 2500 entrées
- Script: `npm run generate:mock-data`
- Format: JSON statique servi par API `/api/prices`

#### Phase production (scraping)
- Web scraping hebdomadaire (circulaires en ligne)
- Sources cibles:
  - IGA.net (API GraphQL existante)
  - Metro.ca (scraping HTML)
  - Maxi.ca (Loblaws API)
  - SuperC.ca (scraping HTML)
  - Costco.ca (scraping HTML, membres seulement)

#### Partenariats futurs
- Négocier accès API officielle avec épiceries
- En échange: commission de 1-3% sur achats dirigés
- Ou: visibilité promotionnelle dans l'app

---

## Stack Technique

### Frontend

**Framework:** React 18 + Vite 7
**State Management:** Zustand (global) + IndexedDB (offline-first)
**Routing:** React Router v6
**UI:**
- Tailwind CSS (styling)
- Framer Motion (animations)
- Lucide React (icons)
- Chart.js + react-chartjs-2 (graphiques historique prix)

**Mobile:** Capacitor.js (convertir React en app iOS/Android native)
- Avantage: Réutiliser 100% du code React existant
- Plugins: Camera (scan code-barres), Geolocation, Push Notifications

### Backend

**Framework:** Express.js (Node 18+)
**Auth:** Firebase Authentication (Google, Email/Password)
**Database:** PostgreSQL (Supabase, région Canada)
**ORM:** Prisma
**Scraping:** Puppeteer (headless browser)
**Notifications:** Firebase Cloud Messaging
**Hosting:** Vercel (frontend + backend gratuit jusqu'à 100k requêtes/mois)

### Base de données

**Production:** Supabase PostgreSQL (région Montreal, Loi 25 compliant)
**Avantages:**
- Realtime subscriptions (sync collaborative)
- Auth intégrée
- Storage pour images
- Gratuit jusqu'à 500 MB DB + 2 GB bandwidth/mois

**Offline:** IndexedDB (via localforage) pour mode hors-ligne

### Notifications

**Firebase Cloud Messaging (FCM)**
- Gratuit, illimité
- Support web + iOS + Android
- Permet notifications in-app seulement (pas de push mobile en version gratuite iOS)

### Conformité Loi 25 (Québec)

1. **Hébergement au Canada:** Supabase région Montreal
2. **Politique de confidentialité:** Page `/legal/privacy` détaillant:
   - Données collectées (email, localisation, listes)
   - Utilisation (optimisation, notifications)
   - Durée de conservation (2 ans après inactivité)
3. **Consentement explicite:**
   - Modal au 1er lancement: "Accepter les conditions"
   - Option "Refuser" → version limitée (sans partage/cloud)
4. **Droit à l'oubli:**
   - Page `/parametres` → Bouton "Supprimer mon compte"
   - Suppression complète de toutes les données sous 30 jours
5. **Sécurité:**
   - HTTPS obligatoire
   - Tokens JWT pour auth API
   - Chiffrement des données sensibles (à venir: carte de crédit pour premium)

---

## Fonctionnalités v1

### Essentielles (MVP)

#### 1. Authentification
- [x] Mock Firebase Auth (AuthContext.jsx)
- [ ] Vraie Firebase Auth (Google + Email/Password)
- [ ] Profil utilisateur (nom, email, photo)
- [ ] Déconnexion

#### 2. Gestion de liste
- [x] Ajouter produit (nom, quantité, marque, volume)
- [x] Modifier produit
- [x] Supprimer produit
- [ ] Scan code-barres (Capacitor Camera plugin)
- [x] Filtres (catégorie, magasin, acheté/non acheté)
- [x] Listes récurrentes (produits favoris)

#### 3. Partage collaboratif
- [x] Créer liste partagée (ShareModal.jsx)
- [x] Inviter membres (shareCode)
- [x] Sync temps réel (polling 5s, à remplacer par Supabase Realtime)
- [ ] Permissions (admin, editor, viewer)
- [ ] Détection doublons
- [x] Multi-groupes (1 user = N listes)

#### 4. Optimisation
- [x] Algorithme multi-critères (prix + distance + nb magasins)
- [x] Top 3 combinaisons (Analyse.jsx)
- [x] Cartes résumées (total, nb magasins, couverture)
- [ ] Badges savings/distances sur cartes
- [ ] Verrouillage produit dans un magasin
- [ ] Gestion substituts (modal confirmation)

#### 5. Assignation des courses
- [ ] Admin assigne magasins aux membres
- [ ] Notifications in-app
- [ ] Mode checklist (cocher produits achetés)
- [ ] Barre de progression globale

#### 6. Notifications prix
- [ ] Cron job quotidien (vérification prix)
- [ ] Firebase Cloud Messaging (in-app)
- [ ] Historique des prix (PriceHistoryChart.jsx existe)
- [ ] Seuil configurable par utilisateur (10% par défaut)

### Souhaitables (Post-v1)

- Suggestions de recettes basées sur produits du panier
- Gamification (badges, points fidélité)
- Export PDF de la liste
- Mode sombre
- Multi-langue (FR/EN)

---

## Freemium & Monétisation

### Version Gratuite (Tier: free)

**Limites:**
- Max **20 produits** par panier
- Max **1 groupe** de partage
- Historique prix: **30 derniers jours**
- Optimisation: **1 magasin max** (pas de combinaisons)
- **Aucune alerte prix**
- Publicités (bannières discrètes)

**Revenu:**
- Publicités (AdSense): ~0.50$ CPM
- Commissions épiceries (1-3% sur achats dirigés)

### Version Premium (Tier: premium)

**Prix:** 4.99 CAD/mois ou 49.99 CAD/an (-17%)

**Avantages:**
- **Produits illimités**
- **Groupes illimités**
- Historique prix: **1 an**
- Optimisation: **jusqu'à 5 magasins**
- **Alertes prix en temps réel** (>10%)
- **Sans publicité**
- Support prioritaire

**Revenu estimé:**
- Objectif: 1000 utilisateurs premium × 4.99$/mois = **4990 CAD/mois**

### Évolution B2B (Phase 2)

**Cible:** Épiceries, marques alimentaires
**Offre:**
- Tableau de bord analytics (produits populaires, tendances)
- Promotions ciblées (push notifications)
- Programmes de fidélité intégrés
**Prix:** 500-2000 CAD/mois par enseigne

---

## Conformité Loi 25

### Article 8 - Consentement explicite
- Modal au 1er lancement: "Nous collectons votre email et localisation pour..."
- Boutons: "Accepter" / "Refuser"

### Article 14 - Finalité de la collecte
Données collectées:
- Email (auth)
- Nom/photo (profil)
- Localisation (optimisation distance)
- Listes d'épicerie (fonctionnalité principale)

Utilisation:
- Authentification
- Optimisation trajets
- Notifications prix
- Amélioration du service (analytics anonymes)

### Article 20 - Mesures de sécurité
- HTTPS (TLS 1.3)
- Tokens JWT avec expiration 24h
- Hash bcrypt pour passwords
- Logs d'accès (audit)

### Article 25 - Droit d'accès
Page `/parametres` → "Télécharger mes données" (JSON export)

### Article 26 - Droit à l'oubli
Page `/parametres` → "Supprimer mon compte"
- Confirmation par email
- Suppression dans 30 jours
- Email de confirmation finale

### Article 27 - Notification de brèche
Engagement: Notification sous 72h en cas de fuite de données

---

## Roadmap de Développement

### Phase 1: Infrastructure & Auth (1-2 semaines)

**Objectifs:**
- Migrer de mock Firebase à vraie Firebase Auth
- Déployer backend Express sur Vercel
- Configurer Supabase PostgreSQL (région Canada)
- Générer 500 produits × 5 épiceries (mock data)

**Tasks:**
1. ✅ Créer projet Firebase (Authentication + Cloud Messaging)
2. ✅ Configurer Supabase (compte gratuit, région Montreal)
3. ✅ Migrer schéma Prisma existant vers Supabase
4. ✅ Script de génération de données: `scripts/generate-mock-products.js`
5. ✅ Implémenter vraie Firebase Auth dans `src/contexts/AuthContext.jsx`
6. ✅ Tester login/logout/register
7. ✅ Déployer backend sur Vercel

**Résultat:** App fonctionnelle avec auth réelle + 2500 produits de test

---

### Phase 2: Partage collaboratif avancé (1 semaine)

**Objectifs:**
- Remplacer polling par Supabase Realtime
- Implémenter permissions (admin/editor/viewer)
- Gestion des doublons
- Multi-groupes

**Tasks:**
1. ✅ Ajouter Supabase Realtime à `SharedList.jsx`
2. ✅ Modal "Produit similaire détecté" avec merge
3. ✅ Page `/groupes` pour gérer tous ses groupes
4. ✅ Implémenter rôles (creator = admin, autres = editor)
5. ✅ Tester avec 3 utilisateurs simultanés

**Résultat:** Sync temps réel stable + gestion propre des conflits

---

### Phase 3: Optimisation avancée (1 semaine)

**Objectifs:**
- Intégrer données de prix réelles (mock → DB)
- Améliorer UI de `Analyse.jsx` (badges, distances)
- Verrouillage produits
- Substitutions

**Tasks:**
1. ✅ API `/api/prices` retourne depuis PostgreSQL (pas JSON statique)
2. ✅ Ajouter badges "Économie: 12.50$" sur cartes combinaisons
3. ✅ Icône 📍 avec distance totale (ex: "8.2 km")
4. ✅ Bouton "Verrouiller dans ce magasin" sur produits
5. ✅ Modal substitution: "Produit X non dispo, remplacer par Y?"

**Résultat:** Optimisation complète + UX polie

---

### Phase 4: Assignation & Checklist (1 semaine)

**Objectifs:**
- Admin peut assigner courses aux membres
- Notifications FCM in-app
- Mode checklist pour courses

**Tasks:**
1. ✅ Page `/assign` (admin seulement) avec drag-and-drop
2. ✅ Créer table `CourseAssignment` dans Prisma
3. ✅ Endpoint `/api/assign` (POST)
4. ✅ Firebase Cloud Messaging setup (backend)
5. ✅ Page `/mes-courses` affichant produits assignés
6. ✅ Checkboxes pour valider achats
7. ✅ Barre de progression globale

**Résultat:** Workflow complet du panier à l'achat

---

### Phase 5: Notifications prix (1 semaine)

**Objectifs:**
- Cron job quotidien (vérification prix)
- Notifications in-app
- Historique des prix

**Tasks:**
1. ✅ Cron job Vercel (`/api/cron/check-prices`) exécuté chaque jour 6h AM
2. ✅ Comparer prix actuels vs `PriceHistory`
3. ✅ Si baisse >10%, envoyer notification FCM
4. ✅ Enregistrer dans table `Notification`
5. ✅ UI: Badge rouge sur icône 🔔 avec nb non lues
6. ✅ Page `/notifications` listant l'historique

**Résultat:** Utilisateurs alertés des bonnes affaires

---

### Phase 6: Freemium & Paywall (1 semaine)

**Objectifs:**
- Implémenter limites version gratuite
- Intégrer Stripe pour paiements
- Paywall gates

**Tasks:**
1. ✅ Ajouter champ `tier` dans table `User` (default: 'free')
2. ✅ Middleware vérifiant limites (20 produits, 1 groupe)
3. ✅ Composant `PaywallGate.jsx` (déjà existant, à finaliser)
4. ✅ Créer compte Stripe (mode test)
5. ✅ API `/api/checkout` (Stripe Checkout Session)
6. ✅ Webhook `/api/stripe-webhook` pour confirmer paiement
7. ✅ Page `/premium` détaillant les avantages

**Résultat:** Monétisation fonctionnelle

---

### Phase 7: Mobile (Capacitor.js) (1-2 semaines)

**Objectifs:**
- Convertir app React en app iOS/Android native
- Scan code-barres
- Géolocalisation

**Tasks:**
1. ✅ `npm install @capacitor/core @capacitor/cli`
2. ✅ `npx cap init`
3. ✅ `npx cap add ios` + `npx cap add android`
4. ✅ Installer plugins: Camera, Geolocation, Push Notifications
5. ✅ Tester scan code-barres sur appareil réel
6. ✅ Build iOS: `npx cap open ios` → Xcode → Archive
7. ✅ Build Android: `npx cap open android` → Android Studio → APK

**Résultat:** App mobile native iOS + Android

---

### Phase 8: Scraping réel (2 semaines)

**Objectifs:**
- Remplacer mock data par scraping hebdomadaire
- Cron jobs pour 5 épiceries

**Tasks:**
1. ✅ Scraper IGA (API GraphQL) → déjà partiellement fait
2. ✅ Scraper Metro (Puppeteer HTML)
3. ✅ Scraper Maxi (Loblaws API)
4. ✅ Scraper Super C (Puppeteer HTML)
5. ✅ Scraper Costco (Puppeteer HTML, nécessite compte)
6. ✅ Cron job `/api/cron/scrape-all` (1x/semaine, dimanche soir)
7. ✅ Admin dashboard `/admin` pour monitorer scraping

**Résultat:** Données prix réelles et à jour

---

### Phase 9: Polish & Launch (1 semaine)

**Objectifs:**
- Tests utilisateurs
- Corrections bugs
- Déploiement production

**Tasks:**
1. ✅ Tests avec 10 beta-testeurs (familles/étudiants)
2. ✅ Récolter feedback (Google Forms)
3. ✅ Corriger bugs critiques
4. ✅ Rédiger documentation (`README.md`, `/docs`)
5. ✅ Créer page landing (`/`) avec démo vidéo
6. ✅ Lancement soft (amis/famille)
7. ✅ Campagne marketing (groupes Facebook Québec)

**Résultat:** App en production accessible au public

---

## Estimation Totale

**Durée:** 9-12 semaines (solo avec Copilot)
**Coûts récurrents:**
- Supabase: 0$/mois (gratuit jusqu'à 500 MB)
- Vercel: 0$/mois (gratuit jusqu'à 100k requêtes)
- Firebase: 0$/mois (gratuit jusqu'à 10k notifications/jour)
- **Total: 0 CAD/mois** jusqu'à traction significative

**Coûts one-time:**
- Domaine: ~15 CAD/an (ex: panierintelligent.app)
- Apple Developer: 120 USD/an (pour iOS App Store)
- Google Play: 25 USD one-time (pour Android Play Store)

**Total année 1:** ~200 CAD

---

## Métriques de Succès

### Objectifs 6 mois post-launch
- **1000 utilisateurs actifs** (au moins 1 liste/mois)
- **100 utilisateurs premium** (taux conversion 10%)
- **Revenu mensuel:** 500 CAD (100 × 4.99$)
- **NPS (Net Promoter Score):** >50

### Objectifs 1 an
- **10 000 utilisateurs actifs**
- **1000 utilisateurs premium** (10%)
- **Revenu mensuel:** 5000 CAD
- **1 partenariat épicerie** (accès API + commission)

---

## Contact & Support

**Email:** support@panierintelligent.app
**GitHub:** github.com/panier-intelligent/app
**Discord:** discord.gg/panierintelligent

---

*Document vivant, mis à jour régulièrement au fil du développement.*
