# 🚀 Guide de Démarrage Rapide - Interface Admin

## ✅ Ce qui est maintenant en cours d'exécution:

- **Backend API**: http://localhost:3001 ✅
- **Frontend App**: http://localhost:5174 ✅
- **Page Admin**: http://localhost:5174/admin ✅

## 📍 Comment accéder à l'interface admin

### Étape 1: Ouvrir la page admin dans votre navigateur

Allez à: **http://localhost:5174/admin**

### Étape 2: Vous connecter

- **Mot de passe**: `MonMotDePasseSecurise2024!`
- Entrez ce mot de passe dans le champ et cliquez sur "Se connecter"
- Vous obtiendrez un JWT token valide pour 24 heures

### Étape 3: Utiliser le dashboard

Une fois connecté, vous verrez:

1. **Boutons de scraping**:
   - 🔄 Scraper IGA (fonctionnel - 24 produits en 10-15 secondes)
   - Metro (bientôt disponible)
   - Maxi (bientôt disponible)

2. **Tableau de validation**:
   - Cochez les produits corrects
   - Modifiez les noms/prix/volumes si nécessaire
   - Supprimez les produits erronés

3. **Bouton publier**:
   - Publiez les produits validés pour les utilisateurs

## 🔍 Résolution du problème "Route non trouvée"

**C'est normal!** L'erreur `{"success":false,"error":"Route non trouvée"}` apparaît quand vous visitez:
- `http://localhost:3001/` (racine du backend)
- `http://localhost:3001/nimportequoi` (route inexistante)

Le backend **ne sert pas d'interface web** - il ne fournit que des API endpoints.

### Routes backend valides:

- ✅ `GET http://localhost:3001/api/health` - Health check
- ✅ `POST http://localhost:3001/api/admin/login` - Login admin
- ✅ `GET http://localhost:3001/api/admin/verify` - Vérifier token
- ✅ `POST http://localhost:3001/api/admin/scrape/iga` - Scraper IGA
- ❌ `GET http://localhost:3001/` - 404 Route non trouvée (normal)

## 🎯 Tester maintenant

1. Ouvrez **http://localhost:5174/admin** dans votre navigateur
2. Entrez le mot de passe: `MonMotDePasseSecurise2024!`
3. Cliquez sur "🔄 Scraper IGA"
4. Attendez 10-15 secondes
5. Cochez les produits à publier
6. Cliquez sur "✅ Publier les validés"

## 📊 Logs backend

Pour voir ce qui se passe côté serveur, regardez le terminal où le backend tourne. Vous verrez:
```
[2025-11-15T00:00:00.000Z] POST /api/admin/login
[ADMIN] Démarrage scraping IGA...
[ADMIN] Scraping terminé: 24 produits
```

## 🔐 Sécurité

- JWT token expire après 24h
- Si vous obtenez "Token invalide ou expiré", reconnectez-vous
- Le mot de passe est stocké dans `backend/.env` (jamais dans le code)
- Changez le mot de passe en production!
