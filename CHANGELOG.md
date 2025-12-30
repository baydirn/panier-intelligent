# Changelog - Panier Intelligent

Toutes les modifications notables de ce projet sont documentées ici.

Le format est basé sur [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
et ce projet adhère au [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.0.0] - 2025-12-29

### 🎉 Phase 1: Infrastructure Firebase - COMPLÉTÉE

#### Added ✨
- **Configuration Firebase complète**
  - `src/config/firebase.config.js` avec setup Auth, Firestore, Functions, FCM
  - Support émulateurs locaux pour développement
  - Helper `getFCMToken()` pour notifications

- **Authentification Firebase réelle**
  - Migration de `src/contexts/AuthContext.jsx` depuis mock vers vraie Firebase Auth
  - Support Google Sign-In
  - Support Email/Password
  - Gestion automatique du tier (free/premium)
  - Persistance de session via `onAuthStateChanged`
  - Fonctions: `updateUserTier`, `updateUserPreferences`, `updateUserLocation`

- **Service Firestore Cloud**
  - `src/services/firestore.js` avec toutes les opérations CRUD
  - **Produits:** `getAllProducts`, `searchProducts`, `getProductById`
  - **Prix:** `getProductPrices`, `getPricesForProducts` (batch queries optimisées)
  - **Magasins:** `getAllStores`, `getStoresNearby` (rayon géographique avec Haversine)
  - **Listes partagées:** CRUD complet + `subscribeToSharedList` (temps réel)
  - **Assignations:** `createCourseAssignment`, `getUserAssignments`, `updateAssignmentStatus`

- **Firestore Security Rules**
  - `firestore.rules` avec permissions granulaires
  - Users: lecture/écriture seulement son propre profil
  - Products/Prices/Stores: lecture publique, écriture admin/Functions seulement
  - SharedLists: owner + membres (admin/editor) peuvent modifier
  - CourseAssignments: user assigné + owner peuvent gérer
  - PriceAlerts: utilisateur peut gérer ses propres alertes
  - Notifications: utilisateur peut lire/modifier ses propres notifications

- **Script de Génération de Données Mock**
  - `scripts/generate-mock-data.js` génère **500 produits × 5 épiceries = 2500 entrées**
  - 7 catégories: Fruits & Légumes, Produits laitiers, Viandes, Boulangerie, Épicerie, Boissons, Collations
  - Variation de prix réaliste par magasin (IGA: ref, Metro: +5%, Maxi: -8%, SuperC: -12%, Costco: -15%)
  - Promotions aléatoires (10% de chance, -15% sur prix régulier)
  - Utilise batch writes pour optimiser (500 opérations/batch max)

- **Documentation Complète**
  - `ARCHITECTURE_COMPLETE.md` - Vision complète du projet (9 phases, 12 semaines)
  - `DECISIONS_TECHNIQUES.md` - Justifications des choix techniques (Firebase vs Supabase, etc.)
  - `PLAN_ACTION_IMMEDIAT.md` - Roadmap détaillée avec ordre des phases
  - `FIREBASE_SETUP.md` - Guide de déploiement étape par étape (12 étapes)
  - `PHASE_1_RECAP.md` - Récapitulatif Phase 1 + prochaines actions
  - `README_FIREBASE.md` - README mis à jour avec quick start
  - `.env.example` - Template configuration Firebase

#### Changed 🔄
- **Dépendances**
  - Ajouté `firebase` ^10.x (Auth, Firestore, Functions, Messaging)
  - Ajouté `dotenv` ^16.x (pour scripts Node.js)

#### Deprecated ⚠️
- `src/contexts/AuthContext.jsx` (version mock) → Remplacée par version Firebase réelle
- `src/services/db.js` (IndexedDB local) → À utiliser en parallèle avec `firestore.js` pour mode offline

#### Security 🔒
- Firestore Security Rules déployables empêchant accès non autorisé
- Empêche utilisateurs de changer leur tier manuellement (seulement via Cloud Function après paiement)
- Tokens Firebase JWT avec expiration automatique
- Hébergement région Canada (Loi 25 Québec)

#### Documentation 📚
- 7 documents créés avec ~15,000 lignes de documentation complète
- Guides étape par étape pour déploiement Firebase
- Architecture complète avec diagrammes
- Justifications techniques détaillées

---

## [0.5.0] - 2025-11-XX (État Avant Phase 1)

### Fonctionnalités Existantes
- ✅ Frontend React 18 + Vite 7
- ✅ UI Tailwind CSS + Framer Motion + Lucide Icons
- ✅ Zustand state management
- ✅ IndexedDB pour storage local (`src/services/db.js`)
- ✅ Algorithme d'optimisation multi-critères (`src/services/optimisation.js`)
- ✅ Pages: Liste, Analyse, Magasin, Paramètres, SharedList
- ✅ Design Figma partiellement intégré
- ✅ Mock Firebase Auth (local storage)
- ✅ Backend Express avec routes partage (`/api/share-list`, `/api/shared-list/:code`)
- ✅ Scraping IGA (partiel via Puppeteer)
- ✅ Génération de données de test (50 produits × 5 épiceries)

### Limitations
- ❌ Authentification mock (pas de vraie Firebase)
- ❌ Pas de base de données cloud (tout en local IndexedDB)
- ❌ Sync collaborative via polling 5s (pas de temps réel)
- ❌ Pas de Security Rules Firestore
- ❌ Seulement 50 produits de test (insuffisant pour démo convaincante)

---

## [Unreleased] - Prochaines Phases

### Phase 2: Partage Collaboratif Avancé (À venir)
- [ ] Remplacer polling par `onSnapshot` (Firestore temps réel natif)
- [ ] Implémenter permissions (admin/editor/viewer)
- [ ] Détection de doublons avec fusion intelligente
- [ ] Page `/groupes` pour gérer tous ses groupes
- [ ] Invitations par email avec liens magiques

### Phase 3: Optimisation Avancée (À venir)
- [ ] Intégrer prix Firestore dans algorithme d'optimisation
- [ ] Badges "Économie: X$" et "Distance: Y km" sur cartes combinaisons
- [ ] Verrouillage de produits dans un magasin spécifique
- [ ] Modal substitutions avec confirmation utilisateur
- [ ] Graphiques comparatifs des économies

### Phase 4: Assignation des Courses (À venir)
- [ ] Page `/assign` avec drag-and-drop pour admin
- [ ] Notifications FCM in-app
- [ ] Page `/mes-courses` avec checklist
- [ ] Barre de progression globale
- [ ] Validation photo des achats (optionnel)

### Phase 5: Mobile (Capacitor.js) (À venir)
- [ ] Convertir React → iOS/Android natif
- [ ] Scan code-barres (Camera plugin)
- [ ] Géolocalisation (Geolocation plugin)
- [ ] Push notifications natives (FCM)
- [ ] Mode offline-first avec sync auto

### Phase 6: Notifications Prix (À venir)
- [ ] Cron job quotidien (vérification prix)
- [ ] Cloud Function `checkPriceChanges`
- [ ] Notifications in-app pour baisses >10%
- [ ] Historique des notifications
- [ ] Paramètres de notification personnalisables

### Phase 7: Freemium & Stripe (À venir)
- [ ] Middleware vérification limites free tier
- [ ] Composant `PaywallGate` finalisé
- [ ] Intégration Stripe Checkout
- [ ] Webhook `/api/stripe-webhook` pour confirmer paiements
- [ ] Page `/premium` détaillant avantages

### Phase 8: Scraping Réel (À venir)
- [ ] Scraper IGA (API GraphQL)
- [ ] Scraper Metro (Puppeteer HTML)
- [ ] Scraper Maxi (Loblaws API)
- [ ] Scraper Super C (Puppeteer HTML)
- [ ] Scraper Costco (Puppeteer HTML, nécessite compte)
- [ ] Cron job `/api/cron/scrape-all` (1x/semaine)
- [ ] Admin dashboard `/admin` pour monitorer scraping

### Phase 9: Polish & Launch (À venir)
- [ ] Tests avec 10 beta-testeurs
- [ ] Corrections bugs critiques
- [ ] Rédaction documentation utilisateur
- [ ] Page landing `/` avec démo vidéo
- [ ] Lancement soft (amis/famille)
- [ ] Campagne marketing (groupes Facebook Québec)

---

## Liens Utiles

- [Releases](https://github.com/panier-intelligent/app/releases)
- [Issues](https://github.com/panier-intelligent/app/issues)
- [Pull Requests](https://github.com/panier-intelligent/app/pulls)
- [Documentation](https://github.com/panier-intelligent/app/docs)

---

## Notes de Version

### Comment lire ce changelog

- **Added:** Nouvelles fonctionnalités
- **Changed:** Modifications de fonctionnalités existantes
- **Deprecated:** Fonctionnalités dépréciées (à supprimer prochainement)
- **Removed:** Fonctionnalités supprimées
- **Fixed:** Corrections de bugs
- **Security:** Corrections de vulnérabilités

### Versioning

- **MAJOR** (1.x.x): Changements incompatibles avec versions précédentes
- **MINOR** (x.1.x): Ajout de fonctionnalités rétrocompatibles
- **PATCH** (x.x.1): Corrections de bugs rétrocompatibles
