# Installation PostgreSQL et Setup Database

## 🐘 Étape 1: Installer PostgreSQL

### Windows:
```powershell
# Télécharger depuis https://www.postgresql.org/download/windows/
# Ou avec chocolatey:
choco install postgresql

# Démarrer le service
net start postgresql-x64-14
```

### macOS:
```bash
brew install postgresql
brew services start postgresql
```

### Linux (Ubuntu/Debian):
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
```

## 📦 Étape 2: Créer la base de données

```powershell
# Se connecter à PostgreSQL
psql -U postgres

# Dans psql:
CREATE DATABASE panier_intelligent;
CREATE USER panier_user WITH ENCRYPTED PASSWORD 'votre_mot_de_passe';
GRANT ALL PRIVILEGES ON DATABASE panier_intelligent TO panier_user;
\q
```

## ⚙️ Étape 3: Configurer l'environnement

Copiez `.env.example` vers `.env` et configurez:

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=panier_intelligent
DB_USER=postgres  # ou panier_user
DB_PASSWORD=votre_mot_de_passe
```

## 🚀 Étape 4: Installer les dépendances Node

```powershell
cd backend
npm install
```

Les packages suivants seront installés:
- `pg` : Client PostgreSQL pour Node.js
- `uuid` : Génération d'IDs uniques

## 📊 Étape 5: Exécuter les migrations

```powershell
npm run migrate
```

Cela va créer la table `price_history` et toutes les fonctions associées.

## ✅ Étape 6: Vérifier l'installation

```powershell
# Test de connexion
psql -U postgres -d panier_intelligent -c "SELECT COUNT(*) FROM price_history;"

# Devrait retourner: count = 0 (table vide mais créée)
```

## 🔍 Étape 7: Démarrer le serveur

```powershell
npm run dev
```

Vous devriez voir:
```
[DB] ✅ Connected to PostgreSQL at 2025-11-23...
✅ Serveur démarré avec succès
📍 Price History API: http://localhost:3001/api/prices/*
```

## 📡 Tester l'API

```powershell
# Health check
curl http://localhost:3001/api/health

# Ajouter un prix test
Invoke-RestMethod -Uri http://localhost:3001/api/prices -Method Post `
  -ContentType 'application/json' `
  -Body '{
    "productId": "test-123",
    "productName": "Lait 2L",
    "storeId": "metro-001",
    "storeName": "Metro Jean-Talon",
    "prix": 5.99,
    "source": "manual"
  }'

# Obtenir l'historique
curl http://localhost:3001/api/prices/history/test-123
```

## 🐛 Dépannage

### Erreur: "password authentication failed"
- Vérifiez que votre mot de passe dans `.env` est correct
- Essayez avec l'utilisateur `postgres` par défaut

### Erreur: "ECONNREFUSED"
- PostgreSQL n'est pas démarré: `net start postgresql-x64-14` (Windows)
- Mauvais port: vérifiez que DB_PORT=5432 dans .env

### Erreur: "relation does not exist"
- Les migrations n'ont pas été exécutées: `npm run migrate`

## 📚 Prochaines étapes

Voir [PRICE_HISTORY_USAGE.md](./PRICE_HISTORY_USAGE.md) pour:
- Exemples d'utilisation de l'API
- Intégration avec le frontend
- Visualisation des tendances de prix
