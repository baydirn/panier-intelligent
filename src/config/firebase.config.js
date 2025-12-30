// Firebase Configuration for Panier Intelligent
// Pour obtenir ces valeurs:
// 1. Allez sur https://console.firebase.google.com
// 2. Créez un nouveau projet "panier-intelligent"
// 3. Ajoutez une application Web
// 4. Copiez les valeurs de configuration ci-dessous

import { initializeApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider, connectAuthEmulator } from 'firebase/auth'
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore'
import { getMessaging, getToken, isSupported } from 'firebase/messaging'
import { getFunctions, connectFunctionsEmulator } from 'firebase/functions'

// Configuration Firebase (À REMPLACER PAR VOS VRAIES VALEURS)
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'VOTRE_API_KEY',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'panier-intelligent.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'panier-intelligent',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'panier-intelligent.appspot.com',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || 'VOTRE_SENDER_ID',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || 'VOTRE_APP_ID',
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || 'VOTRE_MEASUREMENT_ID'
}

// Initialiser Firebase
const app = initializeApp(firebaseConfig)

// Initialiser les services Firebase
export const auth = getAuth(app)
export const db = getFirestore(app)
export const functions = getFunctions(app, 'northamerica-northeast1') // Région Montreal

// Google Auth Provider
export const googleProvider = new GoogleAuthProvider()
googleProvider.setCustomParameters({
  prompt: 'select_account'
})

// Firebase Cloud Messaging (FCM)
let messaging = null
if (typeof window !== 'undefined') {
  isSupported().then(supported => {
    if (supported) {
      messaging = getMessaging(app)
    }
  })
}
export { messaging }

// Mode développement: Utiliser émulateurs Firebase locaux
if (import.meta.env.DEV && import.meta.env.VITE_USE_FIREBASE_EMULATORS === 'true') {
  console.log('🔧 Utilisation des émulateurs Firebase locaux')
  connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true })
  connectFirestoreEmulator(db, 'localhost', 8080)
  connectFunctionsEmulator(functions, 'localhost', 5001)
}

// Helper: Obtenir le token FCM
export async function getFCMToken() {
  if (!messaging) {
    console.warn('FCM non supporté sur ce navigateur')
    return null
  }

  try {
    const permission = await Notification.requestPermission()
    if (permission !== 'granted') {
      console.warn('Permission notifications refusée')
      return null
    }

    const token = await getToken(messaging, {
      vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY
    })

    return token
  } catch (error) {
    console.error('Erreur obtention token FCM:', error)
    return null
  }
}

export default app
