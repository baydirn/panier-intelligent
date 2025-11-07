# Déploiement Vercel/Netlify + PWA

Ce guide explique comment déployer l'app avec HTTPS (pour le scan caméra) et activer l'installation 1-clic via PWA.

## Prérequis
- Compte GitHub
- Compte Vercel (ou Netlify)
- Node.js LTS installé localement (pour build en local si besoin)

## PWA: ce qui est déjà prêt
- `public/manifest.webmanifest` (icônes, nom, couleurs)
- `public/sw.js` (service worker: cache shell + offline fallback)
- `index.html` (link vers manifest + icônes + theme-color)
- `src/main.jsx` (enregistrement du service worker)

Pour remplacer les icônes par vos propres PNG, mettez des fichiers dans `public/icons/` et ajustez le manifest.

## Déployer sur Vercel (recommandé)
1. Poussez votre projet sur GitHub.
2. Allez sur https://vercel.com → "New Project" → importez le repo.
3. Réglages:
   - Framework: Vite
   - Build Command: `npm run build`
   - Output Directory: `dist`
4. "Deploy". Partagez l’URL (HTTPS par défaut).

## Déployer sur Netlify
1. Poussez votre projet sur GitHub.
2. Allez sur https://app.netlify.com → "Add new site" → "Import an existing project".
3. Réglages:
   - Build command: `npm run build`
   - Publish directory: `dist`
4. "Deploy site". Partagez l’URL (HTTPS par défaut).

## Tester la PWA
- Ouvrez l’URL déployée dans Chrome/Edge sur mobile.
- Menu → "Ajouter à l'écran d'accueil".
- Ouvrez l’app installée; la caméra (scan) fonctionne en HTTPS.

## Développement local
```powershell
npm install
npm run dev
```
- Ouvrez l’URL Vite (http://localhost:5173 par défaut).
- Note: Pour le scan caméra sur mobile, préférez le déploiement HTTPS ci-dessus.

## Option Stores (plus tard)
- Android (Google Play): Trusted Web Activity (TWA) ou Capacitor (wrapper natif).
- iOS (App Store): Capacitor recommandé (le PWA seul n’apparaît pas dans l’App Store).

## FAQ
- Le scan ne marche pas ? Utilisez Chrome ou Edge et une URL HTTPS. Si non supporté, utilisez l’entrée manuelle du code-barres.
- Icônes personnalisées ? Remplacez `public/icons/icon-192.svg` et `icon-512.svg` par vos PNG et mettez à jour `manifest.webmanifest`.
- Offline ? La shell (index, assets) est en cache; la première visite doit être en ligne.
