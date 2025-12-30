# 🧪 Guide de test - Panier Intelligent

## ✅ Checklist de validation

Suivez ces étapes pour valider le système complet.

---

## 1️⃣ Démarrage des serveurs

### Backend (Port 3001)
```powershell
cd "c:\Users\baydi\OneDrive\Documents\Panier Epicerie IA 2\backend"
npm run dev
```

**Attendez** : `✅ Serveur démarré avec succès`

### Frontend (Port 5174)
```powershell
cd "c:\Users\baydi\OneDrive\Documents\Panier Epicerie IA 2"
npm run dev
```

**Attendez** : `➜ Local: http://localhost:5174/`

### Vérification
```powershell
# Backend
Test-NetConnection -ComputerName localhost -Port 3001

# Frontend
Test-NetConnection -ComputerName localhost -Port 5174
```

**Résultat attendu** : `TcpTestSucceeded : True` pour les deux

---

## 2️⃣ Connexion Admin

1. Ouvrez `http://localhost:5174/admin`
2. Entrez le mot de passe : `MonMotDePasseSecurise2024!`
3. Cliquez **Se connecter**

**Résultat attendu** : 
- ✅ Redirection vers le dashboard
- Affichage des statistiques (initialement à 0)
- 5 boutons de scraping visibles

---

## 3️⃣ Test : Génération 5 Épiceries (275 produits)

### Étape 1 : Génération
1. Cliquez sur **🌟 5 Épiceries** (bouton violet)
2. Attendez 2-3 secondes
3. Un message apparaît : `✅ 275 produits détectés!`

### Étape 2 : Vérification du tableau
Le tableau affiche 275 lignes avec :
- Colonne **Épicerie** : IGA, Costco, Metro, Maxi, Super C
- Colonne **Début** : 2025-11-22
- Colonne **Fin** : 2025-11-28
- Prix variés selon l'épicerie

### Étape 3 : Validation de quelques produits
1. Faites défiler le tableau
2. Cherchez "Lait 2%" (5 versions, une par épicerie)
3. Cochez ✓ ces 5 produits
4. Vérifiez les prix :
   - Super C : ~3.80$ ✅ (le moins cher)
   - Costco : ~3.82$
   - Maxi : ~4.13$
   - IGA : ~4.49$
   - Metro : ~4.71$ (le plus cher)

### Étape 4 : Sélection en masse
1. Faites `Ctrl+A` puis cliquez la première case ✓
2. OU cochez manuellement ~20-30 produits variés
3. Le compteur affiche "XX validés" dans le badge

### Étape 5 : Publication
1. Cliquez **✅ Publier les validés**
2. Confirmez dans la boîte de dialogue
3. Attendez le message de succès

**Résultat attendu** :
```
✅ Publication réussie!
XX produits publiés pour les utilisateurs
Ingestion locale: +XX / ⟳0
```

### Étape 6 : Vérification des statistiques
- **Total produits** : XX (nombre publié)
- **Prix actifs** : XX (même nombre)
- **Expirés** : 0
- **Épiceries** : 5 (ou moins selon vos sélections)

**Détails par épicerie** affichés en bas

---

## 4️⃣ Test : Recherche utilisateur

1. Retournez à l'accueil : cliquez **Retour à l'app**
2. Dans la barre de recherche, tapez : `lait`
3. Les résultats affichent tous les laits disponibles
4. Vérifiez que les prix sont triés du moins cher au plus cher
5. Ajoutez "Lait 2%" au panier

**Résultat attendu** :
- Plusieurs résultats de lait (Lait 2%, Lait 3.25%)
- Chaque lait affiche les 5 épiceries (si vous avez tout publié)
- Tri automatique par prix croissant

---

## 5️⃣ Test : Modification manuelle

### Retour à l'admin
1. Allez sur `http://localhost:5174/admin`
2. Générez **✨ Données test** (55 produits)

### Édition
1. Trouvez "Pommes Gala"
2. Modifiez le prix : `2.99` → `1.99`
3. Modifiez la marque : `Selection` → `Irresistibles`
4. Badge "Modifié" apparaît
5. Cochez ✓ ce produit
6. Publiez

### Vérification
1. Retournez à l'admin
2. Stats affichent un produit de plus
3. Recherchez "pommes" dans l'app utilisateur
4. Vérifiez le prix : `1.99$` ✅

---

## 6️⃣ Test : Dates de validité

### Modifier une date de fin
1. Admin → Générez **Données test**
2. Trouvez "Bananes"
3. Modifiez **Fin** : `2025-11-28` → `2025-11-20` (date passée)
4. Cochez ✓ et publiez

### Vérification expiration
1. Retournez au dashboard admin
2. **Stats** affichent maintenant :
   - **Expirés** : 1
   - **Prix actifs** : diminué de 1
3. Recherchez "bananes" dans l'app utilisateur
4. Le produit expiré N'apparaît PAS dans les résultats ✅

---

## 7️⃣ Test : Déduplication

### Publication initiale
1. Admin → **5 Épiceries**
2. Cochez "Yogourt grec - Oikos" (IGA) : `4.99$`
3. Publiez
4. Stats : +1 produit

### Re-publication avec prix différent
1. Admin → **5 Épiceries** (re-génération)
2. Cette fois le prix de "Yogourt grec" IGA est `5.20$` (aléatoire)
3. Cochez et publiez

### Vérification déduplication
1. Stats : Total reste identique (pas de doublon)
2. Recherchez "yogourt grec" dans l'app
3. Prix IGA affiché : `4.99$` ✅ (le plus bas a été gardé)

