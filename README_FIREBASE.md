# Panier Intelligent - Application d'Optimisation d'Épicerie

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![Firebase](https://img.shields.io/badge/firebase-ready-orange.svg)
![React](https://img.shields.io/badge/react-18.2-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)

> Économisez jusqu'à 30% sur votre épicerie en trouvant automatiquement la meilleure combinaison de magasins.

**Marché cible:** Québec, Canada
**Utilisateurs:** Familles, étudiants, personnes soucieuses du budget

---

## 🎯 Fonctionnalités Principales

### ✅ v1.0 (Disponible)
- ✨ **Listes d'épicerie collaboratives** avec sync temps réel
- 🔍 **Optimisation multi-critères** (prix + distance + nb magasins)
- 👥 **Partage de listes** entre membres d'un groupe (famille, colocation)
- 📍 **Géolocalisation** pour trouver magasins à proximité
- 📊 **Historique des prix** et graphiques
- 🔔 **Alertes prix** (baisse >10%)
- 🎯 **Assignation des courses** aux membres du groupe
- ✅ **Mode checklist** pour valider les achats

### 🚀 Prochainement
- 📱 Application mobile iOS/Android (Capacitor.js)
- 📷 Scan de code-barres
- 🤖 Suggestions intelligentes de produits récurrents
- 🎮 Gamification (badges, points)
- 🌐 Multi-langue (FR/EN)

---

## 🛠️ Stack Technique

### Frontend
- **Framework:** React 18 + Vite 7
- **State:** Zustand (global) + IndexedDB (offline)
- **UI:** Tailwind CSS + Framer Motion + Lucide Icons
- **Routing:** React Router v6

### Backend
- **Auth:** Firebase Authentication (Google + Email/Password)
- **Database:** Cloud Firestore (NoSQL, temps réel)
- **Functions:** Cloud Functions (Node.js)
- **Notifications:** Firebase Cloud Messaging
- **Hosting:** Firebase Hosting

### Mobile (Phase 2)
- **Framework:** Capacitor.js (React → iOS/Android natif)

---

## 📦 Installation Rapide

### Prérequis
- Node.js 18+
- npm 10+
- Compte Firebase (gratuit)

### 1. Cloner le projet
```bash
git clone https://github.com/panier-intelligent/app.git
cd app
```

### 2. Installer les dépendances
```bash
npm install
```

### 3. Configurer Firebase

**Créer un projet Firebase:**
1. Allez sur [console.firebase.google.com](https://console.firebase.google.com)
2. Créez un projet "panier-intelligent"
3. Activez Authentication, Firestore, Cloud Messaging
4. Récupérez vos credentials

**Configurer `.env`:**
```bash
cp .env.example .env
# Remplissez avec vos credentials Firebase
```

**Détails complets:** Voir [FIREBASE_SETUP.md](FIREBASE_SETUP.md)

### 4. Générer les données de test (500 produits × 5 épiceries)
```bash
node scripts/generate-mock-data.js
```

### 5. Démarrer le serveur de développement
```bash
npm run dev
```

Ouvrez [http://localhost:5177](http://localhost:5177)

---

## 📚 Documentation

| Document | Description |
|----------|-------------|
| [FIREBASE_SETUP.md](FIREBASE_SETUP.md) | 🔥 Guide de déploiement Firebase (étape par étape) |
| [ARCHITECTURE_COMPLETE.md](ARCHITECTURE_COMPLETE.md) | 🏗️ Architecture système complète |
| [DECISIONS_TECHNIQUES.md](DECISIONS_TECHNIQUES.md) | 🤔 Justifications des choix techniques |
| [PLAN_ACTION_IMMEDIAT.md](PLAN_ACTION_IMMEDIAT.md) | 📅 Roadmap des 9 phases |
| [PHASE_1_RECAP.md](PHASE_1_RECAP.md) | ✅ Récapitulatif Phase 1 (Infrastructure) |

---

## 🚀 Déploiement

### Déploiement Firebase (Production)

```bash
# 1. Build de production
npm run build

# 2. Déployer vers Firebase Hosting
firebase deploy

# 3. Votre app sera accessible sur:
# https://panier-intelligent.web.app
```

### Déploiement Custom Domain

```bash
# 1. Acheter un domaine (ex: panierintelligent.app)
# 2. Dans Firebase Console > Hosting > Add custom domain
# 3. Configurer les DNS records fournis par Firebase
# 4. Attendre propagation DNS (24-48h)

# Votre app sera accessible sur:
# https://panierintelligent.app
```

---

## 🧪 Tests

### Tests unitaires
```bash
npm run test
```

### Tests avec couverture
```bash
npm run test:coverage
```

### Tests E2E (à venir)
```bash
npm run test:e2e
```

---

## 📱 Mobile (Capacitor.js)

### Build iOS
```bash
npm run build
npx cap sync ios
npx cap open ios
# Dans Xcode: Product > Archive
```

### Build Android
```bash
npm run build
npx cap sync android
npx cap open android
# Dans Android Studio: Build > Generate Signed Bundle
```

**Détails:** Voir [ARCHITECTURE_COMPLETE.md](ARCHITECTURE_COMPLETE.md) Section 7

---

## 🏗️ Structure du Projet

```
panier-intelligent/
├── src/
│   ├── components/          # Composants React réutilisables
│   │   ├── Header.jsx
│   │   ├── ProductItem.jsx
│   │   ├── ShareModal.jsx
│   │   └── ...
│   ├── pages/               # Pages principales
│   │   ├── Liste.jsx        # Liste d'épicerie
│   │   ├── Analyse.jsx      # Optimisation & résultats
│   │   ├── SharedList.jsx   # Liste collaborative
│   │   ├── Parametres.jsx   # Paramètres utilisateur
│   │   └── ...
│   ├── services/            # Services (API, DB)
│   │   ├── db.js            # IndexedDB (local)
│   │   ├── firestore.js     # Firestore (cloud)
│   │   ├── optimisation.js  # Algorithme multi-critères
│   │   └── ...
│   ├── contexts/            # Contexts React
│   │   └── AuthContext.jsx  # Authentification Firebase
│   ├── config/              # Configuration
│   │   └── firebase.config.js
│   └── store/               # Zustand store
│       └── useAppStore.js
├── scripts/                 # Scripts utilitaires
│   └── generate-mock-data.js # Génération données test
├── backend/                 # Backend Express (optionnel)
├── firestore.rules          # Security rules Firestore
├── .env.example             # Template credentials
└── package.json
```

---

## 🤝 Contribuer

Nous accueillons les contributions ! Voici comment participer:

### 1. Forker le projet
```bash
git clone https://github.com/VOTRE_USERNAME/panier-intelligent.git
cd panier-intelligent
```

### 2. Créer une branche
```bash
git checkout -b feature/nouvelle-fonctionnalite
```

### 3. Commiter vos changements
```bash
git commit -m "Ajout: nouvelle fonctionnalité X"
```

### 4. Pousser vers GitHub
```bash
git push origin feature/nouvelle-fonctionnalite
```

### 5. Ouvrir une Pull Request
Allez sur GitHub et créez une Pull Request.

**Guidelines:**
- Suivez le style de code existant (ESLint + Prettier)
- Ajoutez des tests pour les nouvelles fonctionnalités
- Mettez à jour la documentation si nécessaire

---

## 📄 Licence

Ce projet est sous licence MIT. Voir [LICENSE](LICENSE) pour plus de détails.

---

## 👥 Équipe

**Créateur:** [@votre-nom](https://github.com/votre-nom)

**Contributeurs:** Voir [CONTRIBUTORS.md](CONTRIBUTORS.md)

---

## 🐛 Signaler un Bug

Trouvé un bug ? Ouvrez une issue sur [GitHub Issues](https://github.com/panier-intelligent/app/issues) avec:
- Description du problème
- Étapes pour reproduire
- Comportement attendu vs réel
- Captures d'écran si applicable

---

## 💬 Support & Communauté

- **Email:** support@panierintelligent.app
- **Discord:** [discord.gg/panierintelligent](https://discord.gg/panierintelligent)
- **Twitter:** [@PanierIntel](https://twitter.com/panierintel)

---

## 🙏 Remerciements

- [Firebase](https://firebase.google.com) pour l'infrastructure cloud
- [React](https://react.dev) pour le framework UI
- [Vite](https://vitejs.dev) pour le build tool ultra-rapide
- [Tailwind CSS](https://tailwindcss.com) pour le styling
- La communauté open-source ❤️

---

## 📊 Statistiques

![GitHub stars](https://img.shields.io/github/stars/panier-intelligent/app?style=social)
![GitHub forks](https://img.shields.io/github/forks/panier-intelligent/app?style=social)
![GitHub issues](https://img.shields.io/github/issues/panier-intelligent/app)
![GitHub pull requests](https://img.shields.io/github/issues-pr/panier-intelligent/app)

---

## 🗺️ Roadmap

- [x] **Phase 1:** Infrastructure Firebase (✅ Complétée)
- [ ] **Phase 2:** Partage collaboratif avancé (En cours)
- [ ] **Phase 3:** Optimisation UI/UX
- [ ] **Phase 4:** Assignation des courses
- [ ] **Phase 5:** Application mobile (iOS/Android)
- [ ] **Phase 6:** Notifications prix en temps réel
- [ ] **Phase 7:** Freemium & Stripe
- [ ] **Phase 8:** Scraping réel (IGA, Metro, Maxi, Super C, Costco)
- [ ] **Phase 9:** Launch public

**Timeline:** 9-12 semaines

---

## 🎉 Quick Start (30 secondes)

```bash
# 1. Cloner
git clone https://github.com/panier-intelligent/app.git && cd app

# 2. Installer
npm install

# 3. Configurer
cp .env.example .env
# Remplir .env avec vos credentials Firebase

# 4. Lancer
npm run dev

# 5. Ouvrir http://localhost:5177
```

**Besoin d'aide ?** Consultez [FIREBASE_SETUP.md](FIREBASE_SETUP.md)

---

<p align="center">
  Fait avec ❤️ au Québec
</p>

<p align="center">
  <a href="https://panierintelligent.app">Site Web</a> •
  <a href="https://github.com/panier-intelligent/app">GitHub</a> •
  <a href="https://discord.gg/panierintelligent">Discord</a>
</p>