---

## 8️⃣ Test : IndexedDB

### Inspection manuelle
1. Ouvrez DevTools : `F12`
2. Onglet **Application** (Chrome) ou **Stockage** (Firefox)
3. Développez **IndexedDB** → **localforage** → **keyvaluepairs**
4. Cliquez sur `weekly_prices_v1`

### Vérification de la structure
```javascript
{
  lastFetched: 1732300000000,
  generatedAt: "2025-11-22T...",
  items: [
    {
      name: "lait 2%",           // Normalisé en minuscules
      store: "IGA",
      price: 4.49,
      brand: "Natrel",
      volume: "2 L",
      category: "Produits laitiers",
      validFrom: "2025-11-22",
      validTo: "2025-11-28",
      updatedAt: "2025-11-22T...",
      source: "admin-publish",
      ocrConfidence: 1.0
    },
    // ... 274 autres produits
  ]
}
```

### Nettoyage (si besoin)
```javascript
// Dans la console (F12)
await localforage.removeItem('weekly_prices_v1')
location.reload()
```

---

## 9️⃣ Test : Comparaison de prix multi-épiceries

### Scénario réaliste
1. Admin → **5 Épiceries** → Validez TOUS les produits → Publiez
2. App utilisateur → Créez une liste de courses :
   - Lait 2%
   - Bananes
   - Pain tranché blanc
   - Poulet entier
   - Yogourt grec

### Comparaison
Pour chaque produit, vous verrez les 5 épiceries. Exemple attendu :

**Lait 2% (2 L)**
1. Super C : 3.80$ ⭐ (meilleur prix)
2. Costco : 3.82$
3. Maxi : 4.13$
4. IGA : 4.49$
5. Metro : 4.71$

**Économie attendue** : ~15-20% en allant chez Super C vs Metro

---

## 🔟 Test : Performance

### Charge de 275 produits
1. Admin → **5 Épiceries**
2. Validez TOUS (275 produits)
3. Publiez

**Vérifications** :
- ⏱️ Publication < 3 secondes
- 📊 Stats actualisées instantanément
- 🔍 Recherche utilisateur reste rapide (<500ms)
- 💾 IndexedDB ne dépasse pas 500 KB

### Vérification mémoire
```javascript
// Console du navigateur
const meta = await localforage.getItem('weekly_prices_v1')
console.log(`Produits : ${meta.items.length}`)
console.log(`Taille estimée : ${JSON.stringify(meta).length / 1024} KB`)
```

**Résultat attendu** : ~300-400 KB pour 275 produits

---

## ✅ Checklist finale

Cochez chaque test réussi :

- [ ] Backend démarre sur port 3001
- [ ] Frontend démarre sur port 5174
- [ ] Connexion admin réussie
- [ ] Génération 5 Épiceries (275 produits)
- [ ] Validation et publication fonctionnent
- [ ] Stats affichent correctement les données
- [ ] Recherche utilisateur retourne des résultats
- [ ] Tri par prix croissant fonctionne
- [ ] Édition manuelle sauvegardée
- [ ] Dates de validité filtrent correctement
- [ ] Déduplication garde le prix le plus bas
- [ ] IndexedDB contient les bonnes données
- [ ] Comparaison multi-épiceries affiche 5 prix
- [ ] Performance acceptable (<3s pour 275 produits)

---

## 🐛 Problèmes courants

### ❌ "Token invalide ou expiré"
**Solution** : Déconnectez-vous et reconnectez-vous

### ❌ "0 produits détectés"
**Vérifications** :
```powershell
# Backend tourne ?
netstat -ano | findstr :3001

# Test API
Invoke-RestMethod -Uri http://localhost:3001/api/health
```

### ❌ Stats ne s'affichent pas
**Solution** :
- F12 → Console → Vérifiez les erreurs
- Cliquez **🔄 Actualiser**

### ❌ Recherche ne trouve rien
**Vérifications** :
- Les produits sont-ils publiés ? (stats > 0)
- F12 → Application → IndexedDB → weekly_prices_v1
- Vérifiez que `items` n'est pas vide

---

## 📊 Résultats attendus

Après tous les tests :

### Base de données
- **Total** : ~275 produits
- **Actifs** : ~275 (si dates valides)
- **Épiceries** : 5 (IGA, Costco, Metro, Maxi, Super C)

### Performance
- Génération : <3s
- Publication : <3s
- Recherche : <500ms
- IndexedDB : <500 KB

### Fonctionnalités
- ✅ Génération multi-épiceries
- ✅ Validation manuelle
- ✅ Édition de champs
- ✅ Gestion dates de validité
- ✅ Publication avec déduplication
- ✅ Stats temps réel
- ✅ Recherche filtrée par validité
- ✅ Comparaison de prix

---

## 🎯 Tests avancés (optionnel)

### Test A : Grosse charge (1000+ produits)
1. Répétez "5 Épiceries" 4 fois sans vider la base
2. Publiez à chaque fois
3. Vérifiez : 275 × 4 = ~1100 produits
4. Performance de recherche ?

### Test B : Historique de prix
1. Publiez "Lait 2%" IGA à 4.49$
2. Re-générez avec nouveau prix aléatoire
3. Si nouveau prix < 4.49$, il remplace
4. Si nouveau prix > 4.49$, l'ancien reste

### Test C : Expiration en masse
1. Modifiez toutes les dates **Fin** à hier
2. Publiez
3. Stats : Tous en "Expirés"
4. Recherche : 0 résultats

---

**Bon test ! 🚀**
